"use client";

import { useState, type FormEvent } from "react";
import { Mail, MoreHorizontal, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
  TableCaption,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDemo } from "./demo-provider";
import { useProfile } from "./profile-provider";
import { OWNER_ID, type DemoMember } from "./demo-state";
import { PageHeading, Initials, StatusBadge } from "./dashboard-parts";
import { ConfirmDemoAction } from "./confirm-demo-action";

export function TeamView() {
  const { state, dispatch } = useDemo();
  const { name } = useProfile();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Owner" | "Agent">("Agent");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [removing, setRemoving] = useState<DemoMember | null>(null);
  function invite(event: FormEvent) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("Enter a valid email address.");
      return;
    }
    if (
      state.members.some((member) => member.email.toLowerCase() === address)
    ) {
      setError("That address is already a member or has a pending invitation.");
      return;
    }
    dispatch({
      type: "invite",
      member: {
        id: crypto.randomUUID(),
        name: "Invited agent",
        email: address,
        role,
        invited: true,
      },
    });
    setInviteOpen(false);
    setEmail("");
    setError("");
    setFeedback(
      "Demo invitation created. No email was sent and no real access was granted.",
    );
  }
  const owners = state.members.filter(
    (member) => member.role === "Owner" && !member.invited,
  ).length;
  return (
    <div className="workspace-page">
      <PageHeading
        title="Team"
        description="The human side of every helpful answer."
        action={
          <Dialog
            open={inviteOpen}
            onOpenChange={(open) => {
              setInviteOpen(open);
              setError("");
            }}
          >
            <DialogTrigger render={<Button size="lg" />}>
              <Plus data-icon="inline-start" />
              Invite agent
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite someone to your workspace</DialogTitle>
                <DialogDescription>
                  This creates a local demo invitation. No email is sent.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={invite} noValidate>
                <FieldGroup>
                  <Field data-invalid={Boolean(error)}>
                    <FieldLabel htmlFor="invite-email">
                      Email address
                    </FieldLabel>
                    <Input
                      id="invite-email"
                      type="email"
                      autoComplete="off"
                      maxLength={254}
                      placeholder="name@company.com"
                      value={email}
                      aria-invalid={Boolean(error)}
                      aria-describedby="invite-error"
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                    />
                    <p
                      id="invite-error"
                      role="alert"
                      className="workspace-feedback"
                    >
                      {error}
                    </p>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                    <Select
                      value={role}
                      onValueChange={(value) => {
                        if (value === "Owner" || value === "Agent")
                          setRole(value);
                      }}
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Agent">Agent</SelectItem>
                          <SelectItem value="Owner">Owner</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Agents handle support. Owners also manage knowledge, the
                      widget, and members.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <DialogFooter className="mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Mail data-icon="inline-start" />
                    Create demo invite
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="team-summary">
        <div>
          <strong>
            {state.members.filter((member) => !member.invited).length}
          </strong>
          <span>Active members</span>
        </div>
        <div>
          <strong>
            {state.members.filter((member) => member.invited).length}
          </strong>
          <span>Pending invitations</span>
        </div>
        <div>
          <ShieldCheck aria-hidden="true" />
          <span>One workspace. Clear roles.</span>
        </div>
      </div>
      <p className="workspace-feedback" role="status">
        {feedback}
      </p>
      <div className="workspace-table-panel">
        <Table>
          <TableCaption>
            Demo members and invitations. Changes do not grant or revoke real
            access.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.members.map((member) => {
              const displayName = member.id === OWNER_ID ? name : member.name;
              const locked =
                member.id === OWNER_ID ||
                (member.role === "Owner" && !member.invited && owners <= 1);
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="member-name">
                      <Initials name={displayName} />
                      <span>
                        <strong>
                          {displayName}
                          {member.id === OWNER_ID && " (you)"}
                        </strong>
                        <span>{member.email}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={member.invited ? "Invited" : "Active"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {locked ? (
                      <span className="workspace-note">
                        {owners <= 1 ? "Last owner" : "Your account"}
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Manage ${member.email}`}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-48">
                          <DropdownMenuGroup>
                            {!member.invited && (
                              <DropdownMenuItem
                                onClick={() => {
                                  dispatch({
                                    type: "member-role",
                                    id: member.id,
                                    role:
                                      member.role === "Owner"
                                        ? "Agent"
                                        : "Owner",
                                  });
                                  setFeedback(
                                    "Role updated in this demo only.",
                                  );
                                }}
                              >
                                Make{" "}
                                {member.role === "Owner" ? "Agent" : "Owner"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setRemoving(member)}
                            >
                              {member.invited
                                ? "Cancel invitation"
                                : "Remove member"}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="role-explainer">
        <div>
          <h2>Owners</h2>
          <p>
            Manage the workspace, documents, widget, and team. See and handle
            every conversation.
          </p>
        </div>
        <div>
          <h2>Agents</h2>
          <p>
            See the pending queue and their own assignments. Claim, reply,
            unassign, and resolve conversations.
          </p>
        </div>
      </div>
      <ConfirmDemoAction
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={
          removing?.invited ? "Cancel this invitation?" : "Remove this member?"
        }
        description="This changes the demo only. Any assigned demo conversations return to Pending Human. Refresh restores the sample team."
        onConfirm={() => {
          if (removing) dispatch({ type: "remove-member", id: removing.id });
          setFeedback("Removed from this demo. No real membership changed.");
        }}
      />
    </div>
  );
}
