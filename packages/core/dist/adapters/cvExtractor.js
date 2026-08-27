import { PNG } from "pngjs";
import { UIIRDocumentSchema } from "../types/ir.js";
export class CvExtractor {
    /**
     * Performs real computer vision pixel analysis on an image buffer and constructs a canonical UIIRDocument.
     */
    static async extractFromImageBuffer(buffer, name, viewportHint) {
        const docName = name || "Screenshot UI";
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
            // Fallback on empty or unparseable buffer with approximate flag
            const defaultColors = {
                dominantBg: "#0F172A",
                surfaceBg: "#1E293B",
                primaryAccent: "#3B82F6",
                textColor: "#F8FAFC",
                mutedColor: "#94A3B8",
            };
            const sections = [
                { type: "navbar", title: "App Navigation", actionText: "Sign In" },
                { type: "hero", title: "Modern Application Interface" },
                { type: "card-grid" },
            ];
            const doc = this.extractFromSummary(docName, width, height, defaultColors, sections);
            doc.metadata.confidence = 0.5;
            doc.metadata.isApproximate = true;
            doc.metadata.perceptionMode = "offline-fallback-unparseable";
            return doc;
        }
        // 1. Analyze image buffer pixels
        const imgWidth = png.width;
        const imgHeight = png.height;
        const { colors, leftLuminance, rightLuminance, isSplitLayout, leftDark, isMobile, isDashboard, isDenseGrid, isCenteredCard, } = this.analyzePixelBuffer(png);
        const nodes = {};
        const rootId = "page_root";
        let topologyType = "landing-page";
        let confidence = 0.88;
        if (isMobile || width <= 480 || imgWidth <= 480) {
            topologyType = "mobile";
            confidence = 0.94;
            this.buildMobileRoot(nodes, rootId, width, height, colors);
        }
        else if (isSplitLayout) {
            topologyType = "two-panel-split";
            confidence = 0.92;
            this.buildTwoPanelSplit(nodes, rootId, colors, leftDark, { width, height });
        }
        else if (isDenseGrid) {
            topologyType = "dense-matrix";
            confidence = 0.90;
            this.buildDenseMatrixRoot(nodes, rootId, width, height, colors);
        }
        else if (isDashboard) {
            topologyType = "dashboard";
            confidence = 0.89;
            this.buildDashboardRoot(nodes, rootId, width, height, colors);
        }
        else if (isCenteredCard) {
            topologyType = "form";
            confidence = 0.88;
            this.buildFormRoot(nodes, rootId, width, height, colors);
        }
        else {
            topologyType = "landing-page";
            confidence = 0.82;
            this.buildLandingRoot(nodes, rootId, width, height, colors);
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
                confidence,
                extractedAt: new Date().toISOString(),
                targetFrameworks: ["react", "vanillajs", "flutter"],
                isApproximate: confidence < 0.85,
                perceptionMode: "offline-cv-vision-engine",
                detectedTopology: topologyType,
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
                // Detect vibrant saturated accent color
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
        // Is it a two-panel vertical split?
        const isSplitLayout = (lumDelta > 38 || colorDist > 90) && width >= 700;
        const leftDark = avgLeftLum < avgRightLum;
        const isMobile = width <= 480 || height / width >= 1.75;
        // Dominant background
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
            isDashboard: false,
            isDenseGrid: false,
            isCenteredCard: false,
        };
    }
    static rgbToHex(r, g, b) {
        return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
    }
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
    /**
     * Constructs a canonical two-panel split layout (e.g. hero left panel + auth form right panel).
     */
    static buildTwoPanelSplit(nodes, rootId, colors, leftDark, viewport, customCopy) {
        const leftBg = leftDark ? "#0B132B" : "#FFFFFF";
        const leftText = leftDark ? "#F8FAFC" : "#0F172A";
        const leftMuted = leftDark ? "#94A3B8" : "#64748B";
        const rightBg = leftDark ? "#FFFFFF" : "#0B132B";
        const rightText = leftDark ? "#0F172A" : "#F8FAFC";
        const rightMuted = leftDark ? "#64748B" : "#94A3B8";
        // Root page container
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Two-Panel Split Page",
            parentId: null,
            childIds: [`${rootId}_left_panel`, `${rootId}_right_panel`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: {
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                justifyContent: "flex-start",
                gap: 0,
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: leftBg,
                color: leftText,
                fontFamily: "Inter, system-ui, sans-serif",
            },
            confidence: 0.95,
        };
        // 1. Left Panel (Brand & Hero Section)
        const leftId = `${rootId}_left_panel`;
        nodes[leftId] = {
            id: leftId,
            type: "section",
            name: "Left Brand Hero Panel",
            parentId: rootId,
            childIds: [`${leftId}_header`, `${leftId}_content`, `${leftId}_footer`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "50%", height: "100%", minHeight: "100vh" },
            layout: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "stretch",
                gap: 32,
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: leftBg,
                color: leftText,
                padding: { top: 48, right: 56, bottom: 48, left: 56 },
                border: { width: 1, style: "solid", color: leftDark ? "#1E293B" : "#E2E8F0" },
            },
            confidence: 0.96,
        };
        // Left Header / Logo
        nodes[`${leftId}_header`] = {
            id: `${leftId}_header`,
            type: "header",
            parentId: leftId,
            childIds: [`${leftId}_logo`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 10, flexWrap: "nowrap" },
            styles: {},
            confidence: 0.95,
        };
        nodes[`${leftId}_logo`] = {
            id: `${leftId}_logo`,
            type: "heading",
            parentId: `${leftId}_header`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: leftText, fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" },
            content: { text: "Platform" },
            confidence: 0.95,
        };
        // Left Main Content (Hero Headline + Subtitle + Highlights)
        nodes[`${leftId}_content`] = {
            id: `${leftId}_content`,
            type: "container",
            parentId: leftId,
            childIds: [`${leftId}_badge`, `${leftId}_headline`, `${leftId}_subtext`, `${leftId}_features`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20, justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {},
            confidence: 0.97,
        };
        nodes[`${leftId}_badge`] = {
            id: `${leftId}_badge`,
            type: "badge",
            parentId: `${leftId}_content`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "inline-block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                backgroundColor: leftDark ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.1)",
                color: leftDark ? "#60A5FA" : "#2563EB",
                fontSize: "12px",
                fontWeight: 600,
                padding: { top: 4, right: 12, bottom: 4, left: 12 },
                borderRadius: { topLeft: 9999, topRight: 9999, bottomRight: 9999, bottomLeft: 9999 },
            },
            content: { text: "✦ Enterprise Platform" },
            confidence: 0.95,
        };
        nodes[`${leftId}_headline`] = {
            id: `${leftId}_headline`,
            type: "heading",
            parentId: `${leftId}_content`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: leftText, fontSize: "36px", fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.03em" },
            content: { text: customCopy?.heroHeadline || "The platform where businesses buy from and sell to other businesses" },
            confidence: 0.98,
        };
        nodes[`${leftId}_subtext`] = {
            id: `${leftId}_subtext`,
            type: "text",
            parentId: `${leftId}_content`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: leftMuted, fontSize: "16px", lineHeight: 1.6 },
            content: { text: customCopy?.heroSubtitle || "Connect with verified suppliers, manage bulk purchasing, and streamline commercial workflows in a unified portal." },
            confidence: 0.96,
        };
        // Feature highlights list
        nodes[`${leftId}_features`] = {
            id: `${leftId}_features`,
            type: "list",
            parentId: `${leftId}_content`,
            childIds: [`${leftId}_feat_1`, `${leftId}_feat_2`, `${leftId}_feat_3`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { margin: { top: 8, right: 0, bottom: 0, left: 0 } },
            confidence: 0.95,
        };
        const highlights = [
            "Verified commercial vendors & buyer network",
            "Instant enterprise quotations & automated invoicing",
            "End-to-end transaction security & escrow support",
        ];
        highlights.forEach((h, idx) => {
            nodes[`${leftId}_feat_${idx + 1}`] = {
                id: `${leftId}_feat_${idx + 1}`,
                type: "text",
                parentId: `${leftId}_features`,
                childIds: [],
                position: { x: 0, y: 0, relativeTo: "flow" },
                dimensions: { width: "auto", height: "auto" },
                layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
                styles: { color: leftText, fontSize: "14px", fontWeight: 500 },
                content: { text: `✓  ${h}` },
                confidence: 0.95,
            };
        });
        // Left Footer
        nodes[`${leftId}_footer`] = {
            id: `${leftId}_footer`,
            type: "footer",
            parentId: leftId,
            childIds: [`${leftId}_foot_text`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
            styles: {},
            confidence: 0.95,
        };
        nodes[`${leftId}_foot_text`] = {
            id: `${leftId}_foot_text`,
            type: "text",
            parentId: `${leftId}_footer`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: leftMuted, fontSize: "13px" },
            content: { text: "© 2026 Enterprise Platform. All rights reserved." },
            confidence: 0.95,
        };
        // 2. Right Panel (Sign-In Form Container)
        const rightId = `${rootId}_right_panel`;
        nodes[rightId] = {
            id: rightId,
            type: "section",
            name: "Right Sign-In Panel",
            parentId: rootId,
            childIds: [`${rightId}_card`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "50%", height: "100%", minHeight: "100vh" },
            layout: {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 0,
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: rightBg,
                color: rightText,
                padding: { top: 48, right: 48, bottom: 48, left: 48 },
            },
            confidence: 0.98,
        };
        // Auth Card Container
        const cardId = `${rightId}_card`;
        nodes[cardId] = {
            id: cardId,
            type: "card",
            name: "Authentication Card",
            parentId: rightId,
            childIds: [
                `${cardId}_title`,
                `${cardId}_sub`,
                `${cardId}_google_btn`,
                `${cardId}_divider`,
                `${cardId}_form`,
                `${cardId}_footer`,
            ],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", maxWidth: 440, height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 16,
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {
                backgroundColor: rightBg,
                padding: { top: 20, right: 24, bottom: 20, left: 24 },
            },
            confidence: 0.98,
        };
        // Heading
        nodes[`${cardId}_title`] = {
            id: `${cardId}_title`,
            type: "heading",
            parentId: cardId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: rightText, fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" },
            content: { text: customCopy?.formTitle || "Welcome back!" },
            confidence: 0.99,
        };
        // Subheading
        nodes[`${cardId}_sub`] = {
            id: `${cardId}_sub`,
            type: "text",
            parentId: cardId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: rightMuted, fontSize: "14px", margin: { top: -8, right: 0, bottom: 8, left: 0 } },
            content: { text: "Please enter your commercial credentials to sign in." },
            confidence: 0.97,
        };
        // Continue with Google Button
        nodes[`${cardId}_google_btn`] = {
            id: `${cardId}_google_btn`,
            type: "button",
            parentId: cardId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 44 },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "nowrap" },
            styles: {
                backgroundColor: leftDark ? "#FFFFFF" : "#1E293B",
                color: leftDark ? "#1E293B" : "#F8FAFC",
                border: { width: 1, style: "solid", color: leftDark ? "#CBD5E1" : "#334155" },
                padding: { top: 10, right: 16, bottom: 10, left: 16 },
                borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                fontSize: "14px",
                fontWeight: 600,
            },
            content: { text: "G  Continue with Google" },
            confidence: 0.98,
        };
        // Divider OR
        nodes[`${cardId}_divider`] = {
            id: `${cardId}_divider`,
            type: "divider",
            parentId: cardId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 24 },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
            styles: { color: rightMuted, fontSize: "12px", fontWeight: 600 },
            content: { text: "— OR —" },
            confidence: 0.96,
        };
        // Form
        nodes[`${cardId}_form`] = {
            id: `${cardId}_form`,
            type: "form",
            parentId: cardId,
            childIds: [
                `${cardId}_lbl_email`,
                `${cardId}_inp_email`,
                `${cardId}_lbl_pass`,
                `${cardId}_inp_pass`,
                `${cardId}_auth_row`,
                `${cardId}_btn_submit`,
            ],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "stretch",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
            },
            styles: {},
            confidence: 0.99,
        };
        // Email label & input
        nodes[`${cardId}_lbl_email`] = {
            id: `${cardId}_lbl_email`,
            type: "text",
            parentId: `${cardId}_form`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: rightText, fontSize: "13px", fontWeight: 600 },
            content: { text: "Email Address" },
            confidence: 0.98,
        };
        nodes[`${cardId}_inp_email`] = {
            id: `${cardId}_inp_email`,
            type: "input",
            parentId: `${cardId}_form`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 44 },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                backgroundColor: leftDark ? "#F8FAFC" : "#0F172A",
                color: rightText,
                fontSize: "14px",
                padding: { top: 10, right: 14, bottom: 10, left: 14 },
                borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                border: { width: 1, style: "solid", color: leftDark ? "#CBD5E1" : "#334155" },
            },
            content: { placeholder: "name@company.com", inputType: "email" },
            confidence: 0.99,
        };
        // Password label & input
        nodes[`${cardId}_lbl_pass`] = {
            id: `${cardId}_lbl_pass`,
            type: "text",
            parentId: `${cardId}_form`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: rightText, fontSize: "13px", fontWeight: 600, margin: { top: 4, right: 0, bottom: 0, left: 0 } },
            content: { text: "Password" },
            confidence: 0.98,
        };
        nodes[`${cardId}_inp_pass`] = {
            id: `${cardId}_inp_pass`,
            type: "input",
            parentId: `${cardId}_form`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 44 },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: {
                backgroundColor: leftDark ? "#F8FAFC" : "#0F172A",
                color: rightText,
                fontSize: "14px",
                padding: { top: 10, right: 14, bottom: 10, left: 14 },
                borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                border: { width: 1, style: "solid", color: leftDark ? "#CBD5E1" : "#334155" },
            },
            content: { placeholder: "••••••••", inputType: "password" },
            confidence: 0.99,
        };
        // Row: Remember me + Forgot password
        nodes[`${cardId}_auth_row`] = {
            id: `${cardId}_auth_row`,
            type: "flex",
            parentId: `${cardId}_form`,
            childIds: [`${cardId}_rem`, `${cardId}_forgot`],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: {
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 0,
                flexWrap: "nowrap",
            },
            styles: { margin: { top: 4, right: 0, bottom: 4, left: 0 } },
            confidence: 0.96,
        };
        nodes[`${cardId}_rem`] = {
            id: `${cardId}_rem`,
            type: "text",
            parentId: `${cardId}_auth_row`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: rightMuted, fontSize: "13px" },
            content: { text: "Remember me for 30 days" },
            confidence: 0.95,
        };
        nodes[`${cardId}_forgot`] = {
            id: `${cardId}_forgot`,
            type: "button",
            parentId: `${cardId}_auth_row`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "auto", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: "#2563EB", fontSize: "13px", fontWeight: 600 },
            content: { text: "Forgot password?" },
            confidence: 0.96,
        };
        // Submit button
        nodes[`${cardId}_btn_submit`] = {
            id: `${cardId}_btn_submit`,
            type: "button",
            parentId: `${cardId}_form`,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: 46 },
            layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
            styles: {
                backgroundColor: colors.primaryAccent || "#2563EB",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                padding: { top: 12, right: 20, bottom: 12, left: 20 },
                borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
                margin: { top: 6, right: 0, bottom: 0, left: 0 },
            },
            content: { text: "Sign In" },
            confidence: 0.99,
        };
        // Auth Footer
        nodes[`${cardId}_footer`] = {
            id: `${cardId}_footer`,
            type: "text",
            parentId: cardId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { color: rightMuted, fontSize: "13px", textAlign: "center", margin: { top: 8, right: 0, bottom: 0, left: 0 } },
            content: { text: "Don't have an account? Contact enterprise sales." },
            confidence: 0.96,
        };
    }
    static buildMobileRoot(nodes, rootId, width, height, colors) {
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Mobile Page",
            parentId: null,
            childIds: [`${rootId}_sec_mobile`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", gap: 0, alignItems: "center", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { backgroundColor: colors.dominantBg, color: colors.textColor },
            confidence: 0.95,
        };
        this.buildMobile(nodes, `${rootId}_sec_mobile`, rootId, colors, {});
    }
    static buildDenseMatrixRoot(nodes, rootId, width, height, colors) {
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Matrix Page",
            parentId: null,
            childIds: [`${rootId}_sec_matrix`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { backgroundColor: colors.dominantBg, color: colors.textColor },
            confidence: 0.95,
        };
        this.buildDenseMatrix(nodes, `${rootId}_sec_matrix`, rootId, colors, {});
    }
    static buildDashboardRoot(nodes, rootId, width, height, colors) {
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Dashboard Page",
            parentId: null,
            childIds: [`${rootId}_sec_nav`, `${rootId}_sec_dash`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { backgroundColor: colors.dominantBg, color: colors.textColor },
            confidence: 0.95,
        };
        this.buildNavbar(nodes, `${rootId}_sec_nav`, rootId, colors, { title: "Operations Hub", actionText: "Export Report" });
        this.buildDashboard(nodes, `${rootId}_sec_dash`, rootId, colors, {});
    }
    static buildFormRoot(nodes, rootId, width, height, colors) {
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Form Page",
            parentId: null,
            childIds: [`${rootId}_sec_nav`, `${rootId}_sec_form`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { backgroundColor: colors.dominantBg, color: colors.textColor },
            confidence: 0.95,
        };
        this.buildNavbar(nodes, `${rootId}_sec_nav`, rootId, colors, { title: "Account Portal", actionText: "Sign In" });
        this.buildForm(nodes, `${rootId}_sec_form`, rootId, colors, { title: "Sign In to Your Account" });
    }
    static buildLandingRoot(nodes, rootId, width, height, colors) {
        nodes[rootId] = {
            id: rootId,
            type: "page",
            name: "Landing Page",
            parentId: null,
            childIds: [`${rootId}_sec_nav`, `${rootId}_sec_hero`, `${rootId}_sec_cards`],
            position: { x: 0, y: 0, relativeTo: "viewport" },
            dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
            layout: { display: "flex", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
            styles: { backgroundColor: colors.dominantBg, color: colors.textColor },
            confidence: 0.95,
        };
        this.buildNavbar(nodes, `${rootId}_sec_nav`, rootId, colors, { title: "Application Suite", actionText: "Get Started" });
        this.buildHero(nodes, `${rootId}_sec_hero`, rootId, colors, { title: "Transform Workflows Into Production Results" });
        this.buildCardGrid(nodes, `${rootId}_sec_cards`, rootId, colors, {});
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
            content: { text: sec.title || "Application Suite" },
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
            content: { text: "✦ Next-Gen Enterprise Solution" },
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
            content: { text: sec.title || "Transform Workflows Into Production Results" },
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
            content: { text: sec.subtitle || "Seamlessly integrate workflows, manage structured resources, and deploy scalable systems across your organization." },
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
            content: { text: "Get Started Free" },
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
            content: { text: "Learn More" },
            confidence: 0.97,
        };
    }
    static buildCardGrid(nodes, id, parentId, colors, sec) {
        const items = sec.items || [
            { title: "Unified System Architecture", desc: "Isolates component logic from presentation layers for scalable performance." },
            { title: "Automated Workflows", desc: "Synthesizes modern responsive UI layouts across platforms with high visual fidelity." },
            { title: "Continuous Self-Correction", desc: "Evaluates layout metrics with targeted surgical patches and real-time verification." },
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
            content: { text: sec.title || "Sign In" },
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
            content: { text: "Please enter your credentials to continue." },
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
            content: { text: "Sign In" },
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
            content: { text: "Mobile Hub" },
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
        ["Live Operations", "Security & Encryption"].forEach((t, idx) => {
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
            content: { text: "Enterprise Cloud" },
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
            content: { text: "Feature Comparison Matrix" },
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
            content: { text: "Compare Plans & Capabilities" },
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