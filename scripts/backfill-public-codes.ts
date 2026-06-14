import { PrismaClient } from "@prisma/client";

import { generatePublicCode, isDocuVerifyPublicCode } from "@/lib/public-document";

const prisma = new PrismaClient();

async function createUniquePublicCode(documentYear: number) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const publicCode = generatePublicCode(documentYear);
    const existing = await prisma.document.findUnique({
      where: { publicCode },
      select: { id: true },
    });

    if (!existing) return publicCode;
  }

  throw new Error("Gagal membuat publicCode unik setelah 10 percobaan.");
}

async function main() {
  const documents = await prisma.$queryRaw<
    { id: number; documentYear: number; publicCode: string | null }[]
  >`
    SELECT id, "documentYear", "publicCode"
    FROM "Document"
    ORDER BY id ASC
  `;

  let updated = 0;

  for (const document of documents) {
    if (isDocuVerifyPublicCode(document.publicCode)) continue;

    const publicCode = await createUniquePublicCode(document.documentYear);
    await prisma.document.update({
      where: { id: document.id },
      data: { publicCode },
    });
    updated += 1;
  }

  console.log(`Public codes backfilled: ${updated}`);
}

main()
  .catch((error) => {
    console.error("Backfill public codes failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
