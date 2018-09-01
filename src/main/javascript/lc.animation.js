lc.core.namespace("lc.animation", {
	
	animate: function(element, classStart, classEnd) {
		if (typeof classStart == 'undefined') {
			classStart = "lc-animate-start";
			classEnd = "lc-animate-end";
		}
		var started = false, ended = false;
		var onstart, onend;
		onstart = function() {
			started = true;
			element.removeEventListener("transitionstart", onstart);
		};
		onend = function() {
			if (ended) return;
			lc.css.removeClass(element, classEnd);
			element.removeEventListener("transitionend", onend);
			element.removeEventListener("transitioncancel", onend);
			ended = true;
			if (ondone) lc.Callback.call(ondone);
		};
		element.addEventListener("transitionstart", onstart);
		element.addEventListener("transitionend", onend);
		element.addEventListener("transitioncancel", onend);
		lc.css.addClass(element, classStart);
		var future = new lc.async.Future();
		setTimeout(function() {
			// transitionstart event does not work yet
			var s = getComputedStyle(element);
			if (s.transitionProperty) started = true;
			if (!started) {
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
		var height = element.clientHeight;
		element.style.transitionProperty = "height,transform,padding";
		element.style.transitionDuration = time+'ms';
		element.style.transitionTimingFunction = "ease-in-out";
		element.style.transformOrigin = "top";
		element.style.overflow = "hidden";
		element.style.height = "0px";
		element.style.transform = "scaleY(0)";
		element.style.paddingTop = "0px";
		element.style.paddingBottom = "0px";
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
