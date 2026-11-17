# machinal MCP installer

Set up **Codex, Claude Code or OpenCode V2** with a resilient stdio adapter. Choose an independent local backend with your own OpenRouter key, or an existing server with a Machinal application key. A private stable runtime outside npm's cache runs with Node directly, including on Windows.

See the repository's [testing guide](../../docs/TESTING.md) for source-package and pre-publish checks.

## Local component library

The npm package owns the complete authoring distribution: `skills/` and
`library/`. This includes all workflow guides and animation skills, 66 Cinema
styles and directing references, editorial profiles, recipe examples, 455
published native Hyperframes components (two deferred), editable scene
templates, original sources and licences. None of these
authoring sources are embedded in the Go API. The development gallery imports
the same client-owned components.

- OpenCode: use native `machinal_library` and `machinal_hyperframes_source`.
- Claude Code/Codex/other stdio clients: use `get_library_reference` and
  `get_hyperframes_source` on the Machinal adapter.
- Catalog/source reads work offline without a key. Exact IDs load source;
  discovery stays paginated. Files are pinned by the library manifest.
- Search each distinct animated beat with `topic: "component-discovery"`.
  For example: `query: "cronologie", role: "timeline",
  profiles: ["educational", "social"], aspect: "portrait"`. Romanian and English
  aliases and partial action matches are supported. Profiles (`educational`,
  `social`, `documentary`, `product`) and aspect boost matches; they do not filter.
  Use a scene `role` alone to browse after a miss. The default response ranks two
  installable candidates with match reasons, format evidence, and editable
  parameters, without source payloads. Read the selected `source`, compile with
  its `compileInput`, and place the returned pinned asset in the timeline.
- Legacy `get_editing_reference` authoring calls and resource URIs are served
  locally by the adapter/OpenCode companion. The direct API returns only a
  compatibility notice for moved authoring guides, not the source.
- The stable private runtime copies the library out of npm's cache. Updating
  sources/assets changes its content fingerprint, even at the same package version.
- `compile_scene`, media access, providers and rendering still use the configured
  service and their normal permissions. Renderer modules and default runtime assets
  stay in the service, not in the MCP package. Runtime imports must be compatible there.
  Installing templates does not select local rendering or grant spending approval.
- OpenCode `compile_scene` accepts either `component` (inline Svelte) or
  `componentFile` (an absolute local `.svelte` path). The companion reads the
  file with host permission and passes its content to the original tool.
  `sourceFile` still names an existing server scene being edited.

`npm run build:library` and `npm run sync:reference` operate entirely within
this package; they do not read authoring files from the API tree. Maintainers can
explicitly refresh execution-contract snapshots from a full
checkout with `npm run update:library-contracts`. Live schema/capabilities,
renderer support, account/project state and credits remain service-owned.

Rebuild with `npm run build:library` and `npm run sync:reference` before packing;
publishing npm and deploying the API
remain separate explicit operations. Existing installed users do not receive
unpublished checkout changes automatically.

### Version 0.5.1: bounded concurrency and recipe diagnostics

### Version 0.6.1: guided component discovery and safer scene authoring

Adds offline action-based discovery for native scene templates and Hyperframes components, asks explicitly about sound effects when the brief leaves that choice open, and lets OpenCode compile a local `.svelte` file through the normal host permission flow. Improves library response compatibility and packages the complete client-owned authoring library. This npm release does not deploy the API or change existing installations; run `machinal setup` after upgrading to refresh the installed companion.

```sh
npm install -g @machinal/mcp@0.6.1
machinal setup
```

