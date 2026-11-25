# Constitution: notes-app

> A single-user note-taking web app with an Angular frontend and a Supabase backend.

## 1. Identity

- Kind: product
- Applies to: every package in the notes-app group

## 2. Requirements

| ID  | Requirement                                                  |
| --- | ------------------------------------------------------------ |
| R1  | Notes are private to their author.                           |
| R2  | The app works offline and syncs when the connection returns. |

## 3. Non-goals

| ID  | Non-goal                                  |
| --- | ----------------------------------------- |
| N1  | No collaborative editing of shared notes. |

## 4. Decisions

| ID  | Topic         | Decision                                                               | Serves | Checked by           | Status | Why                                              |
| --- | ------------- | ---------------------------------------------------------------------- | ------ | -------------------- | ------ | ------------------------------------------------ |
| D1  | Authorization | Row-level security on every table restricts rows to their author.      | R1     | test                 |        |                                                  |
| D2  | Authorization | The client never filters notes by author as a security measure.        | R1     | review               |        | Client filtering hides rows; it doesn't protect. |
| D3  | Sync          | Local edits are queued in IndexedDB and replayed in order when online. | R2     | test, tool:sync-port |        |                                                  |
