<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>   
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="display" uri="http://displaytag.sf.net" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="hac" uri="/WEB-INF/custom.tld" %> 
<html>
<head>
<title>FlexibleSearch</title>

<link rel="stylesheet" href="<c:url value="/static/css/table.css"/>" type="text/css" media="screen, projection" />
<link rel="stylesheet" href="<c:url value="/static/css/console/flexsearch.css"/>" type="text/css" media="screen, projection" />
	<link rel="stylesheet" href="<c:url value="/static/css/onoff.css"/>" type="text/css" media="screen, projection" />
<link rel="stylesheet" href="<c:url value="/static/css/codemirror5/codemirror.css"/>" type="text/css" media="screen, projection
" />
<link rel="stylesheet" href="<c:url value="/static/css/console/codemirror3-custom.css"/>" type="text/css"
			media="screen, projection" />

<script type="text/javascript" src="<c:url value="/static/js/history.js"/>"></script>
<script type="text/javascript" src="<c:url value="/static/js/jquery.dataTables.min.js"/>"></script>
<script type="text/javascript" src="<c:url value="/static/js/codemirror5/codemirror.js"/>"></script>
<script type="text/javascript" src="<c:url value="/static/js/codemirror5/sql.js"/>"></script>
<script type="text/javascript" src="<c:url value="/static/js/console/flexsearch.js"/>"></script>
<script type="text/javascript" src="<c:url value="/static/js/js.cookie-2.2.1.min.js"/>"></script>
<script type="text/javascript" src="<c:url value="/static/js/codemirror5/flexsearch-hint.js"/>"></script>
<link rel="stylesheet" href="<c:url value="/static/css/codemirror5/addon/hint/show-hint.css"/>">
<script src="<c:url value="/static/js/codemirror5/addon/hint/show-hint.js"/>"></script>

</head>

