const fs = require('fs');
const path = require('path');

module.exports.checkFileExistence = checkFileExistence;
module.exports.rmdir = rmdir;
module.exports.copyDirectory = copyDirectory;
module.exports.loadBuildCfg = loadBuildCfg;
module.exports.mkdir = mkdir;

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
 * Creates a full path to a directory
 * @param {string} dir path to the directory to create
 */
function mkdir(dir) {
    if (!checkFileExistence(dir)) {
        var dirName = '';
        var dirSplit = dir.split(path.sep);

        for (var index = 0; index < dirSplit.length; index++) {
            dirName += dirSplit[index] + path.sep;
            if (!checkFileExistence(dirName)) {
                fs.mkdirSync(dirName);
            }
        }
    }
}

/**
 * Copies a directory recursively
 * @param {string} src source directory to copy
 * @param {string} dest destination directory to be created/updated
 */
function copyDirectory(src, dest) {
    if (!checkFileExistence(dest)) {
        fs.mkdirSync(dest);
    }
	var files = fs.readdirSync(src);
	for(var i = 0; i < files.length; i++) {
		var current = fs.lstatSync(path.join(src, files[i]));
		if(current.isDirectory()) {
			copyDirectory(path.join(src, files[i]), path.join(dest, files[i]));
		} else {
			fs.copyFileSync(path.join(src, files[i]), path.join(dest, files[i]));
		}
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