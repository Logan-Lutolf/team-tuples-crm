import 'server-only'
import { db } from '@/prisma/db'

export const RECENT_DAYS = 30
export const RECONNECT_DAYS = 90
const RECOMMENDATIONS_PER_SECTION = 5
const CONTACTS_PER_ORGANIZATION = 3

export async function loadRecommendations(organizationView: boolean) {
    // Use logged outreach and dated participation, never a record creation date.
    // Organizations with an unknown type stay in the school view until classified.
    return db.runtime().query(db.raw.sql`
        WITH settings AS (
            SELECT ${organizationView}::boolean AS organization_view,
                now() - make_interval(days => ${RECENT_DAYS}::int) AS recent_since,
                now() - make_interval(days => ${RECONNECT_DAYS}::int) AS reconnect_before
        ),
        participations AS (
            SELECT id, "organizationId", "programId",
                greatest("startDate", CASE WHEN "endDate" <= now() THEN "endDate" END) AS activity_at,
                (status = 'ONGOING' AND ("endDate" IS NULL OR "endDate" >= now())) AS ongoing
            FROM public."Participation"
            WHERE status <> 'CANCELLED' AND "startDate" <= now()
        ),
        organizations AS (
            SELECT id, name FROM public."Organization" o
            WHERE CASE WHEN (SELECT organization_view FROM settings)
                THEN o.type IN ('THEATRE', 'CULTURAL')
                ELSE o.type IS NULL OR o.type IN ('PRIMARY_SCHOOL', 'SECONDARY_SCHOOL') END
        ),
        memberships AS (
            SELECT c.id AS person_id, coalesce(c."orgId", employment."orgId") AS organization_id
            FROM public."Person" c
            LEFT JOIN LATERAL (
                SELECT "orgId" FROM public."PersonEmployment"
                WHERE "personId" = c.id AND "orgId" IS NOT NULL
                    AND "startDate" <= now() AND ("endDate" IS NULL OR "endDate" >= now())
                ORDER BY "startDate" DESC, id DESC LIMIT 1
            ) employment ON c."orgId" IS NULL
            UNION
            SELECT pc."personId", p."organizationId"
            FROM public."ParticipationContacts" pc
            JOIN participations p ON p.id = pc."participationId"
            WHERE p."organizationId" IS NOT NULL
        ),
        person_outreach AS (
            SELECT "personId", max("contactedAt") AS last_contact
            FROM public."Interaction" WHERE "personId" IS NOT NULL AND "contactedAt" <= now()
            GROUP BY "personId"
        ),
        person_events AS (
            SELECT pc."personId", max(p.activity_at) AS activity_at, bool_or(p.ongoing) AS ongoing
            FROM public."ParticipationContacts" pc JOIN participations p ON p.id = pc."participationId"
            GROUP BY pc."personId"
        ),
        people AS (
            SELECT c.id, c.name, coalesce(c.email, '') AS email, coalesce(role.type, 'OTHER')::text AS role,
                greatest(o.last_contact, CASE WHEN c."lastTrackedEmailAt" <= now()
                    THEN c."lastTrackedEmailAt" END) AS last_contact,
                e.activity_at, coalesce(e.ongoing, false) AS ongoing
            FROM public."Person" c
            LEFT JOIN public."PersonRoles" role ON role."personId" = c.id
            LEFT JOIN person_outreach o ON o."personId" = c.id
            LEFT JOIN person_events e ON e."personId" = c.id
            WHERE EXISTS (SELECT 1 FROM memberships m JOIN organizations org ON org.id = m.organization_id WHERE m.person_id = c.id)
                OR (NOT (SELECT organization_view FROM settings) AND c."orgId" IS NULL)
        ),
        organization_outreach AS (
            SELECT i."organizationId" AS id,
                i."contactedAt" AS contacted_at
            FROM public."Interaction" i
            WHERE i."contactedAt" <= now()
            UNION ALL
            -- Contact-only outreach also counts for the contact's current organization.
            SELECT m.organization_id, p.last_contact
            FROM memberships m JOIN people p ON p.id = m.person_id
            WHERE p.last_contact IS NOT NULL
        ),
        organization_contacts AS (
            SELECT id, max(contacted_at) AS last_contact FROM organization_outreach GROUP BY id
        ),
        organization_events AS (
            SELECT p."organizationId" AS id,
                max(p.activity_at) AS activity_at, bool_or(p.ongoing) AS ongoing
            FROM participations p
            GROUP BY 1
        ),
        candidates AS (
            SELECT 'organization' AS kind, o.id, o.name, '' AS email, '' AS role, '' AS organization,
                c.last_contact, e.activity_at, coalesce(e.ongoing, false) AS ongoing
            FROM organizations o
            LEFT JOIN organization_contacts c ON c.id = o.id
            LEFT JOIN organization_events e ON e.id = o.id
            UNION ALL
            SELECT 'person', p.id, p.name, p.email, p.role, coalesce(affiliations.names, ''),
                p.last_contact, p.activity_at, p.ongoing
            FROM people p
            LEFT JOIN LATERAL (
                SELECT string_agg(o.name, ', ' ORDER BY o.name, o.id) AS names
                FROM memberships m JOIN organizations o ON o.id = m.organization_id WHERE m.person_id = p.id
            ) affiliations ON true
            -- For theatre and similar groups, suggest staff or adult contacts over students.
            WHERE NOT (SELECT organization_view FROM settings) OR p.role <> 'STUDENT'
        ),
        ranked AS (
            SELECT c.*, recommendation.reason, recommendation.is_reconnect, recommendation.event_at,
                row_number() OVER (
                    PARTITION BY c.kind, recommendation.is_reconnect
                    ORDER BY
                        CASE WHEN recommendation.is_reconnect THEN recommendation.event_at END ASC NULLS LAST,
                        CASE WHEN NOT recommendation.is_reconnect THEN recommendation.event_at END DESC NULLS LAST,
                        c.name, c.id
                ) AS position
            FROM candidates c CROSS JOIN settings s
            CROSS JOIN LATERAL (
                SELECT false AS is_reconnect,
                    CASE WHEN c.last_contact >= s.recent_since AND c.last_contact >= coalesce(c.activity_at, c.last_contact)
                        THEN 'Recent contact'
                        WHEN c.activity_at >= s.recent_since THEN 'Recent participation'
                        ELSE 'Ongoing participation' END AS reason,
                    CASE WHEN greatest(c.last_contact, c.activity_at) >= s.recent_since
                        THEN greatest(c.last_contact, c.activity_at) END AS event_at
                WHERE greatest(c.last_contact, c.activity_at) >= s.recent_since OR c.ongoing
                UNION ALL
                SELECT true, 'Last contacted', c.last_contact
                WHERE c.last_contact <= s.reconnect_before AND (c.kind = 'organization' OR c.organization <> '')
            ) recommendation
        )
        SELECT r.kind, r.id, r.name, r.email, r.role, r.organization, r.reason, r.is_reconnect AS "isReconnect",
            coalesce(to_char(r.event_at AT TIME ZONE 'Europe/Prague', 'YYYY-MM-DD'), '') AS date,
            coalesce(suggestions.contacts, '[]'::jsonb)::text AS contacts
        FROM ranked r
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(jsonb_build_object('id', candidate.id, 'name', candidate.name, 'role', candidate.role, 'email', candidate.email)
                ORDER BY candidate.priority, candidate.activity DESC NULLS LAST, candidate.name, candidate.id) AS contacts
            FROM (
                SELECT p.id, p.name, p.email, p.role, greatest(p.last_contact, p.activity_at) AS activity,
                    CASE WHEN p.role IN ('TEACHER', 'SCHOOL_COORDINATOR', 'PRINCIPAL') THEN 0 ELSE 1 END AS priority
                FROM memberships m JOIN people p ON p.id = m.person_id
                WHERE r.kind = 'organization' AND m.organization_id = r.id AND p.role <> 'STUDENT'
                ORDER BY priority, activity DESC NULLS LAST, p.name, p.id LIMIT ${CONTACTS_PER_ORGANIZATION}::int
            ) candidate
        ) suggestions ON true
        WHERE r.position <= ${RECOMMENDATIONS_PER_SECTION}::int
        ORDER BY r.position
    `.returnsRow({
        kind: { codecId: 'pg/text@1' },
        id: { codecId: 'pg/int4@1' },
        name: { codecId: 'pg/text@1' },
        email: { codecId: 'pg/text@1' },
        role: { codecId: 'pg/text@1' },
        organization: { codecId: 'pg/text@1' },
        reason: { codecId: 'pg/text@1' },
        isReconnect: { codecId: 'pg/bool@1' },
        date: { codecId: 'pg/text@1' },
        contacts: { codecId: 'pg/text@1' },
    }).build())
}
