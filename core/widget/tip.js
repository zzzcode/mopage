define("core/widget/tip", function(require, exports, module) {
	var event = require('core/lib/event');
	var util = require('core/lib/util');

	var _tmpl = {
		main: TEMPLATE.MAIN
	}

	var curTip, timer;

	var tipManager = {
		show: function(text) {
			if(!text) return;
			if(curTip) {
				tipManager.hide();
			}
			util.transform(curTip[0], 'translateY(-100%)');
			util.appendHtml(document.body, util.tmpl(_tmpl.main, { text: text }));
			util.applyRender();
			util.transform(curTip[0], 'translateY(0)', 200);
			clearTimeout(timer);
			timer = setTimeout(function() {
				tipManager.hide()
			}, 2500);
		},
		hide: function() {
			clearTimeout(timer);
			var _cur = curTip;
			if(!_cur) return;
			util.transform(_cur[0], 'translateY(-100%)', 200, function() {
				this.parent.removeChild(this);
			});
		}
	}

	event.on('before_tab', function() {
		tipManager.hide();
	});

	module.exports = tipManager;
});