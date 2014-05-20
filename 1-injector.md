## 关于

AngularJS 是 Google 推出的开源 JavaScript MV*（MVW、MVVM、MVC）框架，其通过为开发者呈现一个更高层次的抽象来简化应用的开发。在这里推荐一篇简短的文章：[专访AngularJS框架创始人Misko Hevery：让Web开发更便捷](http://www.csdn.net/article/2013-10-08/2817118-AngularJS-Framework-Google)。这篇文章对还未接触过 AngularJS 的同学来说是最好的介绍。

虽然相关的介绍，教程，示例以及书籍已经非常之多，但是用过 AngularJS 的工程师们都会有登堂易，入室难的感觉。下图是 Google 到的 AngularJS 学习曲线。
![AngularJS Learning Curve](http://nathanleclaire.com/images/smooth-angular-tips/js-learning-curves.jpeg)

从我个人学习使用 AngularJS 一年多的经验来看，官方文档太过简单，而很多教程，示例甚至是书籍其实都是照搬官方文档或者稍作修改而已，浪费大量时间不说，对我们的提高帮助非常有限。因此，我选择研究源代码的方式进行学习或者解决问题，受益匪浅。本系列 AngularJS 源代码分析是我对阿里云UED团队内部 AngularJS 培训的文字记录。

目前angularjs已经在阿里云大面积应用，大到云产品控制台、小到移动端，后续还会应用到官网售卖流程中。希望通过源码解析的系列分享让更多的内部同学能够对 AngularJS 应用自如，同时也希望更多BU的前端同学一起加入到angular的社区，使其成为更好的前端利器。

本系列文章所使用的源代码地址：https://github.com/chylvina/angular-explore。master分支，tag中有每一节的标记。

### 关于源代码学习
* **代码不一定是最好的文档。** 好的代码才是最好的文档，何况 AngularJS 的官方文档就是其源代码的代码注释编译后自动生成的，
* 也是最后的文档，在你找不到其他任何解决方案的时候。
* 源代码学习，比看书学习快得多。 AngularJS 的源代码包含代码注释一共2万+行，而目前比较流行的学习书 ng-book 在翻译后大约120万字。就算你将 ng-book 看完，也未必能完全理解 AngularJS。我个人认为 ng-book 大部分内容都是照搬官方文档而已，学习意义不大。
* 通过源代码，不仅可以学习 AngularJS 框架。还可以学习到依赖注入设计模式的实现(injector.js)，词法分析和语法分析的实现(parse.js)，安全验证和隔离的实现(sce.js)等非常多优秀的代码。
* 花更少的时间学习，花更多的时间创造。

### AngularJS 代码结构
* AngularJS 的源代码在：https://github.com/angular/angular.js
* 其中https://github.com/angular/angular.js/tree/master/src，是代码目录。
* AngularJS 也是通过 Grunt 进行编译的，在编译 angular.js 时所需的代码是由 https://github.com/angular/angular.js/blob/master/angularFiles.js 中的 angularSrc 这一数组定义的。如下：
```javascript
'angularSrc': [
    'src/minErr.js',            // AngularJS 错误处理
    'src/Angular.js',          // 通用方法
    'src/loader.js',            // 定义 angular.module 方法
    'src/AngularPublic.js', // 定义 provider
    'src/jqLite.js',             // jqLite
    'src/apis.js',               // 定义 hashMap 对象

    'src/auto/injector.js',  // 定义 injector

    'src/ng/anchorScroll.js', // angular 相关 service
    ...

    'src/ng/filter.js',
    ...

    'src/ng/directive/directives.js'
    ...
  ]
```

### 一句话证明你会 AngularJS
我首先想到的就是DI，即 Dependency Injection（依赖注入）。[DI是一种设计模式](http://en.wikipedia.org/wiki/Dependency_injection)。简而言之，通过 DI 可以将通用的程序代码以依赖的方式注入进来，并形成倒金字塔形的依赖关系。

AngularJS 就是建立在 DI 之上的，其组件依赖关系可以用下图示意：
![AngularJS Component Architecture](https://raw.githubusercontent.com/chylvina/angular-explore/doc/component-architecture.png)

位于最底层的就是实现 DI 的 $injector。源代码位于 https://github.com/angular/angular.js/blob/master/src/auto/injector.js。

## 正式开始 injector.js

### 通过学习 injector.js 将能解决以下问题：
* Injector 是如何工作的
* Injector UML 架构图
* Injector 存储的数据结构
* angular.injector(), $injector, $inject 有什么区别
* $provide, provider, $rootScopeProvider 有什么区别
* provider, factory, service 有什么区别
* constant, value 的工作原理
* decorator 如何使用
* config 和 run 的区别

### Injector 是如何工作的

对于 AngularJS 中一个有依赖的函数，如下：
```javascript
var func = function(a, b) {
  console.log(a, b);
}
```
函数 func 依赖两个变量(或者叫 service) a 和 b。通过 Injector 实现依赖注入 a 和 b 的步骤如下：

1. Injector 获取到 func 所需要注入的 service 列表，即 ['a', 'b']
2. Injector 根据 ['a', 'b']，找到对应的 service 实例，即 a, b
3. Injector 将 a，b 注入到 func 中，并调用 func，返回运行结果

### Injector 的 UML 架构图
![AngularJS Injector](https://raw.githubusercontent.com/chylvina/angular-explore/doc/injector.png)

#### internal injector
internal injector 实现了一个基本的 Injector，在上图中可以看到 AngularJS 中所用的两个 injector:
1. instanceInjector
2. providerInjector
都是通过 internal injector 创建的。
代码结构如下：
```javascript
function createInternalInjector(cache, factory) {
  function getService(serviceName) {
  }

  function invoke(fn, self, locals, serviceName){
  }

  function instantiate(Type, locals, serviceName) {
  }

  return {
    invoke: invoke,
    instantiate: instantiate,
    get: getService,
    annotate: annotate,
    has: function(name) {
      return providerCache.hasOwnProperty(name + providerSuffix) || cache.hasOwnProperty(name);
    }
  };
}
```
可见，通过 creatInternalInjector 方法，创建了一个 Object，包含:

* 私有变量 cache
* invoke
* instantiate
* get
* annotate
* has

共1个属性，5个方法。其中最重要的是:

1. annotate 实现了获取到 func 所需要注入的 service 列表
2. get 实现了根据所需要注入的 service 列表，找到对应的 service 实例
3. invoke 实现了注入，并返回调用结果

##### annotate 方法
```javascript
// fn 即为需要标记的函数
function annotate(fn, strictDi, name) {
  var $inject,
      fnText,
      argDecl,
      last;

  // 如果 fn 是函数类型，即 fn = function(a, b) {} 
  if (typeof fn == 'function') {
    // 如果 fn.$inject 不存在
    if (!($inject = fn.$inject)) {
      $inject = [];
      if (fn.length) {
        if (strictDi) {
          if (!isString(name) || !name) {
            name = fn.name || anonFn(fn);
          }
          throw $injectorMinErr('strictdi',
            '{0} is not using explicit annotation and cannot be invoked in strict mode', name);
        }
        // 通过 function.toString() 方法获取 fn 对应的字符串，并去掉字符串中的注释部分
        fnText = fn.toString().replace(STRIP_COMMENTS, '');
        // 获取 fn 中的参数部分，即 'a, b'
        argDecl = fnText.match(FN_ARGS);
        // 获取具体的每一个参数，放到数组 $inject 中
        forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg){
          arg.replace(FN_ARG, function(all, underscore, name){
            $inject.push(name);
          });
        });
      }
      // 为 fn.$inject 赋值
      fn.$inject = $inject;
    }
  } 
  // 如果 fn 是数组，即 fn = ['a', 'b', function(a, b) {}]
  else if (isArray(fn)) {
    // 那么将认为数组中的最后一项为需要注入的函数，前面所有项为需要注入的 service 列表，即 $inject
    last = fn.length - 1;
    assertArgFn(fn[last], 'fn');
    $inject = fn.slice(0, last);
  } else {
    // 报错
    assertArgFn(fn, 'fn', true);
  }
  return $inject;
}
```
综上，我们知道 annotate 一个函数 fn = function(a, b) {} 有三种方法：

1. annotate(fn)，则将通过
  1. fn.toString() 获取 fn 字符串
  2. 正则表达式提取参数字符串
  3. split 获取每一个参数
  4. 为 fn.$inject 赋值
2. annotate(['a', 'b', fn])，
3. fn.$inject = ['a', 'b']; annotate(fn)

我们也可以通过代码明白为什么上面第一种方式在 uglify 后无法使用，因为一个函数 fn = function(aParam, bParam) {} 在 uglify 后会变成 fn = function(a, b) {}，这样 annotate 后得到的结果将是 ['a', 'b']，而不是我们期望的 ['aParam', 'bParam']。

而后两种方法则是对 uglify 友好的，在 AngularJS 源代码中大都采用第3种方式，不需要解析，速度最快。

##### get 方法
```javascript
// serviceName 就是我们用到的 $rootScope, $scope, $window 等
function getService(serviceName) {
  // 所有的 service 都缓存在 cache 中
  if (cache.hasOwnProperty(serviceName)) {
    // 如果该 service 正在初始化，则存在循环引用，直接报错。
    if (cache[serviceName] === INSTANTIATING) {
      throw $injectorMinErr('cdep', 'Circular dependency found: {0}', path.join(' <- '));
    }
    // 否则返回缓存在 cache 中的 service
    return cache[serviceName];
  } 
  // 否则，需要创建 serviceName 对应的 service，缓存到 cache 中，再返回该 service
  else {
    try {
      path.unshift(serviceName);
      cache[serviceName] = INSTANTIATING;
      // 1. 通过传入的 factory 工厂方法创建 service
      // 2. 缓存该 service
      // 3. 返回该 service
      return cache[serviceName] = factory(serviceName);
    } catch (err) {
      if (cache[serviceName] === INSTANTIATING) {
        delete cache[serviceName];
      }
      throw err;
    } finally {
      path.shift();
    }
  }
}
````

##### invoke 方法
```javascript
// fn 是被调用的函数，如 fn = function(a, b) {}
// self 是 fn 调用的上下文
// locals 是在进行依赖注入时获取依赖 service 的另一种优先级更高的方式
function invoke(fn, self, locals){
  var args = [],
      // 通过 annotate 方法获取到 fn 的依赖列表
      $inject = annotate(fn),
      length, i,
      key;

  // 遍历依赖列表
  for(i = 0, length = $inject.length; i < length; i++) {
    key = $inject[i];
    // 依赖列表中的每一项必须是字符串
    if (typeof key !== 'string') {
      throw $injectorMinErr('itkn',
              'Incorrect injection token! Expected service name as string, got {0}', key);
    }
    // 如果 locals 中存在所需要的依赖的实例，则优先从 locals 中获取该实例
    // 否则调用 getService 方法从 $injector 中获取该实例
    // 最后将所有获得的实例放在 args 数组中
    args.push(
      locals && locals.hasOwnProperty(key)
      ? locals[key]
      : getService(key)
    );
  }
  if (!fn.$inject) {
    // this means that we must be an array.
    fn = fn[length];
  }

  // 最后一步，以self为上下文调用 fn，将 args 作为参数传入
  // 返回调用的结果
  return fn.apply(self, args);
}
```

##### instantiate 方法
该方法是另外一种形式的 invokde。由于 invoke 方法只能实现对函数的依赖注入，而对于下面这种构建函数则无法使用：
```javascript
var Car = function(engineVendor, tireVendor) {
  this.engine = engineVendor.make();
  this.tire = tireVendor.make();
};

Car.prototype.run = function() {
}
```
使用 instantiate 方法可解决该问题。
```javascript
// Type 相当于上面的 Car
// locals 是在进行依赖注入时获取依赖 service 的另一种优先级更高的方式
function instantiate(Type, locals) {
  var Constructor = function() {},
      instance, returnedValue;

  Constructor.prototype = (isArray(Type) ? Type[Type.length - 1] : Type).prototype;
  // 通过 new 创建了一个空的 Object
  instance = new Constructor();
  // 以 instance 为上下文，invoke Type
  returnedValue = invoke(Type, instance, locals);

  return isObject(returnedValue) || isFunction(returnedValue) ? returnedValue : instance;
}
```
后面会介绍到，在 AngularJS 中，通过 angular.module().service() 定义的 service 是使用 instantiate 进行初始化的。

#### instanceInjector
instanceInjector用于存储和注入我们用到的所有 service 的实例。例如 $rootScope, $window, $http 等等。
这些实例 service 的实例被存在一个叫 cache 的 Object 中。cache 的数据结构如下：
```javascript
cache: {
    $rootScope: instance of $rootScope,
    $window: instance of $window,
    $http: instance of $http
    ...
}
```
在项目中如果有如下代码：
```javascript
angular.module('aModule', [])
  .controller('aController', function($injector, $scope) {
    $injector.get('$rootScope');
  });
```
那么 $injector 指的就是 instanceInjector。
另外，angular.injector() 方法执行后返回的也是 instanceInjector。

创建 instanceInjector 的代码如下：
```javascript
var providerSuffix = 'Provider',
instanceCache = {},
// 1. 通过 createInternalInjector 创建
// 2. 传入一个初始为 {} 的 instanceCache 实例作为 cache
// 3. 传入一个工厂方法，该方法的作用是在 instanceInjector 的 cache 中找不到所需要注入的 service 实例时，通过
//    providerInjector 获取。关于 providerInjector 在后面介绍。
instanceInjector = (instanceCache.$injector =
  createInternalInjector(instanceCache, function(servicename) {
    var provider = providerInjector.get(servicename + providerSuffix);
    return instanceInjector.invoke(provider.$get, provider);
  }));
```
注意，在上面的代码中， instanceInjector 通过 createInternalInjector 创建后立即存储在了 instanceCache 中，成为了 instanceInjector 的 cache 中的第一个 service 实例。在 Injector 的 UML 架构图 也标记出来了。也就是说：
```javascript
instanceInjector.invoke(function($injector) {
  expect(instanceInjector).toBe($injector);
});
```
会有一点绕，建议从存储的角度来推理。实际上涉及到的存储结构非常简单，只有一个 cache，所有的存储都用红色高亮了。

#### providerInjector
对于一个 service 实例来说，创建该实例的类叫做 serviceProvider。对于上面 instanceInjector 的 cache 示意来说，对应的 providerInjector 的 cache 的示意如下：
```javascript
cache: {
    $rootScopeProvider: defination of $rootScopeProvider,
    $windowProvider: defination of $windowProvider,
    $httpProvider: defination of $httpProvider
    ...
}
```
当我们需要注入一个 $rootScope 时:

1. 会先在 instanceInjector 的 cache 中查找，如果存在直接返回
2. 否则在 providerInjector 中查找 $rootScopeProvider，通过 $rootScopeProvider 创建 $rootScope
3. 将 $rootScope 缓存在 instanceInjector 的 cache 中

instanceInjector 只有读操作，用来获取 service 的实例。写入 serviceProvider 是在 providerInjector 的 $provide 提供的。

创建 providerInjector 的代码如下：
```javascript
// providerInjector 的 cache 除了存储下面的 providerInjector 实例外，还存了一个叫做 $provide 的 service
// $provide 提供的这些方法我们非常熟悉，里面我们最常用的
// factory, value, constant 方法
// 还有 AngularJS 内部最常用的 provider 方法
// 这些方法的作用都是向 providerInjector 的 cache 写入 provider，例如 $rootScopeProvider
// 当 instanceInjector 尝试第一次获取 $rootScope 时，将首先从 providerInjector 中获取 $rootScopeProvider，
// 通过 $rootScopeProvider 创建 $rootScope 实例，然后缓存并返回。
// 因此，所有 service 的实例都只会创建一次，然后被缓存。
providerCache = {
$provide: {
    // support 方法的作用是允许传入使用对象定义的 provider
    provider: supportObject(provider),
    factory: supportObject(factory),
    service: supportObject(service),
    value: supportObject(value),
    constant: supportObject(constant),
    decorator: decorator
  }
},
// providerInjector 的工厂方法是直接报错，这个错误我们非常熟悉，那就是 'Unknow provider'
providerInjector = (providerCache.$injector =
  createInternalInjector(providerCache, function() {
    throw $injectorMinErr('unpr', "Unknown provider: {0}", path.join(' <- '));
  })),
```
$provide 的方法按照从底层向上层排列如下：
```javascript
// 最底层的方法，在 AngularJS 内部都是通过该方法定义 serviceProvider
// 其他的方法最终都会调用该方法
// name 是所要定义的 serviceProvider 的名称，例如如果要定义 $rootScope 的 provide，那么 name = '$rootScope'
// provider_ 是对应的工厂方法
function provider(name, provider_) {
  // 我们不能定义一个叫 service 的 serviceProvider
  assertNotHasOwnProperty(name, 'service');
  // 如果 providerInjector 是函数或者数组(不是 Object)，那么首先将使用 **providerInjector** 进行注入，
  if (isFunction(provider_) || isArray(provider_)) {
    provider_ = providerInjector.instantiate(provider_);
  }
  // $get 属性是必须的
  // 对于 $rootScopeProvider 来说，在创建 $rootScope 的时候，将使用 instanceInjector.invoke(provider_.$get) 来创建  
  // $rootScope
  if (!provider_.$get) {
    throw $injectorMinErr('pget', "Provider '{0}' must define $get factory method.", name);
  }
  // providerSuffix = 'Provider'
  // 因此，一个 service 如 $rootScope 对应的 provider 是 $rootScopeProvider
  // AngularJS 到处是这种没有约定的常量用法，因此只有看源代码才能理解。
  return providerCache[name + providerSuffix] = provider_;
}

// 这个方法应该是我们最常用的定义 service 的方法，其实就是将我们自己写的工厂方法放在了 $get 属性中
function factory(name, factoryFn) { return provider(name, { $get: factoryFn }); }

// 通过阅读下面的源代码我们可以很清楚的看出 factory 和 service 的区别
function service(name, constructor) {
  return factory(name, ['$injector', function($injector) {
    return $injector.instantiate(constructor);
  }]);
}

// value 方法通过闭包的方式，将 val 作为私有变量引入
function value(name, val) { return factory(name, valueFn(val)); }

// constant 方法直接将 value 写在 cache 上
function constant(name, value) {
  assertNotHasOwnProperty(name, 'constant');
  providerCache[name] = value;
  instanceCache[name] = value;
}

// decorator 允许我们可以包装 serviceProvider
function decorator(serviceName, decorFn) {
  // 需要包装的 serviceProvider
  var origProvider = providerInjector.get(serviceName + providerSuffix),
      // 保存原有的 $get 工厂方法
      orig$get = origProvider.$get;

  // 创建新的工厂方法
  origProvider.$get = function() {
    // 先调用原有的工厂方法
    var origInstance = instanceInjector.invoke(orig$get, origProvider);
    // 再调用包装方法进行覆盖
    return instanceInjector.invoke(decorFn, null, {$delegate: origInstance});
  };
}
```


#### module 
就是我们在 angular 项目中最常用的 angular.module 方法，在 https://github.com/angular/angular.js/blob/master/src/loader.js 中定义：
```javascript
angular.module('some-module', ['dependencies'])
  .config()
  .constant()
  .value()
  .provider()
  .factory('aFactor', function() {})
  .service()
  .directive()
  .filter()
  .run()
  ...
```
这些方法与 providerInjector 中的 $provide service 提供的方法有很多类似，实际上，module 中的 constant, value, provider 等方法最终就是调用 $provide 中对应的方法进行初始化的。

例如，我们通过最常用的 factory 定义了 aFactory，则 AngularJS 会通过 $provide 在 providerInjector 的 cache 写入一个叫做 aFactoryProvider 的 provider。当我们在其他地方需要注入 aFactory 时：
```javascript
angular.module('another-module', ['some-module'])
  // 1. instanceInjector 将会 invoke 下面的函数
  // 2. instanceInjector 尝试获取 aFactory
  // 3. instanceInjector 尝试通过 providerInjector 获取 aFactoryProvider
  // 4. aFactory = instanceInjector.invoke(aFactoryProvider.$get)
  // 5. instanceInjector.cache['aFactory'] = aFactory
  .controller('aController', function(aFactory) {
    // do something with aFactory
  })
```
module 的定义在 https://github.com/angular/angular.js/blob/master/src/loader.js 中。
module 的初始化在 https://github.com/angular/angular.js/blob/master/src/auto/injector.js 中。
代码如下：
```javascript
// loadModules 是一个可以嵌套(递归)调用的函数
// modulesToLoad 是需要加载的 module 数组，如 ['ng']
function loadModules(modulesToLoad){
  var runBlocks = [], moduleFn, invokeQueue;
  forEach(modulesToLoad, function(module) {
    // 如果 module 已经被初始化，直接返回
    if (loadedModules.get(module)) return;
    loadedModules.put(module, true);

    // 根据 module 在 https://github.com/angular/angular.js/blob/master/src/loader.js 中的定义进行初始化
    // 例如 angular.module().factory() 将会调用 $provide.factory 方法
    function runInvokeQueue(queue) {
      var i, ii;
      for(i = 0, ii = queue.length; i < ii; i++) {
        var invokeArgs = queue[i],
            provider = providerInjector.get(invokeArgs[0]);

        provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
      }
    }

    // 下面的代码可以看出，将 module 中定义的 run 的部分放进了 runBlocks 数组，然后返回。
    // 也就是说，runBlocks 部分是在所有 module 初始化完毕后再调用的。
    // 这样做才能保证 run 中所依赖的 service 所对应的 provider 已经全部加载就绪了。
    // 而 config 则是在 module 初始化过程中通过 providerInjector 注入的。
    // 综上，run 中可以注入 service instance，而 config 中只能注入 provider。这就是两者的区别。
    try {
      if (isString(module)) {
        moduleFn = angularModule(module);
        runBlocks = runBlocks.concat(loadModules(moduleFn.requires)).concat(moduleFn._runBlocks);
        runInvokeQueue(moduleFn._invokeQueue);
        // 使用 providerInjector 注入 config 
        runInvokeQueue(moduleFn._configBlocks);
      } else if (isFunction(module)) {
          runBlocks.push(providerInjector.invoke(module));
      } else if (isArray(module)) {
          runBlocks.push(providerInjector.invoke(module));
      } else {
        assertArgFn(module, 'module');
      }
    } catch (e) {
      if (isArray(module)) {
        module = module[module.length - 1];
      }
      if (e.message && e.stack && e.stack.indexOf(e.message) == -1) {
        // Safari & FF's stack traces don't contain error.message content
        // unlike those of Chrome and IE
        // So if stack doesn't contain message, we create a new string that contains both.
        // Since error.stack is read-only in Safari, I'm overriding e and not e.stack here.
        /* jshint -W022 */
        e = e.message + '\n' + e.stack;
      }
      // 这个报错也经常出现
      throw $injectorMinErr('modulerr', "Failed to instantiate module {0} due to:\n{1}",
                module, e.stack || e.message || e);
    }
  });
  return runBlocks;
}
```

## 小结
injector.js 算注释一共829行，不算注释也就300行左右的代码，但是它定义了 DI，初始化 module，成为 AngularJS 的基础。非常值得学习和借鉴。下一节将介绍 parse.js，将解决如下问题：
- Angular 表达式介绍
- $parse如何工作
- 词法分析 (javascript的词法分析，ng的词法分析)
- 语法分析 (javascript的语法分析，ng的语法分析(运算表达式))
- ng-some=‘expression’; ng-some=‘{ a: expression, b: expression }’<div>{{expression}}</div>65的区别
- 表达式支持哪些关键字，不支持哪些操作
- 如何在表达式中使用 filter
- getter，setter 为 scope 提供支撑
