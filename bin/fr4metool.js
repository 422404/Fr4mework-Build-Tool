#!/usr/bin/env node

const { collectModules, checkFileExistence, rmdir } = require('../lib/lib.js');
const fs = require('fs');
const path = require('path');

const argv = process.argv;

/**
 * Prints the help
 */
function help() {
    var helpText =
        "Fr4mework Build Tool\'s Help\n" +
        "----------------------------\n" +
        "Syntax : fr4metool build|list|clean [--all]\n\n" +
        "build : builds the modules from the current dir\n\n" +
        "list  : lists the modules from the current dir\n" +
        "        --all : lists the non-buildables modules (those with no 'builddir' or 'files' properties)\n\n" +
        "clean : cleans the build dirs of the modules of the current dir\n";

    console.log(helpText);
}

/**
 * Builds current directory's modules
 */
function build() {
    try {
        var startDate = Date.now();
        console.log('Listing modules...');
        var modules = collectModules(path.resolve('.')).buildables();

        console.log('Building modules...');
        modules.forEach(module => {
            if (!checkFileExistence(module.builddir)) {
                fs.mkdirSync(module.builddir);
            }

            var concatenated = module.files.concat();
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

/**
 * Lists available modules in current directory
 * @param {boolean} all false to omit non-buildables modules
 */
function list(all) {
    try {
        var modulesList = collectModules(path.resolve('.'));
        var modules = all ? modulesList.all() : modulesList.buildables();
        modules.forEach(module => console.log(module.name + ' : ' + module.path));
    } catch (e) {
        console.log('An error occured while listing modules');
        console.log('Error info : ' + e);
    }
}

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

/**
 * Determines the action to take based on the given args
 * @param {array} argv args given on invokation of the program
 */
function main(argv) {
    if (argv.length < 3) {
        help();
    } else {
        if (argv[2] == 'build') {
            build();
        } else if (argv[2] == 'help') {
            help();
        } else if (argv[2] == 'list') {
            list(argv.includes('--all'));
        } else if (argv[2] == 'clean') {
            clean();
        } else {
            console.log('Syntax error !' , "\n");
            help();
        }
    }
}
main(argv);