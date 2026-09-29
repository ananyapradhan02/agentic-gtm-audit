# agentic gtm audit

A twelve-question self-audit for B2B teams selling AI agents to enterprises. It covers five areas (pricing model, motion, icp clarity, messaging, agent-readiness) and returns a scorecard: a stamp per area (strong, developing, at risk), a one-line diagnosis, and three prescribed next moves. The answers live in the URL, so the scorecard can be shared with a team as a link.

## who it is for

Founders, CMOs and GTM leads at B2B companies selling agentic AI to enterprise buyers.

## hypothesis

A GTM lead who takes the audit shares the scorecard with their team.

## how to open it

- Live: https://ananyapradhan02.github.io/agentic-gtm-audit/
- Local: open `index.html` in a browser (`file:///.../agentic-gtm-audit/index.html`). No build step, no server.

## how it works (all scripted)

There is no AI in this prototype. Every answer option carries a fixed score from 0 to 3. An area is "strong" at two thirds of its points or more, "developing" from 40%, and "at risk" below that. Diagnoses come from a fixed bank (one line per area per level). The three next moves are picked by rule: areas are ranked weakest first, and each answer scoring 0 or 1 triggers one written move; the audit takes one move per area in weakness order, then fills from the rest, then falls back to a stretch move for strong areas.

Only the weakest at-risk area gets the rust stamp; other at-risk areas show a neutral stamp that still says "at risk".

Answers are encoded as twelve characters in the hash (`#a=012312...`, `x` for unanswered). Opening that link reproduces the scorecard. Progress is saved in `localStorage` in this browser. Nothing is sent anywhere; no analytics.

## test script (three questions for a real person)

Give a GTM lead the live link and no other context. After they finish:

1. "Which stamp surprised you, and was it fair?" (tests whether the diagnosis lands or feels generic)
2. "Of the three next moves, which would you actually do this month, and which would you skip?" (tests whether the move bank is specific enough)
3. "Who on your team would you send this to, and would you send the link or the text?" (tests the hypothesis directly; watch whether they press copy)

## what Ananya should decide after testing

- If people copy the link or text unprompted: build team mode (compare several teammates' links) next.
- If they skip the moves as obvious: rewrite the move bank before adding features.
- If they argue with the scoring: show the scoring rules on the page, and consider letting teams weight areas.

## status

v0.1 · 29.09.26
