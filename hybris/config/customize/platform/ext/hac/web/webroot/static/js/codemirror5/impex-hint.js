/**
 * NOTE: MUST be used in combination with impexhighlight.js! Otherwise it is not working!
 */
(function () {
    var Pos = CodeMirror.Pos;

    function scriptHint(editor, getToken, options) {        
        if (!styleEnabled) {
            return null;
        }

        // Find the token at the cursor
        var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
        var input = token.string.trim();
        var result = [];
        var lineInfo = editor.lineInfo(cur.line);
        var lineText = lineInfo.text;

        token = tprop = {
            start: cur.ch, end: cur.ch, string: "", state: token.state,
            type: null
        };

        if (lineText.trim().length == 0) {
            curr_state = impexStateEnum.base;
        }

        switch (curr_state) {
            case impexStateEnum.base: {
                result = getCommands(input, "impex_cmd");
                token.start = 0;
                break;
            }
            case impexStateEnum.header_type: {
                result = getContentTypes(input);
                token.start -= input.length;
                break;
            }
            case impexStateEnum.header_attr: {
                var content = readCurrentInput(input, lineText, token);
                if (content.mode === ';') {
                    result = getHeaderAttributes(curr_type, content.input);
                    result = result.concat(getVariables(""));
                }
                if (content.mode === '[') {
                    result = getCommands(content.input.trim(), "impex_modifier");
                }
                if (content.mode === '=') {
                    result = getCommands(content.input, "impex_atomic");
                    if (content.input === "") {
                        result = result.concat(getVariables(""));
                    }
                }
                break;
            }
            case impexStateEnum.variable: {
                var content = readCurrentInput(input, lineText, token);
                result = getVariables(content.mode + content.input);
                token.start -= 1;
                break;
            }
            default: {
                result = getVariables("");
                break;
            }
        }
        return {
            list: result,
            from: Pos(cur.line, token.start),
            to: Pos(cur.line, token.end)
        };
    }

    CodeMirror.impexHint = function (editor, options) {
        return scriptHint(editor, function (e, cur) {
            return e.getTokenAt(cur);
        }, options);
    };

    function getCommands(start, wordClass) {
        var result = [];
        for (var cmd in words) {
            if (typeof cmd == 'undefined') {
                continue;
            }
            if (words[cmd] == wordClass) {
                if (start === "" || cmd.toLowerCase().indexOf(start.toLowerCase()) == 0) {
                    result.push(cmd);
                }
            }
        }
        return result;
    }

    function getVariables(start) {
        if (start === '$') {
            return Object.keys(variables);
        }
        else {
            var result = [];
            for (var variable in variables) {
                if (variable.toLowerCase().indexOf(start.toLowerCase()) == 0) {
                    result.push(variable);
                }
            }
            return result;
        }
    }

    function getContentTypes(start) {
        var result = [];
        $.ajax({
            url: allTypesUrl,
            type: 'POST',
            data: {
                start: start
            },
            async: false,
            headers: {
                'Accept': 'application/json',
                'X-CSRF-Token': $("meta[name='_csrf']").attr("content")
            },
            success: function (data) {
                if (data.exists) {
                    result = data.types;
                }
            },
            error: hac.global.err
        });
        return result;
    }

    function getHeaderAttributes(type, start) {
        var result = [];
        var attrs = types[type];
        if (attrs == null) {
            return [];
        }
        for (var i = 0; i < attrs.length; i++) {
            if (attrs[i].toLowerCase().indexOf(start.toLowerCase()) == 0) {
                result.push(attrs[i]);
            }
        }
        return result;
    }

    function readCurrentInput(input, line, token) {
        var result = {
            input: "",
            mode: ""
        }
        if (input.length == 1) {
            if (!/[a-zA-Z0-9_-]/.test(input)) {
                result.input = "";
                result.mode = input;
                return result;
            }
        }
        var i;
        for (i = token.end - 1; i >= 0; i--) {
            if (/[a-zA-Z0-9_-\s]/.test(line.charAt(i))) {
                result.input = line.charAt(i) + result.input;
            }
            else {
                result.mode = line.charAt(i);
                break;
            }
        }
        token.start = i + 1;
        return result;
    }
})();
