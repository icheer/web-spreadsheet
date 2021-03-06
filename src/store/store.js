import { genRandId } from '@/helper/func';
import { writable, get } from 'svelte/store';
import { tick } from 'svelte';

export const cols = writable([]);
export const rows = writable([]);

export const curRowIndex = writable(-1);
export const curColIndex = writable(-1);
export const sortBy = writable(['_index', true]);
export const maxRowIndex = writable(0);
export const maxColIndex = writable(0);
export const contextMenuConfig = writable({});
export const previewImageUrl = writable(null);
export const history = writable([]);
const MAX_HISTORY_COUNT = 20;
let preventPushHistory = false;

const textarea = writable(null);
const cell = writable(null);

// 更新当前高亮的单元格
export function updateRowColIndex(r, c) {
  curRowIndex.set(+r);
  curColIndex.set(+c);
  focusTextarea();
}

// 保持textarea dom对象
export function keepTextareaDom(dom) {
  textarea.set(dom);
}

// 初始化行列数据
export function initRowsAndCols(rowsData, colsData) {
  cols.set(colsData);
  rowsData.forEach((r, rIndex) => {
    r._id = genRandId();
    r._index = rIndex;
    r._errorMsg = {};
  });
  rows.set(rowsData);
}

// 保持当前高亮的单元格dom
export function keepCellDom(dom) {
  if (!dom) return;
  cell.set(dom);
}

// 组合快捷键
export function keydownHandler(e) {
  const { key, ctrlKey } = e;
  if (/Arrow/.test(key)) {
    e.preventDefault();
  }
  if (key === 'z' && ctrlKey) {
    const isTextareaFocused = e.path[0].tagName === 'TEXTAREA';
    if (!isTextareaFocused) return;
    e.preventDefault();
    undoHistory();
  }
  if (key === 'y' && ctrlKey) {
    const isTextareaFocused = e.path[0].tagName === 'TEXTAREA';
    if (!isTextareaFocused) return;
    e.preventDefault();
    redoHistory();
  }
}

// 方向键,Tab,Delete,Esc
export function keyupHandler(e) {
  e.preventDefault();
  const { key } = e;
  if (/^Arrow/.test(key)) {
    if (key === 'ArrowUp') {
      changeRowByOffset(-1);
    }
    if (key === 'ArrowDown') {
      changeRowByOffset(1);
    }
    if (key === 'ArrowLeft') {
      changeColByOffset(-1);
    }
    if (key === 'ArrowRight') {
      changeColByOffset(1);
    }
    return;
  }
  if (key === 'Tab') {
    changeColByOffset(1);
  }
  if (key === 'Escape') {
    restoreCell();
    previewImageUrl.set(null);
  }
  if (key === 'Delete' || key === 'Backspace') {
    clearCell();
  }
}

// 单元格仅高亮就输入文字时,自动聚焦input并填入
export function inputHandler(e) {
  const isTextareaFocused = e.path[0].tagName === 'TEXTAREA';
  if (!isTextareaFocused) return;
  let { isComposing, data, inputType } = e;
  if (inputType === 'insertLineBreak') {
    changeRowByOffset(1);
    return;
  }
  if (inputType === 'insertFromPaste') {
    data = get(textarea).value;
  }
  focusCell();
  if (!isComposing) {
    typeInCell(data);
  }
  get(textarea).value = '';
}

// 将高亮单元格移到0,0
export function goToTopLeft() {
  updateRowColIndex(0, -1);
  changeColByOffset(1);
}

// 获取当前高亮的单元格行列index
export function getCurrentRowColIndex() {
  return [get(curRowIndex), get(curColIndex)];
}

// 获取当前行列信息(json)
export function getCurrentRowCol() {
  const [curRowIdx, curColIdx] = getCurrentRowColIndex();
  const row = get(rows)[curRowIdx];
  const col = get(cols)[curColIdx];
  return [row, col];
}

// 当前高亮的单元格 行+1或-1
export function changeRowByOffset(offset = 1) {
  const [cur, max] = [get(curRowIndex), get(maxRowIndex)];
  if (cur <= 0 && offset < 0) return;
  if (cur >= max && offset > 0) return;
  curRowIndex.update(idx => idx + offset);
  focusTextarea();
  intoView();
}

