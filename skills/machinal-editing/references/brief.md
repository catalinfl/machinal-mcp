# Build the video brief together

For a new video or a substantial creative change, start a conversation before locking the script, visual plan or recipe. Speak the user's language. First extract what they already supplied, including current choices and approved preferences. Ask about missing decisions, not information they already gave.

## Check existing approval first

Read the user's request and earlier replies before opening a form, including when resuming this workflow. Explicit approval in chat counts just like an answered form. One approval can cover licensed sound sourcing/import/use, provider generation, scene-frame rendering, final encoding and requested delivery together when those scopes are clear. If already covered, skip the permission questions and continue through the result. Do not reconfirm every operation just because it uses a different tool or `userApproved:true`.

For example, “Poți să alegi și să imporți efecte CC0 de pe Freesound pentru proiect, să folosești creditele pentru generarea și randarea discutate și să-mi trimiți rezultatul” covers the named steps. Search-only, render-only or a cancelled form does not grant any additional scope.

## One interactive round for what is missing

Ask 3–5 short, concrete questions when the request is open-ended; ask fewer when most choices are already known. Use the host's native question tool (OpenCode: `question`) and put all unanswered questions in one `questions` array so the client displays its interactive multi-question form. Use that tool, not a numbered chat questionnaire, a Markdown checklist or JSON printed in chat. Group related choices, offer useful examples and wait for the user's reply before deciding for them. Do not dump a long intake form or read every catalog before asking what video they want.

Give each question a short `header`, a clear `question` and concrete `options` with concise `label`/`description` values. Put a recommended option first and mark it as recommended. Use `multiple: true` only for genuinely compatible selections. Leave custom answers available; OpenCode already supplies free-form entry, so do not add a duplicate “Other” option. If the host has no interactive question tool, use a compact unnumbered chat fallback with clear choices; never pretend the native form was shown. The HTTP MCP server supplies guidance, not a client UI or an independent human-consent popup.

Cover these unanswered choices, with a short follow-up only when needed:

- **Video type, subject and goal:** documentary, social clip, tutorial, product presentation or another format; what should the audience understand or feel? Who is it for?
- **Duration:** approximate length; treat requested or AI-proposed runtimes as estimates unless the user explicitly sets a hard duration cap. Preserve the full successful narration by default rather than asking again about a flexible target.
- **Destination, framing and output resolution:** where it will be watched, landscape/portrait/classic, and the preferred resolution. Aspect ratio is not resolution. Offer a sensible supported choice, such as portrait 1080p for a mobile video, without silently imposing it. Check the live schema and scene limits before promising a format or resolution.
- **Visual direction and materials:** existing footage/photos, a newly generated image, an animated scene or a deliberate mix; desired mood, reference style and anything to avoid. Knowing the topic does not authorize choosing all visuals on the user's behalf.
- **Audio and text:** spoken language, narration or original sound, and subtitles. In the **same native form**, ask a separate sound-effects question when the choice is missing: e.g. “Vrei efecte sonore sincronizate cu acțiunea?” with “Efecte discrete” and “Fără efecte”. Keep it independent of narration/captions and any licensed music choice. Do not make every narration option silently opt out of effects. Reuse an explicit choice, complete brief or delegated decision; narration alone does not authorize sound effects or music. Do not promise unsupported music generation.

If sound is still undecided or sourcing permission is missing, offer a concrete delegation in the initial form: **„Efecte discrete — caută pe Openverse/Freesound, alege și importă un efect CC0 și folosește-l în acest proiect.”** Also allow silence or choosing the source personally. If the user accepts that scope, select the exact importable ID/version yourself and proceed to import, measurement and real YAML audio tracks; no second choice of filename. Do not offer the question again when already answered or delegated. A plain “effects” preference or search-only consent does not authorize importing. Ask only before going outside the approved licence, source, project or quantity. Load `animation-skills/machinal-sound` for requested effects.

Never silently deliver an effects-free substitute; report the precise blocker if the requested sound cannot be implemented.

For new captions, the narration option can explicitly include correcting unambiguous transcription slips to the approved script, preserving word highlights and timing. Reuse that permission; report corrections together. Ask only about uncertain wording or a change outside that scope.

For a **TikTok** destination or an explicit **TikTok-style captions** request, NEW captions use the supported TikTok-style font **`fontFamily: montserrat` and `fontWeight: 700`**, unless the user explicitly chooses another font. State this with the agreed brief; no extra font question is needed. Preserve existing caption fonts/configuration unless a font change is explicitly requested. This does not authorize adding unrequested captions. Read topic `text` for the explicit `captions.generate.style` fields; Montserrat is not official TikTok Sans.

### Choose the speech model in this same round

When narration is requested and no model was already chosen, read `list_speech_models(language: ro|en)` once and include a short model-choice question in the same native form. Do not silently select the legacy model or wait until after paid generation. Use `get_speech_model` for the chosen model's compatible voices only when needed. Reuse explicit choices or genuine delegation; selecting a model does not grant spending/reference permission.

