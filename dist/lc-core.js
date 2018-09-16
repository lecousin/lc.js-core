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
		var previous = typeof ns[cname] === 'undefined' ? undefined : ns[cname];
		ns[cname] = ctor;
		ns[cname].prototype = proto;
		ns[cname].prototype.constructor = ctor;
		if (previous) for (var n in previous) ns[cname][n] = previous[n];
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
		var previous = typeof ns[cname] === 'undefined' ? undefined : ns[cname];
		ns[cname] = ctor;
		if (previous) for (var n in previous) ns[cname][n] = previous[n];
		ns[cname]._lcClass = name;
		ns[cname]._lcExtends = [];
		
		if (!Array.isArray(parents))
			parents = [parents];

		var p = {};
		for (var i = 0; i < parents.length; ++i) {
			if (!parents[i]) throw new Error("Undefined extended class for " + name);
			if (typeof parents[i]._lcClass === 'undefined') throw new Error("Not a valid class to extend: " + parents[i] + " (when defining class " + name + ")");
			lc.core.merge(p, parents[i].prototype);
			if (ns[cname]._lcExtends.indexOf(parents[i]) < 0)
				ns[cname]._lcExtends.push(parents[i]._lcClass);
			if (parents[i]._lcExtends)
				for (var j = 0; j < parents[i]._lcExtends.length; ++j)
					if (ns[cname]._lcExtends.indexOf(parents[i]._lcExtends[j]) < 0)
						ns[cname]._lcExtends.push(parents[i]._lcExtends[j]);
		}
		for (var n in p)
			if (typeof proto[n] === 'undefined')
				proto[n] = p[n];
		ns[cname].prototype = proto;
		ns[cname].prototype.constructor = ctor;
		return ns[cname];
	},
	
	fromName: function(name) {
		return lc.core._fromName(window, name);
	},
	
	_fromName: function(parent, name) {
		if (typeof parent[name] !== 'undefined')
			return parent[name];
		var pos = 0;
		while (pos < name.length) {
			var i = name.indexOf('.', pos);
			if (i <= 0) return undefined;
			if (typeof parent[name.substring(0, i)] !== 'undefined') {
				var val = lc.core._fromName(parent[name.substring(0, i)], name.substring(i + 1));
				if (val) return val;
			}
			pos = i + 1;
		}
		return undefined;
	},
	
	instanceOf: function(obj, clazz) {
		if (typeof clazz === 'string') clazz = lc.core.fromName(clazz);
		if (obj instanceof clazz) return true;
		if (typeof obj.constructor !== 'function') return false;
		if (typeof obj.constructor._lcExtends === 'undefined') return false;
		for (var i = 0; i < obj.constructor._lcExtends.length; ++i)
			if (lc.core.fromName(obj.constructor._lcExtends[i]) == clazz)
				return true;
		return false;
	},
	
	isExtending: function(clazz, searchedClass) {
		if (typeof clazz === 'string') clazz = lc.core.fromName(clazz);
		if (typeof searchedClass === 'string') searchedClass = lc.core.fromName(searchedClass);
		if (typeof clazz._lcExtends === 'undefined') return false;
		for (var i = 0; i < clazz._lcExtends.length; ++i)
			if (lc.core.fromName(clazz._lcExtends[i]) == searchedClass)
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
	
	className: function(ctor) {
		return ctor._lcClass;
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
		var value = undefined;
		try { value = eval("("+expression+")"); }
		catch (e) {}
		if (typeof value !== 'undefined' && lc.core._loaded) {
			lc.async.Callback.callListeners(listener);
			return;
		}
		if (typeof lc.app._expectedExpressions[expression] === 'undefined')
			lc.app._expectedExpressions[expression] = [];
		lc.app._expectedExpressions[expression].push(listener);
	},
	
	newDefinitionsAvailable: function() {
		var nb;
		do {
			nb = Object.keys(lc.app._expectedExpressions).length;
			for (var expression in lc.app._expectedExpressions) {
				var value = undefined;
				try { value = eval("("+expression+")"); }
				catch (e) {}
				if (typeof value !== 'undefined') {
					lc.async.Callback.callListeners(lc.app._expectedExpressions[expression]);
					delete lc.app._expectedExpressions[expression];
				}
			}
		} while (Object.keys(lc.app._expectedExpressions).length != nb)
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
		lc.log.debug("lc.app", "Application loaded.");
	},
	
	_pending: [],
	
	pending: function(future) {
		lc.app._pending.push(future);
		if (lc.app._pending.length == 1)
			lc.app._working();
		future.ondone(function() {
			lc.app._pending.remove(future);
			if (lc.app._pending.length == 0)
				lc.app._idle();
		});
	},
	
	_idleListeners: [],
	_workingListeners: [],
	
	_idle: function() {
		lc.async.Callback.callListeners(lc.app._idleListeners);
	},
	
	_working: function() {
		lc.async.Callback.callListeners(lc.app._workingListeners);
	},
	
	addIdleListener: function(listener) {
		lc.app._idleListeners.push(listener);
		if (lc.app._pending.length == 0)
			lc.async.Callback.callListeners(listener);
	},
	
	removeIdleListener: function(listener) {
		lc.app._idleListeners.remove(listener);
	},

	addWorkingListener: function(listener) {
		lc.app._workingListeners.push(listener);
		if (lc.app._pending.length > 0)
			lc.async.Callback.callListeners(listener);
	},
	
	removeWorkingListener: function(listener) {
		lc.app._workingListeners.remove(listener);
	}

});

