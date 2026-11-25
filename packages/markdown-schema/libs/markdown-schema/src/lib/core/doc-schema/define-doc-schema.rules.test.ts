/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access --
   `DocOf` degrades to `any` inside `refine` while a schema is being defined (see defineDocSchema). */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { defineDocSchema } from './define-doc-schema.rules.ts';
import { freetext } from '../extractors/freetext.rules.ts';
import { table } from '../extractors/table.rules.ts';
import { taskList } from '../extractors/task-list.rules.ts';
import { repeated } from '../extractors/repeated.rules.ts';
import { fencedCodeWithMarker } from '../extractors/fenced-code-with-marker.rules.ts';

// ---------------------------------------------------------------------------
// Example 1 — React component spec
// ---------------------------------------------------------------------------

const DataRow = z
  .object({
    Prop: z.string().min(1),
    Type: z.string().min(1),
    Description: z.string().min(1),
  })
  .strict();

const ActionRow = z
  .object({
    Name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'camelCase'),
    Params: z.string().min(1),
    Description: z.string().min(1),
  })
  .strict();

const InteractionRow = z
  .object({
    Description: z.string().min(1),
    Action: z.string().min(1),
  })
  .strict();

const ComponentDoc = defineDocSchema({
  title: { schema: z.string().regex(/^[A-Z][A-Za-z0-9]*$/, 'PascalCase') },
  sections: {
    description: {
      heading: 'Description',
      extract: freetext,
      schema: z.string().min(20),
    },
    data: {
      heading: 'Data',
      extract: table,
      schema: z.array(DataRow).min(1),
    },
    actions: {
      heading: 'Actions',
      extract: table,
      schema: z.array(ActionRow),
    },
    interactions: {
      heading: 'Interactions',
      extract: table,
      schema: z.array(InteractionRow),
    },
  },
  refine: (doc, ctx) => {
    const known = new Set(doc.actions.map((a: { Name: string }) => a.Name));
    doc.interactions.forEach((it: { Action: string }, i: number) => {
      if (!known.has(it.Action)) {
        ctx.addIssue({
          code: 'custom',
          path: ['interactions', i, 'Action'],
          message: `"${it.Action}" is not defined in Actions`,
        });
      }
    });
  },
});

const COMPONENT_DOC_MD = `
# UserProfileCard

## Description

Renders a compact card showing a user's avatar, name, and role. The avatar
sits on the left as a 48px circle. Name and role stack vertically to its right.
A trailing menu button reveals contextual actions on click.

## Data

| Prop     | Type    | Description                             |
| -------- | ------- | --------------------------------------- |
| user     | User    | The user record to display.             |
| compact  | boolean | When true, hides the role line.         |
| menuOpen | boolean | Whether the contextual menu is visible. |

## Actions

| Name      | Params               | Description                          |
| --------- | -------------------- | ------------------------------------ |
| openMenu  | () => void           | Opens the contextual menu.           |
| closeMenu | () => void           | Closes the contextual menu.          |
| editUser  | (id: string) => void | Triggers the edit flow for the user. |

## Interactions

| Description                     | Action    |
| ------------------------------- | --------- |
| Click the menu button           | openMenu  |
| Press Escape while menu is open | closeMenu |
| Select "Edit" from the menu     | editUser  |
`.trim();

