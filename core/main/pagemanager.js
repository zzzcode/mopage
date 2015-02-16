/**
 * @fileoverview 页面管理模块,负责页面加载，页面间切换以及维护页面的生命周期
 * @author lzhspace@gmail.com
 */

define(function(require, exports, module) {
	var router = require('core/main/router');
	var util = require('core/lib/util');
	var config = require('core/config/index').getConfig();
	var Page = require('core/main/page');
	var loader = window.loader;
	var event = require('core/lib/event');

	/**
	 * @name 页面实例类容器
	 */
	var pagesContainer = {};
	var _curPageId;
	var NavigationType = router.NavigationType;

	var pageManager = {
		/**
		 * @method 模块初始化
		 */
		init: function() {
			this.pagesWrapper = util.dom(config.pagesWrapper);
			if(!this.pagesWrapper) {
				throw 'get pages wrapper error';
			}
			this.initMaskPage();
		},

		initMaskPage: function() {
			this.maskPage = new Page('maskPage');
			this.maskPage.addWrapClass('mask-page');
			this.maskPage.hide();
			this.pagesWrapper.appendChild(this.maskPage.dom);
		},

		/**
		 * @method 模块加载器
		 * @param {String} pageModule 页面模块名称 
		 * @param {Array} params 参数数组
		 * @param {ENUM} navType 页面跳转类型 
		 * @param {String} routeBack 是否逻辑后退
		 * @description 负责页面模块的准备工作，如加载等
		 */
		loadModule: function(pageModule, params, navType, routeBack) {
			var pageId = this.makePageId(pageModule, params);
			if(navType == NavigationType.NEXT || navType == NavigationType.RELOAD) {
				var oldPage = pagesContainer[pageId];
				if(oldPage && oldPage.isStatic()) {
					// 如果页面是静态的，则刷新或重新进入不销毁
				}
				else {
					this.destroyPage(pageId);
					var toPage = new Page(pageId);
					pagesContainer[pageId] = toPage;
					this.pagesWrapper.appendChild(toPage.dom);
					loader.loadModule(pageModule, function(status) {
						if(status == loader.Status.SUCCESS) {
							require.async(pageModule, function(pageCore) {
								toPage.loadPageCore(pageCore, params);
							});
						}
						else if(status == loader.Status.NOT_FOUND) {
							toPage.render404();
						}
						else {
							toPage.renderError();
						}
					});
				}
			}
			this.switchPage(pageId, navType, routeBack);
		},

		/**
		 * @method 页面切换
		 * @param {String} pageId 页面标识
		 * @param {ENUM} navType 页面跳转类型 
		 * @param {String} routeBack 是否逻辑后退
		 * @description 负责页面切换工作
		 */
		switchPage: function(pageId, navType, routeBack) {
			var toPage = pagesContainer[pageId];
			var fromPage = pagesContainer[_curPageId];
			if(!toPage) return;
			_curPageId = pageId;
			event.switchNamespace(pageId);
			if(fromPage && navType !== NavigationType.RELOAD) {
				if(!config.usePageAnimation) {
					toPage.active();
					toPage.resume();
					toPage.show();
					fromPage.hide();
					fromPage.deactive();
					fromPage.pause();
				}
				else {
					var isBack = routeBack || navType === NavigationType.HIS_BACK;
					this.animate(fromPage, toPage, isBack);
				}
				
			}
			else {
				toPage.active();
				toPage.resume();
				toPage.show();
			}
		},

		/**
		 * @method 生成页面标识
		 * @param {String} pageModule 页面模块名称
		 * @param {Array} params 参数数组
		 * @description 有模块名称和页面参数生成唯一标识
		 */
		makePageId: function(pageModule, param) {
			var pageId = pageModule.replace(/\//g, '_');
			if(param && param.length) {
				pageId += '_' + param.join('.');
			}
			return pageId;
		},

		/**
		 * @method 销毁指定页面
		 * @param {String} pageId 页面标识
		 */
		destroyPage: function(pageId) {
			var page = pagesContainer[pageId];
			if(page) {
				page.destroy();
				pagesContainer[pageId] = null;
			}
		},

		/**
		 * @method 事件广播
		 * @param {String} eventName 事件名称
		 */
		broadcast: function(eventName) {
			for(var pageId in pagesContainer) {
				pagesContainer[pageId].emit(eventName);
			}
		},

		/**
		 * @method 页面切换动画
		 * @param {Object} fromPage 老页面对象
		 * @param {Object} toPage 新页面对象
		 * @param {Boolean} isBack 是否执行后退动画
		 */
		animate: function(fromPage, toPage, isBack) {
			var pageTopClass = 'page-ontop', maskPage = this.maskPage;
			var toPageDom = toPage.getDom(), fromPageDom = fromPage.getDom(), maskPageDom = maskPage.getDom();
			fromPage.deactive();
			toPage.active();
			if(isBack) {
				util.transform(maskPageDom, 'opacity(0.5)');
				fromPage.addWrapClass(pageTopClass);
				fromPage.emit('animationstart');
				toPage.show();
				maskPage.show();
				util.applyRender();
				util.transform(maskPageDom, 'opacity(0)', 250, function() {
					maskPage.hide();
				});
				util.transform(fromPageDom, 'translateX(' + util.support.windowWidth + 'px)', 250, function() {
					fromPage.hide();
					toPage.resume();
					fromPage.emit('animationend');
					fromPage.removeWrapClass(pageTopClass);
					fromPage.pause();
				});
			}
			else {
				util.transform(toPageDom, 'translateX(' + (util.support.windowWidth - 2) + 'px)');
				util.transform(maskPageDom, 'opacity(0)');
				toPage.addWrapClass(pageTopClass);
				toPage.emit('animationstart');
				toPage.show();
				maskPage.show();
				util.applyRender();
				util.transform(maskPageDom, 'opacity(0.5)', 250, function() {
					maskPage.hide();
				});
				util.transform(toPageDom, 'translateX(0)', 250, function() {
					fromPage.hide();
					toPage.removeWrapClass(pageTopClass);
					toPage.emit('animationend');
					toPage.resume();
					fromPage.pause();
				});
			}
		}
	}
	
	module.exports = pageManager;
})