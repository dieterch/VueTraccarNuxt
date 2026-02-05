import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { mkdirSync, existsSync } from 'fs'

let appDb: Database.Database | null = null

function getAppDb(): Database.Database {
  if (!appDb) {
    const dbPath = join(process.cwd(), 'data', 'app.db')

    // Ensure the directory exists
    const dbDir = dirname(dbPath)
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    appDb = new Database(dbPath)

    // Enable WAL mode for better performance
    appDb.pragma('journal_mode = WAL')

    initializeAppDatabase(appDb)
  }
  return appDb
}

function initializeAppDatabase(database: Database.Database) {
  // Create travel_patches table
  database.exec(`
    CREATE TABLE IF NOT EXISTS travel_patches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address_key TEXT NOT NULL UNIQUE,
      title TEXT,
      from_date TEXT,
      to_date TEXT,
      exclude INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_travel_address
    ON travel_patches(address_key)
  `)
}

export function getTravelPatches(): any[] {
  const database = getAppDb()
  const rows = database.prepare(`
    SELECT * FROM travel_patches
    ORDER BY address_key ASC
  `).all()
  return rows as any[]
}

export function getTravelPatch(addressKey: string): any | null {
  const database = getAppDb()
  const row = database.prepare(`
    SELECT * FROM travel_patches WHERE address_key = ?
  `).get(addressKey)
  return row || null
}

export function saveTravelPatch(patch: {
  addressKey: string
  title?: string
  fromDate?: string
  toDate?: string
  exclude?: boolean
}): void {
  const database = getAppDb()

  const existing = getTravelPatch(patch.addressKey)

  if (existing) {
    database.prepare(`
      UPDATE travel_patches
      SET title = ?, from_date = ?, to_date = ?, exclude = ?, updated_at = CURRENT_TIMESTAMP
      WHERE address_key = ?
    `).run(
      patch.title || null,
      patch.fromDate || null,
      patch.toDate || null,
      patch.exclude ? 1 : 0,
      patch.addressKey
    )
  } else {
    database.prepare(`
      INSERT INTO travel_patches
      (address_key, title, from_date, to_date, exclude)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      patch.addressKey,
      patch.title || null,
      patch.fromDate || null,
      patch.toDate || null,
      patch.exclude ? 1 : 0
    )
  }
}

export function deleteTravelPatch(addressKey: string): void {
  const database = getAppDb()
  database.prepare('DELETE FROM travel_patches WHERE address_key = ?').run(addressKey)
}

export function closeAppDatabase() {
  if (appDb) {
    appDb.close()
    appDb = null
  }
}
