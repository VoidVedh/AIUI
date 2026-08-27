import { DesignTokenEngine } from "../tokens/engine.js";
export class ReactGenerator {
    target = "react";
    async generate(ir, tokens, plan) {
        const files = [];
        // 1. Generate Global CSS with Design Tokens
        const globalCss = this.generateGlobalCss(tokens, ir);
        files.push({
            path: "src/index.css",
            content: globalCss,
            isEntry: false,
            language: "css",
        });
        // 2. Generate Subcomponents from Plan
        const generatedComponents = {};
        for (const [compId, compNode] of Object.entries(plan.components)) {
            if (compId === plan.rootComponentId)
                continue;
            const compCode = this.generateSubComponent(compNode, ir, tokens);
            files.push({
                path: compNode.filePath,
                content: compCode,
                isEntry: false,
                language: "jsx",
            });
            generatedComponents[compId] = compNode.name;
        }
        // 3. Generate App.jsx
        const appCode = this.generateAppComponent(plan, ir, tokens, generatedComponents);
        files.push({
            path: "src/App.jsx",
            content: appCode,
            isEntry: true,
            language: "jsx",
        });
        // 4. Generate main.jsx
        files.push({
            path: "src/main.jsx",
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
            isEntry: false,
            language: "jsx",
        });
        // 5. Generate index.html
        files.push({
            path: "index.html",
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.escapeHtml(ir.name || "AIUI Generated App")}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
            isEntry: false,
            language: "html",
        });
        // 6. Generate vite.config.js
        files.push({
            path: "vite.config.js",
            content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '127.0.0.1',
  },
});
`,
            isEntry: false,
            language: "javascript",
        });
        // 7. Generate package.json
        files.push({
            path: "package.json",
            content: JSON.stringify({
                name: "aiui-generated-app",
                private: true,
                version: "0.1.0",
                type: "module",
                scripts: {
                    dev: "vite",
                    build: "vite build",
                    preview: "vite preview",
                },
                dependencies: {
                    react: "^19.0.0",
                    "react-dom": "^19.0.0",
                    "lucide-react": "^0.475.0",
                },
                devDependencies: {
                    "@vitejs/plugin-react": "^4.3.4",
                    vite: "^6.2.0",
                },
            }, null, 2),
            isEntry: false,
            language: "json",
        });
        return {
            target: "react",
            files,
            entryFile: "src/App.jsx",
            staticAssets: {},
            dependencies: {
                react: "^19.0.0",
                "react-dom": "^19.0.0",
                "lucide-react": "^0.475.0",
            },
        };
    }
    generateGlobalCss(tokens, ir) {
        const cssVars = DesignTokenEngine.toCssVariables(tokens);
        return `${cssVars}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  width: 100%;
  min-height: 100%;
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
  transition: all 0.2s ease-in-out;
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

/* Base utility classes derived from UI IR */
.aiui-page {
  display: flex;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
}

.aiui-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
}

