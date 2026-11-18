import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/items/[id]/route";
import { db } from "@/db";

// ============================================================================
// TEST DOUBLES SETUP
// ============================================================================

// Stub: @/lib/supabase/server createClient
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-updater" } },
      }),
    },
  }),
}));

// Mock: @/db (Drizzle ORM)
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

describe("Fitur 6: Update Item Vault (app/api/items/[id]/route.ts - PATCH)", () => {
  const mockFrom = vi.fn();
  const mockWhereSelect = vi.fn();
  const mockLimit = vi.fn();

  const mockSet = vi.fn();
  const mockWhereUpdate = vi.fn();
  const mockReturning = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Select chaining: db.select().from().where().limit()
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);
    mockFrom.mockReturnValue({ where: mockWhereSelect });
    mockWhereSelect.mockReturnValue({ limit: mockLimit });

    // Update chaining: db.update().set().where().returning()
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as any);
    mockSet.mockReturnValue({ where: mockWhereUpdate });
    mockWhereUpdate.mockReturnValue({ returning: mockReturning });
  });

  // --------------------------------------------------------------------------
  // ITEM-UPDATE-TC-01: Positif - Pembaruan judul item berhasil
  // --------------------------------------------------------------------------
  it("ITEM-UPDATE-TC-01: should update item title successfully and return 200 with updated row", async () => {
    // Arrange: Item eksisting bertipe note ditemukan
    mockLimit.mockResolvedValueOnce([{ type: "note" }]);
    mockReturning.mockResolvedValueOnce([
      {
        id: "item-edit-1",
        userId: "user-updater",
        title: "Updated Title Note",
        type: "note",
        updatedAt: new Date(),
      },
    ]);

    const dummyRequest = new Request("https://urstash.app/api/items/item-edit-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title Note" }),
    });

    // Act
    const response = await PATCH(dummyRequest, {
      params: Promise.resolve({ id: "item-edit-1" }),
    });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(json.item.title).toBe("Updated Title Note");
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Updated Title Note",
        updatedAt: expect.any(Date),
      }),
    );
  });

  // --------------------------------------------------------------------------
  // ITEM-UPDATE-TC-02: Positif - Pembaruan konten prompt mengekstrak variabel baru
  // --------------------------------------------------------------------------
  it("ITEM-UPDATE-TC-02: should update prompt content and extract variables when item type is prompt", async () => {
    // Arrange: Item eksisting bertipe prompt
    mockLimit.mockResolvedValueOnce([{ type: "prompt" }]);
    mockReturning.mockResolvedValueOnce([
      {
        id: "item-edit-prompt",
        userId: "user-updater",
        type: "prompt",
        content: {
          promptText: "Summarize {{book}} in {{style}}.",
          variables: ["book", "style"],
        },
      },
    ]);

    const dummyRequest = new Request("https://urstash.app/api/items/item-edit-prompt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { promptText: "Summarize {{book}} in {{style}}." },
      }),
    });

    // Act
    const response = await PATCH(dummyRequest, {
      params: Promise.resolve({ id: "item-edit-prompt" }),
    });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          variables: ["book", "style"],
        }),
      }),
    );
  });

  // --------------------------------------------------------------------------
  // ITEM-UPDATE-TC-03: Negatif - Item ID tidak ditemukan pada akun user (HTTP 404)
  // --------------------------------------------------------------------------
  it("ITEM-UPDATE-TC-03: should return 404 Not found when item does not exist or belongs to another user", async () => {
    // Arrange: DB select mengembalikan array kosong []
    mockLimit.mockResolvedValueOnce([]);

    const dummyRequest = new Request("https://urstash.app/api/items/item-nonexistent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Title" }),
    });

    // Act
    const response = await PATCH(dummyRequest, {
      params: Promise.resolve({ id: "item-nonexistent" }),
    });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(json.error).toBe("Not found");
    expect(db.update).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // ITEM-UPDATE-TC-04: Negatif - Format body bukan JSON valid (catch parsing error)
  // --------------------------------------------------------------------------
  it("ITEM-UPDATE-TC-04: should return 400 Invalid JSON when payload is malformed", async () => {
    // Arrange: Request body rusak
    const dummyRequest = new Request("https://urstash.app/api/items/item-123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{ unclosed_json: ",
    });

    // Act
    const response = await PATCH(dummyRequest, {
      params: Promise.resolve({ id: "item-123" }),
    });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid JSON");
    expect(db.select).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // ITEM-UPDATE-TC-05: Negatif - Konten baru tidak sesuai skema tipe item eksisting
  // --------------------------------------------------------------------------
  it("ITEM-UPDATE-TC-05: should return 400 when updated content fails schema validation for existing item type", async () => {
    // Arrange: Item eksisting bertipe link
    mockLimit.mockResolvedValueOnce([{ type: "link" }]);

    // Memberikan konten link tanpa url (invalid link content)
    const dummyRequest = new Request("https://urstash.app/api/items/item-link-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { invalidField: 123 },
      }),
    });

    // Act
    const response = await PATCH(dummyRequest, {
      params: Promise.resolve({ id: "item-link-1" }),
    });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid content for type "link"');
    expect(db.update).not.toHaveBeenCalled();
  });
});
