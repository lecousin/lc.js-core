/**
 * @namespace lc.html.processor
 * HTML processing, to automatically modify the page once loaded.
 * <p>
 * A processor is a callback called on each HTML element, giving the opportunity to create, modify or remove some elements on the page.<br/>
 * A typical usage may be to replace a custom tag by a dynamic content.
 * </p>
 * <p>
 * There are 2 kinds of processor: pre-processors, which are called on a element before the descendents of this element,
 * and post-processors, called on a element once all its descendents have been processed.<br/>
 * The difference is that a pre-processor can modify the content of an element, before this content is itself processed,
 * while a post-processor is called after its content has been already processed.
 * </p>
 * <p>
 * The processing can be interrupted or stopped by any processor.<br/>
 * An interruption is typically useful when asynchronous events are necessary for the processing. For exemple an AJAX request to load some part of
 * the content to create.<br/>
 * A stop can be global or for the current element only. On an element, any future processing on this element (and its descendents in case of a pre-processor) is stopped.
 * A global stop will stop any processing on any element.
 * </p>
 * <p>
 * Each processor is associated with a priority, so the processors with higher priority are called first.
 * </p>
 * <p>
 * When processing an element, processors are called with the element, an ElementStatus, and a global Status.<br/>
 * The ElementStatus allows to stop the processing on the current element, to interrupt it, and then to resume it once everything is ready. It has also a Future object
 * allowing to known when the element has been completely processed (all pre-processors executed, all its descendents have been processed, and all post-processors executed).<br/>
 * The global status allows to stop globally the processing, and has also a Future object to known when the full processing have been done, or stopped.
 * </p>
 */
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

lc.core.createClass("lc.html.processor.Status", function(rootElement) {
	
	this._elements = [new lc.html.processor.ElementStatus(rootElement, this)];
	this.result = new lc.async.Future();
	
}, {
	
	stop: function() {
		this._state = lc.html.processor.STATE_STOPPED;
	},
	
	_state: lc.html.processor.STATE_RUNNING,
	
	_continueProcessing: function() {
		if (this.result.isDone()) throw new Error("Processing is already terminated.");
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
			if (e._preprocessors.length > 0) {
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
			if (e._children.length > 0) {
				var child = e._children[0];
				e._children.splice(0, 1);
				var childStatus = new lc.html.processor.ElementStatus(child, this);
				this._elements.push(childStatus);
				continue;
			}
			// running - postprocessors
			if (e._postprocessors === undefined)
				e._postprocessors = lc.html.processor._postprocessors.slice();
			if (e._postprocessors.length > 0) {
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
	
});

lc.core.createClass("lc.html.processor.ElementStatus", function(element, mainStatus) {
	
	this.element = element;
	this._mainStatus = mainStatus;
	this._state = lc.html.processor.STATE_RUNNING;
	this._preprocessors = lc.html.processor._preprocessors.slice();
	this._children = undefined;
	this._postprocessors = undefined;
	this.result = new lc.async.Future();
	
}, {
	
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
	
});

lc.events.registerCustomEvent("processed", function(element, listener) {});
