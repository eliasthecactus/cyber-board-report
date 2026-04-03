import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";

let db: Database | null = null;

export async function getDB(): Promise<Database> {
  if (db) {
    return db;
  }

  db = await open({
    filename: process.env.DATABASE_URL || path.join(process.cwd(), "reports.db"),
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA journal_mode = WAL");
  return db;
}

export async function initializeDB() {
  const database = await getDB();

  await database.exec(`
    -- Users table for authentication
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      displayName TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- WebAuthn credentials table
    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      credentialId BLOB UNIQUE NOT NULL,
      publicKey BLOB NOT NULL,
      signCount INTEGER DEFAULT 0,
      transports TEXT,
      aaguid TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Sessions for JWT-based auth
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      quarter TEXT NOT NULL,
      year INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      userId TEXT,
      executiveSummary TEXT,
      threatLandscape TEXT,
      outlook TEXT,
      data JSON NOT NULL,
      UNIQUE(quarter, year, userId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS risks (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      name TEXT NOT NULL,
      likelihood TEXT NOT NULL,
      businessImpact TEXT NOT NULL,
      trend TEXT NOT NULL,
      description TEXT,
      historicalData JSON,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kpis (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      value REAL NOT NULL,
      trend TEXT NOT NULL,
      targetValue REAL,
      historicalData JSON,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      title TEXT NOT NULL,
      businessImpact TEXT NOT NULL,
      outcome TEXT NOT NULL,
      lessonsLearned TEXT,
      quarter TEXT NOT NULL,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS initiatives (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL,
      blockers TEXT,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      title TEXT NOT NULL,
      rationale TEXT NOT NULL,
      impact TEXT NOT NULL,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS report_shares (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      sharedWithUserId TEXT NOT NULL,
      sharedByUserId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(reportId, sharedWithUserId),
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE,
      FOREIGN KEY (sharedWithUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sharedByUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reports_quarter_year ON reports(quarter, year);
    CREATE INDEX IF NOT EXISTS idx_reports_userId ON reports(userId);
    CREATE INDEX IF NOT EXISTS idx_shares_reportId ON report_shares(reportId);
    CREATE INDEX IF NOT EXISTS idx_shares_sharedWithUserId ON report_shares(sharedWithUserId);
    CREATE INDEX IF NOT EXISTS idx_credentials_userId ON credentials(userId);
    CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_risks_reportId ON risks(reportId);
    CREATE INDEX IF NOT EXISTS idx_kpis_reportId ON kpis(reportId);
    CREATE INDEX IF NOT EXISTS idx_incidents_reportId ON incidents(reportId);
    CREATE INDEX IF NOT EXISTS idx_initiatives_reportId ON initiatives(reportId);
    CREATE INDEX IF NOT EXISTS idx_decisions_reportId ON decisions(reportId);
  `);
}
