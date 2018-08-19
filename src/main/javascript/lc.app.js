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