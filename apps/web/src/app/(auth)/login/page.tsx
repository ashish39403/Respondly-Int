import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Welcome back — Respondly",
  description: "Sign in to your Respondly support workspace.",
};

export default function LoginPage() {
  return <AuthForm key="login" mode="login" />;
}
