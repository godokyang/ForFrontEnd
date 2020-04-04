// 思路: 将当前的function赋值到传入的实例的属性中，执行方法或返回方法
Function.prototype._call = function(content, ...args){
  if (content === undefined || content === null) {
    content = window || global;
  }
  let fnSymbol = Symbol();
  content[fnSymbol] = this;
  let fn = content[fnSymbol](...args)
  delete content[fnSymbol];
  return fn
}

Function.prototype._apply = function(content, args){
  if (content === undefined || content === null) {
    content = window || global;
  }
  let fnSymbol = Symbol();
  content[fnSymbol] = this;
  let fn = content[fnSymbol](...args)
  delete content[fnSymbol];
  return fn
}
/**
 * @description
  1. bind方法返回的是一个绑定this后的函数，并且该函数并没有执行，需要手动去调用。(从这一点看bind函数就是一个高阶函数，而且和call，apply方法有区别)。
  2. bind方法可以绑定this，传递参数。注意，这个参数可以分多次传递。
  3. 如果bind绑定后的函数被new了，那么此时this指向就发生改变。此时的this就是当前函数的实例。
  4. 构造函数上的属性和方法，每个实例上都有。
 */

Function.prototype._bind = function(){
  // 返回一个方法，接收参数，延迟传参
  if (target === undefined || target === null) {
    target = window || global;
  }
  if (typeof this !== 'function') {
    return
  }
  let self = this;
  // 获取bind时传入的参数，即把第一个参数干掉剩下的数组
  // 这里想试一下网上说的骚操作，否则用es6的语法会更简单(target, ...args)
  let args1 = Array.prototype.slice.call(arguments, 1);
  let temp = () => {}
  let resFn = function() {
    // 如果不想调用apply就把上面的apply代码cp到这里就好了。。。。
    // 获取调用时传入的参数列表
    let innerThis = this;
    let args2 = Array.prototype.slice.call(arguments)
    return self.apply(innerThis instanceof self? innerThis : target, args1.concat(args2))
  }
  // 此时self指向当前的对象，就是function(target)函数
  // new的时候上下文绑定的是构造函数prototype指向的对象
  // 所以需要把返回的resFn的prototype指向self的prototype，这样就可以实现第三点
  // 创建一个临时方法做中转，以免new出来的对象可以直接修改self的原型对象
  temp.prototype = self.prototype;
  resFn.prototype = new temp();
  return resFn
}

// instaceOf 判断father构造函数的原型在不在child的原型链上，判断继承
// 递归判断
// 注意这里 不能用child.__proto__，原则上__proto__只是浏览器对js原生映射的实现，chrome是以__proto__为属性有可能其他浏览器会用其它的属性名, 所以这里要用getPrototypeOf来获取
let _instanceOf = function(child, father){
  const _proto = Object.getPrototypeOf(child), 
  _prototype = father.prototype;

  if (_proto === null || _proto === undefined) {
    return false
  }

  if (_proto === _prototype) {
    return true
  }

  return _instanceOf(Object.getPrototypeOf(_proto), father)
}

// 递归比较耗内存 改一波  用while实现
let myInstanceOf = function(child, father) {
  let _proto = Object.getPrototypeOf(child), _prototype = father.prototype;

  while (true) {
    if (_proto === null || _proto === undefined) {
      return false
    }

    if (_proto === _prototype) {
      return true
    }

    _proto = Object.getPrototypeOf(_proto);
  }
}

// 测试
console.log("---------instanceOf----------");
console.log(myInstanceOf({}, Object));
console.log(myInstanceOf([], Array));
function TestMy() {}
let tm = new TestMy();
console.log(myInstanceOf(tm, TestMy));
console.log(myInstanceOf('', Array));
