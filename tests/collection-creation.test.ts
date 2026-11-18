import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/collections/route";
import { db } from "@/db";

// ============================================================================
// TEST DOUBLES SETUP
// ============================================================================

// Stub: @/lib/supabase/server createClient mengembalikan user terautentikasi
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-collection-owner" } },
      }),
    },
  }),
}));

// Mock: @/db insert query chaining
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
  },
}));

describe("Fitur 2: Collection Creation (app/api/collections/route.ts - POST)", () => {
  const mockValues = vi.fn();
  const mockReturning = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockReturning.mockResolvedValue([
      {
        id: "col-uuid-12345",
        userId: "user-collection-owner",
        name: "Test Collection",
        createdAt: new Date(),
      },
    ]);
  });

  // --------------------------------------------------------------------------
  // COLL-CREATE-TC-01: Positif - Nama koleksi batas minimum valid (1 karakter)
  // --------------------------------------------------------------------------
  it("COLL-CREATE-TC-01: should create collection with status 201 when name is 1 character (BVA Min)", async () => {
    // Arrange: Dummy Request dengan payload nama koleksi 1 karakter
    const dummyRequest = new Request("https://urstash.app/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "K" }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(json.collection).toBeDefined();
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith({
      userId: "user-collection-owner",
      name: "K",
    });
  });

  // --------------------------------------------------------------------------
  // COLL-CREATE-TC-02: Positif - Nama koleksi tepat batas maksimum valid (200 karakter)
  // --------------------------------------------------------------------------
  it("COLL-CREATE-TC-02: should create collection with status 201 when name is 200 characters (BVA Max)", async () => {
    // Arrange: Dummy Request dengan nama koleksi 200 karakter penuh
    const maxName = "C".repeat(200);
    const dummyRequest = new Request("https://urstash.app/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: maxName }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(json.collection).toBeDefined();
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith({
      userId: "user-collection-owner",
      name: maxName,
    });
  });

  // --------------------------------------------------------------------------
  // COLL-CREATE-TC-03: Negatif - Nama koleksi berupa string kosong (0 karakter)
  // --------------------------------------------------------------------------
  it("COLL-CREATE-TC-03: should return 400 Invalid collection when name is empty string (BVA Min-)", async () => {
    // Arrange: Nama kosong melanggar batasan min(1)
    const dummyRequest = new Request("https://urstash.app/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid collection");
    expect(db.insert).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // COLL-CREATE-TC-04: Negatif - Nama koleksi melebihi batas maksimum (201 karakter)
  // --------------------------------------------------------------------------
  it("COLL-CREATE-TC-04: should return 400 Invalid collection when name is 201 characters (BVA Max+)", async () => {
    // Arrange: Nama 201 karakter melanggar batasan max(200)
    const overMaxName = "C".repeat(201);
    const dummyRequest = new Request("https://urstash.app/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: overMaxName }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid collection");
    expect(db.insert).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // COLL-CREATE-TC-05: Negatif - Body request rusak / bukan format JSON valid
  // --------------------------------------------------------------------------
  it("COLL-CREATE-TC-05: should return 400 Invalid collection when request body is malformed JSON", async () => {
    // Arrange: Request payload rusak
    const dummyRequest = new Request("https://urstash.app/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json-body",
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid collection");
    expect(db.insert).not.toHaveBeenCalled();
  });
});