// on body ready, new definitions may be available with inline scripts
window.addEventListener('load', function() {
	lc.app.newDefinitionsAvailable();
	document.body.addEventListener('ready', lc.app.newDefinitionsAvailable);
})

// on startup, call _idle if nothing is pending
setTimeout(function() {
	if (lc.app._pending.length == 0)
		lc.app._idle();
}, 1);
lc.core.namespace("lc.animation", {
	
	animate: function(element, classStart, classEnd) {
		if (typeof classStart == 'undefined') {
			classStart = "lc-animate-start";
			classEnd = "lc-animate-end";
		}
		var future = new lc.async.Future();
		var started = false, ended = false;
		var onstart, onend;
		onstart = function() {
			started = true;
			element.removeEventListener("transitionstart", onstart);
		};
		onend = function() {
			if (ended) return;
			lc.css.removeClass(element, "lc-animate");
			lc.css.removeClass(element, classEnd);
			element.removeEventListener("transitionend", onend);
			element.removeEventListener("transitioncancel", onend);
			ended = true;
			future.success();
		};
		element.addEventListener("transitionstart", onstart);
		element.addEventListener("transitionend", onend);
		element.addEventListener("transitioncancel", onend);
		lc.css.addClass(element, "lc-animate");
		lc.css.addClass(element, classStart);
		setTimeout(function() {
			// transitionstart event does not work yet
			var s = getComputedStyle(element);
			if (s.transitionProperty) started = true;
			if (!started) {
				lc.css.removeClass(element, "lc-animate");
				lc.css.removeClass(element, classStart);
				element.removeEventListener("transitionstart", onstart);
				element.removeEventListener("transitionend", onend);
				element.removeEventListener("transitioncancel", onend);
				future.success();
				return;
			}
			lc.css.removeClass(element, classStart);
			lc.css.addClass(element, classEnd);
			// in case transition end/cancel does not work
			var time = s.transitionDuration;
			var i = time.indexOf("ms");
			var j = time.indexOf("s");
			if (i > 0 && i < j) {
				time = parseInt(time.substring(0,i));
			} else if (j > 0) {
				time = parseFloat(time.substring(0,j))*1000;
			} else {
				time = 0;
			}
			setTimeout(onend, Math.floor(time+1));
		},1);
		return future;
	},
	
	animateReverse: function(element) {
		return this.animate(element, "lc-animate-end", "lc-animate-start");
	},

	collapseHeight: function(element, time) {
		element.style.transitionProperty = "height,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "top";
		element.style.overflow = "hidden";
		var s = getComputedStyle(element);
		element.style.paddingTop = s.paddingTop;
		element.style.paddingBottom = s.paddingBottom;
		var paddingTop = parseInt(s.paddingTop);
		if (isNaN(paddingTop)) paddingTop = 0;
		var paddingBottom = parseInt(s.paddingBottom);
		if (isNaN(paddingBottom)) paddingBottom = 0;
		element.style.height = (element.clientHeight-paddingTop-paddingBottom) + 'px';
		element.style.transform = "scaleY(1)";
		var future = new lc.async.Future();
		setTimeout(function() {
			element.style.height = "0px";
			element.style.transform = "scaleY(0)";
			element.style.paddingTop = "0px";
			element.style.paddingBottom = "0px";
			setTimeout(function() {
				element.style.height = "";
				element.style.transform = "";
				element.style.paddingTop = "";
				element.style.paddingBottom = "";
				element.style.transitionProperty = "";
				element.style.transitionDuration = '';
				element.style.transitionTimingFunction = "";
				element.style.overflow = "";
				future.success();
			}, time);
		},0);
		return future;
	},
	
	expandHeight: function(element, time) {
		var s = getComputedStyle(element);
		element.style.paddingTop = "0px";
		element.style.paddingBottom = "0px";
		var height = element.clientHeight;
		element.style.transitionProperty = "height,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "top";
		element.style.overflow = "hidden";
		element.style.height = "0px";
		element.style.transform = "scaleY(0)";
		var future = new lc.async.Future();
		setTimeout(function() {
			element.style.paddingTop = s.paddingTop;
			element.style.paddingBottom = s.paddingBottom;
			var paddingTop = parseInt(s.paddingTop);
			if (isNaN(paddingTop)) paddingTop = 0;
			var paddingBottom = parseInt(s.paddingBottom);
			if (isNaN(paddingBottom)) paddingBottom = 0;
			element.style.height = (height-paddingTop-paddingBottom) + 'px';
			element.style.transform = "scaleY(1)";
			setTimeout(function() {
				element.style.height = "";
				element.style.transform = "";
				element.style.paddingTop = "";
				element.style.paddingBottom = "";
				element.style.transitionProperty = "";
				element.style.transitionDuration = '';
				element.style.transitionTimingFunction = "";
				element.style.overflow = "";
				future.success();
			}, time);
		},0);
		return future;
	},
	
	collapseWidth: function(element, time) {
		element.style.transitionProperty = "width,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "left";
		element.style.overflow = "hidden";
		var s = getComputedStyle(element);
		element.style.paddingLeft = s.paddingLeft;
		element.style.paddingRight = s.paddingRight;
		var paddingLeft = parseInt(s.paddingTop);
		if (isNaN(paddingLeft)) paddingLeft = 0;
		var paddingRight = parseInt(s.paddingBottom);
		if (isNaN(paddingRight)) paddingRight = 0;
		element.style.width = (element.clientWidth-paddingLeft-paddingRight) + 'px';
		element.style.transform = "scaleX(1)";
		var future = new lc.async.Future();
		setTimeout(function() {
			element.style.width = "0px";
			element.style.transform = "scaleX(0)";
			element.style.paddingLeft = "0px";
			element.style.paddingRight = "0px";
			setTimeout(function() {
				element.style.width = "";
				element.style.transform = "";
				element.style.paddingLeft = "";
				element.style.paddingRight = "";
				element.style.transitionProperty = "";
				element.style.transitionDuration = '';
				element.style.transitionTimingFunction = "";
				element.style.overflow = "";
				future.success();
			}, time);
		},0);
		return future;
	},
	
	expandWidth: function(element, time) {
		var s = getComputedStyle(element);
		var width = element.clientWidth;
		element.style.transitionProperty = "width,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "left";
		element.style.overflow = "hidden";
		element.style.width = "0px";
		element.style.transform = "scaleY(0)";
		element.style.paddingLeft = "0px";
		element.style.paddingRight = "0px";
		var future = new lc.async.Future();
		setTimeout(function() {
			element.style.paddingLeft = s.paddingLeft;
			element.style.paddingRight = s.paddingRight;
			var paddingLeft = parseInt(s.paddingLeft);
			if (isNaN(paddingLeft)) paddingLeft = 0;
			var paddingRight = parseInt(s.paddingRight);
			if (isNaN(paddingRight)) paddingRight = 0;
			element.style.width = (width-paddingLeft-paddingRight) + 'px';
			element.style.transform = "scaleY(1)";
			setTimeout(function() {
				element.style.width = "";
				element.style.transform = "";
				element.style.paddingLeft = "";
				element.style.paddingRight = "";
				element.style.transitionProperty = "";
				element.style.transitionDuration = '';
				element.style.transitionTimingFunction = "";
				element.style.overflow = "";
				future.success();
			}, time);
		},0);
		return future;
	}
	
});