// 当前高亮的单元格 列+1或-1
export function changeColByOffset(offset = 1) {
  const [cur, max] = [get(curColIndex), get(maxColIndex)];
  if (cur <= 0 && offset < 0) return;
  if (cur >= max && offset > 0) return;
  curColIndex.update(idx => idx + offset);
  focusTextarea();
  intoView();
}

// 让当前高亮单元格滚动到视野里
export function intoView() {
  const dom = get(cell);
  if (!dom) return;
  dom.scrollIntoViewIfNeeded();
}

// 清除当前单元格
export function clearCell(isForce = false) {
  const dom = get(cell);
  if (!dom.methods) return;
  dom.methods.clearMethod();
}

// 聚焦当前单元格
export function focusCell() {
  const dom = get(cell);
  dom.methods && dom.methods.focusMethod();
}

// 向单元格内填写文字
export function typeInCell(data) {
  const dom = get(cell);
  dom.methods && dom.methods.typeInMethod(data);
}

// 按esc时,恢复单元格旧值
export function restoreCell() {
  const dom = get(cell);
  dom.methods && dom.methods.restoreMethod();
}

// 聚焦textarea,用于接收input事件
export function focusTextarea() {
  const dom = get(textarea);
  dom.value = '';
  dom.focus();
}

// 删除行
export function deleteRow(rowIndex) {
  let data = get(rows);
  data.splice(rowIndex, 1);
  rows.set(data);
  maxRowIndex.update(val => --val);
  emitCustomizedEvent('delete', rowIndex);
}

// 清空行
export function emptyRow(rowIndex) {
  rows.update(data => {
    let row = data[rowIndex];
    row = resetObject(row);
    data.splice(rowIndex, 1, row);
    return data;
  });
}

// 插入行
export function insertRow(rowIndex) {
  rows.update(data => {
    let row = data[rowIndex];
    const { _index } = row;
    row = resetObject(row);
    row._id = genRandId();
    row._isNew = true;
    row._index = +((_index - 0.01).toFixed(2));
    row._errorMsg = {};
    data.splice(rowIndex, 0, row);
    return data;
  });
  maxRowIndex.update(val => ++val);
  emitCustomizedEvent('insert', rowIndex);
}

// 清空对象(删除掉函数属性)
export function resetObject(data) {
  data = Object.assign({}, data);
  for (let key in data) {
    const type = typeof data[key];
    if (type === 'function') {
      delete data[key];
    } else if (type === 'object') {
      if (Array.isArray(data[key])) {
        data[key] = [];
      } else {
        data[key] = '';
      }
    } else {
      data[key] = '';
    }
  }
  return copy(data);
}

// 行号/列号右击时,显示右键菜单
export function showContextMenu({
  x = 0,
  y = 0,
  rowIndex = undefined,
  colIndex = undefined
}) {
  const config = {
    show: true,
    x,
    y,
    rowIndex,
    colIndex
  };
  contextMenuConfig.set(config);
}

// 隐藏右键菜单
export function closeContextMenu() {
  contextMenuConfig.set({});
}

// 切换列排序
export async function toggleColumnSort(col) {
  const sort = get(sortBy);
  let [key, asc] = sort;
  if (key === col.key) {
    if (asc) {
      sortBy.set([col.key, false]);
    } else {
      sortBy.set(['_index', true]);
    }
  } else {
    sortBy.set([col.key, true]);
  }
  let list = get(rows);
  list = list.sort((i, j) => {
    return i._index - j._index;
  });
  [key, asc] = get(sortBy);
  if (key !== 'index') {
    const treatAsArr = list.every(i => {
      return Array.isArray(i[key]);
    });
    const treatAsStr = list.some(i => {
      const num = +i[key];
      return Number.isNaN(num) || !Number.isFinite(num);
    });
    list = list.sort((i, j) => {
      const prev = i[key];
      const next = j[key];
      if (treatAsArr) {
        if (asc) {
          return prev.length - next.length;
        } else {
          return next.length - prev.length;
        }
      } else if (treatAsStr) {
        if (asc) {
          return (prev || '').localeCompare(next || '');
        } else {
          return (next || '').localeCompare(prev || '');
        }
      } else {
        if (asc) {
          return prev - next;
        } else {
          return next - prev;
        }
      }
    });
  }
  preventPushHistory = true;
  await tick();
  rows.set(list);
  await tick();
  preventPushHistory = false;
}

