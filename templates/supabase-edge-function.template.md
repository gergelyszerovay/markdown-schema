# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

<!-- TEMPLATE-ONLY: guide
// Title: the function name verbatim (e.g. `llm-proxy`), as deployed via
// `supabase functions deploy <name>`. Summary: one sentence stating what
// each request to the function does.
-->

## 1. Identity

- Function: <!-- TEMPLATE-ONLY: string; required; regex `^[a-z][a-z0-9-]*$` -->
- Path: <!-- TEMPLATE-ONLY: string; required; regex `^/functions/v1/[a-z][a-z0-9-]*$` -->
- Auth strategy: <!-- TEMPLATE-ONLY: enum: gateway-jwt | function-jwks | none; required -->
- Deploy flag: <!-- TEMPLATE-ONLY: string; default= -->

<!-- TEMPLATE-ONLY: guide
// Auth strategy:
//   gateway-jwt   — default; Supabase gateway verifies JWT before invoking.
//   function-jwks — function verifies JWT itself via JWKS; deploy with
//                   `--no-verify-jwt` to disable the gateway check.
//   none          — public function; deploy with `--no-verify-jwt` and
//                   document the rationale in §9.
// Deploy flag is the literal CLI argument (e.g. `--no-verify-jwt`).
-->

## 2. Request

| Method | Content-Type | Body schema |
| ------ | ------------ | ----------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Method: enum: GET | POST | PUT | PATCH | DELETE | OPTIONS
Content-Type: string; default=
Body schema: string; required
-->

| POST | application/json | `@terv-dev/llm-types#LlmProxyRequest` |

<!-- TEMPLATE-ONLY: guide
// One row per accepted method. Body schema cites a workspace TS type when
// validated against one, or `n/a` for methods that ignore the body.
-->

## 3. Response shapes

| Format | Body |
| ------ | ---- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Format: enum: text | json | image | stream | none
Body: string; required
-->

| json | `{ data, model, usage }` |

<!-- TEMPLATE-ONLY: guide
// Distinct successful response shapes. List each format the function can
// return, with a compact summary of its body. Errors are captured in §6.
-->

## 4. Flow

| Step | Stage | Outcome |
| ---- | ----- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 3
Step: string; required; regex `^\d+$`
Stage: string; required
Outcome: string; required
-->

| 1 | CORS preflight | OPTIONS → 204 |
| 2 | Parse body | 400 invalid_request on failure |
| 3 | Authenticate | 401 unauthorized on failure |

<!-- TEMPLATE-ONLY: guide
// Numbered request lifecycle. Each step names the stage (parse, auth,
// validate, call, deduct, ...) and what it produces or fails with.
// ≥3 steps required — anything simpler is probably a webhook handler.
-->

## 5. External calls

<!-- TEMPLATE-ONLY: section; optional -->

| Target | Purpose |
| ------ | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Target: string; required
Purpose: string; required
-->

| OpenRouter `POST /api/v1/chat/completions` | LLM completion |

<!-- TEMPLATE-ONLY: guide
// HTTP calls to other services and to Supabase RPCs. Omit the section
// for functions that operate purely on the request payload.
-->

## 6. Error codes

| Status | Code | Trigger |
| ------ | ---- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Status: string; required; regex `^[1-5]\d{2}$`
Code: string; required; regex `^[a-z][a-z0-9_]*$`
Trigger: string; required
-->

| 400 | invalid_request | Body fails JSON parse or top-level schema. |

<!-- TEMPLATE-ONLY: guide
// Every error code the function returns. Code is the string in
// `{"error": "..."}`. Status is the HTTP status. Each row should describe
// one distinct failure path.
-->

## 7. Environment variables

<!-- TEMPLATE-ONLY: section; optional -->

| Name | Source | Purpose |
| ---- | ------ | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Name: string; required; regex `^[A-Z][A-Z0-9_]*$`
Source: enum: runtime | secret | env-file
Purpose: string; required
-->

| OPENROUTER_API_KEY | secret | OpenRouter authentication |

<!-- TEMPLATE-ONLY: guide
// Variables the function reads at runtime. Source `runtime` covers values
// auto-provided by the Supabase runtime (SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY); `secret` covers values set via
// `supabase secrets set`; `env-file` covers any `.env`-sourced values.
-->

## 8. CORS

- Allowed origins: <!-- TEMPLATE-ONLY: string; required -->
- Allowed methods: <!-- TEMPLATE-ONLY: string; required -->
- Headers on every response: <!-- TEMPLATE-ONLY: enum: yes | no; required -->

<!-- TEMPLATE-ONLY: guide
// CORS configuration. The "Headers on every response" flag MUST be `yes`
// when the function is reachable from a browser — error responses need
// the headers too or the browser swallows the message.
-->

## 9. Notes

<!-- TEMPLATE-ONLY: freetext; required -->

<!-- TEMPLATE-ONLY: guide
// Auth-strategy rationale (when `none`), JWKS implementation notes,
// performance characteristics, history.
-->
