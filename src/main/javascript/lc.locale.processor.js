lc.app.onDefined(["lc.html.processor", "lc.locale"], function() {
	
	lc.html.processor.addPreProcessor(function(element, elementStatus, globalStatus) {
		if (element.nodeType == 1) {
			// element
			if (element.nodeName == "LC-LOCALE") {
				var ns = element.getAttribute("namespace");
				var key = element.getAttribute("key");
				var text = lc.locale.textNode(ns, key);
				element.parentNode.insertBefore(document.createComment("lc-locale namespace="+ns+" key="+key), element);
				element.parentNode.insertBefore(text, element);
				lc.html.remove(element);
				elementStatus.stop();
				return;
			}
		}
	}, 10);
	
});