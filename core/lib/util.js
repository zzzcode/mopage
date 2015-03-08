/**
 * @fileoverview 工具模块
 * @author lzhspace@gmail.com 
 */
define("core/lib/util", function(require, exports, module) {
    var csrfCode;

    var tempDiv = document.createElement('div');

    var vendors = ['webkit', 'ms', 'o', 'moz'];
    var vendor, name = 'transform', _name;
    var style = document.createElement('div').style;
    _name = name.charAt(0).toUpperCase() + name.substr(1);
    for(var i = 0, one; one = vendors[i]; i++){
        _name = one + _name;
        if (_name in style) {
            vendor = one;
            break;
        }
    }
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
         * @method 模版函数
         * @param {String} str 模版字符串
         * @param {String} param 参数对象
         * @return {String} HTML
         */
        tmpl: function(str, param) {
            if (!str) {
                return '';
            }
            
            param = param || {};
            var fn = ['var __=[];'];

            // 获取模版中的html字符串，变量以及执行的语句
            var re = /([\s\S]*?)(?:(?:<%([^=][\s\S]*?)%>)|(?:<%=([\s\S]+?)%>)|$)/g;
            re.lastIndex = 0;
            var m = re.exec(str || '');

            // html字串和Javascript代码分离
            while (m && (m[1] || m[2] || m[3])) {
                // html字符串
                m[1] && fn.push('__.push(\'', m[1], '\');');

                // Javascript执行语句
                m[2] && fn.push(m[2]);

                // Javascript变量
                m[3] && fn.push('__.push(this.htmlEncode(', m[3], '));');

                m = re.exec(str);
            }
            fn.push('return __.join(\'\');');
            var args = [], argv = [];
            for (var key in param) {
                args.push(key);
                argv.push(param[key]);
            }

            // 构造执行函数，并填充数据
            fn = new Function(args.join(','), fn.join(''));
            return fn.apply(util, argv);
        },
        /**
         * @method html编码
         * @param {string} str
         */
        htmlEncode: function(str) {
            tempDiv.innerHTML = '';
            (tempDiv.textContent != null) ? (tempDiv.textContent = str) : (tempDiv.innerText = str); 
            return tempDiv.innerHTML; 
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

        isDom: function(obj) {
            if(typeof HTMLElement == 'undefined') {
                return !!obj.nodeType
            }
            else {
                return obj instanceof HTMLElement;
            }
        },

        /**
         * @method 简单选择器
         * @param {String} selector
         * @param {HTMLElement|selector} context
         * @description 支持简单选择器(ID, Class, Attribute, Tag)
         */
        dom: function(selector, context) {
            if(!selector) return null;
            if(this.isDom(selector)) return selector;
            if(typeof context == 'string') {
                context = this.dom(context);
            }
            context = context || document;
            var domReg = /^(?:(#)|(\.)|(\@))?([\w\u00c0-\uFFFF\-]+)$/;
            var match = domReg.exec(selector); 
            if (match && match[4]) {
                var val = match[4];
                if (match[1]) {//  匹配ID
                    return document.getElementById(val);
                }
                else if (match[2]) {// 匹配Class
                    return context.getElementsByClassName(val);
                }
                else if (match[3]) {// 匹配Name
                    return context.getElementsByName(val);
                }
                else if (match[4]) { // 匹配TAG
                    return context.getElementsByTagName(val);
                }
            }
            return null;
        },
        /**
         * @method 设置classname
         * @param {HTMLElement} dom
         * @param {String} className
         * @param {Boolean} isRemove 是否移除
         */
        setClass: function(dom, className, isRemove) {
            if(!className) return;
            var oriClass = dom.className, newClass = [], classMap = {};
            if(oriClass) {
                oriClass = oriClass.split(' ');
                for(var i = 0, len = oriClass.length; i < len; i++) {
                    oriClass[i] && (classMap[oriClass[i]] = 1);
                }
            }
            className = className.split(' ');
            for(var i = 0, len = className.length; i < len; i++) {
                className[i] && (classMap[className[i]] = isRemove ? 0 : 1);
            }
            for(var key in classMap) {
                classMap[key] && newClass.push(key);
            }
            dom.className = newClass.join(' ');
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
         * @method 插入HTML字串
         * @param {HTMLElement} dom
         * @return {String} htmlStr
         */
        appendHtml: function(dom, htmlStr) {
            tempDiv.innerHTML = htmlStr;
            var children = tempDiv.children;
            while(children && children[0]) {
                dom.appendChild(children[0]);
            }
        },
        /**
         * @method 插入内部样式
         * @param  {string | Array} rules 样式
         * @param  {string} id 样式节点Id
         * @author evanyuan
         */
        insertStyle: (function() {
            var _insertStyle = function (rules, id) {
                var doc = document, node = doc.createElement("style");
                node.type = 'text/css';
                id && (node.id = id);
                document.getElementsByTagName("head")[0].appendChild(node);
                if (rules) {
                    if (typeof(rules) === 'object') {
                        rules = rules.join('');
                    }
                    if (node.styleSheet) {
                        node.styleSheet.cssText = rules;
                    } else {
                        node.appendChild(document.createTextNode(rules));
                    }
                }
            };
            return function (rules, id) {
                if (id) {
                    !document.getElementById(id) && _insertStyle(rules, id);
                } 
                else {
                    _insertStyle(rules, id);
                }
            }
        })(),
        
        /**
         * 获取防CSRF串
         * @method getACSRFToken
         * @return {String} 验证串
         */
        getACSRFToken: function () {
            if (!csrfCode) {
                var s_key = this.cookie.get('skey'),
                hash = 5381;
                if (!s_key) {
                    return '';
                }
                for (var i = 0, len = s_key.length; i < len; ++i) {
                    hash += (hash << 5) + s_key.charCodeAt(i);
                }
                csrfCode = hash & 0x7fffffff;
            }
            return csrfCode;
        },
        getUin: function() {
            return '';
        },
        /**
         * @name 状态参数
         */
        support: {
            vendor: vendor
        },
        /**
         * @method 更新浏览器参数
         */
        updateBrowserInfo: function() {
            util.support.windowWidth = window.innerWidth;
            util.support.windowHeight = window.innerHeight;
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
        })(),

        /**
         * @method transform动画
         * @param {HTMLElement} dom dom元素
         * @param {String} value 设置的值
         * @param {Int} duration 动画持续事件（可选）
         * @param {Function} cb 动画结束回调函数（可选）
         * @description 除了支持一般的transform元素，额外支持opacity
         */
        transform: (function() {
            var timerThreshold = 500;
            var transformName, transformNameHump, transitionName;
            transformName = ['-', vendor, '-transform'].join('');
            transformNameHump = vendor + "Transform";
            transitionName = vendor + 'Transition';
            var opacityReg = /opacity\(([\d\.]+)\)/;

            return function(dom, value, duration, cb) {
                if(!value) return;
                var opacity, hasOpacity = false;
                if(opacityReg.test(value)) {
                    value = value.replace(opacityReg, '');
                    opacity = RegExp.$1;
                    hasOpacity = true;
                }

                if(!duration) {
                    value && (dom.style[transformNameHump] = value);
                    hasOpacity && (dom.style['opacity'] = opacity);
                }
                else {
                    var transitionValue = '';
                    value && (transitionValue += [transformName, ' ', duration, 'ms ease-out'].join(''));
                    hasOpacity && (transitionValue += ['opacity ', duration, 'ms ease-out'].join(''));
                    dom.style[transitionName] = transitionValue;
                    dom.transitionEnd && dom.removeEventListener(vendor + 'TransitionEnd', dom.transitionEnd, false);
                    dom.transitionEnd = function() {
                        dom.removeEventListener(vendor + 'TransitionEnd', arguments.callee, false);
                        clearTimeout(dom.timer);
                        dom.style[transitionName] = '';
                        cb && cb.call(dom);
                    }
                    dom.addEventListener(vendor + 'TransitionEnd', dom.transitionEnd, false);
                    clearTimeout(dom.timer);
                    dom.timer = setTimeout(dom.transitionEnd, duration + timerThreshold);
                    value && (dom.style[transformNameHump] = value);
                    hasOpacity && (dom.style['opacity'] = opacity);
                }
            }
        })(),
        applyRender: function() {
            document.body.offsetHeight;
        }
    }
    util.updateBrowserInfo();

    // 待优化
    util.support.os = {};
    var userAgent = navigator.userAgent;
    if((/iPhone|iPad|iPod|iOS/i).test(userAgent)) {
        util.support.os.ios = true;
        var v = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        util.support.os.version = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
    }
    else if((/Android/i).test(userAgent)) {
        util.support.os.android = true;
        // todo
    }
    util.support.browser = {};
    // todo

	module.exports = util;
});