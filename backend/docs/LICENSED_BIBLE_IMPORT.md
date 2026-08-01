# Licensed Bible import

Koino keeps licensed Bible source files outside Git and synchronizes them into
PostgreSQL at application startup. The importer will not run unless both the
feature flag and the redistribution-rights confirmation are enabled.

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
