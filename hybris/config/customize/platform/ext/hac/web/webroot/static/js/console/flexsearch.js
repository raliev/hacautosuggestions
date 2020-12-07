/**
 * Script responsible for ajaxifing FlexibleSearch query form.
 */

var fsQueryEditor, sqlQueryEditor;
var cookieHistory = {};
var encryptionUrl, decryptionUrl;
var lastIndex = 0;
var cookieName = "FlexibleSearchHistory";
var historyMax;
var cookiePath;
var maxCookieSize = 3000;
var typeAttrUrl;
var allTypesUrl;
var styleEnabled = true;
var impexStateEnum = {
	base: 0,
	attribute : 1,
	impexStateEnum : 2  
};
var words = {};
var curr_state = impexStateEnum.base; 

function completeJoinIfPresent(cm, pred) {	
	var cur = cm.getCursor();
	if (cm.lineInfo(cur.line).text.substring(0, cur.ch).trim().toLowerCase().endsWith("join")) {
		curr_state =  impexStateEnum.join;
	}
	if (!pred || pred()) setTimeout(function() {
	  if (!cm.state.completionActive && curr_state == impexStateEnum.join)
	    {						
			//cm.showHint(cm, CodeMirror.impexHint);			
			CodeMirror.commands.autocomplete(cm);
		}
	}, 100);
	return CodeMirror.Pass;
}


function completeAfter(cm, pred) {
	curr_state =  impexStateEnum.base;
	var cur = cm.getCursor();
	if (!pred || pred()) setTimeout(function() {
	  if (!cm.state.completionActive)
	    {						
			//cm.showHint(cm, CodeMirror.impexHint);
			CodeMirror.commands.autocomplete(cm);
		}
	}, 100);
	return CodeMirror.Pass;
  }
function completeAfterProp(cm, pred) {	
	var cur = cm.getCursor();
	lineText = cm.lineInfo(cur.line).text
	curr_type = lineText.substring(lineText.lastIndexOf("{")+1,lineText.lastIndexOf("{")+1+lineText.lastIndexOf(".")-1-lineText.lastIndexOf("{"))  
	curr_state =  impexStateEnum.attribute;
	console.log("completeAfterProp "+pred);	
	if (!pred || pred()) setTimeout(function() {
	  if (!cm.state.completionActive)
	    {									
			CodeMirror.commands.autocomplete(cm);
		}
	}, 100);
	return CodeMirror.Pass;
  }

