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
			delete this_values[name];
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
