import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL tidak tersedia di .env.local");
}

const url = new URL(connectionString);

// Supabase pooler requires SSL in this environment, even if the local env still
// carries an older sslmode=disable parameter.
url.searchParams.delete("sslmode");

const client = new Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
  query_timeout: 20000,
  statement_timeout: 20000,
});

await client.connect();

try {
  const updateResult = await client.query(`
    update "Document"
    set "documentType" = case
      when "documentType" = 'Surat Akademik Lainnya' then 'Sertifikat Lainnya'
      else 'Sertifikat Akademik'
    end
    where "documentType" in (
      'Skripsi',
      'Lembar Pengesahan',
      'Surat Pernyataan Keaslian',
      'Artikel Tugas Akhir',
      'Surat Akademik Lainnya'
    );
  `);

  const counts = await client.query(`
    select "documentType", count(*)::int as count
    from "Document"
    group by "documentType"
    order by "documentType";
  `);

  console.log(
    JSON.stringify(
      {
        migratedRows: updateResult.rowCount,
        counts: counts.rows,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