<body>
	<!-- TODO: make some check against sys initialization -->
	<div class="prepend-top span-17 colborder" id="content"
		 typeAttr-Url="<c:url value="/console/impex/typeAndAttributes" />"
		 allTypes-Url="<c:url value="/console/impex/allTypes" />">
		<button id="toggleSidebarButton">&gt;</button>
		<div class="marginLeft">
			<h2>FlexibleSearch</h2>
			
			<c:set var="url">
				<c:url value="/console/flexsearch/" />
			</c:set>			
			<c:set var="errorMsg">
				<spring:message code="console.flexsearch.forms.query.errormsg" />
			</c:set>
			
			
			<div id="tabsNoSidebar" class="marginBottom">
				<ul>
					<li><a id="nav-tab-1" href="#tabs-1">Flexible Query</a></li>
					<li><a id="nav-tab-2" href="#tabs-2">SQL Query</a></li>
					<li><a id="nav-tab-3" href="#tabs-3">Search result</a></li>
					<li><a id="nav-tab-4" href="#tabs-4">Execution statistics</a></li>
					<li><a id="nav-tab-5" href="#tabs-5">History</a></li>
				</ul>
				
				<div id="tabs-1">
					<form:form method="post" action="${url}" modelAttribute="flexQueryForm">
						<fieldset style="width:99%">
							<legend><spring:message code="console.flexsearch.forms.legends.flexsearch" /></legend>
							<div id="flexibleSearchQueryWrapper" class="textarea-container">
								<textarea id="flexibleSearchQuery" data-errormsg="${errorMsg}"></textarea>
							</div>
						</fieldset>
						
						<fieldset>
							<p>
								<form:label path="maxCount" for="maxCount1"><spring:message code="console.flexsearch.forms.labels.maxCount" /></form:label>
								<spring:bind path="maxCount">
									<input type="number" size="10" name="maxCount" id="maxCount1" value="${flexQueryForm.maxCount}" min="1" style="width:50px !important"/>
								</spring:bind>
								&nbsp;
								<form:label path="user" for="user1"><spring:message code="console.flexsearch.forms.labels.userLogin" /></form:label>
								<form:input path="user" size="15" id="user1" />
								&nbsp;
								<form:label path="locale" for="locale1"><spring:message code="console.flexsearch.forms.labels.localeIsoCode" /></form:label>
								<form:select path="locale" items="${existingLocales}" id="locale1" />
							</p>
							<hr/> 
							<p>
								<div class="onoffswitch-large" style="float:left;margin-top:7px">
								    <input type="checkbox" class="onoffswitch-checkbox" id="commitCheckbox1"/>
								    <label class="onoffswitch-label" for="commitCheckbox1">
								        <div class="onoffswitch-inner" _on="COMMIT" _off="ROLLBACK"></div>
								        <div class="onoffswitch-switch-large"></div>
								    </label>
								</div>
								<button class="buttonSubmit" style="float:right" id="buttonSubmit1">
									<spring:message code="general.forms.execute" />
								</button>
							</p>
						</fieldset>
				</div>	
				
				<div id="tabs-2">
					
						<fieldset style="width:99%">
							<legend><spring:message code="console.flexsearch.forms.legends.sql" /></legend>
							<div id="sqlQueryWrapper" class="textarea-container">
								<div id="spinnerWrapper">
									<img id="spinner" src="<c:url value="/static/img/spinner.gif"/>" alt="spinner"/>
								</div>
								<form:textarea path="sqlQuery" cols="50" rows="8" />
							</div>
						</fieldset>
						
						<fieldset>
							<p>
								<form:label path="maxCount" for="maxCount2"><spring:message code="console.flexsearch.forms.labels.maxCount" /></form:label>
								<spring:bind path="maxCount">
									<input type="number" size="10" name="maxCount" id="maxCount2" value="${flexQueryForm.maxCount}" min="1" style="width:50px !important"/>
								</spring:bind>
								&nbsp;
								<form:label path="user" for="user2"><spring:message code="console.flexsearch.forms.labels.userLogin" /></form:label>
								<form:input path="user" size="15" id="user2"/>
								&nbsp;
								<form:label path="locale" for="locale2"><spring:message code="console.flexsearch.forms.labels.localeIsoCode" /></form:label>
								<form:select path="locale" items="${existingLocales}" id="locale2" />
                                <input type="hidden"
                                       name="${_csrf.parameterName}"
                                       value="${_csrf.token}"/>
							</p>
							<hr/> 
							<p>
								<div class="onoffswitch-large" style="float:left;margin-top:7px">
								    <input type="checkbox" class="onoffswitch-checkbox" id="commitCheckbox2"/>
								    <label class="onoffswitch-label" for="commitCheckbox2">
								        <div class="onoffswitch-inner" _on="COMMIT" _off="ROLLBACK"></div>
								        <div class="onoffswitch-switch-large"></div>
								    </label>
								</div>
								<button class="buttonSubmit" style="float:right" id="buttonSubmit2">
									<spring:message code="general.forms.execute" />
								</button>
							</p>
						</fieldset>
					</form:form>
				</div>		
				
				<div id="tabs-3">
				<div id="queryCommitMode"><strong style="visible:false">Commit:&nbsp</strong><span class="commitMode"></span></div>
					<div id="queryResult" class="marginBottom"></div>
					<div id="exception">
						<h2><spring:message code="console.flexsearch.messages.error" /></h2>
						<div class="marginBottom">
							<strong><spring:message code="console.flexsearch.messages.exception.message"/>:</strong>
							<span id="exceptionMessage"></span> 
						</div>
						<strong><spring:message code="console.flexsearch.messages.exception.stacktrace"/>:</strong>
						<div id="exceptionStackTrace"></div>
					</div>					
				</div>								
				<div id="tabs-4">
					<div id="executionStats">
						<div class="marginBottom"><strong>Commit: </strong><span class="commitMode"></span></div>
						<div class="marginBottom"><strong><spring:message code="console.flexsearch.messages.stat.execution.time" />:</strong> <span id="executionTime"></span></div>
						<div class="marginBottom"><strong><spring:message code="console.flexsearch.messages.stat.used.catalogversions" />:</strong> <span id="catalogVersions"></span></div>
						<div class="marginBottom"><strong><spring:message code="console.flexsearch.messages.stat.replaced.params" />:</strong> <span id="params"></span></div>
					</div>
				</div>
				<div id="tabs-5" historyMax="${historyMax}" cookiePath="/console/flexsearch/">
					<legend style="padding-left:5px;padding-top:10px;padding-bottom:10px" id="historyLegend">
						<span>History</span>
						<a href="#" id="clearHistory" style="font-size:75%">(clear)</a></br>
						<span id="historyMax" style="color:red;font-weight:bold;font-size:12px">Maximum number of entries achieved!</span>
					</legend>
					<!-- Will be filled by flexsearch.js automatically -->
					<ul id="historyList" style="margin:0;"></ul>
				</div>
			</div>
		</div>
	</div>
	<div class="span-6 last" id="sidebar">
		
		<div class="prepend-top" id="recent-reviews">
			
			<h3 class="caps">Query samples</h3>
			<div class="box">
				<ul>				
					<c:forEach items="${sampleQueries}" var="query" varStatus="counter">
				   	<li>
				   		<a class="sample_query" id="query${counter.count}" data-sample-query="${query.query}" data-is-fsquery="${query.flexibleSearch}" href="#">
				   			${query.queryDescription}
				   		</a>
			   			<c:if test="${query.additionalDescription != null}">
			   				<br />
			   				<em class="small">(${query.additionalDescription})</em>
			   			</c:if>
				   		
				   	</li>
					</c:forEach>
				</ul>
			</div>
			<h3 class="caps">Page description</h3>
			<div class="box">
				<div class="quiet">
				 This page provides the FlexibleSearch console to test FlexibleSearch queries and plain SQL statements.<br><br><hr />
				<strong>Search result</strong> tab displays result of executed query.<br><br>
				<strong>Execution statistics</strong> tab displays statistics for the query execution. You get the following information depending on which query you  used: 
				<br><br>
				<ul>
					<li>
						<strong>FlexibleSearch query</strong>:
						<ul>
							<li>Time needed to execute the query</li>
							<li>Which catalog versions were used</li>
							<li>List of parameters that replaced question marks in the query</li>
						</ul>
					</li>
					<li>
						<strong>Direct SQL query</strong>:
						<ul>
							<li>Time needed to execute the query</li>
						</ul>
					</li>
				</ul>
				
				<strong>History</strong> tab: Displays the local script history and the timestamp of the last execution.  <br><br>
				</div>
			</div>
			<h3 class="caps">See also in the hybris Wiki</h3>
			<div class="box">
				<ul>
					<li> <a href="${wikiFlexibleSearch}" target="_blank"  class="quiet" >FlexibleSearch</a> </li>
				</ul>
			</div>
		</div>
	</div>
</body>
</html>

