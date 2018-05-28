const fs = require('fs');
const path = require('path');
const { checkFileExistence } = require('./util.js');
const { collectModules } = require('./modules.js');
const { preprocessor } = require('./preprocessor.js');

module.exports.build = build;

/**
 * Builds current directory's modules
 * @param {boolean} preprocess true to preprocess modules files
 */
function build(preprocess) {
    try {
        var startDate = Date.now();
        console.log('Listing modules...');
        var modules = collectModules(path.resolve('.')).buildables();

        console.log('Building modules...');
        modules.forEach(module => {
            if (!checkFileExistence(module.builddir)) {
                fs.mkdirSync(module.builddir);
            }

            if (preprocess) {
                // preprocess the module's files
                module = preprocessor(module);
            }

            var concatenated = module.files.concat();
            concatenated.save(module.builddir, module.name + '.js');
        });

        var endDate = Date.now();
        var ellapsedSeconds = (endDate - startDate) / 1000.0;
        console.log('Done in ' + ellapsedSeconds + ' sec');
    } catch (e) {
        console.log("Build error !");
        console.log('Error info: ' + e);
    }
}