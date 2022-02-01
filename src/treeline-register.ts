import TreelineFile from "./classes/treeline-file.class";

export const treelineRegister: TreelineRegister = {
    layouts: new Map(),
    pages: new Map()
};

interface TreelineRegister {
    layouts: Map<string, TreelineFile>;
    pages: Map<string, TreelineFile>;
}