/**
 * @fileoverview 页面路由模块,负责URL监听，触发页面切换
 * @author evanyuan, lzhspace@gmail.com
 */

define("core/main/router", function(require, exports, module) {
	var emitter = require('core/lib/emitter');
	var event = require('core/lib/event');
	var config = require('core/config/index');
	var routeRule = '/*controller(/*action)(/*p1)';
	var debugMark = 'debug_online';
	var hashMark = '#!';

	var _curController, _curAction;
	var historyPointer = -1, historyStack = [];
	
	/**
	 * @name 页面跳转类型
	 */
	var NavigationType = {
		NEXT: 1, 		// 正向跳转
		RELOAD: 2,		// 刷新
		HIS_BACK: 3,	// 历史回退
		HIS_FORWARD: 4	// 历史前进
	}

	var router = {
		NavigationType: NavigationType,

		/**
		 * @method 模块初始化
		 */
		init: function(option) {
			this.option = {
		        //页面管理对象
		        'pageManager': {},

		        'html5Mode': true
	      	};
	      	if(option) {
	      		for (var p in option) {
					this.option[p] = option[p];
				}
	      	}
			if(location.href.indexOf(debugMark) >= 0) {
				this.debug = debugMark;
			}
			var me = this;
			var evt = this.option['html5Mode'] ? 'popstate' : 'hashchange';
			event.bind(window, evt, function() {
				me.checkUrl();
			});
			this.start();
		},

		/**
		 * @method 路由到第一个页面
		 */
		start: function() {
			var startHashMode = window.location.hash.indexOf(hashMark) >= 0;
			var initPath = this.getFragment();
			if(initPath == '/index.htm') {
				initPath = '/';
			}
			if(this.option.html5Mode && startHashMode) {
				location.replace(initPath);
				return;
			}
			else if(!this.option.html5Mode && !startHashMode) {
				location.replace('/' + hashMark + initPath);
				return;
			}
			this.navigate(initPath);
		},

		/**
		 * @method 监听URL变化
		 */
		checkUrl: function() {
			var current = this.getFragment();
			if(current != this.fragment) {
				this.fragment = current;
				this.loadPath(current, true);
			}
		},

	    /**
	     * @method 获取当前的URL
	     */
		getFragment: function() {
			var path, hash = window.location.hash;
			if(hash && hash.indexOf(hashMark) >= 0) {
				path = hash.replace(hashMark, '') || '';
			}
			else {
				path = window.location.pathname + window.location.search;
			}
			if(this.debug) {
				path = path.replace(this.debug, '');
			}
			path = path.replace(/^\/+|\/+$/g, '');
			return '/' + path;
		},

		/**
		 * @method 页面导航
		 * @param {String} path 页面地址
		 * @param {Boolean} silent 是否只路由，不添加历史记录
		 * @param {Boolean} replacement 是否替换跳转
		 */
		navigate: function(path, silent, replacement) {
			var me = this;
			if(path !== this.fragment) {
				if(this.option.html5Mode) {
					if(!silent) {
						var stateFn = replacement ? 'replaceState' : 'pushState';
						history[stateFn]({}, document.title, path);
					}
				}
				else {
					if(!silent) {
						if(replacement) {
							location.replace('/' + hashMark + path);
						}
						else {
							location.hash = hashMark + path;
						}
					}
				}
			}
			this.fragment = path;
			this.loadPath(path);
		},

		/**
	     * @method 历史回退
	     */
		back: function() {
			window.history.back();
		},

		/**
		 * @method 路由匹配
		 * @param  {String} rule 路由规则
		 * @param  {String} url 地址
		 * @return {Array}  参数数组
		 * @author evanyuan
		 */
		matchRoute: function (rule, url) {
			var optionalReg = /\((.*?)\)/g,
				paramReg = /(\(\?)?:\w+/g,
				astReg = /\*\w+/g,
				ruleToReg = function (rule) {
					rule = rule.replace(optionalReg, '(?:$1)?').replace(paramReg, '([^\/]+)').replace(astReg, '(.*?)');
					return new RegExp('^' + rule + '$');
				},
				route = ruleToReg(rule),
				result = route.exec(url),
				params = null;

			if (result) {
				var args = result.slice(1);
				params = [];
				for (var i = 0, p; p = args[i]; i++){      
					params.push(p ? decodeURIComponent(p) : ''); 
				}
			}
			return params;
		},

		/**
		 * @method 加载页面
		 * @param {String} path 页面地址
		 * @param {Boolean} fromHistory 是否来自历史记录
		 */
		loadPath: function(path, fromHistory) {
			var parts,
				params = [],
				routes = this.option.routes,
				searchReg = /\/?\?.*/,
				searchMatch = searchReg.exec(path),
				path = path.replace(searchReg,'');

			searchMatch && (params = util.paramsToObject(searchMatch[0]));
			var controller = 'index', action = 'index', param = [];
			if (parts = this.matchRoute(routeRule, path)) {
				parts[0] && (controller = parts[0]);
				parts[1] && (action = parts[1]);
				if(parts.length > 2) {
					Array.prototype.unshift.apply(params, parts.slice(2));
				}
				this.route(controller, action, params, fromHistory);
			}
		},

		/**
		 * @method 对外接口，加载视图
		 * @param {String} controller 
		 * @param {String} action 
		 * @param {Array} params 参数数组
		 * @param {Boolean} fromHistory 是否来自历史记录 
		 * @description 负责将controller/action映射到对应的页面模块
		 */
		route: function(controller, action, params, fromHistory) {
			var routeBack = false;
			if(controller != _curController) {
				if(controller == 'index' && _curController != 'index') {
					routeBack = true;
				}
			}
			else {
				if(action == 'index' && _curAction != 'index') {
					routeBack = true;
				}
			}
			_curController = controller;
			_curAction = action;

			var moduleName = [config.appName, config.viewName, controller, action].join('/');
			var navType = NavigationType.NEXT;
			if(!fromHistory) {
				if(moduleName == historyStack[historyPointer]) {
					navType = NavigationType.RELOAD;
				}
				else {
					historyStack[historyPointer + 1] = moduleName;
					historyPointer++;
					navType = NavigationType.NEXT;
				}
			}
			else {
				if(historyStack[historyPointer + 1] == moduleName) {
					historyPointer++;
					navType = NavigationType.HIS_FORWARD;
				}
				else if(historyStack[historyPointer - 1] == moduleName) {
					historyPointer--;
					navType = NavigationType.HIS_BACK;
				}
			}
			this.option.pageManager.loadModule(moduleName, params, navType, routeBack);
			this.emit('route', arguments);
		}
	}
	emitter.regist(router);
	module.exports = router;
});