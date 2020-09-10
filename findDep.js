'use strict';
const fs = require('fs');
const recast = require('recast');
const getObjectFromFilesByPath = require('./collect_modules').getObjectFromFilesByPath;
const collectModules = require('./collect_modules');
const getTokensFromHtmlByPath = require('./html_parse/htmlParser.js').getTokensFromHtmlByPath;
const getTokensFromJSFilesByPath = require('./html_parse/htmlParser.js').getTokensFromJSFilesByPath;
const findJSFiltersByFiles = require('./html_parse/findFilter').findJSFiltersByFiles;


function getDI(modules) {
    let result = [];
    modules.forEach(function(module) {
        module.body.forEach(function(service) {
            if (service.name)
            {result.push(service.name);}
        });
    });
    return result;
}

function findRun(modules) {
    for (let i in modules)
    {for (let j in modules[i].body)
    {if (modules[i].body[j].object === 'run')
    {return true;}}}
    return false;
}

function findConfig(path) {
    let result = false;
    let files = require('./read_files.js').getFiles('js', path);

    files.forEach(function(file) {
        let ast = recast.parse(fs.readFileSync(file).toString());
        recast.visit(ast, {
            visitCallExpression: function(path) {
                this.traverse(path);
                if (path.node.callee.property !== undefined && path.node.callee.property.name === 'loadSync')
                {result = true;}
            }
        });
    });
    return result;
}

function getAllServices(path) {
    let servicesMap = new Map();

    let modules = collectModules.getObjectForAdditionalModules(__dirname + '/node_modules');
    let declarations = collectModules.findServicesInAdditionalDirectives(__dirname + '/node_modules');

    declarations.forEach(function(service) {
        servicesMap.set(service.name, service.path);
    });

    modules.forEach(function(module) {
        module.body.forEach(function(service) {
            if (service.name) {
                servicesMap.set(service.name, module.path);
            }
        });
    });

    modules = getObjectFromFilesByPath(path);
    modules.forEach(function(module) {
        module.body.forEach(function(service) {
            if (service.name) {
                servicesMap.set(service.name, module.path);
            }
        });
    });
    return servicesMap;
}

function getDependenciesStatus() {
    let all = 0;
    let sum = 0;
    let mapAllServices = getAllServices(__dirname + '/test_project');
    let files = fs.readdirSync(__dirname + '/test_project/components');
    let resultObject = [];
    for (let i in files) {
        let name = __dirname + '/test_project/components/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            let obj = getObjectFromFilesByPath(name);
            let htmlRes = getTokensFromHtmlByPath(require('./read_files.js').getFiles('html', name));
            let jsRes = getTokensFromJSFilesByPath(require('./read_files.js').getFiles('js', name));
            let jsFilters = findJSFiltersByFiles(require('./read_files.js').getFiles('js', name), obj);

            let filDirMap = new Map();

            htmlRes.forEach(function(item) {
                filDirMap.set(item.name, false);
            });

            jsRes.forEach(function(item) {
                filDirMap.set(item.name, false);
            });

            jsFilters.forEach(function(item) {
                filDirMap.set(item.name, false);
            });

            let objServicesMap = new Map();
            let depMap = new Map();
            let diMap = new Map();
            obj.forEach(function(module) {
                if (!diMap.has(module.name))
                {diMap.set(module.name, new Map());}
                if (!depMap.has(module.name))
                {depMap.set(module.name, new Map());}
                module.dependencies.forEach(function(dep) {
                    depMap.get(module.name).set(dep, module.path);
                });

                module.body.forEach(function(service) {
                    if (service.name !== undefined)
                    {objServicesMap.set(service.name, false);}
                    service.variables.forEach(function(variable) {
                        if (variable.slice(variable.length - 6) === 'Filter')
                        {diMap.get(module.name).set(variable.slice(0, variable.length - 6), false);}
                        else if (variable.slice(variable.length - 8) === 'Provider')
                        {diMap.get(module.name).set(variable.slice(0, variable.length - 8), false);}
                        else
                        {diMap.get(module.name).set(variable, false);}
                    });
                });
            });

            for (let module of depMap.keys()) {
                let useReq = new Map();
                let deps = depMap.get(module);
                for (let [key, value] of deps) {
                    let path = value.slice(0, value.lastIndexOf('/') + 1) + ((key[1] === '/') ? key.slice(2) : key);
                    if (fs.existsSync(path)) {
                        useReq.set(key, {
                            'module': module,
                            'status': false
                        });

                        let servicesReq = getDI(getObjectFromFilesByPath(path));
                        let variablesMap = diMap.get(module);
                        servicesReq.forEach(function(name) {
                            if (variablesMap.has(name)) {
                                variablesMap.set(name, true);
                                useReq.set(key, {
                                    'module': module,
                                    'status': true
                                });
                            }
                            if (filDirMap.has(name)) {
                                variablesMap.set(name, true);
                                useReq.set(key, {
                                    'module': module,
                                    'status': true
                                });
                            }
                        });
                        if (findConfig(path))
                        {useReq.set(key, {
                            'module': module,
                            'status': true
                        });}
                        if (findRun(getObjectFromFilesByPath(path)))
                        {useReq.set(key, {
                            'module': module,
                            'status': true
                        });}
                    }
                }
                resultObject.push({module: module, removeDep: [], addDep: []});
                all += useReq.size;
                for (let [key, value] of useReq) {
                    if (value.status === false) {
                        sum++;
                        //console.log(key + ' in ' + value.module + ' => ' + value.status);
                        resultObject[resultObject.length - 1].removeDep.push(key);
                    }
                }

                for (let [keyVar, valueVar] of diMap.get(module)) {
                    if (valueVar === false && !objServicesMap.has(keyVar) && mapAllServices.get(keyVar) !== undefined && keyVar[0] !== '$') {
                        //console.log('var  =>  ' + keyVar + ' ' + mapAllServices.get(keyVar));
                        resultObject[resultObject.length - 1].addDep.push({name:keyVar, path:mapAllServices.get(keyVar)});
                    }
                }
            }
        }
    }
    return resultObject;
}

module.exports.getDependenciesStatus = getDependenciesStatus;
