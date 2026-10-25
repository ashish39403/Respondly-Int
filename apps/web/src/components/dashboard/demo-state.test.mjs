import test from "node:test";
import assert from "node:assert/strict";
import { demoReducer, summarize, activity } from "./demo-state.ts";
import { createDemoState } from "./demo-data.ts";

test("claim is exclusive; only Assigned conversations can receive replies or resolve", () => {
  const initial = createDemoState();
  const pending = initial.conversations.find(
    (item) => item.status === "Pending Human",
  );
  const rejected = demoReducer(initial, {
    type: "reply",
    id: pending.id,
    text: "No",
    author: "Owner",
    messageId: "reply-1",
  });
  assert.deepEqual(rejected.conversations, initial.conversations);
  assert.deepEqual(
    demoReducer(initial, { type: "resolve", id: pending.id }).conversations,
    initial.conversations,
  );
  const claimed = demoReducer(initial, { type: "claim", id: pending.id });
  const conversation = claimed.conversations.find(
    (item) => item.id === pending.id,
  );
  assert.equal(conversation.status, "Assigned");
  assert.equal(conversation.assignee, "demo-owner");
  assert.deepEqual(
    demoReducer(claimed, { type: "claim", id: pending.id }).conversations,
    claimed.conversations,
  );
  const replied = demoReducer(claimed, {
    type: "reply",
    id: pending.id,
    text: " Hello ",
    author: "Owner",
    messageId: "reply-1",
  });
  assert.equal(
    replied.conversations.find((item) => item.id === pending.id).status,
    "Assigned",
  );
  assert.equal(
    replied.conversations.find((item) => item.id === pending.id).messages.at(-1)
      .text,
    "Hello",
  );
  assert.deepEqual(
    demoReducer(replied, {
      type: "reply",
      id: pending.id,
      text: " Hello ",
      author: "Owner",
      messageId: "reply-1",
    }),
    replied,
  );
  const resolved = demoReducer(replied, { type: "resolve", id: pending.id });
  assert.equal(
    resolved.conversations.find((item) => item.id === pending.id).status,
    "Resolved",
  );
  assert.deepEqual(
    demoReducer(resolved, {
      type: "reply",
      id: pending.id,
      text: "No",
      author: "Owner",
      messageId: "reply-2",
    }).conversations,
    resolved.conversations,
  );
});

test("unassign returns to Pending Human with no new assistant reply", () => {
  const initial = createDemoState();
  const conversation = initial.conversations.find(
    (item) => item.status === "Assigned",
  );
  const updated = demoReducer(initial, {
    type: "unassign",
    id: conversation.id,
  }).conversations.find((item) => item.id === conversation.id);
  assert.equal(updated.status, "Pending Human");
  assert.equal(updated.assignee, null);
  assert.equal(
    updated.messages.filter((item) => item.role === "assistant").length,
    conversation.messages.filter((item) => item.role === "assistant").length,
  );
});

test("retry and replacement do not duplicate documents or discard the old Ready availability", () => {
  const initial = createDemoState();
  const failed = initial.documents.find((item) => item.status === "Failed");
  const retry = demoReducer(initial, { type: "retry-document", id: failed.id });
  assert.equal(retry.documents.length, initial.documents.length);
  assert.equal(
    retry.documents.find((item) => item.id === failed.id).status,
    "Processing",
  );
  const ready = initial.documents.find((item) => item.status === "Ready");
  const replacement = demoReducer(initial, {
    type: "replace-document",
    id: ready.id,
    document: { ...ready, id: "new", status: "Processing" },
  });
  assert.equal(replacement.documents.length, initial.documents.length);
  assert.equal(
    replacement.documents.find((item) => item.id === ready.id).previousReady,
    true,
  );
  const finished = demoReducer(replacement, {
    type: "ready-document",
    id: ready.id,
  });
  assert.equal(
    finished.documents.find((item) => item.id === ready.id).previousReady,
    false,
  );
  assert.equal(
    demoReducer(finished, {
      type: "delete-document",
      id: ready.id,
    }).documents.some((item) => item.id === ready.id),
    false,
  );
});

test("owner and duplicate invitation safeguards hold; removing an agent returns assignments to pending", () => {
  const initial = createDemoState();
  assert.deepEqual(
    demoReducer(initial, { type: "remove-member", id: "demo-owner" }),
    initial,
  );
  assert.deepEqual(
    demoReducer(initial, {
      type: "member-role",
      id: "demo-owner",
      role: "Agent",
    }),
    initial,
  );
  assert.deepEqual(
    demoReducer(initial, {
      type: "invite",
      member: {
        ...initial.members[1],
        email: "MAYA@EXAMPLE.COM",
        id: "duplicate",
      },
    }),
    initial,
  );
  const updated = demoReducer(initial, {
    type: "remove-member",
    id: "agent-maya",
  });
  assert.equal(
    updated.members.some((item) => item.id === "agent-maya"),
    false,
  );
  assert.equal(
    updated.conversations.some((item) => item.assignee === "agent-maya"),
    false,
  );
  for (const item of initial.conversations.filter(
    (item) => item.assignee === "agent-maya",
  ))
    assert.equal(
      updated.conversations.find((next) => next.id === item.id).status,
      "Pending Human",
    );
});

test("overview counts and range data reconcile with the same conversation fixtures", () => {
  const { conversations } = createDemoState();
  assert.equal(
    summarize(conversations).reduce((sum, row) => sum + row.count, 0),
    conversations.length,
  );
  assert.equal(
    activity(conversations, 14).reduce(
      (sum, row) => sum + row.conversations,
      0,
    ),
    conversations.length,
  );
  assert.equal(activity(conversations, 7).length, 7);
  assert.equal(
    activity(conversations, 7).reduce((sum, row) => sum + row.conversations, 0),
    conversations.filter((item) => item.date >= "2026-10-19").length,
  );
  for (const row of activity(conversations, 14))
    assert.ok(row.handoffs <= row.conversations);
});
