# app-shell/shelf-status

> See which shelf is open and whether its data is live.

## Structure

| ID  | Element | Role     | Parent | Shows                | Layout              | Selecting it |
| --- | ------- | -------- | ------ | -------------------- | ------------------- | ------------ |
| S1  | status  | `status` | —      | the shelf and "Live" | fixed 160px, see R1 | —            |

## Rules

| ID  | Rule                                  | Why                                             | Checked by |
| --- | ------------------------------------- | ----------------------------------------------- | ---------- |
| R1  | The status has a fixed width (160px). | The header must not move as the status changes. | visual     |
