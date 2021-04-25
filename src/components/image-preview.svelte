<template lang="pug">
svelte:options(immutable tag="image-preview")
+if("isMaskShow")
  .mask(class="{isFadingOut ? 'fading-out' : ''}" on:mousewheel="{scrollHandler}")
    img.img(
      src="{$previewImageUrl}"
      alt=""
      style="transform: scale({zoom});"
      on:click!="{e => e.stopPropagation()}"
      on:dragstart!="{e => e.preventDefault()}"
    )
    .close(on:click="{close}") ×
</template>

<script>
  import { previewImageUrl } from '@/store/store';
  let isFadingOut = false;
  let zoom = 1;
  $: isMaskShow = $previewImageUrl || isFadingOut;

  // 图片滚轮缩放
  function scrollHandler(e) {
    const { deltaY } = e;
    if (deltaY < 0) {
      if (zoom >= 2) return;
      zoom += 0.1;
    } else {
      if (zoom <= 0.5) return;
      zoom -= 0.1;
    }
  }

  // 关闭图片预览遮罩层
  function close() {
    $previewImageUrl = null;
    isFadingOut = true;
    setTimeout(() => {
      isFadingOut = false;
      zoom = 1;
    }, 300);
  }
</script>

<style lang="less">
  .mask {
    position: fixed;
    z-index: 2999;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.45);
    user-select: none;
    animation: fadeIn 0.3s;
    &.fading-out {
      animation: fadeOut 0.305s;
    }
    .img {
      display: block;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      margin: auto auto;
      width: 30vw;
      height: auto;
      transition: all 0.15s;
    }
    .close {
      position: absolute;
      top: 25px;
      right: 30px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid #fff;
      color: #fff;
      text-align: center;
      line-height: 32px;
      font-size: 34px;
      opacity: 0.85;
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
</style>
