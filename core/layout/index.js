/**
 * @fileoverview 默认布局
 * @author lzhspace@gmail.com
 */
define("core/layout", function(require, exports, module) {
	var dom = require('core/lib/dom');
	var _tmpl = {
		style: TEMPLATE.INNER_STYLE,
		main: TEMPLATE.MAIN
	}
	var layout = {
		wrapper: '#pagesWrapper',
		render: function() {
			dom.insertStyle(_tmpl.style);
			dom.appendHtml(document.body, _tmpl.main);
		}
	}

	module.exports = layout;
});