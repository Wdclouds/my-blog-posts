---
slug: threejs-car-cockpit
title: 从零搭建 Three.js 全景车舱交互
date: 2026-08-18
category: engineering
tags: ["WebGL", "Three.js", "Vue"]
excerpt: 25MB Draco 压缩模型、三块 CanvasTexture 动态屏幕与 WebAudio 粒子搓碟的实战记录。
isFeatured: true
---

# 从零搭建 Three.js 全景车舱交互

在 WebGL 场景中构建沉浸式车载数字座舱时，我们面临三个核心挑战：**模型加载体积优化**、**2D/3D 动态屏幕投射**以及**交互响应性能**。

## 1. 模型与纹理加载管线

为了保证首屏加载速度，我们对原始 GLB 模型采用了 Draco 几何压缩与 KTX2/WebP 纹理格式：

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)
```

## 2. CanvasTexture 动态中控屏

通过将离屏 HTML5 Canvas 作为 Three.js 的 `CanvasTexture` 映射到车舱屏幕 Mesh 上，我们可以实现实时动态仪表盘刷新。

- **仪表盘转速表**: 60fps 缓动跟随
- **音乐播放状态**: 实时频谱同步

---

> 沉浸感不仅来自于高保真模型，更来自于细节层面的交互反馈。
