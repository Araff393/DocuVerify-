const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "assets", "generated-screenshots");
const BASE_URL = process.env.DOCUVERIFY_BASE_URL || "http://127.0.0.1:3000";
const CHROME_PATH =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = Number(process.env.CHROME_DEBUG_PORT || 9333);
const VIEWPORT = { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false };

fs.mkdirSync(OUT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toDataUrl(html) {
  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}

function readLines(filePath, start, end) {
  const fullPath = path.join(ROOT, filePath);
  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
  return lines
    .slice(start - 1, end)
    .map((line, idx) => `${String(start + idx).padStart(3, " ")} | ${line}`)
    .join("\n");
}

async function waitForJson(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // wait and retry
    }
    await sleep(500);
  }
  throw new Error(`Chrome remote endpoint tidak siap: ${url}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
    this.events = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("WebSocket timeout")), 15000);
      this.ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      this.ws.onerror = (event) => {
        clearTimeout(timer);
        reject(new Error(`WebSocket error: ${event.message || "unknown"}`));
      };
    });

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result || {});
        return;
      }
      if (message.method) {
        const callbacks = this.events.get(message.method) || [];
        callbacks.forEach((callback) => callback(message.params || {}));
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  once(method, timeout = 45000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.events.set(
          method,
          (this.events.get(method) || []).filter((fn) => fn !== handler)
        );
        reject(new Error(`Timeout menunggu event ${method}`));
      }, timeout);
      const handler = (params) => {
        clearTimeout(timer);
        this.events.set(
          method,
          (this.events.get(method) || []).filter((fn) => fn !== handler)
        );
        resolve(params);
      };
      this.events.set(method, [...(this.events.get(method) || []), handler]);
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function newPageClient() {
  const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error(`Gagal membuat target Chrome: ${res.status}`);
  const target = await res.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");
  await client.send("Emulation.setDeviceMetricsOverride", VIEWPORT);
  return client;
}

async function navigate(client, url) {
  const loaded = client.once("Page.loadEventFired").catch(() => null);
  await client.send("Page.navigate", { url });
  await loaded;
  await sleep(2500);
}

async function screenshot(client, fileName) {
  const metrics = await client.send("Page.getLayoutMetrics");
  const height = Math.max(
    VIEWPORT.height,
    Math.min(6000, Math.ceil(metrics.contentSize?.height || VIEWPORT.height))
  );
  await client.send("Emulation.setDeviceMetricsOverride", {
    ...VIEWPORT,
    height,
  });
  await sleep(300);
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    fromSurface: true,
  });
  fs.writeFileSync(path.join(OUT_DIR, fileName), Buffer.from(result.data, "base64"));
  await client.send("Emulation.setDeviceMetricsOverride", VIEWPORT);
}

async function placeholder(fileName, title, reason) {
  const client = await newPageClient();
  const html = `
    <html>
      <body style="margin:0;font-family:Arial,sans-serif;background:#f8fafc;color:#1f2937;">
        <div style="height:900px;display:flex;align-items:center;justify-content:center;padding:48px;box-sizing:border-box;">
          <div style="border:2px dashed #94a3b8;border-radius:18px;padding:64px;max-width:900px;text-align:center;background:white;">
            <h1 style="font-size:40px;margin:0 0 20px;">[Screenshot belum tersedia]</h1>
            <h2 style="font-size:24px;margin:0 0 18px;color:#0f766e;">${escapeHtml(title)}</h2>
            <p style="font-size:18px;line-height:1.6;color:#475569;">${escapeHtml(reason)}</p>
          </div>
        </div>
      </body>
    </html>`;
  await navigate(client, toDataUrl(html));
  await screenshot(client, fileName);
  client.close();
}

async function captureUrl(fileName, url) {
  const client = await newPageClient();
  try {
    await navigate(client, `${BASE_URL}${url}`);
    await screenshot(client, fileName);
    console.log(`captured ${fileName}`);
  } finally {
    client.close();
  }
}

async function captureUrlOrPlaceholder(fileName, url, title) {
  try {
    await captureUrl(fileName, url);
  } catch (error) {
    console.warn(`failed ${fileName}: ${error.message}`);
    await placeholder(fileName, title, error.message);
  }
}

async function captureCode(fileName, title, code, caption) {
  const client = await newPageClient();
  const html = `
    <html>
      <body style="margin:0;background:#eef2f7;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="padding:36px;">
          <div style="background:white;border:1px solid #d8dee9;border-radius:14px;box-shadow:0 12px 34px rgba(15,23,42,.10);overflow:hidden;">
            <div style="padding:22px 28px;border-bottom:1px solid #e5e7eb;background:#f8fafc;">
              <h1 style="font-size:26px;margin:0 0 8px;">${escapeHtml(title)}</h1>
              <p style="font-size:15px;margin:0;color:#475569;">${escapeHtml(caption)}</p>
            </div>
            <pre style="margin:0;padding:28px;font-family:Consolas,'Courier New',monospace;font-size:17px;line-height:1.45;white-space:pre-wrap;background:#0b1020;color:#dbeafe;">${escapeHtml(code)}</pre>
          </div>
        </div>
      </body>
    </html>`;
  try {
    await navigate(client, toDataUrl(html));
    await screenshot(client, fileName);
    console.log(`captured ${fileName}`);
  } finally {
    client.close();
  }
}

function parseCookie(setCookie) {
  if (!setCookie) return null;
  const first = setCookie.split(";")[0];
  const idx = first.indexOf("=");
  if (idx === -1) return null;
  return { name: first.slice(0, idx), value: first.slice(idx + 1) };
}

async function setLoginCookie() {
  const email = process.env.ADMIN_SCREENSHOT_EMAIL || process.env.ADMIN_SEED_EMAIL;
  const password =
    process.env.ADMIN_SCREENSHOT_PASSWORD || process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_SCREENSHOT_EMAIL/ADMIN_SCREENSHOT_PASSWORD atau ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD sebelum mengambil screenshot admin."
    );
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie");
  const cookie = parseCookie(setCookie || "");
  if (!res.ok || !cookie) {
    throw new Error(`Login API gagal atau cookie tidak tersedia. Status ${res.status}`);
  }
  const client = await newPageClient();
  try {
    await client.send("Network.setCookie", {
      name: cookie.name,
      value: cookie.value,
      url: BASE_URL,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });
  } finally {
    client.close();
  }
}

function launchChrome() {
  const userDataDir = path.join(os.tmpdir(), `docuverify-report-chrome-${crypto.randomBytes(4).toString("hex")}`);
  const args = [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-crash-reporter",
    "--hide-scrollbars",
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    "about:blank",
  ];
  return spawn(CHROME_PATH, args, {
    stdio: "ignore",
    detached: false,
  });
}

async function main() {
  const chrome = launchChrome();
  try {
    await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`);

    await captureUrlOrPlaceholder("01_landing_page.png", "/", "Landing Page");
    await captureUrlOrPlaceholder("02_verify_page.png", "/verify", "Halaman Verifikasi Publik");
    await captureUrlOrPlaceholder("03_public_history.png", "/history", "Riwayat Verifikasi Publik");
    await captureUrlOrPlaceholder("04_admin_login.png", "/admin/login", "Login Admin");

    try {
      await setLoginCookie();
    } catch (error) {
      console.warn(`login cookie failed: ${error.message}`);
    }

    await captureUrlOrPlaceholder("05_admin_dashboard.png", "/admin/dashboard", "Dashboard Admin");
    await captureUrlOrPlaceholder("06_admin_documents.png", "/admin/documents", "Daftar Dokumen Admin");
    await captureUrlOrPlaceholder("07_admin_create_document.png", "/admin/documents/create", "Form Pendaftaran Dokumen");
    await captureUrlOrPlaceholder("08_admin_verifications.png", "/admin/verifications", "Riwayat Verifikasi Admin");
    await captureUrlOrPlaceholder("09_admin_document_detail.png", "/admin/documents/1", "Detail Dokumen");

    await captureCode(
      "10_prisma_schema.png",
      "Schema Database Prisma",
      readLines("prisma/schema.prisma", 1, 66),
      "Model Admin, Document, dan VerificationLog pada Prisma SQLite."
    );
    await captureCode(
      "11_hashing_code.png",
      "Kode Hash SHA-256",
      readLines("lib/upload.ts", 43, 100),
      "Implementasi perhitungan hash server-side dan penyimpanan file."
    );
    await captureCode(
      "12_verify_api_code.png",
      "Kode API Verifikasi",
      readLines("app/api/verify/route.ts", 1, 112),
      "Logika perbandingan hash untuk status VALID, NOT_REGISTERED, dan INVALID."
    );

    const lintPath = path.join(OUT_DIR, "lint_output.txt");
    const lintOutput = fs.existsSync(lintPath)
      ? fs.readFileSync(lintPath, "utf8")
      : "npm run lint belum dijalankan.";
    await captureCode(
      "13_lint_result.png",
      "Hasil Type Check / Lint",
      lintOutput,
      "Output npm run lint sebagai bukti pemeriksaan TypeScript."
    );
  } finally {
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
