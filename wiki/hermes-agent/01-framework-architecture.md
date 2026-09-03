---
title: Hermes Agent 架构概览与执行循环
order: 1
---

# Hermes Agent 架构概览与执行循环

Hermes Agent 是由 Nous Research 打造的顶尖开源自主智能体框架。与传统的对话式 Bot 不同，Hermes 具备完整的环境感知、自主规划、工具链调用与自省校验闭环。

## 1. 核心架构设计

- **执行内核 (Kernel Loop)**: 基于观察 (Observe) -> 思考 (Think) -> 工具调用 (Act) -> 结果检验 (Verify) 的持续演进闭环。
- **环境隔离**: 具备独立的沙盒执行与文件持久化能力。