// 保存历史记录并向外层发射事件
export function pushHistoryAndEmitEvent() {
  if (preventPushHistory) return;
  const proceed = (...args) => {
    pushHistory(...args);
    emitEvent(...args);
  };
  const list = get(history);
  const nowData = copy(get(rows));
  if (!list.length) {
    proceed(nowData, list, -1);
    return;
  }
  const currentIndex = list.findIndex(i => i.current);
  const currentHistory = list[currentIndex];
  if (JSON.stringify(nowData) === JSON.stringify(currentHistory.data)) return;
  if (Math.abs(nowData.length - currentHistory.data.length) > 1) return;
  if (Object.keys(nowData[0] || {}).sort().join(':') !== Object.keys(currentHistory.data[0] || {}).sort().join(':')) return;
  proceed(nowData, list, currentIndex);
}

// 向历史记录数组push一条最新记录
function pushHistory(nowData, list, currentIndex) {
  if (!nowData || !nowData.length) return;
  const [rowIndex, colIndex] = getCurrentRowColIndex();
  const sort = get(sortBy);
  const obj = {
    data: nowData,
    rowIndex,
    colIndex,
    sort,
    current: true
  };
  if (list[currentIndex]) list[currentIndex].current = false;
  list = list.slice(0, currentIndex + 1);
  list = [...list, obj];
  list = list.slice(0 - MAX_HISTORY_COUNT);
  history.set(list);
}

// 撤销一次历史记录(undo)
export async function undoHistory() {
  let list = get(history);
  let currentIndex = list.findIndex(i => i.current);
  if (currentIndex <= 0) return false;
  list[currentIndex--].current = false;
  list[currentIndex].current = true;
  list = [...list];
  const { data, rowIndex, colIndex, sort } = list[currentIndex];
  curRowIndex.set(rowIndex);
  curColIndex.set(colIndex);
  sortBy.set(sort);
  preventPushHistory = true;
  await tick();
  rows.set(copy(data));
  await tick();
  preventPushHistory = false;
  history.set(list);
  intoView();
  return currentIndex > 0;
}

// 重做一次历史记录(redo)
export async function redoHistory() {
  let list = get(history);
  let currentIndex = list.findIndex(i => i.current);
  if (currentIndex === -1 || currentIndex >= list.length - 1) return false;
  list[currentIndex++].current = false;
  list[currentIndex].current = true;
  list = [...list];
  const { data, rowIndex, colIndex, sort } = list[currentIndex];
  curRowIndex.set(rowIndex);
  curColIndex.set(colIndex);
  sortBy.set(sort);
  preventPushHistory = true;
  await tick();
  rows.set(copy(data));
  await tick();
  preventPushHistory = false;
  history.set(list);
  intoView();
  return currentIndex < list.length - 1;
}

// 向组件外层传递行数据
function emitEvent(nowData) {
  let data = copy(nowData);
  let keysIgnored = get(cols).filter(c => c.params && c.params.computed).map(c => c.key);
  keysIgnored = ['_id', '_index', ...keysIgnored];
  data.forEach(r => {
    keysIgnored.forEach(k => {
      delete r[k];
    });
  });
  emitCustomizedEvent('change', data);
}

// 向组件外层传递自定义事件
function emitCustomizedEvent(eventName, data) {
  // 1. Create the custom event.
  const event = new CustomEvent(eventName, {
    detail: data,
    bubbles: true,
    cancelable: true,
    composed: true // makes the event jump shadow DOM boundary
  });
  // 2. Dispatch the custom event.
  // e.target.dispatchEvent(event);
  const dom = get(textarea);
  if (!dom) return;
  dom.dispatchEvent(event);
}

// 复制json
function copy(json) {
  return JSON.parse(JSON.stringify(json));
}
