# Contributing to AIUI

Thank you for contributing to AIUI! This document outlines the core architectural invariants, testing protocols, and contribution guidelines.

---

## 🏛️ Core Architectural Invariants

### 1. Zero Tolerance for Hardcoded Templates & Fixture Overfitting
- **Rule**: Never commit fixture-specific hardcoded layout strings, fixed HTML templates, hardcoded selectors (e.g. `matrix_wrap`, `_cell_`), or hardcoded placeholder strings into `@aiui/core` or `@aiui/orchestrator`.
- **Enforcement**: Continuous automated anti-hardcoding tests run on every build via `tests/negative/no_fixture_hardcoding.test.ts`. Any commit introducing template hardcoding or fixture branching will fail CI immediately.
- **Perception Architecture**: All screenshot perception must flow through the open recursive schema (`PerceptionNode`), dynamically discovering node hierarchies, layout constraints, and design tokens directly from input pixels.

### 2. Quantitative Corrections Only
- **Rule**: Corrections in `@aiui/orchestrator/src/correctionEngine.ts` must be driven by measured target colors, measured bounding box deltas, and regional pixel offsets from `@aiui/evaluator`.
- **Enforcement**: Unit tests in `packages/orchestrator/src/correctionEngine.test.ts` verify that distinct measured inputs produce distinct, data-driven CSS output.

---

## 🧪 Benchmark Evaluation & PR Acceptance Gate

Every pull request modifying perception, planning, code generation, or self-correction must be evaluated against **both** benchmark suites:

### 1. External Held-Out Generalization Suite (16 Real-World Targets)
- **Command**:
  ```bash
  npm run benchmark:external
  ```
- **Description**: Evaluates the pipeline on 16 unseen real-world UI targets (`fixtures-external/*`) with zero engineered ground truth.
- **Acceptance Criterion**: Pull requests will be judged based on their performance on this held-out benchmark suite. PRs that improve internal scores while regressing held-out external fidelity will be rejected.

### 2. Internal Self-Contained Benchmark Suite (8 Fixtures)
- **Command**:
  ```bash
  npm run benchmark:internal
  ```
- **Description**: Evaluates the 8 canonical fixtures (`fixtures/*`) using pure open perception.

---

## 💻 Local Development Workflow

1. **Install Dependencies & Build**:
   ```bash
   npm install
   npm run build
   ```

2. **Run Test Suite**:
   ```bash
   npm test
   ```
   Ensures all 48 tests across 9 suites (including anti-hardcoding, resilience, core generators, evaluator, server, and orchestrator) pass.

3. **Verify Anti-Hardcoding Guardrails**:
   ```bash
   npm run test:anti-hardcoding
   ```

4. **Run Live E2E Tests (Requires VLM API Keys in `.env`)**:
   ```bash
   npm run test:e2e:live
   ```
