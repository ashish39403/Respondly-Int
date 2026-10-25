"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileText,
  Inbox,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerViewport,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDemo } from "./demo-provider";
import { useProfile } from "./profile-provider";
import { OWNER_ID, type Conversation } from "./demo-state";
import { Initials, PageHeading, StatusBadge } from "./dashboard-parts";

function Transcript({
  conversation,
  onTransition,
}: {
  conversation: Conversation;
  onTransition: (action: "claim" | "resolve" | "unassign") => void;
}) {
  const { state, dispatch } = useDemo();
  const { name } = useProfile();
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const source = state.documents.find(
    (document) => document.name === conversation.source,
  );
  const assignee =
    conversation.assignee === OWNER_ID
      ? "You"
      : state.members.find((member) => member.id === conversation.assignee)
          ?.name;
  function reply(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || conversation.status !== "Assigned") return;
    dispatch({
      type: "reply",
      id: conversation.id,
      text: draft,
      author: name,
      messageId: crypto.randomUUID(),
    });
    setDraft("");
    setFeedback("Demo reply added. No message or email was sent.");
  }
  return (
    <div className="conversation-detail">
      <div className="conversation-detail-header">
        <div>
          <Initials name={conversation.visitor} />
          <span>
            <h2>{conversation.visitor}</h2>
            <p>{conversation.subject}</p>
          </span>
        </div>
        <StatusBadge status={conversation.status} />
      </div>
      <div className="conversation-toolbar">
        <span>
          <UserRound aria-hidden="true" />
          {conversation.status === "AI Active"
            ? "Handled by AI"
            : conversation.status === "Resolved"
              ? "Completed by a person"
              : assignee
                ? `Assigned to ${assignee}`
                : "Waiting for a person"}
        </span>
        <div>
          {conversation.status === "Pending Human" && (
            <Button size="sm" onClick={() => onTransition("claim")}>
              Claim conversation
            </Button>
          )}
          {conversation.status === "Assigned" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTransition("unassign")}
              >
                Unassign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTransition("resolve")}
              >
                <Check data-icon="inline-start" />
                Resolve
              </Button>
            </>
          )}
        </div>
      </div>
      <details className="visitor-details">
        <summary>Visitor & conversation details</summary>
        <dl>
          <div>
            <dt>Email</dt>
            <dd>{conversation.email}</dd>
          </div>
          <div>
            <dt>Channel</dt>
            <dd>Website widget</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{conversation.date}</dd>
          </div>
          {conversation.status !== "AI Active" && (
            <div>
              <dt>Handoff reason</dt>
              <dd>{conversation.reason}</dd>
            </div>
          )}
        </dl>
      </details>
      <div className="transcript-frame">
        <MessageScrollerProvider key={conversation.id} autoScroll>
          <MessageScroller>
            <MessageScrollerViewport aria-label="Conversation messages">
              <MessageScrollerContent className="p-5">
                {conversation.messages.map((message) => (
                  <MessageScrollerItem key={message.id} messageId={message.id}>
                    {message.role === "system" ? (
                      <Marker variant="separator">
                        <MarkerContent>{message.text}</MarkerContent>
                      </Marker>
                    ) : (
                      <Message
                        align={message.role === "person" ? "end" : "start"}
                      >
                        <MessageContent>
                          <MessageHeader>{message.author}</MessageHeader>
                          <Bubble
                            variant={
                              message.role === "person"
                                ? "default"
                                : "secondary"
                            }
                          >
                            <BubbleContent>{message.text}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    )}
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>
      <div className="conversation-source">
        <FileText aria-hidden="true" />
        <span>Knowledge used:</span>
        <Dialog>
          <DialogTrigger render={<button className="text-link" />}>
            {conversation.source}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{conversation.source}</DialogTitle>
              <DialogDescription>
                Sample source content from this conversation’s history.
              </DialogDescription>
            </DialogHeader>
            <p className="document-content">
              {source?.content ??
                "This source has been removed from the demo knowledge library. Historical source names remain in the conversation."}
            </p>
          </DialogContent>
        </Dialog>
      </div>
      <form className="reply-composer" onSubmit={reply}>
        <Field>
          <FieldLabel htmlFor="demo-reply">
            {conversation.status === "Assigned"
              ? `Reply to ${conversation.visitor.split(" ")[0]}`
              : "Human reply"}
          </FieldLabel>
          <Textarea
            id="demo-reply"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={4000}
            placeholder={
              conversation.status === "Assigned"
                ? "Write a thoughtful reply…"
                : conversation.status === "Pending Human"
                  ? "Claim this conversation to reply."
                  : conversation.status === "Resolved"
                    ? "This conversation is resolved."
                    : "AI is handling this conversation."
            }
            disabled={conversation.status !== "Assigned"}
          />
          <div className="reply-footer">
            <span>
              {conversation.status === "AI Active"
                ? "AI Active · Demo transcript"
                : "AI replies paused"}
            </span>
            <Button
              type="submit"
              disabled={conversation.status !== "Assigned" || !draft.trim()}
            >
              <Send data-icon="inline-start" />
              Send demo reply
            </Button>
          </div>
        </Field>
        <p role="status" className="workspace-feedback">
          {feedback}
        </p>
      </form>
    </div>
  );
}

export function InboxView() {
  const params = useSearchParams();
  const { state, dispatch } = useDemo();
  const [view, setView] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(
    params.get("conversation") ?? "conv-1",
  );
  const [showDetail, setShowDetail] = useState(
    Boolean(params.get("conversation")),
  );
  const filtered = state.conversations
    .filter((conversation) => {
      const matchesView =
        view === "all" ||
        (view === "pending" && conversation.status === "Pending Human") ||
        (view === "mine" &&
          conversation.status === "Assigned" &&
          conversation.assignee === OWNER_ID) ||
        (view === "resolved" && conversation.status === "Resolved");
      return (
        matchesView &&
        `${conversation.visitor} ${conversation.email} ${conversation.subject}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    })
    .sort((a, b) =>
      view === "pending"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
  const selected =
    filtered.find((conversation) => conversation.id === selectedId) ??
    filtered[0];
  return (
    <div className="workspace-page inbox-page">
      <PageHeading
        title="Inbox"
        description="Every question, every handoff, all in context."
      />
      <div className="inbox-filters">
        <ToggleGroup
          aria-label="Conversation view"
          value={[view]}
          onValueChange={(values) => {
            if (values[0]) {
              setView(values[0]);
              setShowDetail(false);
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="pending">Pending</ToggleGroupItem>
          <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
          <ToggleGroupItem value="resolved">Resolved</ToggleGroupItem>
        </ToggleGroup>
        <span>{filtered.length} conversations</span>
      </div>
      <div className="inbox-shell" data-detail={showDetail}>
        <section className="conversation-list" aria-label="Conversations">
          <div className="conversation-search">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search conversations…"
                aria-label="Search conversations"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
          </div>
          <div className="conversation-rows">
            {filtered.map((conversation) => (
              <button
                key={conversation.id}
                className="conversation-row"
                aria-pressed={selected?.id === conversation.id}
                onClick={() => {
                  setSelectedId(conversation.id);
                  setShowDetail(true);
                }}
              >
                <Initials name={conversation.visitor} />
                <span>
                  <strong>{conversation.visitor}</strong>
                  <span className="conversation-row-subject">
                    {conversation.subject}
                  </span>
                  <span className="conversation-row-preview">
                    {
                      conversation.messages.findLast(
                        (message) => message.role !== "system",
                      )?.text
                    }
                  </span>
                  <StatusBadge status={conversation.status} />
                </span>
              </button>
            ))}
            {!filtered.length && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>No conversations found</EmptyTitle>
                  <EmptyDescription>Try another name or view.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </section>
        <section
          className="conversation-panel"
          aria-label="Selected conversation"
        >
          <Button
            className="inbox-back"
            variant="ghost"
            onClick={() => setShowDetail(false)}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to conversations
          </Button>
          {selected ? (
            <Transcript
              key={selected.id}
              conversation={selected}
              onTransition={(type) => {
                dispatch({ type, id: selected.id });
                setSelectedId(selected.id);
                setView(
                  type === "claim"
                    ? "mine"
                    : type === "resolve"
                      ? "resolved"
                      : "pending",
                );
              }}
            />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>No conversation selected</EmptyTitle>
                <EmptyDescription>
                  Choose a conversation from another view.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </div>
    </div>
  );
}
