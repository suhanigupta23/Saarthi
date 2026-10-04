-- Saarthi production schema migration: legacy appointments -> final entity model
--
-- This is a manually executed, versioned migration. The project does not currently
-- use Flyway or Liquibase, so Hibernate will NOT run this file automatically.
--
-- Safety properties:
--   * runs in one transaction;
--   * never deletes users, appointments, cycle logs, or vitals;
--   * locks the affected tables against concurrent writes;
--   * preserves legacy appointments.date by copying it to appointment_date;
--   * preserves existing status and fee values;
--   * aborts on null required data, duplicates, or orphaned user references;
--   * verifies that row counts did not change;
--   * can be rerun safely after a successful run.
--
-- Before running:
--   1. Take a Render PostgreSQL backup/snapshot.
--   2. Suspend the backend (or otherwise stop writes).
--   3. Connect to the production database with psql.
--   4. Execute this complete file with ON_ERROR_STOP enabled.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PREFLIGHT: require the legacy core tables and columns that hold user data.
-- -----------------------------------------------------------------------------

DO $preflight_tables$
DECLARE
    required_table TEXT;
BEGIN
    FOREACH required_table IN ARRAY ARRAY[
        'users',
        'appointments',
        'cycle_logs',
        'vitals_logs'
    ]
    LOOP
        IF to_regclass('public.' || required_table) IS NULL THEN
            RAISE EXCEPTION
                'Migration stopped: required table public.% does not exist',
                required_table;
        END IF;
    END LOOP;
END
$preflight_tables$;

DO $preflight_columns$
DECLARE
    required_column RECORD;
BEGIN
    FOR required_column IN
        SELECT *
        FROM (VALUES
            ('users', 'id'),
            ('users', 'username'),
            ('users', 'password'),
            ('users', 'name'),
            ('users', 'age'),
            ('users', 'location'),
            ('users', 'pregnancy_status'),

            ('appointments', 'id'),
            ('appointments', 'user_id'),
            ('appointments', 'appointment_ref'),
            ('appointments', 'doctor_name'),
            ('appointments', 'specialty'),
            ('appointments', 'clinic_name'),
            ('appointments', 'time_slot'),
            ('appointments', 'mode'),
            ('appointments', 'status'),
            ('appointments', 'fee'),
            ('appointments', 'created_at'),

            ('cycle_logs', 'id'),
            ('cycle_logs', 'user_id'),
            ('cycle_logs', 'start_date'),
            ('cycle_logs', 'mood'),
            ('cycle_logs', 'flow'),
            ('cycle_logs', 'symptoms'),

            ('vitals_logs', 'id'),
            ('vitals_logs', 'user_id'),
            ('vitals_logs', 'recorded_at'),
            ('vitals_logs', 'systolic'),
            ('vitals_logs', 'diastolic'),
            ('vitals_logs', 'blood_sugar'),
            ('vitals_logs', 'weight'),
            ('vitals_logs', 'height'),
            ('vitals_logs', 'bmi'),
            ('vitals_logs', 'category'),
            ('vitals_logs', 'month_label')
        ) AS expected(table_name, column_name)
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = required_column.table_name
              AND c.column_name = required_column.column_name
        ) THEN
            RAISE EXCEPTION
                'Migration stopped: required legacy column public.%.% does not exist',
                required_column.table_name,
                required_column.column_name;
        END IF;
    END LOOP;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'appointments'
          AND c.column_name IN ('date', 'appointment_date')
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: appointments has neither legacy date nor final appointment_date';
    END IF;
END
$preflight_columns$;

-- Stop inserts/updates/deletes while checks and constraints are established.
-- Reads may continue. For the shortest lock duration, keep the backend suspended.
LOCK TABLE public.users, public.appointments, public.cycle_logs, public.vitals_logs
    IN SHARE ROW EXCLUSIVE MODE;

-- Preserve row counts so the migration can prove it did not remove core records.
CREATE TEMPORARY TABLE saarthi_migration_row_counts (
    table_name TEXT PRIMARY KEY,
    row_count BIGINT NOT NULL
) ON COMMIT DROP;

