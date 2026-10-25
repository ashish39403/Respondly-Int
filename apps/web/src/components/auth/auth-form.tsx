"use client";

import {
  useState,
  useSyncExternalStore,
  type FormEvent,
  type FocusEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
  FieldDescription,
  FieldSeparator,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authClient } from "@/lib/auth/client";
import { emailKind, endApiSession, saveAccount } from "@/lib/auth/account";

type AuthMode = "signup" | "login" | "reset";
type FieldName = "name" | "email" | "password" | "code";
type Errors = Partial<Record<FieldName, string>>;
type Step = "form" | "code";

const subscribeToHydration = () => () => {};
const getClientReady = () => true;
const getServerReady = () => false;

const content = {
  signup: {
    eyebrow: "A MORE THOUGHTFUL WAY TO SUPPORT",
    title: "Make room for",
    accent: "better conversations.",
    description: "Your knowledge. Your people. Your new workspace.",
    action: "Create account",
  },
  login: {
    eyebrow: "YOUR NEXT GOOD CONVERSATION",
    title: "Good to have",
    accent: "you back.",
    description: "Sign in to pick up right where you left off.",
    action: "Sign in",
  },
  reset: {
    eyebrow: "LET’S GET YOU BACK IN",
    title: "A fresh start",
    accent: "for your password.",
    description: "Enter your email and we’ll help you find your way back.",
    action: "Send reset link",
  },
};

function validateInput(
  input: HTMLInputElement,
  mode: AuthMode,
): string | undefined {
  if (input.name === "name" && !input.value.trim())
    return "Please enter your name.";
  if (input.name === "email") {
    if (!input.value.trim()) return "Please enter your email address.";
    if (input.validity.typeMismatch) return "Enter a valid email address.";
  }
  if (input.name === "password") {
    if (!input.value) return "Please enter your password.";
    if ((mode === "signup" || input.autocomplete === "new-password") && input.value.length < 8)
      return "Use at least 8 characters for your password.";
    if (input.value.length > 128)
      return "Use 128 characters or fewer for your password.";
  }
  if (input.name === "code" && !input.value.trim())
    return "Enter the code from your email.";
}

function signedUpUser(data: unknown): { emailVerified?: boolean } | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as { user?: { emailVerified?: boolean }; emailVerified?: boolean };
  if (record.user) return record.user;
  if ("emailVerified" in record) return record;
  return undefined;
}

function authError(error: unknown): { code?: string; status?: number; message: string } {
  if (!error || typeof error !== "object") {
    return { message: "Something went wrong. Try again." };
  }
  const record = error as { code?: unknown; status?: unknown; message?: unknown };
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    status: typeof record.status === "number" ? record.status : undefined,
    message:
      typeof record.message === "string" && record.message
        ? record.message
        : "Something went wrong. Try again.",
  };
}

function loginNoticeCopy(code: string): { title: string; message: string } | null {
  if (code === "password") {
    return {
      title: "Use your password",
      message: "This email already uses a password. Continue with email and password.",
    };
  }
  if (code === "google") {
    return {
      title: "Google",
      message: "Google didn’t sign you in. Continue with email, or try Google again.",
    };
  }
  return null;
}

