# AIUI Architecture & Design Specification (Refined)

AIUI is an autonomous UI-to-Code Engineering Agent designed to transform UI screenshots (and Figma files) into clean, production-grade, framework-agnostic code with a verified, deterministic self-correction loop.

---

## 1. System Overview & Input Convergence

```
    ┌───────────────────────────┐         ┌───────────────────────────┐
    │   Screenshot / Image      │         │   Figma File / JSON API   │
    └─────────────┬─────────────┘         └─────────────┬─────────────┘
                  │                                     │
    ┌─────────────▼─────────────┐         ┌─────────────▼─────────────┐
    │  ScreenshotInputAdapter   │         │     FigmaInputAdapter     │
    └─────────────┬─────────────┘         └─────────────┬─────────────┘
                  │                                     │
                  └──────────────────┬──────────────────┘
                                     │
                      ┌──────────────▼────────────────┐
                      │  Intermediate Repr. (UI IR)   │ ◄─── Single Source of Truth
                      └──────────────┬────────────────┘
                                     │
               ┌─────────────────────┴─────────────────────┐
               │                                           │
┌──────────────▼────────────────┐           ┌──────────────▼────────────────┐
│     Design Token Engine       │           │       Component Planner       │
└──────────────┬────────────────┘           └──────────────┬────────────────┘
               │                                           │
               └─────────────────────┬─────────────────────┘
                                     │
                      ┌──────────────▼────────────────┐
                      │   Target Code Generator       │
                      │ (React | Vanilla JS | Flutter)│
                      └──────────────┬────────────────┘
                                     │
                      ┌──────────────▼────────────────┐
                      │  Secure Sandboxed Runner      │
                      │ (Pre-installed templates,     │
                      │  env cleansing, memory caps)  │
                      └──────────────┬────────────────┘
                                     │
                      ┌──────────────▼────────────────┐
                      │ Playwright Screenshot Capture │
                      └──────────────┬────────────────┘
                                     │
                      ┌──────────────▼────────────────┐
                      │  Deterministic Visual Diff    │
                      │    (SSIM + Pixelmatch + IOU)  │
                      └──────────────┬────────────────┘
                                     │
                       [Similarity >= 0.92?]
                              ├── YES ──► Final Output & Code Export
                              └── NO  ──┐
                                        │
                      ┌─────────────────▼─────────────┐
                      │    Targeted Correction Engine │
                      └─────────────────┬─────────────┘
                                        │
                                        └──► Re-generate / Re-render Loop
```

---

## 2. Architectural Boundary: UI IR & Input Adapters

The UI IR (Intermediate Representation) is the strict boundary between UI comprehension and code generation. Vision and multimodal reasoning extract layout, geometry, semantics, hierarchy, typography, colors, and constraints into a standardized JSON tree.

### Input Adapter Seam
- `packages/core/src/adapters/types.ts`: `InputAdapter` interface.
- `ScreenshotInputAdapter`: Consumes image (PNG, JPG, WebP) -> Vision / CV -> `UIIRDocument`.
- `FigmaInputAdapter`: Consumes Figma JSON/REST node tree -> `UIIRDocument`.

### UI IR Node Structure Summary
- **Node Types**: `page`, `section`, `container`, `navbar`, `sidebar`, `header`, `footer`, `hero`, `card`, `grid`, `flex`, `button`, `text`, `heading`, `input`, `image`, `icon`, `badge`, `avatar`, `list`, `modal`.
- **Node Properties**:
  - `id`: Unique identifier (e.g. `hero_cta_btn`)
  - `type`: Semantic category
  - `parent`: Parent node ID
  - `children`: Array of child node IDs or embedded node objects
  - `position`: Relative `{x, y}` or flow
  - `dimensions`: `{width, height, minWidth, maxWidth}`
  - `content`: Text or icon key or asset reference
  - `semanticRole`: ARIA role / accessibility tag
  - `layout`: Flexbox / Grid properties (`direction`, `justify`, `align`, `gap`, `wrap`)
  - `styles`: Typography (`fontSize`, `fontWeight`, `lineHeight`, `color`), Background (`color`, `gradient`), Border (`width`, `color`, `radius`), Shadow (`offsetX`, `offsetY`, `blur`, `color`), Spacing (`padding`, `margin`)
  - `responsiveHints`: Breakpoint adjustments
  - `confidence`: Floating point score (`0.0` to `1.0`)
  - `relationships`: Spatial and logical alignments (`alignsWith`, `adjacentTo`)

---

## 3. Technology Stack & Execution Profiles

