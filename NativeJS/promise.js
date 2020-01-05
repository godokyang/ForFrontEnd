/**
 * 手动实现一个promise
 * 分析
 * 1. promise的常用构建方法是new Promise((resolve, reject) => {})
 *    a. promise是一个类或者在js里面其实是一个函数
 *    b. 接收一个方法，方法包含两个参数方法，并且这两个方法都是可空
 * 2. promise方法的调用
 *    promise.then((res, err) => {}).catch(e => {})
 *    a. promise需要实现一个then方法，一个catch方法用于链式调用
 *    b. promise还有其他的方法比如.all, .race等等
 * 3. 关于promise规范的分析
 *    a. 实现一个状态机，有三个状态，pending、fulfilled、rejected，状态之间的转化只能是pending->fulfilled、pending->rejected，状态变化不可逆。
 *    b. 实现一个then方法，可以用来设置成功和失败的回调
 *    c. then方法要能被调用多次，所以then方法需要每次返回一个新的promise对象，这样才能支持链式调用。
 *    d. 构造函数内部要有一个value值，用来保存上次执行的结果值，如果报错，则保存的是异常信息。
 * 
 * 以下用es5实现, 如果用es6的语法糖实现方法更简单，但是原理一样
*/

// 新建三个常量用于保存promise状态
const PENDING = "pending"
const FULLFILLED = "fulfilled"
const REJECTED = "rejected"

function MyPromise(fn) {
  // 保存this指针，因为promise有可能会异步执行，执行过程中需要指向正确的上下文
  let that = this; 
  // 3.c, 3.a
  that.value = null;
  that.status = PENDING;
  // resolvedCallbacks 和 rejectedCallbacks 用于保存 then 中的回调，因为当执行完 Promise 时状态可能还是等待中，这时候应该把 then 中的回调保存起来用于状态改变时使用
  that.resolvedCallbacks = [];
  that.rejectedCallbacks = [];

  // resolve 和 reject执行的步骤相同, 
  // 1. 接收一个value，保存
  // 2. 重置状态
  // 3. 执行callback数组中的回调
  function resolve(value) {
    if (that.status === PENDING) {
      that.status = FULLFILLED;
      that.value = value;
      that.resolvedCallbacks.map((cb) => {
        cb(value)
      })
    }
  }

  function reject() {
    if (that.status === PENDING) {
      that.status = FULLFILLED;
      that.value = value;
      that.rejectedCallbacks.map((cb) => {
        cb(value)
      })
    }
  }

  // 预防fn执行出错，所以这里要try一下并且用reject接收error
  try {
    fn(resolve, reject)
  } catch (error) {
    reject(error)
  }
}

/**
   * then方法的实现
   * 1. then可以接受两个参数resolve,reject。注意：两个参数都可空
   * 2. then方法是所有new出来的promise对象都需要继承的方法，所以应该注册到原型链上面
*/
MyPromise.prototype.then = function(onResolve, onReject) {
  let that = this;
  // 首先判断两个参数是否为函数类型，因为这两个参数是可选参数
  // 当参数不是函数类型时，需要创建一个函数赋值给对应的参数，此时还不能实现透传
  let localOnResolve = typeof onReject === 'function' ? onResolve : v => v;
  let localOnReject = typeof onReject === 'function' ? onReject : r => {throw r};

  // 接下来就是一系列判断状态的逻辑，当状态不是等待态时，就去执行相对应的函数。如果状态是等待态的话，就往回调函数中 push 函数
  /**
   * 下面的例子就是等待态的执行
   * new MyPromise((resolve, reject) => {
      setTimeout(() => {
      resolve(1)
      }, 0)
      }).then(value => {
      console.log(value)
      })
   */
  if (that.status === PENDING) {
    // return 一个promise 实现链式调用
    // 上一个promise的返回值需要作为下一个promise的入参
    // 下面两个同理
    return new MyPromise((resolve, reject) => {
      that.resolvedCallbacks.push(() => {
        localOnResolve(that.value)
      });
      that.rejectedCallbacks.push(() => {
        localOnReject(that.value)
      });
    })
  }

  if (that.status === FULLFILLED) {
    return new MyPromise((resolve, reject) => {
      resolve(() => {
        localOnResolve(that.value)
      })
    })
  }

  if (that.status === REJECTED) {
    return new MyPromise((resolve, reject) => {
      reject(() => {
        localOnReject(that.value)
      })
    })
  }
}

// 测试
const test = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(100);
  }, 2000)
});
test.then((data) => {
  console.log(data);
  return data + 5;
},(data) => {})
.then((data) => {
  console.log(data)
  return data + 6
},(data) => {})
.then((data) => {
  console.log(data)
  return data
},(data) => {})

