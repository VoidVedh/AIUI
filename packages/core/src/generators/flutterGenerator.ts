import { DesignTokens } from "../types/tokens.js";
import { UIIRDocument, UINode } from "../types/ir.js";
import { ComponentPlan } from "../types/planner.js";
import { GeneratedProject, GeneratedFile } from "../types/generator.js";
import { TargetCodeGenerator } from "./types.js";

export class FlutterGenerator implements TargetCodeGenerator {
  public readonly target = "flutter" as const;

  /**
   * Generates a complete, runnable Flutter/Dart project (pubspec.yaml + lib/main.dart).
   */
  public async generate(
    ir: UIIRDocument,
    tokens: DesignTokens,
    plan: ComponentPlan
  ): Promise<GeneratedProject> {
    const files: GeneratedFile[] = [];

    // 1. pubspec.yaml
    files.push({
      path: "pubspec.yaml",
      language: "dart",
      isEntry: false,
      content: `name: aiui_flutter_app
description: "AIUI Autonomous Flutter Application"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6
  google_fonts: ^6.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`,
    });

    // 2. lib/main.dart
    const mainDartContent = this.generateMainDart(ir, tokens);
    files.push({
      path: "lib/main.dart",
      language: "dart",
      isEntry: true,
      content: mainDartContent,
    });

    return {
      target: "flutter",
      entryFile: "lib/main.dart",
      files,
      staticAssets: {},
      dependencies: {
        flutter: "sdk",
      },
    };
  }

  private generateMainDart(ir: UIIRDocument, tokens: DesignTokens): string {
    const rootNode = ir.nodes[ir.rootNodeId];
    const primaryHex = (tokens.colors.primary || "#3B82F6").replace("#", "0xFF");
    const bgHex = (tokens.colors.background || "#0F172A").replace("#", "0xFF");
    const surfaceHex = (tokens.colors.surfaceCard || "#1E293B").replace("#", "0xFF");
    const textHex = (tokens.colors.text || "#F8FAFC").replace("#", "0xFF");

    const rootWidget = this.renderNodeToFlutter(ir.rootNodeId, ir.nodes, 3);

    return `import 'package:flutter/material.dart';

void main() {
  runApp(const AiuiApp());
}

class AiuiApp extends StatelessWidget {
  const AiuiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${this.escapeDartString(ir.name || "AIUI App")}',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(${bgHex}),
        primaryColor: const Color(${primaryHex}),
        cardColor: const Color(${surfaceHex}),
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: Color(${textHex}), fontFamily: 'Inter'),
        ),
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatelessWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: ${rootWidget},
        ),
      ),
    );
  }
}
`;
  }

  private renderNodeToFlutter(nodeId: string, nodes: Record<string, UINode>, indent: number): string {
    const node = nodes[nodeId];
    if (!node) return "const SizedBox.shrink()";

    const pad = "  ".repeat(indent);

    // Atomic / Leaf Nodes
    if (node.type === "heading" || node.type === "text") {
      const text = this.escapeDartString(node.content?.text || "");
      const fontSize = typeof node.styles?.fontSize === "number" ? node.styles.fontSize : 16;
      const fontWeight = (typeof node.styles?.fontWeight === "number" ? node.styles.fontWeight >= 700 : node.styles?.fontWeight === "bold" || node.styles?.fontWeight === "700") ? "FontWeight.bold" : "FontWeight.normal";
      const color = node.styles?.color ? `Color(${node.styles.color.replace("#", "0xFF")})` : "Colors.white";

      return `Text(
${pad}  '${text}',
${pad}  style: const TextStyle(
${pad}    fontSize: ${fontSize},
${pad}    fontWeight: ${fontWeight},
${pad}    color: ${color},
${pad}  ),
${pad})`;
    }

    if (node.type === "button") {
      const text = this.escapeDartString(node.content?.text || "Action");
      return `ElevatedButton(
${pad}  onPressed: () {},
${pad}  style: ElevatedButton.styleFrom(
${pad}    backgroundColor: const Color(0xFF3B82F6),
${pad}    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
${pad}    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
${pad}  ),
${pad}  child: const Text('${text}', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
${pad})`;
    }

    if (node.type === "input") {
      const hint = this.escapeDartString(node.content?.placeholder || "Enter text...");
      return `TextField(
${pad}  decoration: InputDecoration(
${pad}    hintText: '${hint}',
${pad}    filled: true,
${pad}    fillColor: const Color(0xFF1E293B),
${pad}    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
${pad}    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
${pad}  ),
${pad})`;
    }

    // Children Widgets
    const childWidgets: string[] = [];
    for (const childId of node.childIds || []) {
      childWidgets.push(this.renderNodeToFlutter(childId, nodes, indent + 2));
    }

    if (childWidgets.length === 0) {
      return `Container(
${pad}  padding: const EdgeInsets.all(16),
${pad}  decoration: BoxDecoration(
${pad}    color: const Color(0xFF1E293B),
${pad}    borderRadius: BorderRadius.circular(8),
${pad}  ),
${pad})`;
    }

    if (node.layout?.display === "grid") {
      return `GridView.count(
${pad}  crossAxisCount: 2,
${pad}  shrinkWrap: true,
${pad}  physics: const NeverScrollableScrollPhysics(),
${pad}  padding: const EdgeInsets.all(16),
${pad}  crossAxisSpacing: 16,
${pad}  mainAxisSpacing: 16,
${pad}  children: [
${childWidgets.map(w => `${pad}    ${w},`).join("\n")}
${pad}  ],
${pad})`;
    }

    if (node.layout?.flexDirection === "row") {
      return `Row(
${pad}  mainAxisAlignment: MainAxisAlignment.spaceBetween,
${pad}  crossAxisAlignment: CrossAxisAlignment.center,
${pad}  children: [
${childWidgets.map(w => `${pad}    ${w},`).join("\n")}
${pad}  ],
${pad})`;
    }

    // Default Column
    return `Container(
${pad}  padding: const EdgeInsets.all(16),
${pad}  child: Column(
${pad}    crossAxisAlignment: CrossAxisAlignment.start,
${pad}    children: [
${childWidgets.map(w => `${pad}      ${w},`).join("\n")}
${pad}    ],
${pad}  ),
${pad})`;
  }

  private escapeDartString(str: string): string {
    return str.replace(/'/g, "\\'").replace(/\$/g, "\\$");
  }
}
