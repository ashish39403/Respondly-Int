import type { Metadata } from "next";
import { WidgetView } from "@/components/dashboard/widget-view";
export const metadata: Metadata = { title: "Widget" };
export default function WidgetPage() {
  return <WidgetView />;
}
