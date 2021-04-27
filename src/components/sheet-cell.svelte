<template lang="pug">
svelte:options(immutable tag="sheet-cell")
+if("column.key")
  .cell-wrap(
    bind:this="{cell}"
    on:click="{cellClickHandler}"
    class="{alignClassName}"
    class:active="{isActive}"
    class:editting="{isEditting}"
    class:error="{!!getErrorMsg()}"
    title="{getErrorMsg()}"
  )
    +if("type === 'nothing'")
      span
      +elseif("type === 'input'")
        +if("!isEditting")
          span.value {getDisplayValue(value)}
          +else
            input(type="text" class="{alignClassName}" bind:this="{inputDom}" bind:value="{valueInner}" disabled="{disabled}" on:keyup="{inputKeyupHandler}" on:blur="{rewriteValue}")
      +elseif("type === 'date'")
        +if("!isActive")
          span.value {value}
          +else
            input(type="date" bind:this="{dateDom}" bind:value="{valueInner}" disabled="{disabled}" on:keyup="{inputKeyupHandler}" on:blur="{rewriteValue}")
      +elseif("type === 'time'")
        +if("!isActive")
          span.value {value}
          +else
            input(type="time" bind:this="{timeDom}" bind:value="{valueInner}" disabled="{disabled}" on:keyup="{inputKeyupHandler}" on:blur="{rewriteValue}")
      +elseif("type === 'select'")
        +if("!isActive")
          span.value {getLabelFromDict(value, selectItems)}
          +else
            select.single(bind:this="{selectDom}" bind:value="{valueInner}" disabled="{disabled}" on:blur="{rewriteValue}")
              option(value="" style="display: none;") {isCn ? '请选择' : 'Select...'}
              +each("selectItems as option")
                option(value="{option.value}") {option.label}
      +elseif("type === 'select-multi'")
        +if("!isActive")
          span.value {getLabelFromDict(value, selectItems)}
          +else
            select.multi(bind:this="{selectDom}" bind:value="{valueInner}" multiple disabled="{disabled}" on:blur="{rewriteValue}")
              option(value="" style="display: none;") {isCn ? '请选择' : 'Select...'}
              +each("selectItems as option")
                option(value="{option.value}" style="height: 25px; background: #fff") {option.label}
      +elseif("type === 'image'")
        +if("value.length")
          +each("value as imgUrl, imgIndex (imgIndex)")
            span.img-wrap(on:contextmenu!="{e => e.preventDefault()}")
              img.img(src="{imgUrl}" alt="" on:click!="{() => $previewImageUrl=imgUrl}")
              span.img-remove(title="{isCn ? '删除' : 'remove'}" on:click="{imageRemoveHandler(imgIndex)}") ×
        +if("props.uploadApi")
          input.file-uploader(type="file" accept="{uploadAccept}" bind:this="{fileDom}" disabled="{disabled}" on:change="{uploadFileHandler}")
          span.file-uploader-label(title="{isCn ? '上传' : 'upload'}" class="{!canUploadMore || isUploading ? 'disabled' : ''}" on:click="{uploadClickHandler}")
      +else
        span.value {value}
</template>

