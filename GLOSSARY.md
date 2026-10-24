# Respondly

Respondly is a support workspace where a business answers website visitors from its own documents, and a person takes over when the answer is uncertain or needs authority.

## Language

**Account**:
A Neon Auth user id. In V1 it belongs to exactly one workspace, with one role.
_Avoid_: User, profile

**Owner**:
The role that administers one workspace and may also handle support there.
_Avoid_: Admin, superuser

**Agent**:
The role that handles support inside the one workspace that invited them.
_Avoid_: Teammate, operator

**Visitor**:
A person using the widget with no account.
_Avoid_: User, customer, lead

**Visitor session**:
One browser’s anonymous relationship with one workspace. It owns the conversations that browser started there.
_Avoid_: Visitor token, account

**Current conversation**:
The one conversation a visitor session has that is not Resolved.
_Avoid_: Open chat, active thread

**Conversation**:
One support thread in a workspace, from the first visitor message through Resolved.
_Avoid_: Ticket, chat, thread

**Resume link**:
A secret that opens one conversation and no other conversation.
_Avoid_: Login link, session, magic link
