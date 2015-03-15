/**
 * @module 默认配置
 * @description 调用入口模块时候可覆盖
 * @author lzhspace@gmail.com
 */

define("core/config/index", function(require, exports, module) {
	var defaultConfig = {
		'usePageAnimation': false,
		'viewName': 'view',
		'html404': '<div style="text-align:center;height:100%;"><div style="height:40%;width:100%;"></div><div>您访问的页面不存在！</div></div>',
		'htmlError': '<div style="text-align:center;height:100%;"><div style="height:40%;width:100%;"></div><div>您访问的页面出错了，请刷新重试！</div></div>'
	}
	module.exports = defaultConfig;
});