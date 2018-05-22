const fs = require('fs');
const path = require('path');
const { checkFileExistence } = require('./util.js');
const { collectModules } = require('./modules.js');
const { preprocessor } = require('./preprocessor.js');

module.exports.build = build;

/**
 * Builds current directory's modules
 * @param {boolean} preprocessDev if true the __LINE__ and __FILE__ variable's values will
 *                                be those of the non concatened file
 */
function build(preprocessDev) {
    try {
        var startDate = Date.now();
        console.log('Listing modules...');
        var modules = collectModules(path.resolve('.')).buildables();

        console.log('Building modules...');
        modules.forEach(module => {
            if (!checkFileExistence(module.builddir)) {
                fs.mkdirSync(module.builddir);
            }

            if (preprocessDev) { // preprocess the module's files
                module = preprocessor(module);
            }

            var concatenated = module.files.concat();
            if (!preprocessDev) { // preprocess the final concatenated file
                concatenated = preprocessor(concatenated);
            }

            if (module.prepend) {
                concatenated.setPrepend(module.prepend);
            }
            if (module.append) {
                concatenated.setAppend(module.append);
            }

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