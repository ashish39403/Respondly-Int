import type { ReactNode } from "react";
import type { Viewport } from "next";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { AuthContext } from "@/components/auth/auth-context";
import { PageTransition } from "@/components/page-transition";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="auth-shell">
        <a className="skip-link" href="#auth-main">
          Skip to form
        </a>
        <section className="auth-form-side" aria-label="Your Respondly account">
          <header className="auth-header">
            <Link
              href="/"
              transitionTypes={["auth-back"]}
              className="brand-link"
              aria-label="Respondly home"
            >
              <Brand />
            </Link>
            <Link
              href="/"
              transitionTypes={["auth-back"]}
              className="auth-home-link"
            >
              Back to home <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </header>
          <main id="auth-main" className="auth-form-main">
            {children}
          </main>
          <footer className="auth-footer">
            <span>AI first. People always.</span>
            <span>
              <LockKeyhole size={12} aria-hidden="true" /> Your own private
              workspace
            </span>
          </footer>
        </section>
        <AuthContext />
      </div>
    </PageTransition>
  );
}
