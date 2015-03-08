/**
 * 渲染页面的公共内容
 */
define("core/layout/common", function(require, exports, module) {
	var util = require('core/lib/util');
	var _tmpl = {
		style: TEMPLATE.INNER_STYLE
	}
	var layout = {
		render: function() {
			util.insertStyle(_tmpl.style);
		}
	}

	module.exports = layout;
});