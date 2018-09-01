lc.app.onDefined(["lc.resources", "lc.Cache"], function() {
	
	lc.resources._html_cache = new lc.Cache(15 * 60000);
	
	lc.resources.html = function(url) {
		var u = url instanceof lc.URL ? url : new lc.URL(url);
		var us = u.toString();
		var cache = lc.resources._html_cache.get(us);
		if (cache)
			return cache.future;

		cache = { url: u, html: null, future: new lc.async.Future() };
		lc.resources._html_cache.set(us, cache);
		
		lc.http.get(us)
			.onsuccess(function(html) {
				cache.html = html;
				cache.future.success(html);
			})
			.onerror(function(error) {
				cache.html = "<div>" + error + "</div>"; // TODO better
				cache.future.success(html);
			});
		
		return cache.future;
	};
	lc.resources.htm = lc.resources.html;
	
});
