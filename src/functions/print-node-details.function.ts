export const printNodeDetails = (node: Node): string => {
    switch (node.nodeType) {
        case node.COMMENT_NODE: 
            return `Comment ('${node.nodeValue}')`;
        case node.ELEMENT_NODE:
            return `Element (${(node as Element).nodeName.toLowerCase()})`;
        case node.DOCUMENT_TYPE_NODE:
            return `Doctype ('${(node as DocumentType).name}')`;
        default:
            return `NodeType ${node.nodeType}`;
    }
}