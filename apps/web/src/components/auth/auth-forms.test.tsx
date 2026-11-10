import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("./auth-provider", () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
  }),
}));
vi.mock("@/components/preferences/preferences-provider", () => ({
  usePreferences: () => ({ t: (key: string) => key }),
}));

import { LoginForm, MIN_PASSWORD_LENGTH, SignupForm } from "./auth-forms";

describe("Melyia authentication password policy", () => {
  it("uses an eight-character minimum for sign in", () => {
    render(<LoginForm />);

    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(screen.getByLabelText("Password")).toHaveAttribute("minlength", "8");
  });

  it("uses the same eight-character minimum for signup and confirmation", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText("Password")).toHaveAttribute("minlength", "8");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("minlength", "8");
    expect(screen.getByText("Use at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Customer/)).toBeChecked();
    expect(screen.getByLabelText(/Seller/)).not.toBeChecked();
  });
});
