let assert = require('assert');
let modules = require('./../collect_modules.js');

describe('Detection of dependencies', function () {
    it('test with require', function () {
        let code = "angular.module('a', [require('angular-route'), require('a/b/c').default, require('@some/a/b/c').default, require('a/b/csdsdf').default.name, require('./app/some').setSome(some).name, require('../asd').name,]).controller('GreetingController', function() {});";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": ["angular-route", "a/b/c", "@some/a/b/c", "a/b/csdsdf", "./app/some", "../asd"],
            "body": [{"object": "controller", "name": "GreetingController", "variables": [], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "")), JSON.stringify(answer));
    });

    it('test with array expression', function () {
        let code = "angular.module('a', ['sdfsdf', 'rtytu', 'klk']).controller('GreetingController', function() {});";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": ["sdfsdf", "rtytu", "klk"],
            "body": [{"object": "controller", "name": "GreetingController", "variables": [], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "")), JSON.stringify(answer));
    });
});