function needsVerification(error: { code?: string; message: string }): boolean {
  if (error.code === "EMAIL_NOT_VERIFIED") return true;
  return /email verification|not verified/i.test(error.message);
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const copy = content[mode];
  const router = useRouter();
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    getClientReady,
    getServerReady,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [alertTitle, setAlertTitle] = useState("Check your email");
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resetTokenOverride, setResetTokenOverride] = useState<string | null | undefined>(
    undefined,
  );
  const [urlNoticeDismissed, setUrlNoticeDismissed] = useState(false);
  const resetTokenFromUrl = useSyncExternalStore(
    subscribeToHydration,
    () =>
      mode === "reset"
        ? (new URLSearchParams(window.location.search).get("token") ?? "")
        : "",
    () => "",
  );
  const loginNotice = useSyncExternalStore(
    subscribeToHydration,
    () =>
      mode === "login"
        ? (new URLSearchParams(window.location.search).get("notice") ?? "")
        : "",
    () => "",
  );
  const resetToken =
    resetTokenOverride === undefined ? resetTokenFromUrl || null : resetTokenOverride;
  const urlNotice = urlNoticeDismissed ? null : loginNoticeCopy(loginNotice);

  const showNotice = (title: string, message: string) => {
    setAlertTitle(title);
    setNotice(message);
  };

  const enterCodeStep = async (email: string) => {
    setPendingEmail(email);
    setStep("code");
    setErrors({});
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    if (error) {
      showNotice("Code not sent", authError(error).message);
      return;
    }
    showNotice("Check your email", `Enter the code sent to ${email}.`);
  };

  const finishSignIn = async () => {
    await saveAccount();
    router.push("/ready");
  };

  const continueWithGoogle = async () => {
    setNotice(null);
    setPending(true);
    const origin = window.location.origin;
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${origin}/ready`,
      newUserCallbackURL: `${origin}/ready`,
      errorCallbackURL: `${origin}/login?notice=google`,
    });
    if (error) showNotice("Google", authError(error).message);
    setPending(false);
  };

  const onBlur = (event: FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    setErrors((current) => ({
      ...current,
      [input.name]: validateInput(input, mode),
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setUrlNoticeDismissed(true);
    const form = event.currentTarget;
    const fields: FieldName[] = resetToken
      ? ["password"]
      : step === "code"
        ? ["code"]
        : mode === "signup"
          ? ["name", "email", "password"]
          : mode === "login"
            ? ["email", "password"]
            : ["email"];
    const nextErrors: Errors = {};
    for (const name of fields) {
      const input = form.elements.namedItem(name) as HTMLInputElement;
      const error = validateInput(input, mode);
      if (error) nextErrors[name] = error;
    }
    setErrors(nextErrors);
    const firstInvalid = fields.find((name) => nextErrors[name]);
    if (firstInvalid) {
      (form.elements.namedItem(firstInvalid) as HTMLInputElement).focus();
      return;
    }

    setPending(true);
    let submittedEmail = "";
    try {
      if (resetToken) {
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const { error } = await authClient.resetPassword({
          newPassword: password,
          token: resetToken,
        });
        if (error) {
          showNotice("Password not reset", authError(error).message);
          return;
        }
        showNotice("Password updated", "Sign in with your new password.");
        setResetTokenOverride(null);
        return;
      }

      if (step === "code") {
        const code = (form.elements.namedItem("code") as HTMLInputElement).value.trim();
        const { error } = await authClient.emailOtp.verifyEmail({
          email: pendingEmail,
          otp: code,
        });
        if (error) {
          const parsed = authError(error);
          setErrors({ code: parsed.message || "That code didn’t work. Try again." });
          return;
        }
        await finishSignIn();
        return;
      }

      const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
      submittedEmail = email;

      if (mode === "reset") {
        const kind = await emailKind(email);
        if (kind === "google") {
          showNotice(
            "Continue with Google",
            "This email uses Google. Continue with Google on the sign-in page. We didn’t send a reset email.",
          );
          return;
        }
        if (kind === "unavailable") {
          showNotice("Try again", "We couldn’t check that email. No reset email was sent.");
          return;
        }
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/forgot-password`,
        });
        if (error) {
          showNotice("Reset email", authError(error).message);
          return;
        }
        showNotice(
          "Check your email",
          "If this email uses a password, we sent a reset link.",
        );
        return;
      }

      if (mode === "signup") {
        const kind = await emailKind(email);
        if (kind === "google" || kind === "both") {
          showNotice(
            "Continue with Google",
            "This email already uses Google. Continue with Google instead of creating another account.",
          );
          return;
        }
        if (kind === "password") {
          showNotice(
            "Sign in",
            "An account with this email already exists. Sign in instead of creating another one.",
          );
          return;
        }
        if (kind === "unavailable") {
          showNotice("Try again", "We couldn’t check that email. No account was created.");
          return;
        }
        const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        const { data, error } = await authClient.signUp.email({ name, email, password });
        if (error) {
          showNotice("Account not created", authError(error).message);
          return;
        }
        if (signedUpUser(data)?.emailVerified) {
          await finishSignIn();
          return;
        }
        await enterCodeStep(email);
        return;
      }

      const password = (form.elements.namedItem("password") as HTMLInputElement).value;
      const { data, error } = await authClient.signIn.email({ email, password });
      if (error) {
        const parsed = authError(error);
        if (needsVerification(parsed)) {
          await enterCodeStep(email);
          return;
        }
        showNotice("Sign in", parsed.message);
        return;
      }
      const user = signedUpUser(data);
      if (user?.emailVerified === false) {
        endApiSession();
        await authClient.signOut();
        await enterCodeStep(email);
        return;
      }
      await finishSignIn();
    } catch (error) {
      const parsed = authError(error);
      if (step === "code") {
        setErrors({ code: parsed.message || "That code didn’t work. Try again." });
      } else if (submittedEmail && needsVerification(parsed)) {
        await enterCodeStep(submittedEmail);
      } else {
        showNotice(mode === "login" ? "Sign in" : "Try again", parsed.message);
      }
    } finally {
      setPending(false);
    }
  };

  const resendCode = async () => {
    if (!pendingEmail) return;
    setPending(true);
    setNotice(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: pendingEmail,
      type: "email-verification",
    });
    if (error) showNotice("Code not sent", authError(error).message);
    else showNotice("Check your email", `We sent another code to ${pendingEmail}.`);
    setPending(false);
  };

  const actionLabel = pending
    ? "Please wait"
    : resetToken
      ? "Update password"
      : step === "code"
        ? "Verify email"
        : copy.action;

  return (
    <div className="auth-form-content">
      <div className="auth-intro">
        <p className="auth-eyebrow">
          <span />
          {copy.eyebrow}
        </p>
        <h1>
          {copy.title}
          <br />
          <em>{copy.accent}</em>
        </h1>
        <p className="auth-description">
          {resetToken
            ? "Choose a new password for this account."
            : step === "code"
              ? `Enter the code sent to ${pendingEmail}.`
              : copy.description}
        </p>
      </div>

      {mode !== "reset" && step === "form" && (
        <>
          <Button
            variant="outline"
            className="auth-google-button"
            type="button"
            disabled={!interactive || pending}
            onClick={() => void continueWithGoogle()}
          >
            <GoogleMark />
            Continue with Google
          </Button>
          <FieldSeparator className="auth-divider">
            or continue with email
          </FieldSeparator>
        </>
      )}

      <form
        className="auth-form"
        noValidate
        onSubmit={(event) => void onSubmit(event)}
        onChange={(event) => {
          setNotice(null);
          setUrlNoticeDismissed(true);
          const input = event.target;
          if (!(input instanceof HTMLInputElement)) return;
          if (errors[input.name as FieldName])
            setErrors((current) => ({
              ...current,
              [input.name]: validateInput(input, mode),
            }));
        }}
      >
        <FieldGroup>
          {step === "code" ? (
            <Field key="email-code" data-invalid={Boolean(errors.code)}>
              <FieldLabel htmlFor="auth-code">Email code</FieldLabel>
              <Input
                id="auth-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter your code"
                required
                onBlur={onBlur}
                aria-invalid={Boolean(errors.code)}
                aria-describedby={errors.code ? "code-error" : undefined}
              />
              <FieldError id="code-error">{errors.code}</FieldError>
            </Field>
          ) : resetToken ? (
            <PasswordField
              mode="signup"
              errors={errors}
              passwordVisible={passwordVisible}
              capsLock={capsLock}
              onBlur={onBlur}
              setPasswordVisible={setPasswordVisible}
              setCapsLock={setCapsLock}
            />
          ) : (
            <>
              {mode === "signup" && (
                <Field key="full-name" data-invalid={Boolean(errors.name)}>
                  <FieldLabel htmlFor="auth-name">Full name</FieldLabel>
                  <Input
                    id="auth-name"
                    name="name"
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                    onBlur={onBlur}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  <FieldError id="name-error">{errors.name}</FieldError>
                </Field>
              )}
              <Field data-invalid={Boolean(errors.email)}>
                <FieldLabel htmlFor="auth-email">Email address</FieldLabel>
                <Input
                  id="auth-email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  onBlur={onBlur}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <FieldError id="email-error">{errors.email}</FieldError>
              </Field>
              {mode !== "reset" && (
                <PasswordField
                  mode={mode}
                  errors={errors}
                  passwordVisible={passwordVisible}
                  capsLock={capsLock}
                  onBlur={onBlur}
                  setPasswordVisible={setPasswordVisible}
                  setCapsLock={setCapsLock}
                />
              )}
            </>
          )}
        </FieldGroup>
        <Button
          type="submit"
          disabled={!interactive || pending}
          className="auth-submit-button motion-button"
        >
          <span>{actionLabel}</span>
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </form>

      {step === "code" && (
        <Button
          type="button"
          variant="outline"
          disabled={pending || !pendingEmail}
          onClick={() => void resendCode()}
        >
          Resend code
        </Button>
      )}

      {(notice || urlNotice) && (
        <Alert className="auth-notice">
          <Info aria-hidden="true" />
          <AlertTitle>{notice ? alertTitle : urlNotice?.title}</AlertTitle>
          <AlertDescription>{notice ?? urlNotice?.message}</AlertDescription>
        </Alert>
      )}

      {mode === "signup" && step === "form" && (
        <p className="auth-verification-note">
          <LockKeyhole size={12} aria-hidden="true" />
          You’ll verify your email before entering your workspace.
        </p>
      )}
      <p className="auth-switch">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login">
              Sign in <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </>
        ) : mode === "login" ? (
          <>
            New to Respondly?{" "}
            <Link href="/signup">
              Create an account <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <Link href="/login">
            <ArrowLeft size={12} aria-hidden="true" />
            Back to sign in
          </Link>
        )}
      </p>
      <noscript>
        <p className="auth-preview-note">Enable JavaScript to sign in.</p>
      </noscript>
    </div>
  );
}

