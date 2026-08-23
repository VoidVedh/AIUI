# Design Token Engine Specification

The Design Token Engine transforms raw visual styles from the UI IR into structured, semantic, reusable tokens.

---

## 1. Token Taxonomy

```
DesignTokens
├── colors
│   ├── primary, primaryHover, primaryActive, primaryForeground
│   ├── secondary, secondaryForeground
│   ├── background, surface, surfaceCard, surfaceElevated
│   ├── text, textMuted, textSubtle, textInverse
│   ├── border, borderLight, borderFocus
│   ├── accent, success, warning, error, info
│   └── gradients: Record<string, string>
├── typography
│   ├── fontFamilies: { sans, serif, mono, display }
│   ├── fontSizes: { xs, sm, base, md, lg, xl, 2xl, 3xl, 4xl }
│   ├── fontWeights: { normal, medium, semibold, bold }
│   ├── lineHeights: { tight, normal, relaxed }
│   └── letterSpacings: { tight, normal, wide }
├── spacing
│   └── scale: { 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32 } (in px or rem)
├── radius
│   └── scale: { none, sm, md, lg, xl, full }
├── shadows
│   └── scale: { none, sm, md, lg, xl, inner }
├── borders
│   └── widths: { none, thin, medium, thick }
└── breakpoints
    └── values: { sm: 640, md: 768, lg: 1024, xl: 1280 }
```

---

## 2. Multi-Target Token Serialization

### CSS Custom Properties (`index.css` / `styles.css`)
```css
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
  --font-sans: 'Inter', system-ui, sans-serif;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --space-4: 16px;
  --space-6: 24px;
}
```

### Flutter ThemeData (`theme.dart`)
```dart
import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF3B82F6);
  static const Color background = Color(0xFF0F172A);
  static const Color surface = Color(0xFF1E293B);
  static const Color text = Color(0xFFF8FAFC);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color border = Color(0xFF334155);
}

final ThemeData appTheme = ThemeData(
  brightness: Brightness.dark,
  primaryColor: AppColors.primary,
  scaffoldBackgroundColor: AppColors.background,
  cardColor: AppColors.surface,
  fontFamily: 'Inter',
);
```
