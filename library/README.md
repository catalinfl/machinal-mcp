# Client-owned MCP authoring library

This directory and the adjacent `skills/` belong to the installed `@machinal/mcp`
package. The API is not the canonical store for authoring content.

- `guides/`: workflow, brief, production, recipes, media, effects and typography.
- `animation-skills/`: canonical focused native skill sources.
- `film-library/`, `film-styles.json`, `film-techniques.json`: Cinema direction.
- `scene-templates/`, `hyperframes-native/`: editable Svelte and verification.
- `hyperframes-library/`: inactive original references with provenance/licences.
- `examples/`, `styles.json`: strict YAML examples and editorial profiles.
- `catalog.v1.json`, `scene-runtime.md`: offline execution-contract snapshots.

The local reader exposes only registered/pinned files, with lazy source lookup
and integrity checks. Sources do not authorize media access, providers, rendering
or downloads. Original upstream material is reference data, not setup instructions.

Renderer modules and default runtime assets stay in the scene renderer, not in
this npm package. The configured service validates submissions and renders. Always check its
live schema/capabilities and actual runtime support; an offline snapshot is not
proof of current provider, pricing or renderer health.

`manifest.json` is rebuilt with `npm run build:library`. Generated skill-reference
copies are checked with `npm run check:reference`. Client-specific skill discovery
folders are installed by setup, without changing the canonical package sources.
