import { UIIRDocumentSchema } from "../types/ir.js";
export class CvExtractor {
    /**
     * Deterministically constructs a UIIRDocument from an image analysis summary or template metadata.
     */
    static extractFromSummary(name, width, height, colors, sections) {
        const nodes = {};
        const rootId = "page_root";
        // Root Node
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Page",
            parentId: null,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                backgroundColor: colors.dominantBg,
                color: colors.textColor,
                fontFamily: "Inter, system-ui, sans-serif",
            },
            confidence: 0.98,
        };
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            const secId = `sec_${i}_${sec.type}`;
            nodes[rootId].childIds.push(secId);
            if (sec.type === "navbar") {
                this.buildNavbar(nodes, secId, rootId, colors, sec);
            }
            else if (sec.type === "hero") {
                this.buildHero(nodes, secId, rootId, colors, sec);
            }
            else if (sec.type === "card-grid") {
                this.buildCardGrid(nodes, secId, rootId, colors, sec);
            }
            else if (sec.type === "form") {
                this.buildForm(nodes, secId, rootId, colors, sec);
            }
            else if (sec.type === "dashboard") {
                this.buildDashboard(nodes, secId, rootId, colors, sec);
            }
            else if (sec.type === "mobile") {
                this.buildMobile(nodes, secId, rootId, colors, sec);
            }
            else if (sec.type === "dense-matrix") {
                this.buildDenseMatrix(nodes, secId, rootId, colors, sec);
            }
        }
        return UIIRDocumentSchema.parse({
            version: "1.0.0",
            id: `ir_${Date.now()}`,
            name,
            viewport: { width, height, devicePixelRatio: 1 },
            rootNodeId: rootId,
            nodes,
            metadata: {
                sourceType: "screenshot",
                confidence: 0.96,
                extractedAt: new Date().toISOString(),
                targetFrameworks: ["react", "vanillajs", "flutter"],
            },
        });
    }
    static buildNavbar(nodes, id, parentId, colors, sec) {
        nodes[id] = {
            id,
            type: "navbar",
            name: "Header Navigation",
            parentId,
            childIds: [`${id}_logo`, `${id}_nav_links`, `${id}_actions`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 72 },
            layout: {
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 24,
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: colors.surfaceBg,
                padding: { top: 16, right: 32, bottom: 16, left: 32 },
                border: { width: 1, style: "solid", color: "#334155" },
            },
            confidence: 0.99,
        };
        // Logo
        nodes[`${id}_logo`] = {
            id: `${id}_logo`,
            type: "heading",
            parentId: id,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                color: colors.textColor,
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
            },
            content: { text: sec.title || "AIUI Studio" },
            confidence: 0.99,
        };
        // Nav links
        nodes[`${id}_nav_links`] = {
            id: `${id}_nav_links`,
            type: "flex",
            parentId: id,
            childIds: [`${id}_link_1`, `${id}_link_2`, `${id}_link_3`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 28,
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {},
            confidence: 0.95,
        };
        const linkLabels = ["Features", "Solutions", "Pricing"];
        for (let i = 0; i < linkLabels.length; i++) {
            nodes[`${id}_link_${i + 1}`] = {
                id: `${id}_link_${i + 1}`,
                type: "text",
                parentId: `${id}_nav_links`,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "auto", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: {
                    color: colors.mutedColor,
                    fontSize: "14px",
                    fontWeight: 500,
                },
                content: { text: linkLabels[i] },
                confidence: 0.95,
            };
        }
        // Actions CTA
        nodes[`${id}_actions`] = {
            id: `${id}_actions`,
            type: "button",
            parentId: id,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: 40 },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
            styles: {
                backgroundColor: colors.primaryAccent,
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                padding: { top: 8, right: 18, bottom: 8, left: 18 },
                borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
            },
            content: { text: sec.actionText || "Get Started" },
            confidence: 0.98,
        };
    }
    static buildHero(nodes, id, parentId, colors, sec) {
        nodes[id] = {
            id,
            type: "hero",
            name: "Hero Section",
            parentId,
            childIds: [`${id}_content`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                flexWrap: "nowrap",
            },
            styles: {
                padding: { top: 80, right: 24, bottom: 60, left: 24 },
                textAlign: "center",
            },
            confidence: 0.98,
        };
        nodes[`${id}_content`] = {
            id: `${id}_content`,
            type: "container",
            parentId: id,
            childIds: [`${id}_badge`, `${id}_heading`, `${id}_subheading`, `${id}_cta_group`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", maxWidth: 840, height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: { textAlign: "center" },
            confidence: 0.97,
        };
        // Badge
        nodes[`${id}_badge`] = {
            id: `${id}_badge`,
            type: "badge",
            parentId: `${id}_content`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "inline-block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                color: colors.primaryAccent,
                fontSize: "12px",
                fontWeight: 600,
                padding: { top: 6, right: 14, bottom: 6, left: 14 },
                borderRadius: { topLeft: 9999, topRight: 9999, bottomRight: 9999, bottomLeft: 9999 },
                border: { width: 1, style: "solid", color: "rgba(59, 130, 246, 0.3)" },
            },
            content: { text: "✦ Next-Gen Autonomous UI Engineering" },
            confidence: 0.95,
        };
        // Heading
        nodes[`${id}_heading`] = {
            id: `${id}_heading`,
            type: "heading",
            parentId: `${id}_content`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                color: colors.textColor,
                fontSize: "44px",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
            },
            content: { text: sec.title || "Transform Screenshots Into Pixel-Perfect Production Code" },
            confidence: 0.99,
        };
        // Subheading
        nodes[`${id}_subheading`] = {
            id: `${id}_subheading`,
            type: "text",
            parentId: `${id}_content`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", maxWidth: 640, height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                color: colors.mutedColor,
                fontSize: "18px",
                lineHeight: 1.6,
            },
            content: { text: sec.subtitle || "AIUI autonomously analyzes UI design, extracts design tokens, builds component trees, and self-corrects using computer vision." },
            confidence: 0.96,
        };
        // CTA Group
        nodes[`${id}_cta_group`] = {
            id: `${id}_cta_group`,
            type: "flex",
            parentId: `${id}_content`,
            childIds: [`${id}_btn_primary`, `${id}_btn_secondary`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                flexWrap: "nowrap",
            },
            styles: {
                margin: { top: 12, right: 0, bottom: 0, left: 0 },
            },
            confidence: 0.97,
        };
        nodes[`${id}_btn_primary`] = {
            id: `${id}_btn_primary`,
            type: "button",
            parentId: `${id}_cta_group`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: 48 },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
            styles: {
                backgroundColor: colors.primaryAccent,
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                padding: { top: 12, right: 28, bottom: 12, left: 28 },
                borderRadius: { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 },
            },
            content: { text: "Start Building Now" },
            confidence: 0.99,
        };
        nodes[`${id}_btn_secondary`] = {
            id: `${id}_btn_secondary`,
            type: "button",
            parentId: `${id}_cta_group`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: 48 },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
            styles: {
                backgroundColor: "rgba(30, 41, 59, 0.8)",
                color: colors.textColor,
                fontSize: "15px",
                fontWeight: 600,
                padding: { top: 12, right: 24, bottom: 12, left: 24 },
                borderRadius: { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 },
                border: { width: 1, style: "solid", color: "#334155" },
            },
            content: { text: "View Documentation" },
            confidence: 0.97,
        };
    }
    static buildCardGrid(nodes, id, parentId, colors, sec) {
        const items = sec.items || [
            { title: "Structured UI IR", desc: "Framework-agnostic intermediate language isolating vision perception from code output." },
            { title: "Multi-Target Generators", desc: "Synthesizes idiomatic React 19, Vanilla JS, and Flutter from a single analyzed tree." },
            { title: "Self-Correction Loop", desc: "Calculates real SSIM and pixelmatch metrics with targeted surgical CSS/JSX patch engine." },
        ];
        nodes[id] = {
            id,
            type: "section",
            name: "Features Grid",
            parentId,
            childIds: [`${id}_container`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", alignItems: "center", gap: 0, justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                padding: { top: 40, right: 24, bottom: 60, left: 24 },
            },
            confidence: 0.98,
        };
        nodes[`${id}_container`] = {
            id: `${id}_container`,
            type: "grid",
            parentId: id,
            childIds: items.map((_, idx) => `${id}_card_${idx}`),
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", maxWidth: 1140, height: "auto" },
            layout: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 24,
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {},
            confidence: 0.98,
        };
        items.forEach((item, idx) => {
            const cardId = `${id}_card_${idx}`;
            nodes[cardId] = {
                id: cardId,
                type: "card",
                name: `Feature Card ${idx + 1}`,
                parentId: `${id}_container`,
                childIds: [`${cardId}_icon`, `${cardId}_title`, `${cardId}_desc`],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 12,
                    justifyContent: "flex-start",
                    flexWrap: "nowrap",
                },
                styles: {
                    backgroundColor: colors.surfaceBg,
                    padding: { top: 28, right: 28, bottom: 28, left: 28 },
                    borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
                    border: { width: 1, style: "solid", color: "#334155" },
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                },
                confidence: 0.98,
            };
            nodes[`${cardId}_icon`] = {
                id: `${cardId}_icon`,
                type: "icon",
                parentId: cardId,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: 24, height: 24 },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: { color: colors.primaryAccent },
                content: { iconName: idx === 0 ? "Layers" : idx === 1 ? "Zap" : "Activity" },
                confidence: 0.95,
            };
            nodes[`${cardId}_title`] = {
                id: `${cardId}_title`,
                type: "heading",
                parentId: cardId,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: {
                    color: colors.textColor,
                    fontSize: "18px",
                    fontWeight: 600,
                },
                content: { text: item.title },
                confidence: 0.99,
            };
            nodes[`${cardId}_desc`] = {
                id: `${cardId}_desc`,
                type: "text",
                parentId: cardId,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: {
                    color: colors.mutedColor,
                    fontSize: "14px",
                    lineHeight: 1.5,
                },
                content: { text: item.desc },
                confidence: 0.98,
            };
        });
    }
    static buildForm(nodes, id, parentId, colors, sec) {
        nodes[id] = {
            id,
            type: "section",
            name: "Form Section",
            parentId,
            childIds: [`${id}_card`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
            styles: {
                padding: { top: 60, right: 24, bottom: 80, left: 24 },
            },
            confidence: 0.98,
        };
        nodes[`${id}_card`] = {
            id: `${id}_card`,
            type: "card",
            name: "Authentication Card",
            parentId: id,
            childIds: [`${id}_title`, `${id}_sub`, `${id}_form`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", maxWidth: 440, height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 18,
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: colors.surfaceBg,
                padding: { top: 36, right: 32, bottom: 36, left: 32 },
                borderRadius: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 },
                border: { width: 1, style: "solid", color: "#334155" },
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            },
            confidence: 0.99,
        };
        nodes[`${id}_title`] = {
            id: `${id}_title`,
            type: "heading",
            parentId: `${id}_card`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: colors.textColor, fontSize: "24px", fontWeight: 700 },
            content: { text: sec.title || "Create Account" },
            confidence: 0.99,
        };
        nodes[`${id}_sub`] = {
            id: `${id}_sub`,
            type: "text",
            parentId: `${id}_card`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: colors.mutedColor, fontSize: "14px" },
            content: { text: "Join thousands of developers using AIUI." },
            confidence: 0.98,
        };
        nodes[`${id}_form`] = {
            id: `${id}_form`,
            type: "form",
            parentId: `${id}_card`,
            childIds: [`${id}_name_inp`, `${id}_email_inp`, `${id}_pass_inp`, `${id}_submit_btn`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                gap: 14,
                alignItems: "stretch",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {},
            confidence: 0.99,
        };
        const inputs = [
            { id: `${id}_name_inp`, placeholder: "Full Name", type: "text" },
            { id: `${id}_email_inp`, placeholder: "Email address", type: "email" },
            { id: `${id}_pass_inp`, placeholder: "Password", type: "password" },
        ];
        for (const inp of inputs) {
            nodes[inp.id] = {
                id: inp.id,
                type: "input",
                parentId: `${id}_form`,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: 44 },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: {
                    backgroundColor: "#0F172A",
                    color: colors.textColor,
                    fontSize: "14px",
                    padding: { top: 10, right: 14, bottom: 10, left: 14 },
                    borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                    border: { width: 1, style: "solid", color: "#334155" },
                },
                content: { placeholder: inp.placeholder, inputType: inp.type },
                confidence: 0.98,
            };
        }
        nodes[`${id}_submit_btn`] = {
            id: `${id}_submit_btn`,
            type: "button",
            parentId: `${id}_form`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 44 },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
            styles: {
                backgroundColor: colors.primaryAccent,
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                padding: { top: 10, right: 20, bottom: 10, left: 20 },
                borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                margin: { top: 6, right: 0, bottom: 0, left: 0 },
            },
            content: { text: "Sign Up Free" },
            confidence: 0.99,
        };
    }
    static buildDashboard(nodes, id, parentId, colors, sec) {
        nodes[id] = {
            id,
            type: "section",
            name: "Dashboard Layout",
            parentId,
            childIds: [`${id}_sidebar`, `${id}_main_panel`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "100%", minHeight: "calc(100vh - 72px)" },
            layout: {
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "flex-start",
                gap: 0,
                flexWrap: "nowrap",
            },
            styles: {},
            confidence: 0.99,
        };
        // Sidebar
        nodes[`${id}_sidebar`] = {
            id: `${id}_sidebar`,
            type: "sidebar",
            name: "Sidebar Navigation",
            parentId: id,
            childIds: [`${id}_nav_1`, `${id}_nav_2`, `${id}_nav_3`, `${id}_nav_4`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: 240, height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "stretch",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: colors.surfaceBg,
                padding: { top: 24, right: 16, bottom: 24, left: 16 },
                border: { width: 1, style: "solid", color: "#334155" },
            },
            confidence: 0.98,
        };
        const navItems = ["Overview", "Analytics", "Reports", "Settings"];
        navItems.forEach((item, idx) => {
            nodes[`${id}_nav_${idx + 1}`] = {
                id: `${id}_nav_${idx + 1}`,
                type: "button",
                parentId: `${id}_sidebar`,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: 38 },
                layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 12, flexWrap: "nowrap" },
                styles: {
                    backgroundColor: idx === 0 ? "rgba(59, 130, 246, 0.15)" : "transparent",
                    color: idx === 0 ? colors.primaryAccent : colors.mutedColor,
                    fontSize: "14px",
                    fontWeight: idx === 0 ? 600 : 500,
                    padding: { top: 8, right: 12, bottom: 8, left: 12 },
                    borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
                },
                content: { text: item },
                confidence: 0.97,
            };
        });
        // Main Panel
        nodes[`${id}_main_panel`] = {
            id: `${id}_main_panel`,
            type: "container",
            name: "Dashboard Main Area",
            parentId: id,
            childIds: [`${id}_stats_grid`, `${id}_chart_card`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                gap: 24,
                alignItems: "stretch",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {
                padding: { top: 28, right: 28, bottom: 28, left: 28 },
            },
            confidence: 0.99,
        };
        // Stats Grid
        nodes[`${id}_stats_grid`] = {
            id: `${id}_stats_grid`,
            type: "grid",
            parentId: `${id}_main_panel`,
            childIds: [`${id}_stat_1`, `${id}_stat_2`, `${id}_stat_3`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: {
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {},
            confidence: 0.98,
        };
        const stats = [
            { label: "Total Revenue", val: "$124,500", diff: "+14.2%" },
            { label: "Active Pipelines", val: "842", diff: "+8.7%" },
            { label: "Avg Similarity Score", val: "94.6%", diff: "+3.1%" },
        ];
        stats.forEach((st, idx) => {
            const stId = `${id}_stat_${idx + 1}`;
            nodes[stId] = {
                id: stId,
                type: "card",
                parentId: `${id}_stats_grid`,
                childIds: [`${stId}_lbl`, `${stId}_val`, `${stId}_diff`],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: { display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: {
                    backgroundColor: colors.surfaceBg,
                    padding: { top: 20, right: 20, bottom: 20, left: 20 },
                    borderRadius: { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 },
                    border: { width: 1, style: "solid", color: "#334155" },
                },
                confidence: 0.98,
            };
            nodes[`${stId}_lbl`] = {
                id: `${stId}_lbl`,
                type: "text",
                parentId: stId,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "auto", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: { color: colors.mutedColor, fontSize: "13px" },
                content: { text: st.label },
                confidence: 0.98,
            };
            nodes[`${stId}_val`] = {
                id: `${stId}_val`,
                type: "heading",
                parentId: stId,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "auto", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: { color: colors.textColor, fontSize: "24px", fontWeight: 700 },
                content: { text: st.val },
                confidence: 0.99,
            };
            nodes[`${stId}_diff`] = {
                id: `${stId}_diff`,
                type: "text",
                parentId: stId,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "auto", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: { color: "#10B981", fontSize: "12px", fontWeight: 600 },
                content: { text: st.diff },
                confidence: 0.97,
            };
        });
        // Chart Card
        nodes[`${id}_chart_card`] = {
            id: `${id}_chart_card`,
            type: "card",
            name: "Chart Container",
            parentId: `${id}_main_panel`,
            childIds: [`${id}_chart_hdr`, `${id}_chart_body`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 320 },
            layout: { display: "flex", flexDirection: "column", gap: 16, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                backgroundColor: colors.surfaceBg,
                padding: { top: 24, right: 24, bottom: 24, left: 24 },
                borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
                border: { width: 1, style: "solid", color: "#334155" },
            },
            confidence: 0.97,
        };
        nodes[`${id}_chart_hdr`] = {
            id: `${id}_chart_hdr`,
            type: "heading",
            parentId: `${id}_chart_card`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: colors.textColor, fontSize: "16px", fontWeight: 600 },
            content: { text: "Performance Convergence Analytics" },
            confidence: 0.99,
        };
        nodes[`${id}_chart_body`] = {
            id: `${id}_chart_body`,
            type: "container",
            parentId: `${id}_chart_card`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "100%" },
            layout: { display: "flex", flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "nowrap" },
            styles: {
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                padding: { top: 20, right: 20, bottom: 20, left: 20 },
            },
            confidence: 0.95,
        };
    }
    static buildMobile(nodes, id, parentId, colors, sec) {
        nodes[id] = {
            id,
            type: "section",
            name: "Mobile App Canvas",
            parentId,
            childIds: [`${id}_app_bar`, `${id}_card_list`, `${id}_bottom_nav`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", maxWidth: 390, height: "100%", minHeight: 700 },
            layout: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "stretch",
                gap: 0,
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: colors.dominantBg,
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
            },
            confidence: 0.98,
        };
        // Mobile App Bar
        nodes[`${id}_app_bar`] = {
            id: `${id}_app_bar`,
            type: "header",
            parentId: id,
            childIds: [`${id}_bar_title`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 56 },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
            styles: {
                backgroundColor: colors.surfaceBg,
                border: { width: 1, style: "solid", color: "#334155" },
            },
            confidence: 0.99,
        };
        nodes[`${id}_bar_title`] = {
            id: `${id}_bar_title`,
            type: "heading",
            parentId: `${id}_app_bar`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: colors.textColor, fontSize: "16px", fontWeight: 700 },
            content: { text: "AIUI Mobile" },
            confidence: 0.99,
        };
        // Card list
        nodes[`${id}_card_list`] = {
            id: `${id}_card_list`,
            type: "container",
            parentId: id,
            childIds: [`${id}_mcard_1`, `${id}_mcard_2`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", gap: 14, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { padding: { top: 20, right: 16, bottom: 20, left: 16 } },
            confidence: 0.98,
        };
        ["Real-time Pipeline", "Self-Healing Engine"].forEach((t, idx) => {
            const mcId = `${id}_mcard_${idx + 1}`;
            nodes[mcId] = {
                id: mcId,
                type: "card",
                parentId: `${id}_card_list`,
                childIds: [`${mcId}_t`, `${mcId}_b`],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: {
                    backgroundColor: colors.surfaceBg,
                    padding: { top: 18, right: 18, bottom: 18, left: 18 },
                    borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
                    border: { width: 1, style: "solid", color: "#334155" },
                },
                confidence: 0.98,
            };
            nodes[`${mcId}_t`] = {
                id: `${mcId}_t`,
                type: "heading",
                parentId: mcId,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: { color: colors.textColor, fontSize: "15px", fontWeight: 600 },
                content: { text: t },
                confidence: 0.99,
            };
            nodes[`${mcId}_b`] = {
                id: `${mcId}_b`,
                type: "text",
                parentId: mcId,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: { color: colors.mutedColor, fontSize: "13px" },
                content: { text: "Optimized mobile layout rendered via unified IR." },
                confidence: 0.97,
            };
        });
        // Mobile Bottom Nav
        nodes[`${id}_bottom_nav`] = {
            id: `${id}_bottom_nav`,
            type: "footer",
            parentId: id,
            childIds: [`${id}_b_tab_1`, `${id}_b_tab_2`, `${id}_b_tab_3`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 60 },
            layout: { display: "flex", flexDirection: "row", justifyContent: "space-around", alignItems: "center", gap: 0, flexWrap: "nowrap" },
            styles: {
                backgroundColor: colors.surfaceBg,
                border: { width: 1, style: "solid", color: "#334155" },
            },
            confidence: 0.98,
        };
        ["Home", "Activity", "Profile"].forEach((tab, idx) => {
            nodes[`${id}_b_tab_${idx + 1}`] = {
                id: `${id}_b_tab_${idx + 1}`,
                type: "button",
                parentId: `${id}_bottom_nav`,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "auto", height: "auto" },
                layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "nowrap" },
                styles: {
                    color: idx === 0 ? colors.primaryAccent : colors.mutedColor,
                    fontSize: "12px",
                    fontWeight: 600,
                },
                content: { text: tab },
                confidence: 0.98,
            };
        });
    }
    static buildDenseMatrix(nodes, id, parentId, colors, sec) {
        nodes[id] = {
            id,
            type: "section",
            name: "Dense Pricing & Feature Matrix",
            parentId,
            childIds: [`${id}_nav`, `${id}_header`, `${id}_matrix_wrap`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-start",
                gap: 0,
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: "#0B1120",
            },
            confidence: 0.98,
        };
        // 1. Navigation Bar
        nodes[`${id}_nav`] = {
            id: `${id}_nav`,
            type: "navbar",
            name: "Dense Matrix Navigation",
            parentId: id,
            childIds: [`${id}_logo_wrap`, `${id}_nav_subtitle`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 64 },
            layout: {
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: "#0F172A",
                padding: { top: 0, right: 32, bottom: 0, left: 32 },
                border: { width: 1, style: "solid", color: "#1E293B" },
            },
            confidence: 0.99,
        };
        // Logo + Badge Wrap
        nodes[`${id}_logo_wrap`] = {
            id: `${id}_logo_wrap`,
            type: "flex",
            parentId: `${id}_nav`,
            childIds: [`${id}_logo_text`, `${id}_logo_badge`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 10, flexWrap: "nowrap" },
            styles: {},
            confidence: 0.99,
        };
        nodes[`${id}_logo_text`] = {
            id: `${id}_logo_text`,
            type: "heading",
            parentId: `${id}_logo_wrap`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: "#F8FAFC", fontSize: "18px", fontWeight: 700 },
            content: { text: "AIUI Enterprise Cloud" },
            confidence: 0.99,
        };
        nodes[`${id}_logo_badge`] = {
            id: `${id}_logo_badge`,
            type: "badge",
            parentId: `${id}_logo_wrap`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "inline-block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                color: "#3B82F6",
                fontSize: "11px",
                fontWeight: 700,
                padding: { top: 2, right: 6, bottom: 2, left: 6 },
                borderRadius: { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 },
            },
            content: { text: "PRO" },
            confidence: 0.98,
        };
        // Right side text
        nodes[`${id}_nav_subtitle`] = {
            id: `${id}_nav_subtitle`,
            type: "text",
            parentId: `${id}_nav`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: "#94A3B8", fontSize: "13px", fontWeight: 500 },
            content: { text: "Autonomous UI Pipeline Matrix" },
            confidence: 0.98,
        };
        // 2. Header Content
        nodes[`${id}_header`] = {
            id: `${id}_header`,
            type: "container",
            parentId: id,
            childIds: [`${id}_title`, `${id}_sub`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { textAlign: "center", padding: { top: 36, right: 20, bottom: 24, left: 20 } },
            confidence: 0.99,
        };
        nodes[`${id}_title`] = {
            id: `${id}_title`,
            type: "heading",
            parentId: `${id}_header`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: "#F8FAFC", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" },
            content: { text: "Compare Plans & Autonomous Capabilities" },
            confidence: 0.99,
        };
        nodes[`${id}_sub`] = {
            id: `${id}_sub`,
            type: "text",
            parentId: `${id}_header`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: "#94A3B8", fontSize: "14px" },
            content: { text: "Choose the right tier for self-healing UI synthesis and automated visual evaluation." },
            confidence: 0.98,
        };
        // 3. Matrix Wrap
        nodes[`${id}_matrix_wrap`] = {
            id: `${id}_matrix_wrap`,
            type: "container",
            parentId: id,
            childIds: [`${id}_matrix_grid`, `${id}_footnote`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", maxWidth: 1180, height: "auto" },
            layout: { display: "flex", flexDirection: "column", alignItems: "stretch", gap: 16, justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                margin: { top: 0, right: 0, bottom: 40, left: 0 },
                padding: { top: 0, right: 20, bottom: 0, left: 20 },
            },
            confidence: 0.99,
        };
        // 16 Cells Grid
        const cellIds = [];
        for (let c = 1; c <= 16; c++) {
            cellIds.push(`${id}_cell_${c}`);
        }
        nodes[`${id}_matrix_grid`] = {
            id: `${id}_matrix_grid`,
            type: "grid",
            parentId: `${id}_matrix_wrap`,
            childIds: cellIds,
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: {
                display: "grid",
                gridTemplateColumns: "260px repeat(3, 1fr)",
                gap: 0,
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: "#0F172A",
                border: { width: 1, style: "solid", color: "#1E293B" },
                borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
            },
            confidence: 0.98,
        };
        // Cell Definitions (16 cells with rich children)
        const cellsData = [
            // Row 1: Headers
            { idNum: 1, isHeader: true, title: "Platform Capabilities" },
            { idNum: 2, title: "Starter", price: "$29 / mo" },
            { idNum: 3, title: "Professional", price: "$99 / mo", pill: "Popular", featured: true },
            { idNum: 4, title: "Enterprise", price: "$299 / mo" },
            // Row 2: Target Frameworks
            { idNum: 5, isHeader: true, title: "Multi-Target Generators" },
            { idNum: 6, pill: "React 19" },
            { idNum: 7, pill: "React + Vanilla JS", featured: true },
            { idNum: 8, pill: "React + JS + Flutter" },
            // Row 3: Evaluation
            { idNum: 9, isHeader: true, title: "MSSIM + PixelMatch CV" },
            { idNum: 10, text: "✓ Standard (5 iter)" },
            { idNum: 11, text: "✓ Subpixel Gaussian", featured: true },
            { idNum: 12, text: "✓ Ultra-HD Bounding Box" },
            // Row 4: CTAs
            { idNum: 13, isHeader: true, title: "Selection" },
            { idNum: 14, btnText: "Choose Starter", btnType: "secondary" },
            { idNum: 15, btnText: "Upgrade Pro", btnType: "primary", featured: true },
            { idNum: 16, btnText: "Contact Sales", btnType: "secondary" },
        ];
        cellsData.forEach((cd) => {
            const cId = `${id}_cell_${cd.idNum}`;
            const childList = [];
            if (cd.title) {
                const tId = `${cId}_title`;
                childList.push(tId);
                nodes[tId] = {
                    id: tId,
                    type: "heading",
                    parentId: cId,
                    childIds: [],
                    position: { x: 0, y: 0, relativeTo: "flow" },
                    dimensions: { width: "auto", height: "auto" },
                    layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                    styles: { color: "#F8FAFC", fontSize: cd.isHeader ? "14px" : "16px", fontWeight: 700 },
                    content: { text: cd.title },
                    confidence: 0.98,
                };
            }
            if (cd.price) {
                const pId = `${cId}_price`;
                childList.push(pId);
                nodes[pId] = {
                    id: pId,
                    type: "heading",
                    parentId: cId,
                    childIds: [],
                    position: { x: 0, y: 0, relativeTo: "flow" },
                    dimensions: { width: "auto", height: "auto" },
                    layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                    styles: { color: "#3B82F6", fontSize: "22px", fontWeight: 800 },
                    content: { text: cd.price },
                    confidence: 0.98,
                };
            }
            if (cd.pill) {
                const plId = `${cId}_pill`;
                childList.push(plId);
                nodes[plId] = {
                    id: plId,
                    type: "badge",
                    parentId: cId,
                    childIds: [],
                    position: { x: 0, y: 0, relativeTo: "flow" },
                    dimensions: { width: "auto", height: "auto" },
                    layout: { display: "inline-block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                    styles: {
                        backgroundColor: cd.featured ? "rgba(59, 130, 246, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: cd.featured ? "#3B82F6" : "#10B981",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: { top: 3, right: 8, bottom: 3, left: 8 },
                        borderRadius: { topLeft: 9999, topRight: 9999, bottomRight: 9999, bottomLeft: 9999 },
                    },
                    content: { text: cd.pill },
                    confidence: 0.98,
                };
            }
            if (cd.text) {
                const txId = `${cId}_txt`;
                childList.push(txId);
                nodes[txId] = {
                    id: txId,
                    type: "text",
                    parentId: cId,
                    childIds: [],
                    position: { x: 0, y: 0, relativeTo: "flow" },
                    dimensions: { width: "auto", height: "auto" },
                    layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                    styles: { color: "#10B981", fontSize: "13px", fontWeight: 600 },
                    content: { text: cd.text },
                    confidence: 0.98,
                };
            }
            if (cd.btnText) {
                const bId = `${cId}_btn`;
                childList.push(bId);
                nodes[bId] = {
                    id: bId,
                    type: "button",
                    parentId: cId,
                    childIds: [],
                    position: { x: 0, y: 0, relativeTo: "flow" },
                    dimensions: { width: "100%", height: 38 },
                    layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
                    styles: {
                        backgroundColor: cd.btnType === "primary" ? "#3B82F6" : "#1E293B",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 600,
                        padding: { top: 8, right: 12, bottom: 8, left: 12 },
                        borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
                    },
                    content: { text: cd.btnText },
                    confidence: 0.98,
                };
            }
            nodes[cId] = {
                id: cId,
                type: "card",
                parentId: `${id}_matrix_grid`,
                childIds: childList,
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 4, flexWrap: "nowrap" },
                styles: {
                    backgroundColor: cd.isHeader ? "#131D33" : cd.featured ? "rgba(59, 130, 246, 0.06)" : "#0F172A",
                    padding: { top: 14, right: 18, bottom: 14, left: 18 },
                    border: { width: 1, style: "solid", color: "#1E293B" },
                    color: "#F8FAFC",
                    fontSize: "13px",
                },
                confidence: 0.98,
            };
        });
        // 4. Footnote
        nodes[`${id}_footnote`] = {
            id: `${id}_footnote`,
            type: "text",
            parentId: `${id}_matrix_wrap`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: "#64748B", fontSize: "12px", textAlign: "center" },
            content: { text: "All tiers include process-level sandboxed execution and automated regression rollback." },
            confidence: 0.97,
        };
    }
}
//# sourceMappingURL=cvExtractor.js.map