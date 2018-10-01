if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(search, pos) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}


Array.prototype.contains=function(e){return this.indexOf(e) != -1;};
Array.prototype.remove=function(e){for(var i=0;i<this.length;++i)if(this[i]==e){this.splice(i,1);i--;};};
Array.prototype.removeUnique=function(e){var i=this.indexOf(e);if(i>=0)this.splice(i,1);};
Array.prototype.isSame = function(a) {
	if (!Array.isArray(a)) return false;
	if (this.length != a.length) return false;
	for (var i = 0; i < this.length; ++i)
		if (this[i] !== a[i])
			return false;
	return true;
};
Array.prototype.clear = function() { if (this.length > 0) this.splice(0,this.length); };
Array.prototype.removeElements = function(toRemove) {
	for (var i = 0; i < this.length; ++i) {
		if (toRemove.contains(this[i])) {
			this.splice(i,1);
			i--;
		}
	}
};
Array.prototype.pushAll = function(elements) {
	Array.prototype.push.apply(this, elements);
};