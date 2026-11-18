import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveUser, hashToken, generateToken, getSessionUser, withUser } from "@/lib/auth";
import { db } from "@/db";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// TEST DOUBLES SETUP
// ============================================================================

// Mocking @/db (Database Dependency)
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// Stubbing @/lib/supabase/server (Supabase Auth Client Dependency)
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("White-Box Unit Testing: resolveUser", () => {
  // Mock implementations for database fluent chaining
  const mockFrom = vi.fn();
  const mockWhereSelect = vi.fn();
  const mockLimit = vi.fn();

  const mockSet = vi.fn();
  const mockWhereUpdate = vi.fn();

  // Stub for Supabase auth.getUser
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup DB select chain: db.select().from().where().limit()
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);
    mockFrom.mockReturnValue({ where: mockWhereSelect });
    mockWhereSelect.mockReturnValue({ limit: mockLimit });

    // Setup DB update chain: db.update().set().where()
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as any);
    mockSet.mockReturnValue({ where: mockWhereUpdate });
    mockWhereUpdate.mockResolvedValue(undefined as any);

    // Setup Supabase createClient stub: createClient().auth.getUser()
    // Default safe response: user is unauthenticated
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    } as any);
  });

  // --------------------------------------------------------------------------
  // AUTH-LOGIN-TC-01: Positif - Bearer token valid dan terdaftar di database
  // --------------------------------------------------------------------------
  it("AUTH-LOGIN-TC-01: should return user object when valid Bearer token is provided and found in database", async () => {
    // Arrange
    const rawToken = "valid_api_token_12345";
    const dummyRequest = new Request("https://urstash.app/api/items", {
      headers: {
        authorization: `Bearer ${rawToken}`,
      },
    });

    // Mock DB select returning registered token row
    mockLimit.mockResolvedValueOnce([{ userId: "user-bearer-001" }]);

    // Act
    const result = await resolveUser(dummyRequest);

    // Assert
    expect(result).toEqual({ id: "user-bearer-001" });
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(mockLimit).toHaveBeenCalledWith(1);
    // Verifikasi Spy bahwa lastUsedAt disentuh saat autentikasi token berhasil
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ lastUsedAt: expect.any(Date) }),
    );
  });

  // --------------------------------------------------------------------------
  // AUTH-LOGIN-TC-02: Negatif - Header Bearer ada namun string token kosong / hanya spasi
  // --------------------------------------------------------------------------
  it("AUTH-LOGIN-TC-02: should return null when Authorization header has Bearer prefix but empty token", async () => {
    // Arrange: Menggunakan dummy Request dengan header stubbed untuk menguji penanganan token kosong
    const dummyRequest = new Request("https://urstash.app/api/items");
    vi.spyOn(dummyRequest.headers, "get").mockImplementation((name: string) => {
      if (name.toLowerCase() === "authorization") return "Bearer ";
      return null;
    });

    // Act
    const result = await resolveUser(dummyRequest);

    // Assert
    expect(result).toBeNull();
    // Database tidak boleh dipanggil jika token kosong
    expect(db.select).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // AUTH-LOGIN-TC-03: Negatif - Bearer token tidak ditemukan di database (invalid / revoked)
  // --------------------------------------------------------------------------
  it("AUTH-LOGIN-TC-03: should return null when Bearer token is not found in database", async () => {
    // Arrange
    const rawToken = "unregistered_token_xyz";
    const dummyRequest = new Request("https://urstash.app/api/items", {
      headers: {
        authorization: `Bearer ${rawToken}`,
      },
    });

    // Mock DB select returning empty result
    mockLimit.mockResolvedValueOnce([]);

    // Act
    const result = await resolveUser(dummyRequest);

    // Assert
    expect(result).toBeNull();
    expect(db.select).toHaveBeenCalledTimes(1);
    // lastUsedAt tidak boleh diupdate jika token tidak valid
    expect(db.update).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // AUTH-LOGIN-TC-04: Positif - Tanpa Bearer token, sesi Supabase cookie terautentikasi
  // --------------------------------------------------------------------------
  it("AUTH-LOGIN-TC-04: should return user object from Supabase session when no Bearer header is present", async () => {
    // Arrange
    const dummyRequest = new Request("https://urstash.app/api/items", {
      headers: {},
    });

    // Stub Supabase session returning active user
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-supabase-777" } },
    });

    // Act
    const result = await resolveUser(dummyRequest);

    // Assert
    expect(result).toEqual({ id: "user-supabase-777" });
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(db.select).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // AUTH-LOGIN-TC-05: Negatif - Tanpa Bearer token dan sesi Supabase tidak valid (unauthenticated)
  // --------------------------------------------------------------------------
  it("AUTH-LOGIN-TC-05: should return null when no Bearer header and Supabase session has no active user", async () => {
    // Arrange
    const dummyRequest = new Request("https://urstash.app/api/items", {
      headers: {},
    });

    // Stub Supabase session returning null user
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    // Act
    const result = await resolveUser(dummyRequest);

    // Assert
    expect(result).toBeNull();
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(db.select).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // AUTH-LOGIN-TC-06: Edge Case: Header authorization ada tetapi bukan diawali Bearer (mis. Basic auth)
  // --------------------------------------------------------------------------
  it("AUTH-LOGIN-TC-06: should fallback to Supabase session when authorization header is non-Bearer", async () => {
    // Arrange
    const dummyRequest = new Request("https://urstash.app/api/items", {
      headers: {
        authorization: "Basic dXNlcjpwYXNz",
      },
    });

    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-basic-fallback" } },
    });

    // Act
    const result = await resolveUser(dummyRequest);

    // Assert
    expect(result).toEqual({ id: "user-basic-fallback" });
    expect(db.select).not.toHaveBeenCalled();
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});

describe("Unit Testing: Supplementary Auth Utilities", () => {
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
    } as any);
  });

  it("generateToken: should generate a random base64url token of sufficient length", () => {
    // Act
    const token = generateToken();

    // Assert
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(30);
  });

  it("getSessionUser: should return user when cookie session is valid", async () => {
    // Arrange
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-session-123" } },
    });

    // Act
    const user = await getSessionUser();

    // Assert
    expect(user).toEqual({ id: "user-session-123" });
  });

  it("getSessionUser: should return null when cookie session has no user", async () => {
    // Arrange
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    // Act
    const user = await getSessionUser();

    // Assert
    expect(user).toBeNull();
  });

  it("withUser: should return 401 Response if user is unauthenticated", async () => {
    // Arrange
    const handler = vi.fn();
    const wrapped = withUser(handler);
    const req = new Request("https://urstash.app/api/protected");
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    // Act
    const response = await wrapped(req);

    // Assert
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json).toEqual({ error: "Unauthorized" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("withUser: should invoke handler with user and route params when authenticated", async () => {
    // Arrange
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withUser(handler);
    const req = new Request("https://urstash.app/api/protected");
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-auth-pass" } } });
    const routeCtx = { params: Promise.resolve({ id: "item-999" }) };

    // Act
    const response = await wrapped(req, routeCtx);

    // Assert
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(req, {
      user: { id: "user-auth-pass" },
      params: { id: "item-999" },
    });
  });

  it("withUser: should handle route without routeCtx gracefully", async () => {
    // Arrange
    const handler = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withUser(handler);
    const req = new Request("https://urstash.app/api/protected");
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-auth-pass" } } });

    // Act
    const response = await wrapped(req);

    // Assert
    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(req, {
      user: { id: "user-auth-pass" },
      params: {},
    });
  });
});
