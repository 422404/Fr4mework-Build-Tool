const fs = require('fs');
const path = require('path');
const readline = require('readline');
const stream = require('stream');
const { Files, ConcatenatedFiles } = require('./files.js');
const { checkFileExistence, mkdir } = require('./util.js');
const { Module } = require('./modules.js');

module.exports.preprocessor = preprocessor;

const REGEX_DEFINE = /^\/\/\#define /;
const REGEX_IFDEF =  /^\/\/\#ifdef /;
const REGEX_IFNDEF = /^\/\/\#ifndef /;
const REGEX_ENDIF =  /^\/\/\#endif /;

const REGEX_VARNAME = /[a-z0-9]/i;

/**
 * Process module's files or concatenated files a bit like C preprocessor
 * @param {Module|ConcatenatedFiles} target target to process
 * @returns {Module|ConcatenatedFiles} processed copy of the target
 */
function preprocessor(target) {
    if (target instanceof Module) {
        return processModuleFiles(target, {});
    } else if (target instanceof ConcatenatedFiles) {
        return processConcatenatedFiles(target, {});
    }

    throw 'Target is not a Module or ConcatenatedFiles instance';
}

/**
 * Processes module's files
 * @param {Module} module the module to process the files
 * @param {object} defines object where variable definitions are stored
 * @returns {Module} processed copy of the module
 */
function processModuleFiles(module, defines) {
    // we copy the module object (not a deep copy)
    var moduleCopy = Object.assign({}, module);

    // we create an array like [originalPath, tempPath]
    // with tempPath = <module builddir>/<module name>/processed/<original filename>
    var filesPaths = moduleCopy.files.files.map(
        file => [ file, path.join(moduleCopy.builddir, moduleCopy.name, 'processed', path.relative(moduleCopy.path, file)) ]
    );

    filesPaths.forEach(filePaths => {
        // we create the dir for the processed file
        var dirname = path.dirname(filePaths[1]);

        if (!checkFileExistence(dirname)) {
            mkdir(dirname);
        }

        // we process the file
        var text = process(moduleCopy.name, filePaths[0], fs.readFileSync(filePaths[0]).toString(), false, defines);
        fs.writeFileSync(filePaths[1], text);
    });

    // we put the processed files paths in the module
    moduleCopy.files = new Files(filesPaths.map(filePaths => filePaths[1]));

    return moduleCopy;
}

/**
 * Processes concatenated files
 * @param {ConcatenatedFiles} concatenatedFiles the concatenated files to process
 * @param {object} defines object where variable definitions are stored
 * @returns {ConcatenatedFiles} processed copy of the concatenated files
 */
function processConcatenatedFiles(concatenatedFiles, defines) {
    // todo : code it
    // s.push( ... );
    // s.push(null); // EOF

    return concatenatedFiles;
}

/**
 * Process a char stream and return the lines
 * @param {string} modulename name of the module that the file belongs to
 * @param {string} filename name of the processed file
 * @param {string} text text to process
 * @param {boolean} concatenated whether or not the file is the outputed concatenated file
 * @param {object} defines object where variable definitions are stored
 * @returns {string} processed text
 */
function process(modulename, filename, text, concatened, defines) {
    // init reserved values
    defines['__MODULE__'] = modulename;
    defines['__FILE__'] = filename;
    defines['__PREPROCESSOR__'] = '';
    defines['__LINE__'] = '';

    var lines = [];     // processed lines
    var output = true;  // whether or not we output the current line 
                        // (except if it is a directive)
    var srcLine = 0; // source file line number
    var dstLine = 0; // destination file line number

    var fileLines = text.replace(/\r\n/g, "\n").match(/.*\n?/g);

    // we read the stream line by line
    fileLines.forEach(line => {
        srcLine++;

        if (REGEX_DEFINE.test(line)) {
            // define
            var tokens = line.split(' ');
            if (tokens.length > 3) {
                throw "Malformed directive: \nl." + srcLine + "\nmodule: " + modulename + "\nfile: " + filename;
            }
            var variable = tokens[1];
            if (!REGEX_VARNAME.test(variable)) {
                throw 'Illegal variable name "' + variable + "\"\nl." + srcLine + "\nmodule: " + modulename + "\nfile: " + filename;
            }
            var value = tokens.length == 3 ? tokens[2] : '';
            if (variable in defines) {
                // already defined
                throw '"' + variable + "\" is already defined\nl." + srcLine + "\nmodule: " + modulename + "\nfile: " + filename;
            }
            defines[variable] = value;
        } else if (output) {
            dstLine++;
            for (var variable in defines) {
                // replace variable names in the line by their value
                if (variable == '__LINE__') {
                    line = line.replace(new RegExp(variable, 'g'), concatened ? dstLine : srcLine);
                } else {
                    line = line.replace(new RegExp(variable, 'g'), defines[variable]);
                }
            }
            lines.push(line);
        }
    });

    return lines.join('');
}