INSERT INTO saarthi_migration_row_counts (table_name, row_count)
VALUES
    ('users',       (SELECT COUNT(*) FROM public.users)),
    ('appointments',(SELECT COUNT(*) FROM public.appointments)),
    ('cycle_logs',  (SELECT COUNT(*) FROM public.cycle_logs)),
    ('vitals_logs', (SELECT COUNT(*) FROM public.vitals_logs));

-- -----------------------------------------------------------------------------
-- 2. ADD FINAL APPOINTMENT/PAYMENT COLUMNS WITHOUT CONSTRAINTS FIRST.
-- -----------------------------------------------------------------------------

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS appointment_date VARCHAR(255),
    ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITHOUT TIME ZONE;

-- Preserve the old date value. The final Java field remains a String, so the
-- final database column is VARCHAR(255), not PostgreSQL DATE.
DO $copy_legacy_date$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'appointments'
          AND c.column_name = 'date'
    ) THEN
        UPDATE public.appointments
        SET appointment_date = "date"::TEXT
        WHERE appointment_date IS NULL;
    END IF;
END
$copy_legacy_date$;

-- Historical rows predate stable OSM provider identity. A per-appointment
-- synthetic identity preserves the record without falsely assigning an OSM POI.
UPDATE public.appointments
SET provider_id = 'legacy/appointment/' || id::TEXT
WHERE provider_id IS NULL
   OR btrim(provider_id) = '';

-- Durable Stripe webhook consumer idempotency.
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    event_id VARCHAR(255),
    processed_at TIMESTAMP WITHOUT TIME ZONE
);

ALTER TABLE public.processed_stripe_events
    ADD COLUMN IF NOT EXISTS event_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITHOUT TIME ZONE;

-- -----------------------------------------------------------------------------
-- 3. DATA VALIDATION: abort instead of fabricating unsafe business data.
-- -----------------------------------------------------------------------------

DO $validate_data$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE username IS NULL OR btrim(username) = '' OR password IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: users contain missing username/password data';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE appointment_ref IS NULL OR btrim(appointment_ref) = ''
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: appointments contain missing appointment references';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE appointment_date IS NULL OR btrim(appointment_date) = ''
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: appointments contain missing appointment dates';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE provider_id IS NULL OR btrim(provider_id) = ''
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: appointments contain missing provider IDs';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE time_slot IS NULL OR btrim(time_slot) = ''
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: appointments contain missing time slots';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE user_id IS NULL OR created_at IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: appointments contain missing owner/created_at data';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.cycle_logs
        WHERE user_id IS NULL OR start_date IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: cycle logs contain missing owner/start_date data';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.vitals_logs
        WHERE user_id IS NULL OR recorded_at IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: vitals logs contain missing owner/recorded_at data';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.users
        GROUP BY username
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: duplicate usernames exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.appointments
        GROUP BY appointment_ref
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: duplicate appointment references exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.appointments
        WHERE stripe_checkout_session_id IS NOT NULL
        GROUP BY stripe_checkout_session_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: duplicate Stripe Checkout Session IDs exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.appointments
        GROUP BY provider_id, appointment_date, time_slot
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: duplicate provider/date/time slots exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.appointments a
        LEFT JOIN public.users u ON u.id = a.user_id
        WHERE u.id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: orphaned appointment user IDs exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.cycle_logs c
        LEFT JOIN public.users u ON u.id = c.user_id
        WHERE u.id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: orphaned cycle-log user IDs exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.vitals_logs v
        LEFT JOIN public.users u ON u.id = v.user_id
        WHERE u.id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: orphaned vitals user IDs exist';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.processed_stripe_events
        WHERE event_id IS NULL OR btrim(event_id) = '' OR processed_at IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: processed Stripe events contain invalid required data';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.processed_stripe_events
        GROUP BY event_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: duplicate processed Stripe event IDs exist';
    END IF;
END
$validate_data$;

-- -----------------------------------------------------------------------------
-- 4. MATCH FINAL JPA NULLABILITY.
-- -----------------------------------------------------------------------------

ALTER TABLE public.users
    ALTER COLUMN username SET NOT NULL,
    ALTER COLUMN password SET NOT NULL;

ALTER TABLE public.appointments
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN appointment_ref SET NOT NULL,
    ALTER COLUMN provider_id SET NOT NULL,
    ALTER COLUMN appointment_date SET NOT NULL,
    ALTER COLUMN time_slot SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.cycle_logs
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE public.vitals_logs
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN recorded_at SET NOT NULL;

