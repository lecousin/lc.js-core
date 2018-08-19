if (typeof lc === 'undefined') lc = {};

lc.core = {
	
	// namespace creation
	namespace: function(name, content) {
		var names = name.split(".");
		var parent = window;
		for (var i = 0; i < names.length; ++i) {
			if (typeof parent[names[i]] === 'undefined') parent[names[i]] = {};
			parent = parent[names[i]];
		}
		return lc.core.merge(parent, content);
	},
	
	// object manipulation
	
	merge: function(target, source) {
		for (var name in source)
			target[name] = source[name];
		return target;
	},
	
	// classes
	
	createClass: function(name, ctor, proto) {
		var names = name.split(".");
		var ns = window;
		for (var i = 0; i < names.length - 1; ++i) {
			if (typeof ns[names[i]] === 'undefined') ns[names[i]] = {};
			ns = ns[names[i]];
		}
		var cname = names[names.length - 1];
		ns[cname] = ctor;
		ns[cname].prototype = proto;
		ns[cname].prototype.constructor = ctor;
		ns[cname]._lcClass = name;
		ns[cname]._lcExtends = [];
		return parent[cname];
	},
	
	extendClass: function(name, parents, ctor, proto) {
		var names = name.split(".");
		var ns = window;
		for (var i = 0; i < names.length - 1; ++i) {
			if (typeof ns[names[i]] === 'undefined') ns[names[i]] = {};
			ns = ns[names[i]];
		}
		var cname = names[names.length - 1];
		ns[cname] = ctor;
		ns[cname]._lcClass = name;
		ns[cname]._lcExtends = [];
		
		if (!Array.isArray(parents))
			parents = [parents];

		var p = {};
		for (var i = 0; i < parents.length; ++i) {
			lc.core.merge(p, parents[i].prototype);
			if (ns[cname]._lcExtends.indexOf(parents[i]) < 0)
				ns[cname]._lcExtends.push(parents[i]._lcClass);
			if (parents[i]._lcExtends)
				for (var j = 0; j < parents[i]._lcExtends.length; ++j)
					if (ns[cname]._lcExtends.indexOf(parents[i]._lcExtends[j]) < 0)
						ns[cname]._lcExtends.push(parents[i]._lcExtends[j]);
		}
		ns[cname].prototype = lc.core.merge(proto, p);
		ns[cname].prototype.constructor = ctor;
		return ns[cname];
	},
	
	instanceOf: function(obj, clazz) {
		if (typeof clazz === 'string') clazz = window[clazz];
		if (obj instanceof clazz) return true;
		if (!obj.constructor._lcExtends) return false;
		for (var i = 0; i < obj.constructor._lcExtends.length; ++i)
			if (window[obj.constructor._lcExtends[i]] == clazz || lc.core.isExtending(obj.constructor._lcExtends[i], clazz))
				return true;
		return false;
	},
	
	isExtending: function(clazz, searchedClass) {
		if (typeof clazz === 'string') clazz = window[clazz];
		if (typeof searchedClass === 'string') searchedClass = window[searchedClass];
		if (!clazz._lcExtends) return false;
		for (var i = 0; i < clazz._lcExtends.length; ++i)
			if (window[clazz._lcExtends[i]] == searchedClass || lc.isExtending(clazz._lcExtends[i], searchedClass))
				return true;
		return false;
	},
	
	typeOf: function(obj) {
		if (obj === null) return "null";
		if (typeof obj != 'object') return typeof obj;
		if (obj.constructor._lcClass) return obj.constructor._lcClass;
		var ctor = obj.constructor;
		if (ctor) {
			if (ctor.name)
				return ctor.name;
			if (ctor.displayName)
				return ctor.displayName;
		}
		return "[unknown]";
	},
	
	// Id generator

	_idCounter: 0,
	
	generateId: function() {
		return "id"+(++lc.core._idCounter);
	},
	
	// Script url

	getMyURL: function() {
		// Get the stack trace
		var stackLines;
		try { toto.tutu(); }
		catch (e) {
		    stackLines = e.stack.split('\n');
		}
	    // search the interesting line
	    var firstUrl = true;
	    for(var i = 0; i < stackLines.length; ++i) {
	      if (!stackLines[i].match(/http[s]?:\/\//)) continue;
	      if (firstUrl) { firstUrl = false; continue; }
	      // parse the string for each section we want
	      var pathParts = stackLines[i].match(/((http[s]?:\/\/.+\/)([^\/]+\.js)):/);
	      return new lc.URL(pathParts[1]);
	    }
	    return null;
	}
		
};