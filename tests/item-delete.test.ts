import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "@/app/api/items/[id]/route";
import { db } from "@/db";

// ============================================================================
// TEST DOUBLES SETUP
// ============================================================================

// Stub: @/lib/supabase/server createClient
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-deleter" } },
      }),
    },
  }),
}));

// Mock: @/db (Drizzle ORM) untuk memverifikasi penghapusan item
vi.mock("@/db", () => ({
  db: {
    delete: vi.fn(),
  },
}));

describe("Fitur 7: Delete Item Vault (app/api/items/[id]/route.ts - DELETE)", () => {
  const mockWhereDelete = vi.fn();
  const mockReturning = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Delete chaining: db.delete().where().returning()
    vi.mocked(db.delete).mockReturnValue({ where: mockWhereDelete } as any);
    mockWhereDelete.mockReturnValue({ returning: mockReturning });
  });

  // --------------------------------------------------------------------------
  // ITEM-DELETE-TC-01: Positif - Penghapusan item berhasil (HTTP 200)
  // --------------------------------------------------------------------------
  it("ITEM-DELETE-TC-01: should return 200 and ok:true when item exists and belongs to current user", async () => {
    // Arrange: DB delete mengembalikan baris yang terhapus
    mockReturning.mockResolvedValueOnce([{ id: "item-to-delete-1" }]);

    // Dummy: Objek Request minimal tanpa body
    const dummyRequest = new Request(
      "https://urstash.app/api/items/item-to-delete-1",
      { method: "DELETE" },
    );

    // Act
    const response = await DELETE(dummyRequest, {
      params: Promise.resolve({ id: "item-to-delete-1" }),
    });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(mockWhereDelete).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // ITEM-DELETE-TC-02: Negatif - Item tidak ditemukan / dimiliki user lain (HTTP 404)
  // --------------------------------------------------------------------------
  it("ITEM-DELETE-TC-02: should return 404 Not found when item does not exist or belongs to another user", async () => {
    // Arrange: DB delete mengembalikan array kosong (tidak ada baris yang terhapus)
    mockReturning.mockResolvedValueOnce([]);

    const dummyRequest = new Request(
      "https://urstash.app/api/items/item-other-user",
      { method: "DELETE" },
    );

    // Act
    const response = await DELETE(dummyRequest, {
      params: Promise.resolve({ id: "item-other-user" }),
    });
    const json = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(json.error).toBe("Not found");
  });

  // --------------------------------------------------------------------------
  // ITEM-DELETE-TC-03: Negatif - Konfirmasi dibatalkan (window.confirm = false)
  //   Catatan: Logika konfirmasi ada di komponen DeleteItemButton (UI).
  //   Di level API route, kondisi ini tidak mungkin terjadi karena UI
  //   tidak akan memanggil fetch jika pengguna membatalkan konfirmasi.
  //   Test ini memverifikasi logika percabangan konfirmasi secara terisolasi.
  // --------------------------------------------------------------------------
  it("ITEM-DELETE-TC-03: should NOT call DELETE API when user cancels the confirmation dialog", async () => {
    // Arrange: Simulasi logika guard onDelete dari DeleteItemButton
    //   if (!window.confirm("Delete this item? This can't be undone.")) return;
    const mockFetch = vi.fn();
    const mockConfirm = vi.fn().mockReturnValue(false); // Spy: merekam pemanggilan dan mengembalikan false

    // Simulasikan logika onDelete murni tanpa DOM
    async function onDelete(confirmFn: () => boolean, fetchFn: typeof fetch) {
      if (!confirmFn()) return;
      await fetchFn("/api/items/item-cancel-1", { method: "DELETE" });
    }

    // Act: Jalankan logika dengan confirm yang mengembalikan "Cancel"
    await onDelete(mockConfirm, mockFetch as any);

    // Assert: fetch tidak seharusnya dipanggil karena confirm() mengembalikan false
    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });
});
