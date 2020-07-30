const fs = require('fs');
const path = require('path');
const ignore = ["node_modules", "README.md", ".eslintrc.json", "collect_modules.js", ".idea", ".git", "package.json", "package-lock.json", "test"];

let getFiles = function(type, dir, files_){
    files_ = files_ || [];
    let files = fs.readdirSync(dir);

    for (let i in files) {
        let name = dir + '/' + files[i];
        if (ignore.indexOf(files[i]) !== -1) {
            continue;
        } else if (fs.statSync(name).isDirectory()) {
            getFiles(type, name, files_);
        } else if (type === 'all' || (files[i].length > type.length && files[i].slice(files[i].length - type.length) === type)) {
            files_.push(name);
        }
    }
    return files_;
};

module.exports.getFiles = getFiles;