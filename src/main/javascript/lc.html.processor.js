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

lc.core.createClass("lc.html.processor.Status", {
	
	interrupt: function() {
		this._state = lc.html.processor.STATE_INTERRUPTED;
	},
	
	stop: function() {
		this._state = lc.html.processor.STATE_STOPPED;
	},
	
	resume: function() {
		this._state = lc.html.processor.STATE_RUNNING;
		this._continueProcessing();
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
			if (e._preprocessors) {
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
			if (e._children) {
				var child = e._children[0];
				e._children.splice(0, 1);
				var childStatus = new lc.html.processor.ElementStatus(child, this);
				this._elements.push(childStatus);
				continue;
			}
			// running - postprocessors
			if (e._postprocessors === undefined)
				e._postprocessors = lc.html.processor._postprocessors.splice();
			if (e._postprocessors) {
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
	
}, function(rootElement) {
	
	this._elements = [new lc.html.processor.ElementStatus(rootElement, this)];
	this.result = new lc.async.Future();
	
});

lc.core.createClass("lc.html.processor.ElementStatus", {
	
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
	
}, function(element, mainStatus) {
	
	this.element = element;
	this._mainStatus = mainStatus;
	this._state = lc.html.processor.STATE_RUNNING;
	this._preprocessors = lc.html.processor._preprocessors.splice();
	this._children = undefined;
	this._postprocessors = undefined;
	this.result = new lc.async.Future();
	
});

lc.events.registerCustomEvent("processed", function(element, listener) {});
