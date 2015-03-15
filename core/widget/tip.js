define("core/widget/tip", function(require, exports, module) {
	var event = require('core/lib/event');
	var dom = require('core/lib/dom');

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
			dom.transform(curTip[0], 'translateY(-100%)');
			dom.appendHtml(document.body, dom.tmpl(_tmpl.main, { text: text }));
			dom.applyRender();
			dom.transform(curTip[0], 'translateY(0)', 200);
			clearTimeout(timer);
			timer = setTimeout(function() {
				tipManager.hide()
			}, 2500);
		},
		hide: function() {
			clearTimeout(timer);
			var _cur = curTip;
			if(!_cur) return;
			dom.transform(_cur[0], 'translateY(-100%)', 200, function() {
				this.parent.removeChild(this);
			});
		}
	}

	event.on('before_tab', function() {
		tipManager.hide();
	});

	module.exports = tipManager;
});