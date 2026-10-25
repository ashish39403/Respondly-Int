import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

export function PageHeading({
  eyebrow = "YOUR SUPPORT WORKSPACE",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="workspace-page-heading">
      <div>
        <p className="dashboard-eyebrow">{eyebrow}</p>
        <h1>
          {title}
          <span>.</span>
        </h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" data-status={status} className="status-badge">
      <span aria-hidden="true" />
      {status}
    </Badge>
  );
}

export function Initials({ name }: { name: string }) {
  return (
    <span className="person-initials" aria-hidden="true">
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => Array.from(part)[0])
        .join("")}
    </span>
  );
}
