lc.core.createClass("lc.Cache", function(itemTimeout, onrelease, checkInterval) {
	this._timeout = itemTimeout;
	this._onrelease = onrelease;
	if (itemTimeout > 0) {
		if (checkInterval <= 0) checkInterval = 30000;
		var that = this;
		this._interval = setInterval(function() { that._checkTimeout(); }, checkInterval);
	}
}, {
	
	_items: new Map(),
	
	set: function(key, item) {
		var previous = this._items.get(key);
		if (previous) {
			if (this._onrelease)
				this._onrelease(key, previous.item);
		}
		this._items.set(key, {
			item: item,
			used: new Date().getTime(),
		});
	},
	
	get: function(key) {
		var value = this._items.get(key);
		if (!value)
			return undefined;
		value.used = new Date().getTime();
		return value.item;
	},
	
	remove: function(key) {
		var value = this._items.get(key);
		if (!value)
			return false;
		if (this._onrelease)
			this._onrelease(key, value.item);
		this._items.delete(key);
		return true;
	},
	
	close: function() {
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
		this._items = null;
	},
	
	_checkTimeout: function() {
		var min = new Date().getTime() - this._timeout;
		var onrelease = this._onrelease;
		this._items.forEach(function(item, key, map) {
			if (item.used < min) {
				if (onrelease)
					onrelease(key, item.item);
				map.delete(key);
			}
		});
	}
	
});