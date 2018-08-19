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
