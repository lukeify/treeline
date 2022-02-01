import { TreelineError } from "../enums/treeline-error.enum"
import { TreelineIncludeGap } from "../interfaces/treeline-include-gap.interface";
import { parseTreelineComment } from "./parse-treeline-comment.function";

export const parseIncludeGapComment = (node: Node): TreelineIncludeGap => {
    if (node.nodeType !== node.COMMENT_NODE) {
        TreelineError.throwErr(TreelineError.NOT_A_COMMENT);
    }

    const tlComment = parseTreelineComment(node);

    if (tlComment.scenario !== 'includes') {
        TreelineError.throwErr(TreelineError.INVALID_SCENARIO);
    }

    return { tlComment, node };
}