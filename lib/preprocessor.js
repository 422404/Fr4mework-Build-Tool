const fs = require('fs');
const path = require('path');
const readline = require('readline');
const stream = require('stream');
const { Files } = require('./files.js');
const { checkFileExistence, mkdir } = require('./util.js');
const { Module } = require('./modules.js');

module.exports.preprocessor = preprocessor;

const REGEX_DEFINE = /^\/\/\#define /;
const REGEX_IFDEF  = /^\/\/\#ifdef /;
const REGEX_IFNDEF = /^\/\/\#ifndef /;
const REGEX_ENDIF  = /^\/\/\#endif/;

const REGEX_VARNAME = /[a-z_\$][a-z0-9_\$]*/i;

/**
 * Process module's files a bit like C preprocessor
 * @param {Module} target target to process
 * @returns {Module} processed copy of the target
 */
function preprocessor(target) {
    if (target instanceof Module) {
        return processModuleFiles(target, {});
    }

    throw 'Target is not a Module instance';
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
        file => [ file, path.join(moduleCopy.builddir, '__preprocessed', moduleCopy.name, path.relative(moduleCopy.path, file)) ]
    );

    filesPaths.forEach(filePaths => {
        // we create the dir for the processed file
        var dirname = path.dirname(filePaths[1]);

        if (!checkFileExistence(dirname)) {
            mkdir(dirname);
        }

        // we process the file
        var text = process(
            moduleCopy.name,
            path.relative(moduleCopy.path, filePaths[0]),
            fs.readFileSync(filePaths[0]).toString(),
            defines
        );
        fs.writeFileSync(filePaths[1], text);
    });

    // we put the processed files paths in the module
    moduleCopy.files = new Files(filesPaths.map(filePaths => filePaths[1]));

    return moduleCopy;
}

/**
 * Process a char stream and return the lines
 * @param {string} modulename name of the module that the file belongs to
 * @param {string} filename name of the processed file
 * @param {string} text text to process
 * @param {object} defines object where variable definitions are stored
 * @returns {string} processed text
 */
function process(modulename, filename, text, defines) {
    // init reserved values
    defines['__MODULE__'] = modulename;
    // windows style separator could conflict
    // if the variable has to be outputed between quotes
    defines['__FILE__'] = filename.replace(/\\/g, '/');
    defines['__PREPROCESSOR__'] = '';
    defines['__LINE__'] = '';

    var lines = []; // processed lines
    var output = [ true ]; // last element = whether or not we output the current line 
                           // (except if it is a directive)
                           // used as an array because of ifdef/ifndef nesting
    var srcLine = 0; // source file line number
    var dstLine = 0; // destination file line number

    var fileLines = text.replace(/\r\n/g, "\n").match(/.*\n?/g);

    // we read the stream line by line
    fileLines.forEach(line => {
        srcLine++;

        if (REGEX_DEFINE.test(line)) {
            execDefine(line, srcLine, modulename, filename, defines);
        } else if (REGEX_IFDEF.test(line)) {
            if (output[output.length - 1]) {
                output.push(execIfdef(line, srcLine, modulename, filename, defines));
            } else {
                output.push(false);
            }
        } else if (REGEX_IFNDEF.test(line)) { // repetitive :/
            if (output[output.length - 1]) {
                output.push(execIfndef(line, srcLine, modulename, filename, defines));
            } else {
                output.push(false);
            }
        }else if (REGEX_ENDIF.test(line)) {
            execEndif(line, srcLine, modulename, filename);
            if (output.length == 1) {
                throw "Too much //#endif \nl." + srcLine + "\nmodule: " + modulename + "\nfile: " + filename;
            }
            output.pop();
        } else if (output[output.length - 1]) {
            dstLine++;
            for (var variable in defines) {
                // replace variable names in the line by their value
                if (variable == '__LINE__') {
                    line = line.replace(new RegExp('@' + variable + '@', 'g'), srcLine);
                } else {
                    line = line.replace(new RegExp('@' + variable + '@', 'g'), defines[variable]);
                }
            }
            lines.push(line);
        }
    });

    // console.log(' --- ' + filename + '---');
    // console.log(defines);

    return lines.join('');
}

/**
 * Parse and exec an ifdef directive
 * @param {string} line line to parse
 * @param {number} srcLine current line number
 * @param {string} modulename module name
 * @param {string} filename file name
 * @param {object} defines storred definitions
 * @return {boolean} new output permission
 */
function execIfdef(line, srcLine, modulename, filename, defines) {
    var tokens = toTokens(line);
    if (tokens.length != 2) {
        throw "Malformed directive \nl." + srcLine + "\nmodule: " + modulename + "\nfile: " + filename;
    }
    var variable = tokens[1];
    if (!REGEX_VARNAME.test(variable)) {
        throw 'Illegal variable name "' + variable + "\"\nl." + srcLine + "\nmodule: " + modulename + "\nfile: " + filename;
    }

    return (variable in defines);
}

/**
 * Parse and exec an ifndef directive
 * @param {string} line line to parse
 * @param {number} srcLine current line number
 * @param {string} modulename module name
 * @param {string} filename file name
 * @param {object} defines storred definitions
 * @return {boolean} new output permission
 */
function execIfndef(line, srcLine, modulename, filename, defines) {
    return !execIfdef(line, srcLine, modulename, filename, defines);
}

/**
 * Parse and exec an endif directive
 * @param {string} line line to parse
 * @param {number} srcLine current line number
 * @param {string} modulename module name
 * @param {string} filename file name
 */
function execEndif(line, srcLine, modulename, filename) {
    var tokens = toTokens(line);
    if (tokens.length != 1) {
        throw "Malformed directive \nl." + srcLine + "\nmodule: " + modulename + "\nfile: " + filename;
    }
}

/**
 * Parse and exec a define directive
 * todo : remove final line break of value
 * @param {string} line line to parse
 * @param {number} srcLine current line number
 * @param {string} modulename module name
 * @param {string} filename file name
 * @param {object} defines storred definitions
 */
function execDefine(line, srcLine, modulename, filename, defines) {
    var tokens = toTokens(line);
    if (tokens.length < 2 || tokens.length > 3) {
        throw "Malformed directive \nl." + srcLine + "\nmodule: " + modulename + "\nfile: " + filename;
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
}

/**
 * Cut a preprocessor directive line into an array
 * @param {string} line line to break down into array
 * @returns {string[]} resulting array
 */
function toTokens(line) {
    return line.replace(/\n/g, '').split(' ').filter(x => x != '');
}