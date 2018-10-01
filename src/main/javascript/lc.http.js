/**
 * @namespace lc.http
 * Provides utility methods to perform HTTP requests, and add a request customization mechanism.
 * <p>
 * The default method XMLHttpRequest.send is overridden to give an opportunity to customize every request just before it is sent.<br/>
 * For example, a customization may be used to add some headers to the request.<br/>
 * </p>
 * <p>
 * One customizer is already configured by default to add a property <code>future</code> containing an instance of lc.async.Future,
 * which will be successful when reasyState has value 4.
 * </p>
 */
lc.core.namespace("lc.http", {
	
	/**
	 * Instantiate an XMLHttpRequest and call its open method.
	 * @param method string HTTP method
	 * @param url string|lc.URL URL
	 * @returns XMLHttpRequest the HTTP request
	 */
	request: function(method, url) {
		if (url instanceof lc.URL) url = url.toString();
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		return xhr;
	},
	
	/**
	 * Create a GET request, with an optional Accept header.
	 * @param url string|lc.URL url
	 * @param acceptType string Optional, requested content type
	 * @returns lc.async.Future future that receives the responseText on success
	 */
	get: function(url, acceptType) {
		var xhr = lc.http.request("GET", url);
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
	
	_customizers: [],
	
	_customize: function(xhr) {
		for (var i = 0; i < lc.http._customizers.length; ++i)
			lc.http._customizers[i](xhr);
	},
	
	/**
	 * Add a XMLHttpRequest customizer.
	 * @param customizer function|lc.async.Callback customizer that takes an XMLHttpRequest as argument
	 */
	addCustomizer: function(customizer) {
		lc.http._customizers.push(customizer);
	},
	
	/**
	 * Remove a XMLHttpRequest customizer.
	 * @param customizer function|lc.async.Callback customizer to remove
	 */
	removeCustomizer: function(customizer) {
		lc.http._customizers.remove(customizer);
	}
	
});

// add a customizer to add future property and listen to readystatechange event
lc.http.addCustomizer(function(xhr) {
	if (lc.log.trace("lc.http")) lc.log.trace("lc.http", "Sending HTTP Request " + xhr._http_method + " " + xhr._http_url);
	xhr.future = new lc.async.Future();
	xhr.addEventListener('readystatechange', function() {
		if (xhr.readyState != 4)
			return;
		if (lc.log.trace("lc.http")) lc.log.trace("lc.http", "HTTP Response received: " + xhr._http_method + " " + xhr._http_url + " => " + xhr.status + " " + xhr.statusText);
		xhr.future.success(xhr);
	});
});

// catch open method to save information
window._lc_http_XMLHttpRequest_open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
	window._lc_http_XMLHttpRequest_open.apply(this, [method, url, async, user, password]);
	this._http_method = method;
	this._http_url = url;
};
// catch send method to customize requests, and know pending requests
window._lc_http_XMLHttpRequest_send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
	lc.http._customize(this);
	lc.app.pending(this.future);
	window._lc_http_XMLHttpRequest_send.apply(this, [body]);
}
