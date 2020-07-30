const esquery = require("esquery");
const fs = require('fs');
const recast = require('recast');
const getAngularTokensByCode = require('./htmlParser').getAngularTokensByCode;

function getObjectFromJSFiles(form, code) {
    if (form !== "all")
        return getObjectByCode(code, "");

    let result = [];
    let files = require('./../read_files.js').getFiles("js", "/home/asus/WebstormProjects/EslintRules/");
    files.forEach(function(file) {
        result = result.concat(getObjectByCode(fs.readFileSync(file).toString()))
    });
    return result;
}

function getObjectByCode(code) {
    let ast = recast.parse(code);
    let result = [];

    recast.visit(ast, {
        visitIdentifier: function (path) {
            this.traverse(path);
            if (path.node.name === "template" && path.parentPath.value.value.type === "Literal") {
                result = result.concat(getAngularTokensByCode(path.parentPath.value.value.value));
            }
        }
    });
    return result;
}
let res = getObjectFromJSFiles("all", "");
console.log(res);