<script>
  import { onMount, tick } from 'svelte';
  import {
    curRowIndex,
    curColIndex,
    maxRowIndex,
    maxColIndex,
    keepCellDom,
    getCurrentRowCol,
    updateRowColIndex,
    changeRowByOffset,
    recalculateRow,
    focusTextarea,
    previewImageUrl
  } from '@/store/store';
  import { getLabelFromDict, genRandId, checkIfCn } from '@/helper/func';
  export let row = {};
  export let column = {};
  export let id = '';

  let value = '';
  let valueInner = '';
  let valueOld = '';
  let isFocused = false;
  let isRewriting = false;
  let isUploading = false;

  let cell = null;
  let inputDom = null;
  let selectDom = null;
  let dateDom = null;
  let timeDom = null;
  let fileDom = null;

  $: isActive = id === $curRowIndex + '.' + $curColIndex;
  $: isEditting = isActive && isFocused;
  $: type = column.type || 'input';
  $: props = column.props || {};
  $: params = column.params || {};
  $: alignClassName =
    column.align === 'right'
      ? 't-right'
      : column.align === 'center'
      ? 't-center'
      : 't-left';
  $: disabled = column.disabled || props.disabled || !!params.computed;
  $: selectItems = column.items || props.items || [];
  $: rowIndex = +id.split('.')[0];
  $: colIndex = +id.split('.')[1];
  $: uploadAccept = props.accept || 'image/*';
  $: canUploadMore = (props.max || 100) > (value || []).length;
  $: isCn = checkIfCn();

  // 如果当前单元格已不是激活状态,取消聚焦状态(隐藏内部的input,select元素,只显示文本)
  // 如果当前单元格时激活状态,将录入内容方法放入row对象
  $: {
    if (!isActive) {
      if (params.computed) {
        value = params.computed(row, column);
      }
      isFocused = false;
      valueInner = value;
      valueOld = value;
    } else {
      if (cell) {
        cell.methods = {
          typeInMethod: typeIn,
          focusMethod: focusInnerDom,
          clearMethod: clearValue,
          restoreMethod: restoreValue
        };
        keepCellDom(cell);
      }
    }
  }

  onMount(() => {
    init();
  });

  // 初始化,记录行列最大值,给单元格赋值
  async function init() {
    if (rowIndex > $maxRowIndex) {
      maxRowIndex.set(rowIndex);
    }
    if (colIndex > $maxColIndex) {
      maxColIndex.set(colIndex);
    }
    await tick();
    value = row[column.key];
  }

  // 得到格式化后的value (前提是column中定义了formatter函数)
  function getDisplayValue(value) {
    if (value === null || value === undefined) value = '';
    const { formatter = v => v } = params;
    const { valid } = validate();
    if (valid !== true) return value;
    return formatter(value);
  }

  // 得到单元格校验错误时的信息
  function getErrorMsg() {
    const key = column.key;
    if (!key || !row._errorMsg) return;
    const msg = row._errorMsg[key];
    return msg;
  }

  // 单元格内部元素的值反写回单元格真实的值
  function rewriteValue(isForce = false) {
    if (isRewriting) return;
    isRewriting = true;
    if (!isActive && !isForce) return;
    if (disabled) return;
    const { valid, message = '' } = validate();
    value = valueInner || '';
    const key = column.key;
    row[key] = value;
    const shouldRefreshRow = valueOld !== value;
    if (shouldRefreshRow) {
      row._errorMsg = row._errorMsg || {};
      row._errorMsg[key] = message;
      row._id = genRandId();
      row = { ...row };
    }
    setTimeout(() => {
      isRewriting = false;
    }, 1);
    return valid;
  }

  // 清空单元格数据
  function clearValue(isForce = false) {
    if (isFocused && !isForce) return;
    if (disabled) return;
    if (['input', 'select', 'date'].includes(type)) {
      value = '';
      valueInner = '';
      // row[column.key] = '';
      rewriteValue();
    }
  }

  // 校验单元格的输入值
  function validate() {
    const [row, column] = getCurrentRowCol();
    const { validator = () => {} } = params;
    const message = validator(valueInner, row, column);
    const output = { valid: false, message };
    if (!message) {
      output.valid = true;
    }
    return output;
  }

  // 点击单元格(首次或再次)
  function cellClickHandler(e) {
    const target = e.path[0];
    const { tagName } = target;
    if (!['SPAN', 'DIV', 'IMG'].includes(tagName)) return;
    if (!isActive) {
      updateRowColIndex(rowIndex, colIndex);
    } else {
      if (disabled) return;
      isFocused = true;
      focusInnerDom();
    }
  }

  // 聚焦单元格内部的input等元素
  async function focusInnerDom() {
    if (disabled) return;
    if (!isFocused) isFocused = true;
    await tick();
    if (inputDom) {
      return inputDom.focus();
    }
  }

  // 向单元格内输入字符
  async function typeIn(content) {
    if (!isActive) return;
    if (isEditting) return;
    if (type !== 'input') return;
    if (disabled) return;
    isFocused = true;
    await tick();
    value = content;
    valueInner = content;
    inputDom.focus();
  }

  // 按ESC时,还原单元格原本的值
  function restoreValue() {
    if (disabled) return;
    value = valueOld;
    valueInner = valueOld;
    isFocused = false;
    focusTextarea();
  }

  // input输入框回车时
  function inputKeyupHandler(e) {
    // e.stopPropagation();
    if (e.keyCode === 13) {
      const result = rewriteValue();
      if (true || result) {
        isFocused = false;
        changeRowByOffset(1);
      }
    }
  }

  // 点击上传图标时
  function uploadClickHandler() {
    if (!canUploadMore) return;
    if (isUploading) return;
    fileDom.click();
  }

  // 上传文件/图片
  function uploadFileHandler(e) {
    const file = fileDom.files[0];
    fileDom.value = null;
    if (!file || !props.uploadApi) return;
    const fd = new FormData();
    fd.append('file', file);
    isUploading = true;
    fetch(props.uploadApi, {
      method: 'POST',
      body: fd
      // headers: {
      //   'Content-Type': 'multipart/form-data'
      // }
    })
      .then(res => res.json())
      .then(res => {
        const parse = input => {
          const regex = /^https?:\/\//;
          const type = typeof input;
          let result;
          if (!input) return;
          if (type === 'string' && regex.test(input)) return input;
          if (type === 'object') {
            for (let k in input) {
              result = parse(input[k]);
              if (result) break;
            }
          }
          return result;
        };
        const url = parse(res);
        if (url) {
          value = [...value, url];
        }
      })
      .catch(e => {
        console.error(e);
      })
      .finally(() => {
        isUploading = false;
      });
  }

  // 删除指定图片
  function imageRemoveHandler(idx) {
    value.splice(idx, 1);
    value = [...value];
  }
