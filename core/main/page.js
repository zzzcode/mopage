/**
 * @fileoverview 页面包装类，维持页面的状态，负责加载以及销毁页面
 * @author lzhspace@gmail.com
 */
define(function(require, exports, module) {
	var event = require('core/lib/event');
	var config = require('core/config/index').getConfig();
	var loading = require('core/widget/loading');
	var util = require('core/lib/util');

	var Page = function(pageId) {
		this.pageId = pageId;
		this.status = Page.Status.LOADING;
		this.init();
	}

	/**
	 * @enum 页面状态
	 */
	Page.Status = {
		LOADING: 1, 	// 加载中
		LOADED: 2, 		// 加载完毕,并初始化完成
		READY: 3, 		// 页面已展示
		NOT_EXIST: 4, 	// 页面不存在
		ERROR: 5, 		// 页面加载错误
		DESTROY: 6		// 已销毁
	}

	/**
	 * @method 页面初始化
	 */
	Page.prototype.init = function() {
		var section = document.createElement('section');
		section.innerHTML = loading.getHtml();
		this.dom = section;
	}

	/**
	 * @method 加载页面核心
	 * @param {Object} pageCore 页面模块对象
	 * @param {Array} params 参数数组
	 */
	Page.prototype.loadPageCore = function(pageCore, params) {
		this.pageCore = pageCore;
		this.params = params;
		if(pageCore.wrapClass) {
			util.setClass(this.dom, pageCore.wrapClass);
		}
		pageCore.init({
			wrapper: this.dom,
			params: params,
			pageId: this.pageId
		});
		this.status = Page.Status.LOADED;

		if(this.eventQueue && this.eventQueue.length) {
			for(var i = 0, eventName; eventName = this.eventQueue[i]; i++) {
				this.notifyPageCore(eventName);
			}
		}
	}

	/**
	 * @method 显示页面
	 */
	Page.prototype.show = function() {
		this.dom.style.display = 'block';
	}

	/**
	 * @method 隐藏页面
	 */
	Page.prototype.hide = function() {
		this.dom.style.display = 'none';
	}

	/**
	 * @method 添加外层样式类
	 * @param {String} className 样式类
	 */
	Page.prototype.addWrapClass = function(className) {
		util.setClass(this.dom, className);
	}

	/**
	 * @method 移除外层样式类
	 * @param {String} className 样式类
	 */
	Page.prototype.removeWrapClass = function(className) {
		util.setClass(this.dom, className, true);
	}

	/**
	 * @method 获取页面的DOM引用
	 * @return {HTMLElement} 页面最外层DOM引用
	 */
	Page.prototype.getDom = function() {
		return this.dom;
	}

	/**
	 * @method 显示404页面
	 */
	Page.prototype.render404 = function() {
		this.status = Page.Status.NOT_EXIST;
		this.dom.innerHTML = config.html404;
	}

	/**
	 * @method 显示错误页面
	 */
	Page.prototype.renderError = function() {
		this.status = Page.Status.ERROR;
		this.dom.innerHTML = config.htmlError;
	}

	/**
	 * @method 销毁页面
	 */
	Page.prototype.destroy = function() {
		this.pageCore && this.pageCore.destroy && this.pageCore.destroy();
		this.dom.parent.removeChild(this.dom);
		event.removeEventsByNamespace(this.pageId);
		this.status = Page.Status.DESTROY;
		this.dom = null;
	}

	Page.prototype.active = function() {
		this.emit('active');
	}

	Page.prototype.resume = function() {
		this.emit('resume');
		if(this.status !== Page.Status.READY) {
			this.emit('ready');
			this.status = Page.Status.READY;
		}
	}

	Page.prototype.deactive = function() {
		this.emit('deactive');
	}

	/**
	 * @method 页面从foregound到background时调用
	 */
	Page.prototype.pause = function() {
		this.emit('pause');
	}

	/**
	 * @method 判断页面是否是静态页面
	 */
	Page.prototype.isStatic = function() {
		if(!this.pageCore) return false;
		return !!this.pageCore.static;
	}

	/**
	 * @method 事件触发器
	 * @param {String} eventName 事件名
	 */
	Page.prototype.emit = function(eventName) {
		if(!this.pageCore) {
			!this.eventQueue && (this.eventQueue = []);
			this.eventQueue.push(eventName);
		}
		else {
			this.notifyPageCore(eventName);
		}
	}

	/**
	 * @method 页面核心模块事件通知
	 * @param {String} eventName 事件名
	 */
	Page.prototype.notifyPageCore = function(eventName) {
		var funcName = 'on' + eventName;
		if(this.pageCore[funcName]) {
			this.pageCore[funcName]();
		}	
	}

	module.exports = Page;
})