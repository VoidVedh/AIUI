import { ComponentPlanSchema, } from "../types/planner.js";
export class ComponentPlanner {
    /**
     * Plans the component hierarchy and decomposition from a UIIRDocument.
     */
    static planComponents(ir) {
        const rootNode = ir.nodes[ir.rootNodeId];
        if (!rootNode) {
            throw new Error(`Root node '${ir.rootNodeId}' not found in UIIRDocument.`);
        }
        const components = {};
        const rootComponentId = "app_root";
        // Create Root App Component
        components[rootComponentId] = {
            id: rootComponentId,
            name: "App",
            category: "layout",
            irNodeIds: [ir.rootNodeId],
            isReusable: false,
            filePath: "src/App.jsx",
            props: [],
            childComponentIds: [],
            stateVariables: [],
            stylingStrategy: "css-custom-props",
        };
        // Find major semantic sections among children of root
        const topLevelChildIds = rootNode.childIds || [];
        for (const childId of topLevelChildIds) {
            const childNode = ir.nodes[childId];
            if (!childNode)
                continue;
            if (this.isSectionComponent(childNode)) {
                const compName = this.formatComponentName(childNode.type, childNode.name || childNode.id);
                const compId = `comp_${childNode.id}`;
                components[compId] = {
                    id: compId,
                    name: compName,
                    category: this.mapCategory(childNode.type),
                    irNodeIds: [childNode.id, ...this.collectAllDescendants(childNode.id, ir.nodes)],
                    isReusable: childNode.type === "card" || childNode.type === "button",
                    filePath: `src/components/${compName}.jsx`,
                    props: this.inferProps(childNode, ir.nodes),
                    childComponentIds: [],
                    stateVariables: this.inferState(childNode),
                    stylingStrategy: "css-custom-props",
                };
                components[rootComponentId].childComponentIds.push(compId);
            }
        }
        // If no distinct section components were formed, keep single App structure
        if (components[rootComponentId].childComponentIds.length === 0) {
            components[rootComponentId].irNodeIds = Object.keys(ir.nodes);
        }
        return ComponentPlanSchema.parse({
            rootComponentId,
            components,
            entryFile: "src/App.jsx",
            sharedStylesFile: "src/index.css",
        });
    }
    static isSectionComponent(node) {
        return [
            "navbar",
            "sidebar",
            "header",
            "footer",
            "hero",
            "section",
            "card",
            "grid",
            "form",
            "modal"
        ].includes(node.type) || (node.childIds && node.childIds.length >= 2);
    }
    static formatComponentName(type, name) {
        const raw = name && name.length > 2 ? name : type;
        const clean = raw.replace(/[^a-zA-Z0-9]/g, " ");
        const pascal = clean
            .split(" ")
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join("");
        return pascal.length > 0 ? pascal : "Section";
    }
    static mapCategory(type) {
        switch (type) {
            case "navbar":
            case "sidebar":
            case "header":
                return "navigation";
            case "hero":
            case "section":
                return "section";
            case "card":
            case "grid":
            case "list":
            case "stat":
                return "data-display";
            case "form":
            case "input":
                return "input";
            case "modal":
                return "feedback";
            case "button":
                return "atomic";
            default:
                return "layout";
        }
    }
    static collectAllDescendants(nodeId, nodes) {
        const results = [];
        const queue = [...(nodes[nodeId]?.childIds || [])];
        while (queue.length > 0) {
            const currentId = queue.shift();
            results.push(currentId);
            const childNode = nodes[currentId];
            if (childNode?.childIds) {
                queue.push(...childNode.childIds);
            }
        }
        return results;
    }
    static inferProps(node, nodes) {
        const props = [];
        if (node.content?.text) {
            props.push({
                name: "title",
                type: "string",
                required: false,
                defaultValue: node.content.text,
                description: "Text content or heading",
            });
        }
        return props;
    }
    static inferState(node) {
        const state = [];
        if (node.type === "form") {
            state.push({
                name: "formData",
                type: "object",
                initialValue: "{}",
            });
        }
        else if (node.type === "navbar") {
            state.push({
                name: "isMobileMenuOpen",
                type: "boolean",
                initialValue: "false",
            });
        }
        return state;
    }
}
//# sourceMappingURL=componentPlanner.js.map