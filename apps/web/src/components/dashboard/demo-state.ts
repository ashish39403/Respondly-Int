export type ConversationStatus =
  "AI Active" | "Pending Human" | "Assigned" | "Resolved";
export type DemoMessage = {
  id: string;
  author: string;
  role: "visitor" | "assistant" | "person" | "system";
  text: string;
};
export type Conversation = {
  id: string;
  visitor: string;
  email: string;
  subject: string;
  date: string;
  status: ConversationStatus;
  assignee: string | null;
  reason: string;
  source: string;
  messages: DemoMessage[];
};
export type DemoDocument = {
  id: string;
  name: string;
  size: string;
  status: "Ready" | "Processing" | "Failed";
  reason?: string;
  previousReady?: boolean;
  content: string;
};
export type DemoMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Agent";
  invited: boolean;
};
export type WidgetSettings = {
  assistant: string;
  welcome: string;
  color: string;
  placement: "bottom_right" | "bottom_left";
};
export type DemoState = {
  conversations: Conversation[];
  documents: DemoDocument[];
  members: DemoMember[];
  widget: WidgetSettings;
  workspace: string;
};

export type DemoAction =
  | { type: "claim" | "resolve" | "unassign"; id: string }
  | {
      type: "reply";
      id: string;
      text: string;
      author: string;
      messageId: string;
    }
  | { type: "add-document"; document: DemoDocument }
  | {
      type: "retry-document" | "ready-document" | "delete-document";
      id: string;
    }
  | { type: "replace-document"; id: string; document: DemoDocument }
  | { type: "invite"; member: DemoMember }
  | { type: "remove-member"; id: string }
  | { type: "member-role"; id: string; role: "Owner" | "Agent" }
  | { type: "widget"; settings: WidgetSettings }
  | { type: "workspace"; name: string };

export const OWNER_ID = "demo-owner";
export const STATUSES: ConversationStatus[] = [
  "AI Active",
  "Pending Human",
  "Assigned",
  "Resolved",
];

// Deliberately local: these actions never make an API call or mutate an account.
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "workspace")
    return action.name.trim()
      ? { ...state, workspace: action.name.trim() }
      : state;
  if (action.type === "widget") return { ...state, widget: action.settings };
  if (action.type === "invite") {
    if (
      state.members.some(
        (member) =>
          member.email.toLowerCase() === action.member.email.toLowerCase(),
      )
    )
      return state;
    return { ...state, members: [...state.members, action.member] };
  }
  if (action.type === "remove-member" || action.type === "member-role") {
    const member = state.members.find((item) => item.id === action.id);
    if (!member || member.id === OWNER_ID) return state;
    const owners = state.members.filter(
      (item) => item.role === "Owner" && !item.invited,
    ).length;
    if (
      member.role === "Owner" &&
      !member.invited &&
      owners <= 1 &&
      (action.type === "remove-member" || action.role !== "Owner")
    )
      return state;
    return {
      ...state,
      members:
        action.type === "remove-member"
          ? state.members.filter((item) => item.id !== action.id)
          : state.members.map((item) =>
              item.id === action.id ? { ...item, role: action.role } : item,
            ),
      conversations:
        action.type === "remove-member"
          ? state.conversations.map((item) =>
              item.assignee === action.id && item.status === "Assigned"
                ? { ...item, status: "Pending Human", assignee: null }
                : item,
            )
          : state.conversations,
    };
  }
  if (action.type === "add-document")
    return state.documents.length >= 50
      ? state
      : { ...state, documents: [...state.documents, action.document] };
  if (action.type === "delete-document")
    return {
      ...state,
      documents: state.documents.filter(
        (document) => document.id !== action.id,
      ),
    };
  if (
    action.type === "retry-document" ||
    action.type === "ready-document" ||
    action.type === "replace-document"
  ) {
    return {
      ...state,
      documents: state.documents.map((document) => {
        if (document.id !== action.id) return document;
        if (action.type === "retry-document")
          return document.status === "Failed"
            ? { ...document, status: "Processing", reason: undefined }
            : document;
        if (action.type === "ready-document")
          return document.status === "Processing"
            ? {
                ...document,
                status: "Ready",
                previousReady: false,
                reason: undefined,
              }
            : document;
        if (action.type === "replace-document")
          return {
            ...action.document,
            id: document.id,
            previousReady:
              document.status === "Ready" || document.previousReady,
          };
        return document;
      }),
    };
  }
  return {
    ...state,
    conversations: state.conversations.map((conversation) => {
      if (conversation.id !== action.id) return conversation;
      if (action.type === "claim" && conversation.status === "Pending Human")
        return {
          ...conversation,
          status: "Assigned",
          assignee: OWNER_ID,
          messages: [
            ...conversation.messages,
            {
              id: `claim-${conversation.messages.length}`,
              role: "system",
              author: "Respondly",
              text: "You claimed this conversation. AI replies remain paused.",
            },
          ],
        };
      if (action.type === "resolve" && conversation.status === "Assigned")
        return {
          ...conversation,
          status: "Resolved",
          messages: [
            ...conversation.messages,
            {
              id: `resolve-${conversation.messages.length}`,
              role: "system",
              author: "Respondly",
              text: "Conversation explicitly resolved. AI replies remain paused.",
            },
          ],
        };
      if (action.type === "unassign" && conversation.status === "Assigned")
        return {
          ...conversation,
          status: "Pending Human",
          assignee: null,
          messages: [
            ...conversation.messages,
            {
              id: `unassign-${conversation.messages.length}`,
              role: "system",
              author: "Respondly",
              text: "Returned to Pending Human. AI replies remain paused.",
            },
          ],
        };
      if (
        action.type === "reply" &&
        conversation.status === "Assigned" &&
        action.text.trim() &&
        !conversation.messages.some(
          (message) => message.id === action.messageId,
        )
      )
        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              id: action.messageId,
              author: action.author,
              role: "person",
              text: action.text.trim(),
            },
          ],
        };
      return conversation;
    }),
  };
}

export function summarize(conversations: Conversation[]) {
  return STATUSES.map((status) => ({
    status,
    count: conversations.filter((item) => item.status === status).length,
  }));
}

export function activity(conversations: Conversation[], days: number) {
  return Array.from({ length: days }, (_, index) => {
    const day = 26 - days + index;
    const date = `2026-10-${String(day).padStart(2, "0")}`;
    const matching = conversations.filter(
      (conversation) => conversation.date === date,
    );
    return {
      day: `Oct ${day}`,
      conversations: matching.length,
      handoffs: matching.filter(
        (conversation) => conversation.status !== "AI Active",
      ).length,
    };
  });
}
