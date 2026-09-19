export const SITE = {
  title: 'LatentK',
  tagline: '把想法留在纸上',
  description: '一个关于学术、洞见、日常与资料收藏的个人站点。',
  author: 'Kai',
  url: 'https://latentk.com',
  github: 'https://github.com/',
  email: '',
};

export type SectionKey = 'academic' | 'insight' | 'dailies' | 'library' | 'projects';

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
  projects: {
    label: 'Projects',
    zh: '项目',
    href: '/projects/',
    emoji: '🛠️',
    desc: '机器人、软件与硬件项目。',
    rotate: '-0.7deg',
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

/** About 页工作台 */
export const WORKBENCH = {
  tools: [
    { name: 'Isaac Lab', note: '仿真训练主力' },
    { name: 'MuJoCo', note: '快速验证动力学' },
    { name: 'ROS 2', note: '真机通信' },
    { name: 'Zotero', note: '文献' },
    { name: 'Obsidian', note: '笔记' },
  ],
  hardware: [
    { name: 'Unitree Go2', note: '四足实验平台' },
    { name: 'RealSense D435', note: '深度相机' },
    { name: '4090 工作站', note: '训练' },
  ],
  questions: [
    '仿真与真机之间，到底是哪些差距最要命？',
    '机器人需要"记忆"吗，还是反应式策略就够了？',
    '一个策略能不能同时会走路和会抓东西？',
  ],
};

/** 页脚随机结束语 */
export const SIGNOFFS = [
  '今天也把想法留在纸上了。',
  '读到这里，起来动一动身体。',
  '机器人还在学走路，我也是。',
  '仿真里成立的，去真实世界试试。',
  '写下来，才知道自己没想清楚。',
];

/**
 * 留言：Web3Forms 的 access key（设计上就是公开的，放前端没问题）。
 * 到 https://web3forms.com 用你的邮箱免费领取，填到这里后 /guestbook/ 即可用。
 * 留空时页面显示"尚未配置"。
 */
export const WEB3FORMS_KEY = '';
