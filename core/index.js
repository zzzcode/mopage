/**
 * @fileoverview 核心入口模块
 * @author lzhspace@gmail.com
 */

define("core", function(require, exports, module) {
	var router = require('core/main/router');
	var pageManager = require('core/main/pagemanager');
	var event = require('core/lib/event');
	var commonLayout = require('core/layout/common');
	var util = require('core/lib/util');
	var configManager = require('core/config');

	var startup = function() {
		pageManager.init();
		router.init({
			pageManager: pageManager,
			html5Mode: true
		});
		
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
			util.updateBrowserInfo();
			pageManager.broadcast('resize');
		});
	}

	module.exports = function(userConfig) {
		commonLayout.render();
		if(userConfig) {
			configManager.setConfig(userConfig);
			if(userConfig.layoutModule) {
				require.async(userConfig.layoutModule, function(userLayout) {
					if(!userLayout) {
						throw 'can`t find layout module';
					}
					if(!userLayout.render) {
						throw 'layout module must export "render" function';
					}
					userLayout.render();
					startup();
				});
				return;
			}
		}
		require('core/layout/default').render();
		startup();
	};
});