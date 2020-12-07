/**
 * Threaddump Parser file for CodeMirror.
 */

CodeMirror.defineMode('threaddump', function() {	
	var words = {};
	function define(style, string) {
		var split = string.split(' ');
		for(var i = 0; i < split.length; i++) {
			words[split[i]] = style;
		}
	};

  // Keywords
  define('dump_state', 'NEW RUNNABLE BLOCKED WAITING TIMED_WAITING TERMINATED');

  function tokenBase(stream, state) {

    var sol = stream.sol();
    var ch = stream.next();
    
    if (ch === '"' && sol) {
        stream.skipToEnd();
        return "dump_header";
    }

    stream.eatWhile(/\S/);
	var cur = stream.current();
	if(cur === "Full"){
		stream.skipToEnd();
		return "dump_main";
	}
	if(cur === "\tLocked"){
		stream.skipToEnd();
		return "dump_locked";
	}
	stream.next();
	return words.hasOwnProperty(cur) ? words[cur] : null;
  }
  
  function checkMode(stream, state){
	  
  }
  
  function tokenize(stream, state) {
	    return (state.tokens[0] || tokenBase) (stream, state);
  };
  
  return {
	  startState: function() {return {tokens:[]};},
	  token: function(stream, state) {
	      return tokenize(stream, state);
	  }
  };
});
  
CodeMirror.defineMIME('text/x-dump', 'threaddump');
