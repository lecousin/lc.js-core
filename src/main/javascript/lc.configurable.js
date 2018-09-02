lc.core.createClass("lc.Configurable",
	function(properties) {
		if (!properties) properties = {};
		for (var n in properties) {
			var p = properties[n];
			var descr = {
				enumerable: true
			};
			
			if (p.get) descr.get = new Function("return this.configurableProperties[\"" + n + "\"].get.call(this, this.configurableProperties);");
			else descr.get = new Function("return this.configurableProperties[\"" + n + "\"].value;");
			
			if (p.set) descr.set = new Function("value", "return this.configurableProperties[\"" + n + "\"].set.call(this, value, this.configurableProperties);");
			else descr.set = new Function("value", "return this.configurableProperties[\"" + n + "\"].value = value;");
			
			if (typeof p["writable"] !== 'undefined') descr.writable = p.writable;
			
			Object.defineProperty(this, n, descr);
		}
		this.configurableProperties = properties;
	}, {
		
		configurableProperties: {}
		
	}
);