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
				throw new Error("Unexpected listener type: " + lc.core.typeOf(listeners[i]));
		} catch (error) {
			lc.log.error("lc.async.Callback", "A listener thrown an exception: " +
				lc.core.instanceOf(listeners[i], lc.async.Callback) ? listeners[i]._fct : listeners[i] +
				": " + error, error);
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
	if (typeof callback === 'function')
		return new lc.async.Callback(window, callback);
	if (lc.core.instanceOf(callback, lc.async.Callback))
		return callback;
	throw new Error("Unexpected type: " + lc.core.typeOf(callback));
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
		if (this._done) throw new Error("Future already done");
		this._result = result;
		this._done = true;
		this._callListeners();
	},
	
	error: function(error) {
		if (this._done) throw new Error("Future already done");
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
	
	forwardTo: function(future) {
		this.onsuccess(function(result) { future.success(result); });
		this.onerror(function(error) { future.error(error); });
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

lc.async.Future.alreadySuccess = function(result) {
	var future = new lc.async.Future();
	future.success(result);
	return future;
};
lc.async.Future.alreadyError = function(error) {
	var future = new lc.async.Future();
	future.error(error);
	return future;
};

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
