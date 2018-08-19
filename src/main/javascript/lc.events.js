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