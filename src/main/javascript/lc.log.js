lc.core.namespace("lc.log", {
	
	Levels: {
		TRACE: 0,
		DEBUG: 1,
		INFO: 2,
		WARN: 3,
		ERROR: 4
	},
	
	_formatComponents: [],
	_defaultLevel: 2,
	_loggerLevel: {},
	
	setFormat: function(format) {
		var components = [];
		var pos = 0;
		while (pos < format.length) {
			var i = format.indexOf("${", pos);
			if (i >= 0) {
				var j = format.indexOf("}", i + 2);
				if (j > 0) {
					pos = j + 1;
					var s = format.substring(i + 2, j);
					var size = -1;
					i = s.indexOf(':');
					if (i > 0) {
						s = s.substring(0, i);
						size = parseInt(s.substring(i + 1));
					}
					if (s == "time") {
						components.push(new lc.log.FormatComponentTime());
						continue;
					}
					if (s == "datetime") {
						components.push(new lc.log.FormatComponentDateTime());
						continue;
					}
					if (s == "level") {
						components.push(new lc.log.FormatComponentLevel(size));
						continue;
					}
					if (s == "logger") {
						components.push(new lc.log.FormatComponentLogger(size));
						continue;
					}
					if (s == "message") {
						components.push(new lc.log.FormatComponentMessage(size));
						continue;
					}
				}
				
			}
			components.push(new lc.log.FormatComponentString(format.substr(pos)));
			break;
		}
		lc.log._formatComponents = components;
	},
	
	setDefaultLevel: function(level) {
		lc.log._defaultLevel = level;
	},
	
	setLevel: function(logger, level) {
		if (typeof logger != 'string')
			logger = lc.core.typeOf(logger);
		lc.log._loggerLevel[logger] = level;
	},
	
	log: function(logger, level, message) {
		if (!logger) {
			// default
			if (level < lc.log._defaultLevel)
				return false;
		} else {
			if (typeof logger != 'string')
				logger = lc.core.typeOf(logger);
			if (typeof lc.log._loggerLevel[logger] === 'undefined') {
				// default
				if (level < lc.log._defaultLevel)
					return false;
			} else {
				if (level < lc.log._loggerLevel[logger])
					return false;
			}
		}
		if (!message)
			return true;
		var s = "";
		for (var i = 0; i < lc.log._formatComponents.length; ++i)
			s += lc.log._formatComponents[i].format(logger, level, message);
		if (level == lc.log.Levels.ERROR)
			console.error(s);
		else if (level == lc.log.Levels.WARN)
			console.warn(s);
		else if (level == lc.log.Levels.INFO)
			console.info(s);
		else if (level == lc.log.Levels.DEBUG)
			console.debug(s);
		else
			console.log(s);
	},
	
	trace: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.TRACE, message);
	},
	
	debug: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.DEBUG, message);
	},
	
	info: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.INFO, message);
	},
	
	warn: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.WARN, message);
	},
	
	error: function(logger, message) {
		return lc.log.log(logger, lc.log.Levels.ERROR, message);
	}
	
});

lc.core.createClass("lc.log.FormatComponentString", function(str) {
	this.string = str;
}, {
	format: function(logger, level, message) {
		return string;
	}
});

lc.core.createClass("lc.log.FormatComponentTime", function() {
}, {
	format: function(logger, level, message) {
		return new Date().toLocaleTimeString();
	}
});

lc.core.createClass("lc.log.FormatComponentDateTime", function() {
}, {
	format: function(logger, level, message) {
		return new Date().toLocaleString();
	}
});

lc.core.createClass("lc.log.FormatComponentLevel", function(size) {
	this.size = size <= 0 ? 5 : size;
}, {
	format: function(logger, level, message) {
		var s = "";
		for (var name in lc.log.Levels)
			if (lc.log.Levels[name] == level) {
				s = name;
				break;
			}
		if (s.length > this.size) s = s.substring(0, this.size);
		while (s.length < this.size) s = s + ' ';
		return s;
	}
});

lc.core.createClass("lc.log.FormatComponentLogger", function(size) {
	this.size = size;
}, {
	format: function(logger, level, message) {
		var s = logger;
		if (this.size > 0) {
			if (s.length > this.size) s = s.substring(0, this.size);
			while (s.length < this.size) s = s + ' ';
		}
		return s;
	}
});

lc.core.createClass("lc.log.FormatComponentMessage", function(size) {
	this.size = size;
}, {
	format: function(logger, level, message) {
		var s = "" + message;
		if (this.size > 0) {
			if (s.length > this.size) s = s.substring(0, this.size);
			while (s.length < this.size) s = s + ' ';
		}
		return s;
	}
});

lc.log.setFormat("${time} ${level} ${logger:15} ${message}");