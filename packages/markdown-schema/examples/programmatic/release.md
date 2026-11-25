---
name: Plugin Loader
stage: ga
---

# v2.0.0

## Summary

Rewrites the plugin loader to support async plugins and removes the legacy
`v1` configuration format. Existing plugins keep working through a thin compat
shim that is scheduled for removal in v3.

## Highlights

- Async plugin support via `loadPlugin()`
- Removed the deprecated `v1` config adapter
- 40% faster cold start on large plugin sets

## Checklist

- [x] Unit tests updated
- [x] Migration guide written
- [x] Changelog entry published

## Acceptance Criteria

| ID     | Description                                  | Priority |
| ------ | -------------------------------------------- | -------- |
| AC-001 | Async plugin loads in under 100 ms           | High     |
| AC-002 | Legacy v1 config emits a deprecation warning | Medium   |

## Examples

```ts
const plugin = await loadPlugin("logger");
```

```sh
npx plugin-loader --list
```

## Signature

<!-- prettier-ignore -->
```ts
export async function loadPlugin(name: string): Promise<Plugin>
```

## Changes

### add: `loadPlugin()`

New async entry point that resolves and initializes a plugin by name.

| Param | Type   | Default | Description  |
| ----- | ------ | ------- | ------------ |
| name  | string | —       | Plugin name. |

```ts
const p = await loadPlugin("logger");
```

### fix: race in plugin cache

Concurrent `loadPlugin()` calls for the same name no longer double-initialize.

### chore: drop `v1` adapter

Removes `config.v1` handling. No params, no snippets.

## Migration

---

Replace every `createPlugin()` call with `await loadPlugin()`.

---

Delete any `config.v1` keys from your configuration files.

## Appendix

See the full changelog at `CHANGELOG.md` for prior releases.
