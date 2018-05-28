# Fr4mework Build Tool
## Description :
Helps building the Fr4mework and its modules.

## Installation :
Install globally with:
```
$ git clone https://github.com/422404/Fr4mework-Build-Tool.git
$ cd Fr4mework-Build-Tool
$ npm -g install
```

## Uninstallation :
Just run :
```
$ npm -g uninstall
```

## How to use that piece of code ?
### fr4mebuild.json config file :
Simply put a JSON file named *fr4mebuild.json* in your module's directory and write something like that in it :
```javascript
{
    "name": "myModule",
    "build": {
        "builddir": "./build",
        "files": [
            "./src/file1.js",
            "./src/file2.js"
        ]
    }
}
```

* **name** : the name of your module, also the name of the resulting packed file.
* **build** : all of the build options goes here !
  * **builddir** : where the output file should be created.
  * **files** : an array of files paths to be packed. They will be concatenated in the order they appear.

You can even list other modules to be build in the same time (but not appended to your first module) :
```javascript
{
    "name": "myModule",
    "build": {
        "builddir": "./build",
        "files": [
            "./src/file1.js",
            "./src/file2.js"
        ],
        "modules": [
            "./anotherModule",
            "./anotherDir/superModule"
        ]
    }
}
```
The other modules must also contain a *fr4mebuild.json* file and they can list other modules as well.

You can also omit the **build.builddir** and **build.files** property of the *fr4mebuild.json* file to just list modules in other directories.

### How to build a module ?
Execute the following command in your module directory :
```
$ fr4metool build --no-preprocess
```
It will build your module and the modules it lists.

Have you noticed the **--no-preprocess** switch in the command above ?
If you do not use the preprocessing feature of this tool you can skip the preprocessing phase with it. It could be useful in some specific cases I'm not aware of...

### You said "preprocessor" ?
Yeah, you definitely know how to read !
But more seriously, I said "preprocessing", illiterate !

This tool has a very little preprocessor like C has.
```javascript
// definition of a variable
//#define HELLO "world"

// use code if a variable is defined
//#ifdef HELLO
...
//#endif

// do not use code if a variable is not defined
//#ifndef HELLO
...
//#endif

// usage of a variable value
var livingPlace = "@HELLO@"; // livingPlace == "world"
```
Directives begins with **//#**, these are not comments ! It's made to not be flagged as errors in code editors.

To comment a directive simply put a third slash at the begining of the line :
```javascript
// not used
///#define YOP
```

**Definitions are modulewise, they are not shared between modules.**

#### Predefined variables :
* **\_\_PREPROCESSOR\_\_** : it was meant to be great, but it's useless as of now.
* **\_\_MODULE\_\_** : name of the module the file is in.
* **\_\_FILE\_\_** : name of the file.
* **\_\_LINE\_\_** : line number of the instruction (before preprocessing).

### Cleaning build directories :
Execute the following command in your module directory :
```
$ fr4metool clean
```

### Listing the modules :
Execute the following command in your module directory :
```
$ fr4metool list
```

You can add the **--all** switch to list even those that are not "buildable" (those with no **build.files** and **build.builddir** properties in their *fr4mebuild.json* file).

## Credits :
Thanks to all the people involved in JavaScript and Node.js !

## Usage of my work :
Feel free to use parts or entirety of my work if you like badly engineered software, but please credit me so I can prove my friends I'm 2cool4them !