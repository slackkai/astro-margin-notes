export const SITE = {
  title: 'LatentK',
  tagline: '把想法留在纸上',
  description: '一个关于学术、洞见、日常与资料收藏的个人站点。',
  author: 'Kai',
  url: 'https://latentk.com',
  github: 'https://github.com/',
  email: '',
};

export type SectionKey = 'academic' | 'insight' | 'dailies' | 'library';

export const SECTIONS: Record<
  SectionKey,
  { label: string; zh: string; href: string; emoji: string; desc: string; rotate: string }
> = {
  academic: {
    label: 'Academic',
    zh: '学术',
    href: '/academic/',
    emoji: '🎓',
    desc: '论文笔记、研究记录与发表。',
    rotate: '-1deg',
  },
  insight: {
    label: 'Insight',
    zh: '洞见',
    href: '/insight/',
    emoji: '✍️',
    desc: '长文、观点与方法论。',
    rotate: '1deg',
  },
  dailies: {
    label: 'Dailies',
    zh: '日常',
    href: '/dailies/',
    emoji: '📸',
    desc: '碎碎念、日志与生活切片。',
    rotate: '-0.5deg',
  },
  library: {
    label: 'Library',
    zh: '资料库',
    href: '/library/',
    emoji: '📚',
    desc: '书、论文、工具与链接的收藏架。',
    rotate: '0.7deg',
  },
};

export const NAV = [
  { label: 'Home', href: '/' },
  ...Object.values(SECTIONS).map((s) => ({ label: s.label, href: s.href })),
  { label: 'Tags', href: '/tags/' },
  { label: 'About', href: '/about/' },
];

/** Academic 页顶部的研究方向卡片 */
export const RESEARCH_TOPICS = [
  { emoji: '🦾', title: '机器人学习', desc: '让机器人从数据和交互中学会技能，而不是靠人手写控制律。' },
  { emoji: '🧠', title: '具身智能', desc: '感知、决策与动作在同一个身体里闭环。' },
  { emoji: '🔁', title: 'Sim-to-Real', desc: '在仿真里训练，在真实世界里成立。' },
];
