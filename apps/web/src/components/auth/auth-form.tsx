"use client";

import {
  useState,
  useSyncExternalStore,
  type FormEvent,
  type FocusEvent,
} from "react";
import Link from "next/link";
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

type AuthMode = "signup" | "login" | "reset";
type FieldName = "name" | "email" | "password";
type Errors = Partial<Record<FieldName, string>>;

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

// Frontend validation only. The identity provider will enforce its own rules
// when authentication is connected; these forms make no network requests.
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
    if (mode === "signup" && input.value.length < 8)
      return "Use at least 8 characters for your password.";
  }
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const copy = content[mode];
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    getClientReady,
    getServerReady,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onBlur = (event: FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    setErrors((current) => ({
      ...current,
      [input.name]: validateInput(input, mode),
    }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const form = event.currentTarget;
    const nextErrors: Errors = {};
    const fields: FieldName[] =
      mode === "signup"
        ? ["name", "email", "password"]
        : mode === "login"
          ? ["email", "password"]
          : ["email"];
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
    setNotice(
      mode === "signup"
        ? "Account creation isn’t connected in this preview. No account was created and your details weren’t sent."
        : mode === "login"
          ? "Sign in isn’t connected in this preview. Your credentials weren’t sent."
          : "Password reset isn’t connected in this preview. No email was sent.",
    );
  };

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
        <p className="auth-description">{copy.description}</p>
      </div>

      {mode !== "reset" && (
        <>
          <Button
            variant="outline"
            className="auth-google-button"
            type="button"
            disabled={!interactive}
            onClick={() =>
              setNotice(
                "Google sign-in isn’t connected in this preview. No connection was started.",
              )
            }
            aria-describedby="auth-preview-note"
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
        onSubmit={onSubmit}
        onChange={(event) => {
          setNotice(null);
          const input = event.target;
          if (!(input instanceof HTMLInputElement)) return;
          if (errors[input.name as FieldName])
            setErrors((current) => ({
              ...current,
              [input.name]: validateInput(input, mode),
            }));
        }}
        aria-describedby="auth-preview-note"
      >
        <FieldGroup>
          {mode === "signup" && (
            <Field data-invalid={Boolean(errors.name)}>
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
                    mode === "signup"
                      ? "Create a strong password"
                      : "Enter your password"
                  }
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  onBlur={(event) => {
                    onBlur(event);
                    setCapsLock(false);
                  }}
                  onKeyUp={(event) =>
                    setCapsLock(event.getModifierState("CapsLock"))
                  }
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    [
                      errors.password
                        ? "password-error"
                        : mode === "signup"
                          ? "password-hint"
                          : "",
                      capsLock ? "caps-lock-hint" : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-sm"
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
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
                <FieldDescription id="caps-lock-hint">
                  Caps Lock is on.
                </FieldDescription>
              )}
            </Field>
          )}
        </FieldGroup>
        <Button
          type="submit"
          disabled={!interactive}
          className="auth-submit-button motion-button"
          aria-describedby="auth-preview-note"
        >
          <span>{copy.action}</span>
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </form>

      {notice && (
        <Alert className="auth-notice">
          <Info aria-hidden="true" />
          <AlertTitle>Preview only</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {mode === "signup" && (
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
      <p id="auth-preview-note" className="auth-preview-note">
        Interface preview · Authentication is not enabled yet.
      </p>
      <noscript>
        <p className="auth-preview-note">
          Enable JavaScript to explore the form preview.
        </p>
      </noscript>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.75-5.6-4.11H3.06v2.59A10 10 0 0 0 12 22ZM6.4 13.94A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.94V7.47H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.53l3.34-2.59ZM12 5.95c1.47 0 2.79.5 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.47l3.34 2.59C7.19 7.7 9.4 5.95 12 5.95Z" />
    </svg>
  );
}
