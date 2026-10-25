"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import {
  endApiSession,
  refuseSecondSignInMethod,
  saveAccount,
  sessionUser,
  type SaveResult,
} from "@/lib/auth/account";

export function HoldingScreen() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const prepare = async () => {
      const { data } = await authClient.getSession();
      const user = sessionUser(data);
      if (!user) {
        if (!cancelled) router.replace("/login");
        return;
      }
      if (!cancelled && user.name) setName(user.name);
      const refused = await refuseSecondSignInMethod();
      if (cancelled) return;
      if (refused) {
        endApiSession();
        await authClient.signOut();
        router.replace("/login?notice=password");
        return;
      }
      const saved = await saveAccount();
      if (!cancelled) setSaveResult(saved);
    };
    void prepare();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const signOut = async () => {
    setSigningOut(true);
    endApiSession();
    await authClient.signOut();
    router.replace("/login");
  };

  return (
    <div className="auth-form-content">
      <div className="auth-intro">
        <p className="auth-eyebrow">
          <span />
          YOUR ACCOUNT
        </p>
        <h1>
          Your account
          <br />
          <em>is ready.</em>
        </h1>
        <p className="auth-description">
          {name ? `${name}, you’re signed in. ` : "You’re signed in. "}
          The workspace comes next.
        </p>
      </div>
      {saveResult === "failed" && (
        <p className="auth-verification-note">
          <LockKeyhole size={12} aria-hidden="true" />
          We couldn’t save the account just now. You’ll stay signed in, and the
          next sign-in will try again.
        </p>
      )}
      <Button
        type="button"
        className="auth-submit-button motion-button"
        disabled={signingOut}
        onClick={() => void signOut()}
      >
        <span>{signingOut ? "Signing out" : "Sign out"}</span>
        <ArrowRight data-icon="inline-end" aria-hidden="true" />
      </Button>
    </div>
  );
}
