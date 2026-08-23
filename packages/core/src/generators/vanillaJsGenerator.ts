import { DesignTokens } from "../types/tokens.js";
import { UIIRDocument, UINode } from "../types/ir.js";
import { ComponentPlan } from "../types/planner.js";
import { GeneratedProject, GeneratedFile } from "../types/generator.js";
import { TargetCodeGenerator } from "./types.js";
import { DesignTokenEngine } from "../tokens/engine.js";

export class VanillaJsGenerator implements TargetCodeGenerator {
  public readonly target = "vanillajs" as const;

  /**
   * Generates a complete, runnable Vanilla JS (HTML5 + CSS3 + ES6) project.
   */
  public async generate(
    ir: UIIRDocument,
    tokens: DesignTokens,
    plan: ComponentPlan
  ): Promise<GeneratedProject> {
    const files: GeneratedFile[] = [];

    // 1. package.json
    files.push({
      path: "package.json",
      language: "json",
      isEntry: false,
      content: JSON.stringify(
        {
          name: "aiui-vanillajs-app",
          private: true,
          version: "1.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          devDependencies: {
            vite: "^6.2.0",
          },
        },
        null,
        2
      ),
    });

    // 2. vite.config.js
    files.push({
      path: "vite.config.js",
      language: "javascript",
      isEntry: false,
      content: `import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
});
`,
    });

    // 3. index.css (tokens + utilities + layout)
    const tokenCss = DesignTokenEngine.toCssVariables(tokens);
    const globalCss = this.generateGlobalCss(tokenCss);
    files.push({
      path: "index.css",
      language: "css",
      isEntry: false,
      content: globalCss,
    });

    // 4. Generate HTML DOM tree from IR
    const bodyHtml = this.renderNodeToHtml(ir.rootNodeId, ir.nodes, 2);

    // 5. index.html
    files.push({
      path: "index.html",
      language: "html",
      isEntry: true,
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.escapeHtml(ir.name || "AIUI Vanilla JS App")}</title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    <div id="root">
${bodyHtml}
    </div>
    <script type="module" src="./main.js"></script>
  </body>
</html>
`,
    });

    // 6. main.js (interactive DOM logic & event listeners)
    files.push({
      path: "main.js",
      language: "javascript",
      isEntry: false,
      content: `// AIUI Autonomous Vanilla JS Application Logic
document.addEventListener('DOMContentLoaded', () => {
  console.log('[AIUI] Application mounted successfully.');

  // Interactive buttons ripple and click handlers
  const buttons = document.querySelectorAll('button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      console.log(\`[AIUI] Button '\${btn.innerText.trim()}' clicked.\`);
    });
  });
});
`,
    });

    return {
      target: "vanillajs",
      entryFile: "index.html",
      files,
      staticAssets: {},
      dependencies: {
        vite: "^6.2.0",
      },
    };
  }

  private generateGlobalCss(tokenCss: string): string {
    return `${tokenCss}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-family-body, Inter, system-ui, sans-serif);
  line-height: var(--line-height-normal, 1.5);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

button:hover {
  filter: brightness(1.08);
}

button:active {
  transform: translateY(1px);
}

input, textarea, select {
  font-family: inherit;
  font-size: inherit;
  outline: none;
}

