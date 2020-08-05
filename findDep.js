"use strict"
const fs = require('fs');
const getObjectFromFilesByPath = require('./collect_modules').getObjectFromFilesByPath;
const getObjectFromFileByPath = require('./collect_modules').getObjectFromFileByPath;
let obj = getObjectFromFilesByPath(__dirname + "/test_project");

let depMap = new Map();
let diMap = new Map();
obj.forEach(function(module) {
    module.dependencies.forEach(function(dep) {
        if (!depMap.has(module.name))
            depMap.set(module.name, new Map());
        depMap.get(module.name).set(dep, module.path);
    });

    module.body.forEach(function(service) {
        service.variables.forEach(function(variable) {
            if (variable[0] !== '$') {
                if (!diMap.has(module.name))
                    diMap.set(module.name, new Map());
                diMap.get(module.name).set(variable, false);
            }
        })
    });
});

function getDI(modules) {
    let result = [];
    modules.forEach(function(module) {
        module.body.forEach(function (service) {
            if (service.name)
                result.push(service.name);
        });
    });
    return result;
}

let useReq = new Map();
for(let module of depMap.keys()) {
    let deps = depMap.get(module);
    for (let [key, value] of deps) {
        useReq.set(key, {
            "module": module,
            "status": false,
        });
        let path = value.slice(0, value.lastIndexOf("/") + 1) + ((key[1] === "/")? key.slice(2): key) + ".js";
        if (fs.existsSync(path)) {
            let servicesReq = getDI(getObjectFromFileByPath(path));
            let variablesMap = diMap.get(module);
            servicesReq.forEach(function (name) {
                if (variablesMap.has(name)) {
                    useReq.set(key, {
                        "module": module,
                        "status": true,
                    });
                }
            })
        }
    }
}

for (let [key, value] of useReq) {
    console.log(key + " in " + value.module + " => " +  value.status);
}