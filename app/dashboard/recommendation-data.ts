import 'server-only'
import { db } from '@/prisma/db'

export const RECENT_DAYS = 30
export const RECONNECT_DAYS = 90
const RECOMMENDATIONS_PER_SECTION = 5
const CONTACTS_PER_ORGANIZATION = 3

export async function loadRecommendations(organizationView: boolean) {
    // The live contract has no Organization table. School-free program participations
    // represent non-school groups, including Divadlo Paměti národa.
    // Outreach and participation are separate signals. Contact.last_contacted has a
    // creation-time default, so only logged interactions and verified email count.
    return db.runtime().query(db.raw.sql`
        WITH settings AS (
            SELECT ${organizationView}::boolean AS organization_view,
                now() - make_interval(days => ${RECENT_DAYS}::int) AS recent_since,
                now() - make_interval(days => ${RECONNECT_DAYS}::int) AS reconnect_before
        ),
        participations AS (
            SELECT id, "schoolId", "programId",
                greatest("startDate", CASE WHEN "endDate" <= now() THEN "endDate" END) AS activity_at,
                (status = 'ONGOING' AND ("endDate" IS NULL OR "endDate" >= now())) AS ongoing
            FROM public."Participation"
            WHERE status <> 'CANCELLED' AND "startDate" <= now()
        ),
        organizations AS (
            SELECT id, name FROM public."School" WHERE NOT (SELECT organization_view FROM settings)
            UNION ALL
            SELECT id, name FROM public."Program" p WHERE (SELECT organization_view FROM settings)
                AND EXISTS (SELECT 1 FROM public."Participation" e
                    WHERE e."programId" = p.id AND e."schoolId" IS NULL AND e.status <> 'CANCELLED')
        ),
        memberships AS (
            SELECT c.id AS person_id, coalesce(c."schoolId", employment."schoolId") AS organization_id
            FROM public."Contact" c
            LEFT JOIN LATERAL (
                SELECT "schoolId" FROM public."ContactEmployment"
                WHERE "contactId" = c.id AND "schoolId" IS NOT NULL
                    AND "startDate" <= now() AND ("endDate" IS NULL OR "endDate" >= now())
                ORDER BY "startDate" DESC, id DESC LIMIT 1
            ) employment ON c."schoolId" IS NULL
            WHERE NOT (SELECT organization_view FROM settings)
            UNION
            SELECT pc."contactId", p."programId"
            FROM public."ParticipationContacts" pc
            JOIN participations p ON p.id = pc."participationId"
            WHERE (SELECT organization_view FROM settings)
                AND p."schoolId" IS NULL AND p."programId" IS NOT NULL
        ),
        person_outreach AS (
            SELECT "contactId", max("contactedAt") AS last_contact
            FROM public."Interaction" WHERE "contactId" IS NOT NULL AND "contactedAt" <= now()
            GROUP BY "contactId"
        ),
        person_events AS (
            SELECT pc."contactId", max(p.activity_at) AS activity_at, bool_or(p.ongoing) AS ongoing
            FROM public."ParticipationContacts" pc JOIN participations p ON p.id = pc."participationId"
            WHERE NOT (SELECT organization_view FROM settings) OR p."schoolId" IS NULL
            GROUP BY pc."contactId"
        ),
        people AS (
            SELECT c.id, c.name, coalesce(c.email, '') AS email, c."contactRole"::text AS role,
                greatest(o.last_contact, CASE WHEN c."lastTrackedEmailAt" <= now()
                    THEN c."lastTrackedEmailAt" END) AS last_contact,
                e.activity_at, coalesce(e.ongoing, false) AS ongoing
            FROM public."Contact" c
            LEFT JOIN person_outreach o ON o."contactId" = c.id
            LEFT JOIN person_events e ON e."contactId" = c.id
            WHERE NOT (SELECT organization_view FROM settings) OR (
                EXISTS (SELECT 1 FROM memberships WHERE person_id = c.id)
            )
        ),
        organization_outreach AS (
            SELECT CASE WHEN s.organization_view THEN i."programId" ELSE i."schoolId" END AS id,
                i."contactedAt" AS contacted_at
            FROM public."Interaction" i CROSS JOIN settings s
            WHERE i."contactedAt" <= now() AND (NOT s.organization_view OR i."schoolId" IS NULL)
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
            SELECT CASE WHEN s.organization_view THEN p."programId" ELSE p."schoolId" END AS id,
                max(p.activity_at) AS activity_at, bool_or(p.ongoing) AS ongoing
            FROM participations p CROSS JOIN settings s
            WHERE NOT s.organization_view OR p."schoolId" IS NULL
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
