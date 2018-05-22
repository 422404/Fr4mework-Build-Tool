const path = require('path');
const { checkFileExistence, rmdir } = require('./util.js');
const { collectModules } = require('./modules.js');

module.exports.clean = clean;

/**
 * Cleans current directory's modules build dirs
 */
function clean() {
    try {
        var modulesList = collectModules(path.resolve('.'));
        var modules = modulesList.buildables();
        modules.forEach(module => {
            if (checkFileExistence(module.builddir)) {
                if (checkFileExistence(path.join(module.builddir, 'fr4mebuild.json'))) {
                    console.log('Warning: Cannot delete a directory where a "fr4mebuild.json" file is present');
                    console.log(' -> ' + module.builddir);
                } else {
                    rmdir(module.builddir);
                }
            }
        });
    } catch (e) {
        console.log('An error occured while cleaning modules builds');
        console.log('Error info : ' + e);
    }
}