function PasswordField({
  mode,
  errors,
  passwordVisible,
  capsLock,
  onBlur,
  setPasswordVisible,
  setCapsLock,
}: {
  mode: "signup" | "login";
  errors: Errors;
  passwordVisible: boolean;
  capsLock: boolean;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
  setPasswordVisible: (visible: boolean) => void;
  setCapsLock: (enabled: boolean) => void;
}) {
  return (
    <Field data-invalid={Boolean(errors.password)}>
      <div className="auth-label-row">
        <FieldLabel htmlFor="auth-password">Password</FieldLabel>
        {mode === "login" && (
          <Link href="/forgot-password">Forgot password?</Link>
        )}
      </div>
      <InputGroup>
        <InputGroupInput
          id="auth-password"
          name="password"
          type={passwordVisible ? "text" : "password"}
          placeholder={
            mode === "signup" ? "Create a strong password" : "Enter your password"
          }
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          maxLength={128}
          onBlur={(event) => {
            onBlur(event);
            setCapsLock(false);
          }}
          onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            [
              errors.password ? "password-error" : mode === "signup" ? "password-hint" : "",
              capsLock ? "caps-lock-hint" : "",
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-sm"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            aria-controls="auth-password"
            onClick={() => setPasswordVisible(!passwordVisible)}
          >
            {passwordVisible ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError id="password-error">{errors.password}</FieldError>
      {mode === "signup" && !errors.password && (
        <FieldDescription id="password-hint">
          At least 8 characters. Make it something only you know.
        </FieldDescription>
      )}
      {capsLock && (
        <FieldDescription id="caps-lock-hint">Caps Lock is on.</FieldDescription>
      )}
    </Field>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.75-5.6-4.11H3.06v2.59A10 10 0 0 0 12 22ZM6.4 13.94A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.94V7.47H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.53l3.34-2.59ZM12 5.95c1.47 0 2.79.5 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.47l3.34 2.59C7.19 7.7 9.4 5.95 12 5.95Z" />
    </svg>
  );
}
