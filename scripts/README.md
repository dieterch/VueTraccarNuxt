# Timings Adjustments Export/Import Scripts

Helper scripts to export and import standstill timing adjustments between different instances of the application.

## Overview

These scripts allow you to:
- **Export** all timing adjustments from the database to a JSON file
- **Import** timing adjustments from a JSON file into the database
- Transfer timing adjustments between different application instances
- Backup and restore timing adjustments

## Scripts

### export-timings.cjs

Exports all standstill timing adjustments from the database to a JSON file.

**Usage:**
```bash
node scripts/export-timings.cjs [output-file]
```

**Examples:**
```bash
# Export to a timestamped file (default)
node scripts/export-timings.cjs

# Export to a specific file
node scripts/export-timings.cjs my-timings.json

# Export to an absolute path
node scripts/export-timings.cjs /path/to/backup/timings.json
```

**Output Format:**
```json
{
  "exported_at": "2026-02-06T10:30:00.000Z",
  "database": "/path/to/app.db",
  "count": 5,
  "adjustments": [
    {
      "standstill_key": "marker406560077881",
      "start_adjustment_minutes": 0,
      "end_adjustment_minutes": 1440,
      "created_at": "2026-02-05 19:49:49",
      "updated_at": "2026-02-05 19:53:58"
    }
  ]
}
```

### import-timings.cjs

Imports standstill timing adjustments from a JSON file into the database.

**Usage:**
```bash
node scripts/import-timings.cjs <input-file> [options]
```

**Options:**
- `--dry-run` - Show what would be imported without making changes
- `--merge` - Merge with existing data (default behavior)
- `--replace` - Delete all existing adjustments before import

**Examples:**
```bash
# Import and merge with existing data (default)
node scripts/import-timings.cjs timings-export.json

# Preview import without making changes
node scripts/import-timings.cjs timings-export.json --dry-run

# Replace all existing adjustments
node scripts/import-timings.cjs timings-export.json --replace

# Import from an absolute path
node scripts/import-timings.cjs /path/to/timings.json
```

## Typical Workflow

### Backing Up Timing Adjustments

```bash
# Export current adjustments
cd /path/to/VueTraccarNuxt
node scripts/export-timings.cjs backup-$(date +%Y%m%d).json
```

### Transferring to Another Instance

**On source instance:**
```bash
# Export adjustments
node scripts/export-timings.cjs timings-to-transfer.json

# Copy file to target instance (example using scp)
scp timings-to-transfer.json user@target-server:/path/to/target/instance/
```

**On target instance:**
```bash
# Preview what will be imported
node scripts/import-timings.cjs timings-to-transfer.json --dry-run

# Import adjustments (merge with existing)
node scripts/import-timings.cjs timings-to-transfer.json

# OR replace all existing adjustments
node scripts/import-timings.cjs timings-to-transfer.json --replace
```

### Restoring from Backup

```bash
# Restore adjustments from backup
node scripts/import-timings.cjs backup-20260206.json --replace
```

## Data Structure

The scripts work with the `standstill_adjustments` table which has the following structure:

| Field | Type | Description |
|-------|------|-------------|
| `standstill_key` | TEXT | Unique identifier for the standstill period |
| `start_adjustment_minutes` | INTEGER | Minutes to adjust start time (negative = earlier, positive = later) |
| `end_adjustment_minutes` | INTEGER | Minutes to adjust end time (negative = earlier, positive = later) |
| `created_at` | TEXT | ISO timestamp of creation |
| `updated_at` | TEXT | ISO timestamp of last update |

## Merge vs Replace Mode

### Merge Mode (Default)
- Keeps existing adjustments that aren't in the import file
- Updates existing adjustments if the `standstill_key` matches
- Adds new adjustments from the import file
- **Use when:** You want to add/update specific adjustments without losing others

### Replace Mode (`--replace`)
- Deletes ALL existing adjustments first
- Then imports all adjustments from the file
- **Use when:** You want to completely replace all adjustments with the imported set

## Notes

- The database path is automatically set to `data/app.db` relative to the project root
- Import operations use transactions to ensure data consistency
- The `--dry-run` option is useful for previewing changes before committing them
- Timestamps are preserved during export/import when available
- The `updated_at` field is always set to the current time during import

## Requirements

- Node.cjs (version 14 or higher)
- better-sqlite3 package (already included in project dependencies)

## Troubleshooting

**Database not found:**
- Ensure you're running the scripts from the project root or scripts directory
- Check that the database exists at `data/app.db`

**Invalid file format:**
- Ensure the JSON file has the correct structure with an `adjustments` array
- Use the export script to create properly formatted files

**Permission errors:**
- Ensure you have read/write permissions for the database file
- Ensure you have write permissions for the output directory
