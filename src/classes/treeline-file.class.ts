const fs = require('fs').promises;
import path = require("path/posix");
import { Dir, Dirent } from "fs";
import { TreelineType } from "../enums/treeline-type.enum";
import { TreelineComment } from "../interfaces/treeline-comment.interface";
import { parseTreelineComment } from "../functions/parse-treeline-comment.function";
import { treelineRegister } from "../treeline-register";
import { TreelineContentFragment } from "../interfaces/treeline-content-fragment.interface";
import { TreelineIncludeGap } from "../interfaces/treeline-include-gap.interface";
import { JSDOM } from "jsdom";
import { TreelineError } from "../enums/treeline-error.enum";
import { parseIncludeGapComment } from "../functions/parse-include-gap-comment.function";

export default class TreelineFile {

    /**
     * An optional `TreelineFile` that is the parent layout of the current `TreelineFile`.
     */
    private parentLayout?: TreelineFile;

    /**
     * A `Map` of gaps where content should be included to, keyed by the name of the include gap.
     */
    private includeGaps = new Map <string, TreelineIncludeGap>();

    /**
     * A `Map` of content fragments that should be interpolated into include gaps, keyed by the name of the content fragment.
     */
    private contentFragments = new Map<string, TreelineContentFragment>();

    /**
     * The rendered output of the `TreelineFile`, ready to be written to disk.
     */
    private renderedContent?: string;

    /**
     * `TreelineFile` provides all the functionality necessary to render templates and pages into a functional build.
     * 
     * @param parent - The `Dir` which holds the resource.
     * @param resource - The `Dirent` itself, which is contained within the parent `Dir`.
     */
    private constructor(private parent: Dir, private resource: Dirent) { }

    /**
     * A static constructor for the `TreelineFile` class which evaluates the file's contents and determines the parent layout being used, if any, the include gaps present in the file, and the content fragments present in the file.
     * 
     * @param parent - The `Dir` which holds the resource.
     * @param resource - The `Dirent` itself, which is contained within the parent `Dir`.
     * 
     * @returns A `Promise` resolving to a hydrated instance of `TreelineFile`.
     */
    public static async init(parent: Dir, resource: Dirent): Promise<TreelineFile> {
        const tf = new TreelineFile(parent, resource);

        tf.parentLayout     = await tf.tlGetParentLayout();
        tf.contentFragments = await tf.tlGetContentFragments();

        return tf;
    }

    /**
     * Helper function that retrieves the label for the `TreelineFile`. This is usually the basename of the file, stripped of the '.html' suffix. For example, "colophon".
     * 
     * @returns The label for the `TreelineFile`, represented as a string.
     */
    public getLabel(): string {
        return path.parse(this.resource.name).name;
    }
    
    /**
     * Gets the parent layout of the current `TreelineFile` page. If the `TreelineFile` is not a page, or there is no parent layout set, this method will throw.
     * 
     * @returns The `TreelineFile` that is the parent layout of the current `TreelineFile`.
     */
    public getParentLayout(): TreelineFile {
        if (!this.parentLayout) {
            TreelineError.throwErr(TreelineError.NO_PARENT_LAYOUT, this.getLabel());
        }

        return this.parentLayout;
    }

    /**
     * Begins the treeline rendering pipeline. This should only be called on treeline pages. From here, navigate up the rendering stack to find the root parent layout, and then for each include gap in the layout, match it with an associated content fragment 
     * 
     * @param renderStack
     *  
     * @returns 
     */
    public async render(renderStack: TreelineFile[] = []): Promise<TreelineFile> {
        if (this.parentLayout) {
            return this.parentLayout.render([...renderStack, this]);
        }

        // Pop the child file off the render stack. This file contains the content fragments to be included in the parent.
        const child = renderStack.pop();

        const dom = await this.asDocumentOrDocumentFragment();
        this.includeGaps = await this.tlGetIncludeGaps(dom);

        for (const [key, value] of this.includeGaps) {
            const matchingContentFragment = child.contentFragments.get(key);
            if (!matchingContentFragment) {
                throw new Error('No matching content fragment!');
            }
            value.node.parentElement.insertBefore(matchingContentFragment.template.content, value.node.nextSibling);
        }

        child.renderedContent = (dom as Document).documentElement.outerHTML;
        return child;
    }

    /**
     * 
     */
    public async write(): Promise<void> {
        await fs.writeFile(this.getAbsolutePath(), this.renderedContent, 'utf-8');
    }

