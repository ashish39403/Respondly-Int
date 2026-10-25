import type { Metadata } from "next";
import { HoldingScreen } from "@/components/auth/holding-screen";

export const metadata: Metadata = {
  title: "Account ready — Respondly",
  description: "Your Respondly account is ready. The workspace comes next.",
};

export default function ReadyPage() {
  return <HoldingScreen />;
}
