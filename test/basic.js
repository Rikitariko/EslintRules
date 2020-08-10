let assert = require('assert');
let modules = require('./../collect_modules.js');

describe('Detection of modules', function () {
    it('Controller test', function () {
        let code = "angular.module('a').controller('GreetingController', function() {});";
        let answer = [{
            "path": "",
            "object": "module",
            "name": "a",
            "dependencies": [],
            "body": [{"object": "controller", "name": "GreetingController", "variables": [], "controllers":[]}],
        }];
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "")), JSON.stringify(answer));
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
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "")), JSON.stringify(answer));
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
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "")), JSON.stringify(answer));
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
        assert.equal(JSON.stringify(modules.getObjectByCode(code, "")), JSON.stringify(answer));
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
            assert.equal(JSON.stringify(modules.getObjectByCode(code, "")), JSON.stringify(answer));
    });
});