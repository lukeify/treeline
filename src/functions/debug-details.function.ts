import TreelineFile from "../classes/treeline-file.class"

/**
 * 
 * @param tf 
 * @param methodName 
 * @param message 
 */
export const debugDetails = (tf: TreelineFile, methodName: string, message: string): void => {
    console.log(`[${tf.getLabel()}] [${methodName}] ${message}`);
}