// Handle layout change

lc.core.createClass("lc.layout.Handler", function(element) {
	element._lc_layout_handler = this;
	this._listeners = [];
	this._refreshValues(element);
}, {
	
	_refreshValues: function(element) {
		this._clientWidth = element.clientWidth;
		this._clientHeight = element.clientHeight;
		this._offsetWidth = element.offsetWidth;
		this._offsetHeight = element.offsetHeight;
		this._scrollWidth = element.scrollWidth;
		this._scrollHeight = element.scrollHeight;
	},
	
	_check: function(element) {
		if (element.clientWidth != this._clientWidth ||
			element.clientHeight != this._clientHeight ||
			element.offsetWidth != this._offsetWidth ||
			element.offsetHeight != this._offsetHeight ||
			element.scrollWidth != this._scrollWidth ||
			element.scrollHeight != this._scrollHeight
			) {
			lc.async.Callback.callListeners(this._listeners);
			this._refreshValues(element);
		}
	}
	
});

lc.layout.onChange = function(element, listener) {
	if (!element._lc_layout_handler)
		new lc.layout.Handler(element);
	element._lc_layout_handler._listeners.push(listener);
};

lc.layout.triggerChange = function(element) {
	if (element._lc_layout_handler)
		element._lc_layout_handler._check(element);
	for (var i = 0; i < element.childNodes.length; ++i) {
		if (element.childNodes[i].nodeType != 1) continue;
		lc.layout.triggerChange(element.childNodes[i]);
	}
};

window.addEventListener("resize", function() {
	lc.layout.triggerChange(document.body);
});

lc.layout.getAbsolutePosition = function(element) {
	var pos = { x : element.offsetLeft, y : element.offsetTop };
	while (element.offsetParent != document.body) {
		element = element.offsetParent;
		pos.x -= element.scrollLeft;
		pos.y -= element.scrollTop;
		pos.x += element.offsetLeft;
		pos.y += element.offsetTop;
	}
	return pos;
};