- Romanian: recommend **Gemini 3.8 Flash TTS** (`google/gemini-3.8-flash-tts`); offer **Gemini 3.8 Flash-Lite TTS** as the economical alternative.
- English: **ask the user**. Offer **Kokoro 82M** (`hexgrad/kokoro-82m`) as an economical English option, **Gemini 3.8 Flash-Lite** as a multilingual alternative and **Gemini 3.8 Flash** for expressive delivery. Do not switch the narration language to English for cost reasons.
- Respect an explicit Gemini 3.8 Flash request even if a cheaper option exists. Gemini 3.1 is for existing recipes, not the recommendation for new narration. Never change a model on failure without user approval.

Example English question: “For English narration, which model do you prefer: economical Kokoro, multilingual Gemini 3.8 Flash-Lite, or expressive Gemini 3.8 Flash?” Explain these as catalog-based recommendations, not measured quality/latency or an exact credit quote. Offer alternatives in the user's language. Never generate paid voice samples merely to show the choices.

For example, if the subject, video type and audio are already known, adapt these Romanian tool arguments to the actual request. Invoke `question` with them; do not print this payload as the user-facing questionnaire:

```json
{
  "questions": [
    {
      "header": "Durată",
      "question": "Ce durată preferi pentru video?",
      "options": [
        {"label": "Circa 60s (Recomandat)", "description": "O prezentare scurtă, cu loc pentru ideea principală."},
        {"label": "Circa 30s", "description": "Un rezumat foarte concis."},
        {"label": "2–3 minute", "description": "Mai mult context și explicații."}
      ]
    },
    {
      "header": "Format",
      "question": "Unde îl publici și ce format preferi?",
      "options": [
        {"label": "Vertical 1080p (Recomandat)", "description": "9:16, 1080×1920, pentru vizionare pe telefon."},
        {"label": "Orizontal 1080p", "description": "16:9, 1920×1080, pentru ecrane late."}
      ]
    },
    {
      "header": "Vizual",
      "question": "Ce fel de materiale vizuale preferi?",
      "options": [
        {"label": "Mix animat (Recomandat)", "description": "Imagini în scene cu obiecte animate independent."},
        {"label": "Poze și filmări existente", "description": "Fără generare de imagini noi; alegem separat sursele autorizate."},
        {"label": "Scene procedurale", "description": "Animații din forme și text, fără generare de imagini."}
      ]
    }
  ]
}
```

Accept partial answers. Use sensible stated defaults for minor reversible gaps; follow up only for a genuine blocker or missing permission, not every aesthetic detail. If the user says “you decide”, choose coherent defaults, state them briefly and proceed within that delegation; do not force them through a questionnaire. A fully specified brief or a small edit to an existing video does not need this whole round. Do not re-ask answered questions or reconfirm every approved stage. A skipped, dismissed or cancelled form is not consent; do not infer unanswered decisions or permissions from it.

After the user answers, summarize the agreed brief briefly and proceed immediately with the authorized work in the same turn. Do not ask for a separate plan confirmation, “Confirmi că încep?” or “Shall I start?”. Do not end with a plan and wait for another message to begin. Continue through authoring, validation, approved generation/rendering, bounded job waits and requested delivery without pausing for approval of each covered stage. Ask again only for a genuine blocker, a material scope change or an operation that has not been authorized.

Carry the explicit approval forward, including its generation/source/rendering scope and any hard budget. `userApproved: true` asserts that actual permission; it is not a request to open another question. A completed timing/image/scene stage, passing preflight, a live credit check or selecting a sound within delegated scope is not a new approval gate. Keep working through the next authorized stage in the same turn. Host tool-permission dialogs are a separate security layer: respect saved approvals, never auto-approve or disable them, and do not promise to suppress them through MCP guidance. Stop only for a precise persistent blocker, exhausted approved budget, changed scope or missing permission; report what failed and what must change rather than an unspecified “tooling limitation”.

## Recommend a visual option for a reason

Offer 1–2 relevant alternatives in the initial form where a choice would improve the video, with one recommendation and a plain-language reason. For example: an existing photo preserves the actual subject; a new image can establish an atmosphere; an animated scene can explain a process with independently moving objects. A scene can also use an approved photo or generated image. Do not make a generated image, animation or particular visual style the default for every subject.

Separate **image sourcing** from **visual presentation**. “Use images”, “find photos” or “generate images for this video” specifies source material, not necessarily a still-image-only slideshow. When presentation is undecided, ask once in the same native form whether those images may be integrated into animated Svelte scenes. Offer a relevant image-plus-scene treatment (recommended when it helps) versus a photo montage without scenes, explaining independent motion, visual continuity and any additional rendering cost. For spatial subjects, mention a genuine Three.js treatment as an option; the user need not know or request the library name. A standalone request to find/deliver images is not a request to make a video: do not expand that task into scene production.