ALTER TABLE public.processed_stripe_events
    ALTER COLUMN event_id SET NOT NULL,
    ALTER COLUMN processed_at SET NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. UNIQUE CONSTRAINTS AND PRIMARY KEY.
-- -----------------------------------------------------------------------------

DO $users_username_unique$
DECLARE
    username_attnum SMALLINT;
BEGIN
    SELECT attnum INTO username_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'username' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND contype IN ('u', 'p')
          AND conkey = ARRAY[username_attnum]
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT uk_users_username UNIQUE (username);
    END IF;
END
$users_username_unique$;

DO $appointment_ref_unique$
DECLARE
    appointment_ref_attnum SMALLINT;
BEGIN
    SELECT attnum INTO appointment_ref_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'appointment_ref' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass
          AND contype IN ('u', 'p')
          AND conkey = ARRAY[appointment_ref_attnum]
    ) THEN
        ALTER TABLE public.appointments
            ADD CONSTRAINT uk_appointments_appointment_ref
            UNIQUE (appointment_ref);
    END IF;
END
$appointment_ref_unique$;

DO $stripe_session_unique$
DECLARE
    stripe_session_attnum SMALLINT;
BEGIN
    SELECT attnum INTO stripe_session_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'stripe_checkout_session_id' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass
          AND contype IN ('u', 'p')
          AND conkey = ARRAY[stripe_session_attnum]
    ) THEN
        ALTER TABLE public.appointments
            ADD CONSTRAINT uk_appointments_stripe_checkout_session
            UNIQUE (stripe_checkout_session_id);
    END IF;
END
$stripe_session_unique$;

-- Keep this exact name: AppointmentService uses it to recognize a slot race and
-- return the intended 409 Conflict response.
DO $appointment_slot_unique$
DECLARE
    provider_attnum SMALLINT;
    appointment_date_attnum SMALLINT;
    time_slot_attnum SMALLINT;
    equivalent_constraint_name TEXT;
BEGIN
    SELECT attnum INTO provider_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'provider_id' AND NOT attisdropped;

    SELECT attnum INTO appointment_date_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'appointment_date' AND NOT attisdropped;

    SELECT attnum INTO time_slot_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'time_slot' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass
          AND conname = 'uk_appointment_provider_date_time'
    ) THEN
        SELECT conname INTO equivalent_constraint_name
        FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass
          AND contype = 'u'
          AND conkey = ARRAY[provider_attnum, appointment_date_attnum, time_slot_attnum]
        LIMIT 1;

        IF equivalent_constraint_name IS NOT NULL THEN
            EXECUTE format(
                'ALTER TABLE public.appointments RENAME CONSTRAINT %I TO uk_appointment_provider_date_time',
                equivalent_constraint_name
            );
        ELSE
            ALTER TABLE public.appointments
                ADD CONSTRAINT uk_appointment_provider_date_time
                UNIQUE (provider_id, appointment_date, time_slot);
        END IF;
    END IF;
END
$appointment_slot_unique$;

DO $processed_event_primary_key$
DECLARE
    event_id_attnum SMALLINT;
BEGIN
    SELECT attnum INTO event_id_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.processed_stripe_events'::regclass
      AND attname = 'event_id'
      AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.processed_stripe_events'::regclass
          AND contype = 'p'
    ) THEN
        ALTER TABLE public.processed_stripe_events
            ADD CONSTRAINT pk_processed_stripe_events PRIMARY KEY (event_id);
    ELSIF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.processed_stripe_events'::regclass
          AND contype = 'p'
          AND conkey = ARRAY[event_id_attnum]
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: processed_stripe_events has a primary key other than event_id';
    END IF;
END
$processed_event_primary_key$;

-- -----------------------------------------------------------------------------
-- 6. OWNERSHIP FOREIGN KEYS, ADDED ONLY IF AN EQUIVALENT FK IS ABSENT.
-- -----------------------------------------------------------------------------

DO $appointment_user_fk$
DECLARE
    child_attnum SMALLINT;
    parent_attnum SMALLINT;
