/**
 * @fileoverview 超轻量级DOM操作工具
 * @author lzhspace@gmail.com
 */

define("core/lib/dom", function(require, exports, module) {

	var tempDiv = document.createElement('div');

	/**
	 * 浏览器厂商初始化
	 */
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

	/**
     * @method 设置classname
     * @param {HTMLElement} element
     * @param {String} className
     * @param {Boolean} isRemove 是否移除
     */
    var toggleClass = function(element, className, isRemove) {
        if(!className) return;
        var oriClass = element.className, newClass = [], classMap = {};
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
        element.className = newClass.join(' ');
    }

    var dom = {
        /**
         * @method 简单选择器
         * @param {String} selector
         * @param {HTMLElement|selector} context
         * @description 支持简单选择器(ID, Class, Attribute, Tag)
         * @return {HTMLElement}
         */
        query: function(selector, context) {
            if(!selector) return null;
            if(this.isDom(selector)) return selector;
            if(typeof context == 'string') {
                context = this.query(context);
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
            return context.querySelectorAll(selector);
        },

        /**
	     * @method 添加classname
	     * @param {HTMLElement} element
	     * @param {String} className
	     */
        addClass: function(element, className) {
        	toggleClass(element, className);
        },

        /**
	     * @method 移除classname
	     * @param {HTMLElement} element
	     * @param {String} className
	     */
        removeClass: function(element, className) {
        	toggleClass(element, className, true);
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
            return fn.apply(dom, argv);
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
         * @method 插入HTML字串
         * @param {HTMLElement} element
         * @return {String} htmlStr
         */
        appendHtml: function(element, htmlStr) {
            tempDiv.innerHTML = htmlStr;
            var children = tempDiv.children;
            while(children && children[0]) {
                element.appendChild(children[0]);
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


        isDom: function(obj) {
            if(typeof HTMLElement == 'undefined') {
                return !!obj.nodeType
            }
            else {
                return obj instanceof HTMLElement;
            }
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
            dom.support.windowWidth = window.innerWidth;
            dom.support.windowHeight = window.innerHeight;
        },


        /**
         * @method transform动画
         * @param {HTMLElement} element dom元素
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

            return function(element, value, duration, cb) {
                if(!value) return;
                var opacity, hasOpacity = false;
                if(opacityReg.test(value)) {
                    value = value.replace(opacityReg, '');
                    opacity = RegExp.$1;
                    hasOpacity = true;
                }

                if(!duration) {
                    value && (element.style[transformNameHump] = value);
                    hasOpacity && (element.style['opacity'] = opacity);
                }
                else {
                    var transitionValue = '';
                    value && (transitionValue += [transformName, ' ', duration, 'ms ease-out'].join(''));
                    hasOpacity && (transitionValue += ['opacity ', duration, 'ms ease-out'].join(''));
                    element.style[transitionName] = transitionValue;
                    element.transitionEnd && element.removeEventListener(vendor + 'TransitionEnd', element.transitionEnd, false);
                    element.transitionEnd = function() {
                        element.removeEventListener(vendor + 'TransitionEnd', arguments.callee, false);
                        clearTimeout(element.timer);
                        element.style[transitionName] = '';
                        cb && cb.call(element);
                    }
                    element.addEventListener(vendor + 'TransitionEnd', element.transitionEnd, false);
                    clearTimeout(element.timer);
                    element.timer = setTimeout(element.transitionEnd, duration + timerThreshold);
                    value && (element.style[transformNameHump] = value);
                    hasOpacity && (element.style['opacity'] = opacity);
                }
            }
        })(),
        applyRender: function() {
            document.body.offsetHeight;
        }
    }

    dom.updateBrowserInfo();

    // 待完善
    dom.support.os = {};
    var userAgent = navigator.userAgent;
    if((/iPhone|iPad|iPod|iOS/i).test(userAgent)) {
        dom.support.os.ios = true;
        var v = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        dom.support.os.version = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
    }
    else if((/Android/i).test(userAgent)) {
        dom.support.os.android = true;
        // todo
    }
    dom.support.browser = {};
    // todo

    module.exports = dom;

});