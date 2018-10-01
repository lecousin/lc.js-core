lc.core.namespace("lc.resources", {
	
	load: function(url, type) {
		var u = url instanceof lc.URL ? url : new lc.URL(url);
		if (!type) {
			var i = u.path.lastIndexOf('.');
			if (i < 0) {
				lc.log.error("lc.resources","Unable to load a resource without an extension: "+u.toString());
				var result = new lc.async.Future();
				result.error("Unable to load a resource without an extension: "+u.toString());
				return result;
			}
			type = u.path.substring(i+1);
		}
		if (typeof lc.resources[type] === 'undefined')
			type = "unknownType";
		return lc.resources[type](u);
	},
	
	loadInSequence: function(urls, type) {
		var result = new lc.async.Future();
		var next = function(index) {
			if (index == urls.length) {
				result.success(null);
				return;
			}
			lc.resources.load(urls[index], type)
				.onsuccess(new lc.async.Callback(this, next, [index + 1]))
				.onerror(result);
		};
		next(0);
		return result;
	},
	
	loadInParallel: function(urls, type) {
		var join = new lc.async.JoinPoint();
		for (var i = 0; i < urls.length; ++i)
			join.addToJoin(lc.resources.load(urls[i], type));
		join.start();
		return join;
	},
	
	_default_cache: null,
	
	unknownType: function(url) {
		if (!lc.resources._default_cache) lc.resources._default_cache = new lc.Cache(10 * 60000);
		var us = url instanceof lc.URL ? url.toString() : url;
		var cache = lc.resources._default_cache.get(us);
		if (cache)
			return cache.future;
		var get = lc.http.get(url);
		cache = { future: get };
		lc.resources._default_cache.set(us, cache);
		return get;
	}
	
});
