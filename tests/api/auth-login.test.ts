import { describe, it, expect } from "vitest";

import { POST as loginPOST } from "@/app/api/auth/login/route";
import { createAdminOnly } from "../helpers";
import { makeJsonRequest } from "../helpers";

describe("POST /api/auth/login", () => {
  it("login berhasil dengan kredensial valid → 200 + admin payload", async () => {
    const { admin, password } = await createAdminOnly({
      email: "valid@uny.ac.id",
      password: "secret123",
      name: "Valid Admin",
    });

    const req = makeJsonRequest("http://test/api/auth/login", {
      email: "valid@uny.ac.id",
      password,
    });

    const res = await loginPOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  });

  it("login gagal dengan password salah → 401", async () => {
    await createAdminOnly({
      email: "wrong-pass@uny.ac.id",
      password: "correctPassword",
    });

    const req = makeJsonRequest("http://test/api/auth/login", {
      email: "wrong-pass@uny.ac.id",
      password: "wrongPassword",
    });

    const res = await loginPOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.category).toBe("auth");
    expect(json.error.message).toMatch(/email atau password salah/i);
  });

  it("login gagal dengan email tidak terdaftar → 401", async () => {
    const req = makeJsonRequest("http://test/api/auth/login", {
      email: "tidak-ada@uny.ac.id",
      password: "anyPassword",
    });

    const res = await loginPOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.category).toBe("auth");
  });

  it("login gagal dengan format email invalid → 400", async () => {
    const req = makeJsonRequest("http://test/api/auth/login", {
      email: "bukan-email",
      password: "anyPassword",
    });

    const res = await loginPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
  });

  it("normalisasi email lowercase saat login", async () => {
    await createAdminOnly({
      email: "lowercase@uny.ac.id",
      password: "testPass123",
    });

    // Login dengan UPPERCASE — Zod schema harus normalize ke lowercase
    const req = makeJsonRequest("http://test/api/auth/login", {
      email: "LOWERCASE@UNY.AC.ID",
      password: "testPass123",
    });

    const res = await loginPOST(req);
    expect(res.status).toBe(200);
  });

  it("rate limit login pada percobaan ke-6 untuk IP dan email sama → 429", async () => {
    await createAdminOnly({
      email: "limited@uny.ac.id",
      password: "correctPassword",
    });

    function makeLimitedLoginRequest() {
      return new Request("http://test/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify({
          email: "limited@uny.ac.id",
          password: "wrongPassword",
        }),
      });
    }

    for (let i = 0; i < 5; i++) {
      const res = await loginPOST(makeLimitedLoginRequest());
      expect(res.status).toBe(401);
    }

    const limitedRes = await loginPOST(makeLimitedLoginRequest());
    const json = await limitedRes.json();

    expect(limitedRes.status).toBe(429);
    expect(json.error.category).toBe("rate_limit");
  });
});
