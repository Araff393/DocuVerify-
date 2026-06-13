import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function readWorkspaceFile(...segments: string[]) {
  return readFile(path.join(process.cwd(), ...segments), "utf8");
}

describe("upload reset UX implementation", () => {
  it("form admin membersihkan file ref dan input value", async () => {
    const source = await readWorkspaceFile(
      "app",
      "admin",
      "documents",
      "create",
      "page.tsx"
    );

    expect(source).toContain("const inputRef = useRef<HTMLInputElement | null>(null)");
    expect(source).toContain("function clearSelectedFile()");
    expect(source).toContain('inputRef.current.value = ""');
    expect(source).toContain("ref={inputRef}");
  });

  it("form verifikasi publik membersihkan file ref dan input value", async () => {
    const source = await readWorkspaceFile("components", "verify-form.tsx");

    expect(source).toContain("const inputRef = useRef<HTMLInputElement | null>(null)");
    expect(source).toContain("function clearSelectedFile()");
    expect(source).toContain('inputRef.current.value = ""');
    expect(source).toContain("ref={inputRef}");
  });
});
