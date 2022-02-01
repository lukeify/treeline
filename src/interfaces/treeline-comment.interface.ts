export type TreelineCommentScenario = 'extends' | 'includes';

export interface TreelineComment {
    scenario: TreelineCommentScenario;
    value: string;
}