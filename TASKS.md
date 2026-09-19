# Open Tasks

No open tasks for the watch app itself.

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
