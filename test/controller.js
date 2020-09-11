let assert = require('assert');
let modules = require('./../collect_modules.js');

describe('Different types of controller definition', function () {
    it('Function Expression', function () {
        let code = "angular.module('a', []).component('serviceId', {controller: function(a, v, b) {}})";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": [],
            "body": [{"object": "component", "name": "service-id", "variables": ["a", "v", "b"], "controllers":[]}]}];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('Arrow Function', function () {
        let code = "angular.module('a', []).component('serviceId', {controller: (a, v, b) => {}})";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": [],
            "body": [{"object": "component", "name": "service-id", "variables": ["a", "v", "b"], "controllers":[]}]}];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('Arrow Function', function () {
        let code = "angular.module('a', []).component('serviceId', {controller: (a, v, b) => ({})})";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": [],
            "body": [{"object": "component", "name": "service-id", "variables": ["a", "v", "b"], "controllers":[]}]}];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });
});

describe('Different types of function', function () {
    it('Function Expression', function () {
        let code = "angular.module('a', []).factory('serviceId', function(a, v, b) {})";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": [],
            "body": [{"object": "factory", "name": "serviceId", "variables": ["a", "v", "b"], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('Arrow function 1', function () {
        let code = "angular.module('a', []).factory('serviceId', (a, v, b) => {})";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": [],
            "body": [{"object": "factory", "name": "serviceId", "variables": ["a", "v", "b"], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

    it('Arrow function 2', function () {
        let code = "angular.module('a', []).factory('serviceId', (a, v, b) => ({}))";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": [],
            "body": [{"object": "factory", "name": "serviceId", "variables": ["a", "v", "b"], "controllers":[]}]
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "", false, "es").result), JSON.stringify(answer));
    });

});