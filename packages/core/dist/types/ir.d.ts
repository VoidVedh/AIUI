import { z } from "zod";
export declare const UINodeTypeSchema: z.ZodEnum<["page", "section", "container", "navbar", "sidebar", "header", "footer", "hero", "card", "grid", "flex", "button", "heading", "text", "input", "image", "icon", "badge", "avatar", "list", "modal", "form", "stat", "divider"]>;
export type UINodeType = z.infer<typeof UINodeTypeSchema>;
export declare const PositionSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    relativeTo: z.ZodDefault<z.ZodEnum<["parent", "viewport", "flow"]>>;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
    relativeTo: "parent" | "viewport" | "flow";
}, {
    x: number;
    y: number;
    relativeTo?: "parent" | "viewport" | "flow" | undefined;
}>;
export type Position = z.infer<typeof PositionSchema>;
export declare const DimensionsSchema: z.ZodObject<{
    width: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    height: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    minWidth: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    maxWidth: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    minHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    maxHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    aspectRatio: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    width: string | number;
    height: string | number;
    minWidth?: string | number | undefined;
    maxWidth?: string | number | undefined;
    minHeight?: string | number | undefined;
    maxHeight?: string | number | undefined;
    aspectRatio?: number | undefined;
}, {
    width?: string | number | undefined;
    height?: string | number | undefined;
    minWidth?: string | number | undefined;
    maxWidth?: string | number | undefined;
    minHeight?: string | number | undefined;
    maxHeight?: string | number | undefined;
    aspectRatio?: number | undefined;
}>;
export type Dimensions = z.infer<typeof DimensionsSchema>;
export declare const LayoutSchema: z.ZodObject<{
    display: z.ZodDefault<z.ZodEnum<["flex", "grid", "block", "inline-block", "absolute"]>>;
    flexDirection: z.ZodDefault<z.ZodEnum<["row", "column", "row-reverse", "column-reverse"]>>;
    justifyContent: z.ZodDefault<z.ZodEnum<["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]>>;
    alignItems: z.ZodDefault<z.ZodEnum<["flex-start", "center", "flex-end", "stretch", "baseline"]>>;
    gap: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    flexWrap: z.ZodDefault<z.ZodEnum<["nowrap", "wrap", "wrap-reverse"]>>;
    gridTemplateColumns: z.ZodOptional<z.ZodString>;
    gridTemplateRows: z.ZodOptional<z.ZodString>;
    alignSelf: z.ZodOptional<z.ZodEnum<["auto", "flex-start", "center", "flex-end", "stretch"]>>;
}, "strip", z.ZodTypeAny, {
    display: "grid" | "flex" | "block" | "inline-block" | "absolute";
    flexDirection: "row" | "column" | "row-reverse" | "column-reverse";
    justifyContent: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
    alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
    gap: string | number;
    flexWrap: "nowrap" | "wrap" | "wrap-reverse";
    gridTemplateColumns?: string | undefined;
    gridTemplateRows?: string | undefined;
    alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
}, {
    display?: "grid" | "flex" | "block" | "inline-block" | "absolute" | undefined;
    flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
    justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined;
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline" | undefined;
    gap?: string | number | undefined;
    flexWrap?: "nowrap" | "wrap" | "wrap-reverse" | undefined;
    gridTemplateColumns?: string | undefined;
    gridTemplateRows?: string | undefined;
    alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
}>;
export type Layout = z.infer<typeof LayoutSchema>;
export declare const SpacingSchema: z.ZodObject<{
    top: z.ZodDefault<z.ZodNumber>;
    right: z.ZodDefault<z.ZodNumber>;
    bottom: z.ZodDefault<z.ZodNumber>;
    left: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    top: number;
    right: number;
    bottom: number;
    left: number;
}, {
    top?: number | undefined;
    right?: number | undefined;
    bottom?: number | undefined;
    left?: number | undefined;
}>;
export type Spacing = z.infer<typeof SpacingSchema>;
export declare const BorderSchema: z.ZodObject<{
    width: z.ZodDefault<z.ZodNumber>;
    style: z.ZodDefault<z.ZodEnum<["solid", "dashed", "dotted", "none"]>>;
    color: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    width: number;
    style: "solid" | "dashed" | "dotted" | "none";
    color: string;
}, {
    width?: number | undefined;
    style?: "solid" | "dashed" | "dotted" | "none" | undefined;
    color?: string | undefined;
}>;
export type Border = z.infer<typeof BorderSchema>;
export declare const BorderRadiusSchema: z.ZodObject<{
    topLeft: z.ZodDefault<z.ZodNumber>;
    topRight: z.ZodDefault<z.ZodNumber>;
    bottomRight: z.ZodDefault<z.ZodNumber>;
    bottomLeft: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
}, {
    topLeft?: number | undefined;
    topRight?: number | undefined;
    bottomRight?: number | undefined;
    bottomLeft?: number | undefined;
}>;
export type BorderRadius = z.infer<typeof BorderRadiusSchema>;
export declare const UIStylesSchema: z.ZodObject<{
    backgroundColor: z.ZodOptional<z.ZodString>;
    backgroundGradient: z.ZodOptional<z.ZodString>;
    opacity: z.ZodOptional<z.ZodNumber>;
    color: z.ZodOptional<z.ZodString>;
    fontFamily: z.ZodOptional<z.ZodString>;
    fontSize: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    fontWeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    lineHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    letterSpacing: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    textAlign: z.ZodOptional<z.ZodEnum<["left", "center", "right", "justify"]>>;
    textTransform: z.ZodOptional<z.ZodEnum<["none", "uppercase", "lowercase", "capitalize"]>>;
    padding: z.ZodOptional<z.ZodObject<{
        top: z.ZodDefault<z.ZodNumber>;
        right: z.ZodDefault<z.ZodNumber>;
        bottom: z.ZodDefault<z.ZodNumber>;
        left: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        top: number;
        right: number;
        bottom: number;
        left: number;
    }, {
        top?: number | undefined;
        right?: number | undefined;
        bottom?: number | undefined;
        left?: number | undefined;
    }>>;
    margin: z.ZodOptional<z.ZodObject<{
        top: z.ZodDefault<z.ZodNumber>;
        right: z.ZodDefault<z.ZodNumber>;
        bottom: z.ZodDefault<z.ZodNumber>;
        left: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        top: number;
        right: number;
        bottom: number;
        left: number;
    }, {
        top?: number | undefined;
        right?: number | undefined;
        bottom?: number | undefined;
        left?: number | undefined;
    }>>;
    border: z.ZodOptional<z.ZodObject<{
        width: z.ZodDefault<z.ZodNumber>;
        style: z.ZodDefault<z.ZodEnum<["solid", "dashed", "dotted", "none"]>>;
        color: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        width: number;
        style: "solid" | "dashed" | "dotted" | "none";
        color: string;
    }, {
        width?: number | undefined;
        style?: "solid" | "dashed" | "dotted" | "none" | undefined;
        color?: string | undefined;
    }>>;
    borderRadius: z.ZodOptional<z.ZodObject<{
        topLeft: z.ZodDefault<z.ZodNumber>;
        topRight: z.ZodDefault<z.ZodNumber>;
        bottomRight: z.ZodDefault<z.ZodNumber>;
        bottomLeft: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
    }, {
        topLeft?: number | undefined;
        topRight?: number | undefined;
        bottomRight?: number | undefined;
        bottomLeft?: number | undefined;
    }>>;
    boxShadow: z.ZodOptional<z.ZodString>;
    backdropFilter: z.ZodOptional<z.ZodString>;
    tokenRefs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    color?: string | undefined;
    backgroundColor?: string | undefined;
    backgroundGradient?: string | undefined;
    opacity?: number | undefined;
    fontFamily?: string | undefined;
    fontSize?: string | number | undefined;
    fontWeight?: string | number | undefined;
    lineHeight?: string | number | undefined;
    letterSpacing?: string | number | undefined;
    textAlign?: "center" | "right" | "left" | "justify" | undefined;
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
    padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    } | undefined;
    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    } | undefined;
    border?: {
        width: number;
        style: "solid" | "dashed" | "dotted" | "none";
        color: string;
    } | undefined;
    borderRadius?: {
        topLeft: number;
        topRight: number;
        bottomRight: number;
        bottomLeft: number;
    } | undefined;
    boxShadow?: string | undefined;
    backdropFilter?: string | undefined;
    tokenRefs?: Record<string, string> | undefined;
}, {
    color?: string | undefined;
    backgroundColor?: string | undefined;
    backgroundGradient?: string | undefined;
    opacity?: number | undefined;
    fontFamily?: string | undefined;
    fontSize?: string | number | undefined;
    fontWeight?: string | number | undefined;
    lineHeight?: string | number | undefined;
    letterSpacing?: string | number | undefined;
    textAlign?: "center" | "right" | "left" | "justify" | undefined;
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
    padding?: {
        top?: number | undefined;
        right?: number | undefined;
        bottom?: number | undefined;
        left?: number | undefined;
    } | undefined;
    margin?: {
        top?: number | undefined;
        right?: number | undefined;
        bottom?: number | undefined;
        left?: number | undefined;
    } | undefined;
    border?: {
        width?: number | undefined;
        style?: "solid" | "dashed" | "dotted" | "none" | undefined;
        color?: string | undefined;
    } | undefined;
    borderRadius?: {
        topLeft?: number | undefined;
        topRight?: number | undefined;
        bottomRight?: number | undefined;
        bottomLeft?: number | undefined;
    } | undefined;
    boxShadow?: string | undefined;
    backdropFilter?: string | undefined;
    tokenRefs?: Record<string, string> | undefined;
}>;
export type UIStyles = z.infer<typeof UIStylesSchema>;
export declare const NodeContentSchema: z.ZodObject<{
    text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    iconName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    src: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    alt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    placeholder: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    inputType: z.ZodOptional<z.ZodNullable<z.ZodEnum<["text", "email", "password", "number", "search", "textarea"]>>>;
    badgeVariant: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    text?: string | null | undefined;
    iconName?: string | null | undefined;
    src?: string | null | undefined;
    alt?: string | null | undefined;
    placeholder?: string | null | undefined;
    inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
    badgeVariant?: string | null | undefined;
}, {
    text?: string | null | undefined;
    iconName?: string | null | undefined;
    src?: string | null | undefined;
    alt?: string | null | undefined;
    placeholder?: string | null | undefined;
    inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
    badgeVariant?: string | null | undefined;
}>;
export type NodeContent = z.infer<typeof NodeContentSchema>;
export declare const UINodeSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["page", "section", "container", "navbar", "sidebar", "header", "footer", "hero", "card", "grid", "flex", "button", "heading", "text", "input", "image", "icon", "badge", "avatar", "list", "modal", "form", "stat", "divider"]>;
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodNullable<z.ZodString>;
    childIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    position: z.ZodDefault<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        relativeTo: z.ZodDefault<z.ZodEnum<["parent", "viewport", "flow"]>>;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        relativeTo: "parent" | "viewport" | "flow";
    }, {
        x: number;
        y: number;
        relativeTo?: "parent" | "viewport" | "flow" | undefined;
    }>>;
    dimensions: z.ZodDefault<z.ZodObject<{
        width: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        height: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        minWidth: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        maxWidth: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        minHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        maxHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        aspectRatio: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        width: string | number;
        height: string | number;
        minWidth?: string | number | undefined;
        maxWidth?: string | number | undefined;
        minHeight?: string | number | undefined;
        maxHeight?: string | number | undefined;
        aspectRatio?: number | undefined;
    }, {
        width?: string | number | undefined;
        height?: string | number | undefined;
        minWidth?: string | number | undefined;
        maxWidth?: string | number | undefined;
        minHeight?: string | number | undefined;
        maxHeight?: string | number | undefined;
        aspectRatio?: number | undefined;
    }>>;
    layout: z.ZodDefault<z.ZodObject<{
        display: z.ZodDefault<z.ZodEnum<["flex", "grid", "block", "inline-block", "absolute"]>>;
        flexDirection: z.ZodDefault<z.ZodEnum<["row", "column", "row-reverse", "column-reverse"]>>;
        justifyContent: z.ZodDefault<z.ZodEnum<["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]>>;
        alignItems: z.ZodDefault<z.ZodEnum<["flex-start", "center", "flex-end", "stretch", "baseline"]>>;
        gap: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        flexWrap: z.ZodDefault<z.ZodEnum<["nowrap", "wrap", "wrap-reverse"]>>;
        gridTemplateColumns: z.ZodOptional<z.ZodString>;
        gridTemplateRows: z.ZodOptional<z.ZodString>;
        alignSelf: z.ZodOptional<z.ZodEnum<["auto", "flex-start", "center", "flex-end", "stretch"]>>;
    }, "strip", z.ZodTypeAny, {
        display: "grid" | "flex" | "block" | "inline-block" | "absolute";
        flexDirection: "row" | "column" | "row-reverse" | "column-reverse";
        justifyContent: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
        alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
        gap: string | number;
        flexWrap: "nowrap" | "wrap" | "wrap-reverse";
        gridTemplateColumns?: string | undefined;
        gridTemplateRows?: string | undefined;
        alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
    }, {
        display?: "grid" | "flex" | "block" | "inline-block" | "absolute" | undefined;
        flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
        justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined;
        alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline" | undefined;
        gap?: string | number | undefined;
        flexWrap?: "nowrap" | "wrap" | "wrap-reverse" | undefined;
        gridTemplateColumns?: string | undefined;
        gridTemplateRows?: string | undefined;
        alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
    }>>;
    styles: z.ZodDefault<z.ZodObject<{
        backgroundColor: z.ZodOptional<z.ZodString>;
        backgroundGradient: z.ZodOptional<z.ZodString>;
        opacity: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
        fontFamily: z.ZodOptional<z.ZodString>;
        fontSize: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        fontWeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        lineHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        letterSpacing: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        textAlign: z.ZodOptional<z.ZodEnum<["left", "center", "right", "justify"]>>;
        textTransform: z.ZodOptional<z.ZodEnum<["none", "uppercase", "lowercase", "capitalize"]>>;
        padding: z.ZodOptional<z.ZodObject<{
            top: z.ZodDefault<z.ZodNumber>;
            right: z.ZodDefault<z.ZodNumber>;
            bottom: z.ZodDefault<z.ZodNumber>;
            left: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            top: number;
            right: number;
            bottom: number;
            left: number;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
        margin: z.ZodOptional<z.ZodObject<{
            top: z.ZodDefault<z.ZodNumber>;
            right: z.ZodDefault<z.ZodNumber>;
            bottom: z.ZodDefault<z.ZodNumber>;
            left: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            top: number;
            right: number;
            bottom: number;
            left: number;
        }, {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        }>>;
        border: z.ZodOptional<z.ZodObject<{
            width: z.ZodDefault<z.ZodNumber>;
            style: z.ZodDefault<z.ZodEnum<["solid", "dashed", "dotted", "none"]>>;
            color: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            width: number;
            style: "solid" | "dashed" | "dotted" | "none";
            color: string;
        }, {
            width?: number | undefined;
            style?: "solid" | "dashed" | "dotted" | "none" | undefined;
            color?: string | undefined;
        }>>;
        borderRadius: z.ZodOptional<z.ZodObject<{
            topLeft: z.ZodDefault<z.ZodNumber>;
            topRight: z.ZodDefault<z.ZodNumber>;
            bottomRight: z.ZodDefault<z.ZodNumber>;
            bottomLeft: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            topLeft: number;
            topRight: number;
            bottomRight: number;
            bottomLeft: number;
        }, {
            topLeft?: number | undefined;
            topRight?: number | undefined;
            bottomRight?: number | undefined;
            bottomLeft?: number | undefined;
        }>>;
        boxShadow: z.ZodOptional<z.ZodString>;
        backdropFilter: z.ZodOptional<z.ZodString>;
        tokenRefs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        color?: string | undefined;
        backgroundColor?: string | undefined;
        backgroundGradient?: string | undefined;
        opacity?: number | undefined;
        fontFamily?: string | undefined;
        fontSize?: string | number | undefined;
        fontWeight?: string | number | undefined;
        lineHeight?: string | number | undefined;
        letterSpacing?: string | number | undefined;
        textAlign?: "center" | "right" | "left" | "justify" | undefined;
        textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
        padding?: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        } | undefined;
        margin?: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        } | undefined;
        border?: {
            width: number;
            style: "solid" | "dashed" | "dotted" | "none";
            color: string;
        } | undefined;
        borderRadius?: {
            topLeft: number;
            topRight: number;
            bottomRight: number;
            bottomLeft: number;
        } | undefined;
        boxShadow?: string | undefined;
        backdropFilter?: string | undefined;
        tokenRefs?: Record<string, string> | undefined;
    }, {
        color?: string | undefined;
        backgroundColor?: string | undefined;
        backgroundGradient?: string | undefined;
        opacity?: number | undefined;
        fontFamily?: string | undefined;
        fontSize?: string | number | undefined;
        fontWeight?: string | number | undefined;
        lineHeight?: string | number | undefined;
        letterSpacing?: string | number | undefined;
        textAlign?: "center" | "right" | "left" | "justify" | undefined;
        textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
        margin?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
        border?: {
            width?: number | undefined;
            style?: "solid" | "dashed" | "dotted" | "none" | undefined;
            color?: string | undefined;
        } | undefined;
        borderRadius?: {
            topLeft?: number | undefined;
            topRight?: number | undefined;
            bottomRight?: number | undefined;
            bottomLeft?: number | undefined;
        } | undefined;
        boxShadow?: string | undefined;
        backdropFilter?: string | undefined;
        tokenRefs?: Record<string, string> | undefined;
    }>>;
    content: z.ZodOptional<z.ZodObject<{
        text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        iconName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        src: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        alt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        placeholder: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        inputType: z.ZodOptional<z.ZodNullable<z.ZodEnum<["text", "email", "password", "number", "search", "textarea"]>>>;
        badgeVariant: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        text?: string | null | undefined;
        iconName?: string | null | undefined;
        src?: string | null | undefined;
        alt?: string | null | undefined;
        placeholder?: string | null | undefined;
        inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
        badgeVariant?: string | null | undefined;
    }, {
        text?: string | null | undefined;
        iconName?: string | null | undefined;
        src?: string | null | undefined;
        alt?: string | null | undefined;
        placeholder?: string | null | undefined;
        inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
        badgeVariant?: string | null | undefined;
    }>>;
    semanticRole: z.ZodOptional<z.ZodString>;
    ariaLabel: z.ZodOptional<z.ZodString>;
    confidence: z.ZodDefault<z.ZodNumber>;
    relationships: z.ZodOptional<z.ZodObject<{
        alignsWith: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        adjacentTo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        alignsWith?: string[] | undefined;
        adjacentTo?: string[] | undefined;
    }, {
        alignsWith?: string[] | undefined;
        adjacentTo?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "page" | "section" | "container" | "navbar" | "sidebar" | "header" | "footer" | "hero" | "card" | "grid" | "flex" | "button" | "heading" | "text" | "input" | "image" | "icon" | "badge" | "avatar" | "list" | "modal" | "form" | "stat" | "divider";
    id: string;
    parentId: string | null;
    childIds: string[];
    position: {
        x: number;
        y: number;
        relativeTo: "parent" | "viewport" | "flow";
    };
    dimensions: {
        width: string | number;
        height: string | number;
        minWidth?: string | number | undefined;
        maxWidth?: string | number | undefined;
        minHeight?: string | number | undefined;
        maxHeight?: string | number | undefined;
        aspectRatio?: number | undefined;
    };
    layout: {
        display: "grid" | "flex" | "block" | "inline-block" | "absolute";
        flexDirection: "row" | "column" | "row-reverse" | "column-reverse";
        justifyContent: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
        alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
        gap: string | number;
        flexWrap: "nowrap" | "wrap" | "wrap-reverse";
        gridTemplateColumns?: string | undefined;
        gridTemplateRows?: string | undefined;
        alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
    };
    styles: {
        color?: string | undefined;
        backgroundColor?: string | undefined;
        backgroundGradient?: string | undefined;
        opacity?: number | undefined;
        fontFamily?: string | undefined;
        fontSize?: string | number | undefined;
        fontWeight?: string | number | undefined;
        lineHeight?: string | number | undefined;
        letterSpacing?: string | number | undefined;
        textAlign?: "center" | "right" | "left" | "justify" | undefined;
        textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
        padding?: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        } | undefined;
        margin?: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        } | undefined;
        border?: {
            width: number;
            style: "solid" | "dashed" | "dotted" | "none";
            color: string;
        } | undefined;
        borderRadius?: {
            topLeft: number;
            topRight: number;
            bottomRight: number;
            bottomLeft: number;
        } | undefined;
        boxShadow?: string | undefined;
        backdropFilter?: string | undefined;
        tokenRefs?: Record<string, string> | undefined;
    };
    confidence: number;
    name?: string | undefined;
    content?: {
        text?: string | null | undefined;
        iconName?: string | null | undefined;
        src?: string | null | undefined;
        alt?: string | null | undefined;
        placeholder?: string | null | undefined;
        inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
        badgeVariant?: string | null | undefined;
    } | undefined;
    semanticRole?: string | undefined;
    ariaLabel?: string | undefined;
    relationships?: {
        alignsWith?: string[] | undefined;
        adjacentTo?: string[] | undefined;
    } | undefined;
}, {
    type: "page" | "section" | "container" | "navbar" | "sidebar" | "header" | "footer" | "hero" | "card" | "grid" | "flex" | "button" | "heading" | "text" | "input" | "image" | "icon" | "badge" | "avatar" | "list" | "modal" | "form" | "stat" | "divider";
    id: string;
    parentId: string | null;
    name?: string | undefined;
    childIds?: string[] | undefined;
    position?: {
        x: number;
        y: number;
        relativeTo?: "parent" | "viewport" | "flow" | undefined;
    } | undefined;
    dimensions?: {
        width?: string | number | undefined;
        height?: string | number | undefined;
        minWidth?: string | number | undefined;
        maxWidth?: string | number | undefined;
        minHeight?: string | number | undefined;
        maxHeight?: string | number | undefined;
        aspectRatio?: number | undefined;
    } | undefined;
    layout?: {
        display?: "grid" | "flex" | "block" | "inline-block" | "absolute" | undefined;
        flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
        justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined;
        alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline" | undefined;
        gap?: string | number | undefined;
        flexWrap?: "nowrap" | "wrap" | "wrap-reverse" | undefined;
        gridTemplateColumns?: string | undefined;
        gridTemplateRows?: string | undefined;
        alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
    } | undefined;
    styles?: {
        color?: string | undefined;
        backgroundColor?: string | undefined;
        backgroundGradient?: string | undefined;
        opacity?: number | undefined;
        fontFamily?: string | undefined;
        fontSize?: string | number | undefined;
        fontWeight?: string | number | undefined;
        lineHeight?: string | number | undefined;
        letterSpacing?: string | number | undefined;
        textAlign?: "center" | "right" | "left" | "justify" | undefined;
        textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
        padding?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
        margin?: {
            top?: number | undefined;
            right?: number | undefined;
            bottom?: number | undefined;
            left?: number | undefined;
        } | undefined;
        border?: {
            width?: number | undefined;
            style?: "solid" | "dashed" | "dotted" | "none" | undefined;
            color?: string | undefined;
        } | undefined;
        borderRadius?: {
            topLeft?: number | undefined;
            topRight?: number | undefined;
            bottomRight?: number | undefined;
            bottomLeft?: number | undefined;
        } | undefined;
        boxShadow?: string | undefined;
        backdropFilter?: string | undefined;
        tokenRefs?: Record<string, string> | undefined;
    } | undefined;
    content?: {
        text?: string | null | undefined;
        iconName?: string | null | undefined;
        src?: string | null | undefined;
        alt?: string | null | undefined;
        placeholder?: string | null | undefined;
        inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
        badgeVariant?: string | null | undefined;
    } | undefined;
    semanticRole?: string | undefined;
    ariaLabel?: string | undefined;
    confidence?: number | undefined;
    relationships?: {
        alignsWith?: string[] | undefined;
        adjacentTo?: string[] | undefined;
    } | undefined;
}>;
export type UINode = z.infer<typeof UINodeSchema>;
export declare const UIIRDocumentSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodLiteral<"1.0.0">>;
    id: z.ZodString;
    name: z.ZodString;
    viewport: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        devicePixelRatio: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        width: number;
        height: number;
        devicePixelRatio: number;
    }, {
        width: number;
        height: number;
        devicePixelRatio?: number | undefined;
    }>;
    rootNodeId: z.ZodString;
    nodes: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["page", "section", "container", "navbar", "sidebar", "header", "footer", "hero", "card", "grid", "flex", "button", "heading", "text", "input", "image", "icon", "badge", "avatar", "list", "modal", "form", "stat", "divider"]>;
        name: z.ZodOptional<z.ZodString>;
        parentId: z.ZodNullable<z.ZodString>;
        childIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        position: z.ZodDefault<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            relativeTo: z.ZodDefault<z.ZodEnum<["parent", "viewport", "flow"]>>;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            relativeTo: "parent" | "viewport" | "flow";
        }, {
            x: number;
            y: number;
            relativeTo?: "parent" | "viewport" | "flow" | undefined;
        }>>;
        dimensions: z.ZodDefault<z.ZodObject<{
            width: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            height: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            minWidth: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            maxWidth: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            minHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            maxHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            aspectRatio: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            width: string | number;
            height: string | number;
            minWidth?: string | number | undefined;
            maxWidth?: string | number | undefined;
            minHeight?: string | number | undefined;
            maxHeight?: string | number | undefined;
            aspectRatio?: number | undefined;
        }, {
            width?: string | number | undefined;
            height?: string | number | undefined;
            minWidth?: string | number | undefined;
            maxWidth?: string | number | undefined;
            minHeight?: string | number | undefined;
            maxHeight?: string | number | undefined;
            aspectRatio?: number | undefined;
        }>>;
        layout: z.ZodDefault<z.ZodObject<{
            display: z.ZodDefault<z.ZodEnum<["flex", "grid", "block", "inline-block", "absolute"]>>;
            flexDirection: z.ZodDefault<z.ZodEnum<["row", "column", "row-reverse", "column-reverse"]>>;
            justifyContent: z.ZodDefault<z.ZodEnum<["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"]>>;
            alignItems: z.ZodDefault<z.ZodEnum<["flex-start", "center", "flex-end", "stretch", "baseline"]>>;
            gap: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            flexWrap: z.ZodDefault<z.ZodEnum<["nowrap", "wrap", "wrap-reverse"]>>;
            gridTemplateColumns: z.ZodOptional<z.ZodString>;
            gridTemplateRows: z.ZodOptional<z.ZodString>;
            alignSelf: z.ZodOptional<z.ZodEnum<["auto", "flex-start", "center", "flex-end", "stretch"]>>;
        }, "strip", z.ZodTypeAny, {
            display: "grid" | "flex" | "block" | "inline-block" | "absolute";
            flexDirection: "row" | "column" | "row-reverse" | "column-reverse";
            justifyContent: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
            alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
            gap: string | number;
            flexWrap: "nowrap" | "wrap" | "wrap-reverse";
            gridTemplateColumns?: string | undefined;
            gridTemplateRows?: string | undefined;
            alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
        }, {
            display?: "grid" | "flex" | "block" | "inline-block" | "absolute" | undefined;
            flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
            justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined;
            alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline" | undefined;
            gap?: string | number | undefined;
            flexWrap?: "nowrap" | "wrap" | "wrap-reverse" | undefined;
            gridTemplateColumns?: string | undefined;
            gridTemplateRows?: string | undefined;
            alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
        }>>;
        styles: z.ZodDefault<z.ZodObject<{
            backgroundColor: z.ZodOptional<z.ZodString>;
            backgroundGradient: z.ZodOptional<z.ZodString>;
            opacity: z.ZodOptional<z.ZodNumber>;
            color: z.ZodOptional<z.ZodString>;
            fontFamily: z.ZodOptional<z.ZodString>;
            fontSize: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            fontWeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            lineHeight: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            letterSpacing: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
            textAlign: z.ZodOptional<z.ZodEnum<["left", "center", "right", "justify"]>>;
            textTransform: z.ZodOptional<z.ZodEnum<["none", "uppercase", "lowercase", "capitalize"]>>;
            padding: z.ZodOptional<z.ZodObject<{
                top: z.ZodDefault<z.ZodNumber>;
                right: z.ZodDefault<z.ZodNumber>;
                bottom: z.ZodDefault<z.ZodNumber>;
                left: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                top: number;
                right: number;
                bottom: number;
                left: number;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
            margin: z.ZodOptional<z.ZodObject<{
                top: z.ZodDefault<z.ZodNumber>;
                right: z.ZodDefault<z.ZodNumber>;
                bottom: z.ZodDefault<z.ZodNumber>;
                left: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                top: number;
                right: number;
                bottom: number;
                left: number;
            }, {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            }>>;
            border: z.ZodOptional<z.ZodObject<{
                width: z.ZodDefault<z.ZodNumber>;
                style: z.ZodDefault<z.ZodEnum<["solid", "dashed", "dotted", "none"]>>;
                color: z.ZodDefault<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                width: number;
                style: "solid" | "dashed" | "dotted" | "none";
                color: string;
            }, {
                width?: number | undefined;
                style?: "solid" | "dashed" | "dotted" | "none" | undefined;
                color?: string | undefined;
            }>>;
            borderRadius: z.ZodOptional<z.ZodObject<{
                topLeft: z.ZodDefault<z.ZodNumber>;
                topRight: z.ZodDefault<z.ZodNumber>;
                bottomRight: z.ZodDefault<z.ZodNumber>;
                bottomLeft: z.ZodDefault<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                topLeft: number;
                topRight: number;
                bottomRight: number;
                bottomLeft: number;
            }, {
                topLeft?: number | undefined;
                topRight?: number | undefined;
                bottomRight?: number | undefined;
                bottomLeft?: number | undefined;
            }>>;
            boxShadow: z.ZodOptional<z.ZodString>;
            backdropFilter: z.ZodOptional<z.ZodString>;
            tokenRefs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            color?: string | undefined;
            backgroundColor?: string | undefined;
            backgroundGradient?: string | undefined;
            opacity?: number | undefined;
            fontFamily?: string | undefined;
            fontSize?: string | number | undefined;
            fontWeight?: string | number | undefined;
            lineHeight?: string | number | undefined;
            letterSpacing?: string | number | undefined;
            textAlign?: "center" | "right" | "left" | "justify" | undefined;
            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
            padding?: {
                top: number;
                right: number;
                bottom: number;
                left: number;
            } | undefined;
            margin?: {
                top: number;
                right: number;
                bottom: number;
                left: number;
            } | undefined;
            border?: {
                width: number;
                style: "solid" | "dashed" | "dotted" | "none";
                color: string;
            } | undefined;
            borderRadius?: {
                topLeft: number;
                topRight: number;
                bottomRight: number;
                bottomLeft: number;
            } | undefined;
            boxShadow?: string | undefined;
            backdropFilter?: string | undefined;
            tokenRefs?: Record<string, string> | undefined;
        }, {
            color?: string | undefined;
            backgroundColor?: string | undefined;
            backgroundGradient?: string | undefined;
            opacity?: number | undefined;
            fontFamily?: string | undefined;
            fontSize?: string | number | undefined;
            fontWeight?: string | number | undefined;
            lineHeight?: string | number | undefined;
            letterSpacing?: string | number | undefined;
            textAlign?: "center" | "right" | "left" | "justify" | undefined;
            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
            margin?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
            border?: {
                width?: number | undefined;
                style?: "solid" | "dashed" | "dotted" | "none" | undefined;
                color?: string | undefined;
            } | undefined;
            borderRadius?: {
                topLeft?: number | undefined;
                topRight?: number | undefined;
                bottomRight?: number | undefined;
                bottomLeft?: number | undefined;
            } | undefined;
            boxShadow?: string | undefined;
            backdropFilter?: string | undefined;
            tokenRefs?: Record<string, string> | undefined;
        }>>;
        content: z.ZodOptional<z.ZodObject<{
            text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            iconName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            src: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            alt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            placeholder: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            inputType: z.ZodOptional<z.ZodNullable<z.ZodEnum<["text", "email", "password", "number", "search", "textarea"]>>>;
            badgeVariant: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            text?: string | null | undefined;
            iconName?: string | null | undefined;
            src?: string | null | undefined;
            alt?: string | null | undefined;
            placeholder?: string | null | undefined;
            inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
            badgeVariant?: string | null | undefined;
        }, {
            text?: string | null | undefined;
            iconName?: string | null | undefined;
            src?: string | null | undefined;
            alt?: string | null | undefined;
            placeholder?: string | null | undefined;
            inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
            badgeVariant?: string | null | undefined;
        }>>;
        semanticRole: z.ZodOptional<z.ZodString>;
        ariaLabel: z.ZodOptional<z.ZodString>;
        confidence: z.ZodDefault<z.ZodNumber>;
        relationships: z.ZodOptional<z.ZodObject<{
            alignsWith: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            adjacentTo: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            alignsWith?: string[] | undefined;
            adjacentTo?: string[] | undefined;
        }, {
            alignsWith?: string[] | undefined;
            adjacentTo?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "page" | "section" | "container" | "navbar" | "sidebar" | "header" | "footer" | "hero" | "card" | "grid" | "flex" | "button" | "heading" | "text" | "input" | "image" | "icon" | "badge" | "avatar" | "list" | "modal" | "form" | "stat" | "divider";
        id: string;
        parentId: string | null;
        childIds: string[];
        position: {
            x: number;
            y: number;
            relativeTo: "parent" | "viewport" | "flow";
        };
        dimensions: {
            width: string | number;
            height: string | number;
            minWidth?: string | number | undefined;
            maxWidth?: string | number | undefined;
            minHeight?: string | number | undefined;
            maxHeight?: string | number | undefined;
            aspectRatio?: number | undefined;
        };
        layout: {
            display: "grid" | "flex" | "block" | "inline-block" | "absolute";
            flexDirection: "row" | "column" | "row-reverse" | "column-reverse";
            justifyContent: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
            alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
            gap: string | number;
            flexWrap: "nowrap" | "wrap" | "wrap-reverse";
            gridTemplateColumns?: string | undefined;
            gridTemplateRows?: string | undefined;
            alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
        };
        styles: {
            color?: string | undefined;
            backgroundColor?: string | undefined;
            backgroundGradient?: string | undefined;
            opacity?: number | undefined;
            fontFamily?: string | undefined;
            fontSize?: string | number | undefined;
            fontWeight?: string | number | undefined;
            lineHeight?: string | number | undefined;
            letterSpacing?: string | number | undefined;
            textAlign?: "center" | "right" | "left" | "justify" | undefined;
            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
            padding?: {
                top: number;
                right: number;
                bottom: number;
                left: number;
            } | undefined;
            margin?: {
                top: number;
                right: number;
                bottom: number;
                left: number;
            } | undefined;
            border?: {
                width: number;
                style: "solid" | "dashed" | "dotted" | "none";
                color: string;
            } | undefined;
            borderRadius?: {
                topLeft: number;
                topRight: number;
                bottomRight: number;
                bottomLeft: number;
            } | undefined;
            boxShadow?: string | undefined;
            backdropFilter?: string | undefined;
            tokenRefs?: Record<string, string> | undefined;
        };
        confidence: number;
        name?: string | undefined;
        content?: {
            text?: string | null | undefined;
            iconName?: string | null | undefined;
            src?: string | null | undefined;
            alt?: string | null | undefined;
            placeholder?: string | null | undefined;
            inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
            badgeVariant?: string | null | undefined;
        } | undefined;
        semanticRole?: string | undefined;
        ariaLabel?: string | undefined;
        relationships?: {
            alignsWith?: string[] | undefined;
            adjacentTo?: string[] | undefined;
        } | undefined;
    }, {
        type: "page" | "section" | "container" | "navbar" | "sidebar" | "header" | "footer" | "hero" | "card" | "grid" | "flex" | "button" | "heading" | "text" | "input" | "image" | "icon" | "badge" | "avatar" | "list" | "modal" | "form" | "stat" | "divider";
        id: string;
        parentId: string | null;
        name?: string | undefined;
        childIds?: string[] | undefined;
        position?: {
            x: number;
            y: number;
            relativeTo?: "parent" | "viewport" | "flow" | undefined;
        } | undefined;
        dimensions?: {
            width?: string | number | undefined;
            height?: string | number | undefined;
            minWidth?: string | number | undefined;
            maxWidth?: string | number | undefined;
            minHeight?: string | number | undefined;
            maxHeight?: string | number | undefined;
            aspectRatio?: number | undefined;
        } | undefined;
        layout?: {
            display?: "grid" | "flex" | "block" | "inline-block" | "absolute" | undefined;
            flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
            justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined;
            alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline" | undefined;
            gap?: string | number | undefined;
            flexWrap?: "nowrap" | "wrap" | "wrap-reverse" | undefined;
            gridTemplateColumns?: string | undefined;
            gridTemplateRows?: string | undefined;
            alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
        } | undefined;
        styles?: {
            color?: string | undefined;
            backgroundColor?: string | undefined;
            backgroundGradient?: string | undefined;
            opacity?: number | undefined;
            fontFamily?: string | undefined;
            fontSize?: string | number | undefined;
            fontWeight?: string | number | undefined;
            lineHeight?: string | number | undefined;
            letterSpacing?: string | number | undefined;
            textAlign?: "center" | "right" | "left" | "justify" | undefined;
            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
            margin?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
            border?: {
                width?: number | undefined;
                style?: "solid" | "dashed" | "dotted" | "none" | undefined;
                color?: string | undefined;
            } | undefined;
            borderRadius?: {
                topLeft?: number | undefined;
                topRight?: number | undefined;
                bottomRight?: number | undefined;
                bottomLeft?: number | undefined;
            } | undefined;
            boxShadow?: string | undefined;
            backdropFilter?: string | undefined;
            tokenRefs?: Record<string, string> | undefined;
        } | undefined;
        content?: {
            text?: string | null | undefined;
            iconName?: string | null | undefined;
            src?: string | null | undefined;
            alt?: string | null | undefined;
            placeholder?: string | null | undefined;
            inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
            badgeVariant?: string | null | undefined;
        } | undefined;
        semanticRole?: string | undefined;
        ariaLabel?: string | undefined;
        confidence?: number | undefined;
        relationships?: {
            alignsWith?: string[] | undefined;
            adjacentTo?: string[] | undefined;
        } | undefined;
    }>>;
    metadata: z.ZodObject<{
        sourceType: z.ZodEnum<["screenshot", "figma", "synthetic"]>;
        confidence: z.ZodDefault<z.ZodNumber>;
        extractedAt: z.ZodString;
        targetFrameworks: z.ZodDefault<z.ZodArray<z.ZodEnum<["react", "vanillajs", "flutter"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        sourceType: "screenshot" | "figma" | "synthetic";
        extractedAt: string;
        targetFrameworks: ("react" | "vanillajs" | "flutter")[];
    }, {
        sourceType: "screenshot" | "figma" | "synthetic";
        extractedAt: string;
        confidence?: number | undefined;
        targetFrameworks?: ("react" | "vanillajs" | "flutter")[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    viewport: {
        width: number;
        height: number;
        devicePixelRatio: number;
    };
    id: string;
    name: string;
    version: "1.0.0";
    rootNodeId: string;
    nodes: Record<string, {
        type: "page" | "section" | "container" | "navbar" | "sidebar" | "header" | "footer" | "hero" | "card" | "grid" | "flex" | "button" | "heading" | "text" | "input" | "image" | "icon" | "badge" | "avatar" | "list" | "modal" | "form" | "stat" | "divider";
        id: string;
        parentId: string | null;
        childIds: string[];
        position: {
            x: number;
            y: number;
            relativeTo: "parent" | "viewport" | "flow";
        };
        dimensions: {
            width: string | number;
            height: string | number;
            minWidth?: string | number | undefined;
            maxWidth?: string | number | undefined;
            minHeight?: string | number | undefined;
            maxHeight?: string | number | undefined;
            aspectRatio?: number | undefined;
        };
        layout: {
            display: "grid" | "flex" | "block" | "inline-block" | "absolute";
            flexDirection: "row" | "column" | "row-reverse" | "column-reverse";
            justifyContent: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
            alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
            gap: string | number;
            flexWrap: "nowrap" | "wrap" | "wrap-reverse";
            gridTemplateColumns?: string | undefined;
            gridTemplateRows?: string | undefined;
            alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
        };
        styles: {
            color?: string | undefined;
            backgroundColor?: string | undefined;
            backgroundGradient?: string | undefined;
            opacity?: number | undefined;
            fontFamily?: string | undefined;
            fontSize?: string | number | undefined;
            fontWeight?: string | number | undefined;
            lineHeight?: string | number | undefined;
            letterSpacing?: string | number | undefined;
            textAlign?: "center" | "right" | "left" | "justify" | undefined;
            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
            padding?: {
                top: number;
                right: number;
                bottom: number;
                left: number;
            } | undefined;
            margin?: {
                top: number;
                right: number;
                bottom: number;
                left: number;
            } | undefined;
            border?: {
                width: number;
                style: "solid" | "dashed" | "dotted" | "none";
                color: string;
            } | undefined;
            borderRadius?: {
                topLeft: number;
                topRight: number;
                bottomRight: number;
                bottomLeft: number;
            } | undefined;
            boxShadow?: string | undefined;
            backdropFilter?: string | undefined;
            tokenRefs?: Record<string, string> | undefined;
        };
        confidence: number;
        name?: string | undefined;
        content?: {
            text?: string | null | undefined;
            iconName?: string | null | undefined;
            src?: string | null | undefined;
            alt?: string | null | undefined;
            placeholder?: string | null | undefined;
            inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
            badgeVariant?: string | null | undefined;
        } | undefined;
        semanticRole?: string | undefined;
        ariaLabel?: string | undefined;
        relationships?: {
            alignsWith?: string[] | undefined;
            adjacentTo?: string[] | undefined;
        } | undefined;
    }>;
    metadata: {
        confidence: number;
        sourceType: "screenshot" | "figma" | "synthetic";
        extractedAt: string;
        targetFrameworks: ("react" | "vanillajs" | "flutter")[];
    };
}, {
    viewport: {
        width: number;
        height: number;
        devicePixelRatio?: number | undefined;
    };
    id: string;
    name: string;
    rootNodeId: string;
    nodes: Record<string, {
        type: "page" | "section" | "container" | "navbar" | "sidebar" | "header" | "footer" | "hero" | "card" | "grid" | "flex" | "button" | "heading" | "text" | "input" | "image" | "icon" | "badge" | "avatar" | "list" | "modal" | "form" | "stat" | "divider";
        id: string;
        parentId: string | null;
        name?: string | undefined;
        childIds?: string[] | undefined;
        position?: {
            x: number;
            y: number;
            relativeTo?: "parent" | "viewport" | "flow" | undefined;
        } | undefined;
        dimensions?: {
            width?: string | number | undefined;
            height?: string | number | undefined;
            minWidth?: string | number | undefined;
            maxWidth?: string | number | undefined;
            minHeight?: string | number | undefined;
            maxHeight?: string | number | undefined;
            aspectRatio?: number | undefined;
        } | undefined;
        layout?: {
            display?: "grid" | "flex" | "block" | "inline-block" | "absolute" | undefined;
            flexDirection?: "row" | "column" | "row-reverse" | "column-reverse" | undefined;
            justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly" | undefined;
            alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline" | undefined;
            gap?: string | number | undefined;
            flexWrap?: "nowrap" | "wrap" | "wrap-reverse" | undefined;
            gridTemplateColumns?: string | undefined;
            gridTemplateRows?: string | undefined;
            alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch" | undefined;
        } | undefined;
        styles?: {
            color?: string | undefined;
            backgroundColor?: string | undefined;
            backgroundGradient?: string | undefined;
            opacity?: number | undefined;
            fontFamily?: string | undefined;
            fontSize?: string | number | undefined;
            fontWeight?: string | number | undefined;
            lineHeight?: string | number | undefined;
            letterSpacing?: string | number | undefined;
            textAlign?: "center" | "right" | "left" | "justify" | undefined;
            textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | undefined;
            padding?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
            margin?: {
                top?: number | undefined;
                right?: number | undefined;
                bottom?: number | undefined;
                left?: number | undefined;
            } | undefined;
            border?: {
                width?: number | undefined;
                style?: "solid" | "dashed" | "dotted" | "none" | undefined;
                color?: string | undefined;
            } | undefined;
            borderRadius?: {
                topLeft?: number | undefined;
                topRight?: number | undefined;
                bottomRight?: number | undefined;
                bottomLeft?: number | undefined;
            } | undefined;
            boxShadow?: string | undefined;
            backdropFilter?: string | undefined;
            tokenRefs?: Record<string, string> | undefined;
        } | undefined;
        content?: {
            text?: string | null | undefined;
            iconName?: string | null | undefined;
            src?: string | null | undefined;
            alt?: string | null | undefined;
            placeholder?: string | null | undefined;
            inputType?: "number" | "text" | "email" | "password" | "search" | "textarea" | null | undefined;
            badgeVariant?: string | null | undefined;
        } | undefined;
        semanticRole?: string | undefined;
        ariaLabel?: string | undefined;
        confidence?: number | undefined;
        relationships?: {
            alignsWith?: string[] | undefined;
            adjacentTo?: string[] | undefined;
        } | undefined;
    }>;
    metadata: {
        sourceType: "screenshot" | "figma" | "synthetic";
        extractedAt: string;
        confidence?: number | undefined;
        targetFrameworks?: ("react" | "vanillajs" | "flutter")[] | undefined;
    };
    version?: "1.0.0" | undefined;
}>;
export type UIIRDocument = z.infer<typeof UIIRDocumentSchema>;
//# sourceMappingURL=ir.d.ts.map