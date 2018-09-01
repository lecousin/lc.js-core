lc.core.namespace("lc.context", {
	
	get: function(element) {
		if (typeof element["_lc_context"] === 'undefined')
			return undefined;
		return element._lc_context;
	},
	
	getOrCreate: function(element) {
		if (typeof element["_lc_context"] === 'undefined')
			element._lc_context = {};
		return element._lc_context;
	},
	
	getAttribute: function(element, attributeName, defaultValue) {
		var ctx = lc.context.get(element);
		if (!ctx) return defaultValue;
		if (typeof ctx[attributeName] === 'undefined') return defaultValue;
		return ctx[attributeName];
	},
	
	setAttribute: function(element, attributeName, value) {
		var ctx = lc.context.getOrCreate(element);
		ctx[attributeName] = value;
	},
	
	removeAttribute: function(element, attributeName) {
		var ctx = lc.context.get(element);
		if (!ctx) return undefined;
		if (typeof ctx[attributeName] === 'undefined') return undefined;
		var value = ctx[attributeName];
		delete ctx[attributeName];
		return value;
	}
	
});