BEGIN
    SELECT attnum INTO child_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'user_id' AND NOT attisdropped;

    SELECT attnum INTO parent_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'id' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass
          AND confrelid = 'public.users'::regclass
          AND contype = 'f'
          AND conkey = ARRAY[child_attnum]
          AND confkey = ARRAY[parent_attnum]
    ) THEN
        ALTER TABLE public.appointments
            ADD CONSTRAINT fk_appointments_user
            FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END
$appointment_user_fk$;

DO $cycle_user_fk$
DECLARE
    child_attnum SMALLINT;
    parent_attnum SMALLINT;
BEGIN
    SELECT attnum INTO child_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.cycle_logs'::regclass
      AND attname = 'user_id' AND NOT attisdropped;

    SELECT attnum INTO parent_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'id' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.cycle_logs'::regclass
          AND confrelid = 'public.users'::regclass
          AND contype = 'f'
          AND conkey = ARRAY[child_attnum]
          AND confkey = ARRAY[parent_attnum]
    ) THEN
        ALTER TABLE public.cycle_logs
            ADD CONSTRAINT fk_cycle_logs_user
            FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END
$cycle_user_fk$;

DO $vitals_user_fk$
DECLARE
    child_attnum SMALLINT;
    parent_attnum SMALLINT;
BEGIN
    SELECT attnum INTO child_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.vitals_logs'::regclass
      AND attname = 'user_id' AND NOT attisdropped;

    SELECT attnum INTO parent_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
      AND attname = 'id' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.vitals_logs'::regclass
          AND confrelid = 'public.users'::regclass
          AND contype = 'f'
          AND conkey = ARRAY[child_attnum]
          AND confkey = ARRAY[parent_attnum]
    ) THEN
        ALTER TABLE public.vitals_logs
            ADD CONSTRAINT fk_vitals_logs_user
            FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
END
$vitals_user_fk$;

-- -----------------------------------------------------------------------------
-- 7. QUERY-SUPPORTING INDEXES. Unique constraints create their own indexes.
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_appointments_user_created_at
    ON public.appointments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_cycle_logs_user_start_date
    ON public.cycle_logs (user_id, start_date DESC);

CREATE INDEX IF NOT EXISTS ix_vitals_logs_user_recorded_at
    ON public.vitals_logs (user_id, recorded_at);

-- -----------------------------------------------------------------------------
-- 8. POSTFLIGHT ASSERTIONS BEFORE COMMIT.
-- -----------------------------------------------------------------------------

DO $postflight$
DECLARE
    expected_column RECORD;
    expected_primary_key RECORD;
    event_id_attnum SMALLINT;
    appointment_ref_attnum SMALLINT;
    stripe_session_attnum SMALLINT;
    primary_key_attnum SMALLINT;
    primary_key_table REGCLASS;
