lc.core.namespace("lc.animation", {
	
	animate: function(element, classStart, classEnd) {
		if (typeof classStart == 'undefined') {
			classStart = "lc-animate-start";
			classEnd = "lc-animate-end";
		}
		var future = new lc.async.Future();
		var started = false, ended = false;
		var onstart, onend;
		onstart = function() {
			started = true;
			element.removeEventListener("transitionstart", onstart);
		};
		onend = function() {
			if (ended) return;
			lc.css.removeClass(element, "lc-animate");
			lc.css.removeClass(element, classEnd);
			element.removeEventListener("transitionend", onend);
			element.removeEventListener("transitioncancel", onend);
			ended = true;
			future.success();
		};
		element.addEventListener("transitionstart", onstart);
		element.addEventListener("transitionend", onend);
		element.addEventListener("transitioncancel", onend);
		lc.css.addClass(element, "lc-animate");
		lc.css.addClass(element, classStart);
		setTimeout(function() {
			// transitionstart event does not work yet
			var s = getComputedStyle(element);
			if (s.transitionProperty) started = true;
			if (!started) {
				lc.css.removeClass(element, "lc-animate");
				lc.css.removeClass(element, classStart);
				element.removeEventListener("transitionstart", onstart);
				element.removeEventListener("transitionend", onend);
				element.removeEventListener("transitioncancel", onend);
				future.success();
				return;
			}
			lc.css.removeClass(element, classStart);
			lc.css.addClass(element, classEnd);
			// in case transition end/cancel does not work
			var time = s.transitionDuration;
			var i = time.indexOf("ms");
			var j = time.indexOf("s");
			if (i > 0 && i < j) {
				time = parseInt(time.substring(0,i));
			} else if (j > 0) {
				time = parseFloat(time.substring(0,j))*1000;
			} else {
				time = 0;
			}
			setTimeout(onend, Math.floor(time+1));
		},1);
		return future;
	},
	
	animateReverse: function(element) {
		return this.animate(element, "lc-animate-end", "lc-animate-start");
	},
	
	timing: {
		// t: current time, b: start value, c: change In value, d: duration
		linear: function(t, b, c, d) {
			return t*c/d + b;
		},
		easeInQuad: function (t, b, c, d) {
			return c*(t/=d)*t + b;
		},
		easeOutQuad: function (t, b, c, d) {
			return -c *(t/=d)*(t-2) + b;
		},
		easeInOutQuad: function (t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t + b;
			return -c/2 * ((--t)*(t-2) - 1) + b;
		},
		easeInCubic: function (t, b, c, d) {
			return c*(t/=d)*t*t + b;
		},
		easeOutCubic: function (t, b, c, d) {
			return c*((t=t/d-1)*t*t + 1) + b;
		},
		easeInOutCubic: function (t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t + b;
			return c/2*((t-=2)*t*t + 2) + b;
		},
		easeInQuart: function (t, b, c, d) {
			return c*(t/=d)*t*t*t + b;
		},
		easeOutQuart: function (t, b, c, d) {
			return -c * ((t=t/d-1)*t*t*t - 1) + b;
		},
		easeInOutQuart: function (t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
			return -c/2 * ((t-=2)*t*t*t - 2) + b;
		},
		easeInQuint: function (t, b, c, d) {
			return c*(t/=d)*t*t*t*t + b;
		},
		easeOutQuint: function (t, b, c, d) {
			return c*((t=t/d-1)*t*t*t*t + 1) + b;
		},
		easeInOutQuint: function (t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
			return c/2*((t-=2)*t*t*t*t + 2) + b;
		},
		easeInSine: function (t, b, c, d) {
			return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
		},
		easeOutSine: function (t, b, c, d) {
			return c * Math.sin(t/d * (Math.PI/2)) + b;
		},
		easeInOutSine: function (t, b, c, d) {
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		},
		easeInExpo: function (t, b, c, d) {
			return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
		},
		easeOutExpo: function (t, b, c, d) {
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOutExpo: function (t, b, c, d) {
			if (t==0) return b;
			if (t==d) return b+c;
			if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
			return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
		},
		easeInCirc: function (t, b, c, d) {
			return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
		},
		easeOutCirc: function (t, b, c, d) {
			return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
		},
		easeInOutCirc: function (t, b, c, d) {
			if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
		},
		easeInElastic: function (t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		},
		easeOutElastic: function (t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
		},
		easeInOutElastic: function (t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
			if (a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
			return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
		},
		easeInBack: function (t, b, c, d, s) {
			if (s == undefined) s = 1.70158;
			return c*(t/=d)*t*((s+1)*t - s) + b;
		},
		easeOutBack: function (t, b, c, d, s) {
			if (s == undefined) s = 1.70158;
			return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
		},
		easeInOutBack: function (t, b, c, d, s) {
			if (s == undefined) s = 1.70158; 
			if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
			return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
		},
		easeInBounce: function (t, b, c, d) {
			return c - lc.animation.functions.easeOutBounce (d-t, 0, c, d) + b;
		},
		easeOutBounce: function (t, b, c, d) {
			if ((t/=d) < (1/2.75)) {
				return c*(7.5625*t*t) + b;
			} else if (t < (2/2.75)) {
				return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
			} else if (t < (2.5/2.75)) {
				return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
			} else {
				return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
			}
		},
		easeInOutBounce: function (t, b, c, d) {
			if (t < d/2) return lc.animation.functions.easeInBounce (t*2, 0, c, d) * .5 + b;
			return lc.animation.functions.easeOutBounce (t*2-d, 0, c, d) * .5 + c*.5 + b;
		}
	},

	collapseHeight: function(element, time) {
		element.style.transitionProperty = "height,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "top";
		element.style.overflow = "hidden";
		var s = getComputedStyle(element);
		element.style.paddingTop = s.paddingTop;
		element.style.paddingBottom = s.paddingBottom;
		var paddingTop = parseInt(s.paddingTop);
		if (isNaN(paddingTop)) paddingTop = 0;
		var paddingBottom = parseInt(s.paddingBottom);
		if (isNaN(paddingBottom)) paddingBottom = 0;
		element.style.height = (element.clientHeight-paddingTop-paddingBottom) + 'px';
		element.style.transform = "scaleY(1)";
		var future = new lc.async.Future();
		setTimeout(function() {
			element.style.height = "0px";
			element.style.transform = "scaleY(0)";
			element.style.paddingTop = "0px";
			element.style.paddingBottom = "0px";
			setTimeout(function() {
				element.style.height = "";
				element.style.transform = "";
				element.style.paddingTop = "";
				element.style.paddingBottom = "";
				element.style.transitionProperty = "";
				element.style.transitionDuration = '';
				element.style.transitionTimingFunction = "";
				element.style.overflow = "";
				future.success();
			}, time);
		},0);
		return future;
	},
	
	expandHeight: function(element, time) {
		var s = getComputedStyle(element);
		element.style.paddingTop = "0px";
		element.style.paddingBottom = "0px";
		var height = element.clientHeight;
		element.style.transitionProperty = "height,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "top";
		element.style.overflow = "hidden";
		element.style.height = "0px";
		element.style.transform = "scaleY(0)";
		var future = new lc.async.Future();
		setTimeout(function() {
			element.style.paddingTop = s.paddingTop;
			element.style.paddingBottom = s.paddingBottom;
			var paddingTop = parseInt(s.paddingTop);
			if (isNaN(paddingTop)) paddingTop = 0;
			var paddingBottom = parseInt(s.paddingBottom);
			if (isNaN(paddingBottom)) paddingBottom = 0;
			element.style.height = (height-paddingTop-paddingBottom) + 'px';
			element.style.transform = "scaleY(1)";
			setTimeout(function() {
				element.style.height = "";
				element.style.transform = "";
				element.style.paddingTop = "";
				element.style.paddingBottom = "";
				element.style.transitionProperty = "";
				element.style.transitionDuration = '';
				element.style.transitionTimingFunction = "";
				element.style.overflow = "";
				future.success();
			}, time);
		},0);
		return future;
	},
	
	collapseWidth: function(element, time) {
		element.style.transitionProperty = "width,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "left";
		element.style.overflow = "hidden";
		var s = getComputedStyle(element);
		element.style.paddingLeft = s.paddingLeft;
		element.style.paddingRight = s.paddingRight;
		var paddingLeft = parseInt(s.paddingTop);
		if (isNaN(paddingLeft)) paddingLeft = 0;
		var paddingRight = parseInt(s.paddingBottom);
		if (isNaN(paddingRight)) paddingRight = 0;
		element.style.width = (element.clientWidth-paddingLeft-paddingRight) + 'px';
		element.style.transform = "scaleX(1)";
		var future = new lc.async.Future();
		setTimeout(function() {
			element.style.width = "0px";
			element.style.transform = "scaleX(0)";
			element.style.paddingLeft = "0px";
			element.style.paddingRight = "0px";
			setTimeout(function() {
				element.style.width = "";
				element.style.transform = "";
				element.style.paddingLeft = "";
				element.style.paddingRight = "";
				element.style.transitionProperty = "";
				element.style.transitionDuration = '';
				element.style.transitionTimingFunction = "";
				element.style.overflow = "";
				future.success();
			}, time);
		},0);
		return future;
	},
	
	expandWidth: function(element, time) {
		var s = getComputedStyle(element);
		var width = element.clientWidth;
		element.style.transitionProperty = "width,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "left";
		element.style.overflow = "hidden";
		element.style.width = "0px";
		element.style.transform = "scaleY(0)";
		element.style.paddingLeft = "0px";
		element.style.paddingRight = "0px";
		var future = new lc.async.Future();
		setTimeout(function() {
			element.style.paddingLeft = s.paddingLeft;
			element.style.paddingRight = s.paddingRight;
			var paddingLeft = parseInt(s.paddingLeft);
			if (isNaN(paddingLeft)) paddingLeft = 0;
			var paddingRight = parseInt(s.paddingRight);
			if (isNaN(paddingRight)) paddingRight = 0;
			element.style.width = (width-paddingLeft-paddingRight) + 'px';
			element.style.transform = "scaleY(1)";
			setTimeout(function() {
				element.style.width = "";
				element.style.transform = "";
				element.style.paddingLeft = "";
				element.style.paddingRight = "";
				element.style.transitionProperty = "";
				element.style.transitionDuration = '';
				element.style.transitionTimingFunction = "";
				element.style.overflow = "";
				future.success();
			}, time);
		},0);
		return future;
	}
	
});

lc.core.createClass("lc.animation.AnimatedElement",
	function(element, timing, duration) {
		this._element = element;
		if (!timing) timing = lc.animation.timing.easeInOutCubic;
		this._timing = timing;
		if (!duration || duration <= 0) duration = 100;
		this._duration = duration;
		this._properties = [];
		this._listeners = [];
	}, {
		_start: -1,
		_forward: true,
		_timeout: null,
		
		addProperty: function(name, startValue, endValue, prefix, suffix) {
			this._properties.push({
				name: name,
				start: startValue,
				end: endValue,
				prefix: prefix,
				suffix: suffix
			});
		},
		
		addListener: function(listener) {
			this._listeners.push(lc.async.Callback.from(listener));
		},
		
		setTimingFunction: function(timing) {
			if (!timing) timing = lc.animation.timing.easeInOutCubic;
			this._timing = timing;
		},
		
		setDuration: function(duration) {
			if (!duration || duration <= 0) duration = 100;
			this._duration = duration;
		},
		
		forward: function() {
			var now = new Date().getTime();
			if (this._timeout == null) {
				this._forward = true;
				this._start = now;
				this._applyValues(0);
				var that = this;
				this._timeout = setTimeout(function() { that._update(); }, 1);
				return;
			}
			if (this._forward) return;
			this._forward = true;
			this._start = now - ((this._start + this._duration) - now);
		},
		
		backward: function() {
			var now = new Date().getTime();
			if (this._timeout == null) {
				this._forward = false;
				this._start = now;
				this._applyValues(this._duration);
				var that = this;
				this._timeout = setTimeout(function() { that._update(); }, 1);
				return;
			}
			if (!this._forward) return;
			this._forward = false;
			this._start = now - ((this._start + this._duration) - now);
		},
		
		_update: function() {
			var t = new Date().getTime();
			if (t >= this._start + this._duration) {
				// end
				if (this._forward) {
					this._applyValues(this._duration);
				} else {
					this._applyValues(0);
				}
				this._start = -1;
				this._timeout = null;
				return;
			}
			if (this._forward) {
				this._applyValues(t - this._start);
			} else {
				this._applyValues(this._duration - (t - this._start));
			}
			var that = this;
			this._timeout = setTimeout(function() { that._update(); }, 10);
		},
		
		_applyValues: function(t) {
			var factor = this._timing(t, 0, 1, this._duration);
			for (var i = 0; i < this._properties.length; ++i) {
				var p = this._properties[i];
				this._element.style[p.name] = p.prefix + (p.start + (p.end - p.start) * factor) + p.suffix;
			}
			lc.async.Callback.callListeners(this._listeners, [this._element, factor]);
		}
		
	});
