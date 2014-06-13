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
上面说了，$parse 实现了一套简单的表达式语法解析，生成了对应的回调函数。因此，我们需要学习理解语法解析也就是语言编译器的工作原理。

在这里介绍一系列文章http://dukeland.hk/2012/03/26/a-simple-tutorial-of-writing-a-compiler-part-1-introduction/

该文章作者通过学习 ActionScript3 的编译器源代码，使用 javascript 完成了一套 javascript 编译器，并给出了详细的教程，非常值得学习。作为前端开发工程师，只有了解了 javascript 的编译原理，才能自如的运用 javascript。同理，只有了解了浏览器的渲染机制，才能够自如的运用 html 和 css。

总结这系列文章，一个语法解析器有以下几部分组成：

#### 词法分析
词法分析(Lexical analysis)，从左向右扫描表达式，找到所有有意义的词并放在一个关键字数组中。如上面的表达式中，关键字数组为：if, (, true, ), print, “Hello World!”, ;。做法其实很简单，预先定义好关键字，在扫描时遇到匹配的关键字，就放在关键字数组中，否则继续扫描。

在一个编程语言设计时，就要求这些关键字为保留字，因此编译器可以通过有限状态机进行高效的解析。这一点与自然语言有很大不同，在自然语言中，没有所谓的关键字或者保留字，我想怎么说就怎么说，说错了对方也可能理解。

