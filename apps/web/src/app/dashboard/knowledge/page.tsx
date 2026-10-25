import type { Metadata } from "next";
import { KnowledgeView } from "@/components/dashboard/knowledge-view";
export const metadata: Metadata = { title: "Knowledge" };
export default function KnowledgePage() {
  return <KnowledgeView />;
}
