lc.core.namespace("lc.app", {
	
	_expectedExpressions: [],
	_applicationListeners: [],
	
	onDefined: function(expressions, listener) {
		if (!Array.isArray(expressions)) expressions = [expressions];
		if (lc.app._isDefined(expressions)) {
			lc.async.Callback.callListeners(listener);
			return;
		}
		lc.app._expectedExpressions.push({expressions: expressions, listener: listener});
		if (lc.log && lc.log.trace("lc.app")) lc.log.trace("lc.app", "New waited expressions: " + expressions.length);
	},
	
	_isDefined: function(expressions) {
		if (!lc.core._loaded) return false;
		for (var i = 0; i < expressions.length; ++i) {
			var value = undefined;
			try { value = eval("(" + expressions[i] + ")"); }
			catch (e) {}
			if (typeof value === 'undefined')
				return false;
		}
		return true;
	},
	
	newDefinitionsAvailable: function() {
		if (lc.app._expectedExpressions.length == 0) return;
		if (lc.log && lc.log.trace("lc.app")) lc.log.trace("lc.app", "newDefinitionsAvailable: waiting = " + lc.app._expectedExpressions.length);
		var nb;
		do {
			nb = lc.app._expectedExpressions.length;
			for (var i = 0; i < lc.app._expectedExpressions.length; ++i) {
				if (lc.app._isDefined(lc.app._expectedExpressions[i].expressions)) {
					lc.async.Callback.callListeners(lc.app._expectedExpressions[i].listener);
					lc.app._expectedExpressions.splice(i, 1);
					i--;
				}
			}
		} while (nb > 0 && lc.app._expectedExpressions.length != nb);
		if (lc.log && lc.log.trace("lc.app")) lc.log.trace("lc.app", "Still waiting for expressions: " + lc.app._expectedExpressions.length);
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
		for (var i = 0; i < lc.app._expectedExpressions.length; ++i) {
			lc.log.warn("lc.app", "Application loaded but still waiting for: " + lc.app._expectedExpressions[i].expressions);
		}
		lc.log.debug("lc.app", "Application loaded.");
	},
	
	_pending: [],
	_futureListeners: [],
	
	pending: function(future) {
		lc.app._pending.push(future);
		if (lc.app._pending.length == 1)
			lc.app._working();
		future.ondone(function() {
			lc.app._pending.remove(future);
			if (lc.app._pending.length == 0)
				lc.app._idle();
		});
		lc.async.Callback.callListeners(lc.app._futureListeners, [future]);
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
	},
	
	addAsynchronousOperationListener: function(listener) {
		lc.app._futureListeners.push(listener);
	},
	
	removeAsynchronousOperationListener: function(listener) {
		lc.app._futureListeners.remove(listener);
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