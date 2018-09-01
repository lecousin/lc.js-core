lc.core.namespace("lc.app", {
	
	_expectedExpressions: {},
	_applicationListeners: [],
	
	onDefined: function(expression, listener) {
		var value = undefined;
		try { value = eval("("+expression+")"); }
		catch (e) {}
		if (typeof value != 'undefined' && lc.core._loaded) {
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
				var value = eval("("+expression+")");
				if (typeof value != 'undefined') {
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