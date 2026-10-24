---
status: accepted
---

# One account has one workspace membership

V1 isolates two businesses by giving each account exactly one workspace and one role, Owner or Agent. A second membership is refused, and there is no workspace switcher.

## Considered options

- Many memberships and a workspace switcher. Rejected because the golden path, the trust set, and the handoff checks are satisfied by two accounts, and an active-workspace choice would sit on every protected screen.

## Consequences

- Creating a workspace makes that account its Owner. An owner invites Agents into that workspace.
- An account with no workspace can accept one invite. An account that already has a workspace cannot create or join another.
- Another Owner of the same workspace is a different account, still with one membership. Removing the last owner stays refused.
- Invitation expiry remains a technical-design choice. Who may accept does not.
