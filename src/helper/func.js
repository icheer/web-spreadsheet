export const sleep = time => new Promise(resolve => setTimeout(resolve, time));

export const genRandId = () => {
  const prefix = ((Date.now() % 1000 + Math.random()) / 0.00000117).toString(16).replace('.', '').slice(-3);
  const rand = (Math.random()).toString(16).replace(/^0\./, '');
  return prefix + rand;
}

export const getLabelFromDict = (value, dict) => {
  if (!dict || !dict.length) return '';
  value = value || '';
  const type = typeof value;
  if (type === 'string') {
    const item = dict.find(i => i.value === value);
    return item && item.label || '';
  } else {
    const labels = value.map(v => {
      const item = dict.find(i => i.value === v);
      return item && item.label || '';
    });
    return labels.filter(l => !!l).join(',');
  }
}

export const dispatchEvent = (e, params) => {
  const { eventName, payload } = params;
  // 1. Create the custom event.
  const event = new CustomEvent(eventName, {
    detail: payload,
    bubbles: true,
    cancelable: true,
    composed: true // makes the event jump shadow DOM boundary
  });
  // 2. Dispatch the custom event.
  e.target.dispatchEvent(event);
};

export function simulateMouseDown(element) {
  // 无效....
  // pc端仅兼容UC,苹果...移动端支持安卓IOS微信钉钉.
  if (document.createEvent) {
    console.log(111);
    //element.focus();
    var e = document.createEvent('MouseEvents');
    e.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    element.dispatchEvent(e);
  } else if (elem.fireEvent) {
    console.log(222);
    element.fireEvent('onmousedown');
  }
}

// 判断是否中文页面
export function checkIfCn() {
  const lang = document.querySelector('html').getAttribute('lang') || '';
  return /zh-/i.test(lang);
}