BEGIN
    FOR expected_column IN
        SELECT *
        FROM (VALUES
            ('appointments', 'appointment_date', 'NO', 'character varying'),
            ('appointments', 'provider_id', 'NO', 'character varying'),
            ('appointments', 'appointment_ref', 'NO', 'character varying'),
            ('appointments', 'time_slot', 'NO', 'character varying'),
            ('appointments', 'user_id', 'NO', 'bigint'),
            ('appointments', 'created_at', 'NO', 'timestamp without time zone'),
            ('appointments', 'stripe_checkout_session_id', 'YES', 'character varying'),
            ('appointments', 'confirmed_at', 'YES', 'timestamp without time zone'),
            ('processed_stripe_events', 'event_id', 'NO', 'character varying'),
            ('processed_stripe_events', 'processed_at', 'NO', 'timestamp without time zone')
        ) AS expected(table_name, column_name, is_nullable, data_type)
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = expected_column.table_name
              AND c.column_name = expected_column.column_name
              AND c.is_nullable = expected_column.is_nullable
              AND c.data_type = expected_column.data_type
        ) THEN
            RAISE EXCEPTION
                'Migration stopped: final type/nullability mismatch for public.%.%',
                expected_column.table_name,
                expected_column.column_name;
        END IF;
    END LOOP;

    FOR expected_primary_key IN
        SELECT *
        FROM (VALUES
            ('users', 'id'),
            ('appointments', 'id'),
            ('cycle_logs', 'id'),
            ('vitals_logs', 'id')
        ) AS expected(table_name, column_name)
    LOOP
        primary_key_table := to_regclass('public.' || expected_primary_key.table_name);

        SELECT attnum INTO primary_key_attnum
        FROM pg_attribute
        WHERE attrelid = primary_key_table
          AND attname = expected_primary_key.column_name
          AND NOT attisdropped;

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = primary_key_table
              AND contype = 'p'
              AND conkey = ARRAY[primary_key_attnum]
        ) THEN
            RAISE EXCEPTION
                'Migration stopped: public.%.% is not the expected primary key',
                expected_primary_key.table_name,
                expected_primary_key.column_name;
        END IF;
    END LOOP;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass
          AND conname = 'uk_appointment_provider_date_time'
          AND contype = 'u'
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: exact appointment slot constraint is missing';
    END IF;

    SELECT attnum INTO appointment_ref_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'appointment_ref' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass
          AND contype IN ('u', 'p')
          AND conkey = ARRAY[appointment_ref_attnum]
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: appointment_ref is not unique';
    END IF;

    SELECT attnum INTO stripe_session_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.appointments'::regclass
      AND attname = 'stripe_checkout_session_id' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.appointments'::regclass
          AND contype IN ('u', 'p')
          AND conkey = ARRAY[stripe_session_attnum]
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: stripe_checkout_session_id is not unique';
    END IF;

    SELECT attnum INTO event_id_attnum
    FROM pg_attribute
    WHERE attrelid = 'public.processed_stripe_events'::regclass
      AND attname = 'event_id' AND NOT attisdropped;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.processed_stripe_events'::regclass
          AND contype = 'p'
          AND conkey = ARRAY[event_id_attnum]
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: event_id is not the processed-event primary key';
    END IF;

    IF (SELECT row_count FROM saarthi_migration_row_counts WHERE table_name = 'users')
            <> (SELECT COUNT(*) FROM public.users)
       OR (SELECT row_count FROM saarthi_migration_row_counts WHERE table_name = 'appointments')
            <> (SELECT COUNT(*) FROM public.appointments)
       OR (SELECT row_count FROM saarthi_migration_row_counts WHERE table_name = 'cycle_logs')
            <> (SELECT COUNT(*) FROM public.cycle_logs)
       OR (SELECT row_count FROM saarthi_migration_row_counts WHERE table_name = 'vitals_logs')
            <> (SELECT COUNT(*) FROM public.vitals_logs)
    THEN
        RAISE EXCEPTION
            'Migration stopped: a protected core-table row count changed';
    END IF;
END
$postflight$;

COMMIT;

-- -----------------------------------------------------------------------------
-- 9. VERIFICATION OUTPUT (read-only; returned by psql after a successful commit).
-- -----------------------------------------------------------------------------

SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
      'users',
      'appointments',
      'cycle_logs',
      'vitals_logs',
      'processed_stripe_events'
  )
ORDER BY table_name, ordinal_position;

SELECT
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid IN (
      'public.users'::regclass,
      'public.appointments'::regclass,
      'public.cycle_logs'::regclass,
      'public.vitals_logs'::regclass,
      'public.processed_stripe_events'::regclass
  )
ORDER BY conrelid::regclass::TEXT, constraint_name;

SELECT
    COUNT(*) AS invalid_required_appointment_rows
FROM public.appointments
WHERE appointment_ref IS NULL OR btrim(appointment_ref) = ''
   OR provider_id IS NULL OR btrim(provider_id) = ''
   OR appointment_date IS NULL OR btrim(appointment_date) = ''
   OR time_slot IS NULL OR btrim(time_slot) = ''
   OR user_id IS NULL
   OR created_at IS NULL;

SELECT
    provider_id,
    appointment_date,
    time_slot,
    COUNT(*) AS duplicate_count
FROM public.appointments
GROUP BY provider_id, appointment_date, time_slot
HAVING COUNT(*) > 1;

SELECT
    (SELECT COUNT(*) FROM public.users) AS users,
    (SELECT COUNT(*) FROM public.appointments) AS appointments,
    (SELECT COUNT(*) FROM public.cycle_logs) AS cycle_logs,
    (SELECT COUNT(*) FROM public.vitals_logs) AS vitals_logs,
    (SELECT COUNT(*) FROM public.processed_stripe_events) AS processed_stripe_events;