| Subsystem | Technology Choice | Rationale |
|---|---|---|
| **Runtime & Language** | Node.js (v20+) & TypeScript | Unified type safety across UI IR, tokens, AST generation, and fullstack dashboard. First-class Playwright and Sharp support. |
| **Frontend Framework** | React 19 + Vite | Fast HMR, reactive state management, modern component architecture. |
| **Styling** | Vanilla CSS + CSS Variables | Maximum flexibility, zero CSS framework lock-in, pristine aesthetic control, exact design token alignment. |
| **Model / Vision Provider** | Provider Abstraction (`VisionProvider`, `LLMProvider`) | Direct support for Gemini (`@google/genai`), OpenAI (`openai`), Anthropic, plus a deterministic computer-vision fallback. |
| **Execution Sandboxing** | 3-Layer Isolation Model | (1) Pre-installed whitelisted template dependencies (no arbitrary `npm install`). (2) Environment cleansing (all host keys/secrets stripped). (3) Memory & process timeout enforcement. |
| **Rendering & Screenshot** | Playwright (Headless Chromium) | Exact viewport sizing, pixel-accurate rendering, device emulation, DOM coordinate extraction. |
| **Visual Diff Engine** | `sharp` + `pixelmatch` + SSIM (Structural Similarity) + Bounding Box IOU | Real, mathematically computed similarity metrics ($0.45 \cdot \text{SSIM} + 0.35 \cdot \text{PixelMatch} + 0.20 \cdot \text{LayoutIOU}$). No simulated scores. |
| **Pipeline State** | File-based checkpoints (`runs/<run_id>/state.json`) | Inspectable, resumable, zero external database dependency for local workflows. |

### Per-Target Runner Execution Profiles

| Target | Build / Run Time | Max Iterations | Per-Iteration Timeout | Total Run Timeout |
|---|---|---|---|---|
| **React** | ~0.5s (Vite dev / static) | 5 | 60s | 10 min |
| **Vanilla JS** | ~0.1s (Static HTML/CSS/JS) | 5 | 60s | 10 min |
| **Flutter** | ~30–60s (`flutter build web`) | 3 | 240s | 20 min |

---

## 4. Multi-Target Code Generators

1. **React Generator**:
   - Clean, modular functional components with React 19 hooks.
   - Design tokens translated to `:root` CSS custom properties.
   - Complete project structure with `package.json`, `vite.config.js`, `index.html`, and component files.
2. **Vanilla JavaScript Generator**:
   - Semantic HTML5 structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
   - Clean BEM / scoped CSS styling.
   - Interactive DOM event handlers in `app.js`.
3. **Flutter Generator**:
   - Idiomatic Dart widgets (`Scaffold`, `AppBar`, `Column`, `Row`, `Container`, `ElevatedButton`, `Text`).
   - `ThemeData` and `AppColors` derived directly from design tokens.
   - Valid `pubspec.yaml` with required asset declarations.

---

## 5. Security, Sandbox Isolation & Limitations

> [!NOTE]
> **MVP Sandbox Scope**: For MVP, execution isolation is **process-level isolation** (cleansed environment variables, restricted local loopback, timeout and process group killing, whitelisted pre-installed dependencies), not full OS-level containerization (Docker) or kernel microVMs. Full Docker/gVisor sandboxing is targeted for enterprise deployment.

1. **Static Analysis & Whitelisting**: Before execution, generated code is parsed to ensure all imports belong to an allowed whitelist (React, standard UI components, CSS). Any attempt to invoke child processes, read filesystem paths outside workspace, or make network calls is rejected by the code validator.
2. **Environment Variable Cleansing**: When the runner launches Vite / static server / Flutter, the child process receives a completely sanitized `env` with all API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.), user directories, and system paths removed.
3. **Template Sandboxing**: Generated code is mounted into a pre-compiled workspace with immutable `node_modules` — untrusted `postinstall` scripts cannot execute.
4. **Process Lifecycle Management**: Every process is tracked with a PID killer that ensures zero orphan processes on timeout or completion.

---

## 6. Self-Correction Loop, Precedence & Observability

- **Validator-Before-Correction Precedence**: Before any code enters the visual rendering and evaluation loop, the AST validator/auto-healer validates syntax, imports, and structure. Code that fails compilation is diagnosed and repaired immediately at the validation stage; visual correction iterations are reserved strictly for visual fidelity and styling adjustments.
- **Stopping Condition**: Aggregate similarity $\ge 0.92$ or max iterations reached.
- **Rollback on Regression**: If iteration $N$ scores lower than iteration $N-1$, the orchestrator automatically reverts the codebase to the higher-scoring checkpoint.
- **Targeted Diff Engine**: Modifies exact CSS rules / JSX props identified in the visual critique rather than regenerating the entire app from scratch.
- **State Checkpointing & Cost Persistence**: Every stage, prompt tokens in/out, estimated cost, latency, screenshot path, and structured issue list is permanently logged to `runs/<run_id>/state.json`.
