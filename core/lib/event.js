/**
 * @fileoverview 单页应用事件模块
 *	1. 基础事件只绑定document对象，通过冒泡响应
 *	2. 支持namespace对事件区分处理
 * @author lzhspace@gmail.com
 */
 
define("core/lib/event", function(require, exports, module) {
	var emitter = require('core/lib/emitter');

	var eventAttr = 'data-event', globalNamespace = 'global';
	var eventContainers = {}, handlerInfoMap = {};
	var curNamespace = '';

	/**
	 * @method 获取目标元素
	 * @param {DOMEventObject} e
	 * @description 由event.target开始检索，找出目标事件元素（即设定了eventAttr的元素）
	 */
	var getTarget = function(e, target, depth) {
		target = target || e.target || e.srcElement;
		depth = depth || 1;
		if(target.getAttribute(eventAttr)) {
			return target;
		}
		if(target === document.documentElement) {
			return null;
		}
		return getTarget(e, target.parentNode, depth + 1);
	}

	/**
	 * @method 获取事件函数ID
	 */
	var getHandlerId = (function() {
		var counter = 0, prefix = 'handle_';
		return function() {
			return prefix + counter++;
		}
	})();

	/**
	 * @method 绑定到dom元素处理函数
	 * @param {DOMEventObject} e
	 * @param {String} eventType 自定义事件
	 */
	var _basePageHandler = function(e, eventType) {
		if(!eventType || (typeof eventType !== 'string')) {
			eventType = e.type;
		}
		eventModule.emit('touch');
		eventModule.emit('before_' + eventType);
		var target = getTarget(e);
		if(!target) return;
		var eventKey = target.getAttribute(eventAttr);
		var handlers = eventContainers[eventType].events[eventKey];
		if(handlers && handlers.length) {
			for(var i = 0, one; one = handlers[i]; i++) {
				handlerInfo = handlerInfoMap[one.handlerId];
				if(handlerInfo.namespace === globalNamespace || handlerInfo.namespace === curNamespace) {
					one.call(target, e);
					eventModule.emit(eventType, [ target ]);
				}
			}
		}
		e.preventDefault();
		e.stopPropagation();
	}

	/**
	 * @method 事件绑定
	 * @param {HTMLElement} target 绑定的DOM元素
	 * @param {String} eventType 事件类型
	 * @param {Function} handler 事件处理函数
	 */
	var bind = function(target, eventType, handler) {
		if(document.addEventListener) {
			target.addEventListener(eventType, handler, false);
		}
		else if(document.attachEvent) {
			target.attachEvent('on' + eventType, handler);
		}
	}

	/**
	 * @method 事件解绑
	 * @param {HTMLElement} target 绑定的DOM元素
	 * @param {String} eventType 事件类型
	 * @param {Function} handler 事件处理函数
	 */
	var unbind = function(target, eventType, handler) {
		if(document.removeEventListener) {
			target.removeEventListener(eventType, handler, false);
		}
		else if(document.detachEvent) {
			target.detachEvent('on' + eventType, handler);
		}
	}

	/**
	 * @method 绑定页面事件
	 * @param {String} eventType 事件类型
	 */
	var bindPageEvent = function(eventType) {
		if(eventType == 'tap') {
			var _isTap = false, _start;
			bind(document.body, 'touchstart', function() {
				_isTap = true;
	            _start = new Date();
			});
			bind(document.body, 'touchmove', function() {
				_isTap = false;
			});
			bind(document.body, 'touchend', function(e) {
				if(_isTap) {
	                if(new Date() - _start > 300) return;
	                _basePageHandler(e, 'tap');
	            }
			});
		}
		else {
			bind(document.body, eventType, _basePageHandler);
		}
	}

	/**
	 * @method 解绑事件
	 * @param {String} eventType 事件类型
	 */
	var unbindPageEvent = function(eventType) {
		if(eventType == 'tap') {
			// tap事件集合暂时不解绑
		}
		else {
			unbind(document.body, eventType, _basePageHandler);
		}
	}

	/**
	 * @method 添加事件
	 * @param {String} namespace 事件命名空间（可选）
	 * @param {String} eventType 事件类型(click,touchstart之类)
	 * @param {Object} handlerObj 事件函数集合对象(eventKey:function() {})
	 * @return {Array} 事件句柄数据（移除事件使用）
	 * @author Jofixli
	 */
	var addEvents = function() {
		var namespace, eventType, handlerObj, i = 0;
		if(arguments.length == 3) {
			namespace = arguments[0];
			i++;
		}
		else {
			namespace = globalNamespace;
		}
		eventType = arguments[i];
		handlerObj = arguments[i + 1];

		if(!eventContainers[eventType]) {
			eventContainers[eventType] = { length: 0, events: { } };
			bindPageEvent(eventType);
		}
		var container = eventContainers[eventType], handlerIdOuter = [];
		for(var eventKey in handlerObj) {
			if(!container.events[eventKey]) {
				container.events[eventKey] = [];
				container.length++;
			}
			var handler = handlerObj[eventKey];
			var handlerId = getHandlerId();
			handler.handlerId = handlerId;
			container.events[eventKey].push(handler);
			handlerInfoMap[handlerId] = { eventType: eventType, eventKey: eventKey, handlerId: handlerId, namespace: namespace };
			handlerIdOuter.push(handlerId);
		}
		return handlerIdOuter;
	}

	/**
	 * @method 移除事件
	 * @param {String|Array} 事件句柄（变长参数）
	 * @author jofixli
	 */
	var removeEvents = function() {
		var handlerIds = [];
		var push = Array.prototype.push, toString = Object.prototype.toString;
		for(var i = 0, one; one = arguments[i]; i++) {
			push.apply(handlerIds, toString.call(one) === '[object Array]' ? one : [ one ]);
		}
		for(var i = 0, one; one = handlerIds[i]; i++) {
			var handlerInfo = handlerInfoMap[one];
			if(!handlerInfo) continue;
			var eventType = handlerInfo.eventType;
			var list = eventContainers[eventType].events[handlerInfo.eventKey];
			if(list && list.length) {
				for(var j = list.length - 1, fn; fn = list[j]; j--) {
					if(fn.handlerId == handlerInfo.handlerId) {
						list.splice(j, 1);
					}
				}
				if(list.length == 0) {
					eventContainers[eventType].events[handlerInfo.eventKey] = null;
					eventContainers[eventType].length--;
					if(eventContainers[eventType].length == 0) {
						eventContainers[eventType] = null;
						unbindPageEvent(eventType);
					}
				}
			}
		}
	}

	/**
	 * @method 根据命名空间移除事件
	 * @param {String} namespace 命名空间
	 * @author Jofix
	 */
	var removeEventsByNamespace = function(namespace) {
		var removeHandlerId = [];
		for(var key in handlerInfoMap) {
			if(handlerInfoMap[key].namespace === namespace) {
				removeHandlerId.push(key);
			}
		}
		removeEvents(removeHandlerId);
	}

	/**
	 * @method 切换当前的命名空间
	 * @param {String} namespace 命名空间
	 * @description 如设置了当前命名空间，只允许该命名空间下的事件执行
	 */
	var switchNamespace = function(namespace) {
		curNamespace = namespace;
	}

	/**
	 * @name 修复部分浏览器会触发click事件
	 * @description 部分浏览器不支持touchend的preventDefault取消click事件，qq浏览器就是其中之一
	 */
	bind(document.body, 'click', function(e) {
		e.preventDefault();
	});


	var eventModule = {
		addEvents: addEvents,
		removeEvents: removeEvents,
		removeEventsByNamespace: removeEventsByNamespace,
		switchNamespace: switchNamespace,
		bind: bind,
		unbind: unbind
	}
	emitter.regist(eventModule);
	module.exports = eventModule;
});