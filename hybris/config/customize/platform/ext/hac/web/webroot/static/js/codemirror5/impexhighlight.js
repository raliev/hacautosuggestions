/**
 * Impex Parser file for CodeMirror, highlighting the header mode/attributes, Macro Information and Comments.
 * Also provides necessary data for impex-hint.js, which can ONLY be used in combination with impexhighlight.js!
 * Also creates necessary data for mouseover-support at variables, defined in impex.js.
 */

//Enum which indicates in which state the current parser is. Used by impex-hints.js
var impexStateEnum = {
    base: 0,
    header_type: 1,
    header_attr: 2,
    variable: 6,
    data: 7,
    comment: 8,
    string: 9
};

var curr_state = impexStateEnum.base; //Used bye impex-hints.js
var curr_type;
var types = {};
var words = {};
var variables = {};
CodeMirror.defineMode('impex', function () {
    function defineWords(style, string) {
        var split = string.split(' ');
        for (var i = 0; i < split.length; i++) {
            words[split[i]] = style;
        }
    };

    // Commands.
    defineWords('impex_cmd', 'INSERT UPDATE INSERT_UPDATE REMOVE');

    //Modifier.
    defineWords('impex_modifier', 'batchmode cacheUnique processor parallel translator default lang unique allownull ignorenull dateformat numberformat ' +
        'collection-delimiter path-delimiter key2value-delimiter map-delimiter mode cellDecorator virtual ignoreKeyCase alias pos forceWrite');

    //Atomic
    defineWords('impex_atomic', 'true false');

    var token = $("meta[name='_csrf']").attr("content");

    function getTypeAttributes(type) {

        $.ajax({
            url: typeAttrUrl,
            type: 'POST',
            data: {
                type: type
            },
            async: false,
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token
            },
            success: function (data) {
                if (data.exists) {
                    types[type] = data.attributes;
                }
            },
            error: hac.global.err
        });
    };

    function tokenBase(stream, state) {
        curr_state = impexStateEnum.base;
        stream.eatSpace();
        var ch = stream.next();
        if (ch == null) {
            return null;
        }
//    //Commentary
        if (ch === '#') {
            curr_state = impexStateEnum.comment;
            stream.skipToEnd();
            return "impex_comment";
        }
        //Variable declaration
        if (ch === '$') {
            curr_state = impexStateEnum.variable;
            if (!stream.eol()) {
                state.tokens.unshift(variableName);
            }
            return 'impex_var';
        }
        if (ch === dataSeparator) {
            curr_state = impexStateEnum.data;
            state.tokens.unshift(data);
            return "impex_dataseparator";
        }

        stream.eatWhile(/[a-zA-Z0-9_-]/);
        var cur = stream.current();
        if (stream.eol()) {
            return null;
        }
        //Header Declaration.
        if (words[cur] === 'impex_cmd') {
            curr_state = impexStateEnum.header_type;
            if (!stream.eol()) {
                state.tokens.unshift(headerType);
            }
            return words[cur];
        }
        //Data Declaration.
        else {
            curr_state = impexStateEnum.data;
            state.tokens.unshift(data);
            stream.backUp(stream.current().length);
            return tokenize(stream, state);
        }
    };

    //Getting the header ComposedType.
    var headerType = function (stream, state) {
        var ch = stream.next();
        if (stream.eol()) {
            eol(state);
        }
        if (!/[a-zA-Z0-9_-]/.test(ch)) {
            return null;
        }
        curr_state = impexStateEnum.header_type;
        stream.eatWhile(/[a-zA-Z0-9_-]/);
        var cur = stream.current();
        if (!types.hasOwnProperty(cur) && !stream.eol()) {
            getTypeAttributes(cur);
        }
        state.tokens.shift();
        if (!stream.eol()) {
            state.tokens.unshift(header(cur));
            if (types.hasOwnProperty(cur)) {
                curr_type = cur;
                return 'impex_type_valid';
            }
            else {
                curr_type = null;
                return 'impex_type_invalid';
            }
        }
        return null;
    };

    //Parsing an Header-Attribute.
    function headerAttr(type) {
        return function (stream, state) {
            eol(state);
            stream.eatWhile(/[a-zA-Z0-9_-]/);
            var cur = stream.current();
            if (stream.eol()) {
                eol(state);
            }
            if (types[type] != null && types[type].join(',').toLowerCase().split(',').indexOf(cur.toLowerCase()) > -1) {
                return 'impex_attr_valid';
            }
            return 'impex_attr_invalid';
        };
    }

    //Common Header-state.
    function header(type) {
        return function (stream, state) {
            curr_state = impexStateEnum.header_attr;
            stream.eatSpace();
            var ch = stream.next();

            if (ch == null) {
                return null;
            }
            if (ch === '#') {
                curr_state = impexStateEnum.comment;
                stream.skipToEnd();
                eol(state);
                return 'impex_comment';
            }
            if (ch === '$') {
                curr_state = impexStateEnum.variable;
                stream.eatWhile(/[a-zA-Z0-9_-]/);
                if (stream.eol()) {
                    eol(state);
                }
                return 'impex_var';
            }
            if (ch === '@') {
                stream.eatWhile(/[a-zA-Z0-9_-]/);
                if (stream.eol()) {
                    eol(state);
                }
                return 'impex_attr_special';
            }
            if (ch === '&') {
                stream.eatWhile(/[a-zA-Z0-9_-]/);
                if (stream.eol()) {
                    eol(state);
                }
                return 'impex_document_id';
            }
            if (ch === dataSeparator) {
                stream.eatSpace();
                if (stream.eol()) {
                    state.tokens.shift();
                }
                else {
                    state.tokens.unshift(headerAttr(type));
                }
                return null;
            }
            if (ch === '"' || ch === "'") {
                stream.eatWhile(new RegExp("[^" + ch + "]"));
                if (stream.eol()) {
                    var backup = stream.current().length;
                    if (backup > 1) {
                        stream.backUp(backup - 1);
                    }
                }
                else {
                    stream.next();
                    if (stream.eol()) {
                        eol(state);
                    }
                    else {
                        current_state = impexStateEnum.data;
                    }
                    return 'impex_string';
                }
            }
            if (!ch.match(/[a-zA-Z0-9_-]/)) {
                if (stream.eol()) {
                    state.tokens.shift();
                }
                return null;
            }
            stream.eatWhile(/[a-zA-Z0-9_-]/);
            var cur = stream.current();
            if (stream.eol()) {
                state.tokens.shift();
            }
            if (words.hasOwnProperty(cur)) {
                return words[cur];
            }
            return null;
        };
    }

    //Parsing the name of an variable.
    var variableName = function (stream, state) {
        var ch = stream.next();
        if (ch == null) {
            return null;
        }
        stream.eatWhile(/[^=]/);
        state.tokens.shift();
        var varName = stream.current();
        ch = stream.peek();
        if (!variables.hasOwnProperty(varName) && ch === '=') {
            variables['$' + varName] = "";
            state.tokens.unshift(varValue('$' + varName));
        }
        return 'impex_var';
    }

    //Parsing the value of a variable called varName.
    function varValue(varName) {
        return function (stream, state) {
            if (stream.sol()) {
                state.tokens.shift();
                return null;
            }
            var ch = stream.next();
            if (ch == null) {
                return null;
            }
            if (ch === '=') {
                variables[varName] += ch;
                return null;
            }
            if (ch === '#') {
                stream.skipToEnd();
                return 'impex_comment';
            }
            if (ch === '"' || ch === "'") {
                stream.eatWhile(new RegExp("[^" + ch + "]"));
                if (stream.eol()) {
                    var backup = stream.current().length;
                    if (backup > 1) {
                        stream.backUp(backup - 1);
                    }
                }
                else {
                    stream.next();
                    if (stream.eol()) {
                        eol(state);
                    }
                    else {
                        current_state = impexStateEnum.data;
                    }
                    return 'impex_string';
                }
            }
            if (ch === '$') {
                stream.eatWhile(/[a-zA-Z0-9_-]/);
                variables[varName] += stream.current();
                return 'impex_var';
            }
            variables[varName] += ch;
            return null;
        }
    }

    //Parsing data.
    var data = function (stream, state) {
        stream.eatSpace();
        var ch = stream.next();

        if (ch == null) {
            return null;
        }
        if (stream.eol()) {
            eol(state);
        }
        if (ch === dataSeparator) {
            return 'impex_dataseparator';
        }
        if (ch === "$") {
            curr_state = impexStateEnum.variable;
            stream.eatWhile(/[a-zA-Z0-9_-]/);
            curr_state = impexStateEnum.data;
            if (stream.eol()) {
                eol(state);
            }
            return 'impex_var';
        }
        if (ch === '#') {
            stream.skipToEnd();
            eol(state);
            return 'impex_comment';
        }
        if (ch === '"' || ch === "'") {
            stream.eatWhile(new RegExp("[^" + ch + "]"));
            if (stream.eol()) {
                var backup = stream.current().length;
                if (backup > 1) {
                    stream.backUp(backup - 1);
                }
            }
            else {
                stream.next();
                if (stream.eol()) {
                    eol(state);
                }
                else {
                    current_state = impexStateEnum.data;
                }
                return 'impex_string';
            }
        }
        return null;
    };

    function eol(state) {
        state.tokens.shift();
    }

    function tokenize(stream, state) {
        return (state.tokens[0] || tokenBase)(stream, state);
    };

    return {
        startState: function () {
            return {tokens: [], state: ""};
        },
        token: function (stream, state) {
            return tokenize(stream, state);
        }
    };
});

CodeMirror.defineMIME('text/x-impex', 'impex');