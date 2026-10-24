import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Reset your password — Respondly" };

export default function ForgotPasswordPage() {
  return <AuthForm key="reset" mode="reset" />;
}
