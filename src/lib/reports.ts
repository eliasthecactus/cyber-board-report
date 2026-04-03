import { Report } from "@/types";
import { getDB } from "./db";
import { v4 as uuidv4 } from "uuid";

export async function createReport(
  quarter: string,
  year: number,
  createdBy: string,
  userId?: string
): Promise<Report> {
  const db = await getDB();
  const id = uuidv4();
  const now = new Date().toISOString();

  const report: Report = {
    id,
    quarter,
    year,
    createdAt: now,
    updatedAt: now,
    createdBy,
    executiveSummary: "",
    topRisks: [],
    threatLandscape: "",
    kpis: [],
    incidents: [],
    programStatus: {
      status: "on-track",
      achievements: [],
      challenges: [],
    },
    budgetResources: {
      budget: "",
      allocation: "",
      constraints: "",
    },
    complianceAudit: {
      status: "compliant",
      findings: [],
      gaps: [],
    },
    supplyChainRisk: {
      risks: [],
      assessment: "",
    },
    initiatives: [],
    outlook: "",
    decisionsRequired: [],
  };

  await db.run(
    `INSERT INTO reports (id, quarter, year, createdAt, updatedAt, createdBy, userId, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, quarter, year, now, now, createdBy, userId || null, JSON.stringify(report)]
  );

  return report;
}

export async function getReport(id: string, userId?: string): Promise<Report | null> {
  const db = await getDB();
  let result;

  if (userId) {
    // Owner OR collaborator
    result = await db.get(
      `SELECT data FROM reports WHERE id = ? AND (
         userId = ? OR EXISTS (
           SELECT 1 FROM report_shares WHERE reportId = ? AND sharedWithUserId = ?
         )
       )`,
      [id, userId, id, userId]
    );
  } else {
    result = await db.get(`SELECT data FROM reports WHERE id = ?`, [id]);
  }

  return result ? JSON.parse(result.data) : null;
}

export async function isReportOwner(id: string, userId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.get(
    `SELECT id FROM reports WHERE id = ? AND userId = ?`,
    [id, userId]
  );
  return !!result;
}

export async function getAllReports(
  userId?: string
): Promise<(Report & { isOwner: boolean; ownerDisplayName?: string })[]> {
  const db = await getDB();

  if (!userId) {
    const results = await db.all(`SELECT data FROM reports ORDER BY year DESC, quarter DESC`);
    return results.map((r: any) => ({ ...JSON.parse(r.data), isOwner: true }));
  }

  const ownResults = await db.all(
    `SELECT data FROM reports WHERE userId = ? ORDER BY year DESC, quarter DESC`,
    [userId]
  );

  const sharedResults = await db.all(
    `SELECT r.data, u.displayName as ownerName
     FROM reports r
     INNER JOIN report_shares s ON s.reportId = r.id
     LEFT JOIN users u ON u.id = r.userId
     WHERE s.sharedWithUserId = ?
     ORDER BY r.year DESC, r.quarter DESC`,
    [userId]
  );

  const own = ownResults.map((r: any) => ({ ...JSON.parse(r.data), isOwner: true }));
  const shared = sharedResults.map((r: any) => ({
    ...JSON.parse(r.data),
    isOwner: false,
    ownerDisplayName: r.ownerName,
  }));

  return [...own, ...shared].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.quarter.localeCompare(a.quarter);
  });
}

export async function updateReport(id: string, report: Report, userId?: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();

  if (userId) {
    // Owner OR collaborator can save
    await db.run(
      `UPDATE reports SET data = ?, updatedAt = ?
       WHERE id = ? AND (
         userId = ? OR EXISTS (
           SELECT 1 FROM report_shares WHERE reportId = ? AND sharedWithUserId = ?
         )
       )`,
      [JSON.stringify(report), now, id, userId, id, userId]
    );
  } else {
    await db.run(
      `UPDATE reports SET data = ?, updatedAt = ? WHERE id = ?`,
      [JSON.stringify(report), now, id]
    );
  }
}

export async function getCollaborators(
  reportId: string
): Promise<{ userId: string; displayName: string }[]> {
  const db = await getDB();
  return await db.all(
    `SELECT u.id as userId, u.displayName
     FROM report_shares s
     INNER JOIN users u ON u.id = s.sharedWithUserId
     WHERE s.reportId = ?`,
    [reportId]
  );
}

export async function addShare(
  reportId: string,
  sharedWithUserId: string,
  sharedByUserId: string
): Promise<void> {
  const db = await getDB();
  await db.run(
    `INSERT OR IGNORE INTO report_shares (id, reportId, sharedWithUserId, sharedByUserId, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), reportId, sharedWithUserId, sharedByUserId, new Date().toISOString()]
  );
}

export async function removeShare(reportId: string, sharedWithUserId: string): Promise<void> {
  const db = await getDB();
  await db.run(
    `DELETE FROM report_shares WHERE reportId = ? AND sharedWithUserId = ?`,
    [reportId, sharedWithUserId]
  );
}

export async function updateCreatedByForUser(userId: string, newName: string): Promise<void> {
  const db = await getDB();
  await db.run(
    `UPDATE reports SET createdBy = ?, data = json_set(data, '$.createdBy', ?) WHERE userId = ?`,
    [newName, newName, userId]
  );
}

export async function deleteReport(id: string, userId?: string): Promise<void> {
  const db = await getDB();
  
  if (userId) {
    // Delete report only if user owns it
    await db.run(`DELETE FROM reports WHERE id = ? AND userId = ?`, [id, userId]);
  } else {
    // Delete report without ownership check (fallback)
    await db.run(`DELETE FROM reports WHERE id = ?`, [id]);
  }
}
