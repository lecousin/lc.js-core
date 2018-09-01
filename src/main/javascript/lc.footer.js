// footer javascript: after all other javascript files of this library

//trigger processing of page once the application is loaded
lc.app.onLoaded(function() {
	lc.log.trace("lc.html.processor", "Processing body at application startup");
	lc.html.processor.process(document.body, function() {
		lc.layout.triggerChange(document.body);
	});
});

lc.core._loaded = true;
lc.app.newDefinitionsAvailable();