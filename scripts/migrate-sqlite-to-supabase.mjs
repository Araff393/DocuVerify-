import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { PrismaClient } from "@prisma/client";

const SQLITE_PATH = path.join(process.cwd(), "prisma", "dev.db");
const PLACEHOLDER_RE =
  /(PROJECT_REF|PASSWORD|REGION|TEST_PROJECT_REF|TEST_PASSWORD|TEST_REGION)/;

function requireSupabaseEnv() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const directUrl = process.env.DIRECT_URL ?? "";

  if (!databaseUrl.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL harus berisi connection string PostgreSQL Supabase.");
  }

  if (!directUrl.startsWith("postgresql://")) {
    throw new Error("DIRECT_URL harus berisi direct connection string PostgreSQL Supabase.");
  }

  if (PLACEHOLDER_RE.test(databaseUrl) || PLACEHOLDER_RE.test(directUrl)) {
    throw new Error("DATABASE_URL/DIRECT_URL masih berisi placeholder.");
  }
}

function normalizeDate(value) {
  return value ? new Date(value) : undefined;
}

function readAllRows(db) {
  return {
    admins: db.prepare('SELECT * FROM "Admin" ORDER BY "id"').all(),
    documents: db.prepare('SELECT * FROM "Document" ORDER BY "id"').all(),
    verificationLogs: db
      .prepare('SELECT * FROM "VerificationLog" ORDER BY "id"')
      .all(),
    auditLogs: db.prepare('SELECT * FROM "AdminAuditLog" ORDER BY "id"').all(),
  };
}

async function ensureTargetIsSafe(prisma) {
  const [admins, documents, verificationLogs, auditLogs] = await Promise.all([
    prisma.admin.count(),
    prisma.document.count(),
    prisma.verificationLog.count(),
    prisma.adminAuditLog.count(),
  ]);

  const total = admins + documents + verificationLogs + auditLogs;
  if (total === 0 || process.env.ALLOW_NON_EMPTY_SUPABASE_IMPORT === "1") {
    return;
  }

  throw new Error(
    [
      "Target Supabase sudah berisi data.",
      `Counts: Admin=${admins}, Document=${documents}, VerificationLog=${verificationLogs}, AdminAuditLog=${auditLogs}.`,
      "Set ALLOW_NON_EMPTY_SUPABASE_IMPORT=1 jika memang ingin upsert ke database ini.",
    ].join(" ")
  );
}

async function resetSequence(prisma, table) {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"${table}"', 'id'),
      COALESCE((SELECT MAX("id") FROM "${table}"), 1),
      (SELECT MAX("id") IS NOT NULL FROM "${table}")
    )
  `);
}

async function main() {
  requireSupabaseEnv();

  if (!existsSync(SQLITE_PATH)) {
    throw new Error(`SQLite source tidak ditemukan: ${SQLITE_PATH}`);
  }

  const sqlite = new DatabaseSync(SQLITE_PATH, { readOnly: true });
  const source = readAllRows(sqlite);
  sqlite.close();

  const prisma = new PrismaClient();

  try {
    await ensureTargetIsSafe(prisma);

    await prisma.$transaction(async (tx) => {
      for (const admin of source.admins) {
        await tx.admin.upsert({
          where: { id: admin.id },
          update: {
            name: admin.name,
            email: admin.email,
            passwordHash: admin.passwordHash,
            createdAt: normalizeDate(admin.createdAt),
            updatedAt: normalizeDate(admin.updatedAt),
          },
          create: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            passwordHash: admin.passwordHash,
            createdAt: normalizeDate(admin.createdAt),
            updatedAt: normalizeDate(admin.updatedAt),
          },
        });
      }

      for (const document of source.documents) {
        await tx.document.upsert({
          where: { id: document.id },
          update: {
            title: document.title,
            documentType: document.documentType,
            ownerName: document.ownerName,
            ownerIdentity: document.ownerIdentity,
            faculty: document.faculty,
            studyProgram: document.studyProgram,
            documentYear: document.documentYear,
            institution: document.institution,
            fileName: document.fileName,
            filePath: document.filePath,
            hashSHA256: document.hashSHA256,
            ipfsCid: document.ipfsCid,
            ipfsFileId: document.ipfsFileId,
            status: document.status,
            createdAt: normalizeDate(document.createdAt),
            updatedAt: normalizeDate(document.updatedAt),
          },
          create: {
            id: document.id,
            title: document.title,
            documentType: document.documentType,
            ownerName: document.ownerName,
            ownerIdentity: document.ownerIdentity,
            faculty: document.faculty,
            studyProgram: document.studyProgram,
            documentYear: document.documentYear,
            institution: document.institution,
            fileName: document.fileName,
            filePath: document.filePath,
            hashSHA256: document.hashSHA256,
            ipfsCid: document.ipfsCid,
            ipfsFileId: document.ipfsFileId,
            status: document.status,
            createdAt: normalizeDate(document.createdAt),
            updatedAt: normalizeDate(document.updatedAt),
          },
        });
      }

      for (const log of source.verificationLogs) {
        await tx.verificationLog.upsert({
          where: { id: log.id },
          update: {
            uploadedHash: log.uploadedHash,
            status: log.status,
            documentId: log.documentId,
            ipAddress: log.ipAddress,
            createdAt: normalizeDate(log.createdAt),
          },
          create: {
            id: log.id,
            uploadedHash: log.uploadedHash,
            status: log.status,
            documentId: log.documentId,
            ipAddress: log.ipAddress,
            createdAt: normalizeDate(log.createdAt),
          },
        });
      }

      for (const log of source.auditLogs) {
        await tx.adminAuditLog.upsert({
          where: { id: log.id },
          update: {
            adminId: log.adminId,
            action: log.action,
            targetType: log.targetType,
            targetId: log.targetId,
            metadata: log.metadata,
            ipAddress: log.ipAddress,
            createdAt: normalizeDate(log.createdAt),
          },
          create: {
            id: log.id,
            adminId: log.adminId,
            action: log.action,
            targetType: log.targetType,
            targetId: log.targetId,
            metadata: log.metadata,
            ipAddress: log.ipAddress,
            createdAt: normalizeDate(log.createdAt),
          },
        });
      }
    });

    for (const table of ["Admin", "Document", "VerificationLog", "AdminAuditLog"]) {
      await resetSequence(prisma, table);
    }

    const counts = {
      admins: await prisma.admin.count(),
      documents: await prisma.document.count(),
      verificationLogs: await prisma.verificationLog.count(),
      auditLogs: await prisma.adminAuditLog.count(),
    };

    console.log(
      JSON.stringify(
        {
          sourceCounts: {
            admins: source.admins.length,
            documents: source.documents.length,
            verificationLogs: source.verificationLogs.length,
            auditLogs: source.auditLogs.length,
          },
          targetCounts: counts,
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
