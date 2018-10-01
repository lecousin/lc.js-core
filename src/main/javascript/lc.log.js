/**
 * @namespace lc.log
 * Logging utilities with log formatters.
 * TODO describe more
 */
lc.core.namespace("lc.log", {
	
	/**
	 * @namespace lc.log.Levels
	 * Logging levels enumeration.
	 */
	Levels: {
		/** number Most verbose level. */
		TRACE: 0,
		/** number Debugging information. */
		DEBUG: 1,
		/** number Information. */
		INFO: 2,
		/** number Warning. */
		WARN: 3,
		/** number Error. */
		ERROR: 4
	},
	
	/**
	 * @namespace lc.log.formatters
	 * Log formatters.
	 */
	formatters: {
		_registry: {},
		
		register: function(name, classname) {
			lc.log.formatters._registry[name] = classname;
		},
		
		create: function(name, argument) {
			if (typeof lc.log.formatters._registry[name] === 'undefined')
				throw "Unknown log formatter: " + name;
			return new Function("argument", "return new " + lc.log.formatters._registry[name] + "(argument)")(argument);
		}
	},
	
	_formatComponents: [],
	_defaultLevel: 2,
	_loggerLevel: {},
	
	/**
	 * Configure the format of log lines.
	 * TODO explain format
	 * @param format string format specification
	 */
	setFormat: function(format) {
		var components = [];
		var pos = 0;
		while (pos < format.length) {
			var i = format.indexOf("${", pos);
			if (i >= 0) {
				var j = format.indexOf("}", i + 2);
				if (j > 0) {
					if (i > pos)
						components.push(new lc.log.formatters.String(format.substring(pos, i)));
					pos = j + 1;
					var s = format.substring(i + 2, j);
					var argument = null;
					i = s.indexOf(':');
					if (i > 0) {
						argument = s.substring(i + 1);
						s = s.substring(0, i);
					}
					components.push(lc.log.formatters.create(s, argument));
					continue;
				}
			}
			components.push(new lc.log.formatters.String(format.substring(pos)));
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
	
	log: function(logger, level, message, exception) {
		if (exception && exception.stack)
			message = message + "\r\n" + exception.stack;
		else if (message && message.stack)
			message = "" + message + "\r\n" + message.stack;
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
	
	trace: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.TRACE, message, exception);
	},
	
	debug: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.DEBUG, message, exception);
	},
	
	info: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.INFO, message, exception);
	},
	
	warn: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.WARN, message, exception);
	},
	
	error: function(logger, message, exception) {
		return lc.log.log(logger, lc.log.Levels.ERROR, message, exception);
	},
	
	fitStringSize: function(s, size) {
		if (size > 0) {
			if (s.length > size) {
				var half = Math.floor((size - 3) / 2);
				s = s.substring(0, half) + "..." + s.substring(s.length - (size - 3 - half));
			}
			while (s.length < size) s = s + ' ';
		}
		return s;
	}
	
});

/**
 * @class lc.log.formatters.Formatter
 * Abstract class for a log formatter.
 * The method format must be implemented.
 * It is not necessary to call the constructor of this abstract class as it is empty.
 */
lc.core.createClass("lc.log.formatters.Formatter", function() {}, {
	format: function(logger, level, message) {
		throw "Method lc.log.formatters.Formatter.format(logger, level, message) must be implemented on " + lc.core.typeOf(this);
	}
});

/**
 * @class lc.log.formatters.String
 * Default formatter that just prints a string.
 * @extends lc.log.formatters.Formatter
 */
lc.core.extendClass("lc.log.formatters.String", lc.log.formatters.Formatter, function(str) {
	this.string = str;
}, {
	format: function(logger, level, message) {
		return this.string;
	}
});

lc.core.extendClass("lc.log.formatters.Time", lc.log.formatters.Formatter, function() {
}, {
	format: function(logger, level, message) {
		var date = new Date();
		return (""+date.getFullYear()).padStart(4, "0") + "-" +
			(""+(date.getMonth() + 1)).padStart(2, "0") + "-" +
			(""+date.getDate()).padStart(2, "0") + " " +
			(""+date.getHours()).padStart(2, "0") + ":" +
			(""+date.getMinutes()).padStart(2, "0") + ":" +
			(""+date.getSeconds()).padStart(2, "0") + "." +
			(""+date.getMilliseconds()).padStart(3, "0");
	}
});
lc.log.formatters.register("time", "lc.log.formatters.Time");

lc.core.extendClass("lc.log.formatters.DateTime", lc.log.formatters.Formatter, function() {
}, {
	format: function(logger, level, message) {
		return new Date().toLocaleString();
	}
});
lc.log.formatters.register("datetime", "lc.log.formatters.DateTime");

lc.core.extendClass("lc.log.formatters.Level", lc.log.formatters.Formatter, function(size) {
	size = parseInt(size);
	this.size = size <= 0 ? 5 : size;
}, {
	format: function(logger, level, message) {
		var s = "";
		for (var name in lc.log.Levels)
			if (lc.log.Levels[name] == level) {
				s = name;
				break;
			}
		return lc.log.fitStringSize(s, this.size);
	}
});
lc.log.formatters.register("level", "lc.log.formatters.Level");

lc.core.extendClass("lc.log.formatters.Logger", lc.log.formatters.Formatter, function(size) {
	size = parseInt(size);
	this.size = size;
}, {
	format: function(logger, level, message) {
		return lc.log.fitStringSize(logger, this.size);
	}
});
lc.log.formatters.register("logger", "lc.log.formatters.Logger");

lc.core.extendClass("lc.log.formatters.Message", lc.log.formatters.Formatter, function(size) {
	size = parseInt(size);
	this.size = size;
}, {
	format: function(logger, level, message) {
		return lc.log.fitStringSize("" + message, this.size);
	}
});
lc.log.formatters.register("message", "lc.log.formatters.Message");

lc.log.setFormat("${time} ${level} ${logger:20} ${message}");