const path = require('path');
const { collectModules } = require('./modules.js');

module.exports.list = list;

/**
 * Lists available modules in current directory
 * @param {boolean} all false to omit non-buildables modules
 */
function list(all) {
    try {
        var curDir = path.resolve('.');
        var modulesList = collectModules(curDir);
        var modules = all ? modulesList.all() : modulesList.buildables();
        modules.forEach(module => {
            var relativePath = path.relative(curDir, module.path);
            if (relativePath.length == 0) {
                relativePath = '.';
            }
            console.log(module.name + ' : ' + relativePath);
        });
    } catch (e) {
        console.log('An error occured while listing modules');
        console.log('Error info : ' + e);
    }
}