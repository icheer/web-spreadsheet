<template lang="pug">
svelte:options(tag="context-menu")
+if("show")
  .menu-wrap(on:click!="{e => closeMenu(e)}" style="{style}")
    +if("rowNum")
      .line.title { isCn ? `第${rowNum}行` : `Row ${rowNum}` }
      .line.item(on:click!="{() => insertRow(config.rowIndex)}") { isCn ? `插入行` : `Insert line` }
      +if("0")
        .line.item(on:click!="{() => emptyRow(config.rowIndex)}") { isCn ? `清空行` : `Empty line` }
      .line.item.danger(on:click!="{() => deleteRow(config.rowIndex)}") { isCn ? `删除行` : `Delete line` }
    +if("colNum")
      .line.title 第{ colNum }列
</template>

<script>
  import { contextMenuConfig, closeContextMenu, deleteRow, emptyRow, insertRow } from '@/store/store';
  $: config = $contextMenuConfig;
  $: show = config.show || false;
  $: x = config.x || 0;
  $: y = config.y || 0;
  $: colNum = config.colIndex === undefined ? undefined : config.colIndex + 1;
  $: rowNum = config.rowIndex === undefined ? undefined : config.rowIndex + 1;
  $: style = `top: ${y}px; left: ${x}px;`;
  $: lang = document.querySelector('html').getAttribute('lang') || '';
  $: isCn = /zh-/i.test(lang);

  // 显示菜单
  function showMenu() {
    updateConfig('show', true);
  }

  // 关闭菜单
  function closeMenu(e) {
    e.stopPropagation();
    closeContextMenu();
  }

  // 重设config对象(赋值)
  function updateConfig(key, val) {
    if (!key) return;
    let obj = JSON.parse(JSON.stringify(config));
    const type = typeof key;
    if (type === 'string') {
      obj[key] = val;
    } else {
      obj = { ...obj, ...key };
    }
    config = obj;
  }
</script>

<style lang="less">
  .menu-wrap {
    position: absolute;
    width: 94px;
    background-color: #fff;
    box-shadow: 0 0 4px #aaa;
    z-index: 9;
    .line {
      line-height: 32px;
      font-size: 14px;
      color: #888;
      text-align: center;
      cursor: default;
      white-space: nowrap;
      &.title {
        margin: 0 10px;
        border-bottom: 1px solid #eee;
      }
      &.item {
        font-size: 15px;
        color: #333;
        cursor: pointer;
        &:hover {
          background: #f1f1f1;
        }
        &.danger:hover {
          background: #fff1f1;
        }
      }
    }
  }
</style>
