import type { Metadata } from "next";
import { Suspense } from "react";
import { InboxView } from "@/components/dashboard/inbox-view";

export const metadata: Metadata = { title: "Inbox" };
export default function InboxPage() {
  return (
    <Suspense fallback={<p className="workspace-page">Opening your inbox…</p>}>
      <InboxView />
    </Suspense>
  );
}