/**
 * @namespace lc.async
 * Provides functionalities for asynchronous programming.
 */

/**
 * @class lc.async.Callback
 * TODO
 */

lc.core.createClass("lc.async.Callback",
/**
 * @constructor
 * @param objThis object <code>this</code> for the callback
 * @param fct function the function to be called
 * @param firstArgs array optional. First arguments to be passed to the function
 */
function(objThis, fct, firstArgs) {
	// Callback constructor
	this._this = objThis;
	this._fct = fct;
	this._args = firstArgs;
}, {
	
	/**
	 * Call the function with given arguments
	 * @param ... Array:any List of arguments
	 * @returns any the value returned by this callback
	 */
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
	else listeners = listeners.slice();
	if (typeof args === 'undefined') args = [];
	for (var i = 0; i < listeners.length; ++i) {
		try {
			if (typeof listeners[i] === 'function')
				listeners[i].apply(null, args);
			else if (lc.core.instanceOf(listeners[i], lc.async.Callback))
				listeners[i].apply(args);
			else
				throw "Unexpected listener type: " + lc.core.typeOf(listeners[i]);
		} catch (error) {
			lc.log.error("lc.async.Callback", "A listener thrown an exception: " + listeners[i] + ": " + error, error);
		}
	}
};

/**
 * Creates a Callback from the given argument.<br/>
 * If a function is given, a Callback with the window as <code>this</code> object is created.<br/>
 * If a Callback is given, returns it.
 * @param callback function|lc.async.Callback to be converted into a Callback
 * @returns lc.async.Callback a Callback
 * @throws if the given argument is not supported
 */
lc.async.Callback.from = function(callback) {
	if (typeof listeners[i] === 'function')
		return new lc.async.Callback(window, callback);
	if (lc.core.instanceOf(callback, lc.async.Callback))
		return callback;
	throw "Unexpected type: " + lc.core.typeOf(callback);
};


/**
 * @class lc.async.Future
 * TODO description
 */
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
	
	onsuccess: function(listener) {
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
			return this.onerror(function(error) { listener.error(error); });
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

/**
 * @class lc.async.JoinPoint
 * TODO description
 * @extends lc.async.Future
 */
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
			throw "Unexpected type to join: " + lc.core.typeOf(toJoin);
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

lc.async.JoinPoint.from = function() {
	var jp = new lc.async.JoinPoint();
	for (var i = 0; i < arguments.length; ++i)
		jp.addToJoin(arguments[i]);
	jp.start();
	return jp;
};

lc.core.createClass("lc.Cache", function(itemTimeout, onrelease, checkInterval) {
	this._timeout = itemTimeout;
	this._onrelease = onrelease;
	if (itemTimeout > 0) {
		if (checkInterval <= 0 || !checkInterval) checkInterval = 30000;
		var that = this;
		this._interval = setInterval(function() {
			if (lc.log.trace("lc.Cache")) lc.log.trace("lc.Cache", "Check cache timeout");
			that._checkTimeout();
		}, checkInterval);
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
lc.core.createClass("lc.Configurable",
	function(properties) {
		if (!properties) properties = {};
		for (var n in properties) {
			var p = properties[n];
			var descr = {
				enumerable: true
			};
			
			if (p.get) descr.get = new Function("return this.configurableProperties[\"" + n + "\"].get.call(this, this.configurableProperties);");
			else descr.get = new Function("return this.configurableProperties[\"" + n + "\"].value;");
			
			if (p.set) descr.set = new Function("value", "return this.configurableProperties[\"" + n + "\"].set.call(this, value, this.configurableProperties);");
			else descr.set = new Function("value", "return this.configurableProperties[\"" + n + "\"].value = value;");
			
			if (typeof p["writable"] !== 'undefined') descr.writable = p.writable;
			
			Object.defineProperty(this, n, descr);
		}
		this.configurableProperties = properties;
	}, {
		
		configurableProperties: {}
		
	}
);
lc.app.onDefined(["lc.events", "lc.async.Callback"], function() {
	'use strict';
	lc.core.createClass("lc.Context",
	function(element) {
		element._lc_context = this;
		this.element = element;
		Object.defineProperty(this, "_values", {
			enumerable: false,
			writable: false,
			value: {}
		});
		Object.defineProperty(this, "events", {
			enumerable: false,
			writable: false,
			value: new lc.events.Producer()
		});
		Object.defineProperty(this, "addProperty", { enumerable: false, writable: false, configurable: false, value: lc.Context.prototype.addProperty });
		Object.defineProperty(this, "removeProperty", { enumerable: false, writable: false, configurable: false, value: lc.Context.prototype.removeProperty });
		Object.defineProperty(this, "hasProperty", { enumerable: false, writable: false, configurable: false, value: lc.Context.prototype.hasProperty });
		Object.defineProperty(this, "getProperty", { enumerable: false, writable: false, configurable: false, value: lc.Context.prototype.getProperty });
		this.events.registerEvents(["propertyAdded", "propertyRemoved", "propertySet", "changed", "destroyed"]);
		lc.Context.globalEvents.trigger("contextCreated", [this]);
		lc.events.listen(element, 'destroy', new lc.async.Callback(this, function() {
			element._lc_context = null;
			this.events.trigger("destroyed", [this]);
			lc.Context.globalEvents.trigger("contextDestroyed", [this]);
			this.element = null;
		}));
	}, {
		
		addProperty: function(name, value) {
			if (typeof this._values[name] !== 'undefined')
				throw "Property " + name + " already exists";
			this._values[name] = value;
			Object.defineProperty(this, name, {
				enumerable: true,
				configurable: true,
				get: function() { return this._values[name]; },
				set: function(value) {
					if (value === this._values[name]) return;
					this._values[name] = value;
					this.events.trigger("propertySet", [this, name, value]);
					lc.Context.globalEvents.trigger("propertySet", [this, name, value]);
					this.events.trigger("changed", [this]);
					lc.Context.globalEvents.trigger("changed", [this]);
				}
			});
			this.events.trigger("propertyAdded", [this, name, value]);
			lc.Context.globalEvents.trigger("propertyAdded", [this, name, value]);
			this.events.trigger("changed", [this]);
			lc.Context.globalEvents.trigger("changed", [this]);
		},
		
		removeProperty: function(name) {
			if (typeof this._values[name] === 'undefined') return;
			delete this._values[name];
			delete this[name];
			this.events.trigger("propertyRemoved", [this, name]);
			lc.Context.globalEvents.trigger("propertyRemoved", [this, name]);
			this.events.trigger("changed", [this]);
			lc.Context.globalEvents.trigger("changed", [this]);
		},
		
		hasProperty: function(name) {
			return typeof this._values[name] !== 'undefined';
		},
		
		getProperty: function(name) {
			if (typeof this._values[name] === 'undefined') return undefined;
			return this._values[name];
		}
		
	});

	lc.Context.get = function(element, doNotCreate) {
		if (typeof element["_lc_context"] === 'undefined')
			return doNotCreate ? null : new lc.Context(element);
		return element["_lc_context"];
	};

	lc.Context.getValue = function(element, propertyName) {
		var ctx = lc.Context.get(element, true);
		if (!ctx) return undefined;
		return ctx.getProperty(propertyName);
	};
	
	lc.Context.aggregate = function(element) {
		var ctx = {};
		do {
			var c = lc.Context.get(element, true);
			if (c)
				for (var n in c)
					if (typeof ctx[n] === 'undefined') ctx[n] = c[n];
			element = element.parentNode;
		} while (element && element.nodeName != "HTML");
		return ctx;
	};
	
	lc.Context.globalEvents = new lc.events.Producer();
	lc.Context.globalEvents.registerEvents(["propertyAdded","propertyRemoved","propertySet", "changed", "contextCreated", "contextDestroyed"]);
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
					lc.async.Callback.callListeners(element._eventListeners[i].listener, args);
			}
		}
	},

	listen: function(element, eventType, listener, useCapture) {
		if (!listener) throw new Error("No listener given to lc.events.listen");
		if (!element._eventListeners)
			element._eventListeners = [];
		if (typeof listener === 'function')
			listener = new lc.async.Callback(element, listener); // use element as this object
		var e = {
			eventType: eventType,
			listener: listener
		}
		element._eventListeners.push(e);
		if (typeof lc.events._customEvents[eventType] === 'undefined') {
			e.listenerFct = e.listener.toFunction();
			element.addEventListener(eventType, e.listenerFct, useCapture);
		} else
			lc.events._customEvents[eventType](element, listener);
	},
	
	unlisten: function(element, eventType, listener, useCapture) {
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
			element.removeEventListener(eventType, listener, useCapture);
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
					lc.async.Callback.callListeners(listeners[i].listener);
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
		if (lc.log.trace("lc.events.Producer"))
			lc.log.trace("lc.events.Producer", "Event registered: " + eventName);
	},
	
	registerEvents: function(eventsNames) {
		for (var i = 0; i < eventsNames.length; ++i)
			this.registerEvent(eventsNames[i]);
	},
	
	unregisterEvents: function(eventsNames) {
		for (var i = 0; i < eventsNames.length; ++i)
			delete this.eventsListeners[eventsNames[i].toLowerCase()];
	},
	
	on: function(eventName, listener) {
		eventName = eventName.toLowerCase();
		if (typeof this.eventsListeners[eventName] === 'undefined')
			throw new Error("Unknown event: "+eventName);
		this.eventsListeners[eventName].push(listener);
	},
	
	unlisten: function(eventName, listener) {
		eventName = eventName.toLowerCase();
		if (typeof this.eventsListeners[eventName] === 'undefined')
			throw new Error("Unknown event: "+eventName);
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
			throw new Error("Unknown event: "+eventName);
		if (lc.log.debug("lc.events.Producer"))
			lc.log.debug("lc.events.Producer", eventName + " on " + lc.core.typeOf(this));
		lc.async.Callback.callListeners(this.eventsListeners[eventName], eventObject);
	},
	
	hasEvent: function(eventName) {
		eventName = eventName.toLowerCase();
		return typeof this.eventsListeners[eventName] != 'undefined';
	},
	
	createListenersFromElement: function(element) {
		if (!element || element.nodeType != 1) return;
		for (var i = 0; i < element.attributes.length; ++i) {
			var a = element.attributes.item(i);
			if (!a.nodeName.startsWith("on-")) continue;
			var eventName = a.nodeName.substring(3);
			if (!this.hasEvent(eventName)) {
				lc.log.warn("lc.events.Producer", "Unknown event from attribute " + a.nodeName);
				continue;
			}
			try {
				var listener = new Function(a.nodeValue);
				this.listen(eventName, new lc.async.Callback(this, listener));
			} catch (error) {
				lc.log.error("lc.events.Producer", "Invalid event listener function from attribute " + a.nodeName + ": " + a.nodeValue, error);
			}
		}
	},
	
	destroy: function() {
		this.eventsListeners = null;
	}
});
/**
 * @class lc.Extendable
 * This class is made to be extended by other classes, to add support of extensions (or plug-ins).<br/>
 * Extensions can be added programmatically, or automatically detected throught the lc.Extension declared in the lc.Extension.Registry.
 */
lc.core.createClass("lc.Extendable", function() {
	if (this.extensions !== null) return; // already initialized
	this.extensions = [];
	this._overrides = {};
	lc.Extension.Registry.detect(this);
	this.extensions.sort(function(f1,f2) { return f2.priority - f1.priority; });
}, {
	extensions: null,
	
	addExtension: function(extension) {
		if (this.getExtension(extension) != null) return;
		try {
			extension = new extension();
		} catch (error) {
			lc.log.error("lc.Extendable", "Error instantiating extension " + extension + ": " + error, error);
			return;
		}
		this.extensions.push(extension);
		try {
			extension.init(this);
		} catch (error) {
			lc.log.error("lc.Extendable", "Error initializing extension " + lc.core.typeOf(extension) + ": " + error, error);
		}
		this.extensionAdded(extension);
		return extension;
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
		if (found) {
			for (var n in this._overrides) {
				var list = this._overrides[n];
				for (var i = 1; i < list.length; ++i) {
					if (list[i].extension === extension) {
						if (list[i].impl) {
							list.splice(i, 1);
							if (list.length == 1) {
								// last one
								this[n] = list[0].impl;
								delete this._overrides[n];
								break;
							}
						} else {
							// TODO property
						}
					}
				}
			}
			extension.destroy(this);
		}
	},
	
	getExtension: function(extension) {
		for (var i = 0; i < this.extensions.length; ++i)
			if (lc.core.instanceOf(this.extensions[i], extension))
				return this.extensions[i];
		return null;
	},
	
	hasExtension: function(extension) {
		return this.getExtension(extension) != null;
	},
	
	callExtensions: function(method) {
		if (!this.extensions) return; // destroyed
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < this.extensions.length; ++i)
			if (typeof this.extensions[i][method] === 'function') {
				try {
					this.extensions[i][method].apply(this.extensions[i], args);
					// an extension may cause the destruction
					if (!this.extensions) return;
				} catch (error) {
					lc.log.error("lc.Extandable", "Error calling method " + method + " on extension " + lc.core.typeOf(this.extensions[i]) + ": " + error, error);
				}
			}
	},
	
	extensionOverridesMethod: function(extension, methodName, newImplementation) {
		if (typeof this._overrides[methodName] === 'undefined') {
			this._overrides[methodName] = [{
				extension: null,
				impl: this[methodName]
			}];
			this[methodName] = function() {
				return this._callOverriddenMethod(methodName, arguments);
			};
		}
		this._overrides[methodName].push({
			extension: extension,
			impl: newImplementation
		});
	},
	_callOverriddenMethod: function(methodName, args) {
		var list = this._overrides[methodName];
		return list[list.length - 1].impl.apply(this, args);
	},
	callPreviousImplementation: function(extension, methodName, args) {
		var list = this._overrides[methodName];
		var i = list.length - 1;
		while (i >= 0 && list[i].extension != extension) i--;
		if (i <= 0) return;
		return list[i - 1].impl.apply(this, args);
	},
	// TODO extensionOverridesProperty
	
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
		if (lc.log.trace("lc.Extension"))
			lc.log.trace("lc.Extension", "Extension registered: " + lc.core.className(extension) + " extending " + lc.core.className(extended));
		this._extensions.push({extended: extended, extension: extension});
	},
	
	detect: function(obj) {
		for (var i = 0; i < this._extensions.length; ++i)
			if (lc.core.instanceOf(obj, this._extensions[i].extended))
				if (this._extensions[i].extension.prototype.detect(obj))
					obj.addExtension(this._extensions[i].extension);
	},
	
	getAvailableFor: function(extended) {
		var list = [];
		for (var i = 0; i < this._extensions.length; ++i)
			if (this._extensions[i].extended === extended || lc.core.isExtending(extended, this._extensions[i].extended))
				list.push(this._extensions[i].extension);
		return list;
	}
};
/**
 * @namespace lc.html
 * Utility methods to manipulate HTML.
 */
lc.core.namespace("lc.html", {
	
	/**
	 * Go through the DOM elements (node type 1) starting from the given element, and call the callback on each of its descendent.
	 * If the callback returns true on an element, its children won't be visited.
	 * @param element Element the element to start, the callback is not called on it but on its children and descendents.
	 * @param callback function|lc.async.Callback the callback to call on each element, taking the element as single argument.
	 */
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
	
	removeChildrenAfter: function(after) {
		while (after.nextSibling)
			lc.html.remove(after.nextSibling);
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
/**
 * @namespace lc.html.processor
 * HTML processing, to automatically modify the page once loaded.
 * <p>
 * A processor is a callback called on each HTML element, giving the opportunity to create, modify or remove some elements on the page.<br/>
 * A typical usage may be to replace a custom tag by a dynamic content.
 * </p>
 * <p>
 * There are 2 kinds of processor: pre-processors, which are called on a element before the descendents of this element,
 * and post-processors, called on a element once all its descendents have been processed.<br/>
 * The difference is that a pre-processor can modify the content of an element, before this content is itself processed,
 * while a post-processor is called after its content has been already processed.
 * </p>
 * <p>
 * The processing can be interrupted or stopped by any processor.<br/>
 * An interruption is typically useful when asynchronous events are necessary for the processing. For exemple an AJAX request to load some part of
 * the content to create.<br/>
 * A stop can be global or for the current element only. On an element, any future processing on this element (and its descendents in case of a pre-processor) is stopped.
 * A global stop will stop any processing on any element.
 * </p>
 * <p>
 * Each processor is associated with a priority, so the processors with higher priority are called first.
 * </p>
 * <p>
 * When processing an element, processors are called with the element, an ElementStatus, and a global Status.<br/>
 * The ElementStatus allows to stop the processing on the current element, to interrupt it, and then to resume it once everything is ready. It has also a Future object
 * allowing to known when the element has been completely processed (all pre-processors executed, all its descendents have been processed, and all post-processors executed).<br/>
 * The global status allows to stop globally the processing, and has also a Future object to known when the full processing have been done, or stopped.
 * </p>
 */
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
	
	stop: function() {
		this._state = lc.html.processor.STATE_STOPPED;
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
			if (e._preprocessors.length > 0) {
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
			if (e._children.length > 0) {
				var child = e._children[0];
				e._children.splice(0, 1);
				var childStatus = new lc.html.processor.ElementStatus(child, this);
				this._elements.push(childStatus);
				continue;
			}
			// running - postprocessors
			if (e._postprocessors === undefined)
				e._postprocessors = lc.html.processor._postprocessors.slice();
			if (e._postprocessors.length > 0) {
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
	this._preprocessors = lc.html.processor._preprocessors.slice();
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
	xhr.future = new lc.async.Future();
	xhr.addEventListener('readystatechange', function() {
		if (xhr.readyState != 4)
			return;
		xhr.future.success(xhr);
	});
});

// catch send method to customize requests, and know pending requests
window._lc_http_XMLHttpRequest_send = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(body) {
	lc.http._customize(this);
	lc.app.pending(this.future);
	window._lc_http_XMLHttpRequest_send.apply(this, [body]);
}

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
		if (i == -1) {
			lc.log.debug("lc.locale", "setLanguage ignored for unknown language: " + lang);
			return;
		}
		if (lc.locale._lang == lang) return;
		lc.locale._lang = lang;
		
		// store in local storage if available, else set a cookie
		if (window.localStorage)
			window.localStorage.setItem("lc.locale", lang);
		else
			lc.cookies.set("lc.locale", lang, "/", 365*24*60*60);
		
		lc.log.debug("lc.locale", "language set to: " + lang);
		
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
	
	loadDeclarations: function(url) {
		var result = new lc.async.Future();
		lc.http.rest.get(url)
			.onerror(result)
			.onsuccess(function(declarations) {
				try {
					for (var i = 0; i < declarations.namespaces.length; ++i) {
						var ns = declarations.namespaces[i];
						if (typeof ns === 'string')
							lc.locale.declare(url + '/', ns, null);
						else
							lc.locale.declare(url + '/', ns.name, ns.languages);
					}
					result.success();
				} catch (error) {
					result.error(error);
				}
			});
		return result;
	},
	
	hasNamespace: function(name) {
		return lc.locale.getNamespace(name) != undefined;
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
				if (langs == null) langs = ns.languages.slice();
				else for (var j = 0; j < langs.length; ++j)
					if (ns.languages.indexOf(langs[j]) < 0) {
						langs.splice(j,1);
						j--;
					}
			} else {
				jp.addToJoin(1);
				ns.languages.onsuccess(new lc.async.Callback(ns, function() {
					if (langs == null) langs = this.languages.slice();
					else for (var ji = 0; j < langs.length; ++j)
						if (this.languages.indexOf(langs[j]) < 0) {
							langs.splice(j,1);
							j--;
						}
					jp.join();
				}));
			}
		}
		jp.start();
		jp.onsuccess(function() { if (langs === null) langs = []; result.success(langs); });
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
		else
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
		this.languages = lc.http.get(this.url + '.languages')
			.onsuccess(new lc.async.Callback(this, function(content) {
				lc.log.debug("lc.locale", "Languages loaded for namespace " + this.name);
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
		this._content = lc.http.get(this.url + '.' + lc.locale._lang)
			.onsuccess(new lc.async.Callback(this, function(content) {
				this._content = this._parse(content);
				lc.log.debug("lc.locale", "Namespace " + this.name + " loaded for language " + lc.locale._lang + ": " + this._content.length + " localized strings");
			}));
	},
	
	getStringAsync: function(key, params) {
		var result = new lc.async.Future();
		if (!Array.isArray(this.languages))
			this.languages.onsuccess(new lc.async.Callback(this, function() { this._getStringAsync(result, key, params); }));
		else
			this._getStringAsync(result, key, params);
		return result;
	},
	
	_getStringAsync: function(result, key, params) {
		if (!Array.isArray(this._content))
			this._content.onsuccess(new lc.async.Callback(this, function() { this._getStringAsync2(result, key, params); }));
		else
			this._getStringAsync2(result, key, params);
	},

	_getStringAsync2: function(result, key, params) {
		result.success(this.getStringSync(key, params));
	},
	
	getStringSync: function(key, params) {
		var lkey = key.toLowerCase();
		for (var i = 0; i < this._content.length; ++i) {
			if (this._content[i].key == lkey)
				return this._resolve(key, this._content[i].value, params);
		}
		return "[unknown locale key '" + key + "' in namespace '" + this.name + "']";
	},
	
	_resolve: function(givenKey, value, params) {
		// TODO
		return value;
	},
	
	_parse: function(content) {
		var lines = content.split(/\n/g);
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
				key: s.substring(0, sep).trim().toLowerCase(),
				value: s.substring(sep + 1).trim()
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
		if (element.nodeType == 1) {
			// element
			if (element.nodeName == "LC-LOCALE") {
				var ns = element.getAttribute("namespace");
				var key = element.getAttribute("key");
				var text = lc.locale.textNode(ns, key);
				element.parentNode.insertBefore(document.createComment("lc-locale namespace="+ns+" key="+key), element);
				element.parentNode.insertBefore(text, element);
				lc.html.remove(element);
				elementStatus.stop();
				return;
			}
		}
	}, 10);
	
});
/**
 * @namespace lc.log
 * Logging utilities with log formatters.
 * TODO describe more
 */
lc.core.namespace("lc.log", {
	
	/**
	 * @namespace lc.log.Levels
	 * Logging levels enumeration.
	 */
	Levels: {
		/** number Most verbose level. */
		TRACE: 0,
		/** number Debugging information. */
		DEBUG: 1,
		/** number Information. */
		INFO: 2,
		/** number Warning. */
		WARN: 3,
		/** number Error. */
		ERROR: 4
	},
	
	/**
	 * @namespace lc.log.formatters
	 * Log formatters.
	 */
	formatters: {
		_registry: {},
		
		register: function(name, classname) {
			lc.log.formatters._registry[name] = classname;
		},
		
		create: function(name, argument) {
			if (typeof lc.log.formatters._registry[name] === 'undefined')
				throw "Unknown log formatter: " + name;
			return new Function("argument", "return new " + lc.log.formatters._registry[name] + "(argument)")(argument);
		}
	},
	
	_formatComponents: [],
	_defaultLevel: 2,
	_loggerLevel: {},
	
	/**
	 * Configure the format of log lines.
	 * TODO explain format
	 * @param format string format specification
	 */
	setFormat: function(format) {
		var components = [];
		var pos = 0;
		while (pos < format.length) {
			var i = format.indexOf("${", pos);
			if (i >= 0) {
				var j = format.indexOf("}", i + 2);
				if (j > 0) {
					if (i > pos)
						components.push(new lc.log.formatters.String(format.substring(pos, i)));
					pos = j + 1;
					var s = format.substring(i + 2, j);
					var argument = null;
					i = s.indexOf(':');
					if (i > 0) {
						argument = s.substring(i + 1);
						s = s.substring(0, i);
					}
					components.push(lc.log.formatters.create(s, argument));
					continue;
				}
			}
			components.push(new lc.log.formatters.String(format.substring(pos)));
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
	
	log: function(logger, level, message, exception) {
		if (exception && exception.stack)
			message = message + "\r\n" + exception.stack;
		else if (message && message.stack)
			message = "" + message + "\r\n" + message.stack;
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
	
	trace: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.TRACE, message, exception);
	},
	
	debug: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.DEBUG, message, exception);
	},
	
	info: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.INFO, message, exception);
	},
	
	warn: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.WARN, message, exception);
	},
	
	error: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.ERROR, message, exception);
	},
	
	fitStringSize: function(s, size) {
		if (size > 0) {
			if (s.length > size) {
				var half = Math.floor((size - 3) / 2);
				s = s.substring(0, half) + "..." + s.substring(s.length - (size - 3 - half));
			}
			while (s.length < size) s = s + ' ';
		}
		return s;
	}
	
});

