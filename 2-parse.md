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


AngularJS 通过表达式实现了数据绑定，另外它还是 $rootScope 和 $compile 的依赖，这两个非常重要的服务会在后面的章节进行详细介绍。

### $parse 如何工作
