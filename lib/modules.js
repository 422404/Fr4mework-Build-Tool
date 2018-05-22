const fs = require('fs');
const path = require('path');
const { loadBuildCfg } = require('./util.js');
const { Files } = require('./files.js');

module.exports.collectModules = collectModules;
module.exports.Module = Module;
module.exports.ModulesList = ModulesList;

/**
 * Collect modules from a fr4mebuild.json file in a directory
 * @param {string} path path to the directory containing fr4mebuild.json
 * @returns {ModulesList} modules list
 */
function collectModules(buildConfigPath) {
    var modules = [];
    collectModulesRec(buildConfigPath, modules);

    return new ModulesList(modules);
}

/**
 * Collect recursively modules from a fr4mebuild.json file
 * @param {string} path path to the directory containing fr4mebuild.json
 * @param {array} modules array where modules are pushed
 */
function collectModulesRec(buildConfigPath, modules) {
    var buildCfg = loadBuildCfg(buildConfigPath);

    if (!buildCfg.name) {
        throw 'No "name" property in fr4mebuild.json in directory: ' + buildConfigPath;
    }
    if (buildCfg.build) {
        if (buildCfg.build.files) {
            if (!buildCfg.build.builddir) {
                throw 'No "build.builddir" property in fr4mebuild.json in directory: ' + buildConfigPath;
            }
            modules.push(new Module(buildCfg.name, buildConfigPath, buildCfg.build.builddir, buildCfg.build.files,
                    buildCfg.build.prepend, buildCfg.build.append));
        }
    
        if (buildCfg.build.modules) {
            buildCfg.build.modules.forEach(modulePath => {
                collectModulesRec(path.join(buildConfigPath, modulePath), modules);
            });
        }
    }
}

/**
 * Represents a list of modules
 * @param {Module[]} modules modules to add to the list
 */
function ModulesList(modules) {
    this.modules = modules;

    /**
     * Returns all modules in the list
     * @returns all the modules in the list
     */
    this.all = function () {
        return this.modules;
    };

    /**
     * Returns only the buildables modules
     * i.e: those with builddir and files properties not null
     * @returns buildables modules
     */
    this.buildables = function () {
        return this.modules.filter(module => module.builddir && module.files);
    };
}

/**
 * Represents a module
 * @param {string} name module's name
 * @param {string} modulePath module's path
 * @param {string} builddir module's build directory
 * @param {string[]} files module's files paths
 * @param {string} prependFile filename of the text to prepend to the final concatenated file
 * @param {string} appendFile filename of thetext to append to the final concatenated file
 */
function Module(name, modulePath, builddir, files, prependFile, appendFile) {
    this.name = name;
    this.path = modulePath;
    this.builddir = builddir
                    ? path.join(modulePath, builddir)
                    : null;
    this.files = files
                 ? new Files(files.map(relativePath => path.join(modulePath, relativePath)))
                 : null;
    this.prepend = prependFile
                   // we use toString() because it could be a Buffer instance
                   ? fs.readFileSync(path.join(modulePath, prependFile)).toString()
                   : null;
    this.append = appendFile
                  ? fs.readFileSync(path.join(modulePath, appendFile)).toString()
                  : null;
}