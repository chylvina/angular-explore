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

### 一句话证明你会 AngularJS
我首先想到的就是DI，即 Dependency Injection（依赖注入）。[DI是一种设计模式](http://en.wikipedia.org/wiki/Dependency_injection)。简而言之，通过 DI 可以将通用的程序代码以依赖的方式注入进来，并形成倒金字塔形的依赖关系。

AngularJS 的组件依赖关系可以用下图示意：
![AngularJS Component Architecture](https://raw.githubusercontent.com/chylvina/angular-explore/doc/component-architecture.png)


## 正式开始 Injector.js

### 通过学习 Injector.js 将能解决以下问题：
* Injector UML 架构图
* Injector 存储的数据结构
* Injector 是如何工作的
* angular.injector(), $injector, $inject 有什么区别
* $provide, provider, $rootScopeProvider 有什么区别
* provider, factory, service 有什么区别
* constant, value 的工作原理
* decorator 如何使用

### Injector 的 UML 架构图


### Injector 的数据结构

在 UML 中用红色高亮了

### Injector 是如何工作的
