lc.core.namespace("lc.locale", {
	
	_userLanguages: [],
	_lang: undefined, // current one
	_namespaces: [],
	_listeners: [], // listeners when language changed
	_localized: [],
	
	setLanguage: function(lang) {
		var i = lc.locale._userLanguages.indexOf(lang);
		if (i == -1) return;
		if (lc.locale._currentLanguage == lang) return;
		
		// store in local storage if available, else set a cookie
		if (window.localStorage)
			window.localStorage.setItem("lc.locale", lang);
		else
			lc.cookies.set("lc.locale", lang, "/", 365*24*60*60);
		
		// load declared namespaces
		for (var i = 0; i < lc.locale._namespaces.length; ++i)
			lc.locale._namespaces[i].reload();
		
		// call listeners
		lc.async.Callback.callListeners(lc.locale._listeners, [lang]);

		// update registered elements
		for (var i = 0; i < lc.locale._localized.length; ++i)
			this._updateLocalized(lc.locale._localized[i]);
	},
	
	declare: function(baseUrl, namespaces, languages) {
		if (!Array.isArray(namespaces)) namespaces = [namespaces];
		for (var i = 0; i < namespaces.length; ++i) {
			if (lc.locale.hasNamespace(namespaces[i])) {
				lc.log.warn("lc.locale", "Locale namespace " + namespaces[i] + " is already defined");
				continue;
			}
			var ns = new lc.locale.Namespace(namespaces[i], baseUrl, languages);
			lc.locale._namespaces.push(ns);
			lc.log.debug("lc.locale", "Locale namespace " + ns.name + " declared at " + baseUrl);
		}
	},
	
	hasNamespace: function(name) {
		return getNamespace(name) != undefined;
	},
	
	getNamespace: function(name) {
		for (var i = 0; i < lc.locale._namespaces.length; ++i)
			if (lc.locale._namespaces[i].name == name)
				return lc.locale._namespaces[i];
		return undefined;
	},
	
	getFullyAvailableLanguages: function() {
		var langs = null;
		var jp = new lc.async.JoinPoint();
		var result = new lc.async.Future();
		for (var i = 0; i < lc.locale._namespaces.length; ++i) {
			var ns = lc.locale._namespaces[i];
			if (Array.isArray(ns.languages)) {
				if (langs == null) langs = ns.languages.splice();
				else for (var i = 0; i < langs.length; ++i)
					if (ns.languages.indexOf(langs[i]) < 0) {
						langs.splice(i,1);
						i--;
					}
			} else {
				jp.addToJoin(1);
				ns.languages.onsuccess(new lc.async.Callback(ns, function() {
					if (langs == null) langs = this.languages.splice();
					else for (var i = 0; i < langs.length; ++i)
						if (this.languages.indexOf(langs[i]) < 0) {
							langs.splice(i,1);
							i--;
						}
					jp.join();
				}));
			}
		}
		jp.start();
		jp.onsuccess(function() { result.success(langs); });
		return result;
	},

	getPreferredLanguageAmong: function(langs) {
		for (var i = 0; i < lc.locale._userLanguages.length; ++i) {
			if (langs.indexOf(lc.locale._userLanguages[i]) >= 0)
				return lc.locale._userLanguages[i];
		}
		return null;
	},
	
	listenLanguage: function(listener) {
		this._listeners.push(listener);
		if (this._lang)
			lc.async.Callback.callListeners(listener, [this._lang]);
	},
	
	unlistenLanguage: function(listener) {
		this._listeners.remove(listener);
	},
	
	localizeAttribute: function(element, attributeName, namespace, key, params) {
		var l = {
			namespace: namespace,
			key: key,
			params: params,
			element: element,
			attributeName: attributeName,
			localize: function(s) {
				this.element[attributeName] = s;
				// TODO layout change on element
			}
		};
		this._localized.push(l);
		if (this._lang)
			this._updateLocalized(l);
	},
	
	textNode: function(namespace, key, params) {
		var text = document.createTextNode("");
		lc.locale.localizeAttribute(text, "nodeValue", namespace, key, params);
		return text;
	},
	
	_updateLocalized: function(l) {
		var ns = lc.locale.getNamespace(l.namespace);
		if (!ns)
			l.localize("[unknown namespace '" + l.namespace + "']");
		ns.getStringAsync(l.key, l.params)
			.onsuccess(new lc.async.Callback(l, function(localized) { this.localize(localized); }));
	}
	
});

