lc.core.namespace("lc.http.rest", {
	
	defaultFormat: "json",
	formats: {
		json: {
			mime: "application/json",
			toString: function(object) {
				return JSON.stringify(object);
			},
			fromString: function(string) {
				if (string.length == 0) return undefined;
				return JSON.parse(string);
			}
		}
	},
	statusHandlers: {},
	
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
		if (req.status == 200) return false;
		if (typeof lc.http.rest.statusHandlers[req.status] !== 'undefined') {
			lc.async.Callback.callListeners(lc.http.rest.statusHandlers[req.status], [req, result]);
			return true;
		}
		result.error(req.status + " (" + req.statusText + ")");
		return true;
	},
	
	_method: function(method, url, body, format) {
		if (!format) format = lc.http.rest.defaultFormat;
		var result = new lc.async.Future();
		var req = lc.http.request(method, url);
		req.setRequestHeader("Accept", lc.http.rest.formats[format].mime);
		var toSend = body ? lc.http.rest.formats[format].toString(body) : null;
		if (toSend) req.setRequestHeader("Content-Type", lc.http.rest.formats[format].mime);
		if (lc.log.trace("lc.http.rest")) lc.log.trace("lc.http.rest", method + " " + url + " (" + format + ")");
		req.send(toSend);
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