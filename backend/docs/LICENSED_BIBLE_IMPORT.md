# Licensed Bible import

Koino synchronizes authorized Bible source files into PostgreSQL at application
startup. The importer will not run unless both its feature flag and the shared
redistribution-rights confirmation are enabled.

## Portable source format

Place an authorized export at `<source-directory>/bible.json`:

```json
[
  { "book": "Gênesis", "chapter": 1, "verse": 1, "text": "..." }
]
```

English and Portuguese book names are accepted. The source directory should be
a persistent mounted disk so it remains a local backup across deployments.

## NVI configuration

```text
BIBLE_LICENSED_IMPORT_ENABLED=true
BIBLE_LICENSED_RIGHTS_CONFIRMED=true
BIBLE_LICENSED_SOURCE_DIRECTORY=/app/data/licensed-bibles/nvi
BIBLE_LICENSED_VERSION_CODE=NVI
BIBLE_LICENSED_VERSION_NAME=Nova Versão Internacional
BIBLE_LICENSED_COPYRIGHT_NOTICE=<the exact notice required by the license>
```

Do not enable the importer or commit a third-party text until the copyright
owner or licensor has granted the necessary production and redistribution
rights. A repository containing data is not by itself a license to redistribute
that data.

## Koino SQL sources

The streaming SQL importer recognizes `bible-en-niv.sql` and
`bible-pt-nvi.sql`. It filters the large English multi-version dump to NIV/EN
and imports the Portuguese NVI verse rows by canonical book order. These two
authorized SQL files are bundled under `backend/data/licensed-bibles`, copied
to `/app/seed-data/licensed-bibles` by the backend image, and retained as the
repeatable local source for rebuilding PostgreSQL.

```text
BIBLE_SQL_IMPORT_ENABLED=true
BIBLE_LICENSED_RIGHTS_CONFIRMED=true
BIBLE_SQL_IMPORT_SOURCE_DIRECTORY=/app/seed-data/licensed-bibles
BIBLE_NIV_COPYRIGHT_NOTICE=<exact licensed notice>
BIBLE_NVI_COPYRIGHT_NOTICE=<exact licensed notice>
```
