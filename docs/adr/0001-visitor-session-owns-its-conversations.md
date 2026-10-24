---
status: accepted
---

# Visitor session owns its conversations

A same-browser follow-up after Resolved, and a refusal when conversation 1’s credential is offered for conversation 2, cannot be the same secret. V1 uses two credentials. A visitor session owns every conversation it starts in one workspace. A resume link authorizes exactly one conversation.

## Considered options

- One token per conversation, rotated after resolve. Rejected because follow-up is the same browser session, and rotation adds a handshake the product does not need.
- One secret that can open every conversation in the workspace. Rejected because a visitor credential would then read conversations that browser did not start.

## Consequences

- A message after Resolved starts a new AI Active conversation owned by that browser’s visitor session for the workspace. If the browser has no session yet, one is created.
- The resume link does not authorize that new conversation.
- Another session’s credential, or a resume link used on any other conversation, is refused. A credential from another workspace is refused.
- The credential format is technical design. Every visitor request is validated against session ownership or the single linked conversation, inside one workspace.
