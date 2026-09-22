---
title: 'Attention Is All You Need 精读笔记'
date: 2026-09-10
description: 'Transformer 原始论文的结构梳理，重点是多头注意力与位置编码。'
kind: note
venue: NeurIPS 2017
authors: ['Vaswani', 'Shazeer', 'Parmar', 'et al.']
year: 2017
tags: ['transformer', 'attention', 'nlp']
links:
  arxiv: 'https://arxiv.org/abs/1706.03762'
  code: 'https://github.com/tensorflow/tensor2tensor'
bibtex: |
  @inproceedings{vaswani2017attention,
    title={Attention is all you need},
    author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and others},
    booktitle={NeurIPS},
    year={2017}
  }
---

## 核心思想

完全抛弃循环与卷积，:mark[仅用注意力机制建模序列依赖]。:note[这一句话在 2017 年是很激进的主张。当时的主流是 LSTM 加注意力。]

## 缩放点积注意力

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

除以 $\sqrt{d_k}$ 是为了防止点积过大导致 softmax 进入梯度极小的区域。:note[这里的 $d_k$ 是键向量的维度，不是序列长度。我第一次读时搞混了。]

## 多头注意力

把 $Q, K, V$ 各自线性投影 $h$ 次，并行做注意力后拼接：

$$
\mathrm{MultiHead}(Q,K,V) = \mathrm{Concat}(\mathrm{head}_1,\dots,\mathrm{head}_h)W^O
$$

## 位置编码

```python
def positional_encoding(pos, i, d_model):
    angle = pos / (10000 ** (2 * (i // 2) / d_model))
    return math.sin(angle) if i % 2 == 0 else math.cos(angle)
```

## 我的疑问

- 为什么正弦编码而不是可学习编码？论文说效果相近，但正弦能外推到更长序列。:note[后来的 RoPE 和 ALiBi 都在改这一处。具身场景里位置往往是连续的物理量，:mark[这个假设值得重新审视]。]
- 后续工作（RoPE、ALiBi）如何改进？留待补充。
