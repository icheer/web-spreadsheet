<template lang="pug">
  svelte:options(tag="spread-sheet")
  svelte:window(
    on:keydown="{keydownHandler}"
    on:keyup="{keyupHandler}"
    on:input="{inputHandler}"
  )
  .sheet-wrap(on:click="{wrapClickHandler}")
    image-preview
    textarea(type="hidden" bind:this="{textarea}")
    context-menu
    table
      +if("showrowindex")
        colgroup
      +each("$cols as col, colIndex (colIndex)")
        colgroup(style="{col.width ? `width: ${col.width}` : ''}")
      thead
        tr
          +if("showrowindex")
            th.row-head(on:contextmenu!="{e => closeContextMenu() || e.preventDefault()}") #
          +each("$cols as col, colIndex (colIndex)")
            th.col-head(class:highlight="{colIndex === $curColIndex}" on:contextmenu!="{e => closeContextMenu() || e.preventDefault()}")
              span {col.text}
              +if("!(col.params && col.params.computed)")
                span.icon(class:active="{$sortBy[0] === col.key}" on:click!="{() => toggleColumnSortHandler(col)}") {$sortBy[0] !== col.key ? '↾' : $sortBy[1] ? '↾' : '⇂'}
      +if("show")
        tbody
          +each("$rows as row, rowIndex (row._id)")
            tr
              +if("showrowindex")
                td.row-head(class:highlight="{rowIndex === $curRowIndex}" on:contextmenu!="{e => headRightClickHandler(e, rowIndex)}") {rowIndex + 1}
              +each("$cols as col, colIndex (colIndex)")
                td
                  sheet-cell(row="{row}" column="{col}" id="{rowIndex}.{colIndex}")
</template>

<script>
  import { onMount, afterUpdate, tick } from 'svelte';
  import {
    cols,
    rows,
    curColIndex,
    curRowIndex,
    sortBy,
    keepTextareaDom,
    initRowsAndCols,
    keydownHandler,
    keyupHandler,
    inputHandler,
    showContextMenu,
    closeContextMenu,
    toggleColumnSort,
    pushHistoryAndEmitEvent
  } from '@/store/store';
  import { dispatchEvent } from '@/helper/func';
  import '_/sheet-cell.svelte';
  import '_/context-menu.svelte';
  import '_/image-preview.svelte';

  export let columns = [];
  export let data = [];
  export let showrowindex = true;
  let show = true;
  let textarea = null;

  onMount(() => {
    keepTextareaDom(textarea);
    setTimeout(() => {
      initRowsAndCols(data, columns);
    }, 100);
  });

  afterUpdate(() => {
    if (!columns.length || !data.length) return;
    emitEventWhenChanged();
  });

  // 右键点击行号或列号时
  function headRightClickHandler(
    e,
    rowIndex = undefined,
    colIndex = undefined
  ) {
    e.preventDefault();
    const { layerX, layerY } = e;
    const config = {
      x: layerX,
      y: layerY,
      rowIndex,
      colIndex
    };
    showContextMenu(config);
  }

  // 点击事件
  function wrapClickHandler() {
    closeContextMenu();
  }

  // 当行数据发生改变时,向外层发射事件,传递最新的行数据
  function emitEventWhenChanged() {
    pushHistoryAndEmitEvent();
  }

  // 切换排序
  async function toggleColumnSortHandler(col) {
    toggleColumnSort(col);
    show = false;
    await tick();
    show = true;
  }
</script>

<style lang="less">
  textarea {
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    opacity: 0;
  }
  .sheet-wrap {
    position: relative;
    table {
      position: relative;
      width: 100%;
      padding: 0;
      margin: 0;
      overflow: visible;
      border-collapse: collapse;
      table-layout: fixed;
      tr {
        th,
        td {
          min-height: 25px;
          padding: 0;
          border: 1px solid #ddd;
          box-sizing: border-box;
          background-color: #fff;
          &.row-head {
            width: 35px;
            background-color: #f8f8f8;
            color: #555;
            font-size: 13.5px;
            box-sizing: border-box;
            text-align: center;
            white-space: nowrap;
            user-select: none;
          }
          &.highlight {
            background-color: #ddd;
          }
        }
      }
      thead {
        position: relative;
        th {
          position: sticky;
          top: 0;
          z-index: 1;
          transform: translateY(-1px);
          border-top-width: 2px;
          background-color: #f8f8f8;
          color: #555;
          &:hover .icon {
            display: block;
          }
          .icon {
            display: none;
            position: absolute;
            width: 20px;
            top: 0;
            right: 2px;
            text-align: center;
            cursor: pointer;
            user-select: none;
            &.active {
              display: block;
            }
          }
        }
      }
    }
  }
</style>
