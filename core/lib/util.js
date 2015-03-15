/**
 * @fileoverview 工具函数模块
 * @author lzhspace@gmail.com 
 */
define("core/lib/util", function(require, exports, module) {
	var util = {
        cookie: {
            /**
             * 获取cookie
             * @method get
             * @param  {String} name 名称
             * @return {String} 
             */
            get: function (name) {
                var r = new RegExp("(?:^|;+|\\s+)" + name + "=([^;]*)"),
                    m = document.cookie.match(r);

                return !m ? "" : m[1];
            },
            /**
             * @method 设置cookie
             * @param {String} name 名称
             * @param {String} value 值
             * @param {String} domain 域
             * @param {String} path 路径
             * @param {String} hour 过期时间(小时)
             */
            set: function (name, value, domain, path, hour) {
                if (hour) {
                    var expire = new Date();
                    expire.setTime(expire.getTime() + 36E5 * hour);
                }
                document.cookie = name + "=" + value + "; " + (hour ? "expires=" + expire.toGMTString() + "; " : "") +
                    (path ? "path=" + path + "; " : "path=/; ") + (domain ? "domain=" + domain + ";" : "domain=" + document.domain + ";");

                return true;
            },
            /**
             * @method 删除cookie
             * @param {String} name 名称
             * @param {String} domain 域
             * @param {String} path 路径
             */
            del: function(name, domain, path) {
                document.cookie = name + "=; expires=Mon, 26 Jul 1997 05:00:00 GMT; " +
                    (path ? "path=" + path + "; " : "path=/; ") +
                    (domain ? "domain=" + domain + ";" : "domain=" + document.domain + ";");
            }
        },
        /**
         * @method 对象扩展
         */
        extend: function () {
            var len = arguments.length, 
                i = 0, 
                dest = this, 
                src, 
                deep = false,
                destIsArray;
            if(typeof src == "boolean") {
                deep = arguments[0];
                i++;
            }
            if(len > i+1) {
                dest = arguments[i] || {};
                i++;
            }
            for(; i<len; i++) {
                src = arguments[i];
                for(var name in src) {
                    if(src[name] === undefined || src[name] === null) continue;
                    if(deep && dest[name] && (destIsArray = jmeCache.isArray(dest[name]) || jmeCache.type(dest[name]) == "object")) {
                        if(destIsArray)
                            push.apply(dest[name], jmeCache.toArray(src[name]));
                        else {
                            arguments.callee(deep, dest[name], src[name]);
                        }
                    }
                    else dest[name] = src[name];
                }
            }
            return dest;
        },
        
        /**
         * @method 对象转化为URL参数
         * @param {Object} obj
         * @param {Boolean} decodeUri
         * @description 暂只支持一层对象嵌套
         */
        objectToParams: function(obj, decodeUri) {
            if(!obj) return '';
            if(typeof obj != 'object') return String(obj);
            var params = [];
            for(var key in obj) {
                params.push(key + '=' + decodeURIComponent(obj[key]));
            }
            var result = params.join('&');
            return decodeUri ? decodeURIComponent(result) : result;
        },

        /**
         * @method 路径的search部分转化为object
         * @param {String} paramStr
         * @return {Object}
         * @description 暂只支持一层对象嵌套
         */
        paramsToObject: function (paramStr) {
            var urlPara = queryStr.split('?')[1];
            urlPara = urlPara.split('&');
            var objPara = {};
            for (var i=0, item; item = urlPara[i]; i++) {
            var itemArr = item.split('=');
                objPara[itemArr[0]] = itemArr[1];
            }
            return objPara;
        },

        /**
         * @method 生成唯一ID
         * @param {Int} groupsCount 分组长度，默认为4
         * @description ID字串以4个字符为一组
         */
        uniqueId: (function() {
            var s4 = function() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }
            return function(groupsCount) {
                var uid = [];
                groupsCount = parseInt(groupsCount);
                if(!groupsCount || groupsCount <= 0) {
                    groupsCount = 4;
                }
                for(var i = 0; i < groupsCount; i++) {
                    uid.push(s4());
                }
                return uid.join('');
            }
        })()
    }
    
	module.exports = util;
});