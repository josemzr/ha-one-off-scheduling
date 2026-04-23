/**
 * SQLite persistence layer for scheduled jobs.
 *
 * Uses better-sqlite3 (synchronous API) to store jobs so they survive
 * Home Assistant / add-on restarts.
 *
 * Database location defaults to /data/scheduler.db (the HA add-on
 * persistent volume) and can be overridden via the DB_PATH env var.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join('/data', 'scheduler.db');

let db;

/**
 * Open (or create) the database and ensure the schema exists.
 * Call once at application start-up.
 */
function initDb() {
  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent-read performance
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_jobs (
      id            INTEGER PRIMARY KEY,
      entity_id     TEXT    NOT NULL,
      service       TEXT    NOT NULL,
      service_data  TEXT    NOT NULL DEFAULT '{}',
      schedule_date TEXT    NOT NULL
    )
  `);

  console.log(`Database opened at ${DB_PATH}`);
}

/**
 * Persist a newly-scheduled job.
 */
function saveJob({ id, entityId, service, serviceData, scheduleDate }) {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO scheduled_jobs (id, entity_id, service, service_data, schedule_date) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(id, entityId, service, JSON.stringify(serviceData || {}), scheduleDate);
}

/**
 * Remove a job (after execution or cancellation).
 */
function deleteJob(id) {
  db.prepare('DELETE FROM scheduled_jobs WHERE id = ?').run(id);
}

/**
 * Load all persisted jobs (used at start-up to re-schedule).
 * Returns an array of plain objects.
 */
function loadJobs() {
  const rows = db.prepare('SELECT * FROM scheduled_jobs').all();
  return rows.map(row => ({
    id: row.id,
    entityId: row.entity_id,
    service: row.service,
    serviceData: JSON.parse(row.service_data),
    scheduleDate: row.schedule_date,
  }));
}

/**
 * Return the highest job id currently stored, or 0 if the table is empty.
 * Used to seed the in-memory jobCounter so new ids never collide.
 */
function getMaxJobId() {
  const row = db.prepare('SELECT MAX(id) AS maxId FROM scheduled_jobs').get();
  return row.maxId || 0;
}

/**
 * Close the database (for graceful shutdown).
 */
function closeDb() {
  if (db) {
    db.close();
  }
}

module.exports = { initDb, saveJob, deleteJob, loadJobs, getMaxJobId, closeDb };
