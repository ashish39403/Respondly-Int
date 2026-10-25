"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  ChevronsUpDown,
  Inbox,
  Settings,
  Upload,
  UserRound,
  LayoutDashboard,
  FileText,
  PanelsTopLeft,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/marketing/brand";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileAvatar, ProfileProvider, useProfile } from "./profile-provider";
import { cn } from "@/lib/utils";
import { DemoProvider, useDemo } from "./demo-provider";
import { Badge } from "@/components/ui/badge";

const navigation = [
  {
    href: "/dashboard",
    label: "Home",
    description: "The bigger picture",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/inbox",
    label: "Inbox",
    description: "Every conversation, together",
    icon: Inbox,
  },
  {
    href: "/dashboard/knowledge",
    label: "Knowledge",
    description: "The source of good answers",
    icon: FileText,
  },
  {
    href: "/dashboard/widget",
    label: "Widget",
    description: "Your website’s welcome",
    icon: PanelsTopLeft,
  },
  {
    href: "/dashboard/team",
    label: "Team",
    description: "The people behind support",
    icon: UsersRound,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    description: "Make yourself at home",
    icon: Settings,
  },
];

function WorkspaceGuide() {
  return (
    <Dialog>
      <DialogTrigger render={<button className="workspace-guide" />}>
        <BookOpen aria-hidden="true" />
        <span>
          <strong>A little context</strong>
          <span>How your workspace works</span>
        </span>
        <ArrowUpRight aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your workspace, at a glance</DialogTitle>
          <DialogDescription>
            Good answers when AI knows. Your people when it matters.
          </DialogDescription>
        </DialogHeader>
        <ol className="workspace-guide-steps">
          <li>
            <strong>Start with your knowledge.</strong>
            <p>Respondly answers from your workspace’s Ready documents.</p>
          </li>
          <li>
            <strong>Keep every conversation together.</strong>
            <p>
              Your inbox brings visitor questions and the full conversation
              history into one place.
            </p>
          </li>
          <li>
            <strong>Let a person take over.</strong>
            <p>
              When a question needs a person, AI pauses. A teammate claims the
              conversation, replies, and explicitly resolves it.
            </p>
          </li>
        </ol>
        <p className="text-sm text-muted-foreground">
          This is an interactive demo workspace. Conversations, documents, team
          members, and charts use sample data. Changes stay local and reset on
          refresh. No messages, invitations, or files are sent.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function DashboardFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentPage =
    navigation.find((item) => item.href === pathname)?.label ?? "Home";
  const { state } = useDemo();
  const waiting = state.conversations.filter(
    (item) => item.status === "Pending Human",
  ).length;
  const { name, choosePhoto, photoMessage, photoError } = useProfile();

  return (
    <div className="dashboard-shell">
      <a href="#dashboard-content" className="dashboard-skip">
        Skip to content
      </a>
      <aside className="dashboard-sidebar" aria-label="Workspace sidebar">
        <Link
          href="/dashboard"
          className="dashboard-brand"
          aria-label="Respondly dashboard"
        >
          <Brand />
        </Link>
        <div className="workspace-identity">
          <span className="workspace-monogram">R</span>
          <span>
            <strong>{state.workspace}</strong>
            <span>Owner · Demo workspace</span>
          </span>
        </div>
        <div className="dashboard-nav-section">
          <p className="dashboard-eyebrow">WORKSPACE</p>
          <nav aria-label="Dashboard navigation">
            {navigation.map(({ href, label, description, icon: Icon }) => {
              const active = href === pathname;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("dashboard-nav-link", active && "is-active")}
                >
                  <Icon aria-hidden="true" />
                  <span>
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </span>
                  {href === "/dashboard/inbox" && waiting > 0 ? (
                    <span className="nav-count">{waiting}</span>
                  ) : (
                    <ChevronRight aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="dashboard-sidebar-bottom">
          <WorkspaceGuide />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className="dashboard-profile"
                  aria-label="Open profile menu"
                />
              }
            >
              <ProfileAvatar />
              <span className="dashboard-profile-copy">
                <strong>{name}</strong>
                <span>Owner</span>
              </span>
              <ChevronsUpDown aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={10}
              className="min-w-52"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Your profile</DropdownMenuLabel>
                <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                  <UserRound />
                  Profile settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={choosePhoto}>
                  <Upload />
                  Upload photo
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {photoMessage && (
            <p
              className="dashboard-photo-message"
              role={photoError ? "alert" : "status"}
            >
              {photoMessage}
            </p>
          )}
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb">
            <span>Workspace</span>
            <ChevronRight aria-hidden="true" />
            <strong>{currentPage}</strong>
          </div>
          <Badge variant="outline">Demo workspace</Badge>
        </header>
        <main
          id="dashboard-content"
          className="dashboard-content"
          tabIndex={-1}
        >
          <p className="demo-context-note">
            Sample data. Changes stay in this preview and reset on refresh.
          </p>
          {children}
        </main>
        <footer className="dashboard-footer">
          <span>Thoughtful support. A human touch.</span>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to website
          </Button>
        </footer>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <DemoProvider>
        <DashboardFrame>{children}</DashboardFrame>
      </DemoProvider>
    </ProfileProvider>
  );
}
