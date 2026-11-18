// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

// ============================================================================
// TEST DOUBLES SETUP
// ============================================================================

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockSignUp = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  })),
}));

describe("Fitur 4: User Registration (app/login/page.tsx - mode signup)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // USER-REG-TC-01: Positif - Pendaftaran berhasil dengan data valid dan sandi cocok
  // --------------------------------------------------------------------------
  it("USER-REG-TC-01: should register successfully and show confirmation message when inputs are valid and passwords match", async () => {
    // Arrange: Stub respon signUp Supabase sukses tanpa error
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "user-new-001", email: "newuser@test.com" } },
      error: null,
    });

    render(<LoginPage />);

    // Beralih ke tab pendaftaran akun baru ("Create an account")
    fireEvent.click(screen.getByRole("button", { name: /create an account/i }));

    // Isi formulir pendaftaran
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "newuser@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your display name"), {
      target: { value: "anggara" },
    });
    // Dua field password: password & confirm password
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], { target: { value: "secret123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "secret123" } });

    // Act: Submit formulir registrasi
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Assert: Verifikasi pemanggilan Supabase signUp dan kemunculan pesan konfirmasi
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "newuser@test.com",
        password: "secret123",
        options: { data: { username: "anggara" } },
      });
      expect(
        screen.getByText(/Account created\. If email confirmation is on/i),
      ).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // USER-REG-TC-02: Negatif - Ketidakcocokan konfirmasi kata sandi (password mismatch)
  // --------------------------------------------------------------------------
  it("USER-REG-TC-02: should prevent submission and display Passwords do not match when passwords differ", async () => {
    // Arrange
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /create an account/i }));

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user2@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your display name"), {
      target: { value: "tester" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], { target: { value: "secret123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "differentPassword" } });

    // Act: Submit formulir dengan konfirmasi password tidak cocok
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Assert: Tampil pesan kesalahan dan API signUp tidak dipanggil
    await waitFor(() => {
      expect(
        screen.getAllByText("Passwords do not match.").length,
      ).toBeGreaterThanOrEqual(1);
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // USER-REG-TC-03: Negatif - Penolakan pendaftaran oleh Supabase (mis. email telah terdaftar)
  // --------------------------------------------------------------------------
  it("USER-REG-TC-03: should display error message returned by Supabase Auth on registration failure", async () => {
    // Arrange: Stub respon signUp Supabase menghasilkan error duplikasi email
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "User already registered" },
    });

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /create an account/i }));

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "existing@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your display name"), {
      target: { value: "existinguser" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], { target: { value: "secret123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "secret123" } });

    // Act
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1);
      expect(screen.getByText("User already registered")).toBeDefined();
    });
  });
});
