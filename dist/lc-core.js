if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(search, pos) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}


Array.prototype.contains=function(e){return this.indexOf(e) != -1;};
Array.prototype.remove=function(e){for(var i=0;i<this.length;++i)if(this[i]==e){this.splice(i,1);i--;};};
Array.prototype.removeUnique=function(e){var i=this.indexOf(e);if(i>=0)this.splice(i,1);};
Array.prototype.isSame = function(a) {
	if (!Array.isArray(a)) return false;
	if (this.length != a.length) return false;
	for (var i = 0; i < this.length; ++i)
		if (this[i] !== a[i])
			return false;
	return true;
};
Array.prototype.clear = function() { if (this.length > 0) this.splice(0,this.length); };
Array.prototype.removeElements = function(toRemove) {
	for (var i = 0; i < this.length; ++i) {
		if (toRemove.contains(this[i])) {
			this.splice(i,1);
			i--;
		}
	}
};
if (typeof lc === 'undefined') lc = {};

lc.core = {
	
	// namespace creation
	namespace: function(name, content) {
		var names = name.split(".");
		var parent = window;
		for (var i = 0; i < names.length; ++i) {
			if (typeof parent[names[i]] === 'undefined') parent[names[i]] = {};
			parent = parent[names[i]];
		}
		return lc.core.merge(parent, content);
	},
	
	// object manipulation
	
	merge: function(target, source) {
		for (var name in source)
			target[name] = source[name];
		return target;
	},
	
	// classes
	
	createClass: function(name, ctor, proto) {
		var names = name.split(".");
		var ns = window;
		for (var i = 0; i < names.length - 1; ++i) {
			if (typeof ns[names[i]] === 'undefined') ns[names[i]] = {};
			ns = ns[names[i]];
		}
		var cname = names[names.length - 1];
		ns[cname] = ctor;
		ns[cname].prototype = proto;
		ns[cname].prototype.constructor = ctor;
		ns[cname]._lcClass = name;
		ns[cname]._lcExtends = [];
		return parent[cname];
	},
	
	extendClass: function(name, parents, ctor, proto) {
		var names = name.split(".");
		var ns = window;
		for (var i = 0; i < names.length - 1; ++i) {
			if (typeof ns[names[i]] === 'undefined') ns[names[i]] = {};
			ns = ns[names[i]];
		}
		var cname = names[names.length - 1];
		ns[cname] = ctor;
		ns[cname]._lcClass = name;
		ns[cname]._lcExtends = [];
		
		if (!Array.isArray(parents))
			parents = [parents];

		var p = {};
		for (var i = 0; i < parents.length; ++i) {
			lc.core.merge(p, parents[i].prototype);
			if (ns[cname]._lcExtends.indexOf(parents[i]) < 0)
				ns[cname]._lcExtends.push(parents[i]._lcClass);
			if (parents[i]._lcExtends)
				for (var j = 0; j < parents[i]._lcExtends.length; ++j)
					if (ns[cname]._lcExtends.indexOf(parents[i]._lcExtends[j]) < 0)
						ns[cname]._lcExtends.push(parents[i]._lcExtends[j]);
		}
		ns[cname].prototype = lc.core.merge(proto, p);
		ns[cname].prototype.constructor = ctor;
		return ns[cname];
	},
	
	instanceOf: function(obj, clazz) {
		if (typeof clazz === 'string') clazz = window[clazz];
		if (obj instanceof clazz) return true;
		if (!obj.constructor._lcExtends) return false;
		for (var i = 0; i < obj.constructor._lcExtends.length; ++i)
			if (window[obj.constructor._lcExtends[i]] == clazz || lc.core.isExtending(obj.constructor._lcExtends[i], clazz))
				return true;
		return false;
	},
	
	isExtending: function(clazz, searchedClass) {
		if (typeof clazz === 'string') clazz = window[clazz];
		if (typeof searchedClass === 'string') searchedClass = window[searchedClass];
		if (!clazz._lcExtends) return false;
		for (var i = 0; i < clazz._lcExtends.length; ++i)
			if (window[clazz._lcExtends[i]] == searchedClass || lc.isExtending(clazz._lcExtends[i], searchedClass))
				return true;
		return false;
	},
	
	typeOf: function(obj) {
		if (obj === null) return "null";
		if (typeof obj != 'object') return typeof obj;
		if (obj.constructor._lcClass) return obj.constructor._lcClass;
		var ctor = obj.constructor;
		if (ctor) {
			if (ctor.name)
				return ctor.name;
			if (ctor.displayName)
				return ctor.displayName;
		}
		return "[unknown]";
	},
	
	// Id generator

	_idCounter: 0,
	
	generateId: function() {
		return "id"+(++lc.core._idCounter);
	},
	
	// Script url

	getMyURL: function() {
		// Get the stack trace
		var stackLines;
		try { toto.tutu(); }
		catch (e) {
		    stackLines = e.stack.split('\n');
		}
	    // search the interesting line
	    var firstUrl = true;
	    for(var i = 0; i < stackLines.length; ++i) {
	      if (!stackLines[i].match(/http[s]?:\/\//)) continue;
	      if (firstUrl) { firstUrl = false; continue; }
	      // parse the string for each section we want
	      var pathParts = stackLines[i].match(/((http[s]?:\/\/.+\/)([^\/]+\.js)):/);
	      return new lc.URL(pathParts[1]);
	    }
	    return null;
	}
		
};
lc.core.namespace("lc.app", {
	
	_expectedExpressions: {},
	_applicationListeners: [],
	
	onDefined: function(expression, listener) {
		var value = eval("("+expression+")");
		if (typeof value != 'undefined' && lc.core._loaded) {
			lc.async.Callback.callListeners(listener);
			return;
		}
		if (typeof lc.app._expectedExpressions[expression] === 'undefined')
			lc.app._expectedExpressions[expression] = [];
		lc.app._expectedExpressions[expression].push(listener);
	},
	
	newDefinitionsAvailable: function() {
		for (var expression in lc.app._expectedExpressions) {
			var value = eval("("+expression+")");
			if (typeof value != 'undefined') {
				lc.async.Callback.callListeners(lc.app._expectedExpressions[expression]);
				delete lc.app._expectedExpressions[expression];
			}
		}
	},
	
	onLoaded: function(listener) {
		if (lc.app._applicationListeners === null)
			lc.async.Callback.callListeners(listener);
		else
			lc.app._applicationListeners.push(listener);
	},
	
	loaded: function() {
		lc.app.newDefinitionsAvailable();
		lc.async.Callback.callListeners(lc.app._applicationListeners);
		lc.app._applicationListeners = null;
		lc.app.newDefinitionsAvailable();
		for (var expression in lc.app._expectedExpressions)
			lc.log.warn("lc.app", "Application loaded but still waiting for: " + expression);
	}
	
});
// TODO body onready = newDefinitionsAvailable
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
	window._lc_ajax_XMLHttpRequest_send.apply(this, [body]);
}
lc.core.createClass("lc.async.Callback", function(objThis, fct, firstArgs) {
	// Callback constructor
	this._this = objThis;
	this._fct = fct;
	this._args = firstArgs;
}, {
	
	call: function() {
		var args = [];
		for (var i = 0; i < arguments.length; ++i)
			args.push(arguments[i]);
		if (this._args) args = this._args.concat(args);
		return this._fct.apply(this._this, args);
	},
	
	apply: function(args) {
		var a = [];
		if (args)
			for (var i = 0; i < args.length; ++i)
				a.push(args[i]);
		if (this._args)
			a = this._args.concat(a);
		return this._fct.apply(this._this, a);
	},
	
	toFunction: function() {
		var that = this;
		return function() {
			return that.apply(arguments);
		};
	}
	
});

lc.async.Callback.callListeners = function(listeners, args) {
	if (!Array.isArray(listeners)) listeners = [listeners];
	if (typeof args === 'undefined') args = [];
	for (var i = 0; i < listeners.length; ++i) {
		try {
			if (typeof listeners[i] === 'function')
				listeners[i](args);
			else if (lc.core.instanceOf(listeners[i], lc.async.Callback))
				listeners[i].apply(args);
			else
				throw "Unexpected listener type: " + lc.core.typeOf(listeners[i]);
		} catch (error) {
			lc.log.error("lc.async.Callback", "A listener thrown an exception: " + listeners[i] + ": " + error);
		}
	}
};

lc.async.Callback.from = function(callback) {
	if (typeof listeners[i] === 'function')
		return new lc.async.Callback(window, callback);
	if (lc.core.instanceOf(callback, lc.async.Callback))
		return callback;
	throw "Unexpected type: " + lc.core.typeOf(callback);
};


lc.core.createClass("lc.async.Future", function() {
	// Future constructor
	this._successListeners = [];
	this._errorListeners = [];
	this._doneListeners = [];
}, {
	
	_done: false,
	_result: undefined,
	_error: undefined,
	_successListeners: null,
	_errorListeners: null,
	_doneListeners: null,
	
	success: function(result) {
		if (this._done) throw "Future already done";
		this._result = result;
		this._done = true;
		this._callListeners();
	},
	
	error: function(error) {
		if (this._done) throw "Future already done";
		this._error = error;
		this._done = true;
		this._callListeners();
	},
	
	ondone: function(listener) {
		if (this._done) {
			lc.async.Callback.callListeners([listener], []);
			return this;
		}
		this._doneListeners.push(listener);
		return this;
	},
	
	onsucess: function(listener) {
		if (lc.core.instanceOf(listener, lc.async.Future))
			return onsuccess(function(result) { listener.success(result); });
		if (this._done) {
			if (this._error === undefined)
				lc.async.Callback.callListeners([listener], [this._result]);
			return this;
		}
		this._successListeners.push(listener);
		return this;
	},
	
	onerror: function(listener) {
		if (lc.core.instanceOf(listener, lc.async.Future))
			return onerror(function(error) { listener.error(error); });
		if (this._done) {
			if (this._error != undefined)
				lc.async.Callback.callListeners([listener], [this._error]);
			return this;
		}
		this._errorListeners.push(listener);
		return this;
	},
	
	isDone: function() {
		return this._done;
	},
	
	getResult: function() {
		return this._result;
	},
	
	getError: function() {
		return this._error;
	},
	
	_callListeners: function() {
		if (this._error === undefined)
			lc.async.Callback.callListeners(this._successListeners, [this._result]);
		else
			lc.async.Callback.callListeners(this._errorListeners, [this._error]);
		lc.async.Callback.callListeners(this._doneListeners, []);
		// cleanup
		this._doneListeners = null;
		this._successListeners = null;
		this._errorListeners = null;
	}
	
});

lc.core.extendClass("lc.async.JoinPoint", lc.async.Future, function() {
	// JoinPoint constructor
	lc.async.Future.call(this);
	this._remaining = 0;
	this._started = false;
}, {
	
	addToJoin: function(toJoin) {
		if (typeof toJoin === 'number')
			this._remaining += toJoin;
		else if (lc.core.instanceOf(toJoin, lc.async.Future)) {
			this._remaining++;
			toJoin
				.onsuccess(new lc.async.Callback(this, this.join))
				.onerror(new lc.async.Callback(this, this.error));
		} else
			throw "Unexpected type to join: " + lc.Core.typeOf(toJoin);
	},
	
	start: function() {
		this._started = true;
		this._check();
	},
	
	join: function() {
		if (this._remaining <= 0) throw "JoinPoint: no more join expected";
		this._remaining--;
		if (this._started)
			this._check();
	},

	_check: function() {
		if (this._done) return;
		if (this._remaining <= 0)
			this.success(null);
	}

});

lc.core.createClass("lc.Cache", function(itemTimeout, onrelease, checkInterval) {
	this._timeout = itemTimeout;
	this._onrelease = onrelease;
	if (itemTimeout > 0) {
		if (checkInterval <= 0) checkInterval = 30000;
		var that = this;
		this._interval = setInterval(function() { that._checkTimeout(); }, checkInterval);
	}
}, {
	
	_items: new Map(),
	
	set: function(key, item) {
		var previous = this._items.get(key);
		if (previous) {
			if (this._onrelease)
				this._onrelease(key, previous.item);
		}
		this._items.set(key, {
			item: item,
			used: new Date().getTime(),
		});
	},
	
	get: function(key) {
		var value = this._items.get(key);
		if (!value)
			return undefined;
		value.used = new Date().getTime();
		return value.item;
	},
	
	remove: function(key) {
		var value = this._items.get(key);
		if (!value)
			return false;
		if (this._onrelease)
			this._onrelease(key, value.item);
		this._items.delete(key);
		return true;
	},
	
	close: function() {
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
		this._items = null;
	},
	
	_checkTimeout: function() {
		var min = new Date().getTime() - this._timeout;
		var onrelease = this._onrelease;
		this._items.forEach(function(item, key, map) {
			if (item.used < min) {
				if (onrelease)
					onrelease(key, item.item);
				map.delete(key);
			}
		});
	}
	
});
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
lc.core.namespace("lc.css", {
	
	hasClass: function(element, name) {
		var names = element.className.split(" ");
		return names.contains(name);
	},
	
	addClass: function(element, name) {
		if (element.className == "") { element.className = name; return; }
		var names = element.className.split(" ");
		if (names.contains(name)) return;
		element.className += " "+name;
	},
	
	removeClass: function(element, name) {
		if (element.className == "") return;
		if (element.className == name) { element.className = ""; return; }
		var names = element.className.split(" ");
		if (!names.contains(name)) return;
		names.remove(name);
		element.className = names.join(" ");
	},
	
	getClasses: function(element) {
		return element.className.split(" ");
	}

});
lc.core.namespace("lc.events", {
	
	_customEvents: {
		"destroy": function(element, listener) {}
	},
	
	registerCustomEvent: function(eventName, onListening) {
		if (!onListening) onListening = function(element,listener) {};
		if (typeof lc.events._customEvents[eventName] === 'undefined')
			lc.events._customEvents[eventName] = onListening;
	},
	
	triggerCustomEvent: function(element, eventType, args) {
		if (element._eventListeners) {
			for (var i = 0; i < element._eventListeners.length; ++i) {
				if (element._eventListeners[i].eventType == eventType)
					lc.Callback.callListeners(element._eventListeners[i].listener, args);
			}
		}
	},

	listen: function(element, eventType, listener) {
		if (!listener) throw "No listener given to lc.events.listen";
		if (!element._eventListeners)
			element._eventListeners = [];
		if (typeof listener === 'function')
			listener = new lc.Callback(listener, element); // use element as this object
		var e = {
			eventType: eventType,
			listener: listener
		}
		element._eventListeners.push(e);
		if (typeof lc.events._customEvents[eventType] === 'undefined') {
			e.listenerFct = e.listener.toFunction();
			element.addEventListener(eventType, e.listenerFct);
		} else
			lc.events._customEvents[eventType](element, listener);
	},
	
	unlisten: function(element, eventType, listener) {
		if (element._eventListeners) {
			for (var i = 0; i < element._eventListeners.length; ++i)
				if (element._eventListeners[i].eventType == eventType && (element._eventListeners[i].listener == listener || element._eventListeners[i].listener._fct == listener)) {
					listener = element._eventListeners[i].listenerFct;
					element._eventListeners[i].listener = null;
					element._eventListeners.splice(i,1);
					break;
				}
		}
		if (typeof lc.events._customEvents[eventType] === 'undefined') {
			element.removeEventListener(eventType, listener);
		}
	},
	
	destroyed: function(element) {
		if (element._destroyed) return;
		element._destroyed = true;
		if (element._eventListeners) {
			var listeners = element._eventListeners.slice();
			element._eventListeners = null;
			for (var i = 0; i < listeners.length; ++i) {
				if (listeners[i].eventType === 'destroy') {
					lc.Callback.callListeners(listeners[i].listener);
				} else if (typeof lc.events._customEvents[listeners[i].eventType] === 'undefined')
					element.removeEventListener(listeners[i].eventType, listeners[i].listener._fct);
				listeners[i].listener = null;
			}
		}
		if (element.childNodes)
			for (var i = 0; i < element.childNodes.length; ++i)
				lc.events.destroyed(element.childNodes[i]);
	}
	
});

lc.core.createClass("lc.events.Producer", function() {
	if (this.eventsListeners) return; // already initialized
	this.eventsListeners = {};
	this.listen = this.on; // alias
}, {

	registerEvent: function(eventName) {
		eventName = eventName.toLowerCase();
		this.eventsListeners[eventName] = [];
	},
	
	registerEvents: function(eventsNames) {
		for (var i = 0; i < eventsNames.length; ++i)
			this.eventsListeners[eventsNames[i].toLowerCase()] = [];
	},
	
	unregisterEvents: function(eventsNames) {
		for (var i = 0; i < eventsNames.length; ++i)
			delete this.eventsListeners[eventsNames[i].toLowerCase()];
	},
	
	on: function(eventName, listener) {
		eventName = eventName.toLowerCase();
		if (typeof this.eventsListeners[eventName] === 'undefined')
			throw "Unknown event: "+eventName;
		this.eventsListeners[eventName].push(listener);
	},
	
	unlisten: function(eventName, listener) {
		eventName = eventName.toLowerCase();
		if (typeof this.eventsListeners[eventName] === 'undefined')
			throw "Unknown event: "+eventName;
		for (var i = 0; i < this.eventsListeners[eventName].length; ++i)
			if (this.eventsListeners[eventName][i] == listener) {
				this.eventsListeners[eventName].splice(i,1);
				break;
			}
	},
	
	trigger: function(eventName, eventObject) {
		if (!this.eventsListeners) return; // destroyed
		eventName = eventName.toLowerCase();
		if (typeof this.eventsListeners[eventName] === 'undefined')
			throw "Unknown event: "+eventName;
		lc.log.debug("lc.events.Producer", eventName + " on " + lc.core.typeOf(this));
		lc.Callback.callListeners(this.eventsListeners[eventName], eventObject);
	},
	
	hasEvent: function(eventName) {
		eventName = eventName.toLowerCase();
		return typeof this.eventsListeners[eventName] != 'undefined';
	},
	
	destroy: function() {
		this.eventsListeners = null;
	}
});
lc.core.createClass("lc.Extendable", function() {
	if (this.extensions !== null) return; // already initialized
	this.extensions = [];
	lc.Extension.Registry.detect(this);
	this.extensions.sort(function(f1,f2) { return f2.priority - f1.priority; });
}, {
	extensions: null,
	
	addExtension: function(extension) {
		if (this.getExtension(extension) != null) return;
		extension = new extension();
		this.extensions.push(extension);
		extension.init(this);
		this.extensionAdded(extension);
	},
	
	extensionAdded: function(extension) {},
	
	removeExtension: function(extension) {
		var found = false;
		if (typeof extension === 'function') {
			for (var i = 0; i < this.extensions.length; ++i)
				if (lc.core.instanceOf(this.extensions[i], extension)) {
					extension = this.extensions[i];
					this.extensions.splice(i,1);
					found = true;
					break;
				}
		} else {
			for (var i = 0; i < this.extensions.length; ++i)
				if (this.extensions[i] == extension) {
					this.extensions.splice(i,1);
					found = true;
					break;
				}
		}
		if (found)
			extension.destroy(this);
	},
	
	getExtension: function(extension) {
		for (var i = 0; i < this.extensions.length; ++i)
			if (lc.core.instanceOf(this.extensions[i], extension))
				return this.extensions[i];
		return null;
	},
	
	callExtensions: function(method) {
		if (!this.extensions) return; // destroyed
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < this.extensions.length; ++i)
			if (typeof this.extensions[i][method] === 'function') {
				this.extensions[i][method].apply(this.extensions[i], args);
				// an extension may cause the destruction
				if (!this.extensions) return;
			}
	},
	
	destroy: function() {
		if (!this.extensions) return;
		for (var i = 0; i < this.extensions.length; ++i)
			this.extensions[i].destroy(this);
		this.extensions = null;
	}
});

