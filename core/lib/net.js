/**
 * @fileoverview 通信模块
 * @author lzhspace@gmail.com 
 */
define(function(require, exports, module) {
	var util = require('core/lib/util');
    var emitter = require('core/lib/emitter');

    var net = {
        ajax: function(options) {
            var xhr = new XMLHttpRequest();
            net.emit('send', [ options ]);
            xhr.open(method, options.url, true);
            var _startTime = new Date();
            xhr.onreadystatechange = function() {
                if(this.readyState == 4) {
                    xhr.costTime = new Date() - _startTime
                    if(this.status == 200) {
                        net.emit('success', [ xhr, options ]);
                        options.success && options.success(xhr.responseText);
                    }
                    else {
                        net.emit('error', [ xhr, options ]);
                        options.error && options.error(xhr);
                    }
                    net.emit('complete', [ xhr, options ]);
                    options.complete && options.complete(xhr);
                }
            }
            xhr.send(util.objectToParams(options.data));
        },
        get: function(url, success, error) {
            this.ajax({
                url: url,
                method: 'get',
                success: success,
                error: error
            });
        },
        post: function(url, data, success, error) {
            this.ajax({
                url: url,
                method: 'post',
                data: data,
                success: success,
                error: error
            });
        }
    }

    emitter.regist(net);

    module.exports = net;
});