Version 0.5.1 adds separate adapter lanes for 8 reads, 8 job waits, 4 other tool calls and 2 control calls, with bounded queues and cancellation rather than a shared eight-request rejection cap. No submitted paid call is retried. Backend independent media jobs default to 4 per process (`MACHINAL_MEDIA_CONCURRENCY=1..16`); this is separate from MCP requests and render workers. Updated APIs report parse failures before caption guards, add a bounded narration/caption text-difference report and return compact `get_project` summaries (`fullResult:true` for editing). The OpenCode companion reuses project IDs and original beat contracts from approved checkpoints. See [scope, limits and activation](../../docs/MCP.md#recipe-diagnostics-and-concurrency-hardening-source-changes). npm publication does not deploy the API backend.

### Version 0.5.0: animation crafts and sound library

Version 0.5.0 introduced five additional on-demand skills: `machinal-motion`, `machinal-choreography`, `machinal-spatial`, `machinal-visual-review` and `machinal-sound`. Canonical skill sources now live in this package's `library/animation-skills`; `npm run sync:reference` synchronizes them for all supported clients. The local adapter serves them through `get_library_reference(topic: animation-skills)` and handles older authoring-reference calls locally. Startup still loads editing/cinema only, not every craft.

API MCP **1.10.0** adds phase-based `plan_scene_review`, provisional review plans on synchronous compilation, three native templates, and approved Openverse/Freesound sound search/import with persisted licence attribution. See [the API workflow and activation boundaries](../../docs/MCP.md#animation-crafts-phase-based-review-and-licensed-sound-effects-mcp-1100). Source changes do not publish npm or deploy the API; use the checkout's setup command for source installations and normal customized-skill replacement approval. No unrequested sound, media download, provider generation or paid preview is authorized by installing a skill.

## Quick start

Requires **Node.js 22.13+ (22.x) or 24+** and an installed agent client. **Machinal Server** needs only a Machinal key with account/API access: its official endpoint is selected automatically, with no address question and no Docker/provider key on the client. **Custom server** is the advanced option for your own API URL. Independent local needs Docker/Compose v2, this version's source checkout, and your OpenRouter key/model settings: **no Machinal account, subscription, credits or PocketBase**. The npm package does not bundle the Go backend or guess an unpublished container image.

**Server: one Machinal key. Local: your OpenRouter key.** Hidden entry and opt-in persistent storage are supported: Windows Credential Manager on Windows; a private plaintext credentials file on Linux. All three stdio adapters read the saved key without a launcher. macOS retains environment/hidden-entry behavior. No key belongs in chat or command arguments.

### Short commands (0.4.4)

Install the CLI once with `npm install -g @machinal/mcp`, then use `machinal <command>`. From a source checkout, use `node packages/mcp-installer/bin/machinal-mcp.mjs <command>`:

```sh
machinal setup
machinal set-key       # Hidden entry, verify, then confirm saving
machinal getcredit     # Live balance; no spending
machinal place         # Processing, source folder and download locations
machinal place --uploads /home/me/Media --downloads /home/me/Videos
machinal local status
machinal local install --docker-dir /path/to/machinal
```

The existing `machinal-mcp` binary and `key set` / `key delete` remain compatible. Once installed, use `machinal` directly; no npm runner prefix is needed.

### Upgrade or clean uninstall

For a normal upgrade, run `npm install -g @machinal/mcp@0.6.1`, then `machinal setup` from the project. OpenCode setup replaces old managed companion versions (including `0.4.3`) across the project, its ancestors, global config and recorded OpenCode installs in the same profile. It retains the saved key, endpoints, project media and unrelated settings. An npm install alone replaces only the CLI; it does not rewrite agent configurations.

For a full removal, including the saved key, use:

```sh
machinal uninstall
# Unattended, explicitly confirming the same full cleanup:
machinal uninstall --yes
# Install again when needed:
npm install -g @machinal/mcp
machinal setup
```

Uninstall removes Machinal MCP registrations and **all old Machinal companion versions**, including `@machinal/mcp@0.4.3`, from recorded installations and the current/global/ancestor client configurations. It removes bundled skill files (including edits and legacy `directional-*` counterparts), private runtime versions, catalog caches, connection/folder preferences, local provider/device profiles and the saved application key. Finally it runs `npm uninstall -g @machinal/mcp` if a global package is installed. It never reads or prints the saved secret.

Projects, media, Docker services/images/volumes, shared npm/OpenCode caches, unrelated plugins/settings/files, configuration backups and user-only skill files are preserved. Config backups may still contain old plugin references but are not loaded by OpenCode. An already running process or environment variable can retain a key; deletion does not revoke it in the account. OpenCode watches config changes; use `/reload` if a stale failure badge remains. No automatic client restart or Docker deletion is performed.

**Use `machinal uninstall` before deleting the npm package.** Modern npm does not run uninstall lifecycle hooks: `npm uninstall -g @machinal/mcp` alone cannot clean external client configuration. If the CLI was already removed, install it again and run the clean uninstall. Future setups record only non-secret installation locations in `machinal/installations.json`, so cleanup can find other configured projects without scanning the disk. Pre-registry installations in other projects must be cleaned from those project folders before the final global CLI removal. Unsafe/changed files abort cleanup, and a failed cleanup retains the CLI and installation registry for retry.

Linux saves a key only after explicit approval to `$XDG_CONFIG_HOME/machinal/credentials.json`, or `~/.config/machinal/credentials.json`. Directory mode is `0700`, file mode `0600`; the file is **not encrypted** and other processes running as that user can read it. Saves are atomic, do not create secret backups, and never fall back to a project file. Incorrect ownership, exposed permissions, symlinks, corrupt data or an unreadable file produce a sanitized diagnostic, not a missing-key assumption. The CLI, stable adapter and Linux OpenCode companion use the same location. `MACHINAL_API_KEY` (then legacy `DIRECTION_API_KEY`) takes precedence on Linux; remove a stale environment override to use the saved replacement.

`set-key` uses the last configured hosted endpoint (or the official service for a new setup) and verifies before saving. `key set` without `--url` retains its legacy format-only behavior. Linux OpenCode's `replace` directs the **user** to hidden terminal entry; it never requests a key through chat or launches Windows UI. Changes are picked up automatically or with `machinal_connection reconnect`.

`place` stores only host-side folder preferences in `machinal/config.json`, separately from credentials. Uploads still go to the named project's volume; the source folder is a suggestion, not automatic browsing or transfer permission. Native OpenCode project downloads prefer an explicit destination, then this host's saved folder, then the API's saved preference. Internet downloads still require an explicit destination. Setting a folder transfers nothing and does not change the server's preferences.

Local mode detects a saved profile and reuses a running backend. With permission it builds missing Docker images from a detected checkout, or starts installed images without rebuilding. `--yes` alone does not authorize Docker startup; use `--start-docker` for unattended installation. Docker/Compose and a source checkout are prerequisites: no Engine installation with administrator privileges, guessed public image or private source publication is performed. Choosing Server never inspects or installs Docker.

**Migration compatibility:** existing `dal_…` keys, `DIRECTION_API_KEY` / `DIRECTION_API_ORIGIN` environment variables, and the previous Windows Credential Manager entry continue to work. New setups use `mach_…`, `MACHINAL_API_KEY` / `MACHINAL_API_ORIGIN`, and `Machinal/mcp.MACHINAL_API_KEY`; when both environment names are set, `MACHINAL_API_KEY` takes precedence. New keys are issued with the `mach_` prefix.

**Version 0.6.1:** install this release from the `@machinal` scope, then use the short command:

This release adds focused animation/sound skills and richer scene review guidance/templates, retaining native approved client-file uploads and language-independent video preparation. `machinal_prepare_video` loads editing/cinema startup skills; other crafts stay on demand, and scene compilation/final rendering are guarded until startup context is loaded. No keyword classifier, extra model call or automatic spending is introduced.

OpenCode compatibility: production startup accepts the V2 skill-list response (`{ location, data }`) and legacy arrays. If optional skill discovery fails or changes shape, it emits a sanitized warning instead of preventing session setup. Regression tests cover both response shapes and discovery failures; the release gate tests the packed artifact as well.

```sh
npm install -g @machinal/mcp@0.6.1
machinal setup
# Machinal Server: no URL entry, only your Machinal key:
machinal setup --client opencode --mode server
machinal setup --client codex --mode server
machinal setup --client claude --scope global --mode server
# Independent local; the wizard asks for OpenRouter and model IDs:
machinal setup --client codex --mode local --docker-dir /path/to/machinal
machinal setup --client claude --mode local --docker-dir /path/to/machinal
# Your own deployment, explicitly selected:
machinal setup --client opencode --mode custom --url https://YOUR-API/mcp
```

The wizard asks for:

1. **OpenCode V2**, **Claude Code**, or **Codex**.
2. Project or global scope (**Codex defaults to global**, because untrusted project config is ignored; other clients default to project).
3. **Machinal Server**, **Local**, or **Custom server (advanced)**. Machinal Server automatically uses `https://api.machinal.app/mcp` and never asks for an address or starts Docker. Local builds an independent backend with loopback host publishing and separate volumes; its default is `http://127.0.0.1:8080/mcp`. Custom server asks for your own API URL, **not the frontend URL**, without offering localhost as a guessed hosted default.
4. Whether to install bundled editing, YAML recipe, scene and credit-awareness skills, and a default editing style.
5. **Machinal Server:** hidden Machinal key, reuse environment/saved key, or login later (`--defer-login`). Create keys at <https://machinal.app/api-keys>; custom deployments use their own account website. **Local:** hidden `OPENROUTER_API_KEY`, required `OPENROUTER_MODEL`, optional scene/transcription model IDs, source checkout and explicit Docker approval. A device token is generated automatically; no local Machinal key is requested.
6. Server mode on Windows/Linux: optionally remember a verified key in the platform's storage (default: no; Linux explicitly identifies plaintext storage).
7. Optional client launch. `--no-launch` works even when login is deferred.

Setup preserves unrelated settings, backs up changed files and installs optional skills. Missing login/offline Server still permits adapter installation, with an explicit **unverified** service status. Verification uses initialization, tool discovery and read-only billing mode, never generation, rendering, provider calls or credit purchases. An API probe is never reported as a running client connection.

The official Machinal Server URL is fixed to the verified production endpoint `https://api.machinal.app/mcp`. Selecting it ignores stale `MACHINAL_API_ORIGIN` / `DIRECTION_API_ORIGIN` values, including localhost. Those environment variables remain defaults for Custom server. `--mode hosted` aliases Machinal Server. Explicit `--url` scripts, including legacy `--mode server --url ...` overrides, remain supported but are classified as Custom server when the URL differs from the official service. HTTP is accepted only on loopback; other endpoints need HTTPS. Redirects are refused. No remote mode starts Docker.

**Independent local does not mean free upstream AI.** Rendering uses your hardware; AI usage is charged directly by OpenRouter. Provider/device secrets live under `~/.config/machinal/local/` (or `$XDG_CONFIG_HOME/machinal/local/`), never `api/.env` or client config. Protect these files and backups: POSIX modes are private; Windows uses your filesystem ACLs. Reuse preserves the token/volumes; `--configure-local` explicitly changes provider settings. Installation grants no media-access, upload or AI-spending permission. Source-folder mounts still need separate approval.

### Connection status, not a broken MCP

The local stdio handshake does not depend on login/network. The always-available **`connection_status`** tool reports `login_required`, `connection_unavailable`, `account_access_required`, `rate_limited` or `connected`, separately from `transport: connected`. Reconnect reloads credentials and tool discovery, never submitted jobs. A cached verified catalog supports discovery during outages; it is not proof that the service is online. Successful recovery publishes MCP list-change notifications.

**UI badges belong to the client.** An API-key adapter cannot force Codex/Claude/OpenCode's native **Needs authentication** badge; that requires real OAuth, which this API does not implement. Real process/configuration errors can still show MCP failure. No availability guarantee is made during network/Node failures.

Uncertain tool submissions are **never retried automatically**. Recover existing jobs/idempotency keys before resubmitting. Auto-reconnection performs free initialization/catalog discovery only. Terminal diagnostics: `machinal doctor --url https://YOUR-API/mcp` (exit 0 only after successful service discovery). No credentials are accepted as tool arguments.

### Friendly recovery and local Docker

The following bullets describe **advanced direct-HTTP compatibility** (`--transport http`) for existing authenticated self-host deployments. Its historical `--mode local` helper is not the independent default above: it still requires that deployment's account/configuration. Prefer stdio for new installations. Independent local uses a private generated Compose profile, separate disk-backed jobs, loopback host publishing, and no `api/.env`/PocketBase. `--yes` alone never authorizes Docker startup; `--start-docker` is explicit approval. Containers/volumes are never deleted automatically.

- URL and key prompts validate inline. A malformed saved/environment key no longer blocks interactive setup/launch: choose hidden replacement or create a new key without deleting the old one first. Missing/invalid keys and HTTP 401/402/403 show key or membership links. For self-hosting, use the corresponding page of your own website/account backend.
- Transient network failures and HTTP 502/503/504 retry at most three times per request within a 15-second verification budget. Authentication, redirects and rate limits are not automatically retried. After HTTP 401, interactive setup can enter a different key, follow the direct creation link, retry the current key, or cancel without repeating the wizard, with at most three verification rounds. Replacement credentials are not saved if setup verification fails.
- Optional credit lookup failures become one unavailable warning; authentication loss still aborts. No unverified configuration/skill changes or key storage are committed. An interactive Windows vault outage can fall back to hidden entry.
- OpenCode on Windows reads a saved key directly through the bundled authentication integration, including in the existing shared service. It does not need `MACHINAL_API_KEY` or immediate keyed startup for a vault-only key. Other clients and unsaved prompt-only keys still require a keyed launch or a verified environment value. Saving a key does not set a shell environment variable.
- Only explicit **Local** mode attempts Docker recovery when MCP cannot be reached. A running API is reused without inspecting Docker. Setup searches the current folder and ancestors for `compose.editengine.yaml`, `api/Dockerfile`, and `services/scene-renderer/Dockerfile`; `--docker-dir PATH` selects a separate checkout. No published image name is guessed.
- It checks Docker/Compose, refuses remote Docker contexts, requires an existing `api/.env`, and inspects containers/images. With approval, it reuses existing images or builds missing ones, then runs the checkout's `api` and `scene-renderer` services with readiness waiting. Build/start may download base images, use disk/CPU, create persistent volumes and expose port 8080 according to the checkout's Compose configuration. Readiness is not proof of API authentication or provider credit.
- **`--yes` alone never authorizes build/start.** Interactive confirmation defaults to no; unattended use needs explicit `--start-docker`. No Docker Engine installation, context switching, secret creation, volume deletion, or registry publication happens automatically. A missing Docker executable links to <https://docs.docker.com/get-started/get-docker/>. Nonstandard local ports require a deployment started by the user.
- Container/build output is not dumped into the terminal because it may include secrets. Failures suggest checks for the daemon, context, ports, disk and network. Services keep running after setup, even if later MCP verification fails; manage them from the reported checkout. No destructive automatic rollback is performed.
- The terminal interface follows your terminal's background and neutral text color (white on a dark terminal), with purple headings, prompt marks and selected options. Amber/red mark warning/error labels, not paragraphs. Menus show at most five choices and collapse to one answer. Completed key prompts show `[hidden]`, not the key or its length; visibility toggling is disabled. `NO_COLOR` (including an empty value), `TERM=dumb` and piped output disable theme colors.
- Default stdio setup finishes with a compact verification/configuration/credit summary, including unattended output. Use `setup --verbose` for full credit breakdowns and diagnostics; `--help --verbose` shows all flags. Important compatibility, billing, low-balance and backup warnings remain visible. Advanced direct-HTTP compatibility retains its detailed unattended report. Backup details remain grouped into **one summary**, rather than a line per skill.

From this repository (no npm publication required):

```sh
# Machinal Server needs no API URL:
node packages/mcp-installer/bin/machinal-mcp.mjs setup --client opencode --mode server
# A separately managed development API is a Custom server:
node packages/mcp-installer/bin/machinal-mcp.mjs setup --mode custom --url http://127.0.0.1:8080/mcp
# User's local Docker: offer build/start from this checkout if the API is offline:
node packages/mcp-installer/bin/machinal-mcp.mjs setup --mode local --docker-dir .
# Independent local, with OPENROUTER_API_KEY and OPENROUTER_MODEL supplied securely:
node packages/mcp-installer/bin/machinal-mcp.mjs setup --client opencode --mode local --docker-dir . --start-docker --yes --no-launch
```

### Live credits

This section describes Server mode. Independent local returns `mode:local` / `machinalCreditsRequired:false`, not a wallet: there are no hosted credit thresholds or render tariffs to check. Direct provider charges still need user permission.

Setup calls only MCP initialization, tool discovery and the read-only `get_credits` tool. It shows a concise balance and billing notice; `--verbose` also shows the breakdown, next reset and configured pricing. Credits are charged after actual usage, not reserved for current work. Pending provider costs are informational, not a wallet lock. A brief low-balance warning appears below 30 credits; estimates are approximate. No wallet values are stored in skill files or configuration.

Older APIs without `get_credits`, unavailable ledgers and malformed balances produce a clear “unavailable” warning, not a fabricated zero. Authentication loss aborts setup. An unavailable wallet does not prevent free recipe preparation, but the agent is instructed to verify credits before submitting paid work. AI charges are not known exactly in advance, and a shared wallet delta is not an exact per-job charge.

### Bundled editing skills

**Current-client scene authoring:** after deploying the updated API, the AI already connected in OpenCode/Claude/Codex writes Svelte and uses `compile_scene` for free server validation/compilation. `get_scene_source` supports edits preserving embedded attachments. No server scene-model call or paid repair/fallback is made. Put the returned asset directly in YAML video tracks. Read `get_editing_reference(topic: scene-authoring)` or the bundled `machinal-scenes/references/authoring.md`; example `client-scene` is a compiler fixture, not real project media.

Through MCP, scene CODE written/repaired by the current client avoids the server-model generation fee. Source compilation/storage is not an encoded scene export. Server scene frame rendering AND final video encoding are billed at the configured render tariff, alongside approved image/TTS/caption usage, with separate scene/video cost fields. The host AI's own subscription limits remain separate. Rebuild/restart the API and reconnect to discover the updated tools/rules. Reinstall skills only after approving replacement of customized bundled files.

- **`machinal-editing`**: editing brief plus exact transition/effect/look/motion choices, with profiles `auto`, `cinematic`, `social`, `tutorial`, `minimal`, `documentary`, `travel`, `product`, `noir`, `retro`, `cyberpunk`, `dreamy`, `sports`.
- **`machinal-recipes`**: the full YAML envelope/field map, versions, selectors/commands, source and timeline times, metadata, typography/verified captions/audio, deterministic examples, validation and compilation. Styles become supported commands, not invented YAML keys.
- **`machinal-scenes`**: proactive beat planning with footage/still/animated Svelte scene choices, independent moving objects, real images in animated layouts, concrete scene briefs, supported generation/edit fields and staged jobs. Honors no-generation briefs and avoids scenes that add no value.
- **`machinal-cinema`**: 66 cinematic film-style prompts, directing guides, portable visual-code references and a runtime translation workflow. Includes MIT copyright notice/checksums and offline sources; uses native Swiss-grid, blueprint-mechanism and paper-stage Svelte/Three.js examples without installing an external local rendering/audio pipeline. Existing captions, consent and paid rendering rules remain unchanged. See [film-style integration](../../docs/MCP.md#cinematic-film-style-library).
- **`machinal-credits`**: live balances, spending approval, uncertain AI charges, idempotent recovery and pending/final costs.
- **`machinal-media`**: separate media consent, volume-only source uploads, approved S3 reuse/hydration, opaque expiring/revocable delivery links, bounded job waits and explicitly requested client-local downloads. A Docker/server volume is not the MCP client's filesystem; expired links never require rerendering.

The editing skill reads an installed `references/preferences.md`; the user's current brief overrides that default. **`get_editing_reference`** provides targeted live lookup of styles, full preset entries (including parameters/algorithms), YAML/scene/job semantics and complete compiler-tested examples. Use `id` for an exact entry, `query` for literal discovery and `nextOffset` for pagination. The live API wins over an offline snapshot; guidance never guarantees a particular LLM response or visual quality.

The package ships synchronized offline guides, all named profiles, the complete catalog and YAML examples beside the skills. The scene skill includes its own offline workflow; `scene-image-insert` demonstrates footage, a timed animated scene, a real image attachment and independently moving objects. These are real usage references, not merely a list of preset names. Example metadata/transcripts/revisions are synthetic and must not be presented as user assets. Pending scene/image/speech/caption examples do not execute providers or authorize spending.

Scene jobs use the editor's existing backend Svelte pipeline, not an image-only MCP bridge. Guidance asks the host to identify useful scene moments from supplied copy, verified narration/cues or approved source inspection, and author `scene.generate` plus `placements`. It does not add automatic video vision/transcription, inline component fields or spending permission. Rebuild/reconnect the API and reinstall updated skills after changing this guidance.

Detailed resources also exist at `machinal://reference/<topic>`, `machinal://examples/<id>`, `machinal://skills/editing`, `machinal://skills/credits`, `machinal://skills/media` and `machinal://recipes/guide`. `get_editing_reference(topic: media)` returns the live media workflow and exact argument examples. Setup warns when required media tools are missing, without listing or downloading any customer files. Rebuild the Go API to expose updated resources; reconnect existing clients to refresh initialization instructions. Rerun setup to install the expanded skills; changing customized files still requires separate approval/`--replace-skills`. This source change does not publish a new npm release or replace skills already installed in a user's client.

These are real `SKILL.md` files in each client's native discovery directory, not an always-injected prompt or an enforcement mechanism. Clients load relevant skills on demand; permissions, trust and explicit user instructions still apply. Use `--no-skills` to configure MCP only. Existing modified bundled files require separate approval or `--replace-skills`; server `--replace` does not authorize replacing skill files. Only the named bundled files are touched, with backups, and unrelated skills are preserved.

### Collaborative video brief

For an open-ended new video, editing, recipe and scene skills instruct the agent to ask a short round of unanswered questions about type/goal, duration, destination/aspect **and output resolution**, visual sources/style and audio/text. They use the host's native question tool (OpenCode: `question`) with all unanswered choices in one interactive multi-question form, not a numbered chat questionnaire. Options include relevant existing-photo/footage, generated-image or animated-scene choices and recommendations. After the user's answers, the agent summarizes briefly and starts authorized work immediately, without a separate plan-confirmation round or approval of every covered stage. Known media/spending permissions can be distinct explicit questions in the same form after their scope is explained and live credits checked for paid work; creative choices and cancelled forms grant no permission. Ask again only for a blocker, changed scope or missing permission. Complete briefs, small edits and “you decide” delegation skip unnecessary intake. Clients without an interactive question tool use a compact unnumbered chat fallback; the MCP itself does not render or enforce the host UI, and tool approvals remain enabled.

The guide is available live through `get_editing_reference(topic: brief)` / `machinal://reference/brief` and offline in `machinal-editing/references/brief.md`. The instructions discourage automatic production labels in titles/captions/watermarks and repeated AI disclaimers in chat, while preserving honest representation and any requested or specifically required disclosure. The narrated-documentary example uses a subject-relevant chapter heading, not a default production banner.

Use the current local source with `node packages/mcp-installer/bin/machinal-mcp.mjs setup` from the repository root to update other installed skills. Rebuild/restart the API and reconnect MCP for new live instructions/topics. Skill installation does not deploy the API, and these instructions guide the host agent rather than enforcing a conversation form on the server.

### Persistent MCP defaults

The API now exposes `get_workflow_preferences` and approved `set_workflow_preferences`. They persist per application key: `style`, `sceneMode` (`auto`, `2d`, `3d`), `imagePolicy` (`auto`, `prefer-images`, `procedural-only`) and `captionMaxWords` (default 4). Omitted fields are preserved. Current briefs override defaults; preferences never grant media access or spending permission. Three.js/font/image contracts are available through `get_editing_reference(topic: scene-runtime)` and the bundled scene runtime reference.

Connection settings remain separate: rerun setup with `--mode server|local` and the correct `--url`. Server keys come from environment, platform storage or hidden entry; independent local uses its own provider profile/device token. Neither connection proves upstream provider credit. Rebuild/reconnect for new API tools.

### Later sessions

For OpenCode on Windows or Linux, **start OpenCode normally**. The integration reads the same saved machinal key automatically and supplies it only to the exact MCP name/endpoint approved during setup. Project overrides cannot silently redirect that saved key to another API origin. Configuration contains the plugin registration and trusted endpoint, never the key. Source checkouts reference the local plugin directory; published npm installations register the matching pinned package version rather than an expendable `npx` cache path.

### Synchronized OpenCode upgrades (0.4.4)

Rerunning stdio setup from an updated package synchronizes its companion version and managed runtime in existing applicable global, ancestor and project configs, including `.opencode` configs. It does not recursively scan other projects. Matching local-development/npm duplicate entries are consolidated, while unrelated plugins, endpoints, routing options and server settings remain intact. Each changed file gets an exact backup; invalid configs, conflicting duplicate options and unapproved command overrides stop the upgrade with an actionable diagnostic. A version-only managed-runtime change does not require `--replace`; endpoint or other server changes still do.

When OpenCode loads an updated companion package, it also prepares that package's private runtime and substitutes it in memory **only after** matching the exact approved MCP command. This covers package-manager/plugin updates without a separate setup run; it does not change endpoints, write credentials, fetch another release or retry work. `machinal_connection status` includes the loaded package version, and a configuration mismatch is explicitly distinguished from a rejected API key. These changes require 0.4.4 or later.

The agent has a local **`machinal_connection`** tool even when the remote API is disconnected:

- **`status`** discovers approved MCP names/endpoints, actual connection states and credential diagnostics: Linux reports the private file path; Windows reports target `Machinal/mcp.MACHINAL_API_KEY` (service `Machinal/mcp`, account `MACHINAL_API_KEY`), never the key. Missing, redirected or incompatible MCP configurations are reported separately; keys are not sent to them.
- **`reconnect`** reloads the one saved key, checks access and reconnects the existing MCP without restarting OpenCode. Transient failures retry; a network or subscription failure is not a reason to generate more keys.
- **`replace`** on Windows opens a native window with masked entry, a direct <https://machinal.app/api-keys> link, **Use saved key**, **Verify and connect**, and Cancel. Saving requires a separate unchecked-by-default consent checkbox. Verification precedes overwrite; cancellation/rejection preserves the saved key. Linux returns terminal instructions for `set-key` instead. Neither platform passes a key through chat, tool inputs, command arguments or logs; only Linux explicitly persists it to its private plaintext file.

Only one key is stored per Windows user and reused across the configured projects/clients. A replacement is read by running automatic integrations without a separate relaunch. The plugin uses the saved key before an incidental environment value; the optional legacy launcher marks its explicitly chosen environment key so `--session-key` and intentional per-session choices still work. Secure entry requires an interactive Windows desktop; it is not promised for a headless/remote service.

The integration injects discovery/recovery guidance even while the remote MCP is down. Agents use directly exposed tools first, search Code Mode's catalog once for missing tools before declaring them absent, discover the registered server with `status` and immediately try `reconnect` once on discovery/connection/authentication failure, without asking users to find a key or restart OpenCode. Structured `code`/`nextAction` results distinguish rejected/missing keys from unreadable vaults, network failures, rate limits and account restrictions. Only missing/invalid/rejected keys call for offering secure replacement; an unreadable vault is not an absent key. Explicit session-only keys survive reconnects. Recover ambiguous paid jobs before retrying; reconnection is not spending or media consent.

The portable **`machinal-support`** skill ships this troubleshooting workflow for later sessions, with client-specific fallbacks when the local tool is not installed. The agent learns the credential's location, not its value; native integration performs the read, never a credential dump or file search.

<a id="native-downloads-and-faster-tool-access-in-opencode"></a>

### Native uploads, downloads and faster tool access in OpenCode

The integration exposes **`machinal_upload`** for approved client-local sources. Pass `projectId`, `files` with 1–100 exact absolute media paths, optional approved `server`, and `userApproved:true`. It uses the existing in-memory key, native upload/per-file read permission and streaming multipart transfer directly to the owned server project volume (not S3). Originals remain read-only. There are no generated shell scripts, keys in arguments, provider calls or render charges. File/batch limits are 2 GiB; GLB is capped at 4 MiB. Returned actual project filenames, bytes and transmitted SHA-256 are retained for metadata/recipes/scenes. Partial failures keep successful `files` plus `pending.file`; recover uncertain remote files before retrying, never auto-upload duplicates.

**Do not confuse the stdio adapter with the backend.** `type:local` means OpenCode starts an adapter process; `connection_status.mode/endpoint` determines whether it uses Machinal Server or an independent local backend. `list_local_media` only accesses configured **server-mounted** roots and is not a prerequisite for uploading a Windows client folder. A disabled-root error is not a connection error and does not require local Docker/mounts. No-upload choices still win.

The same OpenCode integration registers **`machinal_download`** as a native tool. It streams files without PowerShell, curl, generated scripts or subprocesses, and displays compact progress rather than source code. This is a client-side integration tool, not a claim that the remote MCP server can write to the user's computer. Other clients retain their own approved transfer mechanisms.

After explicit download/destination permission, use one of these argument shapes (replace the illustrative IDs, URL and directory):

```json
{"projectId":"owned-project","jobId":"0123456789abcdef0123456789abcdef","directory":"C:\\Users\\Alice\\Videos","userApproved":true}
{"projectId":"owned-project","file":"photo.png","storage":"s3","directory":"C:\\Users\\Alice\\Pictures","userApproved":true}
{"url":"https://example.org/photo.png","directory":"C:\\Users\\Alice\\Pictures","filename":"photo.png","userApproved":true}
```

Project downloads can reuse the saved directory; internet downloads require an explicit absolute directory and plain filename. `server` selects an approved MCP registration and is required when several are configured. Project credentials and temporary delivery descriptors stay in integration memory; links and redirects receive no application key. A requested clickable link still uses `get_video_result(delivery:link)` and is never downloaded unasked.

Transfers enforce a 2 GiB limit, bounded redirects/timeouts, cancellation, safe filenames, byte-count checks and a SHA-256 digest. Complete files are published atomically without overwriting; interrupted partial files are cleaned up. Internet URLs and every redirect must use HTTPS with public IP addresses, checked during DNS resolution at connection time. Only the exact approved machinal origin may use its configured private/loopback address. Downloads never execute files, import them into a project, bypass authentication, authorize media use or spend credits.

Eight small, frequently used MCP tools are exposed directly instead of requiring Code Mode search: `list_projects`, `get_workflow_preferences`, `get_credits`, `get_capabilities`, `get_recipe_schema`, `get_editing_reference`, `wait_for_job`, `get_job_result`. The remaining tools stay in Code Mode to avoid injecting every large schema into every request. Native exposure preserves the existing executor, schema and permission action, and survives MCP catalog refreshes. Agents reuse discovery, cache unchanged schema/reference knowledge and read independent guides concurrently. This removes discovery round trips; it does not accelerate the host's web-search provider or guarantee an overall latency.

Each native tool description names its exact effective ID (including custom registration prefixes) and warns against calling it inside `execute`. The native **`machinal_prepare_video`** tool initializes production guidance, including `machinal-cinema`. The CURRENT agent selects it by understanding a creation/edit request in any language: there is no prompt keyword matching, language list or second classification model. It loads actual installed skill contents into that session's context; missing skills return `blocked`. `compile_scene`/`render_video` refuse unprepared sessions before their original executors run, including after MCP catalog refresh. Original arguments, approval and idempotency checks remain unchanged. The prompt hook expands explicitly selected production skills only; it never guesses intent from text. Debugging MCP/code does not initialize production. Read the exact chosen film-style source before writing the production contract.

Local source plugin updates reload through OpenCode's plugin lifecycle; use `/reload` if its tool list is stale, not a service restart. These changes neither publish npm nor deploy a different Go API.

### Recipe files without transfer workarounds

The OpenCode integration augments the existing MCP tools while preserving their original executor and permission action:

- `get_job_result(..., recipeFile: "D:\\project\\resolved.edit.yaml")` saves the returned `recipeYaml` verbatim as UTF-8 in a **new** file, with a byte-count/SHA-256 receipt. Existing files are never overwritten. A local save failure retains the intact tool result; it never reruns generation.
- `validate_recipe`, `compile_recipe`, `generate_assets` and `render_video` accept `compositionFile` with an absolute existing `.edit.yaml` path instead of `composition`/`sourceJobId`. The integration reads the exact text with normal host permission and calls the original MCP executor. Existing idempotency, spending approval and stale-review guards remain unchanged.
- `get_job_result`, `validate_recipe` and `compile_recipe` can save a **new** `checkpointFile` ending in `.checkpoint.json`: compact project/job IDs, automatic composition/text fingerprints and diagnostics. Save the timing result with both `recipeFile` and `checkpointFile`.
- `captionBaselineFile` on later preflight/generation/render calls reads that checkpoint and applies `expectedCaptionVersion` automatically. This conservative fingerprint covers **all** recipe text entries (not just caption-marked entries) and resolved caption result IDs; scene-internal text is separate. Deliberate recipe text changes require an explicitly authorized updated baseline.
- Paid calls can read a successful preflight `checkpointFile` and apply `expectedCompositionVersion` automatically. Changed YAML is rejected by the server before submission. Pending generation requirements are allowed for `generate_assets`, not final rendering. Checkpoints never override `userApproved`, idempotency, host permissions or the critic's findings.

The API's preflight tools return compact diagnostics, requirements, plan summary, versions and reviews by default. Use `fullResult:true` only for the normalized document/plan/recovery. Targeted reference searches/IDs/pagination omit the repeated guide; `includeGuide:true` restores it, and `guideUri` remains readable separately.

This transfers recipe text, not local media. The limit is 2 MiB of valid UTF-8, matching the MCP composition limit. Patch the saved recipe instead of reconstructing captions, passing a path as `composition`, inventing compression codecs or changing namespaces. Other clients retain their normal composition-string/unchanged-`sourceJobId` workflow. `/reload` refreshes the local plugin; deploying API changes remains separate.

Conversational approval for the explained workflow is reused through its covered stages. Host tool-permission dialogs remain a separate control and are not disabled by the integration. Intermediate successful stages are not completion or a reason to ask the user to say “continue”; persistent infrastructure errors must identify the exact blocker rather than imply an unexplained model/tool limitation.

### Optional Jev intent routing in OpenCode

The existing backend router can also select one next tool with Jev's **Choice** primitive. This is an opt-in command in the OpenCode orchestrator, not another tool that the main model must discover and call. Ordinary prompts, job continuations, downloads and the free MCP `suggest_tools` catalog keep their existing behavior.

Both Jev strategies and the free MCP catalog share the same video-aware tool intents: choose `generate_assets` for approved missing illustrative artwork when SVG/CSS would be complex or overly simplistic, and `compile_scene` for composing/animating approved images. `image.generate` is a YAML job type, not a callable MCP tool. The production guidance allows 5–10 distinct images across a video when the story needs them (not a quota or cap); four image attachments is a per-scene limit, not a video-wide budget. Routing does not create an image plan, write scenes or authorize generation; the current client still follows the measured timing checkpoint, coverage plan, approved budget and media/spending permissions. No paid router request is needed to read this guidance or use an obvious tool.

Add the following **inside the existing plugin's `options`**, preserving `servers` and other settings:

```json
"toolRouting": { "enabled": true, "server": "machinal" }
```

Use the actual approved registration name for `server`; it is required when multiple endpoints are registered. Then use, for example:

```text
/machinal-route Validate the current recipe before rendering
```

Only this command's text is sent to the authenticated backend's existing `/v1/ai/tool-selection` endpoint, then to its configured router provider. Do not include secrets, signed URLs or private file contents. Attachments, conversation history, media bytes, tool results and the application key are not included in the provider's routing state. Existing backend `OPENROUTER_API_KEY` and optional `OPENROUTER_JEV_BASE_URL` / `OPENROUTER_JEV_MODEL` settings are reused; no provider key is stored in OpenCode configuration.

The integration checks live credits/pricing, uses the native `machinal_route` permission action and refreshes credits after submission. **Jev routing consumes API credits**, separately from production work; an exact existing tool name such as `/machinal-route wait_for_job` is handled deterministically without a provider call. Paid calls have a three-second client request window, make no automatic retries and return to the main model on outage, invalid output or ambiguity. A timeout can still incur provider usage.

Choice includes an explicit `defer` option. A recommendation is accepted only for a registered tool with both provider confidence and selected probability at least 0.8; this is a conservative policy, not a correctness guarantee. Decisions (including failed submissions) are cached in bounded memory for five minutes per session, credential, intent and catalog. Concurrent identical commands share one submission. A new command is required for a new selection: continuations do not call the router or repeatedly inject the same action.

The resulting tool ID is supplied once to the main model's context before it runs. The model still resolves the actual schema, arguments and prerequisites. **No tool is executed, hidden, redefined or granted permission by this decision**; it is not an autonomous executor or a replacement for media/spending consent. Pending routing usage remains explicitly pending. This can avoid an explicit `suggest_tools` exchange and reduce main-model selection work, but adds a provider request: it does not eliminate the main-model call or guarantee lower end-to-end latency.

Disabled by default. Installing/updating the package does not enable recurring provider calls or change an existing project's configuration. Deploy the updated Go API to support `strategy: "choice"`, then reload the local plugin with `/reload` if necessary. No OpenCode service restart, npm publication or live paid probe is performed by the source change.

Optional launchers remain available for Server mode and legacy environment-based setups. Independent local needs no keyed launcher:

```sh
machinal launch opencode
machinal launch claude
machinal launch codex
```

`launch` checks sources in order: `MACHINAL_API_KEY`, the platform's saved credential, then hidden entry. Interactive sessions ask whether to keep, replace, or create a key; unattended sessions retain automatic first-available selection. Keeping a saved key does not require typing it again. New keys can optionally be remembered on Windows/Linux. It launches the already installed client; it does not install that client or modify configuration. Optional client arguments follow `--`:

```sh
machinal launch codex -- --help
```

OpenCode launches with **`--standalone`** so its private server inherits the key, instead of using an already running shared service with an older environment. `--server` is not supported by this launcher. This does not change global OpenCode service settings.

The setup API probe alone never proves a running client connection. On Windows the installed integration lets the shared OpenCode service authenticate directly from the vault; inspect `machinal_connection(status)` or the MCP panel for the actual state. Without that integration, legacy environment-based setups still need a client/server started with the verified key.

<a id="save-replace-or-delete-a-key-on-windows"></a>

### Save, replace, or delete a key on Windows or Linux

```sh
machinal key set
machinal key set --url https://YOUR-API/mcp
machinal key delete
machinal key delete --yes
```

- **`key set`** always asks for a new key with hidden entry, even if `MACHINAL_API_KEY` or a saved key exists, and shows the direct website link for creating one. Confirm to save/replace the credential. Cancelling or entering an invalid key leaves the previous credential unchanged. Replacement writes the new credential directly; it does not delete the old one first.
- **`key set --url URL`** verifies MCP authentication, tool discovery and read-only live credits **before** offering to overwrite the saved key. A failed check or declined confirmation preserves the existing credential. Use this form to replace a broken/revoked key safely. Without `--url`, only the key's format is checked; `setup` also verifies live API access. No paid operation is submitted.
- The automatic OpenCode integration detects saved-key changes and reconnects in the existing service. No separate `launch` or OpenCode restart is needed. Other/legacy clients retain their current process environment until restarted through their launcher.
- **`key delete`** asks before deleting the saved credential. `--yes` explicitly confirms removal for scripts. Deleting an already absent key is a successful no-op. Failure to access the vault is reported as an error, not as successful deletion.
- There is one saved key per Windows user, shared by this launcher's clients and projects, under service `Machinal/mcp`, account `MACHINAL_API_KEY` (Windows target: `Machinal/mcp.MACHINAL_API_KEY`). It is not scoped to an API URL. Connect only to trusted local/hosted endpoints. Never store a key for someone else's account on a shared Windows login.
- Deletion removes **only the local saved copy**. It does not revoke the application key, change configuration, clear environment variables, or remove a key from already running clients. Revoke compromised keys on the website.
- An existing **`MACHINAL_API_KEY` takes precedence**, including after replacement/deletion. Unset it if you want subsequent launcher sessions to use the saved credential.
- **`--session-key`** on `setup` or `launch` bypasses the vault entirely and suppresses the save offer. It still accepts `MACHINAL_API_KEY` or hidden entry. Without saving, the key is kept only for the current installer/client processes.

On Windows, Credential Manager is accessed through the optional, pinned `@napi-rs/keyring` native binding; there is no plaintext fallback. Linux deliberately uses the private file described above, without D-Bus/keyring dependencies. macOS retains environment/hidden-entry behavior. A failed optional save is reported; no alternate storage is silently used.

Windows protects stored credentials at rest, but this is **not isolation from applications running under the same Windows account**, an administrator, or a compromised client. Automatic OpenCode authentication holds the key in its server memory. Legacy launcher sessions also pass it in the child's environment. Normal OpenCode startup reads the vault through the installed integration, not through shell initialization.

### Key handling

- **Server application keys** never enter client configuration, arguments or output. Opt-in persistence uses Windows Credential Manager or a private **plaintext** file on Linux. Independent local provider/device secrets use a separate private Docker profile, never client config or the npm tarball.
- Keys are kept in installer memory and passed in the launched child's environment. As with other environment-held secrets, the client and its subprocesses can access them. Use a dedicated, revocable key for each trusted client.
- `machinal` cannot change its parent shell's environment. If you decline immediate launch, the key you typed does **not** become available to clients started elsewhere. If saved, `launch` reads it from Credential Manager next time; otherwise supply it again or use your own environment/secret manager.
- Do not pass a key through CLI arguments, paste it in chat, or put it in your shell history. There is deliberately no `--api-key` option.
- Server login accepts Machinal keys, not PocketBase/service/OpenRouter tokens. Independent local uses its generated device token; OpenRouter is configured on that local backend. Neither implements OAuth.

### Scripted setup

With `MACHINAL_API_KEY` already supplied securely in the environment:

```sh
machinal setup --client opencode --scope project --mode server --style cinematic --yes --no-launch
machinal setup --client claude --scope global --mode server --no-skills --yes --no-launch
machinal setup --client codex --mode local --docker-dir /path/to/machinal --start-docker --style tutorial --yes --no-launch
```

For `setup`, `--yes` skips confirmations without launching a client or saving a Server key. It **does not authorize replacing an existing, different server**. Use a new `--name` or explicitly add `--replace`; changed skills need separate `--replace-skills`. Default stdio setup may succeed with Login required/Connection unavailable, explicitly reporting unverified service status. `doctor` exits nonzero until discovery succeeds. Invalid configuration/local provisioning fails nonzero. `key set` is interactive; `key delete --yes` explicitly confirms local credential removal.

Unattended setup installs the bundled skills with style `auto` unless `--style` or `--no-skills` is supplied. Changing a previously installed style also changes a bundled preferences file and requires approval or `--replace-skills`. Each file is saved atomically; the whole configuration-plus-skills installation is not one filesystem transaction. If a skill write fails after configuration was saved, setup explicitly reports a partial installation and can be rerun.

## Configuration locations

| Client | Project | Global |
| --- | --- | --- |
| OpenCode V2 | Existing `.opencode/opencode.json(c)` if present; otherwise existing root `opencode.json(c)`, or new `opencode.jsonc` | `$XDG_CONFIG_HOME/opencode/opencode.json(c)` or `~/.config/opencode/opencode.json(c)` |
| Claude Code | `.mcp.json` | `~/.claude.json` |
| Codex | `.codex/config.toml` | `$CODEX_HOME/config.toml` or `~/.codex/config.toml` |

Defaults: OpenCode `mcp.servers` with `type:local`; Claude `mcpServers` with `type:stdio`; Codex `[mcp_servers.machinal]` with `command`, `args`, `env_vars` and 30/180-second startup/tool timeouts. The command is the resolved Node executable, not `npx.cmd` or a shell; its private runtime survives npm cache cleanup. `--transport http` retains native HTTP/environment syntax. `machinal` is the default name.

When setting up `machinal`, a same-endpoint legacy `directional` registration is removed from that configuration and the authentication plugin options. The runtime also suppresses an inherited same-endpoint duplicate and duplicate legacy skills when their machinal replacements exist. Other servers and different endpoints are left untouched. OpenCode merges ancestor and global configuration, so verify the effective registration with `machinal_connection(status)` instead of checking only the project file.

| Skill destination | Project | Global |
| --- | --- | --- |
| OpenCode V2 | `.opencode/skills` | `$XDG_CONFIG_HOME/opencode/skills` or `~/.config/opencode/skills` |
| Claude Code | `.claude/skills` | `~/.claude/skills` |
| Codex | `.agents/skills` | `~/.agents/skills` (not `$CODEX_HOME/skills`) |

JSONC comments and unrelated TOML text are preserved. Modified files get a sibling `.machinal-backup-…` copy and are replaced via a temporary file; observed concurrent changes abort the write. New files and backups use mode `0600` on POSIX. Windows access follows filesystem ACLs. Backups may contain credentials that were already in a pre-existing config: protect them as you would that config. Idempotent setup creates no extra backup.

Safety limitations:

- Existing configurations must be regular files, not symlinks, and at most 2 MiB.
- Bundled skill files must also be regular files; symlinked skill directories are refused rather than modified through their target.
- Ambiguous `opencode.json` + `opencode.jsonc` pairs, duplicate JSON keys, and legacy V1 MCP sections must be resolved first. This installer configures V2; it does not migrate V1.
- Codex edits support standard `[mcp_servers.NAME]` tables and nested tables. Complex inline/dotted server definitions that cannot be changed safely are refused, not rewritten wholesale.
- Custom `CLAUDE_CONFIG_DIR` is refused for global setup; use project setup or the Claude CLI instead.
- Higher-precedence ancestor/project/global/managed settings can still override the edited configuration. Verify the effective connection in your client's MCP panel.
- Claude may require project MCP approval; Codex requires project trust for project configuration.

See the repository's [MCP guide](../../docs/MCP.md) for workflows. Independent local is a separate explicit backend profile, not an authorization or billing bypass on existing hosted deployments.

## Develop and test without publishing

From this directory:

```sh
npm ci --ignore-scripts
npm run sync:reference
npm test
npm run test:clients
npm run test:package
node bin/machinal-mcp.mjs --help
node bin/machinal-mcp.mjs setup
```

Run the last command from the directory whose project configuration you want to edit, using an absolute path to the script if necessary. All automated connection tests use local mock HTTP servers and fake keys, never paid providers or real customer credentials.

For project scope, prefer a dedicated project/test folder rather than `D:\` or another filesystem root. OpenCode discovers ancestor configuration, so root-level settings may affect every descendant project. Setup warns when this happens. Version 0.3.1 fixes the Windows `EPERM` caused by attempting `mkdir` on an existing drive root; configuration-write failures now report a specific, sanitized diagnostic after MCP verification.

With the package's dependencies installed, start the local wizard from the repository root with `node packages/mcp-installer/bin/machinal-mcp.mjs setup`, without publishing anything.

For saved-key management and launch directly from the repository root:

```sh
node packages/mcp-installer/bin/machinal-mcp.mjs key set
node packages/mcp-installer/bin/machinal-mcp.mjs key set --url http://127.0.0.1:8080/mcp
node packages/mcp-installer/bin/machinal-mcp.mjs key delete
node packages/mcp-installer/bin/machinal-mcp.mjs launch opencode
```

Automated tests mock credential storage and never read/write the production vault entry. To additionally test the real Windows API with a unique fake credential that is deleted afterward, run in PowerShell:

```powershell
$env:MACHINAL_TEST_CREDENTIAL_MANAGER = '1'
node --test test/credential-store.test.mjs
Remove-Item Env:MACHINAL_TEST_CREDENTIAL_MANAGER
```

`sync:reference` vendors the authoritative Go guides/profiles/examples and edit catalog into the self-contained npm package, and generates its reference-file manifest. `npm run check:reference`, tests and `prepack` detect stale/missing copies. Run synchronization after updating the Go knowledge source; do not edit vendored copies independently. Runtime installations need no Go source checkout.

`npm run test:package` additionally packs the actual tarball and runs its setup through offline `npx` against a local mock API, checking that styles, scene guidance, catalog and examples are all installed. Install dependencies first so npm's dependency cache is available; the smoke test uses fake keys and never invokes paid tools or publishes to npm.

Test the npm executable/tarball path without publishing:

```sh
npm pack --dry-run
npm pack
npm install -g ./machinal-mcp-0.6.1.tgz
machinal --help
```

The publish allowlist includes only selected `bin/*.mjs`, runtime/plugin source, portable skills, package metadata and this README. Package smoke tests reject project configs, nested agent installs, `.env`, media and old archives. No tests, local preferences or credentials are packaged.

## Publish

An npm account authorized to publish to **`@machinal`** is required. Confirm the package name/scope and intended licensing before the first release (`UNLICENSED` currently makes no open-source license grant). If that scope is unavailable, choose an authorized machinal scope before publishing. Do not substitute a different package with a similar name.

```sh
npm ci --ignore-scripts
npm test
npm run test:clients
npm run test:package
npm pack --dry-run
npm publish --access public
```

Publishing is a separate, explicit maintainer action. Do not publish credentials, and do not claim the package is available until the registry release succeeds.
# Hyperframes source library

The bundle also includes `machinal-hyperframes` and eight focused adapted skills, the complete upstream component/block/example source catalog and original skill references. Cinema remains the visual-direction layer; selected HTML/GSAP components are ported by the current client to native Svelte/SceneThree. Original entrypoints are renamed `SKILL.upstream.md` to prevent activation. No upstream CLI, telemetry or local renderer is installed. Apache-2.0 and third-party notices are preserved; binary demo assets remain excluded pending source/licence approval. See the repository's `docs/HYPERFRAMES.md` for scope and update instructions.
