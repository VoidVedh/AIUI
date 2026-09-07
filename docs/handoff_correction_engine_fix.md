# HANDOFF — Correction Engine Quantitative Fix

Written by an outside review pass (Claude, via chat), not the primary
agent. This documents exactly what was changed, what was verified, and
what's still open, so work can continue without re-discovering context.

## What was found

`CorrectionEngine.applyTargetedCorrections` (packages/orchestrator/src/correctionEngine.ts)
had already been fixed to remove the old hardcoded `dense-matrix-table`
fixture selectors — good. But it still branched only on `issue.type` and
emitted one fixed CSS block per type, completely ignoring the real
`target`/`actual` pixel data and `severity` that `VisualIssue` objects
actually carry (see packages/evaluator/src/evaluator.ts,
`generateIssues`). There was also a dead variable (`padOffset`, computed
from iteration number, never used).

Consequence: since the orchestrator carries the patched project forward
between iterations, an unchanged issue type across iterations would
append the exact same CSS block again — a no-op patch, plateauing the
score. Structurally the same failure mode as the earlier fixture-selector
bug, just triggered by generic (not hardcoded) corrections that don't
scale with the real problem.

## What was changed

`packages/orchestrator/src/correctionEngine.ts` was rewritten:

- **`position` issues**: now compute the real pixel delta from
  `issue.target.x/y` vs `issue.actual.x/y` and emit a `transform:
  translate(dx, dy)` sized to that exact measured offset (clamped to
  ±200px to avoid a bad measurement causing a huge jump).
- **`missing_element` issues**: restores visibility and, when
  `issue.target.width/height` are known, forces the element's real
  expected size via `min-width`/`min-height` instead of a bare visibility
  toggle.
- **`dimension`/`overflow` issues**: same quantitative treatment, ready
  for when the evaluator starts actually emitting these types (it
  currently doesn't — see Known Limitation below).
- **`color`/`spacing` issues**: **KNOWN LIMITATION, documented in code
  comments, not silently glossed over** — the evaluator does not
  currently compute a per-element target color or a per-region pixel
  offset for these two issue types (`generateIssues` only gives them a
  severity and description string). These corrections are now scaled by
  `severity` (low/medium/high/critical → 4/8/14/22px equivalent
  magnitude) instead of being one fixed value regardless of severity, but
  this is still an approximation, not a target-exact fix. **Real
  next step**: extend `VisualEvaluator.generateIssues` to compute actual
  target vs. actual color values (sample pixels at the diff regions) and
  actual per-region pixel offsets, so these two issue types can become
  quantitative the same way position/missing_element now are.
- Removed the dead `padOffset` variable.
- Corrections are now processed in severity order (critical → low), so if
  a cap on corrections-per-iteration is ever added, the biggest problems
  get addressed first.

## What was verified (actually run, not assumed)

- Added `packages/orchestrator/src/correctionEngine.test.ts` — 5 new unit
  tests, all passing:
  - Two position issues with different real deltas produce genuinely
    different CSS (proves it's data-driven, not type-only).
  - Missing-element correction uses the real target size when available.
  - Color/spacing corrections scale by severity (low vs. critical produce
    different, verifiable contrast values).
  - No fixture-specific selectors (`matrix_wrap`, `matrix_grid`,
    `cell_`) appear in output regardless of input.
  - Empty issue list returns an explicit no-op, unchanged project.
- `npx tsc -p packages/orchestrator/tsconfig.json --noEmit` — clean, no
  type errors.
- `npm run build --workspaces` — full monorepo builds clean, including
  `@aiui/web`'s Vite production build.
- `npx vitest run` (full suite) — **41 of 50 tests pass**, including all
  new correction engine tests and every pre-existing unit/integration
  test across `core`, `evaluator`, `orchestrator`, `figmaAdapter`, and the
  negative-path resilience suite. No regressions introduced by this
  change in any test that could actually run in this environment.

## What was NOT verified (environment limitation, not a code issue)

- **9 test failures, all Playwright-related**, all with the identical
  error: `browserType.launch: Executable doesn't exist at
  /opt/pw-browsers/.../chrome-headless-shell`. This sandbox has no
  network access to Playwright's browser CDN (only package registries are
  reachable), so Chromium could not be installed here. This affects:
  - `tests/e2e/phase1_benchmarks.test.ts` (all 5 fixtures)
  - `tests/e2e/dense_matrix_benchmark.test.ts`
  - `tests/e2e/ugeek_signin_benchmark.test.ts` (both cases, including the
    "second untouched screenshot" generalization test)
  - `packages/server/src/server.test.ts`'s full-pipeline-run test
  - **This means the actual end-to-end effect of this fix — whether real
    iteration scores now move instead of plateauing on the Ugeek image —
    has NOT been confirmed by this pass.** The logic is unit-tested and
    proven data-driven in isolation, but a real render-and-score loop
    needs an environment with Chromium available (your normal dev/CI
    environment should have this already since it worked before).

## Next steps for whoever picks this up

1. Run `npx vitest run tests/e2e/ugeek_signin_benchmark.test.ts` in an
   environment where Playwright's browser is installed, and confirm
   iteration scores now show real movement instead of a flat repeated
   number.
2. Consider the real fix for the color/spacing "Known Limitation" above —
   extending the evaluator to produce real per-element/per-region target
   data — as the next highest-value improvement, since it's the same
   class of gap that was just closed for position/missing_element.
3. The "second untouched screenshot" test
   (`ugeek_signin_benchmark.test.ts`) still uses a fixture the agent
   created itself (`checkout-summary`) rather than a genuinely
   user-provided held-out image — this was flagged earlier as a real
   generalization-proof gap and is still open.
