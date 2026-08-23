import { UIIRDocument } from "../types/ir.js";
import { ComponentPlan } from "../types/planner.js";
export declare class ComponentPlanner {
    /**
     * Plans the component hierarchy and decomposition from a UIIRDocument.
     */
    static planComponents(ir: UIIRDocument): ComponentPlan;
    private static isSectionComponent;
    private static formatComponentName;
    private static mapCategory;
    private static collectAllDescendants;
    private static inferProps;
    private static inferState;
}
//# sourceMappingURL=componentPlanner.d.ts.map