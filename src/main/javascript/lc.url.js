lc.core.createClass("lc.URL", {
	
	/** create a string representing the URL */
	toString: function() {
		var s;
		if (this.protocol) {
			s = this.protocol+"://"+this.host;
			if (this.port) s += ":"+this.port;
		} else
			s = "";
		s += this.path;
		var first = true;
		for (var name in this.params) {
			if (first) { s += "?"; first = false; } else s += "&";
			s += encodeURIComponent(name) + "=" + encodeURIComponent(this.params[name]);
		}
		if (this.hash)
			s += "#"+this.hash;
		return s;
	},
	
	equals: function(url) {
		if (!this.equalsWithoutParameters(url)) return false;
		for (var name in this.params)
			if (url.params[name] != this.params[name]) return false;
		for (var name in url.params)
			if (url.params[name] != this.params[name]) return false;
		return true;
	},
	
	equalsWithoutParameters: function(url) {
		if (this.protocol != url.protocol) return false;
		if (this.host != url.host) return false;
		if (this.port != url.port) return false;
		if (this.path != url.path) return false;
		return true;
	}

}, function(s) {
	if ((s instanceof lc.URL) || (typeof s.protocol != 'undefined')) {
		this.protocol = s.protocol;
		this.host = s.host;
		this.port = s.port;
		this.path = s.path;
		this.hash = s.hash;
		this.params = lc.copy(s.params);
		return;
	}
	if (typeof s.toString == 'function')
		s = s.toString();
	
	var i = s.indexOf("://");
	if (i > 0) {
		/** the protocol of the URL (i.e. http) */
		this.protocol = s.substr(0, i).toLowerCase();
		s = s.substr(i+3);
		i = s.indexOf("/");
		/** the hostname (i.e. www.google.com) */
		this.host = s.substr(0,i);
		s = s.substr(i);
		i = this.host.indexOf(":");
		if (i > 0) {
			/** the port number (i.e. 80) */
			this.port = this.host.substr(i+1);
			this.host = this.host.substr(0,i);
		} else
			/** the port number (i.e. 80) */
			this.port = null;
	} else {
		if (window) {
			this.protocol = window.location.protocol.substr(0,window.location.protocol.length-1);
			this.host = window.location.hostname;
			this.port = window.location.port;
		} else {
			this.protocol = "";
			this.host = "";
			this.port = "";
		}
		if (!s.startsWith("/")) {
			// relative path, we need to use the base url
			var base;
			if (document.baseURI)
				base = new lc.URL(document.baseURI);
			else {
				// IE :(
				var b = document.getElementsByTagName("base");
				if (b.length > 0) {
					base = new lc.URL(b[0].href);
				} else
					base = new lc.URL(location.toString());
			}
			base = base.path;
			i = base.lastIndexOf('/');
			if (i < base.length-1) base = base.substring(0, i+1);
			s = base + s;
		}
	}
	i = s.indexOf('#');
	if (i > 0) {
		/** the anchor */
		this.hash = s.substr(i+1);
		s = s.substr(0,i);
	}
	i = s.indexOf('?');
	/** the parameters of the URL (i.e. path?param1=value1&param2=value2 will create an object with 2 attributes) */
	this.params = new Object();
	if (i > 0) {
		/** the path of the resource pointed by this URL */
		this.path = s.substr(0,i);
		s = s.substr(i+1);
		while (s.length > 0 && (i = s.indexOf('&')) >= 0) {
			var p = s.substr(0, i);
			s = s.substr(i+1);
			i = p.indexOf('=');
			if (i > 0)
				this.params[lc.URL.decode(p.substr(0,i))] = lc.URL.decode(p.substr(i+1));
			else
				this.params[lc.URL.decode(p)] = "";
		}
		if (s.length > 0) {
			i = s.indexOf('=');
			if (i > 0)
				this.params[lc.URL.decode(s.substr(0,i))] = lc.URL.decode(s.substr(i+1));
			else
				this.params[lc.URL.decode(s)] = "";
		}
	} else
		this.path = s;
	
	// resolve .. in path
	if (this.path.substr(0,1) != "/" && window.location.pathname) {
		s = window.location.pathname;
		i = s.lastIndexOf('/');
		s = s.substr(0,i+1);
		this.path = s + this.path;
	}
	while ((i = this.path.indexOf('/../')) > 0) {
		var j = this.path.substr(0,i).lastIndexOf('/');
		if (j < 0) break;
		this.path = this.path.substr(0,j+1)+this.path.substr(i+4);
	}
	
	this.host = this.host.toLowerCase();
	this.path = this.path.toLowerCase();
});

lc.URL.decode = function(s) { return decodeURIComponent(s).replace(/\+/g, " "); }
