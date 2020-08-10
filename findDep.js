'use strict';
const fs = require('fs');
const getObjectFromFilesByPath = require('./collect_modules').getObjectFromFilesByPath;
const getTokensFromHtmlByPath = require('./htmlParser.js').getTokensFromHtmlByPath;
const getTokensFromJSFilesByPath = require('./htmlParser.js').getTokensFromJSFilesByPath;

let all = 0;
let sum = 0;
let files = fs.readdirSync(__dirname + './test_project');
for (let i in files) {
    let name = __dirname + './test_project' + files[i];
    if (fs.statSync(name).isDirectory()) {
        let htmlRes = getTokensFromHtmlByPath(require('./read_files.js').getFiles('html', name));
        let jsRes = getTokensFromJSFilesByPath(require('./read_files.js').getFiles('js', name));
        let filDirMap = new Map();
        htmlRes.forEach(function(item) {
            filDirMap.set(item.name, false);
        });

        jsRes.forEach(function(item) {
            filDirMap.set(item.name, false);
        });


        let obj = getObjectFromFilesByPath(name);

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
                service.variables.forEach(function(variable) {
                    diMap.get(module.name).set(variable, false);
                });
            });
        });

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

        let useReq = new Map();
        for (let module of depMap.keys()) {
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
                            useReq.set(key, {
                                'module': module,
                                'status': true
                            });
                        }
                        if (filDirMap.has(name)) {
                            useReq.set(key, {
                                'module': module,
                                'status': true
                            });
                        }
                    });
                    if (findRun(getObjectFromFilesByPath(path)))
                    {useReq.set(key, {
                        'module': module,
                        'status': true
                    });}
                }
            }
        }

        all += useReq.size;
        for (let [key, value] of useReq) {
            if (value.status === false) {
                sum++;
                console.log(key + ' in ' + value.module + ' => ' + value.status);
            }
        }
    }
}
console.log(all);
console.log(sum);