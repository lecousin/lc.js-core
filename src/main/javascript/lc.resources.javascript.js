lc.app.onDefined(["lc.resources", "lc.Cache"], function() {
	
	lc.resources._js_cache = new lc.Cache();
	
	lc.resources.js = function(url) {
		var u = url instanceof lc.URL ? url : new lc.URL(url);
		var us = u.toString();
		var js = lc.resources._js_cache.get(us);
		if (js)
			return js.future;

		var s = document.createElement("SCRIPT");
		js = { url: u, element: s, future: new lc.async.Future() };
		lc.resources._js_cache.set(us, js);
		lc.app.pending(js.future);
		s.type = "text/javascript";
		s.onload = function() {
			lc.log.debug("lc.resources", "Javascript loaded: "+us);
			js.future.success(s);
			lc.app.newDefinitionsAvailable();
		};
		s.onerror = function() {
			lc.log.error("lc.resources","Error loading javascript "+us);
			js.future.error("Javascript loading error"); // TODO more details ?
		};
		s.src = us;
		document.getElementsByTagName("HEAD")[0].appendChild(s);
		return js.future;
	};
	lc.resources.javascript = lc.resources.js;
	
});