For example, adapt a visual question to: “Pot integra imaginile și în scene animate, cu Three.js unde aduce valoare, sau preferi un montaj doar din poze?” Offer “Imagini + scene (Recomandat)” and “Doar montaj foto”; explain one subject-specific benefit rather than promising spectacle without a design. This resolves presentation, not access or spending permission. Reuse an existing answer or “you decide” delegation; do not ask again for every image. Explicit “only photos”, “no scenes”, no-generation and footage-only constraints remain binding.

Ask the user which direction they prefer before locking an undecided visual approach. If they already requested animation or explicitly ruled it out, respect that choice instead of offering the same menu again. Do not force a still-image slideshow in place of requested animation, or add paid scenes just to demonstrate the feature. Distinguish catalog support from configured providers, and explain limitations before offering a substitution.

Include the desired visual intensity in the style question when it is unknown: quiet/minimal, expressive editorial, or bold/cinematic. For an open creative brief, recommend an expressive, polished treatment with motivated accents rather than silently choosing the least animated option. For “more spectacular”, propose a subject-specific reveal, transformation or spatial action, not merely extra particles, glow or rapid cuts. Respect an explicitly quiet/minimal style and accessibility needs; no effect or scene quota.

For an agreed animated treatment, search `get_library_reference(topic: component-discovery, query: ...)` (OpenCode: `machinal_library`) once per distinct animated beat before writing its scene. Search for the visible action (Romanian or English), not the whole video's subject. For example, use `query: "cronologie", role: "timeline", profiles: ["educational", "social"], aspect: "portrait"`; search separately for the opening title. Profiles and format rank matches, not exclude them. Compare the returned match reasons, recorded format evidence, media requirements and editable parameters. Open the chosen exact `scene-templates` ID. If a query misses, browse its broader `role` without the query once. If nothing can depict the beat, record why and author it from scratch. There is no required component count or extra user approval for implementation IDs. Do not repeat discovery for unchanged scenes. On older installs, use a targeted `scene-templates` or `hyperframes-components` lookup.

Read only the relevant editing/scene references once the direction is known. Summarize the agreed brief as a progress update, not an approval gate: type/goal, duration, aspect and resolution, visual sources/treatment, narration/captions/music/sound effects. Then start the next authorized action immediately. For narration-led work, proposed beat times remain provisional until the speech duration and cues are measured.

For a fitting beat pass the discovered `templateId` and context-specific `templateEdits` into `compile_scene`. Preserve the template's signature motion; adapt actual copy, colors, framing and demo content. Record beat → template ID → returned asset version → timeline clip in the production notes, and verify that clip in the final recipe. For a custom beat, record why the candidates did not fit (`customSceneReason` in OpenCode); do not count a lookup or even a compiled but unused asset as reuse.

## Let finished narration set an approximate runtime

For a roughly 30-second video whose successful narration measures 38–40 seconds, keep the voice and captions and extend the video to the measured narration end. Lengthen/recompile existing scenes and their holds or add relevant client-authored scenes within the approved visual scope, adjusting placements and transition overlaps so the picture covers the full speech. Do not regenerate, truncate or speed up narration solely to meet an estimate, or rerun successful caption/image work. State the adjusted runtime briefly and continue without reconfirmation within existing permissions. Only an explicit hard duration cap or spending limit needs a follow-up before changing paid narration or exceeding approval; an approximate overrun is not a failed timing pass.

## Keep the finished video about its subject

Do not automatically add production labels such as “AI illustration”, “Ilustrație AI” or “synthetic narration” to titles, subtitles, watermarks or every scene. Do not repeat these labels in chat either. Example copy is not a requirement for the user's video. Use subject-relevant copy and the user's requested tone.

Be honest about how media was made when asked; never pass generated material off as archival footage, verified evidence or a real recording. If a disclosure is requested or a specific applicable requirement makes one necessary, explain it once and agree on appropriate wording and placement rather than adding a repetitive banner by default.

## Creative choices are not consent to access or spend

When spending permission is missing and animated scenes are proposed, explain **scene-frame rendering and final-video encoding as separate billed components** at the live configured tariffs in the initial spending question. Include image/speech/caption provider usage separately, with uncertain amounts marked approximate/pending. If the user already explicitly authorized those costs, check the tariff and balance without asking them to approve again. A model choice or scene-style choice does not itself approve either rendering charge.

Choosing a type, duration, resolution, style, image or scene is not media-access or spending authorization. Include only missing permissions in the initial form, with a clear refusal option, rather than a second generic “approve the plan?” round. Keep listing, named-file use/download and spending scopes distinct: a single explicit yes can cover several named scopes, but agreeing to one does not imply agreement to the others. Ask only about files and actions whose scope can already be explained, and check live credits before requesting paid-work authorization. Explain the proposed generation/render actions and approximate costs only when supported; do not promise an exact advance AI quote. If a later action falls outside scope, continue the already-authorized/free work and ask only for that missing permission. Do not repeat authorization for stages already approved within the same workflow, and never treat a cancelled form as consent. Do not run providers while collecting the brief. Keep host tool-approval controls enabled.
