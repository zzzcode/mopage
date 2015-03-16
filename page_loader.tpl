<script type="text/javascript">
var buildLoader = (function(win, doc, undefined) {

    /**
     * @constructor
     */
    var Loader = function(loaderConfig) {
        if(typeof loaderConfig !== 'object') throw 'no loader config';

        config = makeConfig(loaderConfig);
        storable = config.debug ? false : checkStorable();

        this.Status = Status;
        this.startup = startup;
        this.loadModule = loadModule;
        this.checkModuleExist = checkModuleExist;

        // 往window对象写入loader引用
        win.loader = this;

        return this;
    }

    /**
     * 模块加载状态
     * @enum {number}
     */
    var Status = { SUCCESS: 0, NOT_FOUND: 1, ERROR: 2 };

    /**
     * 记录已执行过的模块
     * @type {object}
     */
    var definedModules = {};

    /**
     * seajs还没准备好时，用以缓存模块
     * @type {object}
     */
    var unReadyModules = {};

    /**
     * 记录已执行过的模块
     * @type {object}
     */
    var loadingModules = {};

    /**
     * 加载器配置
     * @type {object}
     */
    var config;

    /**
     * 是否使用本地存储
     * @type {boolean}
     */
    var storable;

    /**
     * 引用seajs原来的define函数
     * @type {function}
     */
    var oriSeajsDefine;

    /**
     * 生成config配置
     * @param {object} userConfig 用户配置
     */
    var makeConfig = function(userConfig) {
        var config = {
            debug: win.location.href.indexOf('debug_online') > 0,
            appName: 'app',
            entryModule: 'core',
            seajsModule: 'core/lib/sea'
        }
        
        /**
         * cdn地址
         */
         if(!userConfig.cdnHost) throw '[cdnHost] missing';
         config.cdnHost = userConfig.cdnHost;

        /**
         * cdn路径
         */
        if(!userConfig.cdnPath) throw '[cdnPath] missing';
        config.cdnPath = userConfig.cdnPath;

        /**
         * cdn合并请求标记
         */
        if(!userConfig.combineMark) throw '[combineMark] missing';
        config.combineMark = userConfig.combineMark;

        /**
         * @name 记录JS文件版本
         */
        if(!userConfig.moduleFileMap) throw '[moduleFileMap] missing';
        config.moduleFileMap = userConfig.moduleFileMap;

        /**
         * 记录模块依赖信息
         * @description 用以预加载模块
         */
        if(!userConfig.moduleDeps) throw '[moduleDeps] missing';
        config.moduleDeps = userConfig.moduleDeps;

        /**
         * 是否debug模式
         * @description 只要有一个为true即为true
         */
        config.debug = config.debug || !!userConfig.debug;

        /**
         * app名称（模块前缀）
         */
        userConfig.appName && (config.appName = userConfig.appName);

        /**
         * 入口模块
         */
        userConfig.entryModule && (config.entryModule = userConfig.entryModule);

        /**
         * 关键模块预加载
         * @description 预加载模块名字，支持“*”通配，单一个“*”表示所有模块
         */
        userConfig.keyModules && (config.keyModules = userConfig.keyModules);

        /**
         * 关键页面预加载
         * @description 此预加载变量基于页面路径，命中以下pathname会预先加载
         */
        userConfig.keyPaths && (config.keyPaths = userConfig.keyPaths);

        /**
         * seajs模块
         * @description 不建议修改
         */
        userConfig.seajsModule && (config.seajsModule = userConfig.seajsModule);

        return config;
    }

    /**
     * 执行入口
     */
    var startup = function() {
        win.define = define;
        win.defineSeajs = defineSeajs;
        /**
         * 并行加载seajs模块和业务模块
         */
        loadSeajs(loadComplete);
        loadModule(getInitialModules(), loadComplete);
    }

    /**
     * 替换seajs原有define方法
     * @param {string} module 模块名
     * @param {function} moduleConstructor 模块构造器
     */
    var define = function(module, moduleConstructor) {
        definedModules[module] = 1;
        if(loadingModules[module]) {
            localClear(module);
            localSave(module, genSeajsModuleCode(module, moduleConstructor.toString()));
            loadingModules[module] = null;
        }
        if(oriSeajsDefine) {
            oriSeajsDefine(module, moduleConstructor);
        }
        else {
            unReadyModules[module] = moduleConstructor;
        }
    }

    /**
     * seajs专用
     * @param {function} seajsMaker seajs构造器
     */
    var defineSeajs = function(module, seajsMaker) {
        if(loadingModules[config.seajsModule]) {
            localClear(config.seajsModule);
            localSave(config.seajsModule, seajsMaker.toString());
            loadingModules[config.seajsModule] = null;
        }
        seajsMaker.call(win);
        var mapData = [];
        for(var key in config.moduleFileMap) {
            mapData.push([ key, config.moduleFileMap[key].replace(/.js$/, '') ]);
        }
        seajs.config({ 
            base: config.cdnHost + config.cdnPath,
            map: mapData
        });
        if(win.define == define) {
            throw 'define function conflict';
        }
        oriSeajsDefine = win.define;
        win.define = define;
        for(var module in unReadyModules) {
            define(module, unReadyModules[module]);
        }
        unReadyModules = null;
        win.defineSeajs = null;
        seajsMaker = null;
    }

    /**
     * 获取初始加载的模块
     */
    var getInitialModules = function() {
        var reg, modules = [ config.entryModule ];
        if(isArray(config.keyModules) && config.keyModules.length) {
            for(var i = 0, one; one = config.keyModules[i]; i++) {
                if(one.indexOf('*') >= 0) {
                    reg = new RegExp(one.replace(/\*/g, '\\w+'));
                    for(var module in config.moduleFileMap) {
                        if(module == config.seajsModule) continue;
                        if(reg.test(module)) {
                            modules.push(module);
                        }
                    }
                }
                else {
                    modules.push(one);
                }
            }
        }
        if(typeof config.keyPaths == 'object' && config.keyPaths[win.location.pathname]) {
            modules.push(config.keyPaths[win.location.pathname]);
        }

        return modules;
    }

    /**
     * 加载首页模块回调函数
     * @param {ENUM} status 加载完成状态
     */
    var loadComplete = function(status) {
        if(status !== Status.SUCCESS) {
            if(loadComplete.errCall) return;
            var div = document.createElement('div');
            div.innerHTML = '<p style="margin:100px auto;text-align:center;">加载基础模块失败，<a href="">点击这里</a>刷新</p>';
            doc.body.appendChild(div);
            loadComplete.errCall = true;
            return;
        }
        !loadComplete.enterCount && (loadComplete.enterCount = 0);
        loadComplete.enterCount++;
        if(loadComplete.enterCount == 2) {
            seajs.use(config.entryModule, function(entry) {
                entry(config.appName);
            });
        }
    }

    /**
     * 模块加载
     * @param {String|Array} modules
     * @param {function} cb
     */ 
    var loadModule = function(modules, cb) {
        var result = checkModuleExist(modules);
        if(result.notExistModules.length) {
            console.error('modules[' + result.notExistModules.join(',') + '] do not exist');
            cb(Status.NOT_FOUND);
        }
        else {
            var depsMap = parseDependencies(modules);
            var needLoadModules = [];
            for(var module in depsMap) {
                if(!definedModules[module]) {
                    var localCode = localGet(module);
                    if(storable && localCode) {
                        win.eval(localCode);
                    }
                    else {
                        needLoadModules.push(module);
                    }
                }
            }
            if(needLoadModules.length) {
                moduleRequest(needLoadModules, cb);
            }
            else {
                cb(Status.SUCCESS);
            }
        }
    }

    /**
     * 检查模块是否存在
     * @param {Array|String} module
     */
    var checkModuleExist = function(module) {
        var existModules = [], notExistModules = [];
        if(!isArray(module)) {
            if(!resolve(module)) {
                notExistModules.push(module);
            }
        }
        else {
            for(var i = 0, one; one = module[i]; i++) {
                if(resolve(one)) {
                     existModules.push(one);
                }
                else {
                    notExistModules.push(one);
                }
            }
        }
        return { existModules: existModules, notExistModules: notExistModules };
    }

    /**
     * 加载seajs
     * @param {function} cb
     */
    var loadSeajs = function(cb) {
        var localCode = localGet(config.seajsModule);
        if(localCode) {
            var seajsMaker = win.eval('(' + localCode + ')');
            defineSeajs(config.seajsModule, seajsMaker);
            cb(Status.SUCCESS);
        }
        else {
            moduleRequest(config.seajsModule, cb);
        }
    }

    /**
     * 根据依赖表分析模块依赖
     * @param {Array|String} modules
     */
    var parseDependencies = function(modules, depsMap) {
        if(!isArray(modules)) {
            modules = [modules];
        }
        var depsMap = depsMap || {};
        for(var i = 0, module; module = modules[i]; i++) {
            depsMap[module] = 1;
            if(config.moduleDeps[module]) {
                var deps = config.moduleDeps[module];
                for(var j = 0, one; one = deps[j]; j++) {
                    if(!depsMap[one]) {
                        parseDependencies(one, depsMap);
                    }
                }   
            }
        }
        return depsMap;
    }

    var resolve = function(module) {
        return config.moduleFileMap[module];
    }

    var checkStorable = function() {
        var storable = true;
        try {
            var key = '_store_test';
            localStorage[key] = 'abc';
            if(localStorage[key] !== 'abc') {
                storable = false;
            }
            localStorage.removeItem(key);
        }
        catch(_) {
            storable = false;
        }
        return storable;
    }

    var parseModuleToPath = function(module) {
        if(!module) return [];
        var paths = [];
        if(isArray(module)) {
            if(module.length == 1) {
                loadingModules[module[0]] = 1;
                paths.push(config.cdnPath + resolve(module[0]));
            }
            else {
                var urlLength = 1024,
                    curPaths = [],
                    maxPathLength = urlLength - config.cdnHost.length - config.combineMark.length, 
                    curTotalLength = 0, 
                    tmpLength = 0, tmpPath;
                for(var i = 0, one; one = module[i]; i++) {
                    loadingModules[one] = 1;
                    tmpPath = '/' + config.cdnPath + resolve(one);
                    tmpLength = tmpPath.length;
                    if(curTotalLength + tmpLength > maxPathLength) {
                        paths.push(config.combineMark + curPaths.join(','));
                        curPaths = [];
                        curTotalLength = 0;
                    }
                    curPaths.push(tmpPath);
                    curTotalLength += tmpLength + 1;
                }
                if(curPaths.length) {
                    paths.push(config.combineMark + curPaths.join(','));
                }
            }
        }
        else {
            loadingModules[module] = 1;
            paths.push(config.cdnPath + resolve(module));
        }
        return paths;
    }

    var moduleRequest = function(module, cb) {
        var paths = parseModuleToPath(module);
        var count = paths.length;
        if(!count) return;
        var _cb = cb;
        if(count > 1) {
            _cb = function(status) {
                if(--count == 0 || status != Status.SUCCESS) {
                    !_cb.hasCall && cb(status);
                    _cb.hasCall = true;
                }
            }
        }
        for(var i = 0, path; path = paths[i]; i++) {
            scriptLoad(path, _cb);
        }
    }

    var genSeajsModuleCode = function(module, constructorStr) {
        return ['define("', module, '",', constructorStr, ');'].join('');
    }

    var scriptLoad = function(scriptPath, cb) {
        var el = doc.createElement('script');
        el.setAttribute('type', 'text/javascript');
        el.setAttribute('src', config.cdnHost + scriptPath);
        el.setAttribute('async', true);
        el.onerror = function() {
            cb && cb(Status.ERROR);
            el.onerror = null;
            el.parentNode.removeChild(el);
            el = null;
        };
        el.onload = el.onreadystatechange = function() {
            if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                cb && cb(Status.SUCCESS);
            }
            el.onload = el.onreadystatechange = null;   
            el.parentNode.removeChild(el);
            el = null;
        }
        doc.getElementsByTagName("head")[0].appendChild(el);
    }

    var localGet = function(module) {
        if(storable) {
            return localStorage[resolve(module)];
        }
        return '';
    }

    var localSave = function(module, code) {
        if(storable) {
            localStorage[resolve(module)] = code;
        }
    }

    var localClear = function(module) {
        if(!storable) return;
        for (var key in win.localStorage) { 
            var stoName = key.substring(0, key.indexOf('.')); 
            if (module == stoName) {
                localStorage.removeItem(key);
                break;
            };
        } 
    }

    var isArray = function(target) {
        if(!target) return false;
        return Object.prototype.toString.call(target) === '[object Array]';
    }

    return Loader;
})(window, document);
</script>