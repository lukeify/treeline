const fs = require('fs').promises;
import { Dir, Dirent } from "fs";
import { PluginOptimizeOptions, SnowpackPlugin } from "snowpack";
import { TreelineOptions } from "./interfaces/treeline-options.interface";
import path = require('path');
import TreelineFile from "./classes/treeline-file.class";
import { treelineRegister } from "./treeline-register";


module.exports = function (snowpackPlugin: SnowpackPlugin, pluginOptions: TreelineOptions) {
    return {
        name: 'treeline',
        async optimize(optimizeOpts: PluginOptimizeOptions) {
            const buildDir      = await resolveDir(optimizeOpts.buildDirectory);
            const templateDir   = await resolveDir(optimizeOpts.buildDirectory, pluginOptions.templateDir);

            treelineRegister.layouts = await tlGetTemplates(templateDir);
            const treelinePages = await tlGetPages(buildDir, new Set([templateDir]));

            for (const treelinePage of treelinePages) {
                treelinePage.render().then(tp => tp.write());
            }
        }
    };
}; 

/**
 * 
 * @param paths - An `array` of 
 * 
 * @returns A `Promise` resolving to a `Dir` representation of the template directory. This can be used to avoid scanning the directory for HTML files to include.
 */
const resolveDir = async function(...paths: string[]): Promise<Dir> {
    return await fs.opendir(path.resolve(...paths));
}

/**
 * @param templateDirectory -
 * 
 * @returns A `Promise` resolving to a `Map` of template `TreelineFile`'s, keyed by the name of the template. 
 */
const tlGetTemplates = async function (templateDirectory: Dir): Promise<Map<string, TreelineFile>> {
    const templateFiles = await tlGetFiles(templateDirectory);

    return templateFiles.reduce((map, tf) => {
        map.set(tf.getLabel(), tf);
        return map;
    }, new Map<string, TreelineFile>());
}

/**
 * 
 * @param directory - The `Dir` that should be searched for files. 
 * @param excludes - The `Dir` that should be excluded from searching.
 * 
 * @returns A `Promise` resolving to an array of the `TreelineFile`'s representing pages that should 
 * be generated into HTML files.
 */
const tlGetPages = async function (directory: Dir, excludes: Set<Dir>): Promise<TreelineFile[]> {
    const excludesAsBaseNames = new Set<string>();
    for (const excludedDir of excludes.values()) {
        excludesAsBaseNames.add(path.basename(excludedDir.path));
    }
    
    const dirents = await fs.readdir(directory.path, { withFileTypes: true });
    
    let files: TreelineFile[] = [];
    for (const dirent of dirents) {
        // Avoid any dirents that have been excluded from processing.
        if (excludesAsBaseNames.has(dirent.name)) {
            continue;
        }

        if (isHtmlFile(dirent)) {
            files = [...files, await TreelineFile.init(directory, dirent)];
            continue;
        }

        if (dirent.isDirectory()) {
            const childDir = await fs.opendir(path.resolve(directory.path, dirent.name));
            files = [...files, ...await tlGetFiles(childDir)];
        }
    }

    return files;
}

/**
 * 
 * @param directory -
 * @param files -
 * 
 * @returns A Promise resolving to an array of the HTML files in the 
 */
const tlGetFiles = async function (directory: Dir, files: TreelineFile[] = []): Promise<TreelineFile[]> {
    const entries = await fs.readdir(directory.path, { withFileTypes: true });
    files = [
        ...files,
        ...await Promise.all(
            entries
                .filter((e: Dirent) => isHtmlFile(e))
                .map((e: Dirent) => TreelineFile.init(directory, e))
        )
    ];

    for (const dir of entries.filter((e: Dirent) => e.isDirectory())) {
        files = await tlGetFiles(dir, files);
    }

    return files;
}

/**
 * 
 * @param entry 
 * 
 * @returns `true` if the `Dirent` provided is an HTML file, `false` otherwise.
 */
const isHtmlFile = function(entry: Dirent): boolean {
    return entry.isFile() && path.extname(entry.name) === '.html';
}