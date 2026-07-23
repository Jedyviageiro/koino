\set ON_ERROR_STOP on

DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT constraint_info.constraint_name
        FROM information_schema.table_constraints constraint_info
        JOIN information_schema.constraint_column_usage column_info
          ON column_info.constraint_name = constraint_info.constraint_name
         AND column_info.table_schema = constraint_info.table_schema
        WHERE constraint_info.table_schema = current_schema()
          AND constraint_info.table_name = 'plan_templates'
          AND constraint_info.constraint_type = 'UNIQUE'
          AND column_info.column_name IN ('description', 'book_names')
    LOOP
        EXECUTE format(
            'ALTER TABLE plan_templates DROP CONSTRAINT %I',
            constraint_name
        );
    END LOOP;
END $$;