describe('ComponentDoc (Example 1)', () => {
  it(
    'parses a valid component doc',
    { tags: ['invariant'], meta: { spec: 'define-doc-schema-parses-a-valid-component-doc' } },
    () => {
      const doc = ComponentDoc.parse(COMPONENT_DOC_MD);
      expect(doc.title).toBe('UserProfileCard');
      expect(doc.description).toContain('avatar');
      expect(doc.data).toHaveLength(3);
      expect(doc.actions).toHaveLength(3);
      expect(doc.interactions).toHaveLength(3);
    },
  );

  it(
    'rejects a non-PascalCase title',
    { tags: ['invariant'], meta: { spec: 'define-doc-schema-rejects-a-non-pascalcase-title' } },
    () => {
      const bad = COMPONENT_DOC_MD.replace('# UserProfileCard', '# userProfileCard');
      expect(() => ComponentDoc.parse(bad)).toThrow();
    },
  );

  it(
    'rejects an interaction referencing an undefined action',
    {
      tags: ['invariant'],
      meta: { spec: 'define-doc-schema-rejects-an-interaction-referencing-an-undefined-action' },
    },
    () => {
      const bad = COMPONENT_DOC_MD.replace(
        '| Select "Edit" from the menu     | editUser  |',
        '| Select "Edit" from the menu     | deleteUser |',
      );
      expect(() => ComponentDoc.parse(bad)).toThrow();
    },
  );

  it(
    'throws on missing required section',
    { tags: ['invariant'], meta: { spec: 'define-doc-schema-throws-on-missing-required-section' } },
    () => {
      const bad = `# MyCard\n\n## Description\n\nLong enough description here for the schema.\n\n## Actions\n\n| Name | Params | Description |\n|------|--------|-------------|\n| foo | () => void | desc |\n\n## Interactions\n\n| Description | Action |\n|-------------|--------|\n| Click | foo |`;
      expect(() => ComponentDoc.parse(bad)).toThrow(`Missing required section: "Data"`);
    },
  );
});

// ---------------------------------------------------------------------------
// Example 2 — API doc with repeating endpoints
// ---------------------------------------------------------------------------

const ParamRow = z
  .object({
    Param: z.string().min(1),
    Type: z.string().min(1),
    Description: z.string().min(1),
  })
  .strict();

const Endpoint = z
  .object({
    heading: z.string().regex(/^(GET|POST|PUT|PATCH|DELETE) \/\S*/, 'METHOD /path'),
    description: z.string().min(10),
    params: z.array(ParamRow),
  })
  .strict();

const ApiDoc = defineDocSchema({
  title: { schema: z.string() },
  sections: {
    endpoints: {
      heading: 'Endpoints',
      extract: repeated({ shape: { description: freetext, params: table } }),
      schema: z.array(Endpoint).min(1),
    },
  },
  refine: (doc, ctx) => {
    const seen = new Set<string>();
    doc.endpoints.forEach((e: { heading: string }, i: number) => {
      if (seen.has(e.heading)) {
        ctx.addIssue({
          code: 'custom',
          path: ['endpoints', i, 'heading'],
          message: `Duplicate endpoint: ${e.heading}`,
        });
      }
      seen.add(e.heading);
    });
  },
});

const API_DOC_MD = `
# Users API

## Endpoints

### GET /users

Returns a paginated list of users sorted by creation date.

| Param | Type   | Description            |
| ----- | ------ | ---------------------- |
| page  | number | 1-based page number.   |
| limit | number | Items per page (≤100). |

### POST /users

Creates a new user and returns the created record.

| Param | Type   | Description        |
| ----- | ------ | ------------------ |
| name  | string | Full display name. |
| email | string | Unique email.      |

### DELETE /users/:id

Permanently deletes a user.

| Param | Type   | Description     |
| ----- | ------ | --------------- |
| id    | string | User ID (UUID). |
`.trim();

describe('ApiDoc (Example 2)', () => {
  it(
    'parses a valid API doc',
    { tags: ['invariant'], meta: { spec: 'define-doc-schema-parses-a-valid-api-doc' } },
    () => {
      const doc = ApiDoc.parse(API_DOC_MD);
      expect(doc.title).toBe('Users API');
      expect(doc.endpoints).toHaveLength(3);
      expect(doc.endpoints[0].heading).toBe('GET /users');
      expect(doc.endpoints[0].params).toHaveLength(2);
    },
  );

  it(
    'rejects duplicate endpoints',
    { tags: ['invariant'], meta: { spec: 'define-doc-schema-rejects-duplicate-endpoints' } },
    () => {
      const bad =
        API_DOC_MD +
        '\n\n### GET /users\n\nDuplicate endpoint.\n\n| Param | Type | Description |\n|-------|------|-------------|\n| x | y | z |';
      expect(() => ApiDoc.parse(bad)).toThrow();
    },
  );

  it(
    'rejects endpoints section with no entries',
    {
      tags: ['invariant'],
      meta: { spec: 'define-doc-schema-rejects-endpoints-section-with-no-entries' },
    },
    () => {
      const bad = '# Empty API\n\n## Endpoints\n\nNo sub-headings here.';
      expect(() => ApiDoc.parse(bad)).toThrow();
    },
  );
});

