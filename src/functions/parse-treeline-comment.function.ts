import { TreelineError } from "../enums/treeline-error.enum";
import { TreelineComment, TreelineCommentScenario } from "../interfaces/treeline-comment.interface";

/**
 * 
 * @param commentNode 
 * @returns 
 */
export const parseTreelineComment = (commentNode: Node): TreelineComment => {
    const matches = [...commentNode.nodeValue.trim().matchAll(/treeline:(extends|includes):(.+)/g)];

    if (matches.length === 0) {
        TreelineError.throwErr(TreelineError.NOT_TREELINE_COMMENT);
    }

    const scenario = matches[0][1];
    if (!isValidTreelineScenario(scenario)) {
        TreelineError.throwErr(TreelineError.INVALID_SCENARIO, scenario);
    }

    return { scenario, value: matches[0][2] };
}

/**
 * 
 * @param str 
 * 
 * @returns 
 */
const isValidTreelineScenario = (str: string): str is TreelineCommentScenario => {
    return ['extends', 'contents', 'includes'].some(s => s === str);
}