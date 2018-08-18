lc.core.namespace("lc.html", {
	
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