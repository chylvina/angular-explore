### 通过学习 parse.js 将解决如下问题：
- Angular 表达式介绍
- $parse 如何工作
- 词法分析 (javascript的词法分析，ng的词法分析)
- 语法分析 (javascript的语法分析，ng的语法分析(运算表达式))
- 了解 ng-some=‘expression’; ng-some=‘{ a: expression, b: expression }’<div>{{expression}}</div> 的区别
- 表达式支持哪些关键字，不支持哪些操作
- 如何在表达式中使用 filter
- getter，setter 如何为 scope 提供支撑

### Angular 表达式介绍
在刚开始了解 AngularJS 的时候，是看官网首页的 DEMO (http://angularjs.org)。给我印象最深的不是 DI (其实 DI 给我的第一印象是混乱)，而是其在 html 中进行计算的表达式，如：
```javascript
1 + 1
a + b
'Hi, ' + user.name
items[index] | filter
```
真的很神奇，之前用过的模板引擎如 jade, handlebars 等，可以将预定义的模板用 json 数据进行渲染，生成出 HTML。在渲染中可以使用 json 对象的取值操作，如 a.b.c.d ，但是不能进行计算。这是如何实现的呢，肯定有人会以为是使用了 javascript 中的 eval 方法。但实际上 AngualrJS 的表达式和普通的 javascript 语法是有一些差别的，因此肯定不是用的 eval 。根据官方文档，主要区别有以下四点：

#### Content （上下文）
javascript 中的表达式中变量的上下文都是全局的 window 对象。而在 Angular 中使用的是一个叫做 scope 的对象。因此，不同的表达式会动态的根据上下文进行读取计算。在源代码中可以看到，AngularJS 会将
```javascript
a + b
```
解析为类似
```javascript
function exp(scope) {
  return scope.a + scope.b;
}
```
这样的回调函数，然后在计算式将上下文 scope 传入后得到返回值。

#### Forgiving (容许空值)
在前端项目中，经常会遇到异步调用，因此一个变量 a 在得到数据之前经常是 null 或者 undefined。这给开发者造成很大困扰，因为需要经常判断变量是否为空。

而 AngularJS 在 parse 这一层做了类似下面的操作
```javascript
// 这是表达式
a + b

// 这是解析后的表达式
function exp(scope) {
  return (scope.a ? scope.a : null) + (scope.b ? scope.b : null);
}
```
通过这样的处理，即使变量 a 不存在于 scope 中也不会报错了。当异步操作返回数据后，也能够正常执行下去。非常方便。

#### No Control Flow Statements (没有条件控制语法)
AngularJS 的表达式中没有 if，else，while 这样的条件控制语法。在源代码中我们可以看出，AngularJS 通过 parse.js 自己实现了一套表达式的解析操作，而没有使用浏览器提供的 javascript 的 eval 操作。虽然用起来很方便，但是 javascript 本身的性能问题就导致如果表达式越复杂，对性能的影响就越大。

因此，AngularJS 中没有实现对 if，else，while 这样的条件控制，另外我们在写表达式的时候，也不要写过于复杂的语句。而是应该通过对数据结构的设计，尽量简化表达式的复杂度。

#### Filters (过滤器)
AngularJS 实现了类似于 unix 中的管道操作符，叫做过滤器。这个管道操作符是 javascript 中没有的操作。我们在源代码中可以看到，如何正确的使用管道操作符。

AngularJS 通过表达式实现了数据绑定，另外它还是 $rootScope 和 $compile 的依赖，这两个非常重要的服务会在后面的章节进行详细介绍。

### $parse 如何工作
