/**
 * @class lc.Extendable
 * This class is made to be extended by other classes, to add support of extensions (or plug-ins).<br/>
 * Extensions can be added programmatically, or automatically detected throught the lc.Extension declared in the lc.Extension.Registry.
 */
lc.core.createClass("lc.Extendable", function() {
	if (this.extensions !== null) return; // already initialized
	this.extensions = [];
	this._overrides = {};
	lc.Extension.Registry.detect(this);
	this.extensions.sort(function(f1,f2) { return f2.priority - f1.priority; });
}, {
	extensions: null,
	
	addExtension: function(extension) {
		if (this.getExtension(extension) != null) return;
		try {
			extension = new extension();
		} catch (error) {
			lc.log.error("lc.Extendable", "Error instantiating extension " + extension + ": " + error, error);
			return;
		}
		this.extensions.push(extension);
		try {
			extension.init(this);
		} catch (error) {
			lc.log.error("lc.Extendable", "Error initializing extension " + lc.core.typeOf(extension) + ": " + error, error);
		}
		this.extensionAdded(extension);
		return extension;
	},
	
	extensionAdded: function(extension) {},
	
	removeExtension: function(extension) {
		var found = false;
		if (typeof extension === 'function') {
			for (var i = 0; i < this.extensions.length; ++i)
				if (lc.core.instanceOf(this.extensions[i], extension)) {
					extension = this.extensions[i];
					this.extensions.splice(i,1);
					found = true;
					break;
				}
		} else {
			for (var i = 0; i < this.extensions.length; ++i)
				if (this.extensions[i] == extension) {
					this.extensions.splice(i,1);
					found = true;
					break;
				}
		}
		if (found) {
			for (var n in this._overrides) {
				var list = this._overrides[n];
				for (var i = 1; i < list.length; ++i) {
					if (list[i].extension === extension) {
						if (list[i].impl) {
							list.splice(i, 1);
							if (list.length == 1) {
								// last one
								this[n] = list[0].impl;
								delete this._overrides[n];
								break;
							}
						} else {
							// TODO property
						}
					}
				}
			}
			extension.destroy(this);
		}
	},
	
	getExtension: function(extension) {
		for (var i = 0; i < this.extensions.length; ++i)
			if (lc.core.instanceOf(this.extensions[i], extension))
				return this.extensions[i];
		return null;
	},
	
	hasExtension: function(extension) {
		return this.getExtension(extension) != null;
	},
	
	callExtensions: function(method) {
		if (!this.extensions) return; // destroyed
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < this.extensions.length; ++i)
			if (typeof this.extensions[i][method] === 'function') {
				try {
					this.extensions[i][method].apply(this.extensions[i], args);
					// an extension may cause the destruction
					if (!this.extensions) return;
				} catch (error) {
					lc.log.error("lc.Extandable", "Error calling method " + method + " on extension " + lc.core.typeOf(this.extensions[i]) + ": " + error, error);
				}
			}
	},
	
	extensionOverridesMethod: function(extension, methodName, newImplementation) {
		if (typeof this._overrides[methodName] === 'undefined') {
			this._overrides[methodName] = [{
				extension: null,
				impl: this[methodName]
			}];
			this[methodName] = function() {
				return this._callOverriddenMethod(methodName, arguments);
			};
		}
		this._overrides[methodName].push({
			extension: extension,
			impl: newImplementation
		});
	},
	_callOverriddenMethod: function(methodName, args) {
		var list = this._overrides[methodName];
		return list[list.length - 1].impl.apply(this, args);
	},
	callPreviousImplementation: function(extension, methodName, args) {
		var list = this._overrides[methodName];
		var i = list.length - 1;
		while (i >= 0 && list[i].extension != extension) i--;
		if (i <= 0) return;
		return list[i - 1].impl.apply(this, args);
	},
	// TODO extensionOverridesProperty
	
	destroy: function() {
		if (!this.extensions) return;
		for (var i = 0; i < this.extensions.length; ++i)
			this.extensions[i].destroy(this);
		this.extensions = null;
	}
});

lc.core.createClass("lc.Extension", function() {
}, {
	priority: 0,
	detect: function(obj) {},
	init: function(extendable) {},
	destroy: function(extendable) {}
});

lc.Extension.Registry = {
	_extensions: [],
	
	register: function(extended, extension) {
		if (lc.log.trace("lc.Extension"))
			lc.log.trace("lc.Extension", "Extension registered: " + lc.core.className(extension) + " extending " + lc.core.className(extended));
		this._extensions.push({extended: extended, extension: extension});
	},
	
	detect: function(obj) {
		for (var i = 0; i < this._extensions.length; ++i)
			if (lc.core.instanceOf(obj, this._extensions[i].extended))
				if (this._extensions[i].extension.prototype.detect(obj))
					obj.addExtension(this._extensions[i].extension);
	},
	
	getAvailableFor: function(extended) {
		var list = [];
		for (var i = 0; i < this._extensions.length; ++i)
			if (this._extensions[i].extended === extended || lc.core.isExtending(extended, this._extensions[i].extended))
				list.push(this._extensions[i].extension);
		return list;
	}
};