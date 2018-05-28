#!/usr/bin/env node

const { build, list, clean } = require('../lib/tools.js');

const argv = process.argv;

/**
 * Prints the help
 */
function help() {
    var helpText =
        "Fr4mework Build Tool\'s Help\n" +
        "----------------------------\n" +
        "Syntax : fr4metool build|list|clean [--all, --no-preprocess]\n\n" +
        "build  : builds the modules from the current dir\n" +
        "         --no-preprocess : ... do not preprocess the files ...\n\n" +
        "list   : lists the modules from the current dir\n" +
        "         --all : lists the non-buildables modules (those with no 'builddir' or 'files' properties)\n\n" +
        "clean  : cleans the build dirs of the modules of the current dir\n";

    console.log(helpText);
}

/**
 * Determines the action to take based on the given args
 * @param {array} argv args given on invokation of the program
 */
function main(argv) {
    if (argv.length < 3) {
        help();
    } else {
        switch (argv[2]) {
            case 'build':
                build(!argv.includes('--no-preprocess'));
                break;

            case 'help':
                help();
                break;

            case 'list':
                list(argv.includes('--all'));
                break;

            case 'clean':
                clean();
                break;

            default:
                console.log('Syntax error !' , "\n");
                help();
        }
    }
}
main(argv);