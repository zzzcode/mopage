/**
 * 渲染页面的公共内容
 */
define("core/layout/common", function(require, exports, module) {
	var dom = require('core/lib/dom');
	var _tmpl = {
		style: TEMPLATE.INNER_STYLE
	}
	var layout = {
		render: function() {
			dom.insertStyle(_tmpl.style);
		}
	}

	module.exports = layout;
});