/**
 * @class lc.log.formatters.Formatter
 * Abstract class for a log formatter.
 * The method format must be implemented.
 * It is not necessary to call the constructor of this abstract class as it is empty.
 */
lc.core.createClass("lc.log.formatters.Formatter", function() {}, {
	format: function(logger, level, message) {
		throw "Method lc.log.formatters.Formatter.format(logger, level, message) must be implemented on " + lc.core.typeOf(this);
	}
});

/**
 * @class lc.log.formatters.String
 * Default formatter that just prints a string.
 * @extends lc.log.formatters.Formatter
 */
lc.core.extendClass("lc.log.formatters.String", lc.log.formatters.Formatter, function(str) {
	this.string = str;
}, {
	format: function(logger, level, message) {
		return this.string;
	}
});

lc.core.extendClass("lc.log.formatters.Time", lc.log.formatters.Formatter, function() {
}, {
	format: function(logger, level, message) {
		return new Date().toLocaleTimeString();
	}
});
lc.log.formatters.register("time", "lc.log.formatters.Time");

lc.core.extendClass("lc.log.formatters.DateTime", lc.log.formatters.Formatter, function() {
}, {
	format: function(logger, level, message) {
		return new Date().toLocaleString();
	}
});
lc.log.formatters.register("datetime", "lc.log.formatters.DateTime");