lc.core.createClass("lc.Extension", function() {
}, {
	priority: 0,
	detect: function(obj) {},
	init: function(extendable) {},
	destroy: function(extendable) {}
});

lc.Extension.Registry = {
	_extensions: [],
	
	register: function(extended, extension) {
		this._extensions.push({extended: extended, extension: extension});
	},
	
	detect: function(obj) {
		for (var i = 0; i < this._extensions.length; ++i)
			if (lc.core.instanceOf(obj, this._extensions[i].extended))
				if (this._extensions[i].extension.prototype.detect(obj))
					obj.addExtension(this._extensions[i].extension);
	}
};
lc.core.namespace("lc.html", {
	
	walkChildren: function(element, callback) {
		for (var i = 0; i < element.childNodes.length; ++i) {
			if (lc.Callback.from(callback).call(element.childNodes[i])) continue;
			if (element.childNodes[i].nodeType == 1)
				lc.html.walkChildren(element.childNodes[i], callback);
		}
	},
	
	create: function(nodeName, attributes) {
		var element = document.createElement(nodeName);
		if (attributes)
			for (var name in attributes)
				element[name] = attributes[name];
		return element;
	},

	remove: function(element) {
		lc.events.destroyed(element);
		if (element.parentNode)
			element.parentNode.removeChild(element);
	},

	empty: function(element) {
		while (element.childNodes.length > 0)
			lc.html.remove(element.childNodes[0]);
	},

	addOption: function(select, value, text) {
		var o = document.createElement("OPTION");
		o.value = value;
		o.text = text;
		select.add(o);
	},

	insertAfter: function(toInsert, after) {
		if (after.nextSibling)
			return after.parentNode.insertBefore(toInsert, after.nextSibling);
		return after.parentNode.appendChild(toInsert);
	},

	escape: function(unsafe) {
	    return unsafe
	         .replace(/&/g, "&amp;")
	         .replace(/</g, "&lt;")
	         .replace(/>/g, "&gt;")
	         .replace(/"/g, "&quot;")
	         .replace(/'/g, "&#039;");
	 }

});
lc.core.namespace("lc.html.processor", {
	
	_preprocessors: [],
	_postprocessors: [],
	
	addPreProcessor: function(processor, priority) {
		if (!priority) priority = 1000;
		lc.html.processor._preprocessors.push({ processor:processor, priority:priority });
		lc.html.processor._preprocessors.sort(function(p1,p2) { return p2.priority - p1.priority; });
	},
	
	addPostProcessor: function(processor, priority) {
		if (!priority) priority = 1000;
		lc.html.processor._postprocessors.push({ processor:processor, priority:priority });
		lc.html.processor._postprocessors.sort(function(p1,p2) { return p2.priority - p1.priority; });
	},
	
	removePreProcessor: function(processor) {
		for (var i = 0; i < lc.html.processor._preprocessors.length; ++i)
			if (lc.html.processor._preprocessors[i].processor === processor) {
				lc.html.processor._preprocessors.splice(i,1);
				return;
			}
	},
	
	removePostProcessor: function(processor) {
		for (var i = 0; i < lc.html.processor._postprocessors.length; ++i)
			if (lc.html.processor._postprocessors[i].processor === processor) {
				lc.html.processor._postprocessors.splice(i,1);
				return;
			}
	},
	
	removeProcessor: function(processor) {
		lc.html.processor.removePreProcessor(processor);
		lc.html.processor.removePostProcessor(processor);
	},
	
	STATE_RUNNING: 0,
	STATE_INTERRUPTED: 1,
	STATE_STOPPED: 2,
	
	process: function(element) {
		var status = new lc.html.processor.Status(element);
		status._continueProcessing();
		return status.result;
	},
	
	processContent: function(element) {
		var status = new lc.html.processor.Status(element);
		status._elements[0]._preprocessors = [];
		status._elements[0]._postprocessors = [];
		status._continueProcessing();
		return status.result;
	}
	
});

lc.core.createClass("lc.html.processor.Status", function(rootElement) {
	
	this._elements = [new lc.html.processor.ElementStatus(rootElement, this)];
	this.result = new lc.async.Future();
	
}, {
	
	interrupt: function() {
		this._state = lc.html.processor.STATE_INTERRUPTED;
	},
	
	stop: function() {
		this._state = lc.html.processor.STATE_STOPPED;
	},
	
	resume: function() {
		this._state = lc.html.processor.STATE_RUNNING;
		this._continueProcessing();
	},
	
	_state: lc.html.processor.STATE_RUNNING,
	
	_continueProcessing: function() {
		while (true) {
			// if globally stopped, stop every pending element and return
			if (this._state == lc.html.processor.STATE_STOPPED) {
				while (this._elements.length > 0) {
					var e = this._elements[this._elements.length - 1];
					this._elements.splice(this._elements.length - 1, 1);
					e.result.success(e);
				}
				this.result.success(this);
				return;
			}
			// if no more element, return
			if (this._elements.length == 0) {
				this.result.success(this);
				return;
			}
			// process current element
			var e = this._elements[this._elements.length - 1];
			if (e._state == lc.html.processor.STATE_INTERRUPTED)
				return;
			if (e._state == lc.html.processor.STATE_STOPPED) {
				e.result.success(e);
				this._elements.splice(this._elements.length - 1, 1);
				continue;
			}
			// running - preprocessors
			if (e._preprocessors) {
				var processor = e._preprocessors[0];
				e._preprocessors.splice(0, 1);
				lc.async.Callback.callListeners(processor.processor, [e.element, e, this]);
				continue;
			}
			// running - children
			if (e._children === undefined) {
				e._children = [];
				for (var i = 0; i < e.element.childNodes.length; ++i)
					e._children.push(e.element.childNodes[i]);
			}
			if (e._children) {
				var child = e._children[0];
				e._children.splice(0, 1);
				var childStatus = new lc.html.processor.ElementStatus(child, this);
				this._elements.push(childStatus);
				continue;
			}
			// running - postprocessors
			if (e._postprocessors === undefined)
				e._postprocessors = lc.html.processor._postprocessors.splice();
			if (e._postprocessors) {
				var processor = e._postprocessors[0];
				e._postprocessors.splice(0, 1);
				lc.async.Callback.callListeners(processor.processor, [e.element, e, this]);
				continue;
			}
			// end of element
			e.result.success(e);
			this._elements.splice(this._elements.length - 1, 1);
			lc.events.triggerCustomEvent(e.element, "processed");
		}
	}
	
});

lc.core.createClass("lc.html.processor.ElementStatus", function(element, mainStatus) {
	
	this.element = element;
	this._mainStatus = mainStatus;
	this._state = lc.html.processor.STATE_RUNNING;
	this._preprocessors = lc.html.processor._preprocessors.splice();
	this._children = undefined;
	this._postprocessors = undefined;
	this.result = new lc.async.Future();
	
}, {
	
	interrupt: function() {
		this._state = lc.html.processor.STATE_INTERRUPTED;
	},
	
	stop: function() {
		this._state = lc.html.processor.STATE_STOPPED;
	},
	
	resume: function() {
		this._state = lc.html.processor.STATE_RUNNING;
		this._mainStatus._continueProcessing();
	}
	
});

lc.events.registerCustomEvent("processed", function(element, listener) {});

// Handle layout change

lc.core.createClass("lc.layout.Handler", function(element) {
	element._lc_layout_handler = this;
	this._listeners = [];
	this._refreshValues(element);
}, {
	
	_refreshValues: function(element) {
		this._clientWidth = element.clientWidth;
		this._clientHeight = element.clientHeight;
		this._offsetWidth = element.offsetWidth;
		this._offsetHeight = element.offsetHeight;
		this._scrollWidth = element.scrollWidth;
		this._scrollHeight = element.scrollHeight;
	},
	
	_check: function(element) {
		if (element.clientWidth != this._clientWidth ||
			element.clientHeight != this._clientHeight ||
			element.offsetWidth != this._offsetWidth ||
			element.offsetHeight != this._offsetHeight ||
			element.scrollWidth != this._scrollWidth ||
			element.scrollHeight != this._scrollHeight
			) {
			lc.async.Callback.callListeners(this._listeners);
			this._refreshValues(element);
		}
	}
	
});

lc.layout.onChange = function(element, listener) {
	if (!element._lc_layout_handler)
		new lc.layout.Handler(element);
	element._lc_layout_handler._listeners.push(listener);
};

lc.layout.triggerChange = function(element) {
	if (element._lc_layout_handler)
		element._lc_layout_handler._check(element);
	for (var i = 0; i < element.childNodes.length; ++i) {
		if (element.childNodes[i].nodeType != 1) continue;
		lc.layout.triggerChange(element.childNodes[i]);
	}
};

window.addEventListener("resize", function() {
	lc.layout.triggerChange(document.body);
});

lc.layout.getAbsolutePosition = function(element) {
	var pos = { x : element.offsetLeft, y : element.offsetTop };
	while (element.offsetParent != document.body) {
		element = element.offsetParent;
		pos.x -= element.scrollLeft;
		pos.y -= element.scrollTop;
		pos.x += element.offsetLeft;
		pos.y += element.offsetTop;
	}
	return pos;
};


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

lc.app.onDefined(["lc.html.processor", "lc.locale"], function() {
	
	lc.html.processor.addPreProcessor(function(element, elementStatus, globalStatus) {
		// TODO
		// tags, comments...
	}, 10);
	
});
lc.core.namespace("lc.log", {
	
	Levels: {
		TRACE: 0,
		DEBUG: 1,
		INFO: 2,
		WARN: 3,
		ERROR: 4
	},
	
	_formatComponents: [],
	_defaultLevel: 2,
	_loggerLevel: {},
	
	setFormat: function(format) {
		var components = [];
		var pos = 0;
		while (pos < format.length) {
			var i = format.indexOf("${", pos);
			if (i >= 0) {
				var j = format.indexOf("}", i + 2);
				if (j > 0) {
					pos = j + 1;
					var s = format.substring(i + 2, j);
					var size = -1;
					i = s.indexOf(':');
					if (i > 0) {
						s = s.substring(0, i);
						size = parseInt(s.substring(i + 1));
					}
					if (s == "time") {
						components.push(new lc.log.FormatComponentTime());
						continue;
					}
					if (s == "datetime") {
						components.push(new lc.log.FormatComponentDateTime());
						continue;
					}
					if (s == "level") {
						components.push(new lc.log.FormatComponentLevel(size));
						continue;
					}
					if (s == "logger") {
						components.push(new lc.log.FormatComponentLogger(size));
						continue;
					}
					if (s == "message") {
						components.push(new lc.log.FormatComponentMessage(size));
						continue;
					}
				}
				
			}
			components.push(new lc.log.FormatComponentString(format.substr(pos)));
			break;
		}
		lc.log._formatComponents = components;
	},
	
	setDefaultLevel: function(level) {
		lc.log._defaultLevel = level;
	},
	
	setLevel: function(logger, level) {
		if (typeof logger != 'string')
			logger = lc.core.typeOf(logger);
		lc.log._loggerLevel[logger] = level;
	},
	
	log: function(logger, level, message) {
		if (!logger) {
			// default
			if (level < lc.log._defaultLevel)
				return false;
		} else {
			if (typeof logger != 'string')
				logger = lc.core.typeOf(logger);
			if (typeof lc.log._loggerLevel[logger] === 'undefined') {
				// default
				if (level < lc.log._defaultLevel)
					return false;
			} else {
				if (level < lc.log._loggerLevel[logger])
					return false;
			}
		}
		if (!message)
			return true;
		var s = "";
		for (var i = 0; i < lc.log._formatComponents.length; ++i)
			s += lc.log._formatComponents[i].format(logger, level, message);
		if (level == lc.log.Levels.ERROR)
			console.error(s);
		else if (level == lc.log.Levels.WARN)
			console.warn(s);
		else if (level == lc.log.Levels.INFO)
			console.info(s);
		else if (level == lc.log.Levels.DEBUG)
			console.debug(s);
		else
			console.log(s);
	},
	
	trace: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.TRACE, message);
	},
	
	debug: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.DEBUG, message);
	},
	
	info: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.INFO, message);
	},
	
	warn: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.WARN, message);
	},
	
	error: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.ERROR, message);
	}
	
});

