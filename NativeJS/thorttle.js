// 防抖函数
let num = 1;
let content = document.getElementById('content');

function count() {
  content.innerHTML = num++;
};
content.onmousemove = debounceTimeoutNow(count, 1000);

// 时间戳版
function thorttleDate(fn, wait) {
  let previous = 0
  return function () {
    let context = this;
    let args = arguments;
    let current = new Date.now();
    if (Math.abs(previous - current) > wait) {
      fn.apply(context, args);
      previous = current;
    }
  }
}

// timeout版
function thorttleTimeout(fn, wait) {
  let timeout
  return function () {
    let context = this;
    let args = arguments;
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        fn.apply(context, args);
      }, wait)
    }
  }
}