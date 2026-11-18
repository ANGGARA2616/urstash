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

const mockResetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}));

describe("Fitur 5: User Forgot Password (app/login/page.tsx - mode forgot)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // FORGOT-PWD-TC-01: Positif - Permintaan kirim tautan reset sandi berhasil
  // --------------------------------------------------------------------------
  it("FORGOT-PWD-TC-01: should send reset link and show success message when email is valid", async () => {
    // Arrange: Stub respon sukses tanpa error
    mockResetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    render(<LoginPage />);

    // Beralih ke mode Forgot Password
    fireEvent.click(screen.getByRole("button", { name: /forgot password\?/i }));

    // Input email
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@test.com" },
    });

    // Act: Submit formulir reset password
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    // Assert: Verifikasi pemanggilan resetPasswordForEmail dan pesan sukses tampil
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "user@test.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/auth/callback?next=/auth/reset-password"),
        }),
      );
      expect(
        screen.getByText("Reset link sent — check your email."),
      ).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // FORGOT-PWD-TC-02: Negatif - Penolakan akibat Rate Limit (HTTP 429)
  // --------------------------------------------------------------------------
  it("FORGOT-PWD-TC-02: should display rate limit warning when status is 429", async () => {
    // Arrange: Stub respon Supabase menghasilkan status 429 (Too many requests)
    mockResetPasswordForEmail.mockResolvedValueOnce({
      data: null,
      error: { status: 429, message: "Rate limit exceeded" },
    });

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /forgot password\?/i }));

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "user@test.com" },
    });

    // Act
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    // Assert: Menampilkan pesan spesifik rate limit sesuai logika kode
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText("Too many requests — wait a minute and try again."),
      ).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // FORGOT-PWD-TC-03: Negatif - Penolakan akibat error umum Supabase
  // --------------------------------------------------------------------------
  it("FORGOT-PWD-TC-03: should display error message returned by provider on failure", async () => {
    // Arrange: Stub respon error umum dari Supabase Auth
    mockResetPasswordForEmail.mockResolvedValueOnce({
      data: null,
      error: { status: 400, message: "User not found" },
    });

    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /forgot password\?/i }));

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "unregistered@test.com" },
    });

    // Act
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    // Assert
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
      expect(screen.getByText("User not found")).toBeDefined();
    });
  });
});
