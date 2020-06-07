import * as NodeTools from './nodeTools';

export enum NodeType {
    Tag = 'tag',
    Text = 'text',
    Comment = 'comment',
    CDATA = 'cdata',
    ProcessingInstruction = 'processinginstruction',
    Document = 'document'
}

export abstract class Node {
    readonly nodeType: NodeType;

    parentNode: NodeWithChildren | null = null;

    prevSibling: Node | null = null;
    nextSibling: Node | null = null;

    constructor(nodeType: NodeType) {
        this.nodeType = nodeType;
    }

    appendSibling(node: Node): void {
        NodeTools.appendSibling(node, this);
    }
    prependSibling(node: Node): void {
        NodeTools.prependSibling(node, this);
    }

    removeSelf(): void {
        NodeTools.detatchNode(this);
    }
    replaceSelf(...nodes: Node[]): void {
        NodeTools.replaceNode(this, nodes);
    }

    abstract clone(deep?: boolean, callback?: (oldNode: Node, newNode: Node) => void): Node;
}

export abstract class NodeWithChildren extends Node {
    childNodes: Node[] = [];

    get firstChild(): Node | null {
        return NodeTools.getFirstChild(this.childNodes);
    }

    get lastChild(): Node | null {
        return NodeTools.getLastChild(this.childNodes);
    }

    getChildTags(): TagNode[] {
        return NodeTools.getChildTags(this);
    }
    
    appendChild(child: Node): void {
        NodeTools.appendChild(this, child);
    }
    prependChild(child: Node): void {
        NodeTools.prependChild(this, child);
    }
    removeChild(child: Node): void {
        NodeTools.detatchNode(child);
    }
    clear(): void {
        NodeTools.clear(this);
    }
    appendChildren(children: Node[]): void {
        NodeTools.appendChildNodes(this, children);
    }

    findChildNode(matcher: (node: Node) => boolean, deep = true): Node | null {
        return NodeTools.findChildNode(this, matcher, deep);
    }
    findChildNodes(matcher: (node: Node) => boolean, deep = true): Node[] {
        return NodeTools.findChildNodes(this, matcher, deep);
    }
    findTopLevelChildNodes(matcher: (node: Node) => boolean): Node[] {
        return NodeTools.findTopLevelChildNodes(this, matcher);
    }

    findChildTag(matcher: (tag: TagNode) => boolean, deep = true): TagNode | null {
        return NodeTools.findChildTag(this, matcher, deep);
    }
    findChildTags(matcher: (tag: TagNode) => boolean, deep = true): TagNode[] {
        return NodeTools.findChildTags(this, matcher, deep);
    }
    findTopLevelChildTags(matcher: (node: TagNode) => boolean): TagNode[] {
        return NodeTools.findTopLevelChildTags(this, matcher);
    }
    
    findChildTagsByPath(matchers: ((tag: TagNode) => boolean)[]): TagNode[] {
        return NodeTools.findChildTagsByPath(this, matchers);
    }

    walkDom(callback: (node: Node) => void): void {
        NodeTools.walkDom(this, callback);
    }

    static isNodeWithChildren(node: Node): node is NodeWithChildren {
        return node.nodeType === NodeType.CDATA || node.nodeType === NodeType.Tag || node.nodeType === NodeType.Document;
    }
}

export abstract class NodeWithText extends Node {
    text: string;

    constructor(nodeType: NodeType, text: string) {
        super(nodeType);
        this.text = text;
    }

    static isNodeWithText(node: Node): node is NodeWithText {
        return node.nodeType === NodeType.Text || node.nodeType === NodeType.Comment;
    }
}

export abstract class NodeWithData extends Node {
    data: string;

    constructor(nodeType: NodeType, data: string) {
        super(nodeType);
        this.data = data;
    }

    static isNodeWithData(node: Node): node is NodeWithData {
        return node.nodeType === NodeType.ProcessingInstruction;
    }
}

export class TagNode extends NodeWithChildren {
    tagName: string;
    attributes: Map<string, string | null>;

    constructor(tagName: string, attributes?: Map<string, string | null>) {
        super(NodeType.Tag);
        this.tagName = tagName;
        this.attributes = attributes ?? new Map<string, string | null>();
    }

    hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }

    clone(deep = true, callback?: (oldNode: Node, newNode: Node) => void): TagNode {
        return NodeTools.cloneTagNode(this, deep, callback);
    }

    static isTagNode(node: Node): node is TagNode {
        return node.nodeType === NodeType.Tag;
    }
}

export class TextNode extends NodeWithText {
    constructor(text = '') {
        super(NodeType.Text, text);
    }

    clone(deep?: boolean, callback?: (oldNode: Node, newNode: Node) => void): TextNode {
        return NodeTools.cloneTextNode(this, callback);
    }

    static isTextNode(node: Node): node is TextNode {
        return node.nodeType === NodeType.Text;
    }
}

export class CommentNode extends NodeWithText {
    constructor(text = '') {
        super(NodeType.Comment, text);
    }

    clone(deep?: boolean, callback?: (oldNode: Node, newNode: Node) => void): CommentNode {
        return NodeTools.cloneCommentNode(this, callback);
    }

    static isCommentNode(node: Node): node is CommentNode {
        return node.nodeType === NodeType.Comment;
    }
}

export class CDATANode extends NodeWithChildren {
    constructor() {
        super(NodeType.CDATA);
    }

    clone(deep = true, callback?: (oldNode: Node, newNode: Node) => void): CDATANode {
        return NodeTools.cloneCDATANode(this, deep, callback);
    }

    static isCDATANode(node: Node): node is CDATANode {
        return node.nodeType === NodeType.CDATA;
    }
}

export class ProcessingInstructionNode extends NodeWithData {
    name: string;

    constructor(name = '', data = '') {
        super(NodeType.ProcessingInstruction, data);
        this.name = name;
    }

    clone(deep?: boolean, callback?: (oldNode: Node, newNode: Node) => void): ProcessingInstructionNode {
        return NodeTools.cloneProcessingInstructionNode(this, callback);
    }

    static isProcessingInstructionNode(node: Node): node is ProcessingInstructionNode {
        return node.nodeType === NodeType.ProcessingInstruction;
    }
}

export class DocumentNode extends NodeWithChildren {
    constructor() {
        super(NodeType.Document);
    }

    clone(deep = true, callback?: (oldNode: Node, newNode: Node) => void): DocumentNode {
        return NodeTools.cloneDocumentNode(this, deep, callback);
    }

    static isDocumentNode(node: Node): node is DocumentNode {
        return node.nodeType === NodeType.Document;
    }
}