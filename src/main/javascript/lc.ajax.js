lc.core.namespace("lc.ajax", {
	
	create: function(method, url) {
		if (url instanceof lc.URL) url = url.toString();
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		xhr.future = new lc.async.Future();
		xhr.onreadystatechange = function() {
			if (this.readyState != 4)
				return;
			this.future.success(this);
		};
		return xhr;
	},
	
	get: function(url, acceptType) {
		var xhr = lc.ajax.create("GET", url);
		if (acceptType)
			xhr.setRequestHeader("Accept", acceptType);
		xhr.send();
		var result = new lc.async.Future();
		xhr.future.onsuccess(function(xhr) {
			if (xhr.status == 200)
				result.success(xhr.responseText);
			else
				result.error(xhr.status); // TODO better
		});
		return result;
	},
	
	customize: function(xhr) {
		// TODO
	}
	
});

// catch send method to customize requests, and know pending requests
window._lc_ajax_XMLHttpRequest_send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
	lc.ajax.customize(this);
	// TODO lc.ajax.pending(this);
	window._lc_ajax_XMLHttpRequest_send(body);
}