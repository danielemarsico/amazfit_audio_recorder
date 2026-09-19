# Open Tasks

## Decide how to handle secrets before a *public* store listing

**Blocking for a public listing; not blocking for a sideloaded personal build.**

`app-side/setting.js` inside the packaged `.zab` is plain JavaScript, not bytecode, and contains
in cleartext:

- the Cloudflare Worker URL,
- the 64-character worker API key,
- the Todoist OAuth **client ID and client secret**.

They get there because `setting/index.js` imports them from `secrets.js` at build time, to
pre-fill the settings form and to configure the `Auth` component. `zeus prune --ip` removes the
separate plaintext-source leak in the `.ip-package` (done in 1.0.5) but cannot touch these — the
settings page genuinely needs them at runtime.

Consequence of publishing as-is: anyone who installs DuDu can extract the key and use the worker
(and its Workers AI quota) for free, and can impersonate the Todoist OAuth app.

Options, roughly in increasing order of effort:

1. **Ship no defaults.** Drop `UPLOADURL`/`APIKEY` from `setting/index.js` and require each user
   to paste their own worker URL and key. Honest for an open-source app where users self-host the
   worker — the [dudu-worker](https://github.com/danielemarsico/dudu-worker) repo already
   documents deployment. Removes the key leak entirely. Leaves the Todoist `clientSecret`.
2. **Drop the OAuth path, keep the manual API-key fallback.** The fallback already exists and is
   documented as the more reliable of the two (OAuth returns `invalid_client` in packaged builds
   anyway). Removing the `Auth` component removes the client secret from the bundle and deletes
   the unresolved OAuth bug at the same time.
3. **Keep a hosted worker but stop treating the key as a secret** — rotate to a per-install token
   the worker issues, and rate-limit per token. Most work; only worth it if DuDu is meant to be
   turnkey for non-technical users.

1 + 2 together clear the bundle of every secret and are mostly deletions. Rotate the current
worker API key and the Todoist OAuth credentials regardless, since they have already been built
into distributed artifacts.

## Moved: AI post-processing for the audio-to-note pipeline

The "improve audio-to-note conversion with AI post-processing" task moved to
**[danielemarsico/dudu-worker](https://github.com/danielemarsico/dudu-worker)**
(see its `TASKS.md`) along with the worker itself.

It was always worker-side work — it names `worker.js`'s
`transcribeWithCfAi()` and `createTodoistTask()`, and nothing in `zepp_app/`
changes. Now that the T-Embed assistant shares that worker, the same
"transcript in, useful text out" step is needed on both routes, so the task
lives where both consumers can see it.

Nothing about this app changes as a result — the watch keeps sending
`language` in the upload body, and the worker keeps returning the
transcription.

**Already improved server-side (2026-09-05):** `/upload` moved from
`@cf/openai/whisper` to `@cf/openai/whisper-large-v3-turbo`, which
transcribes non-English audio noticeably better and honours the `language`
field the watch already sends. Since the transcript becomes the Todoist task
title verbatim, that lands directly in your task list — no app change or
re-flash needed. It also means part of the planned "cleanup" step may already
be unnecessary; re-assess before building it.
