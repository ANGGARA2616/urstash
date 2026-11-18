import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/items/route";
import { db } from "@/db";

// ============================================================================
// TEST DOUBLES SETUP
// ============================================================================

// Stub: @/lib/supabase/server createClient untuk mengisolasi Next.js cookies dan Supabase Auth SDK
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-vault-owner" } },
      }),
    },
  }),
}));

// Mock: @/db (Drizzle ORM) untuk memverifikasi pemanggilan insert dan data yang disimpan
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
  },
}));

describe("Fitur 1: Vault Item Creation (app/api/items/route.ts - POST)", () => {
  const mockValues = vi.fn();
  const mockReturning = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock query fluent chain: db.insert(items).values(...).returning()
    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockReturning.mockResolvedValue([
      {
        id: "item-created-uuid",
        userId: "user-vault-owner",
        title: "Test Item",
        type: "note",
        content: { body: "Content text" },
        createdAt: new Date(),
      },
    ]);
  });

  // --------------------------------------------------------------------------
  // ITEM-CREATE-TC-01: Positif - Judul batas minimum valid (1 karakter)
  // --------------------------------------------------------------------------
  it("ITEM-CREATE-TC-01: should create note item with status 201 when title is 1 character (BVA Min)", async () => {
    // Arrange: Dummy Request dengan judul batas bawah valid (1 karakter)
    const dummyRequest = new Request("https://urstash.app/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "note",
        title: "A",
        content: { body: "Valid note body content" },
      }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(json.item).toBeDefined();
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-vault-owner",
        title: "A",
        type: "note",
      }),
    );
  });

  // --------------------------------------------------------------------------
  // ITEM-CREATE-TC-02: Positif - Judul tepat batas maksimum valid (500 karakter)
  // --------------------------------------------------------------------------
  it("ITEM-CREATE-TC-02: should create link item with status 201 when title is 500 characters (BVA Max)", async () => {
    // Arrange: Judul 500 karakter alfabet
    const maxTitle = "T".repeat(500);
    const dummyRequest = new Request("https://urstash.app/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "link",
        title: maxTitle,
        content: { url: "https://example.com" },
      }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(json.item).toBeDefined();
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        title: maxTitle,
        type: "link",
      }),
    );
  });

  // --------------------------------------------------------------------------
  // ITEM-CREATE-TC-03: Positif - Pembuatan item prompt dengan ekstraksi variabel otomatis
  // --------------------------------------------------------------------------
  it("ITEM-CREATE-TC-03: should extract prompt variables automatically when type is prompt", async () => {
    // Arrange: Prompt bertemplate variabel {{topic}} dan {{language}}
    const dummyRequest = new Request("https://urstash.app/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "prompt",
        title: "AI Review Prompt",
        content: {
          promptText: "Explain {{topic}} using {{language}} code examples.",
        },
      }),
    });

    // Act
    const response = await POST(dummyRequest);

    // Assert
    expect(response.status).toBe(201);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "prompt",
        content: expect.objectContaining({
          promptText: "Explain {{topic}} using {{language}} code examples.",
          variables: ["topic", "language"],
        }),
      }),
    );
  });

  // --------------------------------------------------------------------------
  // ITEM-CREATE-TC-04: Negatif - Judul berupa string kosong (0 karakter, di bawah batas minimum)
  // --------------------------------------------------------------------------
  it("ITEM-CREATE-TC-04: should return 400 Invalid item when title is empty string (BVA Min-)", async () => {
    // Arrange: Judul kosong melanggar batasan min(1) pada schema
    const dummyRequest = new Request("https://urstash.app/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "note",
        title: "",
        content: { body: "Body with empty title" },
      }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid item");
    expect(db.insert).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // ITEM-CREATE-TC-05: Negatif - Judul melebihi batas maksimum (501 karakter)
  // --------------------------------------------------------------------------
  it("ITEM-CREATE-TC-05: should return 400 Invalid item when title is 501 characters (BVA Max+)", async () => {
    // Arrange: Judul 501 karakter melanggar batasan max(500)
    const overMaxTitle = "A".repeat(501);
    const dummyRequest = new Request("https://urstash.app/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "link",
        title: overMaxTitle,
        content: { url: "https://example.com" },
      }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid item");
    expect(db.insert).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // ITEM-CREATE-TC-06: Negatif - Format body bukan JSON valid (catch parsing error)
  // --------------------------------------------------------------------------
  it("ITEM-CREATE-TC-06: should return 400 Invalid JSON when body is malformed JSON", async () => {
    // Arrange: Objek Request dengan body teks rusak
    const dummyRequest = new Request("https://urstash.app/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ corrupt_json: ",
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid JSON");
    expect(db.insert).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // ITEM-CREATE-TC-07: Negatif - Bentuk content tidak sesuai tipe (link tanpa URL valid)
  // --------------------------------------------------------------------------
  it("ITEM-CREATE-TC-07: should return 400 when content does not conform to type schema", async () => {
    // Arrange: Tipe link namun URL bukan tautan valid
    const dummyRequest = new Request("https://urstash.app/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "link",
        title: "Invalid Link Item",
        content: { url: "bukan_sebuah_url" },
      }),
    });

    // Act
    const response = await POST(dummyRequest);
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid content for type "link"');
    expect(db.insert).not.toHaveBeenCalled();
  });
});
