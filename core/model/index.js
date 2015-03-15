/**
 * @fileoverview 数据层，封装ajax请求
 * @author lzhspace@gmail.com
 */
define("core/model/index", function(require, exports, module) {
	var net = require('core/lib/net');
	var emitter = require('core/lib/emitter');

	var _returnCodeMark, _returnDataMark, _dataType;
	var cacheData = {};

	var commonCb = function(resText, succes, fail, cacheKey, options) {
		var dataType = options && options['dataType'] || _dataType;
		var result;
		if(dataType == 'json') {
			try {
				result = JSON.parse(resText);
			}
			catch(_) {
				fail && fail();
				return;
			}

		}
		if(dataType == 'json') {
			if(result && result[_returnCodeMark] == 0) {
				succes && succes(result[_returnDataMark]);
				if(cacheKey) {
					cacheData[cacheKey] = result[_returnDataMark];
				}
			}
			else {
				fail && fail(result);
			}
		}
		else {
			if(cacheKey) {
				cacheData[cacheKey] = resText;
			}
			succes && succes(resText);
		}
	}

	var model = {
		setting: function(setting) {
			if(typeof setting == 'object') {
				_returnCodeMark = setting.returnCodeMark || 'code';
				_returnDataMark = setting.returnDataMark || 'data';
				_dataType = setting.dataType || 'json';
			}
		},
		ajax: function() {
			var cacheKey, url, options, i = 0;
			if(typeof arguments[0] == 'string') {
				cacheKey = arguments[0];
			}
			url = arguments[i++];
			options = arguments[i++] || {};
			if(cacheKey && cacheData[cacheKey]) {
				options.success && options.success(cacheData[cacheKey]);
			}
			else {
				net.ajax(url, {
					method: options.method,
					data: options.data, 
					success: function(resText) {
						commonCb(resText, options.success, options.fail, cacheKey, options);
					},
					error: function() {
						options.fail && options.fail();
					},
					complete: options.complete
				});
			}
		}
	}
	emitter.regist(model, net, true);
	module.exports = model;
});