a {
  color: inherit;
  text-decoration: none;
}
`;
  }

  private renderNodeToHtml(nodeId: string, nodes: Record<string, UINode>, indent: number): string {
    const node = nodes[nodeId];
    if (!node) return "";

    const pad = "  ".repeat(indent);
    const tag = this.resolveHtmlTag(node.type);
    const styleString = this.nodeStyleToCssInline(node.styles, node.layout, node.dimensions);
    const styleAttr = styleString ? ` style="${styleString}"` : "";
    const idAttr = ` id="${node.id}"`;

    if (node.type === "image") {
      const src = node.content?.src || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";
      const alt = this.escapeHtml(node.content?.alt || "Image");
      return `${pad}<img src="${src}" alt="${alt}"${styleAttr}${idAttr} />`;
    }

    if (node.type === "input") {
      const inputType = node.content?.inputType || "text";
      const placeholder = this.escapeHtml(node.content?.placeholder || "");
      return `${pad}<input type="${inputType}" placeholder="${placeholder}"${styleAttr}${idAttr} />`;
    }

    const childrenHtml: string[] = [];
    if (node.content?.text) {
      childrenHtml.push(`${pad}  ${this.escapeHtml(node.content.text)}`);
    }

    for (const childId of node.childIds || []) {
      const childHtml = this.renderNodeToHtml(childId, nodes, indent + 1);
      if (childHtml) {
        childrenHtml.push(childHtml);
      }
    }

    if (childrenHtml.length === 0) {
      return `${pad}<${tag}${idAttr}${styleAttr}></${tag}>`;
    }

    return `${pad}<${tag}${idAttr}${styleAttr}>\n${childrenHtml.join("\n")}\n${pad}</${tag}>`;
  }

  private resolveHtmlTag(type: string): string {
    switch (type) {
      case "page":
      case "container":
      case "flex":
      case "grid":
        return "div";
      case "navbar":
      case "header":
        return "header";
      case "sidebar":
        return "aside";
      case "footer":
        return "footer";
      case "hero":
      case "section":
        return "section";
      case "card":
        return "article";
      case "button":
        return "button";
      case "heading":
        return "h2";
      case "text":
        return "p";
      case "form":
        return "form";
      case "badge":
        return "span";
      case "divider":
        return "hr";
      case "list":
        return "ul";
      default:
        return "div";
    }
  }

  private nodeStyleToCssInline(styles?: any, layout?: any, dimensions?: any): string {
    const rules: string[] = [];

    if (dimensions) {
      if (dimensions.width && dimensions.width !== "auto") {
        rules.push(`width: ${typeof dimensions.width === "number" ? `${dimensions.width}px` : dimensions.width}`);
      }
      if (dimensions.height && dimensions.height !== "auto") {
        rules.push(`height: ${typeof dimensions.height === "number" ? `${dimensions.height}px` : dimensions.height}`);
      }
      if (dimensions.maxWidth) {
        rules.push(`max-width: ${typeof dimensions.maxWidth === "number" ? `${dimensions.maxWidth}px` : dimensions.maxWidth}`);
      }
    }

    if (layout) {
      rules.push(`display: ${layout.display || "flex"}`);
      if (layout.display === "flex") {
        rules.push(`flex-direction: ${layout.flexDirection || "column"}`);
        if (layout.justifyContent) rules.push(`justify-content: ${layout.justifyContent}`);
        if (layout.alignItems) rules.push(`align-items: ${layout.alignItems}`);
        if (layout.gap) {
          rules.push(`gap: ${typeof layout.gap === "number" ? `${layout.gap}px` : layout.gap}`);
        }
        if (layout.flexWrap) rules.push(`flex-wrap: ${layout.flexWrap}`);
      } else if (layout.display === "grid") {
        if (layout.gridTemplateColumns) rules.push(`grid-template-columns: ${layout.gridTemplateColumns}`);
        if (layout.gap) {
          rules.push(`gap: ${typeof layout.gap === "number" ? `${layout.gap}px` : layout.gap}`);
        }
      }
    }

    if (styles) {
      if (styles.backgroundColor) rules.push(`background-color: ${styles.backgroundColor}`);
      if (styles.backgroundGradient) rules.push(`background: ${styles.backgroundGradient}`);
      if (styles.color) rules.push(`color: ${styles.color}`);
      if (styles.fontFamily) rules.push(`font-family: ${styles.fontFamily}`);
      if (styles.fontSize) {
        rules.push(`font-size: ${typeof styles.fontSize === "number" ? `${styles.fontSize}px` : styles.fontSize}`);
      }
      if (styles.fontWeight) rules.push(`font-weight: ${styles.fontWeight}`);
      if (styles.lineHeight) rules.push(`line-height: ${styles.lineHeight}`);
      if (styles.letterSpacing) rules.push(`letter-spacing: ${styles.letterSpacing}`);
      if (styles.textAlign) rules.push(`text-align: ${styles.textAlign}`);

      if (styles.padding) {
        rules.push(`padding: ${styles.padding.top || 0}px ${styles.padding.right || 0}px ${styles.padding.bottom || 0}px ${styles.padding.left || 0}px`);
      }
      if (styles.margin) {
        rules.push(`margin: ${styles.margin.top || 0}px ${styles.margin.right || 0}px ${styles.margin.bottom || 0}px ${styles.margin.left || 0}px`);
      }
      if (styles.border && styles.border.width > 0) {
        rules.push(`border: ${styles.border.width}px ${styles.border.style || "solid"} ${styles.border.color || "transparent"}`);
      }
      if (styles.borderRadius) {
        rules.push(`border-radius: ${styles.borderRadius.topLeft || 0}px ${styles.borderRadius.topRight || 0}px ${styles.borderRadius.bottomRight || 0}px ${styles.borderRadius.bottomLeft || 0}px`);
      }
      if (styles.boxShadow) rules.push(`box-shadow: ${styles.boxShadow}`);
    }

    return rules.join("; ");
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
