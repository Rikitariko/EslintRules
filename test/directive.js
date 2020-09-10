let assert = require('assert');
let parser = require('./../html_parse/htmlParser');

describe('Detection of directive', function () {
    it('Directive as element', function () {
        let code = '<html><body><foo></foo></body></html>';
        let answer = [{ type: 'directive', name: 'foo' }];
        assert.equal(JSON.stringify(parser.getTokensFromHtmlByCode(code)), JSON.stringify(answer));
    });
    it('Directive as attribute', function () {
        let code = '<html><body><div foo=""></div></body></html>';
        let answer = [{ type: 'directive', name: 'foo' }];
        assert.equal(JSON.stringify(parser.getTokensFromHtmlByCode(code)), JSON.stringify(answer));
    });
});