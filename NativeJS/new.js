/**
 * new 运算符创建一个用户定义的对象类型的实例或具有构造函数的内置对象的实例。
 * 1. 创建一个空对象
 * 2. 新对象的_proto_属性指向构造函数的原型对象。（将步骤1新创建的对象作为this的上下文 ）
 * 3. 执行构造函数内部的代码
 * 4. 如果该函数没有返回对象，则返回this
 * 
 * 字面量{}、new Object()、Object.create()的区别
 * 1. {}和new Object()差别不大，一个可以传参 一个不能传参，new调用了Object的构造函数
 * 2. Object.create()
 * MDN: object.create() 是使用指定的原型proto对象及其属性propertiesObject去创建一个新的对象
 * object.create(proto, propertiesObject)
 * 同样是创建一个新对象，将新对象的原型关联到构造函数上，但是不调用Object的构造函数，所以不能继承Object的属性，使用Object.create()是将对象继承到__proto__属性上，参考具体实现
 * 实现步骤
  a. 创建一个对象
  b. 继承指定父对象
  c. 为新对象扩展新属性
 */

function _new() {
  // 步骤一
  let obj = {}
  let [constructor, ...args] = arguments
  // 步骤二
  obj.__proto__ = constructor.prototype
  // 步骤三
  // 使用apply在obj作用域中调用构造器函数，属性和方法被添加到 this 引用的对象即obj中
  let result = constructor.apply(obj, args)
  if (result && (typeof (result) == "object" || typeof (result) == "function")) {
    // 如果构造函数执行的结果返回的是一个对象，那么返回这个对象
    return result;
  }
  // 如果构造函数返回的不是一个对象，返回创建的新对象
  return obj;

}

// 实现二
function __new(cls) {
  return function () {
    let obj = {
      __proto__: cls.prototype
    }
    cls.apply(obj, arguments)
    return obj
  }
}

// Object.create()
function ObjCreate(obj, properties) {
  // 接收的是一个对象
  let _f = function () { }
  _f.prototype = obj
  if (properties) {
    Object.defineProperties(_f, properties)
  }
  return new _f();
}
// 调用
function Person(name, age) {
  this.type = "test"
  this.name = name;
  this.age = age
}

let a = _new(Person, "test1", 30)
let b = __new(Person)("test2", 30)
let c = Object.create(Person.prototype)
let d = ObjCreate(Person.prototype)

console.log(a, b, c, d);



// 第二周，忘记Obj的this指向为__proto__,当result的返回值为object时才返回
function ___new() {
  let [constructor, ...args] = arguments
  let Obj = {}
  Obj.__proto__ = constructor.prototype
  let result = constructor.apply(Obj, args)
  return typeof result === "function" || typeof result === "object" ? result : Obj;
}