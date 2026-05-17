import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// ----- Mocks -----
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const signInMock = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ signIn: signInMock }),
}));

vi.mock("@/integrations/lovable", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

vi.mock("@/lib/postLoginRedirect", () => ({
  getPostLoginPath: vi.fn(async () => "/dashboard"),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const { mfa, auth } = vi.hoisted(() => {
  const mfa = {
    getAuthenticatorAssuranceLevel: vi.fn(),
    listFactors: vi.fn(),
    challenge: vi.fn(),
    verify: vi.fn(),
  };
  const auth = {
    mfa,
    getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    signOut: vi.fn(async () => ({ error: null })),
  };
  return { mfa, auth };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth },
}));

vi.mock("@/components/AuthLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Stub InputOTP so we can drive the OTP value with a plain input
vi.mock("@/components/ui/input-otp", () => {
  const InputOTP = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input data-testid="otp" value={value} onChange={(e) => onChange(e.target.value)} />
  );
  const Pass = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return { InputOTP, InputOTPGroup: Pass, InputOTPSlot: () => null };
});

import Login from "@/pages/Login";

const renderLogin = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </HelmetProvider>,
  );

const submitCredentials = async () => {
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("••••••••"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

beforeEach(() => {
  vi.clearAllMocks();
  signInMock.mockResolvedValue({ error: null });
});

describe("Login MFA flow", () => {
  it("redirects directly when user has no MFA enrolled", async () => {
    mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal1" },
    });

    renderLogin();
    await act(async () => {
      await submitCredentials();
    });

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true }));
    expect(mfa.listFactors).not.toHaveBeenCalled();
    expect(screen.queryByText(/two-factor authentication/i)).not.toBeInTheDocument();
  });

  it("prompts for code and signs in on valid TOTP", async () => {
    mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
    });
    mfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: "factor-1", status: "verified" }] },
    });
    mfa.challenge.mockResolvedValue({ data: { id: "ch-1" }, error: null });
    mfa.verify.mockResolvedValue({ data: {}, error: null });

    renderLogin();
    await act(async () => {
      await submitCredentials();
    });

    await screen.findByText(/two-factor authentication/i);
    expect(navigateMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("otp"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true }));
    expect(mfa.challenge).toHaveBeenCalledWith({ factorId: "factor-1" });
    expect(mfa.verify).toHaveBeenCalledWith({
      factorId: "factor-1",
      challengeId: "ch-1",
      code: "123456",
    });
  });

  it("shows error and stays on MFA step when code is invalid", async () => {
    mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
    });
    mfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: "factor-1", status: "verified" }] },
    });
    mfa.challenge.mockResolvedValue({ data: { id: "ch-1" }, error: null });
    mfa.verify.mockResolvedValue({ data: null, error: { message: "Invalid TOTP code" } });

    renderLogin();
    await act(async () => {
      await submitCredentials();
    });

    await screen.findByText(/two-factor authentication/i);
    fireEvent.change(screen.getByTestId("otp"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive", title: "Invalid code" }),
      ),
    );
    expect(navigateMock).not.toHaveBeenCalled();
    // still on MFA screen
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
  });

  it("skips MFA prompt when no verified factor exists", async () => {
    mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
    });
    mfa.listFactors.mockResolvedValue({
      data: { totp: [{ id: "factor-1", status: "unverified" }] },
    });

    renderLogin();
    await act(async () => {
      await submitCredentials();
    });

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true }));
    expect(screen.queryByText(/two-factor authentication/i)).not.toBeInTheDocument();
  });
});