lc.core.createClass("lc.locale.Namespace", function(name, baseUrl, languages) {
	if (baseUrl.charAt(baseUrl.length - 1) != '/') baseUrl += '/';
	this.name = name;
	this.url = baseUrl + name;
	this._content = undefined;
	if (languages) {
		this.languages = languages;
		if (lc.locale._lang) this.reload();
	} else
		this.languages = lc.ajax.get(this.url + '.languages')
			.onsuccess(new lc.async.Callback(this, function(content) {
				var s = content.split(",");
				var list = [];
				for (var i = 0; i < s.length; ++i) {
					var lang = s[i].trim();
					if (lang.length > 0) list.push(lang);
				}
				this.languages = list;
				if (lc.locale._lang) this.reload();
			}));
}, {
	
	reload: function() {
		this._content = lc.ajax.get(this.url + '.' + lc.locale._lang)
			.onsuccess(new lc.async.Callback(this, function(content) {
				this._content = this._parse(content);
			}));
	},
	
	getStringAsync: function(key, params) {
		var result = new lc.async.Future();
		if (!Array.isArray(this.languages))
			this.languages.onsuccess(new lc.async.Callback(this, function() { this._getStringAsync(key, params, result); }));
		else
			this._getStringAsync(key, params, result);
		return result;
	},
	
	_getStringAsync: function(result, key, params) {
		if (!Array.isArray(this.content))
			this.content.onsuccess(new lc.async.Callback(this, function() { this._getStringAsync2(key, params, result); }));
		else
			this._getStringAsync2(key, params, result);
	},

	_getStringAsync2: function(result, key, params) {
		result.success(this.getStringSync(key, params));
	},
	
	getStringSync: function(key, params) {
		var lkey = key.toLowerCase();
		for (var i = 0; i < this.content.length; ++i) {
			if (this.content[i].key == lkey)
				return this._resolve(key, this.content[i].value, params);
		}
		return "[unknown locale key '" + key + "' in namespace '" + this.name + "']";
	},
	
	_resolve: function(givenKey, value, params) {
		// TODO
		return value;
	},
	
	_parse: function(content) {
		var lines = content.split("\n");
		var values = [];
		for (var i = 0; i < lines.length; ++i) {
			var s = lines[i].trim();
			if (s.length == 0) continue;
			if (s.startsWith('#')) continue;
			var sep = s.indexOf('=');
			if (sep < 0) {
				lc.log.warn("lc.locale", "Invalid locale line " + (i+1) + " in namespace " + this.name + ": no '='");
				continue;
			}
			values.push({
				key: s.substring(0, i).trim().toLowerCase(),
				value: s.substring(i + 1).trim()
			});
		}
		return values;
	}
	
});

// load user's languages
(function() {
	// language from local storage
	if (window.localStorage) {
		var lang = window.localStorage.getItem("lc.locale");
		if (lang && !lc.locale._userLanguages.contains(lang))
			lc.locale._userLanguages.push(lang);
	}
	// language from cookie
	var lang = lc.cookies.get("lc.locale");
	if (lang && !lc.locale._userLanguages.contains(lang))
		lc.locale._userLanguages.push(lang);
	
	// languages from navigator
	var list =
		navigator.languages ? navigator.languages :
		navigator.language ? [navigator.language] :
		navigator.userLanguage ? [navigator.userLanguage] :
		["en"];
	for (var i = 0; i < list.length; ++i)
		if (!lc.locale._userLanguages.contains(list[i]))
			lc.locale._userLanguages.push(list[i]);
	
	// english, by default, at the end
	if (!lc.locale._userLanguages.contains("en")) lc.locale._userLanguages.push("en");
})();

// once application is loaded, set the preferred language if not yet set
lc.app.onLoaded(function() {
	if (!lc.locale._lang)
		lc.locale.getFullyAvailableLanguages()
			.onsuccess(function(langs) {
				var lang = lc.locale.getPreferredLanguageAmong(langs);
				if (lang)
					lc.locale.setLanguage(lang);
			});
});
