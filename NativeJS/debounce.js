// 防抖函数
// let num = 1;
// let content = document.getElementById('content');

// function count() {
//   content.innerHTML = num++;
// };
// content.onmousemove = debounceTimeoutNow(count, 1000);

// 非立即执行版: 意思是触发事件后函数不会立即执行，而是在 n 秒后执行，如果在 n 秒内又触发了事件，则会重新计算函数执行时间。
function debounceTimeout(fn, wait) {
  let timeout
  return function () {
    let content = this
    let args = arguments
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      fn.apply(content, args)
    }, wait);
  }
}

// 立即执行版：触发后立即执行
// settimeout赋值的变量在clear以后依然存在，可以利用这一点用来做立即执行的判断
function debounceTimeoutNow(fn, wait) {
  let timeout
  return function () {
    let content = this
    let args = arguments
    if (timeout) clearTimeout(timeout);

    let runNow = !timeout
    if (runNow) {
      fn.apply(content, args)
    } else {
      timeout = setTimeout(() => {
        fn.apply(content, args)
      }, wait);
    }
  }
}