lc.core.createClass("lc.log.FormatComponentString", function(str) {
	this.string = str;
}, {
	format: function(logger, level, message) {
		return string;
	}
});

lc.core.createClass("lc.log.FormatComponentTime", function() {
}, {
	format: function(logger, level, message) {
		return new Date().toLocaleTimeString();
	}
});

lc.core.createClass("lc.log.FormatComponentDateTime", function() {
}, {
	format: function(logger, level, message) {
		return new Date().toLocaleString();
	}
});

lc.core.createClass("lc.log.FormatComponentLevel", function(size) {
	this.size = size <= 0 ? 5 : size;
}, {
	format: function(logger, level, message) {
		var s = "";
		for (var name in lc.log.Levels)
			if (lc.log.Levels[name] == level) {
				s = name;
				break;
			}
		if (s.length > this.size) s = s.substring(0, this.size);
		while (s.length < this.size) s = s + ' ';
		return s;
	}
});

lc.core.createClass("lc.log.FormatComponentLogger", function(size) {
	this.size = size;
}, {
	format: function(logger, level, message) {
		var s = logger;
		if (this.size > 0) {
			if (s.length > this.size) s = s.substring(0, this.size);
			while (s.length < this.size) s = s + ' ';
		}
		return s;
	}
});

lc.core.createClass("lc.log.FormatComponentMessage", function(size) {
	this.size = size;
}, {
	format: function(logger, level, message) {
		var s = "" + message;
		if (this.size > 0) {
			if (s.length > this.size) s = s.substring(0, this.size);
			while (s.length < this.size) s = s + ' ';
		}
		return s;
	}
});

