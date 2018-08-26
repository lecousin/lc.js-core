/**
 * @class lc.Extendable
 * This class is made to be extended by other classes, to add support of extensions (or plug-ins).<br/>
 * Extensions can be added programmatically, or automatically detected throught the lc.Extension declared in the lc.Extension.Registry.
 */
lc.core.createClass("lc.Extendable", function() {
	if (this.extensions !== null) return; // already initialized
	this.extensions = [];
	lc.Extension.Registry.detect(this);
	this.extensions.sort(function(f1,f2) { return f2.priority - f1.priority; });
}, {
	extensions: null,
	
	addExtension: function(extension) {
		if (this.getExtension(extension) != null) return;
		extension = new extension();
		this.extensions.push(extension);
		extension.init(this);
		this.extensionAdded(extension);
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
		if (found)
			extension.destroy(this);
	},
	
	getExtension: function(extension) {
		for (var i = 0; i < this.extensions.length; ++i)
			if (lc.core.instanceOf(this.extensions[i], extension))
				return this.extensions[i];
		return null;
	},
	
	callExtensions: function(method) {
		if (!this.extensions) return; // destroyed
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < this.extensions.length; ++i)
			if (typeof this.extensions[i][method] === 'function') {
				this.extensions[i][method].apply(this.extensions[i], args);
				// an extension may cause the destruction
				if (!this.extensions) return;
			}
	},
	
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
		this._extensions.push({extended: extended, extension: extension});
	},
	
	detect: function(obj) {
		for (var i = 0; i < this._extensions.length; ++i)
			if (lc.core.instanceOf(obj, this._extensions[i].extended))
				if (this._extensions[i].extension.prototype.detect(obj))
					obj.addExtension(this._extensions[i].extension);
	}
};