lc.core.namespace("lc.http.rest", {
	
	defaultFormat: "json",
	formats: {
		json: {
			mime: "application/json",
			toString: function(object) {
				return JSON.stringify(object);
			},
			fromString: function(string) {
				return JSON.parse(string);
			}
		}
	},
	
	get: function(url, format) {
		if (!format) format = lc.http.rest.defaultFormat;
		var result = new lc.async.Future();
		var req = lc.http.request("GET", url);
		req.setRequestHeader("Accept", lc.http.rest.formats[format].mime);
		req.send();
		lc.http.rest._waitResponse(req, format, result);
		return result;
	},
	
	post: function(url, body, format) {
		return lc.http.rest._method("POST", url, body, format);
	},
	
	put: function(url, body, format) {
		return lc.http.rest._method("PUT", url, body, format);
	},
	
	del: function(url, body, format) {
		return lc.http.rest._method("DELETE", url, body, format);
	},
	
	handleResponseStatus: function(req, result) {
		// TODO
		return false;
	},
	
	_method: function(method, url, body, format) {
		if (!format) format = lc.http.rest.defaultFormat;
		var result = new lc.async.Future();
		var req = lc.http.request(method, url);
		req.setRequestHeader("Accept", lc.http.rest.formats[format].mime);
		var toSend = body ? lc.http.rest.formats[format].toString(body) : null;
		if (toSend) req.setRequestHeader("Content-Type", lc.http.rest.formats[format].mime);
		req.send(body);
		lc.http.rest._waitResponse(req, format, result);
		return result;
	},
	
	_waitResponse: function(req, format, result) {
		req.future
		.onerror(result)
		.onsuccess(function(req) {
			if (lc.http.rest.handleResponseStatus(req, result))
				return;
			try {
				var obj = lc.http.rest.formats[format].fromString(req.responseText);
				result.success(obj);
			} catch (error) {
				result.error(error);
			}
		});
	}
	
});