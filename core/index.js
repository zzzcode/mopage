/**
 * @fileoverview 入口模块
 * @author lzhspace@gmail.com
 */

define("core", function(require, exports, module) {
	var router = require('core/main/router');
	var pageManager = require('core/main/pagemanager');
	var event = require('core/lib/event');
	var commonLayout = require('core/layout/common');
	var util = require('core/lib/util');
	var dom = require('core/lib/dom');
	var config = require('core/config');
	var loader = window.loader;

	var startup = function() {
		
		/**
		 * @name 绑定全局tap事件
		 */
		event.addEvents('tap', {
			'link': function() {
				router.navigate(this.getAttribute('href'));
			},
			'hisBack': function() {
				router.back();
			}
		});

		/**
		 * @name 绑定全局resize事件
		 */
		event.bind(window, 'resize', function() {
			dom.updateBrowserInfo();
			pageManager.broadcast('resize');
		});

		/**
		 * @name 绑定全局orientationchange事件
		 */
		event.bind(window, 'orientationchange', function() {
			dom.updateBrowserInfo();
			pageManager.broadcast('orientationchange');
		});

		commonLayout.render();
		pageManager.init();
		router.init({
			pageManager: pageManager,
			html5Mode: true
		});
	}

	var initLayout = function(userLayout) {
		var layout = userLayout || require('core/layout');
		layout.render();
		pageManager.setPagesWrapper(dom.query(layout.wrapper));
	}

	module.exports = function(appName) {
		config.appName = appName;

		// 用户预处理的模块
		var userModuleHandlers = {};
		/**
		 * 用户配置文件
		 */
		var userConfigModule = appName + '/config/index';
		userModuleHandlers[userConfigModule] = function(userConfig) {
			userConfig && util.extend(config, userConfig);
		}

		/**
		 * app布局文件
		 */
		var userLayoutModule = appName + '/layout/index';
		userModuleHandlers[userLayoutModule] = function(userLayout) {
			if(userLayout) {
				if(!userLayout.render) {
					throw 'layout module[' + userLayoutModule + '] must export "render" function';
				}
				if(!userLayout.wrapper) {
					throw 'layout module[' + userLayoutModule + '] must export "wrapper" value';
				}
			}
			initLayout(userLayout);
		}

		var existModules = loader.checkModuleExist(Object.keys(userModuleHandlers)).existModules;
		if(existModules.length) {
			loader.loadModule(existModules, function(status) {
				if(status == loader.Status.SUCCESS) {
					for(var module in userModuleHandlers) {
						userModuleHandlers[module](require(module));
					}
					startup();
				}
				else {
					console.error('load user base module[' + existModules.join(',') + '] fail');
				}
			});
		}
		else {
			initLayout();
			startup();
		}
	};
});