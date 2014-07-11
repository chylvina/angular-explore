### 通过学习 rootScope.js 将解决如下问题：

- scope 的设计目标, MVC vs MVVM vs MVP
- scope.$new 分析，Angular在什么时候创建了scope，isolate scope的不同
- scope.$watch, scope.$watchCollection, scope.$digest 分析，工作原理，Angular 的性能瓶颈以及优化策略
- scope.$apply, scope.$eval, scope.$evalAsync 区别，使用场景
- scope.$on, scope.$emit, scope.$broadcast, scope.$destroy 分析

### scope 的设计目标

#### All problems in computer science can be solved by another level of indirection

这是一个叫做 David Wheeler 的计算机科学家的名言。意思是，计算机科学领域的任何问题都可以通过增加一个间接的中间层来解决。例如，代理服务器用来解决翻墙的问题。。。

我认为这句话在其他领域也同样适用，例如为了解决螺丝与螺孔之间的间隙与误差，增加了垫圈；为了解决车轮与路面的摩擦，增加了橡胶轮胎等等。

其实这句话反过来也可以理解为，任何一个间接的中间层的出现都是为了解决已经存在的问题。因此我们只需要找到该层所解决的问题，也就找到了该层之所以出现的原因。

#### web app

AngularJS 是 web app 的开发框架之一。那么什么是 web app 呢。我个人理解，web app 的出现是为了解决用户与服务器之间难以沟通而出现的一个间接的中间层。如果人人都是计算机高手，能够通过命令行工具使用 TCP/UDP 协议与服务器进程进行愉快而友好的沟通，那前端工程师只能换工作了。

作为一个间接的中间层，web app 的工作原理如下图所示：
![web app](https://raw.githubusercontent.com/chylvina/angular-explore/doc/web%20app.png)
