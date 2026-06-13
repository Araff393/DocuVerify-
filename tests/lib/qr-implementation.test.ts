import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("QR document actions implementation", () => {
  it("memakai library qrcode dan tidak memakai generator canvas custom", async () => {
    const source = await readFile(
      path.join(
        process.cwd(),
        "app",
        "admin",
        "documents",
        "[id]",
        "document-actions.tsx"
      ),
      "utf8"
    );

    expect(source).toContain('from "qrcode"');
    expect(source).toContain("QRCode.toCanvas");
    expect(source).not.toContain("generateQRCanvas");
  });
});
