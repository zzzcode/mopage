/**
 * @fileoverview 默认布局
 * @author lzhspace@gmail.com
 */
define("core/layout/default", function(require, exports, module) {
	var util = require('core/lib/util');
	var _tmpl = {
		style: TEMPLATE.INNER_STYLE,
		main: TEMPLATE.MAIN
	}
	var layout = {
		render: function() {
			util.insertStyle(_tmpl.style);
			util.appendHtml(document.body, _tmpl.main);
		}
	}

	module.exports = layout;
});