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

### invoke 方法
```javascript
function invoke(fn, self, locals, serviceName){
  if (typeof locals === 'string') {
    serviceName = locals;
    locals = null;
  }

  var args = [],
      $inject = annotate(fn, strictDi, serviceName),
      length, i,
      key;

  for(i = 0, length = $inject.length; i < length; i++) {
    key = $inject[i];
    if (typeof key !== 'string') {
      throw $injectorMinErr('itkn',
              'Incorrect injection token! Expected service name as string, got {0}', key);
    }
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

  // http://jsperf.com/angularjs-invoke-apply-vs-switch
  // #5388
  return fn.apply(self, args);
}
```

#### module 
就是我们在 angular 项目中最常用的 angular.module 方法，在 https://github.com/angular/angular.js/blob/master/src/loader.js 中定义：
```javascript
angular.module('some-module', ['dependencies'])
  .constant()
  .value()
  .provider()
  .factory()
  .service()
  .directive()
  .filter()
  ...
```

#### instanceInjector
instanceInjector用于存储和注入我们用到的所有 service 的实例。例如 $rootScope, $window, $http 等等。这些实例 service 的实例被存在一个叫 cache 的 Object 中。cache 的数据结构如下：
```javascript
cache: {
    $rootScope: instance of $rootScope,
    $window: instance of $window,
    $http: instance of $http
    ...
}
```
当


在 UML 中用红色高亮了

### Injector 是如何工作的
