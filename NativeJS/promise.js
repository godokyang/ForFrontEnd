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

function _Promise(fn) {
  let self = this;
  // 初始化status状态
  self.status = PENDING;
  // 初始化resolve或者reject接收的value值
  self.value = null;
  // 初始化resolve/reject队列
  self.resolveCallbacks = [];
  self.rejectCallbacks = [];
  function resolve(value) {
    // 规范规定status只能从pending跳转到其他状态，不能从其他状态跳转到pending
    if (self.status !== PENDING) {
      return
    }
    self.status = FULLFILLED
    self.value = value
    // 改变状态以后遍历队列，分别执行队列中的callback
    self.resolveCallbacks.map((cb) => {
      return cb(value)
    })
  }

  function reject(value) {
    if (self.status !== PENDING) {
      return
    }
    self.status = REJECTED
    self.value = value
    self.rejectCallbacks.map((cb) => {
      return cb(value)
    })
  }

  // 保护fn执行出错的情况，直接执行reject
  try {
    fn(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  // 循环引用报错
  if (x === promise2) {
    // 直接reject
    return reject(new TypeError('Chaining cycle detected for promise'));
  }
  let called;
  if (x != null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      let then = x.then
      // 如果then是函数就默认是promise，因为要支持不同的promise互相嵌套，如果只是自己玩的话就用x instanceof Promise就好了
      if (typeof then === 'function') {
        then.call(
          x,
          y => {
            // called用来控制成功和失败只能调用一次
            if (called) return;
            called = true
            resolvePromise(promise2, y, resolve, reject);
          },
          err => {
            // called用来控制成功和失败只能调用一次
            if (called) return;
            called = true
            reject(err)
          }
        )
      } else {
        resolve(x)
      }
    } catch (error) {
      reject(error)
    }
  } else {
    resolve(x)
  }
}

// then方法需要每个promise的实例都可以调用 所以应该注册到原型链上面，race和all同理
_Promise.prototype.then = function (onResolve, onReject) {
  let self = this;
  // 处理resove和reject为空的情况
  let _onResolve = typeof onResolve === "function" ? onResolve : v => v;
  let _onReject = typeof onReject === "function" ? onReject : err => { throw err };

  let promise2 = new _Promise((res, rej) => {
    if (self.status === PENDING) {
      self.resolveCallbacks.push(() => {
        try {
          let x = _onResolve(self.value);
          resolvePromise(promise2, x, res, rej)
        } catch (error) {
          rej(error)
        }
      });
      self.rejectCallbacks.push(() => {
        try {
          let x = _onReject(self.value);
          resolvePromise(promise2, x, res, rej)
        } catch (error) {
          rej(error)
        }
      });
    }

    // 当then执行的时候判断status!=PENDING，则立即调用resolve
    if (self.status === FULLFILLED) {
      // 秘籍规定这里不能同步调用
      setTimeout(() => {
        try {
          let x = _onResolve(self.value);
          resolvePromise(promise2, x, res, rej)
        } catch (error) {
          rej(self.value)
        }
      }, 0);
    }

    if (self.status === REJECTED) {
      // 秘籍规定这里不能同步调用
      setTimeout(() => {
        // 预防出错
        try {
          let x = _onReject(self.value);
          resolvePromise(promise2, x, res, rej)
        } catch (error) {
          rej(self.value)
        }
      }, 0);
    }
  })

  return promise2;

  // return new _Promise((res, rej) => {
  //   if (self.status === PENDING) {
  //     self.resolveCallbacks.push(() => {
  //       let x = _onResolve(self.value);
  //       // 如果回调的返回值是object或者function就提取then方法手动执行并传入新的resolve/reject
  //       // 否则直接执行相应的resolve/reject
  //       // 这样就可以实现链式调用
  //       if (x != null && (typeof x === 'object' || typeof x === 'function')) {
  //         let then = x.then;
  //         then.call(x, res, rej)
  //         return
  //       }
  //       res(x)
  //     });
  //     self.rejectCallbacks.push(() => {
  //       let x = _onReject(self.value);
  //       if (x != null && (typeof x === 'object' || typeof x === 'function')) {
  //         let then = x.then;
  //         then.call(x, res, rej)
  //         return
  //       }
  //       rej(x)
  //     });
  //   }

  //   // 当then执行的时候判断status!=PENDING，则立即调用resolve
  //   if (self.status === FULLFILLED) {
  //     let x = _onResolve(self.value);
  //     if (x != null && (typeof x === 'object' || typeof x === 'function')) {
  //       let then = x.then;
  //       then.call(x, res, rej)
  //       return
  //     }
  //     res(x)
  //   }

  //   if (self.status === REJECTED) {
  //     let x = _onReject(self.value);
  //     if (x != null && (typeof x === 'object' || typeof x === 'function')) {
  //       let then = x.then;
  //       then.call(x, res, rej)
  //       return
  //     }
  //     rej(x)
  //   }
  // })
}

// 测试
// const testSync = new _Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve(100);
//     // let random = Math.random();
//     // if (random > 0.5) {
//     //   resolve(100);
//     // } else {
//     //   reject(10);
//     // }
//   }, 0);
// })
// testSync.then(
//   (value) => {
//     console.log("resolve1:", value);
//     return value + 1
//   },
//   (err) => {
//     console.error("error:", err);
//   }
// ).then(
//   (value) => {
//     console.log("resolve2:", value);
//     return value + 0.1
//   },
//   (err) => {
//     console.error("error:", err);
//   }
// ).then(
//   (value) => {
//     console.log("resolve3:", value);
//     // return value + 1
//   },
//   (err) => {
//     console.error("error:", err);
//   }
// )

_Promise.prototype.all = function(promiseArray) {
  // 新增一个count计数, 一个存放返回值的数组
  // 当所有的promise都执行完以后调用resolve即可
  return new _Promise((resolve,reject) => {
    let responseArr = [];
    let count = 0;
    promiseArray.forEach(promise => {
      promise.then((data) => {
        responseArr.push(data);
        count++;
        if (count === promiseArray.length) {
          resolve(responseArr);
        }
      }, reject)
    })
  })
}

_Promise.prototype.race = function(promiseArray){
  // race是谁现跑赢执行谁
  // promise控制执行resolve/reject的flag是status，所以直接把两个方法传入，现完成的promise会优先改变status，剩下的就没有办法再执行了
  return new _Promise((resolve,reject) => {
    promiseArray.forEach(promise => {
      promise.then(resolve, reject);
    })
  })
}

const test = new _Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(100);
  }, 500)
  // resolve(100);
});

const test1 = function (data) {
  return new _Promise((resolve, reject) => {
    setTimeout(() => {
      let random = Math.random();
      if (random > 0.5) {
        resolve(data + 0.1);
      } else {
        reject(data + 0.1);
      }
    }, 500)
  });
}

const test2 = function (data) {
  return new _Promise((resolve, reject) => {
    setTimeout(() => {
      let random = Math.random()
      console.log(random);
      if (random > 0.5) {
        resolve(data + random);
      } else {
        reject(data + random);
      }
    }, 100)
  });
}
test
  .then((data) => {
    console.log("resolve1:", data);
    return data + 5;
  }, (data) => {
    console.log("error1:", data);
  })
  .then((data) => {
    console.log("resolve2:", data);
    return data + 6
  }, (data) => {
    console.log("error2:", data);
  })
  .then((data) => {
    console.log("resolve3:", data);
    return test1(data)
  }, (data) => {
    console.log("error3:", data);
  })
  .then((data) => {
    console.log("resolve4:", data);
    return test2(data)
  }, (data) => {
    console.log("error4:", data);
  })
  .then((data) => {
    console.log("resolve5:", data);
  }, (data) => {
    console.log("error5:", data);
  })

