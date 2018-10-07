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
	
	copy: function(obj) {
		if (Array.isArray(obj)) return obj.slice();
		var o = {};
		for (var n in obj) o[n] = obj[n];
		return o;
	},
	
	copyDeep: function(o) {
		if (Array.isArray(o)) {
			var a = [];
			for (var i = 0; i < o.length; ++i)
				a.push(lc.core.copyDeep(o[i]));
			return a;
		}
		if (typeof o === 'object') {
			var c = {};
			for (var n in o) c[n] = lc.core.copyDeep(o[n]);
			return c;
		}
		return o;
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
		var previous = typeof ns[cname] === 'undefined' ? undefined : ns[cname];
		ns[cname] = ctor;
		ns[cname].prototype = proto;
		ns[cname].prototype.constructor = ctor;
		if (previous) for (var n in previous) ns[cname][n] = previous[n];
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
		var previous = typeof ns[cname] === 'undefined' ? undefined : ns[cname];
		ns[cname] = ctor;
		if (previous) for (var n in previous) ns[cname][n] = previous[n];
		ns[cname]._lcClass = name;
		ns[cname]._lcExtends = [];
		
		if (!Array.isArray(parents))
			parents = [parents];

		var p = {};
		for (var i = 0; i < parents.length; ++i) {
			if (!parents[i]) throw new Error("Undefined extended class (index " + (i) + ") for " + name);
			if (typeof parents[i]._lcClass === 'undefined') throw new Error("Not a valid class to extend: " + parents[i] + " (when defining class " + name + ")");
			lc.core.merge(p, parents[i].prototype);
			if (ns[cname]._lcExtends.indexOf(parents[i]) < 0)
				ns[cname]._lcExtends.push(parents[i]._lcClass);
			if (parents[i]._lcExtends)
				for (var j = 0; j < parents[i]._lcExtends.length; ++j)
					if (ns[cname]._lcExtends.indexOf(parents[i]._lcExtends[j]) < 0)
						ns[cname]._lcExtends.push(parents[i]._lcExtends[j]);
		}
		for (var n in p)
			if (typeof proto[n] === 'undefined')
				proto[n] = p[n];
		ns[cname].prototype = proto;
		ns[cname].prototype.constructor = ctor;
		return ns[cname];
	},
	
	anonymousClass: function(parents, ctor, proto) {
		var clazz = ctor;
		clazz._lcClass = "<anonymous>";
		clazz._lcExtends = [];
		
		if (!Array.isArray(parents))
			parents = [parents];

		var p = {};
		for (var i = 0; i < parents.length; ++i) {
			if (!parents[i]) throw new Error("Undefined extended class (index " + (i) + ")");
			if (typeof parents[i]._lcClass === 'undefined') throw new Error("Not a valid class to extend: " + parents[i]);
			lc.core.merge(p, parents[i].prototype);
			if (clazz._lcExtends.indexOf(parents[i]) < 0)
				clazz._lcExtends.push(parents[i]._lcClass);
			if (parents[i]._lcExtends)
				for (var j = 0; j < parents[i]._lcExtends.length; ++j)
					if (clazz._lcExtends.indexOf(parents[i]._lcExtends[j]) < 0)
						clazz._lcExtends.push(parents[i]._lcExtends[j]);
		}
		for (var n in p)
			if (typeof proto[n] === 'undefined')
				proto[n] = p[n];
		clazz.prototype = proto;
		clazz.prototype.constructor = ctor;
		return clazz;
	},
	
	fromName: function(name) {
		return lc.core._fromName(window, name);
	},
	
	_fromName: function(parent, name) {
		if (typeof parent[name] !== 'undefined')
			return parent[name];
		var pos = 0;
		while (pos < name.length) {
			var i = name.indexOf('.', pos);
			if (i <= 0) return undefined;
			if (typeof parent[name.substring(0, i)] !== 'undefined') {
				var val = lc.core._fromName(parent[name.substring(0, i)], name.substring(i + 1));
				if (val) return val;
			}
			pos = i + 1;
		}
		return undefined;
	},
	
	instanceOf: function(obj, clazz) {
		if (typeof clazz === 'string') clazz = lc.core.fromName(clazz);
		if (obj instanceof clazz) return true;
		if (typeof obj.constructor !== 'function') return false;
		if (typeof obj.constructor._lcExtends === 'undefined') return false;
		for (var i = 0; i < obj.constructor._lcExtends.length; ++i)
			if (lc.core.fromName(obj.constructor._lcExtends[i]) == clazz)
				return true;
		return false;
	},
	
	isExtending: function(clazz, searchedClass) {
		if (typeof clazz === 'string') clazz = lc.core.fromName(clazz);
		if (typeof searchedClass === 'string') searchedClass = lc.core.fromName(searchedClass);
		if (typeof clazz._lcExtends === 'undefined') return false;
		for (var i = 0; i < clazz._lcExtends.length; ++i)
			if (lc.core.fromName(clazz._lcExtends[i]) == searchedClass)
				return true;
		return false;
	},
	
	getExtendedClasses: function(obj) {
		if (typeof obj.constructor !== 'function') return [];
		if (typeof obj.constructor._lcExtends === 'undefined') return [];
		var list = [];
		for (var i = 0; i < obj.constructor._lcExtends.length; ++i)
			list.push(lc.core.fromName(obj.constructor._lcExtends[i]));
		return list;
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
	
	className: function(ctor) {
		return ctor._lcClass;
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