\set ON_ERROR_STOP on

BEGIN;

SELECT COUNT(*) AS verses_to_clean
FROM verses
WHERE text LIKE '%{%' OR text LIKE '%}%';

UPDATE verses
SET text = REPLACE(REPLACE(text, '{', ''), '}', '')
WHERE text LIKE '%{%' OR text LIKE '%}%';

SELECT COUNT(*) AS verses_still_containing_braces
FROM verses
WHERE text LIKE '%{%' OR text LIKE '%}%';

COMMIT;
