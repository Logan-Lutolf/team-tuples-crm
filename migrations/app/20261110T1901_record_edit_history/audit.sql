-- Capture changes atomically, including relationship updates and FK delete actions.
CREATE FUNCTION public.crm_capture_edit_history() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
  previous jsonb;
  next_row jsonb;
  row_data jsonb;
  targets jsonb := '[]'::jsonb;
  target jsonb;
  parent record;
  own_type text;
BEGIN
  IF TG_OP <> 'INSERT' THEN previous := to_jsonb(OLD) - 'updatedAt'; END IF;
  IF TG_OP <> 'DELETE' THEN next_row := to_jsonb(NEW) - 'updatedAt'; END IF;
  -- Never persist credentials, session data, or large profile images in an audit snapshot.
  IF TG_TABLE_NAME = 'Employee' THEN
    previous := previous - ARRAY['password', 'pfpImgUrl', 'is_online', 'createdAt'];
    next_row := next_row - ARRAY['password', 'pfpImgUrl', 'is_online', 'createdAt'];
  END IF;
  IF previous IS NOT DISTINCT FROM next_row THEN RETURN NULL; END IF;
  own_type := CASE TG_TABLE_NAME
    WHEN 'School' THEN 'schools' WHEN 'Contact' THEN 'contacts'
    WHEN 'Branch' THEN 'branches' WHEN 'Program' THEN 'programs'
    WHEN 'Municipality' THEN 'municipalities' ELSE NULL END;

  -- Include both sides of a moved relationship, not just its new parent.
  FOR row_data IN SELECT value FROM jsonb_array_elements(jsonb_build_array(previous, next_row))
  LOOP
    IF row_data IS NULL OR row_data = 'null'::jsonb THEN CONTINUE; END IF;
    IF own_type IS NOT NULL THEN
      targets := targets || jsonb_build_array(jsonb_build_object('type', own_type, 'id', row_data->'id'));
    END IF;
    IF TG_TABLE_NAME IN ('School', 'Contact', 'EmployeeAssignment') THEN
      targets := targets || jsonb_build_array(jsonb_build_object('type', 'branches', 'id', row_data->'branchId'));
    END IF;
    IF TG_TABLE_NAME IN ('Contact', 'Participation', 'Interaction', 'ContactEmployment') THEN
      targets := targets || jsonb_build_array(jsonb_build_object('type', 'schools', 'id', row_data->'schoolId'));
    END IF;
    IF TG_TABLE_NAME IN ('Interaction', 'ContactEmployment', 'ParticipationContacts') THEN
      targets := targets || jsonb_build_array(jsonb_build_object('type', 'contacts', 'id', row_data->'contactId'));
    END IF;
    IF TG_TABLE_NAME IN ('Participation', 'Interaction', 'EmployeeAssignment', 'MunicipalityPrograms') THEN
      targets := targets || jsonb_build_array(jsonb_build_object('type', 'programs', 'id', row_data->'programId'));
    END IF;
    IF TG_TABLE_NAME = 'MunicipalityPrograms' THEN
      targets := targets || jsonb_build_array(jsonb_build_object('type', 'municipalities', 'id', row_data->'municipalityId'));
    END IF;
    IF TG_TABLE_NAME IN ('ParticipationEmployees', 'ParticipationContacts') THEN
      FOR parent IN SELECT "schoolId", "programId" FROM public."Participation" WHERE id = (row_data->>'participationId')::int
      LOOP
        targets := targets || jsonb_build_array(
          jsonb_build_object('type', 'schools', 'id', parent."schoolId"),
          jsonb_build_object('type', 'programs', 'id', parent."programId"));
      END LOOP;
    END IF;
    IF TG_TABLE_NAME = 'Employee' THEN
      FOR parent IN
        SELECT "branchId", "programId" FROM public."EmployeeAssignment" WHERE "employeeId" = (row_data->>'id')::int
        UNION SELECT id, NULL::int FROM public."Branch" WHERE "chiefId" = (row_data->>'id')::int
        UNION SELECT NULL::int, p."programId" FROM public."ParticipationEmployees" pe
          JOIN public."Participation" p ON p.id = pe."participationId" WHERE pe."employeeId" = (row_data->>'id')::int
      LOOP
        targets := targets || jsonb_build_array(
          jsonb_build_object('type', 'branches', 'id', parent."branchId"),
          jsonb_build_object('type', 'programs', 'id', parent."programId"));
      END LOOP;
      FOR parent IN SELECT p."schoolId" FROM public."ParticipationEmployees" pe
        JOIN public."Participation" p ON p.id = pe."participationId" WHERE pe."employeeId" = (row_data->>'id')::int
      LOOP
        targets := targets || jsonb_build_array(jsonb_build_object('type', 'schools', 'id', parent."schoolId"));
      END LOOP;
    END IF;
  END LOOP;

  FOR target IN SELECT DISTINCT value FROM jsonb_array_elements(targets)
    WHERE value->>'id' IS NOT NULL AND (value->>'id')::int > 0
  LOOP
    INSERT INTO public."EditHistory" ("recordType", "recordId", "sourceTable", operation,
      "beforeData", "afterData", "actorId", "actorName")
    VALUES (target->>'type', (target->>'id')::int, TG_TABLE_NAME, TG_OP,
      previous::text, next_row::text,
      NULLIF(current_setting('crm.actor_id', true), '')::int,
      COALESCE(NULLIF(current_setting('crm.actor_name', true), ''), 'System / database change'));
  END LOOP;
  RETURN NULL;
END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['School', 'Contact', 'Branch', 'Program', 'Municipality',
    'Participation', 'ParticipationEmployees', 'ParticipationContacts', 'EmployeeAssignment',
    'Interaction', 'ContactEmployment', 'MunicipalityPrograms', 'Employee']
  LOOP
    EXECUTE format('CREATE TRIGGER crm_edit_history AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.crm_capture_edit_history()', table_name);
  END LOOP;
END;
$$;
