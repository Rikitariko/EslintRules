let assert = require('assert');
let htmlParser = require('./../html_parse/htmlParser');
let jsParser = require('./../html_parse/findFilter');

describe('Detection of filters in html', function () {
    it('Directive as expression ', function () {
        let code = '<html><body><ul><li>{{ x | myFormat }}</li></ul></body></html>';
        let answer = [{ type: 'filter', name: 'myFormat' }];
        assert.equal(JSON.stringify(htmlParser.getTokensFromHtmlByCode(code)), JSON.stringify(answer));
    });
    it('Directive as attribute', function () {
        let code = '<html><body><ul><li ng-repeat="it in arr | foo"></li></ul></body></html>';
        let answer = [{ type: 'filter', name: 'foo' }, { type: 'directive', name: 'ng-repeat' }];
        assert.equal(JSON.stringify(htmlParser.getTokensFromHtmlByCode(code)), JSON.stringify(answer));
    });

    it('Directive as attribute with additional properties', function () {
        let code = '<html><body><tr ng-repeat="friendObj in friends | filter:search:strict"></tr></body></html>';
        let answer = [{ type: 'filter', name: 'filter' }, { type: 'directive', name: 'ng-repeat' }];
        assert.equal(JSON.stringify(htmlParser.getTokensFromHtmlByCode(code)), JSON.stringify(answer));
    });
});

describe('Detection of filters in templates', function () {
    it('Directive as expression ', function () {
        let code = 'angular.module(\'example\', []).factory(\'show\', function() {ctrl.a = function() {return {template: \'<div>{{x | foo}}</div>\'};};});';
        let answer = [{ type: 'filter', name: 'foo' }];
        assert.equal(JSON.stringify(htmlParser.getTokensFromJSByCode(code)), JSON.stringify(answer));
    });
    it('Directive as attribute', function () {
        let code = 'angular.module(\'example\', []).factory(\'show\', function() {ctrl.a = function() {return {template: \'<div ng-repeat="it in arr | foo"></div>\'};};});';
        let answer = [{"type":"filter","name":"foo"}, {"type":"directive","name":"ng-repeat"}];
        assert.equal(JSON.stringify(htmlParser.getTokensFromJSByCode(code)), JSON.stringify(answer));
    });


    it('Directive as attribute with additional properties', function () {
        let code = 'angular.module(\'example\', []).factory(\'show\', function() {ctrl.a = function() {return {template: \'<html><body><tr ng-repeat="friendObj in friends | filter:search:strict"></tr></body></html>\'};};});';
        let answer = [{"type":"filter","name":"filter"}, {"type":"directive","name":"ng-repeat"}];
        assert.equal(JSON.stringify(htmlParser.getTokensFromJSByCode(code)), JSON.stringify(answer));
    });
});

describe('Detection of filters in js', function () {
    it('Directive as expression ', function () {
        let code = 'angular.module(\'example\', []).factory(\'show\', function() {ctrl.a = function() {return {template: \'<div>{{x | foo}}</div>\'};};});';
        let answer = [{ type: 'filter', name: 'foo' }];
        assert.equal(JSON.stringify(htmlParser.getTokensFromJSByCode(code)), JSON.stringify(answer));
    });
    it('Directive as attribute', function () {
        let code = 'angular.module(\'example\', []).factory(\'show\', function() {ctrl.a = function() {return {template: \'<div ng-repeat="it in arr | foo"></div>\'};};});';
        let answer = [{"type":"filter","name":"foo"}, {"type":"directive","name":"ng-repeat"}];
        assert.equal(JSON.stringify(htmlParser.getTokensFromJSByCode(code)), JSON.stringify(answer));
    });


    it('Directive as attribute with additional properties', function () {
        let code = 'angular.module(\'example\', []).factory(\'show\', function() {ctrl.a = function() {return {template: \'<html><body><tr ng-repeat="friendObj in friends | filter:search:strict"></tr></body></html>\'};};});';
        let answer = [{"type":"filter","name":"filter"}, {"type":"directive","name":"ng-repeat"}];
        assert.equal(JSON.stringify(htmlParser.getTokensFromJSByCode(code)), JSON.stringify(answer));
    });
});