// ---------------------------------------------------------------------------
// Example 3 — Social post template
// ---------------------------------------------------------------------------

const PostDoc = defineDocSchema({
  sectionDepth: 1,
  sections: {
    post: {
      heading: 'Post',
      extract: freetext,
      schema: z
        .string()
        .min(1)
        .max(3000)
        .refine((s) => /^\p{Extended_Pictographic}/u.test(s), 'must start with an emoji')
        .refine((s) => /#\w+/.test(s), 'must contain at least one hashtag'),
    },
    code: {
      heading: 'Code',
      extract: fencedCodeWithMarker({
        marker: /prettier-ignore/,
        markerLabel: '<!-- prettier-ignore -->',
      }),
      schema: z.object({ lang: z.string().min(1), value: z.string().min(1) }),
    },
    comment: {
      heading: 'Comment',
      extract: freetext,
      schema: z.string().min(1),
      optional: true,
    },
    remark: {
      heading: 'Remark',
      extract: freetext,
      schema: z.string().min(1),
      optional: true,
    },
    groups: {
      heading: 'Groups',
      extract: taskList,
      schema: z
        .array(
          z.object({
            checked: z.boolean(),
            text: z.enum(['All things', 'Angular 2+']),
          }),
        )
        .min(1),
    },
  },
});

const POST_DOC_MD = `
# Post

🅰️ #Angular 22 will make exhaustive type checking in switch even smarter.

# Code

<!-- prettier-ignore -->
\`\`\`ts
const x: 'a' | 'b' = 'a';
\`\`\`

# Comment

https://github.com/angular/angular/pull/67748

# Remark

# Groups

- [ ] All things
- [ ] Angular 2+
`.trim();

describe('PostDoc (Example 3)', () => {
  it(
    'parses a valid post doc',
    { tags: ['invariant'], meta: { spec: 'define-doc-schema-parses-a-valid-post-doc' } },
    () => {
      const doc = PostDoc.parse(POST_DOC_MD);
      expect(doc.post).toContain('#Angular');
      expect(doc.code.lang).toBe('ts');
      expect(doc.comment).toContain('github.com/angular/angular/pull/67748');
      expect(doc.remark).toBeUndefined();
      expect(doc.groups).toHaveLength(2);
      expect(doc.groups[0]?.checked).toBe(false);
    },
  );

  it(
    'rejects post without emoji prefix',
    { tags: ['invariant'], meta: { spec: 'define-doc-schema-rejects-post-without-emoji-prefix' } },
    () => {
      const bad = POST_DOC_MD.replace(
        '🅰️ #Angular 22 will make exhaustive type checking in switch even smarter.',
        'No emoji #hashtag here.',
      );
      expect(() => PostDoc.parse(bad)).toThrow();
    },
  );

  it(
    'rejects post without hashtag',
    { tags: ['invariant'], meta: { spec: 'define-doc-schema-rejects-post-without-hashtag' } },
    () => {
      const bad = POST_DOC_MD.replace(
        '🅰️ #Angular 22 will make exhaustive type checking in switch even smarter.',
        '🅰️ No hashtag in this post.',
      );
      expect(() => PostDoc.parse(bad)).toThrow();
    },
  );

  it(
    'optional sections absent yields undefined',
    {
      tags: ['invariant'],
      meta: { spec: 'define-doc-schema-optional-sections-absent-yields-undefined' },
    },
    () => {
      const withoutRemark = POST_DOC_MD;
      const doc = PostDoc.parse(withoutRemark);
      expect(doc.remark).toBeUndefined();
    },
  );
});
