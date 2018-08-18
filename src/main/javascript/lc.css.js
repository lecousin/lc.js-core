lc.core.namespace("lc.css", {
	
	hasClass: function(element, name) {
		var names = element.className.split(" ");
		return names.contains(name);
	},
	
	addClass: function(element, name) {
		if (element.className == "") { element.className = name; return; }
		var names = element.className.split(" ");
		if (names.contains(name)) return;
		element.className += " "+name;
	},
	
	removeClass: function(element, name) {
		if (element.className == "") return;
		if (element.className == name) { element.className = ""; return; }
		var names = element.className.split(" ");
		if (!names.contains(name)) return;
		names.remove(name);
		element.className = names.join(" ");
	},
	
	getClasses: function(element) {
		return element.className.split(" ");
	}

});