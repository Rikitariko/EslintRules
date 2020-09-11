let assert = require('assert');
let modules = require('./../collect_modules.js');

describe('Detection of modules', function () {

    let controllerCode = ["angular.module('').controller('', function($q) {});", 'angular.module("").controller("", function controller($q) {});', 'angular.module("").controller("", ($q) => {});', 'var app = angular.module(""); app.controller("", function($q) {});', 'angular.module("").controller("", fn); function fn($q) {}'];
    let controllerAns = [{
        "path": "",
        "object": "module",
        "name": "",
        "dependencies": [],
        "body": [{"object": "controller", "name": "", "variables": ['$q'], "controllers":[]}],
    }];

    it('Controller test', function () {
        let code = controllerCode[0];
        let answer = controllerAns;
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('Controller test', function () {
        let code = controllerCode[1];
        let answer = controllerAns;
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('Controller test', function () {
        let code = controllerCode[2];
        let answer = controllerAns;
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('Controller test', function () {
        let code = controllerCode[3];
        let answer = controllerAns;
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('Controller test', function () {
        let code = controllerCode[4];
        let answer = controllerAns;
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('factory test', function () {
        let code = "angular.module('b').factory('serviceId', function() {});";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "b",
            "dependencies": [],
            "body": [{"object": "factory", "name": "serviceId", "variables": [], "controllers":[]}],
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('filter test', function () {
        let code = "angular.module('c').filter('reverse', function() {});"
        let answer = [{
            "path": "",
            "object": "module",
            "name": "c",
            "dependencies": [],
            "body": [{"object": "filter", "name": "reverse", "variables": [], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });


    it('directive test', function () {
        let code = "angular.module('d').directive('myCustomer', function() {});"
        let answer = [{
            "path": "",
            "object": "module",
            "name": "d",
            "dependencies": [],
            "body": [{"object": "directive", "name": "my-customer", "variables": [], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = "angular.module('e').component('heroDetail', {});"
        let answer = [{
            "path": "",
            "object": "module",
            "name": "e",
            "dependencies": [],
            "body": [{"object": "component", "name": "hero-detail", "variables": [], "controllers":[]}]
        }];
            assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = 'angular.module("e").filter("a", function($q) {return $q;});';
        let answer = [{
            "path": "",
            "object": "module",
            "name": "e",
            "dependencies": [],
            "body": [{"object": "filter", "name": "a", "variables": ['$q'], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = 'angular.module("e").animation("a", function animation($q) {return $q;});';
        let answer = [{
            "path": "",
            "object": "module",
            "name": "e",
            "dependencies": [],
            "body": [{"object": "animation", "name": "a", "variables": ['$q'], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = 'angular.module("").animation("", function($q) {});';
        let answer = [{
            "path": "",
            "object": "module",
            "name": "",
            "dependencies": [],
            "body": [{"object": "animation", "name": "", "variables": ['$q'], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });


    let runCode = ['angular.module("").run("");', 'angular.module("").run(function($q) {$q()})', 'function fn($q) {}; angular.module("").run(fn);', 'angular.module("").run(function run($q) {});', 'var app = angular.module(""); app.run(function($q) {});'];
    let runAns = [[{
        "path": "",
        "object": "module",
        "name": "",
        "dependencies": [],
        "body": [{"object": "run", "name": "", "variables": [], "controllers":[]}],
    }],
    [{
        "path": "",
        "object": "module",
        "name": "",
        "dependencies": [],
        "body": [{"object": "run", "variables": ['$q'], "controllers":[]}]
    }]];

    it('component test', function () {
        let code = runCode[0];
        let answer = runAns[0];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = runCode[1];
        let answer = runAns[1];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = runCode[2];
        let answer = runAns[1];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = runCode[3];
        let answer = runAns[1];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = runCode[4];
        let answer = runAns[1];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = 'angular.module("e").service("a", "");';
        let answer = [{
            "path": "",
            "object": "module",
            "name": "e",
            "dependencies": [],
            "body": [{"object": "service", "name": "a", "variables": [], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('component test', function () {
        let code = 'angular.module("").config(function($httpProvider) {$httpProvider.defaults.headers.post.answer="42"});';
        let answer = [{
            "path": "",
            "object": "module",
            "name": "",
            "dependencies": [],
            "body": [{"object": "config", "variables": ['$httpProvider'], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });


    it('component test', function () {
        let code = 'angular.module("").config(function($httpProvider) {})';
        let answer = [{
            "path": "",
            "object": "module",
            "name": "",
            "dependencies": [],
            "body": [{"object": "config", "variables": ['$httpProvider'], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });


    it('component test', function () {
        let code = 'angular.module("").config(function config($httpProvider) {})';
        let answer = [{
            "path": "",
            "object": "module",
            "name": "",
            "dependencies": [],
            "body": [{"object": "config", "variables": ['$httpProvider'], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });
});