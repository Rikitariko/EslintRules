"use strict"
const fs = require('fs');
const recast = require('recast');
const getObjectFromJSFiles = require('./../collect_modules').getObjectFromJSFiles;

function findFilter(code) {
    let result = [];
    let ast = recast.parse(code);

    recast.visit(ast, {
        visitCallExpression: function (path) {
            this.traverse(path);
                if (path.node.callee.type === "Identifier" && path.node.callee.name === "$filter") {
                    result.push({
                        type: "function",
                        name: path.node.arguments[0].value
                    })
                }
        },
    });
    return result;
}

function findPostfixFilter(code) {
    let obj = getObjectFromJSFiles("all", "");
    let result = [];

    obj.forEach(function (module) {
        module.body.forEach(function (item) {
            item.variables.forEach(function (variable) {
                if (variable.length > 6 && variable.slice(variable.length - 6) === "Filter") {
                    result.push({
                        type: "filter",
                        name: variable
                    })
                }
            })
        })
    })

    return result;
}
//console.log(findPostfixFilter());
//console.log(findFilter(fs.readFileSync("./index.js").toString()));
//let json = JSON.stringify(getObjectFromJSFiles("all", ''), null, ' ');
//console.log(json);
