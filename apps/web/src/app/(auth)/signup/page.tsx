import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create your account — Respondly",
  description:
    "Start a more thoughtful support experience with Respondly. Your knowledge, your people, one workspace.",
};

export default function SignupPage() {
  return <AuthForm key="signup" mode="signup" />;
}