$(function() {
    var token = $("meta[name='_csrf']").attr("content");

	encryptionUrl =  $("#flexQueryForm").attr("action") + "encrypt";
	decryptionUrl =  $("#flexQueryForm").attr("action") + "decrypt";	
	historyMax = $("#tabs-5").attr("historyMax");
	cookiePath = $("#tabs-5").attr("cookiePath");
	
	typeAttrUrl = $("#content").attr("typeAttr-Url");
	allTypesUrl = $("#content").attr("allTypes-Url");

	CodeMirror.commands.autocomplete = function(cm) {		
		CodeMirror.showHint(cm, CodeMirror.flexibleSearchHint, 
			{
				completeSingle: true, //Determines whether, when only a single completion is available, it is completed without showing the dialog. Defaults to true.
				closeCharacters: /[\}]/
			});
    }

	$("#flexibleSearchQueryWrapper").resizable().height("250px").width("100%");	
	fsQueryEditor = CodeMirror.fromTextArea(document.getElementById("flexibleSearchQuery"), {
		mode: "text/x-sql",
		extraKeys: {
			"'.'": completeAfterProp,	
			"'{'": completeAfter,					
			"' '": completeJoinIfPresent,
			"Ctrl-Space": "autocomplete",
			handleCursorActivityAndFocus: {showToken: /\w/, annotateScrollbar: true}			
		  },
		//hintOptions: {schemaInfo: tags},		
		lineNumbers: false,
		lineWrapping: true,
		autofocus: true		
	});
	
	$("#sqlQueryWrapper").resizable().height("250px").width("100%");
	sqlQueryEditor = CodeMirror.fromTextArea(document.getElementById("sqlQuery"), {
		mode: "text/x-sql",
		lineNumbers: false,
		lineWrapping: true,
		autofocus: true
	});
	
	
	var sampleQueryEventHandler = function() {		
		// first clear the content of the textareas
		clearInputFields();
		// now copy the new query into the textArea and execute it
		var currentId = this.id;
		var isFs = Boolean.parse($("#" + currentId).attr("data-is-fsquery"));
		var query = $("#" + currentId).attr("data-sample-query");
		if (isFs) {
			setFsEditorValue(query, false);
		} else {
			setSqlEditorValue(query, false);
		}
	};

	$('.sample_query').click(sampleQueryEventHandler);
	$('body').on("click",'.h_sample_query', sampleQueryEventHandler);
	
	// Tabs
	$("#tabsNoSidebar").tabs();
	
	//Handles making the tab-text non-bold when clicked.
	$("#tabsNoSidebar").bind("tabsselect", function(event, ui){
		switch(lastIndex){
			case 0:
				$("#nav-tab-1").css("font-weight", "normal");
				break;
			;
			case 1:
				$("#nav-tab-2").css("font-weight", "normal");
				break;
			;
			case 2:
				$("#nav-tab-3").css("font-weight", "normal");
				break;
			;
			case 3:
				$("#nav-tab-4").css("font-weight", "normal");
				break;
			;
		}
		lastIndex = ui.index;
	});
	
	//Hide history-list initially.
	$("#historyLegend").hide();
	
	//Hide the error message initially
	$("#historyMax").hide();
	
	//Search for saved history in Cookie and load saved history queries.
	initHistory();
	
	//Adding console-Navigation to SQL-form
	$("#consoleNavigationWrapper").html($("#consoleNavigation").html());
	
	// We do not want to submit form using standard http
	$("#flexQueryForm").submit(function() {
		return false;
	});
	
	//Make sure that settings are applied in flexible and sql-view when changed.
	//=========================================
	$("#commitCheckbox1").change(function(){
		if($("#commitCheckbox1").is(":checked") != $("#commitCheckbox2").is(":checked")) { 
			$("#commitCheckbox2").click(); 
		}
	});
	$("#commitCheckbox2").change(function(){
		if($("#commitCheckbox1").is(":checked") != $("#commitCheckbox2").is(":checked")) { 
			$("#commitCheckbox1").click(); 
		}		
	});
	$("#locale1").change(function(){ 
		$("#locale2").val($("#locale1").val());	
	});
	$("#locale2").change(function(){ 
		$("#locale1").val($("#locale2").val());	
	});
	$("#user1").change(function(){
		$("#user2").val($("#user1").val());
	});
	$("#user2").change(function(){
		$("#user1").val($("#user2").val());
	});
	$("#maxCount1").change(function(){
		$("#maxCount2").val($("#maxCount1").val());
	});
	$("#maxCount2").change(function(){
		$("#maxCount1").val($("#maxCount2").val());
	});
	//========================================
	
	// Hide all the result divs initially
	$("#executionStats").hide();
	$("#queryResult").hide();
	$("#queryCommitMode").hide();
	$("#exception").hide();
	
	//Create or update Cookie.
	function createCookie(name, content){
		$.cookie(name, content, {	
			   expires : 365,
			   path : cookiePath
		});
	}
	
	//delete cookie
	function deleteCookie(name){
		$.cookie(name, "", {	
			   expires : -1,
			   path : cookiePath
			});
	}
	
	//Get all cookies starting with cookieName.
	function getAllCookies() {
		var cookies = { };
		if (document.cookie && document.cookie != '') {
			var split = document.cookie.split(';');
			for (var i = 0; i < split.length; i++) {
				var name_value = split[i].split("=");
				name_value[0] = name_value[0].replace(/^ /, '');
				if(decodeURIComponent(name_value[0]).match("^"+cookieName)){
					cookies[decodeURIComponent(name_value[0])] = decodeURIComponent(name_value[1]);
				}
			}
		}
		return cookies;
	}
		
	//Clear History View and delete all cookies.
	$("#clearHistory").click(function(){
		$("#historyLegend").hide();
		$("#historyList").html("");
		$.each(cookieHistory, function(name,cookie){
			deleteCookie(name);
		});
		cookieHistory = {};
	});
	
	//Search for available cookies and get free name.
	function getNewCookieName(){
		var i = 0;
		while(true){
			var cookie = $.cookie(cookieName + i);
			if(!cookie){
				return cookieName+i;
			}
			i++;
		}
	}
	
	function isMaxCookieSizeExceeded(name, statement, ciphertext){
		var cookieSize = getCookieSize();
		if(cookieHistory.hasOwnProperty(name)){
			if(cookieHistory[name].statement == statement){
				return (cookieSize >= maxCookieSize);
			}
			else{
				var oldCookieSize = calcsize(cookieHistory[name].ciphertext);
				return (cookieSize - oldCookieSize + calcsize(ciphertext)) >= maxCookieSize;
			}
		}
		else{
			return (cookieSize + calcsize(ciphertext)) >= maxCookieSize;
		}
	}
	
	function getCookieSize(){
		var cookieSize = 0;
		$.each(cookieHistory, function(name, value){
			cookieSize += calcsize($.cookie(name));
		});
		return cookieSize + 64; //JSESSIONID consists of 32 characters.
	}
	
	function calcsize(content){
	    var utf8length = 0;
	    
	    if(content != null) {
	    	for (var n = 0; n < content.length; n++) {
		        var c = content.charCodeAt(n);
		        if (c < 128) {
		            utf8length++;
		        }
		        else if((c > 127) && (c < 2048)) {
		            utf8length = utf8length+2;
		        }
		        else {
		            utf8length = utf8length+3;
		        }
		    }
	    }	 
	    return utf8length;
	}

	
	//Encrypt the object and save it to cookie.
	function encryptWriteCookie(historyItem, name){
		var cookieObject = {query: historyItem.query, additionalDescription: historyItem.additionalDescription, isFs: historyItem.isFs};
		var cookie = JSON.stringify(cookieObject);
		
		$.ajax({
			url : encryptionUrl,
			type : 'POST',
			async: false,
			data : {
				cookie: cookie
			},
			headers : {
				'Accept' : 'application/json',
                'X-CSRF-TOKEN' : token
			},
			success : function(data) {
				if (data.exception) {
					deleteCookie(name);
				}
				else{
					if(!isMaxCookieSizeExceeded(name, historyItem.query, data.ciphertext)){
						createCookie(name,data.ciphertext);
						cookieHistory[name] = historyItem;
						$("#historyList").append(historyItem.html);
						$("#historyMax").hide();
					}
					else{
						$("#historyMax").show();
					}
				}
			},
			error : hac.global.err
		});
	}
	
	//Initially load cookies and show them in history tab.
	function initHistory(){
		var cookies = getAllCookies();
		$.each(cookies, function(name,cookie){
			$.ajax({
				url : decryptionUrl,
				type : 'POST',
				data : {
					cookie: cookie
				},
				headers : {
					'Accept' : 'application/json',
                    'X-CSRF-TOKEN' : token
				},
				success : function(data) {
					if (data.exception) {
						deleteCookie(name);
					}
					else {
						var cookieParsed = JSON.parse(data.plaintext);
						if(!cookieParsed.hasOwnProperty("query") || !cookieParsed.hasOwnProperty("isFs")|| cookieParsed.query === "" ||  cookieParsed.isFs === ""){
							deleteCookie(name);
						}
						else{
							$("#historyLegend").show();
							var historyItem = new historyEntry(cookieParsed.query, cookieParsed.additionalDescription, cookieParsed.isFs, name);
							$("#historyList").append(historyItem.html);
							cookieHistory[name] = historyItem;
							historyItem.ciphertext = cookie;
						}
					}
				},
				error : hac.global.err
			});
		})
	}	
		
	//Build up attributes to create new history-item and store it in cookie.
	function addQueryToHistory(flexQuery, sqlQuery, additionalDescription){
		if(!$("#historyLegend").is(":visible")){
			$("#historyLegend").fadeIn();
		}
		
		var isFs = (flexQuery != "");
		var saveQuery = isFs ? flexQuery : sqlQuery;
		var name = null;
		
		$.each(cookieHistory, function(){
			if(this.query == saveQuery){
				this.html.hide();
				name = this.name;
			}
		});
		
		name = (name != null) ? name : getNewCookieName();
		
		var historyItem = new historyEntry(saveQuery, additionalDescription, isFs, name);
		encryptWriteCookie(historyItem, name);
	}
	
	//History-Entry Object.
	function historyEntry(query, additionalDescription, isFs, name){
		//Attributes
		this.name = name;
		this.query = query;
		this.isAlive = true;
		this.additionalDescription = additionalDescription;
		this.isFs = isFs;
		this.isExpanded = false;
		this.linkExpand = $("<a href='#'></a>").text(sliceQuery(this.query));
		this.insertBtn = $("<button>Insert</button>");
		this.deleteBtn = $("<button class='deleteButton'>X</button>");
		this.leftExpandedPanel = $("<div style='float:left;width:90%;word-wrap:break-word'></div>").text(this.query).append("</br>").append(this.insertBtn);
		this.rightExpandedPanel = $("<div style='float:right'></div>").append(this.deleteBtn);
		this.expandedDiv = $("<div class='extendedHistoryItem'></div>").append(this.leftExpandedPanel).append(this.rightExpandedPanel).append($("<div style='clear:both' />")).hide();
		this.ciphertext;
		
		this.html = $("<li></li>").append(this.linkExpand).append("<br/><em class='small'>(" + additionalDescription + ")</em>").append(this.expandedDiv);
		
		//Methods
		//Add click-handler to Expand-link.
		this.linkExpand.click($.proxy(function(event){
			if(this.isExpanded){
				this.expandedDiv.fadeOut();
				this.isExpanded = false;
			}
			else{
				this.expandedDiv.fadeIn();
				this.isExpanded = true;
			}
		}, this));
		//Add click-handler to insert-Button.
		this.insertBtn.click($.proxy(function(event){
			clearInputFields();
			if(this.isFs){
				setFsEditorValue(this.query);
			}
			else{
				setSqlEditorValue(this.query);	
			}
		}, this));
		//Add click-handler to delete-Button.
		this.deleteBtn.click($.proxy(function(event){
			this.html.fadeOut();
			deleteCookie(this.name);
			this.isAlive = false;
			$("#historyMax").hide();
		}, this));
	};
	
	//Slice query to maximum length of 50 signs.
	function sliceQuery(query){
		var shortQuery = "";
		if(query.length > 47){
			shortQuery = query.slice(0,47);
			shortQuery += "...";
		}
		else{
			shortQuery = query;
		}
		return shortQuery;
	}
	
	//Remove text in input fields.
	function clearInputFields(){
		var selected = $("#tabsNoSidebar").tabs( "option", "selected" );
		$("#tabsNoSidebar").tabs('option', 'active', 0);
		fsQueryEditor.setValue("");
		$("#tabsNoSidebar").tabs('option', 'active', 1);
		sqlQueryEditor.setValue("");	
		$("#tabsNoSidebar").tabs('option', 'active', selected);
	}
	//Remove text from FS-Editor.
	function clearFsEditor(){
		var selected = $("#tabsNoSidebar").tabs( "option", "selected" );
		$("#tabsNoSidebar").tabs('option', 'active', 0);
		fsQueryEditor.setValue("");
		$("#tabsNoSidebar").tabs('option', 'active', selected);
	}
	//Remove text from SQL-Editor.
	function clearSqlEditor(){
		var selected = $("#tabsNoSidebar").tabs( "option", "selected" );
		$("#tabsNoSidebar").tabs('option', 'active', 1);
		sqlQueryEditor.setValue("");
		$("#tabsNoSidebar").tabs('option', 'active', selected);
	}
	//Sets text to FS-Editor. Text can only be set if the editor is visible.
	function setFsEditorValue(value, redirect){
		var selected = $("#tabsNoSidebar").tabs( "option", "selected" );
		$("#tabsNoSidebar").tabs('option', 'active', 0);
		fsQueryEditor.setValue(value);
		if(redirect){ $("#tabsNoSidebar").tabs('option', 'active', selected); }
	}
	//Sets text to SQL-Editor. Text can only be set if the editor is visible.
	function setSqlEditorValue(value, redirect){
		var selected = $("#tabsNoSidebar").tabs( "option", "selected" );
		$("#tabsNoSidebar").tabs('option', 'active', 1);
		sqlQueryEditor.setValue(value);
		if(redirect){ $("#tabsNoSidebar").tabs('option', 'active', selected); }
	}
	
	//Returns the current Date and time in format: DD/MM/YYYY HH:MM:SS as String.
	function getDateTimeFormatted(){
		var myDate = new Date();
		var day = "" + myDate.getDate();
		if(day.length < 2){ 
			day = "0"+day;
		}
		var month = myDate.getMonth();
		month = (month+1) + "";
		if(month.length < 2){
			month = "0"+month;
		}
		var year = myDate.getFullYear();
		var hours = "" + myDate.getHours();
		if(hours.length < 2){
			hours = "0"+hours;
		}
		var minutes = "" + myDate.getMinutes();
		if(minutes.length < 2){ 
			minutes = "0"+minutes;
		}
		var seconds = "" + myDate.getSeconds();
		if(seconds.length < 2){
			seconds = "0"+seconds;
		}
		return "" + day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
	}
	
	$(".buttonSubmit").click(function(event) {
		if(event.target.id == "buttonSubmit1"){
			if(fsQueryEditor.getValue().length > 1){
				clearSqlEditor();
			}
			else{
				return true;
			}
		}
		else{
			if(sqlQueryEditor.getValue().length > 1){
				clearFsEditor();
			}
			else{
				return true;
			}
		}
		
		//Add the Query to cookieHistory before executing.
		addQueryToHistory($.trim(fsQueryEditor.getValue()), $.trim(sqlQueryEditor.getValue()), getDateTimeFormatted());
		
		$('#flexQueryForm').validate({
			rules: {
				maxCount: {
					required: true,
					number: true
				}
			},
			submitHandler: function(form) {
				// Show spinner
				$('#spinnerWrapper').show();

				// Prepare data object
				var dataObject = {
					flexibleSearchQuery : fsQueryEditor.getValue(),
					sqlQuery : sqlQueryEditor.getValue(),
					maxCount : $("#maxCount1").val(),
					user : $("#user1").val(),
					locale : $("#locale1").val(),
					commit: $("#commitCheckbox1").is(":checked")
				};
			
				var url = $("#flexQueryForm").attr("action") + "execute";
			
				$.ajax({
					url : url,
					type : 'POST',
					data : dataObject,
					headers : {
						'Accept' : 'application/json',
                        'X-CSRF-TOKEN' : token
					},
					success : function(data) {
						if (typeof(data) === 'string' && data.indexOf("redirect_detection") != -1)  {
							// Redirect when response is login page where "redirect_detection" marker is placed
							// Login page could be as response in case of redirection from spring security (session is dead)
							top.location.href = "/";
							return true;
						}
						// Hide spinner
						$('#spinnerWrapper').hide();
						
						if (!data.exception) {
							// Hide possible exception pane
							$("#exception").hide();
			
							// Build up headers for result table
							var headers = [];
							for ( var i = 0; i < data.headers.length; i++) {
								headers.push({
									"sTitle" : data.headers[i]
								})
							}

							// Remove possibly existend old
							// result table and create new
							$("#queryResult").show();
							$("#queryCommitMode").show();
							$('#queryResultTable').remove();
							$("#queryResult").html('<table id="queryResultTable"></table>');
							var table = $('#queryResultTable').dataTable({
										"aaSorting" : [],
										"aoColumns" : headers,
										"bDestroy" : true,
										"aLengthMenu" : [[10,25,50,100,-1], [10,25,50,100,'all']]
									});
							table.fnClearTable();							
							if(data.resultList.length > 0) {
								table.fnAddData(data.resultList);
							}
							
							$("#nav-tab-3").css("font-weight", "bold");
			
							// Put translated FlexibleSearch
							// query into the form
							$("#sqlQuery").attr("value", data.query);
							
							setSqlEditorValue(data.query, true);
							
							var flexibleSearchQuery = fsQueryEditor.getValue(); 
							var sqlQuery = sqlQueryEditor.getValue();
							
							if(event.target.id == "buttonSubmit1")
								$("#nav-tab-2").css("font-weight", "bold");
							
							// Execution stats
							$("#nav-tab-4").css("font-weight", "bold");
							$("#executionStats").show();
							if($("#commitCheckbox1").is(":checked")){
								$(".commitMode").text("ON").css("color","#FF0000");
//								$(".commitMode").css("color","#FF0000");
							}
							else{
								$(".commitMode").text("OFF").css("color","#04B431");
//								$(".commitMode").css("color","#04B431");
							}
							$("#executionTime").text(data.executionTime + " ms.");
							$("#catalogVersions").text(data.catalogVersionsAsString);
							$("#params").text(data.parametersAsString);
							
						} else {
							// Hide possible query result pane and execution stats
							$("#queryResult").hide();
							$("#queryCommitMode").hide();
							$("#executionStats").hide();
							
							$("nav-tab-3").css("font-weight","bold");
			
							$("#exception").show();
							$("#exceptionMessage").text(
									data.exception.message)
							$("#exceptionStackTrace").text(
									data.exceptionStackTrace);
						} 
					},
					error : hac.global.err
				});				
			}
		})
		// Change showing tab to result
		$("#tabsNoSidebar").tabs('option', 'active', 2);
	});
});