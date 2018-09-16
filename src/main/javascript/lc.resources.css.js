lc.app.onDefined(["lc.resources", "lc.Cache"], function() {
	
	lc.resources._css_cache = new lc.Cache();
	
	lc.resources.css = function(url) {
		var u = url instanceof lc.URL ? url : new lc.URL(url);
		var us = u.toString();
		var cache = lc.resources._css_cache.get(us);
		if (cache)
			return cache.future;

		var css = document.createElement("LINK");
		css.rel = "stylesheet";
		css.type = "text/css";
		cache = { url: u, element: css, future: new lc.async.Future() };
		lc.resources._css_cache.set(us, cache);
		lc.app.pending(cache.future);
		css.onload = function() {
			lc.log.debug("lc.resources", "CSS loaded: "+us);
			cache.future.success(css);
		};
		css.onerror = function() {
			lc.log.error("lc.resources","Error loading CSS "+us);
			js.future.error("CSS loading error"); // TODO more details ?
		};
		css.href = us;
		document.getElementsByTagName("HEAD")[0].appendChild(css);
		return cache.future;
	};
	
});
