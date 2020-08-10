'use strict';
const tags = ['!--...--', '!DOCTYPE', 'a', 'abbr', 'acronym', 'abbr', 'address', 'applet', 'embed', 'object', 'area', 'article', 'aside', 'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'ul', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'h6', 'head', 'header', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'input', 'legend', 'fieldset', 'li', 'link', 'main', 'map', 'mark', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'video', 'audio', 'span', 'strike', 'del', 's', 'strong', 'style', 'sub', 'summary', 'details', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'video', 'audio', 'tt', 'u', 'ul', 'var', 'video', 'wbr'];
const attributes = ['hidden', 'high', 'href', 'hreflang', 'http-equiv', 'icon', 'id', 'ismap', 'itemprop', 'keytype', 'kind', 'label', 'lang', 'language', 'list', 'loop', 'low', 'manifest', 'max', 'maxlength', 'media', 'method', 'min', 'multiple', 'name', 'novalidate', 'open', 'optimum', 'pattern', 'ping', 'placeholder', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'reversed', 'rows', 'rowspan', 'sandbox', 'spellcheck', 'scope', 'scoped', 'seamless', 'selected', 'shape', 'size', 'sizes', 'span', 'src', 'srcdoc', 'srclang', 'srcset', 'start', 'step', 'style', 'summary', 'tabindex', 'target', 'title', 'type', 'usemap', 'value', 'width', 'wrap', 'border', 'buffered', 'challenge', 'charset', 'checked', 'cite', 'class', 'code', 'codebase', 'color', 'cols', 'colspan', 'content', 'contenteditable', 'contextmenu', 'controls', 'coords', 'datetime', 'default', 'defer', 'dir', 'dirname', 'disabled', 'download', 'draggable', 'dropzone', 'enctype', 'for', 'form', 'formaction', 'headers', 'height', 'accept', 'accept-charset', 'accesskey', 'action', 'align', 'alt', 'async', 'autocomplete', 'autofocus', 'autoplay', 'autosave', 'bgcolor'];
const fs = require('fs');
const esquery = require('esquery');
const recast = require('recast');
const HTML = require('html-parse-stringify');
const getAST = require('./angular_parser.js').getAST;

function extractExpressionFromRepeat(expression) {
    const match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
    return (match && match[2]) || '';
}

function extractExpressionFromOption(expression) {
    const match = expression.match(/^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+select\s+as\s+(.*?))?(?:\s+describe\sas\s+(.*?))?(?:\s+for\s+)?([$\w]+)\s+in\s+(.*?)(?:\s+track\sby\s+(.*?))?$/);
    return (match && match[2]) || '';
}

function findDirective(node) {
    if (node === 'undefined' || node.type === 'text')
    {return [];}

    let res = [];
    if (tags.indexOf(node.name) === -1) {
        res = [{
            type: 'directive',
            name: node.name
        }];
    }

    for (let key in node.attrs) {
        if (attributes.indexOf(key) === -1) {
            res.push({
                type: 'directive',
                name: key
            });
        }
    }

    for (let item in node.children)
    {res = res.concat(findDirective(node.children[item]));}

    return res;
}

function findFilter(node) {
    if (node === 'undefined')
    {return [];}

    let res = [];
    let matches = [];
    let fl = false;
    let pos = 0;
    if (node.type === 'text') {
        while (node.content.indexOf('|', pos + 1) !== -1) {
            pos = node.content.indexOf('|', pos + 1);
            if (pos !== node.content.length - 1 && pos !== -1 && node.content[pos - 1] !== '|' && node.content[pos + 1] !== '|') {
                fl = true;
                break;
            }
        }
    }

    if (node.type === 'text' && fl) {
        let l = node.content.indexOf('{{');
        let r = node.content.indexOf('}}', l);
        matches = (l !== -1) ? esquery(getAST(node.content.slice(l + 2, r)), '[filter="true"]') : matches;

        matches.forEach(function(item) {
            res.push({
                type: 'filter',
                name: item.callee.name
            });
        });

        return res;
    }


    for (let key in node.attrs) {
        fl = false;
        pos = 0;
        while (node.attrs[key].indexOf('|', pos + 1) !== -1) {
            pos = node.attrs[key].indexOf('|', pos + 1);
            if (pos !== node.attrs[key].length - 1 && pos !== -1 && node.attrs[key][pos - 1] !== '|' && node.attrs[key][pos + 1] !== '|') {
                fl = true;
                break;
            }
        }

        if (fl && key !== 'ng-pattern') {
            let str = node.attrs[key];
            let l = str.indexOf('{{');
            let r = str.indexOf('}}', l);
            if (l !== -1 && r !== -1) {
                str = str.slice(l + 2, r);
            }

            if (key === 'ng-repeat' || key === 'rg-permission-if')
            {matches = esquery(getAST(extractExpressionFromRepeat(str)), '[filter="true"]');}
            else if (key === 'options')
            {matches = esquery(getAST(extractExpressionFromOption(str)), '[filter="true"]');}
            else
            {matches = esquery(getAST(str), '[filter="true"]');}

            matches.forEach(function(item) {
                res.push({
                    type: 'filter',
                    name: item.callee.name
                });
            });
        }
    }

    for (let item in node.children)
    {res = res.concat(findFilter(node.children[item]));}

    return res;
}

function getTokensFromHtmlByCode(code) {
    let ast = HTML.parse(code);
    return findFilter(ast[0]).concat(findDirective(ast[0]));
}

function findTemplates(code) {
    let ast = recast.parse(code);
    let result = [];

    recast.visit(ast, {
        visitIdentifier: function(path) {
            this.traverse(path);
            if (path.node.name === 'template' && path.parentPath.value.value !== undefined && path.parentPath.value.value.type === 'Literal') {
                result = result.concat(getTokensFromHtmlByCode(path.parentPath.value.value.value));
            }
        }
    });
    return result;
}

function getTokensFromJSFilesByPath(files) {
    let result = [];

    files.forEach(function(file) {
        result = result.concat(findTemplates(fs.readFileSync(file).toString()));
    });
    return result;
}

// Main
function getTokensFromHtmlByPath(files) {
    let result = [];

    files.forEach(function(item){
        let ast = HTML.parse(fs.readFileSync(item).toString());
        result = result.concat(findDirective(ast[0]).concat(findFilter(ast[0])));
    });

    return result;
}


module.exports.getTokensFromHtmlByPath = getTokensFromHtmlByPath;
module.exports.getTokensFromJSFilesByPath = getTokensFromJSFilesByPath;
//let htmlRes = getTokensFromHtmlByPath(require('./../read_files.js').getFiles("html", "/home/asus/WebstormProjects/EslintRules"));
//let jsRes = getTokensFromJSFilesByPath(require('./../read_files.js').getFiles("js", "/home/asus/WebstormProjects/EslintRules"));

console.log(htmlRes);
console.log(jsRes);