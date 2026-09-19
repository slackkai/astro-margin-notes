---
title: '四足机器人落地控制器'
date: 2026-09-01
description: '在 Isaac Lab 里训练一个能从空中落地并站稳的策略，然后部署到 Go2。'
status: active
stack: ['Isaac Lab', 'PyTorch', 'ROS 2', 'Go2']
tags: ['robotics', 'rl', 'sim2real']
links:
  github: 'https://github.com/example/quadruped-landing'
featured: true
---

## 目标

让四足机器人从 0.5m 高度落下后不翻倒，两秒内恢复站立。

## 进度

- [x] 仿真环境与奖励设计
- [x] PPO 训练，成功率 92%
- [ ] 真机部署
- [ ] 域随机化对比实验