.aiui-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.aiui-glass {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
`;
    }
    generateAppComponent(plan, ir, tokens, subComponents) {
        const rootNode = ir.nodes[ir.rootNodeId];
        const imports = ["import React from 'react';"];
        const iconImports = new Set();
        // If we have subcomponents, import them
        for (const compName of Object.values(subComponents)) {
            imports.push(`import ${compName} from './components/${compName}.jsx';`);
        }
        // If no subcomponents, render directly from nodes
        let bodyJsx = "";
        if (Object.keys(subComponents).length > 0) {
            const subCompTags = Object.values(subComponents)
                .map(name => `      <${name} />`)
                .join("\n");
            const styleObj = this.nodeStyleToReactInline(rootNode?.styles, rootNode?.layout, rootNode?.dimensions);
            bodyJsx = `    <div id="${ir.rootNodeId}" data-aiui-id="${ir.rootNodeId}" className="aiui-page" style={${JSON.stringify(styleObj)}}>\n${subCompTags}\n    </div>`;
        }
        else {
            bodyJsx = this.renderNodeToJsx(ir.rootNodeId, ir.nodes, 2, iconImports);
        }
        if (iconImports.size > 0) {
            imports.push(`import { ${Array.from(iconImports).join(", ")} } from 'lucide-react';`);
        }
        return `${imports.join("\n")}

export default function App() {
  return (
${bodyJsx}
  );
}
`;
    }
    generateSubComponent(compNode, ir, tokens) {
        const rootNodeId = compNode.irNodeIds[0];
        const iconImports = new Set();
        const jsxContent = this.renderNodeToJsx(rootNodeId, ir.nodes, 2, iconImports);
        const imports = ["import React from 'react';"];
        if (iconImports.size > 0) {
            imports.push(`import { ${Array.from(iconImports).join(", ")} } from 'lucide-react';`);
        }
        return `${imports.join("\n")}

export default function ${compNode.name}(props) {
  return (
${jsxContent}
  );
}
`;
    }
    renderNodeToJsx(nodeId, nodes, indent, iconImports) {
        const node = nodes[nodeId];
        if (!node)
            return "";
        const pad = "  ".repeat(indent);
        const tag = this.resolveHtmlTag(node.type);
        const styleObj = this.nodeStyleToReactInline(node.styles, node.layout, node.dimensions);
        const styleAttr = Object.keys(styleObj).length > 0 ? ` style={${JSON.stringify(styleObj)}}` : "";
        const idAttr = ` id="${node.id}" data-aiui-id="${node.id}"`;
        // Handle Atomic leaf nodes
        if (node.type === "icon" && node.content?.iconName) {
            const iconComp = this.resolveLucideIcon(node.content.iconName);
            iconImports.add(iconComp);
            return `${pad}<${iconComp} size={${node.dimensions.height === "auto" ? 20 : node.dimensions.height}}${styleAttr} id="${node.id}" />`;
        }
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
        // Children or text content
        const childrenJsx = [];
        if (node.content?.text) {
            childrenJsx.push(`${pad}  ${this.escapeJsxText(node.content.text)}`);
        }
        for (const childId of node.childIds || []) {
            const childJsx = this.renderNodeToJsx(childId, nodes, indent + 1, iconImports);
            if (childJsx) {
                childrenJsx.push(childJsx);
            }
        }
        if (childrenJsx.length === 0) {
            return `${pad}<${tag}${idAttr}${styleAttr} />`;
        }
        return `${pad}<${tag}${idAttr}${styleAttr}>\n${childrenJsx.join("\n")}\n${pad}</${tag}>`;
    }
    resolveHtmlTag(type) {
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
    resolveLucideIcon(name) {
        const clean = name.replace(/[^a-zA-Z0-9]/g, "");
        const pascal = clean.charAt(0).toUpperCase() + clean.slice(1);
        const standardIcons = {
            Search: "Search",
            User: "User",
            Settings: "Settings",
            Bell: "Bell",
            Menu: "Menu",
            Close: "X",
            Check: "Check",
            ChevronRight: "ChevronRight",
            ChevronLeft: "ChevronLeft",
            ArrowRight: "ArrowRight",
            Sparkles: "Sparkles",
            Zap: "Zap",
            Shield: "Shield",
            Activity: "Activity",
            BarChart: "BarChart3",
            Layers: "Layers",
            Home: "Home",
            Mail: "Mail",
            Lock: "Lock",
            Calendar: "Calendar",
            TrendingUp: "TrendingUp",
        };
        return standardIcons[pascal] || "Sparkles";
    }
    nodeStyleToReactInline(styles, layout, dimensions) {
        const inline = {};
        if (dimensions) {
            if (dimensions.width && dimensions.width !== "auto") {
                inline.width = typeof dimensions.width === "number" ? `${dimensions.width}px` : dimensions.width;
            }
            if (dimensions.height && dimensions.height !== "auto") {
                inline.height = typeof dimensions.height === "number" ? `${dimensions.height}px` : dimensions.height;
            }
            if (dimensions.minWidth) {
                inline.minWidth = typeof dimensions.minWidth === "number" ? `${dimensions.minWidth}px` : dimensions.minWidth;
            }
            if (dimensions.minHeight) {
                inline.minHeight = typeof dimensions.minHeight === "number" ? `${dimensions.minHeight}px` : dimensions.minHeight;
            }
            if (dimensions.maxWidth) {
                inline.maxWidth = typeof dimensions.maxWidth === "number" ? `${dimensions.maxWidth}px` : dimensions.maxWidth;
            }
            if (dimensions.maxHeight) {
                inline.maxHeight = typeof dimensions.maxHeight === "number" ? `${dimensions.maxHeight}px` : dimensions.maxHeight;
            }
        }
        if (layout) {
            inline.display = layout.display || "flex";
            if (layout.display === "flex") {
                inline.flexDirection = layout.flexDirection || "column";
                if (layout.justifyContent)
                    inline.justifyContent = layout.justifyContent;
                if (layout.alignItems)
                    inline.alignItems = layout.alignItems;
                if (layout.alignSelf)
                    inline.alignSelf = layout.alignSelf;
                if (layout.gap) {
                    inline.gap = typeof layout.gap === "number" ? `${layout.gap}px` : layout.gap;
                }
                if (layout.flexWrap)
                    inline.flexWrap = layout.flexWrap;
            }
            else if (layout.display === "grid") {
                if (layout.gridTemplateColumns)
                    inline.gridTemplateColumns = layout.gridTemplateColumns;
                if (layout.gap) {
                    inline.gap = typeof layout.gap === "number" ? `${layout.gap}px` : layout.gap;
                }
            }
        }
        if (styles) {
            if (styles.backgroundColor)
                inline.backgroundColor = styles.backgroundColor;
            if (styles.backgroundGradient)
                inline.background = styles.backgroundGradient;
            if (styles.color)
                inline.color = styles.color;
            if (styles.fontFamily)
                inline.fontFamily = styles.fontFamily;
            if (styles.fontSize) {
                inline.fontSize = typeof styles.fontSize === "number" ? `${styles.fontSize}px` : styles.fontSize;
            }
            if (styles.fontWeight)
                inline.fontWeight = styles.fontWeight;
            if (styles.lineHeight)
                inline.lineHeight = styles.lineHeight;
            if (styles.letterSpacing)
                inline.letterSpacing = styles.letterSpacing;
            if (styles.textAlign)
                inline.textAlign = styles.textAlign;
            if (styles.textTransform)
                inline.textTransform = styles.textTransform;
            if (styles.padding) {
                inline.padding = `${styles.padding.top || 0}px ${styles.padding.right || 0}px ${styles.padding.bottom || 0}px ${styles.padding.left || 0}px`;
            }
            if (styles.margin) {
                inline.margin = `${styles.margin.top || 0}px ${styles.margin.right || 0}px ${styles.margin.bottom || 0}px ${styles.margin.left || 0}px`;
            }
            if (styles.border && styles.border.width > 0) {
                inline.border = `${styles.border.width}px ${styles.border.style || "solid"} ${styles.border.color || "transparent"}`;
            }
            if (styles.borderRadius) {
                inline.borderRadius = `${styles.borderRadius.topLeft || 0}px ${styles.borderRadius.topRight || 0}px ${styles.borderRadius.bottomRight || 0}px ${styles.borderRadius.bottomLeft || 0}px`;
            }
            if (styles.boxShadow)
                inline.boxShadow = styles.boxShadow;
            if (styles.backdropFilter)
                inline.backdropFilter = styles.backdropFilter;
        }
        return inline;
    }
    escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    escapeJsxText(text) {
        return text.replace(/{/g, "&#123;").replace(/}/g, "&#125;");
    }
}
//# sourceMappingURL=reactGenerator.js.map