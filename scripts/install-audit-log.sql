BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE SCHEMA IF NOT EXISTS crm_audit;

CREATE TABLE IF NOT EXISTS crm_audit.record_edit (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    record_type text NOT NULL,
    record_id text NOT NULL,
    record_name text,
    operation text NOT NULL,
    field text NOT NULL,
    before_value jsonb,
    after_value jsonb,
    edited_at timestamptz NOT NULL DEFAULT statement_timestamp(),
    editor_id integer,
    editor_name text NOT NULL
);

CREATE INDEX IF NOT EXISTS record_edit_lookup
    ON crm_audit.record_edit (record_type, record_id, id DESC);

CREATE OR REPLACE FUNCTION crm_audit.record_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
    old_values jsonb := coalesce(to_jsonb(OLD), '{}'::jsonb);
    new_values jsonb := coalesce(to_jsonb(NEW), '{}'::jsonb);
    record_row jsonb := CASE WHEN TG_OP = 'DELETE' THEN old_values ELSE new_values END;
    record_type text := TG_ARGV[0];
    record_id text := record_row ->> TG_ARGV[1];
    record_name text := record_row ->> 'name';
    editor_id integer := nullif(current_setting('crm.editor_id', true), '')::integer;
    editor_name text;
    relationship_field text := TG_ARGV[2];
    password_changed boolean := TG_TABLE_NAME = 'Employee' AND TG_OP = 'UPDATE'
        AND (old_values -> 'password') IS DISTINCT FROM (new_values -> 'password');
BEGIN
    IF TG_TABLE_NAME = 'Person' AND NOT EXISTS (
        SELECT 1 FROM public."Employee" WHERE "personId" = record_id::integer
    ) THEN
        RETURN NULL;
    END IF;

    IF record_type = 'Employee' AND record_name IS NULL THEN
        SELECT name INTO record_name FROM public."Person" WHERE id = record_id::integer;
    END IF;

    SELECT name INTO editor_name FROM public."Person" WHERE id = editor_id;
    editor_name := coalesce(editor_name, CASE WHEN editor_id IS NULL
        THEN 'Database user ' || session_user ELSE 'Employee #' || editor_id END);

    -- Passwords and automatically maintained timestamps must never enter the history.
    old_values := old_values - ARRAY['password', 'createdAt', 'updatedAt'];
    new_values := new_values - ARRAY['password', 'createdAt', 'updatedAt'];

    IF password_changed THEN
        INSERT INTO crm_audit.record_edit
            (record_type, record_id, record_name, operation, field, before_value, after_value, editor_id, editor_name)
        VALUES (record_type, record_id, record_name, TG_OP, 'Password',
            to_jsonb('[redacted]'::text), to_jsonb('[redacted]'::text), editor_id, editor_name);
    END IF;

    IF relationship_field IS NOT NULL THEN
        -- A link row represents one member of the parent record's relationship.
        old_values := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb
            ELSE jsonb_build_object(relationship_field, old_values - TG_ARGV[1]) END;
        new_values := CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb
            ELSE jsonb_build_object(relationship_field, new_values - TG_ARGV[1]) END;
    END IF;

    INSERT INTO crm_audit.record_edit
        (record_type, record_id, record_name, operation, field, before_value, after_value, editor_id, editor_name)
    SELECT record_type, record_id, record_name, TG_OP, fields.key,
        old_values -> fields.key, new_values -> fields.key, editor_id, editor_name
    FROM jsonb_object_keys(old_values || new_values) AS fields(key)
    WHERE (old_values -> fields.key) IS DISTINCT FROM (new_values -> fields.key);
    RETURN NULL;
END;
$$;

DO $$
DECLARE
    target record;
BEGIN
    FOR target IN SELECT * FROM (VALUES
        ('Participation', 'Program instance', 'id', NULL),
        ('Program', 'Program', 'id', NULL),
        ('Branch', 'Branch', 'id', NULL),
        ('Municipality', 'Municipality', 'id', NULL),
        ('Organization', 'Organization', 'id', NULL),
        ('Employee', 'Employee', 'personId', NULL),
        ('Person', 'Employee', 'id', NULL),
        ('ParticipationContacts', 'Program instance', 'participationId', 'Linked contact'),
        ('ParticipationEmployees', 'Program instance', 'participationId', 'Assigned employee'),
        ('EmployeeAssignment', 'Employee', 'employeeId', 'Assignment'),
        ('MunicipalityPrograms', 'Municipality', 'municipalityId', 'Linked program')
    ) AS targets(table_name, record_type, id_field, relationship_field)
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS crm_record_edit ON public.%I', target.table_name);
        IF target.relationship_field IS NULL THEN
            EXECUTE format('CREATE TRIGGER crm_record_edit AFTER INSERT OR UPDATE OR DELETE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION crm_audit.record_change(%L, %L)',
                target.table_name, target.record_type, target.id_field);
        ELSE
            EXECUTE format('CREATE TRIGGER crm_record_edit AFTER INSERT OR UPDATE OR DELETE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION crm_audit.record_change(%L, %L, %L)',
                target.table_name, target.record_type, target.id_field, target.relationship_field);
        END IF;
    END LOOP;
END;
$$;

COMMIT;
