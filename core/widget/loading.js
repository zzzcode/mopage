define("core/widget/loading", function(require, exports, module) {
	var util = require('core/lib/util');

	var _tmpl = {
		main: TEMPLATE.MAIN,
		style: TEMPLATE.STYLE
	}

	var defaultOptions = {
		radius: 12,
		dotRadius: 3,
		duration: '1s',
		dotColor: '#333'
	}

	var loading = {
		getHtml: function(options) {
			options = util.extend({}, defaultOptions, options);
			options.wrapWidth = options.wrapHeight = (options.radius + options.dotRadius) * 2;
			util.insertStyle(_tmpl.style, 'loading');
			return util.tmpl(_tmpl.main, options);
		}
	}
	module.exports = loading;
});