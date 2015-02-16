/**
 * @fileoverview 事件注入
 * @author lzhspace@gmail.com
 */
define(function(require, exports, module) {
	var util = require('core/lib/util');
	var bindFunctionName = 'on', emitFunctionName = 'emit', moduleInjectName = '__module_event__';
	var eventsContainer = {};

	var addHandler = function(moduleObj, eventName, handler) {
		if(typeof handler == 'function') {
			var moduleName = moduleObj[moduleInjectName];
			!eventsContainer[moduleName] || (eventsContainer[moduleName] = {});
			moduleEvents = eventsContainer[moduleName];
			!moduleEvents[eventName] || (moduleEvents[eventName] = []);
			moduleEvents[eventName].push(handler);
		}
	}
	var emit = function(moduleObj, eventName, args) {
		var moduleEvents = eventsContainer[moduleObj[moduleInjectName]], eventList;
		if(moduleEvents) {
			eventList = moduleEvents[eventName];
			if(eventList && eventList.length) {
				for(var i = 0, one; one = eventList[i]; i++) {
					one.apply(moduleObj, args);
				}
			}
		}
	}
	var relieve = function(moduleObj) {
		if(typeof moduleObj == 'object') {
			var moduleName = moduleObj[moduleInjectName];
			if(moduleName) {
				eventsContainer[moduleName] = null;
			}
		}
		
	}

	var emitter = {
		regist: function(moduleObj, linkTo, pass) {
			if(typeof moduleObj == 'object' && !moduleObj[moduleInjectName]) {
				if(moduleObj[moduleInjectName]) {
					relieve(moduleObj);
				}
				if(typeof linkTo == 'object' && !this.hasRegist(linkTo)) {
					this.regist(linkTo);
				}
				moduleObj[moduleInjectName] = util.uniqueId();
				moduleObj[bindFunctionName] = function(eventName, handler) {
					!pass && addHandler(this, eventName, handler);
					linkTo && addHandler(linkTo, eventName, handler);
				}
				moduleObj[emitFunctionName] = function(eventName, args) {
					!pass && emit(this, eventName, args);
					linkTo && emit(linkTo, eventName, args);
				}
			}
		},
		hasRegist: function(moduleObj) {
			return !!moduleObj[moduleInjectName];
		}
	}

	module.exports = emitter;
});