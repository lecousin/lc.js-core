/**
 * @namespace lc.html
 * Utility methods to manipulate HTML.
 */
lc.core.namespace("lc.html", {
	
	/**
	 * Go through the DOM elements (node type 1) starting from the given element, and call the callback on each of its descendent.
	 * If the callback returns true on an element, its children won't be visited.
	 * @param element Element the element to start, the callback is not called on it but on its children and descendents.
	 * @param callback function|lc.async.Callback the callback to call on each element, taking the element as single argument.
	 */
	walkChildren: function(element, callback) {
		for (var i = 0; i < element.childNodes.length; ++i) {
			if (lc.Callback.from(callback).call(element.childNodes[i])) continue;
			if (element.childNodes[i].nodeType == 1)
				lc.html.walkChildren(element.childNodes[i], callback);
		}
	},
	
	create: function(nodeName, attributes) {
		var element = document.createElement(nodeName);
		if (attributes)
			for (var name in attributes)
				element[name] = attributes[name];
		return element;
	},

	remove: function(element) {
		lc.events.destroyed(element);
		if (element.parentNode)
			element.parentNode.removeChild(element);
	},

	empty: function(element) {
		while (element.childNodes.length > 0)
			lc.html.remove(element.childNodes[0]);
	},

	addOption: function(select, value, text) {
		var o = document.createElement("OPTION");
		o.value = value;
		o.text = text;
		select.add(o);
	},

	insertAfter: function(toInsert, after) {
		if (after.nextSibling)
			return after.parentNode.insertBefore(toInsert, after.nextSibling);
		return after.parentNode.appendChild(toInsert);
	},

	escape: function(unsafe) {
	    return unsafe
	         .replace(/&/g, "&amp;")
	         .replace(/</g, "&lt;")
	         .replace(/>/g, "&gt;")
	         .replace(/"/g, "&quot;")
	         .replace(/'/g, "&#039;");
	 }

});