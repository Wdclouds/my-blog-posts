---
slug: coordinate-system
title: 空间直觉：右手坐标系与变换矩阵
order: 1
---

# 空间直觉：右手坐标系与变换矩阵

在 Three.js 与现代 3D 图形学中，一切视觉呈现的基础都建立在**空间坐标系**之上。

## 1. Three.js 的右手坐标系

Three.js 默认采用**右手笛卡尔坐标系**：
- **X 轴**：水平向右（Positive Right）
- **Y 轴**：垂直向上（Positive Up）
- **Z 轴**：垂直屏幕向外（Positive Towards You）

```javascript
import * as THREE from 'three';

// 创建一个基础场景与相机
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
```
