(function () {
    var Pos = CodeMirror.Pos;

    CodeMirror.flexibleSearchHint = function (editor, options) {
        return scriptHint(editor, function (cm, cursor) {            
            var lineInfo = cm.lineInfo(cursor.line);
            var lineText = lineInfo.text ;
            token = CodeMirror.getCurToken(lineText, cursor.ch)            
            return token;
        }, options);
    };

    function defineWords(style, string) {
        var split = string.split('|');
        for (var i = 0; i < split.length; i++) {
            words[split[i]] = style;
        }
    };

    defineWords('flexsearch_cmd', 'SELECT|WHERE|JOIN|ON|AND|OR|GROUP BY|HAVING');

    CodeMirror.getCurToken = function (lineText, pos) {        
        var partBeforeCursor = lineText.substring(0, pos)
        var partAfterCursor = lineText.substring(pos,1000000);
        var i = partBeforeCursor.length - 1;                  
        while (i>0) {
            var curCh = partBeforeCursor.charCodeAt(i);              
            if ( curCh == 46 || (curCh >= 65 && curCh < 91) || (curCh >= 97 && curCh < 123) || (curCh >= 48 && curCh < 58)) { //a..z A..Z 0..9 and '.'                  
                  i = i - 1;                                      
            } else 
            {
                break;
            }
        }
        var partBeforeCursorAlpha =  partBeforeCursor.substring(i, partBeforeCursor.length);
        i = 0;          
        while (i < partAfterCursor.length) {
            var curCh = partAfterCursor.charCodeAt(i);              
                if ( curCh == 46 || (curCh >= 65 && curCh < 91) || (curCh >= 97 && curCh < 123) || (curCh >= 48 && curCh < 58)) { //a..z A..Z 0..9 and '.'                  
                  i = i + 1;                                        
            } else 
            {
                break;
            }
        }
        var partAfterCursorAlpha =  partAfterCursor.substring(0, i);          
        var cplx = partBeforeCursorAlpha + partAfterCursorAlpha;
        var token = {}; 
        token.string = cplx;        
        if (partBeforeCursorAlpha.indexOf(".") >= 0 && partAfterCursorAlpha.indexOf(".") == -1) {
            token.state = impexStateEnum.attribute;
            token.string = cplx.substring(cplx.indexOf("."), 1000);            
            token.start = pos - (partBeforeCursorAlpha.length - partBeforeCursorAlpha.indexOf(".") ) + 1;
            token.end = token.start + token.string.length;              
        }            
        if (partAfterCursorAlpha.indexOf(".") >= 0 && partBeforeCursorAlpha.indexOf(".") == -1) {
            token.state = impexStateEnum.base;
            token.string = cplx.substring(0, (cplx+".").indexOf("."));            
            token.start = pos - partBeforeCursorAlpha.length - 1;
            token.end = token.start + token.string.length;  
        }        

        if (partAfterCursorAlpha.indexOf(".") == -1 && partBeforeCursorAlpha.indexOf(".") == -1) {            
            token.state = impexStateEnum.base;
            token.string = cplx.substring(0, (cplx+".").indexOf("."));            
            token.start = pos - partBeforeCursorAlpha.length - 1;
            token.end = token.start + token.string.length;  
        }

        if (partBeforeCursor.toLowerCase().endsWith("join"+token.string.toLowerCase())) {
            token.state = impexStateEnum.join;            
        }

        return token;
      }

    types = {};

    function scriptHint(editor, getToken, options) {        
        if (!styleEnabled) {
            return null;
        }        
        var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
        var input = token.string.trim();
        var result = [];
        var lineInfo = editor.lineInfo(cur.line);
        var lineText = lineInfo.text;

        token = tprop = {
            start: cur.ch, end: cur.ch, string: "", state: token.state,
            type: null
        };

        var replaceToken = false;
        var tagStart = null;
        if (token.state != null) {
            curr_state = token.state
            replaceToken = true;
            tagStart = token.start;
        }

        if (lineText.trim().length == 0) {
            curr_state = impexStateEnum.base;
        }

        switch (curr_state) {
            case impexStateEnum.base: {
                
                if (input.startsWith("{")) {                                            
                        tagStart = lineText.substring(0, cur.ch).lastIndexOf("{") + 1;
                        token.end = tagStart + input.length - 1;
                        input = input.substring(input.lastIndexOf("{")+1,1000);                
                        result = getContentTypes(input);                             
                        var aliases = getAliasesForTyping(editor, input);
                        aliases.forEach(item => {
                            result.push(item);
                        })                        
                        break;
                }
                result = getCommands(input, "flexsearch_cmd");
                token.start = 0;

                break;
            }

            case impexStateEnum.join: {                                            
                    tagStart = lineText.substring(0, cur.ch).toLowerCase().lastIndexOf("join") + 5;
                    token.start = tagStart;
                    token.end = tagStart + input.length ;
                    replaceToken = true;
                    input = input.substring(input.lastIndexOf(" ")+1,1000);                
                    result = getContentTypes(input);                             
                    var aliases = getAliasesForTyping(editor, input);
                    aliases.forEach(item => {
                        result.push(item);
                    })                        
                    break;            
            }

            case impexStateEnum.attribute: {                            
                    startStr = lineText.substring(0, cur.ch);     
                    var curr_type = lineText
                        .substring(startStr.lastIndexOf("{")+1,startStr.lastIndexOf("{")+1+startStr.lastIndexOf(".")-startStr.lastIndexOf("{"))                    
                    curr_type = curr_type.substring(0,curr_type.indexOf("."));
                    curr_type = getTypeForAliasIfExists(editor, curr_type);
                    if (input.startsWith(".")) {                                                
                        tagStart = startStr.lastIndexOf(".") + 1;
                        token.end = tagStart + input.length - 1;
                        input = startStr.substring(startStr.lastIndexOf(".")+1,1000);                                        
                    }
                    result = getAttributes(curr_type, input);                                                            
                    break;
            }
        }
        return {
            list: result,
            from: replaceToken ? Pos(cur.line, tagStart == null ? token.start : tagStart) : cur,
            to: replaceToken ? Pos(cur.line, token.end) : cur
        };
    }

    function getTypeAttributes(type) {
        var token = $("meta[name='_csrf']").attr("content");
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
    function parseAliases(editor) {
        
        var aliases = new Map();
        aliases.set("sampleAlias", "DcpCarProduct");

        i = 0;
        while (line = editor.getLine(i++))
        {            
            var re1 = /\{([a-zA-Z0-9]+?)[\}]*[ \t]+[aA][sS][ \t]([a-zA-Z0-9]+)/g;
            var re2 = /[Jj][Oo][Ii][nN][ \t]+([a-zA-Z0-9]+?)[\}]*[ \t]+[aA][sS][ \t]([a-zA-Z0-9]+)/g;
            do {
                m = re1.exec(line);
                if (m) aliases.set(m[2], m[1])
                m = re2.exec(line);
                if (m) aliases.set(m[2], m[1])                
            } while (m);
        }
        return aliases;
    }
    function getAllAliases(editor) {        
        var aliases = parseAliases(editor);        
        return aliases;
    }
    function getAliasesForTyping(editor, typedStr) {
        var aliases = getAllAliases(editor);
        var hints = [];
        aliases.forEach( (k,v) => {
            if (typedStr != "" && v.startsWith(typedStr)) 
               {
                   hints.push(v);
               }
        })
        return hints;
    }
    function getTypeForAliasIfExists(editor, possibleAlias) {        
        var aliases = getAllAliases(editor);
        typ = aliases.get(possibleAlias);
        if (typ != null) {
            return typ;
        }
        return possibleAlias;
    }

    function getContentTypes(start) {
        var result = [];
        var token = $("meta[name='_csrf']").attr("content");
        $.ajax({
            url: allTypesUrl,
            type: 'POST',
            data: {
                start: start
            },
            async: false,
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token
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

    function getAttributes(type, start) {
        var result = [];      
        getTypeAttributes(type);                    
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


})();