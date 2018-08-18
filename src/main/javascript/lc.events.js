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