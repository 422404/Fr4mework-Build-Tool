const fs = require('fs');
const path = require('path');

module.exports.collectModules = collectModules;
module.exports.checkFileExistence = checkFileExistence;
module.exports.rmdir = rmdir;

/**
 * Checks if a file or directory exists
 * @param {string} file file or dir to check
 * @returns {boolean} whether the file or dir exists
 */
function checkFileExistence(filePath) {
    try {
        fs.accessSync(filePath);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Recursively delete a directory unlike Node's native rmdir
 * @param {string} path directory to delete
 */
function rmdir(dirPath) {
    var files = [];
    if (checkFileExistence(dirPath)) {
        files = fs.readdirSync(dirPath);
        files.forEach(file => {
            var curPath = path.join(dirPath, file);

            if(fs.lstatSync(curPath).isDirectory()) {
                rmdir(curPath); // recurse
            } else {
                fs.unlinkSync(curPath); // delete file
            }
        });
        fs.rmdirSync(dirPath);
    }
};

/**
 * Deserialize a fr4mebuild.json
 * @param {string} dir directory from where the fr4mebuild.json will be loaded
 * @returns {object} deserialized fr4mebuild.json
 */
function loadBuildCfg(dir) {
    try {
        var buildCfg = require(path.join(dir, 'fr4mebuild.json'));
    } catch (e) {
        throw 'No fr4mebuild.json file in directory: ' + dir;
    }

    return buildCfg;
}

/**
 * Collect modules from a fr4mebuild.json file in a directory
 * @param {string} path path to the directory containing fr4mebuild.json
 * @returns {ModuleLists} modules list
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
    }

    /**
     * Returns only the buildables modules
     * i.e: those with builddir and files properties not null
     * @returns buildables modules
     */
    this.buildables = function () {
        return this.modules.filter(module => module.builddir && module.files);
    }
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

/**
 * Represents a list of files
 * @param {string[]} filesPaths files paths
 */
function Files(filesPaths) {
    this.files = filesPaths;

    /**
     * Add files paths to the list
     * @param {string[]} filesPaths files paths to be added
     * @returns {File} this
     */
    this.add = function (filesPaths) {
        this.files = this.files.concat(filesPaths);
        return this;
    }

    /**
     * Concatenate the listed files
     * @returns {ConcatenatedFiles} an object representing the concatenated files
     */
    this.concat = function () {
        var text = this.files.map(filePath => fs.readFileSync(filePath)).join("\n");

        return new ConcatenatedFiles(text);
    }
}

/**
 * Represents concatenated files
 * @param {string} text text from the concatenated files
 */
function ConcatenatedFiles(text) {
    this.text = text.replace(/\r\n/g, "\n"); // enforce Unix-style line ending
    this.prepend = '';
    this.append = '';

    /**
     * Set the text to append the concatenated text with
     * @param {string} text text to append the concatenated text with
     */
    this.setAppend = function (text) {
        this.append = "\n" + text.replace(/\r\n/g, "\n"); // enforce Unix-style line ending
    }

    /**
     * Set the text to prepend the concatenated text with
     * @param {string} text text to prepend the concatenated text with
     */
    this.setPrepend = function (text) {
        this.prepend = text.replace(/\r\n/g, "\n") + "\n"; // enforce Unix-style line ending
    }

    /**
     * Saves the files in a given directory
     * @param {string} dirname directory where the file will be saved
     * @param {string} filename name of the saved file
     * @returns {ConcatenatedFiles} this
     */
    this.save = function (dirname, filename) {
        fs.writeFileSync(path.join(dirname, filename), this.prepend + this.text + this.append);
        return this;
    }
}