lc.log.setFormat("${time} ${level} ${logger:15} ${message}");
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
		css.onload = function() {
			lc.log.debug("lc.resources", "CSS loaded: "+us);
			cache.future.success(css);
		};
		s.onerror = function() {
			lc.log.error("lc.resources","Error loading CSS "+us);
			js.future.error("CSS loading error"); // TODO more details ?
		};
		css.href = us;
		document.getElementsByTagName("HEAD")[0].appendChild(css);
		return cache.future;
	};
	
});

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
		
		lc.ajax.get(us)
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

lc.app.onDefined(["lc.resources", "lc.Cache"], function() {
	
	lc.resources._js_cache = new lc.Cache();
	
	lc.resources.js = function(url) {
		var u = url instanceof lc.URL ? url : new lc.URL(url);
		var us = u.toString();
		var js = lc.resources._js_cache.get(us);
		if (js)
			return js.future;

		var s = document.createElement("SCRIPT");
		js = { url: u, element: s, future: new lc.async.Future() };
		lc.resources._js_cache.set(us, js);
		s.type = "text/javascript";
		s.onload = function() {
			lc.log.debug("lc.resources", "Javascript loaded: "+us);
			js.future.success(s);
			lc.app.newDefinitionsAvailable();
		};
		s.onerror = function() {
			lc.log.error("lc.resources","Error loading javascript "+us);
			js.future.error("Javascript loading error"); // TODO more details ?
		};
		s.src = us;
		document.getElementsByTagName("HEAD")[0].appendChild(s);
		return js.future;
	};
	lc.resources.javascript = lc.resources.js;
	
});

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
		var get = lc.ajax.get(url);
		cache = { future: get };
		lc.resources._default_cache.set(us, cache);
		return get;
	}
	
});
lc.core.createClass("lc.URL", function(s) {
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
}, {
	
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

});

lc.URL.decode = function(s) { return decodeURIComponent(s).replace(/\+/g, " "); }

lc.core.namespace("lc.xml", {
	
	getChildElementsByName: function(element, childName) {
		childName = childName.toUpperCase();
		var list = [];
		for (var i = 0; i < element.childNodes.length; ++i)
			if (element.childNodes[i].nodeType == 1 && element.childNodes[i].nodeName == childName)
				list.push(element.childNodes[i]);
		return list;
	},
	
	getChildByName: function(element, childName) {
		childName = childName.toUpperCase();
		for (var i = 0; i < element.childNodes.length; ++i)
			if (element.childNodes[i].nodeType == 1 && element.childNodes[i].nodeName == childName)
				return element.childNodes[i];
		return null;
	}

});
// footer javascript: after all other javascript files of this library

//trigger processing of page once the application is loaded
lc.app.onLoaded(function() {
	lc.html.process(document.body, function() {
		lc.layout.triggerChange(document.body);
	});
});

lc.core._loaded = true;
lc.app.newDefinitionsAvailable();
//# sourceMappingURL=lc-core.js.map