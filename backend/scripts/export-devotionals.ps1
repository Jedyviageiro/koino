param(
    [string]$PostgresContainer = "koino_postgres",
    [string]$Database = "koino_db",
    [string]$DatabaseUser = "postgres"
)

$ErrorActionPreference = "Stop"
$backendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$outputDirectory = Join-Path $backendRoot "src/main/resources/devotionals"
$outputPath = Join-Path $outputDirectory "devotional-catalog.json"

$query = @"
select coalesce(
    jsonb_agg(
        jsonb_build_object(
            'readingAssignment', catalog.reading_assignment,
            'title', catalog.title,
            'anchorVerseReference', catalog.anchor_verse_reference,
            'anchorVerseText', catalog.anchor_verse_text,
            'opening', catalog.opening,
            'reflection', catalog.reflection,
            'application', catalog.application,
            'prayer', catalog.prayer,
            'modelName', catalog.model_name
        )
        order by catalog.reading_assignment
    ),
    '[]'::jsonb
)
from (
    select distinct on (task.reading_assignment)
        task.reading_assignment,
        devotional.title,
        devotional.anchor_verse_reference,
        devotional.anchor_verse_text,
        devotional.opening,
        devotional.reflection,
        devotional.application,
        devotional.prayer,
        devotional.model_name
    from user_task_devotionals devotional
    join user_plan_tasks task on task.task_id = devotional.task_id
    order by task.reading_assignment, devotional.devotional_id
) catalog;
"@

$json = docker exec $PostgresContainer psql `
    -U $DatabaseUser `
    -d $Database `
    -At `
    -c $query

if ($LASTEXITCODE -ne 0) {
    throw "Could not export devotionals from PostgreSQL."
}

$catalog = $json | ConvertFrom-Json
$formatted = $catalog | ConvertTo-Json -Depth 5
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
[System.IO.File]::WriteAllText(
    $outputPath,
    $formatted + [Environment]::NewLine,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Output "Exported $($catalog.Count) unique devotionals to $outputPath"