</script>

<style lang="less">
  .t-left {
    text-align: left;
  }
  .t-center {
    text-align: center;
  }
  .t-right {
    text-align: right;
  }
  .cell-wrap {
    position: relative;
    width: 100%;
    min-height: 31px;
    height: 100%;
    padding: 3px 10px;
    box-sizing: border-box;
    font-size: 15px;
    line-height: 25px;
    overflow: visible;
    // overflow: hidden;
    &.active {
      outline: 2px solid rgb(82, 146, 247);
    }
    &.error {
      outline: 1px solid #f55;
      &.active {
        outline-width: 2px;
      }
    }
    span.value {
      display: block;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: default;
    }
    .img-wrap {
      position: relative;
      display: inline-block;
      vertical-align: top;
      width: 25px;
      height: 25px;
      transition: transform 0.15s;
      &:hover {
        transform: scale(1.4);
        z-index: 1;
        .img-remove {
          display: block;
        }
      }
      & + .img-wrap {
        margin-left: 5px;
      }
      .img {
        position: relative;
        display: block;
        min-width: 25px;
        min-height: 25px;
        max-width: 25px;
        max-height: 25px;
        cursor: pointer;
      }
      .img-remove {
        display: none;
        position: absolute;
        z-index: 1;
        top: -4px;
        right: -4px;
        width: 14px;
        height: 14px;
        line-height: 13px;
        border-radius: 50%;
        transform: scale(0.7);
        text-align: center;
        user-select: none;
        background: red;
        color: #fff;
        cursor: pointer;
      }
    }
    .file-uploader {
      position: absolute;
      top: -2px;
      left: -2px;
      width: 1px;
      height: 1px;
      opacity: 0;
    }
    .file-uploader-label {
      position: absolute;
      width: 16px;
      height: 16px;
      right: 10px;
      top: 7px;
      background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAB+klEQVRYR+2WsU4bQRCG/9k9UFJRIqEookgaisjePQU5aUJHSZG4gIJYlmiSd8C8RKooQkKQKBRJkxoqGnsPhyJNUqSDPqIxtwxafAaDsO9ubWShcM3N3e3M/83caHYJI75oxPrwBigUghdS8g8AY8x4H0V23ScZL4BicSwU4vQbgEddomVj7HZeiNwAYRi8ZOYtAI9vEMsNkQtA62AO4M8AJvtkmgsiM4BSwTwRfwEwkYi7cr9J7K8Ayj6/IxOA1nIBgMv8QSLygYi2mXnHPRORq8xrZrzLC5EKMDuLyTiWR53AzPgURbYahsGrboBGI97VWn4EUL2EsFPG4LBfY6YCKDX+jMj+TIJsGWOXnH0TgHuvtdwEsOhsIcTzev2kPhBAqYSHrZaoENG/RsNudIL1AnDflZIrAI7j2H4/OMDxQAC9nPsB5JkFqb/gHuD/qkChgOlmE3+zNJFvE17XuGjCMJR7zCgxo5Jla/UB0Fq60e3GtjHGhudTtJOt1pKdzcxrUXRaS6uCD4BSokZEqy62MfZc+x7g7lZAKTwhkr/bfWOfRhH+pPXNUHvAiRWLmHH3/X38ShNvb1JDbMIsgtfX3B0An+yy+vScA93lyRpsgHXrxtjKlUGUTLZlAG8HCJzq6iatEGLXnSGvAKR63tIC7xPRsHhGDnAG+mhhMH7U/JEAAAAASUVORK5CYII=)
        0 0 no-repeat;
      background-size: 16px 16px;
      cursor: pointer;
      &.disabled {
        opacity: 0.25;
        cursor: not-allowed;
      }
    }
    input {
      border: none;
      outline: none;
      width: 100%;
      height: 100%;
      padding: 0;
      font-size: 15px;
      &[disabled] {
        background: #fff;
      }
    }
    select {
      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;
      width: 100%;
      padding: 0 6px;
      margin: 0;
      border: none;
      outline: none;
      font-size: 15px;
      overflow-y: auto;
      &.single {
        height: 100%;
      }
      &.multi {
        box-shadow: 0 0 5px #888;
        // box-sizing: border-box;
        // border: 1px solid #ddd;
        // border-bottom-left-radius: 4px;
        // border-bottom-right-radius: 4px;
      }
    }
  }
</style>
