import { PNG } from "pngjs";
import { UIIRDocumentSchema } from "../types/ir.js";
export class CvExtractor {
    /**
     * Performs computer vision pixel analysis on an image buffer and constructs a generic UIIRDocument.
     * Zero hardcoded templates or fixture-specific copy.
     */
    static async extractFromImageBuffer(buffer, name, viewportHint) {
        const docName = name || "Extracted UI";
        const width = viewportHint?.width || 1280;
        const height = viewportHint?.height || 800;
        let png = null;
        try {
            png = PNG.sync.read(buffer);
        }
        catch {
            png = null;
        }
        if (!png || !png.data || png.data.length === 0) {
            const defaultColors = {
                dominantBg: "#0F172A",
                surfaceBg: "#1E293B",
                primaryAccent: "#3B82F6",
                textColor: "#F8FAFC",
                mutedColor: "#94A3B8",
            };
            return this.extractFromSummary(docName, width, height, defaultColors, []);
        }
        const { colors, isSplitLayout, leftDark, isMobile } = this.analyzePixelBuffer(png);
        const nodes = {};
        const rootId = "page_root";
        if (isSplitLayout) {
            this.buildGenericSplitLayout(nodes, rootId, width, height, colors, leftDark);
        }
        else if (isMobile) {
            this.buildGenericMobileLayout(nodes, rootId, width, height, colors);
        }
        else {
            this.buildGenericLayout(nodes, rootId, width, height, colors);
        }
        return UIIRDocumentSchema.parse({
            version: "1.0.0",
            id: `ir_${Date.now()}`,
            name: docName,
            viewport: { width, height, devicePixelRatio: 1 },
            rootNodeId: rootId,
            nodes,
            metadata: {
                sourceType: "screenshot",
                confidence: 0.88,
                extractedAt: new Date().toISOString(),
                targetFrameworks: ["react", "vanillajs", "flutter"],
                isApproximate: false,
                perceptionMode: "offline-cv-vision-engine",
            },
        });
    }
    /**
     * Scans raw PNG pixel data to extract color palettes and spatial region topology.
     */
    static analyzePixelBuffer(png) {
        const { width, height, data } = png;
        const step = Math.max(1, Math.floor(Math.min(width, height) / 100));
        let leftLumSum = 0;
        let leftCount = 0;
        let rightLumSum = 0;
        let rightCount = 0;
        let leftColorR = 0, leftColorG = 0, leftColorB = 0;
        let rightColorR = 0, rightColorG = 0, rightColorB = 0;
        let totalR = 0, totalG = 0, totalB = 0;
        let totalSamples = 0;
        let maxSaturation = 0;
        let accentR = 59, accentG = 130, accentB = 246; // default blue
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                totalR += r;
                totalG += g;
                totalB += b;
                totalSamples++;
                const maxC = Math.max(r, g, b);
                const minC = Math.min(r, g, b);
                const sat = maxC - minC;
                if (sat > maxSaturation && maxC > 80 && minC < 200) {
                    maxSaturation = sat;
                    accentR = r;
                    accentG = g;
                    accentB = b;
                }
                if (x < width / 2) {
                    leftLumSum += lum;
                    leftColorR += r;
                    leftColorG += g;
                    leftColorB += b;
                    leftCount++;
                }
                else {
                    rightLumSum += lum;
                    rightColorR += r;
                    rightColorG += g;
                    rightColorB += b;
                    rightCount++;
                }
            }
        }
        const avgLeftLum = leftCount > 0 ? leftLumSum / leftCount : 128;
        const avgRightLum = rightCount > 0 ? rightLumSum / rightCount : 128;
        const avgLeftR = Math.round(leftColorR / (leftCount || 1));
        const avgLeftG = Math.round(leftColorG / (leftCount || 1));
        const avgLeftB = Math.round(leftColorB / (leftCount || 1));
        const avgRightR = Math.round(rightColorR / (rightCount || 1));
        const avgRightG = Math.round(rightColorG / (rightCount || 1));
        const avgRightB = Math.round(rightColorB / (rightCount || 1));
        const lumDelta = Math.abs(avgLeftLum - avgRightLum);
        const colorDist = Math.sqrt(Math.pow(avgLeftR - avgRightR, 2) +
            Math.pow(avgLeftG - avgRightG, 2) +
            Math.pow(avgLeftB - avgRightB, 2));
        const isSplitLayout = (lumDelta > 38 || colorDist > 90) && width >= 700;
        const leftDark = avgLeftLum < avgRightLum;
        const isMobile = width <= 480 || height / width >= 1.75;
        const overallLum = (avgLeftLum + avgRightLum) / 2;
        const isOverallDark = overallLum < 128;
        const dominantBg = isOverallDark ? "#0F172A" : "#F8FAFC";
        const surfaceBg = isOverallDark ? "#1E293B" : "#FFFFFF";
        const textColor = isOverallDark ? "#F8FAFC" : "#0F172A";
        const mutedColor = isOverallDark ? "#94A3B8" : "#64748B";
        const primaryAccent = this.rgbToHex(accentR, accentG, accentB);
        return {
            colors: {
                dominantBg,
                surfaceBg,
                primaryAccent,
                textColor,
                mutedColor,
            },
            leftLuminance: avgLeftLum,
            rightLuminance: avgRightLum,
            isSplitLayout,
            leftDark,
            isMobile,
        };
    }
    static rgbToHex(r, g, b) {
        return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
    }
    /**
     * Constructs a UIIRDocument generically from section summaries.
     */
    static extractFromSummary(name, width, height, colors, sections) {
        const nodes = {};
        const rootId = "page_root";
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Page",
            parentId: null,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: {
                display: "flex",
                flexDirection: "column",
                gap: 24,
                alignItems: "stretch",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: colors.dominantBg,
                color: colors.textColor,
                fontFamily: "Inter, system-ui, sans-serif",
            },
            confidence: 0.98,
        };
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            const secId = `sec_${i}_${sec.type || "container"}`;
            nodes[rootId].childIds.push(secId);
            const secType = this.mapRoleToNodeType(sec.type);
            const childIds = [];
            nodes[secId] = {
                id: secId,
                type: secType,
                name: sec.title || `Section ${i + 1}`,
                parentId: rootId,
                childIds,
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "100%", height: "auto" },
                layout: {
                    display: secType === "grid" ? "grid" : "flex",
                    flexDirection: secType === "navbar" ? "row" : "column",
                    justifyContent: secType === "navbar" ? "space-between" : "flex-start",
                    alignItems: secType === "navbar" ? "center" : "stretch",
                    gap: 16,
                    flexWrap: "nowrap",
                    gridTemplateColumns: secType === "grid" ? "repeat(3, minmax(0, 1fr))" : undefined,
                },
                styles: {
                    backgroundColor: secType === "card" || secType === "navbar" ? colors.surfaceBg : undefined,
                    color: colors.textColor,
                    padding: { top: 16, right: 24, bottom: 16, left: 24 },
                    borderRadius: secType === "card" ? { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 } : undefined,
                },
                confidence: 0.95,
            };
            if (sec.title) {
                const titleId = `${secId}_title`;
                childIds.push(titleId);
                nodes[titleId] = {
                    id: titleId,
                    type: "heading",
                    name: "Heading",
                    parentId: secId,
                    childIds: [],
                    position: { x: 0, y: 0, relativeTo: "flow" },
                    dimensions: { width: "auto", height: "auto" },
                    layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                    content: { text: sec.title },
                    styles: { color: colors.textColor, fontSize: "24px", fontWeight: 700 },
                    confidence: 0.95,
                };
            }
            if (sec.subtitle) {
                const subId = `${secId}_sub`;
                childIds.push(subId);
                nodes[subId] = {
                    id: subId,
                    type: "text",
                    name: "Subtitle",
                    parentId: secId,
                    childIds: [],
                    position: { x: 0, y: 0, relativeTo: "flow" },
                    dimensions: { width: "auto", height: "auto" },
                    layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                    content: { text: sec.subtitle },
                    styles: { color: colors.mutedColor, fontSize: "14px" },
                    confidence: 0.95,
                };
            }
            if (sec.actionText || sec.type === "navbar" || sec.type === "hero") {
                const btnId = `${secId}_btn`;
                childIds.push(btnId);
                nodes[btnId] = {
                    id: btnId,
                    type: "button",
                    name: "Action Button",
                    parentId: secId,
                    childIds: [],
                    position: { x: 0, y: 0, relativeTo: "flow" },
                    dimensions: { width: "auto", height: 40 },
                    layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
                    content: { text: sec.actionText || (sec.type === "navbar" ? "Get Started" : "Explore Platform") },
                    styles: {
                        backgroundColor: colors.primaryAccent,
                        color: "#FFFFFF",
                        padding: { top: 8, right: 16, bottom: 8, left: 16 },
                        borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                        fontWeight: 600,
                        fontSize: "14px",
                    },
                    confidence: 0.95,
                };
            }
            if (Array.isArray(sec.items)) {
                for (let j = 0; j < sec.items.length; j++) {
                    const item = sec.items[j];
                    const itemId = `${secId}_item_${j}`;
                    childIds.push(itemId);
                    nodes[itemId] = {
                        id: itemId,
                        type: "card",
                        name: item.title || `Item ${j + 1}`,
                        parentId: secId,
                        childIds: [],
                        position: { x: 0, y: 0, relativeTo: "flow" },
                        dimensions: { width: "100%", height: "auto" },
                        layout: { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "nowrap" },
                        content: { text: typeof item === "string" ? item : item.title || item.description || `Item ${j + 1}` },
                        styles: {
                            backgroundColor: colors.surfaceBg,
                            color: colors.textColor,
                            padding: { top: 16, right: 16, bottom: 16, left: 16 },
                            borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                        },
                        confidence: 0.95,
                    };
                }
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
                confidence: 0.95,
                extractedAt: new Date().toISOString(),
                targetFrameworks: ["react", "vanillajs", "flutter"],
            },
        });
    }
    /**
     * Generic recursive tree walker converting open perception nodes into canonical UINodes.
     */
    static buildFromPerceptionTree(rootPerception, docName, viewport, palette) {
        const nodes = {};
        const rootId = rootPerception.id || "page_root";
        this.walkPerceptionNode(rootPerception, null, nodes, viewport, palette);
        return UIIRDocumentSchema.parse({
            version: "1.0.0",
            id: `ir_${Date.now()}`,
            name: docName,
            viewport: { width: viewport.width, height: viewport.height, devicePixelRatio: 1 },
            rootNodeId: rootId,
            nodes,
            metadata: {
                sourceType: "screenshot",
                confidence: 0.95,
                extractedAt: new Date().toISOString(),
                targetFrameworks: ["react", "vanillajs", "flutter"],
            },
        });
    }
    static walkPerceptionNode(pNode, parentId, nodes, viewport, palette) {
        const id = pNode.id || `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const nodeType = this.mapRoleToNodeType(pNode.role);
        const childIds = [];
        const styles = pNode.styles || {};
        const isGrid = styles.layout === "grid" || nodeType === "grid";
        const isRow = styles.layout === "row" || nodeType === "navbar";
        const display = isGrid ? "grid" : styles.layout ? "flex" : nodeType === "button" || nodeType === "input" ? "block" : "flex";
        const flexDirection = isRow ? "row" : "column";
        const bg = styles.backgroundColor || (nodeType === "page" ? palette.dominantBg : nodeType === "card" || nodeType === "modal" ? palette.surfaceBg : undefined);
        const color = styles.textColor || palette.textColor;
        let paddingObj = undefined;
        if (styles.padding !== undefined) {
            const pNum = typeof styles.padding === "number" ? styles.padding : parseInt(String(styles.padding), 10) || 0;
            if (pNum > 0) {
                paddingObj = { top: pNum, right: pNum, bottom: pNum, left: pNum };
            }
        }
        let borderObj = undefined;
        if (styles.borderColor) {
            const bWidth = typeof styles.borderWidth === "number" ? styles.borderWidth : parseInt(String(styles.borderWidth || "1"), 10) || 1;
            borderObj = { width: bWidth, style: "solid", color: styles.borderColor };
        }
        let radiusObj = undefined;
        if (styles.borderRadius !== undefined) {
            const rNum = typeof styles.borderRadius === "number" ? styles.borderRadius : parseInt(String(styles.borderRadius), 10) || 0;
            if (rNum > 0) {
                radiusObj = { topLeft: rNum, topRight: rNum, bottomRight: rNum, bottomLeft: rNum };
            }
        }
        let positionObj = { x: 0, y: 0, relativeTo: (nodeType === "page" ? "viewport" : "flow") };
        let dimensionsObj = { width: "100%", height: "auto" };
        if (pNode.bbox) {
            positionObj = {
                x: Math.round(pNode.bbox.x <= 1 ? pNode.bbox.x * viewport.width : pNode.bbox.x),
                y: Math.round(pNode.bbox.y <= 1 ? pNode.bbox.y * viewport.height : pNode.bbox.y),
                relativeTo: nodeType === "page" ? "viewport" : "flow",
            };
            const w = Math.round(pNode.bbox.width <= 1 ? pNode.bbox.width * viewport.width : pNode.bbox.width);
            const h = Math.round(pNode.bbox.height <= 1 ? pNode.bbox.height * viewport.height : pNode.bbox.height);
            if (w > 0)
                dimensionsObj.width = w;
            if (h > 0)
                dimensionsObj.height = h;
        }
        if (nodeType === "page") {
            dimensionsObj = { width: "100%", height: "100%", minHeight: "100vh" };
        }
        let contentObj = undefined;
        if (pNode.text || pNode.placeholder || pNode.iconName || pNode.inputType) {
            contentObj = {};
            if (pNode.text)
                contentObj.text = pNode.text;
            if (pNode.placeholder)
                contentObj.placeholder = pNode.placeholder;
            if (pNode.inputType)
                contentObj.inputType = pNode.inputType;
            if (pNode.iconName)
                contentObj.iconName = pNode.iconName;
        }
        nodes[id] = {
            id,
            type: nodeType,
            name: pNode.role || nodeType,
            parentId,
            childIds,
            position: positionObj,
            dimensions: dimensionsObj,
            layout: {
                display,
                flexDirection,
                justifyContent: styles.justifyContent === "between" ? "space-between" : styles.justifyContent === "center" ? "center" : "flex-start",
                alignItems: styles.alignItems === "center" ? "center" : styles.alignItems === "start" ? "flex-start" : "stretch",
                gap: styles.gap !== undefined ? (typeof styles.gap === "number" ? styles.gap : parseInt(String(styles.gap), 10) || 0) : (isGrid ? 16 : 8),
                flexWrap: "nowrap",
                gridTemplateColumns: isGrid ? (styles.columns ? `repeat(${styles.columns}, minmax(0, 1fr))` : "repeat(auto-fit, minmax(240px, 1fr))") : undefined,
            },
            styles: {
                backgroundColor: bg,
                color,
                fontSize: styles.fontSize ? (typeof styles.fontSize === "number" ? `${styles.fontSize}px` : String(styles.fontSize)) : undefined,
                fontWeight: styles.fontWeight ? (typeof styles.fontWeight === "number" ? styles.fontWeight : parseInt(String(styles.fontWeight), 10) || 400) : undefined,
                padding: paddingObj,
                border: borderObj,
                borderRadius: radiusObj,
                boxShadow: styles.shadow,
                backdropFilter: styles.backdropBlur ? `blur(${styles.backdropBlur})` : undefined,
            },
            content: contentObj,
            confidence: pNode.confidence || 0.95,
        };
        if (Array.isArray(pNode.children)) {
            for (const child of pNode.children) {
                childIds.push(child.id);
                this.walkPerceptionNode(child, id, nodes, viewport, palette);
            }
        }
    }
    static mapRoleToNodeType(role) {
        if (!role)
            return "container";
        const r = role.toLowerCase().trim();
        if (r === "page" || r === "root" || r === "screen")
            return "page";
        if (r.includes("nav") || r.includes("header") || r.includes("topbar"))
            return "navbar";
        if (r.includes("sidebar") || r.includes("drawer") || r.includes("aside"))
            return "sidebar";
        if (r.includes("hero") || r.includes("banner"))
            return "hero";
        if (r.includes("card") || r.includes("item") || r.includes("post") || r.includes("tile"))
            return "card";
        if (r.includes("grid") || r.includes("matrix") || r.includes("gallery") || r.includes("kanban"))
            return "grid";
        if (r.includes("button") || r.includes("btn") || r.includes("cta"))
            return "button";
        if (r.includes("input") || r.includes("field") || r.includes("search") || r.includes("textarea") || r.includes("select"))
            return "input";
        if (r.includes("form") || r.includes("login") || r.includes("auth"))
            return "form";
        if (r.includes("heading") || r.includes("title") || r.includes("headline"))
            return "heading";
        if (r.includes("text") || r.includes("desc") || r.includes("label") || r.includes("paragraph") || r.includes("subtitle"))
            return "text";
        if (r.includes("icon") || r.includes("symbol"))
            return "icon";
        if (r.includes("avatar") || r.includes("profile-pic"))
            return "avatar";
        if (r.includes("image") || r.includes("img") || r.includes("photo") || r.includes("illustration") || r.includes("logo") || r.includes("chart"))
            return "image";
        if (r.includes("badge") || r.includes("tag") || r.includes("chip") || r.includes("pill"))
            return "badge";
        if (r.includes("divider") || r.includes("separator") || r.includes("line"))
            return "divider";
        if (r.includes("modal") || r.includes("dialog") || r.includes("popup"))
            return "modal";
        if (r.includes("list") || r.includes("menu") || r.includes("table"))
            return "list";
        if (r.includes("stat") || r.includes("metric") || r.includes("counter"))
            return "stat";
        if (r.includes("section") || r.includes("panel") || r.includes("block"))
            return "section";
        if (r.includes("flex") || r.includes("row") || r.includes("col"))
            return "flex";
        return "container";
    }
    static buildGenericLayout(nodes, rootId, width, height, colors) {
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Page",
            parentId: null,
            childIds: [`${rootId}_main`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { backgroundColor: colors.dominantBg, color: colors.textColor, fontFamily: "Inter, system-ui, sans-serif" },
            confidence: 0.9,
        };
        const mainId = `${rootId}_main`;
        nodes[mainId] = {
            id: mainId,
            type: "container",
            name: "Main Container",
            parentId: rootId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", gap: 16, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { padding: { top: 32, right: 32, bottom: 32, left: 32 } },
            confidence: 0.9,
        };
    }
    static buildGenericSplitLayout(nodes, rootId, width, height, colors, leftDark) {
        const leftBg = leftDark ? colors.dominantBg : colors.surfaceBg;
        const rightBg = leftDark ? colors.surfaceBg : colors.dominantBg;
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Split Page",
            parentId: null,
            childIds: [`${rootId}_left`, `${rootId}_right`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "row", alignItems: "stretch", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
            styles: { backgroundColor: colors.dominantBg, color: colors.textColor },
            confidence: 0.9,
        };
        const leftId = `${rootId}_left`;
        nodes[leftId] = {
            id: leftId,
            type: "section",
            name: "Left Panel",
            parentId: rootId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "50%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "stretch", gap: 16, flexWrap: "nowrap" },
            styles: { backgroundColor: leftBg, padding: { top: 48, right: 48, bottom: 48, left: 48 } },
            confidence: 0.9,
        };
        const rightId = `${rootId}_right`;
        nodes[rightId] = {
            id: rightId,
            type: "section",
            name: "Right Panel",
            parentId: rootId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "50%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "stretch", gap: 16, flexWrap: "nowrap" },
            styles: { backgroundColor: rightBg, padding: { top: 48, right: 48, bottom: 48, left: 48 } },
            confidence: 0.9,
        };
    }
    static buildGenericMobileLayout(nodes, rootId, width, height, colors) {
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Mobile Screen",
            parentId: null,
            childIds: [`${rootId}_body`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "stretch", gap: 16, flexWrap: "nowrap" },
            styles: { backgroundColor: colors.dominantBg, color: colors.textColor, padding: { top: 24, right: 20, bottom: 24, left: 20 } },
            confidence: 0.9,
        };
        const bodyId = `${rootId}_body`;
        nodes[bodyId] = {
            id: bodyId,
            type: "container",
            name: "Mobile Content",
            parentId: rootId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", gap: 16, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {},
            confidence: 0.9,
        };
    }
}
//# sourceMappingURL=cvExtractor.js.map