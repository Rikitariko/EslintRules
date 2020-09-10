let recast = require('recast');
let fs = require('fs');
let getDependenciesStatus = require('./findDep').getDependenciesStatus;
let createGraph = require('./find_cycle/findCycle').createGraph;
let findCycle = require('./find_cycle/findCycle').findCycle;
const getObjectFromFilesByPath = require('./collect_modules').getObjectFromFilesByPath;

let depStatus = new Map();

getDependenciesStatus().forEach(function(module) {
  depStatus.set(module.module, {
    removeDep: new Set(),
    addDep: module.addDep
  });

  let dep = depStatus.get(module.module);

  module.removeDep.forEach(function(item){
    dep.removeDep.add(item);
  });
});

let resGraph = createGraph('/../test_project/components');

let files = fs.readdirSync(__dirname + '/test_project/components');
for (let i in files) {
  let name = __dirname + '/test_project/components/' + files[i];
  if (fs.statSync(name).isDirectory()) {
    let objFile = require('./read_files.js').getFiles('js', name);
    objFile.forEach(function(objFile) {
      let ast = recast.parse(fs.readFileSync(objFile).toString());

      recast.visit(ast, {
        visitCallExpression: function(path) {
          this.traverse(path);
          let callee = path.node.callee;

          if (callee.type === 'MemberExpression' && callee.object.name === 'angular' && callee.property.name === 'module') {
            if (path.node.arguments.length > 1) {
              let node = path.node.arguments[1];

              let dep = depStatus.get(path.node.arguments[0].value);
              if (depStatus.get(path.node.arguments[0].value) !== undefined) {
                dep.addDep.forEach(function(item) {

                  if (item.path.includes('/issue/'))
                    console.log('готовность');

                  let id = 0;
                  for (let i = 0; i < Math.min(objFile.length, item.path.length); i++){
                    if (objFile[i] === item.path[i])
                    {id = i;}
                    else {
                      id = objFile.lastIndexOf('/', id);
                      break;
                    }
                  }
                  let code = '';
                  if (item.path.includes('/node_modules/')) {
                    let mainPath = item.path.slice(item.path.indexOf('/node_modules/') + '/node_modules/'.length);
                    if (item.path.includes('/ring-ui/')) {
                      mainPath = mainPath.split(/\//);
                      mainPath = mainPath.slice(0, mainPath.length - 1).join('/');
                      code = recast.parse(`require('${mainPath}').default`);
                    }
                    else
                    {code = recast.parse(`'${mainPath}'`);}

                  }
                  else {
                    let pathLeft = objFile.slice(id + 1).split(/\//);
                    let pathRight = item.path.slice(id + 1).split(/\//);
                    let mainPath = ('../').repeat(pathLeft.length - 1) + pathRight.slice(0, pathLeft.length - 1).join('/');

                    let testPath = objFile.slice(0, id + 1) + pathRight.slice(0, pathRight.length - 1).join('/');
                    let testObj = getObjectFromFilesByPath(testPath);

                    if (resGraph.idName.has(testObj[testObj.length - 1].name)) {
                      resGraph.vertex[resGraph.idName.get(testObj[testObj.length - 1].name)].edge.push(resGraph.idName.get(path.node.arguments[0].value));
                      if (findCycle(resGraph.vertex, resGraph.idName)) {
                        console.log('You try to create cycle' + item.name + ' in ' + item.path);
                        resGraph.vertex[resGraph.idName.get(testObj[testObj.length - 1].name)].edge.splice(resGraph.vertex[resGraph.idName.get(testObj[testObj.length - 1].name)].edge.length - 1, 1);
                        return false;
                      }
                    }

                    code = recast.parse(`require('${mainPath}').name`);
                  }
                  if (code !== '') {
                    node.elements.push(code.program.body[0].expression);
                    console.log(recast.print(code).code);
                  }
                });
              }
              node.elements.forEach(function(item, index) {
                recast.visit(item, {
                  visitIdentifier: function(path) {
                    this.traverse(path);
                    if (path.value.name === 'require') {
                      if (dep.removeDep.has(path.parentPath.value.arguments[0].value)) {
                        node.elements.splice(index, 1);
                      }
                    }
                  }
                });
              });
            }
          }
        }
      });
      // fs.writeFileSync(objFile, recast.print(ast).code,  'ascii');
    });
  }
}
