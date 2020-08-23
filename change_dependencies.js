let recast = require('recast');
let fs = require('fs');
let getDependenciesStatus = require('./findDep').getDependenciesStatus;

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
                dep.addDep.forEach(function(name) {
                  let id = 0;
                  for (let i = 0; i < Math.min(objFile.length, name.length); i++){
                    if (objFile[i] === name[i])
                    {id = i;}
                    else {
                      id = objFile.lastIndexOf('/', id);
                      break;
                    }
                  }
                  let code = '';
                  if (name.includes('/node_modules/')) {
                    let mainPath = name.slice(name.indexOf('/node_modules/') + '/node_modules/'.length);
                    if (name.includes('/ring-ui/')) {
                      mainPath = mainPath.split(/\//);
                      mainPath = mainPath.slice(0, mainPath.length - 1).join('/');
                      code = recast.parse(`require('${mainPath}').default`);
                    }
                    else
                    {code = recast.parse(`'${mainPath}'`);}
                  }
                  else {
                    let pathLeft = objFile.slice(id + 1).split(/\//);
                    let pathRight = name.slice(id + 1).split(/\//);
                    let mainPath = ('../').repeat(pathLeft.length - 1) + pathRight.slice(0, pathRight.length - 1).join('/');

                    code = recast.parse(`require('${mainPath}').name`);
                  }
                  node.elements.push(code.program.body[0].expression);
                  console.log(recast.print(code).code);
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