"use strict"
const fs = require('fs');
const recast = require('recast');

function findComment(node) {
    let result = [];
    recast.visit(node, {
        visitComment: function (path) {
            this.traverse(path);
            if (path.value.value.replace(/^\s*/,'').replace(/\s*$/,'') === "@ngInject") {
                switch (path.parentPath.parentPath.value.type) {
                    case "VariableDeclaration":
                        result.push(path.parentPath.parentPath.value.declarations[0].init);
                        break;
                    case "FunctionDeclaration":
                        result.push(path.parentPath.parentPath.value);
                        break;
                    case "Property":
                        result.push(path.parentPath.parentPath.value.value);
                        break;
                }
            }
        }
    });
    return result;
}

function findReqIdentifier(node) {
    let result = [];

    if (node.type === "ArrayExpression" && node.elements.length > 0 && node.elements[0].type === "Literal") {
        node.elements.forEach(function(item) {
            result.push(item.value);
        });
        return result;
    }

    recast.visit(node, {
        visitIdentifier: function (path) {
            this.traverse(path);
            if (path.value.name === "require") {
                result.push(path.parentPath.value.arguments[0].value);
            }
        }
    })
    return result;
}

function findFunctionByNode(path, callExpressionNode) {
    let node = (callExpressionNode.callee.type === 'Identifier' || (callExpressionNode.callee.property.name === 'run' || callExpressionNode.callee.property.name === 'config')) ? callExpressionNode.arguments[0] : callExpressionNode.arguments[1];
    if (callExpressionNode.arguments.length === 1 && callExpressionNode.arguments[0].type !== "Literal")
        node = callExpressionNode.arguments[0];

    if (!node) {
        return;
    }
    let func;
    switch (node.type) {
        case 'ArrayExpression':
            node = node.elements[node.elements.length - 1] || {};
            break
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'FunctionDeclaration':
            return node;
        case 'ObjectExpression':
            node.properties.forEach(function (property) {
                if (property.key.name === 'controller') {
                    if (property.value.type === 'FunctionExpression' || property.value.type === "ArrowFunctionExpression")
                        func = property.value;
                    if (property.value.type === "ArrayExpression")
                        func = property.value.elements[property.value.elements.length - 1];
                }
            });
            return func;
        case 'Identifier':
            let scope = path.scope.lookup(node.name).getBindings();
            scope[node.name].some(function (variable) {
                if (variable.parentPath.value.type === 'FunctionDeclaration') {
                    func = variable.parentPath.value;
                    return true;
                }
                return false;
            });
            return func;
    }
}

let angularChainableNames = [
    'animation',
    'component',
    'config',
    'constant',
    'controller',
    'directive',
    'factory',
    'filter',
    'provider',
    'run',
    'service',
    'value'
];

function getObjectFromJSFiles(form, code) {
    if (form !== "all")
        return getObjectByCode(code, "");

    let result = [];
    let files = require('./read_files.js').getFiles("js", __dirname);
    files.forEach(function(file) {
        result = result.concat(getObjectByCode(fs.readFileSync(file).toString(), file))
    });
    return result;
}

function getObjectByCode(code, pathFile) {
    let result = [];
    let pointBody;


    let ast = recast.parse(code);
    let angularModuleIdentifiers = [];
    let angularModuleCalls = [];
    let angularChainables = [];

    recast.visit(ast, {
        visitCallExpression: function (path) {
            this.traverse(path);

            let flag = false;
            let callee = path.node.callee;

            if (callee.type === 'MemberExpression') {
                if (callee.object.name === 'angular' && callee.property.name !== 'module') {
                    flag = true;
                } else if (callee.object.name === 'angular' && callee.property.name === 'module') {

                    let arrayReq = [];
                    if (path.node.arguments.length > 1)
                        arrayReq = findReqIdentifier(path.node.arguments[1]);

                    result.push({
                        path: pathFile,
                        object: callee.property.name,
                        name: path.node.arguments[0].value,
                        dependencies: arrayReq,
                        body: [],
                    })

                    pointBody = result[result.length - 1].body;
                    angularModuleCalls.push(path.node);
                } else if (angularChainableNames.indexOf(callee.property.name !== -1) && (angularModuleCalls.indexOf(callee.object) !== -1 || angularChainables.indexOf(callee.object) !== -1)) {

                    angularChainables.push(path.node);
                    pointBody.push({
                        object: callee.property.name,
                        name: path.value.arguments[0].value,
                    });

                    let fn = findFunctionByNode(path, path.node);
                    pointBody[pointBody.length - 1].variables = [];

                    if (fn !== undefined)
                        fn.params.forEach(function (param) {
                            pointBody[pointBody.length - 1].variables.push(param.name);
                        });

                    let commentArray = findComment(fn);
                    commentArray.forEach(function (comment) {
                        comment.params.forEach(function (param) {
                            pointBody[pointBody.length - 1].variables.push(param.name);
                        });
                    });


                } else if (callee.object.type === 'Identifier' && path.scope.lookup(callee.object.name) !== null) {
                    let scope = path.scope.lookup(callee.object.name).getBindings();
                    let isAngularModule = (scope[callee.object.name].length !== 0);

                    isAngularModule = isAngularModule && scope[callee.object.name].some(function (id) {
                        return angularModuleIdentifiers.indexOf(id.value) !== -1;
                    });

                    if (isAngularModule) {
                        angularChainables.push(path.node);
                        pointBody.push({
                            object: callee.property.name,
                            name: path.value.arguments[0].value,
                        });
                        let fn = findFunctionByNode(path, path.node);
                        pointBody[pointBody.length - 1].variables = [];

                        if (fn !== undefined)
                            fn.params.forEach(function (param) {
                                pointBody[pointBody.length - 1].variables.push(param.name);
                            });

                        let commentArray = findComment(fn);
                        commentArray.forEach(function (comment) {
                            comment.params.forEach(function (param) {
                                pointBody[pointBody.length - 1].variables.push(param.name);
                            });
                        });
                    } else {
                        flag = true;
                    }
                } else {
                    flag = true;
                }
                if (path.parentPath.value.type === 'VariableDeclarator' && flag === false) {
                    angularModuleIdentifiers.push(path.parentPath.value.id);
                }
            }
        },
    });
    return result;
}

module.exports.getObjectFromJSFiles = getObjectFromJSFiles;
//let json = JSON.stringify(getObjectFromJSFiles("", ""), null, ' ');
//let json = JSON.stringify(getObjectFromJSFiles("all", ''), null, ' ');
//console.log(json);