#### 语法分析
语法分析(Syntactic analysis)，有最基本的关键字数组了，下面要将词组成有意义的语句，做法与第一步类似，从左向右扫描关键字数组(注意这里不是扫描字符了)，遇到预先定义好的关键字，就递归进去扫描。例如上面的数组，遇到 if 后，递归进入 if 表达式的扫描：
```javascript
if(expression) { expression } else { expression }
```
遇到 print后，递归进入 print 表达式的扫描。
```javascript
print expression
```
在进行 if 表达式扫描时，如果 if 后面紧跟的不是 关键字 ( ，那么就应该抛出错误。同样，在进行 print 表达式扫描时，如果 print 后面紧跟的不是表达式，而是一个分号，也抛出错误。这两个错误都属于语法错误。最后形成了一个表达式树。

#### 语义分析
语义分析(Semantic analysis)，有了语法树，下面要继续进行语义分析，因为有些表达式看起来对，例如：
```javascript
100 / 0
```
这一句符合语法，但是在运算时会产生错误，在语义分析师就应将其指出。同样有
```javascript
if(false) dosomething
switch(type) {
  case "1":
    dosomething
  break;
  case "1": // 错误，重复的 case
    dosomething
  break;
}
```
但是，实际上像JavaScript, ActionScript这种脚本语言的编译器本身并不会做这样的事情，可能是为了效率考虑？因此对于sscript.js这个简单的解析器来说，也暂时将其忽略了。

#### 编译
编译(Compile)，在这一步，需要将人类可读的代码转化为机器可读的代码，实际上，对于sscript.js这个甚至执行在JavaScript之上的这个编译器来说，完全没有必要这样做。只不过是为了模拟一个完整的编译器罢了。编译的原理请参考原博文和汇编原理；

#### 执行
执行(Run)，在这一步将编译好的机器代码依次执行。

在 $parse 中，实际上只完成了词法分析和语法分析这两步。
- 没有语义分析，因此在编译时不会对你的语法错误报错。
- 没有编译，因此不会生成二进制文件。但是针对于某个表达式已经生成的回调函数会缓存在内存，下次直接调用。

### $parse 的词法分析
下面就通过源代码来看看 $parse 的词法分析：
```javascript
lex: function (text) {
  // text 为被解析的语句
  this.text = text;
  this.index = 0;
  this.ch = undefined;
  // tokens 为解析后的关键词数组
  this.tokens = [];

  // 遍历
  while (this.index < this.text.length) {
    // 读取当前字符
    this.ch = this.text.charAt(this.index);
    // 如果当前字符是单引号或者双引号
    if (this.is('"\'')) {
      // 进入读取字符串的子循环，直到字符串结束
      this.readString(this.ch);
    }
    // 如果当前字符是数字，或者如果当前字符是小数点，下一个字符是数字
    else if (this.isNumber(this.ch) || this.is('.') && this.isNumber(this.peek())) {
      // 进入读取数字的子循环
      this.readNumber();
    }
    // 如果当前字符是 ID
    else if (this.isIdent(this.ch)) {
      // 进入读取 ID 的子循环
      this.readIdent();
    }
    // 如果当前字符是下列符号
    else if (this.is('(){}[].,;:?')) {
      // 这些符号将作为单独的关键词
      this.tokens.push({
        index: this.index,
        text: this.ch
      });
      this.index++;
    }
    // 如果当前字符是空格，则忽略
    else if (this.isWhitespace(this.ch)) {
      this.index++;
    }
    // 否则，将其视为操作符。
    else {
      var ch2 = this.ch + this.peek();
      var ch3 = ch2 + this.peek(2);
      var fn = OPERATORS[this.ch];
      var fn2 = OPERATORS[ch2];
      var fn3 = OPERATORS[ch3];
      if (fn3) {
        this.tokens.push({index: this.index, text: ch3, fn: fn3});
        this.index += 3;
      } else if (fn2) {
        this.tokens.push({index: this.index, text: ch2, fn: fn2});
        this.index += 2;
      } else if (fn) {
        this.tokens.push({
          index: this.index,
          text: this.ch,
          fn: fn
        });
        this.index += 1;
      } else {
        this.throwError('Unexpected next character ', this.index, this.index + 1);
      }
    }
  }
  return this.tokens;
}
```
从上面的代码中可以看出，$parse 可以识别：
- 字符串
- 数字
- ID (可以看做是无序的字符排列)
- (){}[].,;:?
- 操作符
和 javascript 不同的是，$parse 不识别关键字，如 var, if, else, while 等。

```javascript
var OPERATORS = {
    /* jshint bitwise : false */
    'null':function(){return null;},
    'true':function(){return true;},
    'false':function(){return false;},
    undefined:noop,
    '+':function(self, locals, a,b){
      a=a(self, locals); b=b(self, locals);
      if (isDefined(a)) {
        if (isDefined(b)) {
          return a + b;
        }
        return a;
      }
      return isDefined(b)?b:undefined;},
    '-':function(self, locals, a,b){
          a=a(self, locals); b=b(self, locals);
          return (isDefined(a)?a:0)-(isDefined(b)?b:0);
        },
    '*':function(self, locals, a,b){return a(self, locals)*b(self, locals);},
    '/':function(self, locals, a,b){return a(self, locals)/b(self, locals);},
    '%':function(self, locals, a,b){return a(self, locals)%b(self, locals);},
    '^':function(self, locals, a,b){return a(self, locals)^b(self, locals);},
    '=':noop,
    '===':function(self, locals, a, b){return a(self, locals)===b(self, locals);},
    '!==':function(self, locals, a, b){return a(self, locals)!==b(self, locals);},
    '==':function(self, locals, a,b){return a(self, locals)==b(self, locals);},
    '!=':function(self, locals, a,b){return a(self, locals)!=b(self, locals);},
    '<':function(self, locals, a,b){return a(self, locals)<b(self, locals);},
    '>':function(self, locals, a,b){return a(self, locals)>b(self, locals);},
    '<=':function(self, locals, a,b){return a(self, locals)<=b(self, locals);},
    '>=':function(self, locals, a,b){return a(self, locals)>=b(self, locals);},
    '&&':function(self, locals, a,b){return a(self, locals)&&b(self, locals);},
    '||':function(self, locals, a,b){return a(self, locals)||b(self, locals);},
    '&':function(self, locals, a,b){return a(self, locals)&b(self, locals);},
//    '|':function(self, locals, a,b){return a|b;},
    '|':function(self, locals, a,b){return b(self, locals)(self, locals, a(self, locals));},
    '!':function(self, locals, a){return !a(self, locals);}
}
```
上面这段代码中列出了 $parse 能够识别的操作符：
- ++ -- 这样的操作符不在其中，因此 $parse 不支持这样的操作。
- 注意倒数第三行，本来在 javascript 中作为位运算符的 | 在这里被注释掉了，在后面的语法分析中作为过滤器操作进行解析。

### $parse 的语法分析
$parse 的语法分析是通过下面的方法实现的：
```javascript
parse: function (text) {
  // text 是需要解析的语句
  this.text = text;
  // tokens 是词法解析出来的关键词数组
  this.tokens = this.lexer.lex(text);

  // 语法解析, value 即为解析后的回调函数。
  var value = this.statements();

  if (this.tokens.length !== 0) {
    this.throwError('is an unexpected token', this.tokens[0]);
  }

  value.literal = !!value.literal;
  value.constant = !!value.constant;

  return value;
},
```
在 statements 方法中，













