import type { Conversation, ConversationStatus, DemoState } from "./demo-state";

const visitors = [
  "Jamie Rowe",
  "Morgan Lee",
  "Alex Chen",
  "Taylor Kim",
  "Sam Ellis",
  "Casey Brooks",
  "Jordan Bell",
  "Riley Parker",
  "Avery Scott",
  "Drew Wilson",
  "Robin Lane",
  "Charlie Reed",
  "Blake Wells",
  "Finley James",
  "Cameron Miles",
  "Harper Hayes",
  "Quinn Davis",
  "Sasha Gray",
  "Reese Cole",
  "Emery Ross",
  "Skyler West",
  "Parker Hill",
  "Dakota Lane",
  "Rowan Fox",
];
const statuses: ConversationStatus[] = [
  "Assigned",
  "Pending Human",
  "Pending Human",
  "AI Active",
  "Resolved",
  "Pending Human",
  "Assigned",
  "AI Active",
  "Resolved",
  "Resolved",
  "AI Active",
  "Resolved",
  "Assigned",
  "Resolved",
  "AI Active",
  "Resolved",
  "Assigned",
  "Resolved",
  "AI Active",
  "Resolved",
  "Resolved",
  "AI Active",
  "Resolved",
  "Resolved",
];
const subjects = [
  "Return approval",
  "Delivery address",
  "Account access",
  "Product availability",
  "Shipping update",
  "Policy exception",
  "Order clarification",
  "Return policy",
];
const questions = [
  "Could you approve a return for order #1048?",
  "Can a person help me change my delivery address?",
  "I need help updating the email on my account.",
  "Where can I find the size guide?",
  "How long does standard shipping take?",
  "Can you make an exception to your return policy?",
  "Could someone check the details of my order?",
  "Can I return an unopened item?",
];

export function createDemoState(): DemoState {
  const conversations: Conversation[] = visitors.map((visitor, index) => {
    const status = statuses[index];
    const topic = status === "AI Active" ? [3, 7, 4][index % 3] : index % 8;
    const day = [
      25, 25, 25, 24, 24, 23, 23, 23, 23, 22, 21, 21, 20, 20, 20, 19, 18, 18,
      17, 16, 16, 15, 14, 12,
    ][index];
    const date = `2026-10-${String(day).padStart(2, "0")}`;
    return {
      id: `conv-${index + 1}`,
      visitor,
      email: `${visitor.toLowerCase().replaceAll(" ", ".")}@example.com`,
      subject: subjects[topic],
      date,
      status,
      assignee:
        status === "Assigned"
          ? index % 3 === 0
            ? "demo-owner"
            : "agent-maya"
          : null,
      reason:
        index % 2 === 0
          ? "Needs a business decision"
          : "Visitor requested a person",
      source: [0, 5, 7].includes(topic)
        ? "returns-policy.pdf"
        : [1, 4].includes(topic)
          ? "shipping-guide.md"
          : "product-faq.txt",
      messages: [
        {
          id: `${index}-1`,
          author: visitor,
          role: "visitor",
          text: index === 0 ? "What’s your return policy?" : questions[topic],
        },
        {
          id: `${index}-2`,
          author: "Respondly AI",
          role: "assistant",
          text: [
            "Unopened items can be returned within 30 days of delivery.",
            "Address changes require a person to review the order.",
            "A person needs to review account changes.",
            "You can find the size guide on each product page.",
            "Standard shipping takes 3–5 business days.",
            "Exceptions to the return policy need a person’s approval.",
            "A person can help with order-specific details.",
            "Unopened items can be returned within 30 days of delivery.",
          ][topic],
        },
        ...(status === "AI Active"
          ? []
          : [
              {
                id: `${index}-3`,
                author: visitor,
                role: "visitor" as const,
                text: [3, 4, 7].includes(topic)
                  ? "Thanks. Could I speak with a person about my order?"
                  : questions[topic],
              },
              {
                id: `${index}-4`,
                author: "Respondly AI",
                role: "assistant" as const,
                text: "A person can help with that request. I’ll pass this conversation to the team.",
              },
              {
                id: `${index}-5`,
                author: "Respondly",
                role: "system" as const,
                text: "Handed off to a person. Automatic AI replies paused.",
              },
            ]),
        ...(status === "Resolved"
          ? [
              {
                id: `${index}-reply`,
                author: "Maya Patel",
                role: "person" as const,
                text: "I’ve reviewed your request and shared the next steps. Let us know if you need anything else.",
              },
            ]
          : []),
        ...(status === "Assigned" || status === "Resolved"
          ? [
              {
                id: `${index}-6`,
                author: "Respondly",
                role: "system" as const,
                text:
                  status === "Resolved"
                    ? "A person explicitly resolved this conversation."
                    : "Conversation claimed. Human support is active.",
              },
            ]
          : []),
      ],
    };
  });
  return {
    workspace: "Acme Studio",
    conversations,
    documents: [
      {
        id: "doc-1",
        name: "returns-policy.pdf",
        size: "246 KB",
        status: "Ready",
        content:
          "Return policy\n\nUnopened items may be returned within 30 days of delivery. A person must review and approve a return. Refunds and exceptions cannot be approved by the assistant.",
      },
      {
        id: "doc-2",
        name: "shipping-guide.md",
        size: "18 KB",
        status: "Ready",
        content:
          "Shipping guide\n\nStandard shipping takes 3–5 business days. Express shipping takes 1–2 business days. Address changes require a person to review the order.",
      },
      {
        id: "doc-3",
        name: "product-faq.txt",
        size: "32 KB",
        status: "Ready",
        content:
          "Product FAQ\n\nOur size guide is available on each product page. Stock availability is shown on the website. For order-specific decisions, ask a person.",
      },
      {
        id: "doc-4",
        name: "care-instructions.pdf",
        size: "412 KB",
        status: "Processing",
        content:
          "Example care instructions. This is a demo document, not a parsed PDF.",
      },
      {
        id: "doc-5",
        name: "scanned-catalog.pdf",
        size: "1.8 MB",
        status: "Failed",
        reason:
          "No readable text found. Upload a text-based PDF, TXT, or Markdown file.",
        content: "No text is available for this example document.",
      },
    ],
    members: [
      {
        id: "demo-owner",
        name: "Workspace owner",
        email: "owner@example.com",
        role: "Owner",
        invited: false,
      },
      {
        id: "agent-maya",
        name: "Maya Patel",
        email: "maya@example.com",
        role: "Agent",
        invited: false,
      },
      {
        id: "agent-noah",
        name: "Noah Williams",
        email: "noah@example.com",
        role: "Agent",
        invited: false,
      },
      {
        id: "invite-1",
        name: "Invited agent",
        email: "avery@example.com",
        role: "Agent",
        invited: true,
      },
    ],
    widget: {
      assistant: "Acme Assistant",
      welcome: "Hi there. How can we help you today?",
      color: "#202020",
      placement: "bottom_right",
    },
  };
}
