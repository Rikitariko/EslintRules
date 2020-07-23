const fs = require('fs');
//const path = require('path');
const ignore = ["node_modules", ".eslintrc.json", "collect_modules.js", ".idea", ".git", "package.json", "package-lock.json"];

let getFiles = function (dir, files_){
    files_ = files_ || [];
    let files = fs.readdirSync(dir);

    for (let i in files) {
        let name = dir + '/' + files[i];
        if (ignore.indexOf(files[i]) !== -1){
            continue;
        } else if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
};

module.exports.getFiles = getFiles;