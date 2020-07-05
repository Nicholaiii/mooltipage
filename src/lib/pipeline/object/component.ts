import { PipelineObject } from "./pipelineObject";
import { DocumentNode } from "../../dom/node";
import { EvalContext, EvalContent } from "../evalEngine";

export class Component implements PipelineObject {
    readonly resId: string;

    /**
     * Template section for this component
     */
    readonly template: ComponentTemplate;

    /**
     * Script section for this component
     */
    readonly script: ComponentScript;

    /**
     * Style section for this component, if preset.  Will be undefined if this component does not have a style section.
     */
    readonly style?: ComponentStyle;

    constructor(resId: string, template: ComponentTemplate, script: ComponentScript, style?: ComponentStyle) {
        this.resId = resId;
        this.template = template;
        this.script = script;
        this.style = style;
    }

    clone(): Component {
        const newTemplate: ComponentTemplate = this.template.clone();
        const newScript: ComponentScript = this.script.clone();
        const newStyle: ComponentStyle | undefined = this.style?.clone();

        const newComponent: Component = new Component(this.resId, newTemplate, newScript, newStyle);

        return newComponent;
    }
}

export class ComponentTemplate {
    /**
     * DOM for this component template
     */
    readonly dom: DocumentNode;

    /**
     * Resource ID of the external source for this template, if applicable.
     * Will be undefined for internal (single file) components.
     */
    readonly srcResId?: string;

    constructor(dom: DocumentNode, srcResId?: string) {
        this.dom = dom;
        this.srcResId = srcResId;
    }

    /**
     * Clones this template
     */
    clone(): ComponentTemplate {
        const newDom: DocumentNode = this.dom.clone(true);

        const newTemplate: ComponentTemplate = new ComponentTemplate(newDom, this.srcResId);

        return newTemplate;
    }
}

export class ComponentScript {
    /**
     * Type of this script.
     * @see {@link ComponentScriptType}
     */
    readonly type: ComponentScriptType;
    
    /**
     * Resource ID of the external source for this script, if applicable.
     * Will be undefined for internal (single file) components.
     */
    readonly srcResId?: string;

    readonly scriptFunction: EvalContent<ComponentScriptInstance>;

    constructor(type: ComponentScriptType, scriptFunction: EvalContent<ComponentScriptInstance>, srcResId?: string) {
        this.type = type;
        this.scriptFunction = scriptFunction;
        this.srcResId = srcResId;
    }

    /**
     * Clones this script
     */
    clone(): ComponentScript {
        return new ComponentScript(this.type, this.scriptFunction, this.srcResId);
    }
}

/**
 * Recognized types of component script implementations
 */
export enum ComponentScriptType {
    /**
     * A component script implemented as an ES6 class
     */
    CLASS = 'class',

    /**
     * A component script implement as a tradition JS function
     */
    FUNCTION = 'function'
}

/**
 * A function that will execute the backing script of a component, and return the resulting object to use for compilation
 */
export type ComponentScriptRunner = (context: EvalContext) => ComponentScriptInstance;

/**
 * An instance of the backing code for a component
 */
export type ComponentScriptInstance = Record<string, unknown>;

/**
 * The style section of a component
 */
export class ComponentStyle {
    /**
     * The CSS stylesheet for this component
     */
    readonly styleContent: string;

    /**
     * Binding type for this stylesheet.
     * @see {@link ComponentStyleBindType}
     */
    readonly bindType: ComponentStyleBindType;

    /**
     * Resource ID of the external source for this stylesheet, if applicable.
     * Will be undefined for internal (single file) components.
     */
    readonly srcResId?: string;

    constructor(styleContent: string, bindType: ComponentStyleBindType, srcResId?: string) {
        this.styleContent = styleContent;
        this.bindType = bindType;
        this.srcResId = srcResId;
    }

    /**
     * Clones this component style
     */
    clone(): ComponentStyle {
        return new ComponentStyle(this.styleContent, this.bindType, this.srcResId);
    }
}

/**
 * Recognised binding types for component style sections
 */
export enum ComponentStyleBindType {
    /**
     * Stylesheet will be placed in an inline <style> block in the page <head> section.
     */
    HEAD = 'head',

    /**
     * Stylesheet will be placed in an external CSS file and referenced via a <link> tag.
     */
    LINK = 'link'
}