import { describe, it, expect, vi } from "vitest";
import {
  createItemSchema,
  updateItemSchema,
  contentSchemaFor,
} from "@/lib/content-schemas";
import { listItems } from "@/lib/queries";
import { db } from "@/db";

// ============================================================================
// TEST DOUBLES SETUP
// ============================================================================

// Mock: @/db untuk listItems agar tidak menyentuh DB fisik
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

// ============================================================================
// Fitur 3: User Login - Analisis logika validasi schema pada API
// ============================================================================

describe("Fitur 3: User Login - Validasi Schema (createItemSchema / updateItemSchema)", () => {
  // --------------------------------------------------------------------------
  // LOGIN-TC-01: Positif - Schema validasi menerima data item valid
  // --------------------------------------------------------------------------
  it("LOGIN-TC-01: createItemSchema should accept valid note item data", () => {
    // Arrange: Data valid sesuai schema
    const validData = {
      type: "note",
      title: "My first note",
      content: { body: "Hello world" },
      tags: [],
    };

    // Act
    const result = createItemSchema.safeParse(validData);

    // Assert
    expect(result.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // LOGIN-TC-02: Negatif - Schema validasi menolak tipe item tidak valid
  // --------------------------------------------------------------------------
  it("LOGIN-TC-02: createItemSchema should reject invalid item type", () => {
    // Arrange: Tipe tidak termasuk dalam ITEM_TYPES enum
    const invalidData = {
      type: "unknown_type",
      title: "Some item",
      content: {},
    };

    // Act
    const result = createItemSchema.safeParse(invalidData);

    // Assert
    expect(result.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // LOGIN-TC-03: Positif - updateItemSchema menerima pembaruan parsial
  // --------------------------------------------------------------------------
  it("LOGIN-TC-03: updateItemSchema should accept partial update with only title", () => {
    // Arrange: Pembaruan parsial hanya judul
    const partialUpdate = { title: "Updated title" };

    // Act
    const result = updateItemSchema.safeParse(partialUpdate);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe("Updated title");
  });

  // --------------------------------------------------------------------------
  // LOGIN-TC-04: Negatif - updateItemSchema menolak judul yang terlalu panjang
  // --------------------------------------------------------------------------
  it("LOGIN-TC-04: updateItemSchema should reject title exceeding max 500 characters", () => {
    // Arrange: Judul 501 karakter melanggar max(500)
    const tooLongTitle = { title: "A".repeat(501) };

    // Act
    const result = updateItemSchema.safeParse(tooLongTitle);

    // Assert
    expect(result.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // LOGIN-TC-05: Positif - contentSchemaFor mengembalikan schema yang tepat per tipe
  // --------------------------------------------------------------------------
  it("LOGIN-TC-05: contentSchemaFor should return link schema for type link and tool", () => {
    // Arrange: Tipe link dan tool berbagi schema yang sama
    const linkSchema = contentSchemaFor("link");
    const toolSchema = contentSchemaFor("tool");
    const validContent = { url: "https://example.com" };

    // Act
    const linkResult = linkSchema.safeParse(validContent);
    const toolResult = toolSchema.safeParse(validContent);

    // Assert
    expect(linkResult.success).toBe(true);
    expect(toolResult.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // LOGIN-TC-06: Negatif - contentSchemaFor menolak konten screenshot tanpa imageUrl
  // --------------------------------------------------------------------------
  it("LOGIN-TC-06: contentSchemaFor should reject screenshot content without imageUrl", () => {
    // Arrange: Screenshot tanpa imageUrl wajib
    const screenshotSchema = contentSchemaFor("screenshot");
    const invalidContent = { sourceUrl: "https://example.com" };

    // Act
    const result = screenshotSchema.safeParse(invalidContent);

    // Assert
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Fitur 8: Filter Tipe Item - Logika listItems dengan filter type
// ============================================================================
describe("Fitur 8: Filter Tipe Item - listItems di lib/queries.ts", () => {
  const mockFrom = vi.fn();
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    // listItems mengembalikan query object (Drizzle lazy query)
    mockOrderBy.mockResolvedValue([]);
  });

  // --------------------------------------------------------------------------
  // FILTER-TC-01: Positif - Filter tipe valid (link) meneruskan kondisi ke query
  // --------------------------------------------------------------------------
  it("FILTER-TC-01: listItems should call db.select() and return items when filter type is valid", async () => {
    // Arrange: Filter dengan tipe "link" valid
    const userId = "user-filter-1";
    const filters = { type: "link" };

    // Act
    await listItems(userId, filters);

    // Assert
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockWhere).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // FILTER-TC-02: Positif - Tanpa filter type, semua tipe item dikembalikan
  // --------------------------------------------------------------------------
  it("FILTER-TC-02: listItems should call db.select() with no type filter when type is not provided", async () => {
    // Arrange: Tidak ada filter type
    const userId = "user-filter-2";
    const filters = {};

    // Act
    const result = await listItems(userId, filters);

    // Assert
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(Array.isArray(result) || typeof result === "object").toBe(true);
  });

  // --------------------------------------------------------------------------
  // FILTER-TC-03: Negatif - Filter tipe tidak valid diabaikan (bukan ITEM_TYPES)
  // --------------------------------------------------------------------------
  it("FILTER-TC-03: listItems should ignore invalid type filter and not reject query", async () => {
    // Arrange: Tipe "invalid_type" bukan bagian dari ITEM_TYPES
    //   Sesuai kode: if (f.type && ITEM_TYPES.includes(f.type)) { conditions.push(...) }
    //   Tipe invalid diabaikan, query tetap berjalan tanpa kondisi tipe
    const userId = "user-filter-3";
    const filters = { type: "invalid_type_xyz" };

    // Act - tidak boleh throw
    await expect(listItems(userId, filters)).resolves.toBeDefined();

    // Assert: select dipanggil (query tetap berjalan)
    expect(db.select).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Fitur 9: Search Item Vault - Logika listItems dengan filter q
// ============================================================================
describe("Fitur 9: Search Item Vault - listItems di lib/queries.ts", () => {
  const mockFrom = vi.fn();
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValue([]);
  });

  // --------------------------------------------------------------------------
  // SEARCH-TC-01: Positif - Kata kunci pencarian meneruskan kondisi ilike ke query
  // --------------------------------------------------------------------------
  it("SEARCH-TC-01: listItems should call db.select() when search query q is provided", async () => {
    // Arrange: Pencarian dengan kata kunci non-kosong
    const userId = "user-search-1";
    const filters = { q: "tutorial" };

    // Act
    await listItems(userId, filters);

    // Assert: Query dipanggil (kondisi ILIKE ditambahkan ke conditions)
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(mockWhere).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // SEARCH-TC-02: Positif - Tanpa kata kunci (q=null), tidak ada filter pencarian
  // --------------------------------------------------------------------------
  it("SEARCH-TC-02: listItems should call db.select() without search filter when q is null", async () => {
    // Arrange: Tidak ada kata kunci
    const userId = "user-search-2";
    const filters = { q: null };

    // Act
    await listItems(userId, filters);

    // Assert: Query tetap dipanggil, tidak throw
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // SEARCH-TC-03: Positif - Filter kombinasi type + q diproses bersamaan
  // --------------------------------------------------------------------------
  it("SEARCH-TC-03: listItems should process combined type and q filters together", async () => {
    // Arrange: Kombinasi filter tipe dan kata kunci
    const userId = "user-search-3";
    const filters = { type: "note", q: "supabase" };

    // Act
    await listItems(userId, filters);

    // Assert: Hanya satu select dipanggil (conditions di-AND bersama)
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // SEARCH-TC-04: Positif - Filter dengan limit yang ditetapkan
  // --------------------------------------------------------------------------
  it("SEARCH-TC-04: listItems should apply limit when limit filter is provided", async () => {
    // Arrange: Limit ke 10 item — query object harus memiliki .limit()
    const mockLimit = vi.fn().mockResolvedValue([]);
    mockOrderBy.mockReturnValue({ limit: mockLimit });

    const userId = "user-search-4";
    const filters = { q: "react", limit: 10 };

    // Act
    await listItems(userId, filters);

    // Assert: .limit(10) dipanggil di akhir query chain
    expect(mockLimit).toHaveBeenCalledWith(10);
  });
});