    /**
     * Gets the parent layout `TreelineFile`, if one exists. A parent layout can be determined by examining the first root comment in the `TreelineFile` DOM. This comment will be of the form: 
     * 
     * `<!-- treeline:layout:name -->` 
     * 
     * Where 'name' is the name of the parent layout file. If no such comment exists in this location, no layout file exists.
     * 
     * @returns A `Promise` resolving to a `TreelineFile`.
     */
    private async tlGetParentLayout(): Promise<TreelineFile> {
        const rootComment = await this.tlGetLayoutComment();

        if (!rootComment) {
            return;
        }

        if (rootComment.scenario !== 'extends') {
            TreelineError.throwErr(TreelineError.ROOT_DIRECTIVE_IS_NOT_LAYOUT, this.getLabel());
        }

        if (!treelineRegister.layouts.has(rootComment.value)) {
            TreelineError.throwErr(TreelineError.LAYOUT_DOES_NOT_EXIST, this.getLabel(), rootComment.value);
        }

        return treelineRegister.layouts.get(rootComment.value);
    }

    /**
     * 
     * @returns 
     */
    private getAbsolutePath(): string {
        return path.resolve(this.parent.path, this.resource.name);
    }

    /**
     * Gets the layout comment from the `TreelineFile`, if this file is of type 'Page'. Layouts are not expected
     * to have their own layout comments.
     * 
     * @returns A `Promise` resolving to a `TreelineComment`, or `null`, if no such root comment exists.
     */
    private async tlGetLayoutComment(): Promise<TreelineComment | null> {
        const dom = await this.asDocumentOrDocumentFragment();
        const node = dom.firstChild;
    
        if (!node) {
            return null;
        }

        if (node.nodeType === node.COMMENT_NODE) {
            try {
                return parseTreelineComment(node);
            } catch (err) {
                return null;
            }
        }
    }

    /**
     * Retrieves the includes gaps where content fragments shall be inserted into the template.
     * 
     * @param name 
     */
    private tlGetIncludeGaps(from: Document|DocumentFragment): Map<string, TreelineIncludeGap> {
        const includeGaps = new Map<string, TreelineIncludeGap>();
        this.appendIncludeGaps(from, includeGaps);
        return includeGaps;
    }

    /**
     * 
     * @param node - 
     * @param map -
     */
    private appendIncludeGaps(node: Node, map: Map<string, TreelineIncludeGap>): void {
        try {
            const includeGap = parseIncludeGapComment(node);
            map.set(includeGap.tlComment.value, includeGap);
        } catch {
            for (const childNode of node.childNodes) {
                this.appendIncludeGaps(childNode, map);
            }
        }
    }

    /**
     * Retrieves the content fragments in the `TreelineFile`, which are marked by the existence of `HTMLTemplateElement`'s containing a `treelineContents` `dataset` property, like so:
     * 
     * <template data-treeline-contents="label">
     * 
     * If the value of `treelineContents` is empty, then 'default' will be assumed.
     * 
     * @returns A `Promise` resolving to a `Map` of `TreelineContentFragment`'s, keyed by the fragment identifier.
     */
    private async tlGetContentFragments(): Promise<Map<string, TreelineContentFragment>> {
        const dom = await this.asDocumentOrDocumentFragment();
        const contentFragments = new Map<string, TreelineContentFragment>();

        for (const childNode of dom.childNodes) {
            if (childNode.nodeType !== childNode.ELEMENT_NODE) {
                continue;
            }

            const elementNode = childNode as HTMLElement;
            if (elementNode.tagName === 'TEMPLATE' && 'treelineContents' in elementNode.dataset) {
                const label = elementNode.dataset['treelineContents'] || 'default';

                contentFragments.set(label, {
                    label,
                    template: elementNode as HTMLTemplateElement
                });
            }
        }

        return contentFragments;
    }

    /**
     * Reads the contents of the file, and attempts to either create a `Document` or `DocumentFragment` from the contents, depending on the disposition of the file. The rationale for this logic is the unideal property of `Document`'s which do not have <html>, <head>, and <body> elements will have them automatically inserted, likewise, `DocumentFragment`'s do not appear to be able to have these elements if they exist.
     * 
     * @returns A `Promise` resolving to either a `Document`, or a `DocumentFragment`, depending on the contents of the file. 
     */
    private async asDocumentOrDocumentFragment(): Promise<Document|DocumentFragment> {
        const contents = await fs.readFile(this.getAbsolutePath(), 'utf-8');
        const tryAsJsDom = new JSDOM(contents);
        return tryAsJsDom.window.document.doctype ? tryAsJsDom.window.document : JSDOM.fragment(contents);
    }

    /**
     * 
     * @param parentNode
     * 
     * @returns 
     */
    private async comments(parentNode: Node|null = null): Promise<Node[]> {
        // parentNode = parentNode ?? (await this.asDOM()).window.document;

        return [];
    }
} 