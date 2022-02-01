export enum TreelineError {
    NO_PARENT_LAYOUT,
    ROOT_DIRECTIVE_IS_NOT_LAYOUT,
    LAYOUT_DOES_NOT_EXIST,
    NOT_A_COMMENT,
    NOT_TREELINE_COMMENT,
    INVALID_SCENARIO
}

export namespace TreelineError {
    export function throwErr(err: TreelineError, ...args: string[]): never {
        switch (err) {
            case TreelineError.NO_PARENT_LAYOUT:
                throw new Error(`No parent layout has been set for page ${args[0]}.`);
                
            case TreelineError.ROOT_DIRECTIVE_IS_NOT_LAYOUT:
                throw new Error(`The root treeline directive of page '${args[0]}' must be a 'treeline:layout' comment.`);
            
            case TreelineError.LAYOUT_DOES_NOT_EXIST:
                throw new Error(`The root treeline directive for '${args[0]}' specifies an invalid layout '${args[1]}'.`);
            
            case TreelineError.NOT_A_COMMENT:
                throw new Error(`Node is not a Comment.`);
            
            case TreelineError.NOT_TREELINE_COMMENT:
                throw new Error(`Comment is not a TreelineComment.`);
            
            case TreelineError.INVALID_SCENARIO:
                throw new Error(`'${args[0]} is not a valid TreelineComment scenario.`);
            
            default:
                throw new Error('Unknown treeline error.');
        }
    }
} 