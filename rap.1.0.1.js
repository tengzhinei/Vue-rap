/* vue-rap v1.0.0 | (c) 2018 by tengzhinei */
(function webpackUniversalModuleDefinition(root, factory) {
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define([], factory);
    else if(typeof exports === 'object')
        exports["Rap"] = factory();
    else
        root["Rap"] = factory();
})(this, function() {
    var viewLines={
    };
    var routers={};
    function urlJoin(base,url) {
        if(url.indexOf('/')==0){
            return url;
        }
        if(!(url.indexOf('/')>-1&&url.indexOf('.')>-1)){
            return base+url;
        }
        var p=base.split("/");
        p.pop();
        p.pop();
        var pre=[];
        while(url.indexOf('../')==0){
            url= url.replace("../","");
            pre.push(p.pop())
        }
        return  pre.join("/")+"/"+url;
    }

    function loadLayoutAndRely(url,rely,layout) {
        if(rely&&rely.length>0){
            for(var i=0;i<rely.length;i++){
                Rap.loadMod(urlJoin(url,rely[i]));
            }
        }
        if(layout){
            Rap.loadMod(layout);
        }
    }

    var head = document.getElementsByTagName("head")[0];

    function evalScript(modUrl,url,modName,style,template,script) {
        script="(function(url,name,style,template){\n if(Rap.debug){console.log('模块加载: '+modName);}"+script+";\nRap.$create(url,name,style,template);\n})(url,modName,style,template)\n";
        if(Rap.debug){
            script+="//@ sourceURL="+modUrl;
        }
        eval(script);
    }

    function evalJS(url,script) {
        if(Rap.debug){
            script+="//@ sourceURL="+url;
        }
        eval(script);
    }

    function addCss(id,content) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.id=id;
        style.innerHTML=content;
        head.appendChild(style);
    }

    var layoutAndRely=[];

    var compVersion={};

    var preMod=[];

    var preModLoading=false;


    function v_link_click(event,m) {
        var el=event.currentTarget;
        var link=el.getAttribute("rap-link");
        if(!link){
            console.log(el);
        }
        var replace=el.getAttribute("rap-replace");
        var back=el.getAttribute("rap-back");
        if(back=='true'){
            Rap.back();
            return;
        }
        var arg=el.getAttribute("rap-arg");
        Rap.go(link,replace=='true');
    }

    var Rap={
        config:function (config) {
            config=Object.assign({
                debug:false,
                default_page:'',
                app_version:1
            },config);
            Rap.debug = config.debug;
            if(!config.default_page){
                document.write("请配置默认页面default_page");
                return;
            }
            Rap.default_page=config.default_page;
            Rap.appVersion(config.app_version);
            if(config.comp_version){
                for(var key in config.comp_version){
                    Rap.compVersion(key,config.comp_version[key]);
                }
            }
            if(config.css){
                Rap.loadCss(config.css);
            }
            if(config.script){
                Rap.loadScript(config.script);
            }
            if(!window.Vue){
                document.write("请在script配置Vue对应的文件路径");
                return;
            }
            Rap.install(Vue);
        },
        app:function (app) {
            if(!app){
                app={}
            }
            if(!app.el){
                app.el="#app";
            }
            if(!app.mixins){
                app.mixins=[];
            }
            app.mixins.push(Rap.MainView);
            return new Vue(app);
        },
        go:function (page,replace) {
            if(replace==null){
                replace=false;
            }
            if(replace){
                history.replaceState(null,page,"#"+page);
                Rap.onhashchange();
            }
            else{
                location.href="#"+page;
            }
        },
        replace:function (page) {
            Rap.go(page,true);
        },
        back:function () {
            history.back();
        },
        install:function (Vue) {
            Vue.directive('link', {
                bind: function (el, binding, vnode) {
                    el.setAttribute("rap-link", binding.value);
                    var modifiers=binding.modifiers;
                    if(modifiers.replace){
                        el.setAttribute("rap-replace", 'true');
                    }
                    if(modifiers.back){
                        el.setAttribute("rap-back", 'true');
                    }
                    if(binding.arg){
                        el.setAttribute("rap-arg", binding.arg);
                    }
                    if(el.addEventListener) {
                        el.addEventListener('click',v_link_click,false);
                    }
                    //ie使用attachEvent，来添加事件
                    else {
                        el.attachEvent("onclick",v_link_click);
                    }
                },
                update:function (el, binding, vnode) {
                    el.setAttribute("rap-link", binding.value);
                },unbind:function (el, binding, vnode) {
                    if(el.removeEventListener){
                        el.removeEventListener("click",v_link_click,false);
                    }else{
                        el.detachEvent("click",v_link_click);
                    }
                }
            });
            Rap.init();
        },

        default_page:'',
        debug:false,
        RapAppVersion:1,
        global_router:{
            query:{},
            search:[],
            page:'',
            hash:''
        },
        baseUrl:"",
        isReady:false,
        $pageDefine:null,
        loadScript:function (url) {
            if(url instanceof Array){
                for(var i=0;i<url.length;i++){
                    Rap.loadScript(url[i]);
                }
            }else{
                var content=localStorage.getItem(url);
                if(!Rap.debug&&content){
                    evalJS(url,content);
                    return true;
                }else{
                    var xhr;
                    if (window.XMLHttpRequest) {
                        xhr = new XMLHttpRequest();//W3C
                    } else {
                        xhr = new ActiveXObject('MicroSoft.XMLHTTP');//IE
                    }
                    xhr.open('get', url, false);
                    xhr.send(null);
                    if (xhr.status == 200) {
                        content=xhr.responseText;
                        localStorage.setItem(url,content);
                        evalJS(url,content);
                        return true;
                    }
                }
                return true;
            }

        },
        loadCss:function (url) {
            if(url instanceof Array){
                for(var i=0;i<url.length;i++){
                    Rap.loadCss(url[i]);
                }
            }else{
                var content=localStorage.getItem(url);
                if(!Rap.debug&&content){
                    addCss(url,content);
                    return true;
                }else{
                    var xhr;
                    if (window.XMLHttpRequest) {
                        xhr = new XMLHttpRequest();//W3C
                    } else {
                        xhr = new ActiveXObject('MicroSoft.XMLHTTP');//IE
                    }
                    xhr.open('get', url, false);
                    xhr.send(null);
                    if (xhr.status == 200) {
                        content=xhr.responseText;
                        localStorage.setItem(url,content);
                        addCss(url,content);
                        return true;
                    }
                }
                return true;
            }

        },
        compVersion:function(mod,version){
            compVersion[mod]=version;
        },
        define:function () {
            var layout=null;
            var rely=null;
            var config=null;
            if(arguments.length>2){
                layout=arguments[0];
                rely=arguments[1];
                config=arguments[2]
            }else if(arguments.length>1){
                rely=arguments[0];
                config=arguments[1]
            }else{
                config=arguments[0];
            }
            this.$pageDefine={layout:layout,
                rely:rely,
                config:config};
        },
        appVersion:function (version) {
            Rap.RapAppVersion=version;
            var rapAppVersion=localStorage.getItem('RapAppVersion');
            if(rapAppVersion&&rapAppVersion!=Rap.RapAppVersion){
                localStorage.clear();
            }
            localStorage.setItem('RapAppVersion',Rap.RapAppVersion);
        },
        init:function () {
            Rap.isReady=true;
            localStorage.setItem('RapAppVersion',Rap.RapAppVersion);
            if(layoutAndRely.length>0){
                for(var i=0;i<layoutAndRely.length;i++){
                    var param=layoutAndRely[i];
                    loadLayoutAndRely(param.url,param.rely,param.layout);
                }

            }
            Rap.onhashchange();
        },
        $create:function (url,name,style,template) {
            var  modName=name;
            var layout=this.$pageDefine.layout;
            if(layout){
                layout=urlJoin(url,layout);
            }
            var rely=this.$pageDefine.rely;
            var config=this.$pageDefine.config;
            config.template=template;
            if(layout){
                viewLines[modName]=layout.split('/').join('_');
            }
            var childMixin = {
                data:function () {
                    return  {
                        router:Rap.global_router,
                        RapViews:RapShareData.RapViews,
                        childView:null
                    };
                },
                watch: {
                    'router':{
                        handler: function () {
                            var init = this.$options.init;
                            if(init){
                                init.apply(this,[Rap.global_router.query,Rap.global_router.search]);
                            }
                        },
                        deep: true
                    },'RapViews.index':function () {
                        this.$options.RapViews.apply(this);
                    }
                },
                RapViews:function () {
                    var index=-1;
                    for(var i=0;i<this.RapViews.items.length;i++){
                        var name=this.RapViews.items[i];
                        if(name==modName){
                            index=i;
                        }
                    }
                    if(index+1<this.RapViews.items.length){
                        this.childView=this.RapViews.items[index+1];
                    }
                },
                beforeCreate:function () {

                },
                created: function () {
                    if(style){
                        addCss(modName,style);
                    }
                    this.$options.RapViews.apply(this);
                },
                activated:function () {
                    var el=document.getElementById(modName);
                    if(style&&!el){
                        addCss(modName,style);
                    }
                },
                deactivated:function () {
                    var el=document.getElementById(modName);
                    if(el){
                        el.parentElement.removeChild(el);
                    }

                },
                mounted:function () {
                    var init = this.$options.init;
                    if(init){
                        init.apply(this,[Rap.global_router.query,Rap.global_router.search]);
                    }
                },
                destroyed:function () {
                    var el=document.getElementById(modName);
                    if(el){
                        el.parentElement.removeChild(el);
                    }
                },
                methods: {

                }
            };
            if(!config.mixins){
                config.mixins=[];
            }
            config.mixins.push(childMixin);
            Vue.component(modName, config);
            if(Rap.isReady){
                loadLayoutAndRely(url,rely,layout);
            }else{
                layoutAndRely.push({
                   'url': url,
                    'rely':rely,
                    'layout':layout
                })
            }
            delete Rap.$pageDefine;
        },
        loadUrl:function(url) {
            var path=url.split('/');
            var m=[];
            for(var i=0;i<path.length;i++){
                var item=path[i];
                if(!(parseInt(item)+""==item||item.indexOf('@')==0)){
                    m.push(item);
                }
            }
            path=m;
            Rap.global_router.page=path.join('/');
            var as=routers[ Rap.global_router.page];
            if(as){
                if(isFunction(as)){
                    as(Rap.global_router.query,Rap.global_router.search);
                }else{
                    Rap.global_router.page=as;
                }
                return;
            }
            var modName=Rap.global_router.page.split('/').join('_');
            if(Vue.component(modName)){
                Rap.onViewChangeCallBack(modName);
            }else{
                this.loadMod(Rap.global_router.page);
                Rap.onViewChangeCallBack(modName);
            }
        },
        /**
         * 预加载模块 异步队列加载的
         */
        preComp:function (url) {
            if(url instanceof Array){
                for(var i=0;i<url.length;i++){
                    var u=url[i];
                    var loadU=u;
                    u=u.substr(u.indexOf('/')==0?1:0);
                    var path=u.split('/');
                    var modName=path.join('_');
                    if(Vue.component(modName)){
                      continue;
                    }
                    preMod.push(loadU);
                }
            }else{
                url=url.substr(url.indexOf('/')==0?1:0);
                var path=url.split('/');
                var modName=path.join('_');
                if(Vue.component(modName)){
                    return;
                }
                preMod.push(url);
            }
            if(preMod.length==0||preModLoading)return true;
            preModLoading=true;
            setTimeout(function () {
                while(preMod.length>0){
                    var url= preMod.shift();
                    Rap.loadMod(url);
                }
                preModLoading=false;
            },100);
        },
        /**
         * 同步加载模块
         * @param url
         */
        loadMod:function (url) {
            url=url.substr(url.indexOf('/')==0?1:0);
            var modUrl=this.baseUrl+url;
            var path=url.split('/');
            var modName=path.join('_');
            path.pop();
            url=path.join("/")+"/";
            if(Vue.component(modName)){
                return;
            }
            var key=modUrl+'.ver';
            var key_content=modUrl+'.json';
            var version=Rap.RapAppVersion;
            if(compVersion[modUrl]){
                version=compVersion[modUrl];
            }
            if(!Rap.debug){
                var content= localStorage.getItem(key);
                if(content){
                   if(content==version){
                       content=localStorage.getItem(key_content);
                       var json=JSON.parse(content);
                       evalScript(modUrl+".js",url,modName,json.style,json.template,json.script);
                       return;
                   }else{
                       localStorage.removeItem(key_content);

                   }
                }
            }
            var xhr;
            if (window.XMLHttpRequest) {
                xhr = new XMLHttpRequest();//W3C
            } else {
                xhr = new ActiveXObject('MicroSoft.XMLHTTP');//IE
            }
            xhr.open('get', modUrl+'.html?version='+version, false);
            xhr.send(null);
            if (xhr.status == 200) {
                var el=document.createElement('div');
                el.innerHTML=xhr.responseText;
                var style="";
                var template="";
                var script="";
                for(var i=0;i<el.children.length;i++) {
                    var child = el.children[i];
                    if (child.tagName == "STYLE"){
                        style=child.innerHTML.trim();
                    }
                    if (child.tagName == "TEMPLATE"){
                        template=child.innerHTML;
                    }
                    if (child.tagName == "SCRIPT"){
                        script=child.innerHTML;
                    }
                }
                var lc={
                    style:style,
                    template:template,
                    script:script
                };

                localStorage.setItem(key,version);
                localStorage.setItem(key_content,JSON.stringify(lc));
                evalScript(modUrl+".js",url,modName,style,template,script);
            } else {
                console.log('url:'+modUrl+" get error" + xhr.status + 'message：' + xhr.statusText)
            }
        },
        $query:function () {
            var hash=window.location.hash;
            var query={};
            if(hash.indexOf('?')>-1){
                hash=hash.substr(hash.indexOf('?')+1);
                var qs=hash.split('&');
                for(var i=0;i<qs.length;i++){
                    var q=qs[i];
                    if(!q)continue;
                    var kv=q.split('=');
                    query[kv[0]]=kv[1];
                }
            }
            return query;
        },
        $search:function (ids) {
            var hash=window.location.hash;
            hash=hash.substr(hash.indexOf('/')==1?2:1);
            if(hash.indexOf('?')>-1){
                hash=hash.substr(0,hash.indexOf('?'));
            }
            var path=hash.split('/');

            var m=[];
            var args=arguments;
            for(var i=0;i<path.length;i++){
                var item=path[i];
                if(parseInt(item)+""==item){
                    m.push(item);
                }else if(item.indexOf('@')==0){
                    m.push(item.substr(1));
                }
            }
            if(args.length>0){
                var result={};
                for(i=0;i<args.length;i++){
                    result[args[i]]=m[i];
                }
                return result;
            }
            return m;
        },
        onhashchange:function (e) {
            console.log(e);
            var hash=window.location.hash;
            if(!hash&&Rap.default_page){
                window.location.href="#"+Rap.default_page;
                return;
            }
            hash=hash.substr(hash.indexOf('/')==1?2:1);
            Rap.global_router.hash=hash;

            if(hash.indexOf('?')>-1){
                hash=hash.substr(0,hash.indexOf('?'));
            }
            for(var key in Rap.global_router.query){
                delete Rap.global_router.query[key]
            }
            var query=Rap.$query();
            for(var key in query){
                var value=query[key];
                if(parseInt(value)+""==value){
                    value=parseInt(value);
                }
                Vue.set(Rap.global_router.query,key,value);
            }
            Rap.global_router.search.length=0;
            var search=Rap.$search();
            for(var  i=0;i<search.length;i++){
                var value=search[i];
                if(parseInt(value)+""==value){
                    value=parseInt(value);
                }
                Rap.global_router.search.push(value);
            }

            Rap.loadUrl(hash);
        },
        onViewChangeCallBack:null,
        onViewChange: function(fun) {
            this.onViewChangeCallBack=fun;
        },
        router:function (hash,as) {
            hash=hash.substr(hash.indexOf('/')==0?1:0);
            as=as.substr(as.indexOf('/')==0?1:0);
            routers[hash]=as;
        }
    };

    var RapShareData= {
        RapViews:{
            index:1,
            items:[]
        },
        router:Rap.global_router,
        childView:''
    };

    Rap.MainView={
        data: function() {
            return RapShareData;
        },
        watch: {
            'RapViews.index':{
                handler:function () {
                    this.childView=this.RapViews.items[0];
                },deep:true
            }
        },
        created:function () {
            if(this.RapViews.items.length>0){
                this.childView=this.RapViews.items[0];
            }
        }
    };

    function currentItems(items,view) {
        items.push(view);
        var layout=viewLines[view];
        if(layout){
            currentItems(items,layout);
        }
    }

    Rap.onViewChange(function (view) {
        var items=[];
        currentItems(items,view);
        items=items.reverse();
        RapShareData.RapViews.items=items;
        RapShareData.RapViews.index++;
    });
    window.addEventListener("popstate", Rap.onhashchange, false);
    return Rap;
});