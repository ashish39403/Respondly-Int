"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  Inbox,
  MessagesSquare,
  UserRound,
  CheckCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
  TableCaption,
} from "@/components/ui/table";
import { activity, summarize } from "./demo-state";
import { useDemo } from "./demo-provider";
import { useProfile } from "./profile-provider";
import { Initials, PageHeading, StatusBadge } from "./dashboard-parts";

const activityConfig = {
  conversations: { label: "Conversations", color: "#262626" },
  handoffs: { label: "Human handoffs", color: "#9b9b9b" },
} satisfies ChartConfig;
const shades = ["#252525", "#777777", "#b0b0b0", "#dedede"];

export function Overview() {
  const { state } = useDemo();
  const { name } = useProfile();
  const [days, setDays] = useState(14);
  const summary = summarize(state.conversations);
  const data = activity(state.conversations, days);
  const pending = state.conversations.filter(
    (item) => item.status === "Pending Human",
  );
  const ready = state.documents.filter(
    (item) => item.status === "Ready",
  ).length;
  const stats = [
    {
      label: "Conversations",
      value: state.conversations.length,
      detail: "In this demo workspace",
      icon: MessagesSquare,
    },
    {
      label: "Waiting for a person",
      value: pending.length,
      detail: "Ready to claim",
      icon: UserRound,
    },
    {
      label: "Assigned",
      value: summary[2].count,
      detail: "Human support in progress",
      icon: Inbox,
    },
    {
      label: "Resolved",
      value: summary[3].count,
      detail: "Explicitly completed",
      icon: CheckCheck,
    },
  ];
  return (
    <div className="workspace-page overview-page">
      <PageHeading
        eyebrow="THE BIG PICTURE"
        title={
          name === "Workspace owner"
            ? "Welcome back"
            : `Welcome back, ${name.split(" ")[0]}`
        }
        description="Good support, all connected. Here’s your workspace at a glance."
        action={
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/inbox" />}
            size="lg"
          >
            Open inbox
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        }
      />
      <div className="overview-metrics">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <div className="overview-metric" key={label}>
            <div>
              <span>{label}</span>
              <Icon aria-hidden="true" />
            </div>
            <strong>{value.toString().padStart(2, "0")}</strong>
            <p>{detail}</p>
          </div>
        ))}
      </div>
      <div className="overview-charts">
        <Card className="activity-card">
          <CardHeader>
            <CardTitle>Conversation activity</CardTitle>
            <CardDescription>
              New conversations and human handoffs
            </CardDescription>
            <CardAction>
              <ToggleGroup
                aria-label="Activity period"
                value={[String(days)]}
                onValueChange={(values) => {
                  if (values[0]) setDays(Number(values[0]));
                }}
                size="sm"
                variant="outline"
              >
                <ToggleGroupItem value="7">7 days</ToggleGroupItem>
                <ToggleGroupItem value="14">14 days</ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityConfig} className="activity-chart">
              <AreaChart
                accessibilityLayer
                data={data}
                margin={{ top: 12, right: 12, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="conversation-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#262626" stopOpacity={0.16} />
                    <stop
                      offset="100%"
                      stopColor="#262626"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 5" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickMargin={12}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="conversations"
                  type="monotone"
                  stroke="var(--color-conversations)"
                  strokeWidth={2}
                  fill="url(#conversation-fill)"
                  isAnimationActive={false}
                />
                <Area
                  dataKey="handoffs"
                  type="monotone"
                  stroke="var(--color-handoffs)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="transparent"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="chart-legend">
              <span>
                <i />
                Conversations
              </span>
              <span>
                <i />
                Human handoffs
              </span>
            </div>
            <span className="chart-period">
              Oct {26 - days}–25, 2026 · Sample period
            </span>
          </CardFooter>
        </Card>
        <Card className="status-card">
          <CardHeader>
            <CardTitle>Conversation mix</CardTitle>
            <CardDescription>
              Current status of all demo conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="status-donut">
              <ChartContainer
                config={{ count: { label: "Conversations" } }}
                className="donut-chart"
              >
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="status" />}
                  />
                  <Pie
                    data={summary}
                    dataKey="count"
                    nameKey="status"
                    innerRadius="65%"
                    outerRadius="90%"
                    strokeWidth={4}
                    stroke="#fff"
                    isAnimationActive={false}
                  >
                    {summary.map((item, index) => (
                      <Cell key={item.status} fill={shades[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="donut-center">
                <strong>{state.conversations.length}</strong>
                <span>conversations</span>
              </div>
            </div>
            <ul className="status-legend">
              {summary.map((item, index) => (
                <li key={item.status}>
                  <span>
                    <i style={{ background: shades[index] }} />
                    {item.status}
                  </span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <details className="chart-data-details">
        <summary>View activity data as a table</summary>
        <Table>
          <TableCaption>
            Sample conversation activity, October 2026.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Conversations</TableHead>
              <TableHead>Human handoffs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.day}>
                <TableCell>{row.day}</TableCell>
                <TableCell>{row.conversations}</TableCell>
                <TableCell>{row.handoffs}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </details>
      <div className="overview-bottom-grid">
        <Card>
          <CardHeader>
            <CardTitle>Needs a human touch</CardTitle>
            <CardDescription>The oldest handoffs come first.</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/dashboard/inbox" />}
              >
                View inbox
                <ArrowRight data-icon="inline-end" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="recent-conversations">
              {pending.length ? (
                [...pending]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 3)
                  .map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/dashboard/inbox?conversation=${conversation.id}`}
                    >
                      <Initials name={conversation.visitor} />
                      <span>
                        <strong>{conversation.visitor}</strong>
                        <span>{conversation.subject}</span>
                      </span>
                      <StatusBadge status={conversation.status} />
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                  ))
              ) : (
                <p className="workspace-note">
                  There are no pending conversations in this demo.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your knowledge, in motion</CardTitle>
            <CardDescription>
              Ready documents give your assistant its context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="knowledge-summary">
              <FileText aria-hidden="true" />
              <strong>
                {ready}
                <span> / {state.documents.length}</span>
              </strong>
              <p>documents Ready</p>
            </div>
            <div
              className="knowledge-progress"
              role="progressbar"
              aria-label="Ready documents"
              aria-valuenow={ready}
              aria-valuemin={0}
              aria-valuemax={state.documents.length || 1}
            >
              <span
                style={{
                  width: `${state.documents.length ? (ready / state.documents.length) * 100 : 0}%`,
                }}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/knowledge" />}
            >
              Manage knowledge
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
