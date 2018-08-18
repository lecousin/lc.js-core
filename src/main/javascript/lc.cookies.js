lc.core.namespace("lc.cookies", {
	
	get: function(cookieName) {
		return document.cookie.replace(new RegExp("(?:(?:^|.*;\s*)"+cookieName+"\s*\=\s*([^;]*).*$)|^.*$"), "$1");
	},
	
	set: function(name, value, path, maxageSeconds) {
		var cookie = name+"="+value;
		if (path)
			cookie += ";path="+path;
		if (maxageSeconds)
			cookie += ";max-age="+maxageSeconds;
		document.cookie = cookie;
	}
	
});