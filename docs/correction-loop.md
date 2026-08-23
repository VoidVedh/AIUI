# Self-Correction Loop & Targeted Patching

The Self-Correction Loop guarantees that generated code measurably converges toward pixel-accurate fidelity with the target design.

---

## 1. Loop Architecture & Precedence

```
┌────────────────────────────────────────────────────────┐
│ 1. CODE VALIDATION (Pre-Execution Gate)                │
│    - Babel AST Syntax Check                            │
│    - Tag Balancing & Auto-Healing                      │
│    - Whitelisted Import Verification                   │
└──────────────────────────┬─────────────────────────────┘
                           │ (Must pass before rendering)
┌──────────────────────────▼─────────────────────────────┐
│ 2. SANDBOXED EXECUTION & PLAYWRIGHT RENDER             │
│    - Render in isolated Chromium instance              │
│    - Viewport capture (1280x800 desktop / 390x844 mob) │
│    - Extract rendered DOM bounding boxes               │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 3. DETERMINISTIC VISUAL EVALUATION                     │
│    - SSIM + Pixelmatch + Layout IOU calculation        │
│    - Generate Visual Diff Heatmap                      │
│    - Produce Structured Issues List                    │
└──────────────────────────┬─────────────────────────────┘
                           │
             [Similarity >= 0.92 OR Max Iterations (5)]
                 ├── YES ──► Save Final Best Code & Complete
                 └── NO  ──┐
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 4. REGRESSION GUARD & ROLLBACK                         │
│    - If Score(N) < BestScore: Revert to Best Code      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 5. TARGETED CORRECTION ENGINE                          │
│    - Focus on top severity issues (Position, Color)    │
│    - Apply surgical CSS / JSX patches                  │
│    - Re-enter validation gate                          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Targeted Patching vs Full Regeneration

AIUI **never** blindly throws away the entire project when a small alignment or color discrepancy is detected. Instead, the `CorrectionEngine`:
1. Identifies the specific node ID or CSS class name tied to the issue.
2. Updates only the relevant CSS property (e.g. `padding`, `background-color`, `font-size`, `gap`, `justify-content`).
3. Re-runs the AST validator and rendering engine.
4. Preserves prompt token budget and minimizes execution latency.
