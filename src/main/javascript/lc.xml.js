lc.core.namespace("lc.xml", {
	
	getChildElementsByName: function(element, childName) {
		childName = childName.toUpperCase();
		var list = [];
		for (var i = 0; i < element.childNodes.length; ++i)
			if (element.childNodes[i].nodeType == 1 && element.childNodes[i].nodeName == childName)
				list.push(element.childNodes[i]);
		return list;
	},
	
	getChildByName: function(element, childName) {
		childName = childName.toUpperCase();
		for (var i = 0; i < element.childNodes.length; ++i)
			if (element.childNodes[i].nodeType == 1 && element.childNodes[i].nodeName == childName)
				return element.childNodes[i];
		return null;
	}

});