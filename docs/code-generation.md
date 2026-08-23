# Target Code Generation Specification

The Code Generation layer consumes the UI IR document, design tokens, and component plan to produce idiomatic, production-ready code.

---

## 1. React Code Generator

Produces a complete, working Vite + React 19 application:
- `src/App.jsx`: Main composition view.
- `src/components/*`: Reusable components derived from the component plan (e.g. `Header.jsx`, `Hero.jsx`, `MetricCard.jsx`, `Navbar.jsx`).
- `src/index.css`: Global styles, reset, and CSS custom variables mapped from design tokens.
- `src/main.jsx`: React 19 root mounting (`createRoot`).
- `index.html`: Modern semantic HTML entry point.
- `package.json` & `vite.config.js`: Verified runnable configuration.

### Idiomatic React Principles:
1. Pure functional components with explicit props.
2. Modern CSS variables used for all tokenized colors, radius, and shadows.
3. Lucide icons automatically mapped and rendered from `lucide-react`.
4. Zero missing import statements or broken JSX tag mismatches.

---

## 2. Vanilla JavaScript Generator (Phase 3)

Produces standalone:
- `index.html`: Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- `styles.css`: Scoped CSS custom properties.
- `app.js`: Clean ES6 module with interactive click/input listeners.

---

## 3. Flutter Dart Generator (Phase 3)

Produces idiomatic Flutter widgets:
- `lib/main.dart`: Root `MaterialApp` with `appTheme`.
- `lib/theme.dart`: `AppColors` and `ThemeData`.
- `lib/widgets/*`: Clean stateless/stateful Flutter widgets.
- `pubspec.yaml`: Declarations and asset bindings.