lc.core.extendClass("lc.log.formatters.Level", lc.log.formatters.Formatter, function(size) {
	size = parseInt(size);
	this.size = size <= 0 ? 5 : size;
}, {
	format: function(logger, level, message) {
		var s = "";
		for (var name in lc.log.Levels)
			if (lc.log.Levels[name] == level) {
				s = name;
				break;
			}
		return lc.log.fitStringSize(s, this.size);
	}
});
lc.log.formatters.register("level", "lc.log.formatters.Level");

lc.core.extendClass("lc.log.formatters.Logger", lc.log.formatters.Formatter, function(size) {
	size = parseInt(size);
	this.size = size;
}, {
	format: function(logger, level, message) {
		return lc.log.fitStringSize(logger, this.size);
	}
});
lc.log.formatters.register("logger", "lc.log.formatters.Logger");

lc.core.extendClass("lc.log.formatters.Message", lc.log.formatters.Formatter, function(size) {
	size = parseInt(size);
	this.size = size;
}, {
	format: function(logger, level, message) {
		return lc.log.fitStringSize("" + message, this.size);
	}
});
lc.log.formatters.register("message", "lc.log.formatters.Message");

lc.log.setFormat("${time} ${level} ${logger:20} ${message}");
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
		lc.app.pending(cache.future);
		css.onload = function() {
			lc.log.debug("lc.resources", "CSS loaded: "+us);
			cache.future.success(css);
		};
		css.onerror = function() {
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
		lc.app.pending(js.future);
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
		var get = lc.http.get(url);
		cache = { future: get };
		lc.resources._default_cache.set(us, cache);
		return get;
	}
	
});
/**
 * @class lc.URL
 * Represents an URL decomposed into protocol, host, port, path, hash and params.
 */
