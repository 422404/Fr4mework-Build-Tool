const fs = require('fs');
const path = require('path');

module.exports.Files = Files;
module.exports.ConcatenatedFiles = ConcatenatedFiles;

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
    };

    /**
     * Concatenate the listed files
     * @returns {ConcatenatedFiles} an object representing the concatenated files
     */
    this.concat = function () {
        var text = this.files.map(filePath => fs.readFileSync(filePath)).join("\n");

        return new ConcatenatedFiles(text);
    };
}

/**
 * Represents concatenated files
 * @param {string} text text from the concatenated files
 */
function ConcatenatedFiles(text) {
    this.text = text.replace(/\r\n/g, "\n"); // enforce Unix-style line ending

    /**
     * Saves the files in a given directory
     * @param {string} dirname directory where the file will be saved
     * @param {string} filename name of the saved file
     * @returns {ConcatenatedFiles} this
     */
    this.save = function (dirname, filename) {
        fs.writeFileSync(path.join(dirname, filename), this.text);
        return this;
    };
}