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

很简单明了，web app 的作用就是：

1. 接受用户输入
2. 将用户输入通过后台接口传给后台
3. 获取后台数据返回
4. 渲染数据并呈现给用户

注意，这种模式仅适用于 web app 而不一定适用于 web game，由于 web game 的用户输入非常频繁，为了保证显示帧数的稳定性，web game 可以采用主动定时刷新的方式进行数据呈现，也就是“心跳机制”：

![web app](https://raw.githubusercontent.com/chylvina/angular-explore/doc/web%20game.png)

对于 web app 中的第 1 步，其代码实现就是响应 DOM 事件，例如：

```javascript
$('#button').on('click', function(event) {
  // do something
});

$('#input').on('input', function(event) {
  // do something
});
```

对于 web app 中的第 2，3 步，其代码实现就是通过 ajax 请求服务器并等待回调：

```javascript
server.api(function() {
  // do something
});
```

对于 web app 中的第 4 步，其代码实现就是更新 DOM：

```javascript
$('#input').text = '数据保存成功。'
```

综上，在前 3 步我们做的事情就是处理来自于用户或者服务器的异步调用，我称之为 Handler。在第 4 步我们做的是渲染 DOM。

一切看起来是无比的和谐，但是在实际的项目开发中就没那么理想了，我们举个例子，实现一个 web app 的登陆功能：

![login](https://raw.githubusercontent.com/chylvina/angular-explore/doc/login.png)

DOM 是一个简单的登陆框，两个输入，一个按钮。但是 Handler 就很多了，在图中用红色文字标出的就是需要处理的来自 DOM 和 服务器的事件。一个事件代表一个 Handler。光数目就很多了。

但是这才刚刚开始，我们实现其中一个 Handler 来举例，对于 "Sign in" 这个按钮，其 click Handler 如下：

```javascript
$('#signin').on('click', function(event) {
  // 判断用户名不为空且有效
  valid($('#username'));
  
  // 判断密码不为空且有效
  valid($('#password'));
})
```

从上面的例子可以看出一个重要的信息，在 "sign in" 这个 DOM 的 Handler 中需要对其他两个 DOM 进行处理。事实上这并不是偶然的，经过总结归纳我们可以得出结论：

在任意一个 Handler 中需要对所有的 DOM 进行处理。

这就像在任意一个函数中，需要对其参数的所有可能情况进行判断一样。虽然你可以说我并没有判断或者全面判断，项目照样可以工作，但是这并不能说明你是对的，只能说明你是幸运的。

如下图所示：
![handler explode](https://raw.githubusercontent.com/chylvina/angular-explore/doc/handler%20explode.png)

圆形表示 Handler，方形表示 DOM，每一个 Handler 都需要和所有的 DOM 打交道。反过来每个 DOM 也是如此。如果产品需求更新，导致新增了一个 Hanlder 或者 DOM，那么新的 Hanlder 或者 DOM 仍然需要与已经存在的 DOM 或者 Handler 打交道。

想象一下，一个简单的项目里面就可以有几十上百个 DOM 或者 Handler，这样错综复杂的网状结构怎能不“为伊消得人憔悴”。前端开发不好干啊。

问题存在了，耦合很大，需要解耦。解决方法刚才也讲了(计算机科学领域的任何问题都可以通过增加一个间接的中间层来解决)。因此，各种框架应运而生。一般来说有 MVC/P 和 MVVM 两种，其中 MVC 和 MVP 相差不大，我个人认为 MVP 是 MVC 的一个升级。

##### MVC

世上本没有路，走的人多了就变成了路。

Handler 可以分为两类，一类是处理 DOM 的，可以看做 View，一类是处理服务器通信的，可以看做 Model。可见世上本没有一个叫 Controller 的东西， Controller 是为了解决 View 和 Model 的耦合而加上的一个“间接的中间层”。如下如所示：




