lc.core.createClass("lc.URL",
/**
 * @constructor Parse the given string
 * @param s string|lc.URL the URL to parse (if a string) or to copy (if already an instance of lc.URL)
 */
function(s) {
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
		this.protocol = s.substr(0, i).toLowerCase();
		s = s.substr(i+3);
		i = s.indexOf("/");
		this.host = s.substr(0,i);
		s = s.substr(i);
		i = this.host.indexOf(":");
		if (i > 0) {
			this.port = this.host.substr(i+1);
			this.host = this.host.substr(0,i);
		} else
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
		this.hash = s.substr(i+1);
		s = s.substr(0,i);
	}
	i = s.indexOf('?');
	this.params = new Object();
	if (i > 0) {
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
	/** string the protocol of the URL (i.e. http) */
	protocol: null,
	/** string the hostname (i.e. www.google.com) */
	host: null,
	/** number the port number (i.e. 80) */
	port: null,
	/** string the path of the resource pointed by this URL */
	path: null,
	/** string the anchor */
	hash: null,
	/** Object the parameters of the URL (i.e. path?param1=value1&param2=value2 will create an object with 2 attributes) */
	params: null,
	
	/** Returns a string from this URL.
	 * @returns string the URL as a string
	 */
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
	},
	
	isAncestorOf: function(ancestor, element) {
		if (ancestor === element) return false;
		while (element.parentNode && element.parentNode != element) {
			if (ancestor === element.parentNode)
				return true;
			element = element.parentNode;
		}
		return false;
	}

});
// footer javascript: after all other javascript files of this library

//trigger processing of page once the application is loaded
lc.app.onLoaded(function() {
	lc.log.trace("lc.html.processor", "Processing body at application startup");
	lc.html.processor.process(document.body, function() {
		lc.layout.triggerChange(document.body);
	});
});

lc.core._loaded = true;
lc.app.newDefinitionsAvailable();
//# sourceMappingURL=lc-core.js.map