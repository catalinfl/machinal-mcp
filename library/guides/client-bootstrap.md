Deployment separation: check `connection_status.deployment.kind` (`local` vs `cloud` vs `custom-server`). Never apply Machinal Cloud credit or S3 rules to an independent local Docker deployment (`machinal-local`), and never assume local Docker/BYOK billing on Machinal Cloud.

- **Machinal Cloud / Hosted Server (`cloud` | `custom-server`):** Uses a Machinal API key, Machinal credits (`get_credits`), server scene/video render billing, and `storage: s3 | volume | all` with signed S3 delivery links. See `client-bootstrap-cloud.md`.
- **Independent Local Docker (`local` / `machinal-local`):** Uses an automatically generated loopback device token, the owner's BYOK OpenRouter/provider key (no Machinal account/credits/wallet and no `get_credits` tool), local hardware rendering, and `storage: volume` only (no S3). See `client-bootstrap-local.md`.

Shared authoring, brief, timing-first, hybrid-edit, caption preservation, scene discovery, preflight and recovery rules are in `client-bootstrap-core.md`.
