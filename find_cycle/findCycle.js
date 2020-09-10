const fs = require('fs');
const getObjectFromFilesByPath = require('./../collect_modules').getObjectFromFilesByPath;


function createGraph(path) {
    let vertex = [];
    let idName = new Map();
    let files = fs.readdirSync(__dirname + path);
    for (let i in files) {
        let name = __dirname + path + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            let obj = getObjectFromFilesByPath(name);

            obj.forEach(function(module) {
                module.dependencies.forEach(function(dep) {
                    if (!idName.has(module.name)) {
                        idName.set(module.name, vertex.length);
                        vertex.push({
                            name: module.name,
                            path: module.path,
                            edge: []
                        });
                    }
                    let path = module.path.slice(0, module.path.lastIndexOf('/') + 1) + ((dep[1] === '/') ? dep.slice(2) : dep);
                    if (fs.existsSync(path)) {
                        let depObj = getObjectFromFilesByPath(path);
                        depObj.forEach(function(depModule) {
                            if (!idName.has(depModule.name)) {
                                idName.set(depModule.name, vertex.length);
                                vertex.push({
                                    name: depModule.name,
                                    path: depModule.path,
                                    edge: [idName.get(module.name)]
                                });
                            } else
                            {vertex[idName.get(depModule.name)].edge.push(idName.get(module.name));}
                        });
                    }
                });
            });
        }
    }
    return {vertex, idName};
}

function findCycle(vertex, idName) {

    let mark = [];
    let flag = false;
    for (let i = 0; i < idName.size; i++)
    {mark.push(0);}

    function dfs(v) {
        mark[v] = 1;

        for (let i = 0; i < vertex[v].edge.length; i++) {
            if (mark[vertex[v].edge[i]] === 1)
            {flag = true;}
            if (mark[vertex[v].edge[i]] === 0)
            {dfs(vertex[v].edge[i]);}
        }
        mark[v] = 2;
    }

    for (let i = 0; i < idName.size; i++) {
        if (mark[i] === 0)
        {dfs(i);}
    }
    return flag;
}

/*
let result = createGraph('/../../app/components');
let vertex = result.vertex;
let idName = result.idName;
*/

//console.log(vertex);
//console.log(findCycle(vertex, idName));

module.exports.createGraph = createGraph;
module.exports.findCycle = findCycle;
