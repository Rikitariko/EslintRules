'use strict';
const fs = require('fs');
const recast = require('recast');

function findComment(node) {
    let result = [];
    recast.visit(node, {
        visitComment: function(path) {
            this.traverse(path);
            if (path.value.value.replace(/^\s*/,'').replace(/\s*$/,'') === '@ngInject') {
                switch (path.parentPath.parentPath.value.type) {
                    case 'VariableDeclaration':
                        result.push(path.parentPath.parentPath.value.declarations[0].init);
                        break;
                    case 'FunctionDeclaration':
                        result.push(path.parentPath.parentPath.value);
                        break;
                    case 'Property':
                        result.push(path.parentPath.parentPath.value.value);
                        break;
                }
            }
        }
    });
    return result;
}

function findController(node) {
    if (!node)
    {return [];}

    let result = [];
    recast.visit(node, {
        visitProperty: function(path) {
            this.traverse(path);
            if (path.node.key.type === 'Identifier' && path.node.key.name === 'controller' && path.node.value.type === 'Literal') {
                result.push(path.node.value.value);
            }
        }
    });

    return result;
}

function findReqIdentifier(node) {
    let result = [];

    node.elements.forEach(function(item) {
        if (item.type === 'Literal')
        {result.push(item.value);}
    });

    recast.visit(node, {
        visitIdentifier: function(path) {
            this.traverse(path);
            if (path.value.name === 'require') {
                result.push(path.parentPath.value.arguments[0].value);
            }
        }
    });
    return result;
}

function findFunctionByNode(path, callExpressionNode) {
    let node = (callExpressionNode.callee.type === 'Identifier' || (callExpressionNode.callee.property.name === 'run' || callExpressionNode.callee.property.name === 'config')) ? callExpressionNode.arguments[0] : callExpressionNode.arguments[1];
    if (callExpressionNode.arguments.length === 1 && callExpressionNode.arguments[0].type !== 'Literal')
    {node = callExpressionNode.arguments[0];}

    if (!node) {
        return;
    }
    let func;
    switch (node.type) {
        case 'ArrayExpression':
            node = node.elements[node.elements.length - 1] || {};
            break;
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
        case 'FunctionDeclaration':
            return node;
        case 'ObjectExpression':
            node.properties.forEach(function(property) {
                if (property.key.name === 'controller') {
                    if (property.value.type === 'FunctionExpression' || property.value.type === 'ArrowFunctionExpression')
                    {func = property.value;}
                    if (property.value.type === 'ArrayExpression')
                    {func = property.value.elements[property.value.elements.length - 1];}
                }
            });
            return func;
        case 'Identifier':
            let scope = path.scope.lookup(node.name).getBindings();
            scope[node.name].some(function(variable) {
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

function getObjectFromFilesByPath(path) {
    let result = [];
    let files = require('./read_files.js').getFiles('js', path);
    files.forEach(function(file) {
        result = result.concat(getObjectByCode(fs.readFileSync(file).toString(), file));
    });
    return result;
}

function getObjectFromFileByPath(path) {
    return getObjectByCode(fs.readFileSync(path).toString(), '');
}

function convertCamelcaseToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function getObjectByCode(code, pathFile) {
    let result = [];
    let pointBody;


    let ast = recast.parse(code);
    let angularModuleIdentifiers = [];
    let angularModuleCalls = [];
    let angularChainables = [];

    recast.visit(ast, {
        visitCallExpression: function(path) {
            this.traverse(path);

            let flag = false;
            let callee = path.node.callee;

            if (callee.type === 'MemberExpression') {
                if (callee.object.name === 'angular' && callee.property.name !== 'module') {
                    flag = true;
                } else if (callee.object.name === 'angular' && callee.property.name === 'module') {

                    let arrayReq = [];
                    if (path.node.arguments.length > 1)
                    {arrayReq = findReqIdentifier(path.node.arguments[1]);}

                    result.push({
                        path: pathFile,
                        object: callee.property.name,
                        name: path.node.arguments[0].value,
                        dependencies: arrayReq,
                        body: []
                    });

                    pointBody = result[result.length - 1].body;
                    angularModuleCalls.push(path.node);
                } else if (angularChainableNames.indexOf(callee.property.name !== -1) && (angularModuleCalls.indexOf(callee.object) !== -1 || angularChainables.indexOf(callee.object) !== -1)) {
                    angularChainables.push(path.node);
                    let objectName = path.value.arguments[0].value;
                    if (callee.property.name === 'directive' || callee.property.name === 'component')
                    {objectName = convertCamelcaseToSnakeCase(path.value.arguments[0].value);}
                    pointBody.push({
                        object: callee.property.name,
                        name: objectName
                    });

                    let fn = findFunctionByNode(path, path.node);
                    pointBody[pointBody.length - 1].variables = [];
                    pointBody[pointBody.length - 1].controllers = findController(fn);

                    if (fn !== undefined)
                    {fn.params.forEach(function(param) {
                        pointBody[pointBody.length - 1].variables.push(param.name);
                    });}

                    let commentArray = findComment(fn);
                    commentArray.forEach(function(comment) {
                        comment.params.forEach(function(param) {
                            pointBody[pointBody.length - 1].variables.push(param.name);
                        });
                    });


                } else if (callee.object.type === 'Identifier' && path.scope.lookup(callee.object.name) !== null) {
                    let scope = path.scope.lookup(callee.object.name).getBindings();
                    let isAngularModule = (scope[callee.object.name].length !== 0);

                    isAngularModule = isAngularModule && scope[callee.object.name].some(function(id) {
                        return angularModuleIdentifiers.indexOf(id.value) !== -1;
                    });

                    if (isAngularModule) {
                        angularChainables.push(path.node);
                        let objectName = path.value.arguments[0].value;
                        if (callee.property.name === 'directive' || callee.property.name === 'component')
                        {objectName = convertCamelcaseToSnakeCase(path.value.arguments[0].value);}
                        pointBody.push({
                            object: callee.property.name,
                            name: objectName
                        });
                        let fn = findFunctionByNode(path, path.node);
                        pointBody[pointBody.length - 1].variables = [];
                        pointBody[pointBody.length - 1].controllers = findController(fn);

                        if (fn !== undefined)
                        {fn.params.forEach(function(param) {
                            pointBody[pointBody.length - 1].variables.push(param.name);
                        });}

                        let commentArray = findComment(fn);
                        commentArray.forEach(function(comment) {
                            comment.params.forEach(function(param) {
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
        }
    });
    return result;
}

module.exports.getObjectByCode = getObjectByCode;
module.exports.getObjectFromJSFiles = getObjectFromJSFiles;
module.exports.getObjectFromFilesByPath = getObjectFromFilesByPath;
module.exports.getObjectFromFileByPath = getObjectFromFileByPath;
module.exports.getObjectByCode = getObjectByCode;

//let json = JSON.stringify(getObjectFromFileByPath(__dirname + '/index.js'), null, ' ');
//let json = JSON.stringify(getObjectFromJSFiles("all", ''), null, ' ');
//console.log(json);
