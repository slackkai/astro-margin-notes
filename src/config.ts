/**
 * ------------------------------------------------------------------
 *  站点配置 / Site configuration
 *  功能与布局配置。站点基本信息见 src/data/site.json，正文见 src/content/。
 *  Theme behavior and layout. Site identity: src/data/site.json. Content: src/content/.
 * ------------------------------------------------------------------
 */

import site from './data/site.json';
import interactions from './data/interactions.json';
import { interactionsSchema } from './utils/interactions.mjs';

const siteSettings: {
  title: string; tagline: string; description: string; author: string;
  url: string; github?: string; email?: string;
  /** 页脚随机结束语，留空则不显示；在后台“站点设置 → 基本信息”编辑 */
  signoffs?: string[];
} = site;

export type Lang = 'zh' | 'en';
export type SectionKey = 'academic' | 'insight' | 'dailies' | 'library' | 'projects';
export type PaletteId = 'blue' | 'classic' | 'green' | 'mono';

export const config = {
  /** CMS：站点设置 → 导航与评论。 */
  interactions: interactionsSchema.parse(interactions),
  /** 界面语言（决定 src/i18n 里用哪套字典）与 <html lang> */
  lang: 'zh' as Lang,
  htmlLang: 'zh-CN',

  /** 可在 /admin/ 的“站点设置”中编辑，对应 src/data/site.json。 */
  site: { ...siteSettings, github: siteSettings.github ?? '', email: siteSettings.email ?? '', signoffs: (siteSettings.signoffs ?? []).filter(Boolean) },

  /**
   * 板块。enabled: false 会从导航、首页、归档、RSS、搜索里隐藏该板块
   * （页面文件仍在，若要彻底移除可删除 src/pages/<key> 与 src/content/<key>）。
   */
  sections: {
    academic: { enabled: true, emoji: '🎓', label: 'Academic', subtitle: '学术', desc: '论文笔记、研究记录与发表。' },
    insight: { enabled: true, emoji: '✍️', label: 'Insight', subtitle: '洞见', desc: '长文、观点与方法论。' },
    dailies: { enabled: true, emoji: '📸', label: 'Dailies', subtitle: '日常', desc: '碎碎念、日志与生活切片。' },
    library: { enabled: true, emoji: '📚', label: 'Library', subtitle: '资料库', desc: '书、论文、工具与链接的收藏架。' },
    projects: { enabled: true, emoji: '🛠️', label: 'Projects', subtitle: '项目', desc: '正在做和做过的东西。' },
  } satisfies Record<SectionKey, { enabled: boolean; emoji: string; label: string; subtitle: string; desc: string }>,

  /** 导航栏：Home + 已启用板块 + 下面这些 */
  navExtra: [
    { label: 'Tags', href: '/tags/' },
    { label: 'About', href: '/about/' },
  ],

  /** 功能开关 */
  features: {
    search: true, // 全站搜索（Pagefind）
    paletteSwitcher: true, // 右上角配色切换
    readingProgress: true, // 文章页右侧可拖动进度
    toc: true, // 文章目录
    postMeta: true, // 字数 / 阅读时长 / git 修改时间
    relatedPosts: true, // 文章底部相关推荐
    heatmap: true, // Dailies 页热力图
    guestbook: true, // 留言页（需要 web3formsKey）
    nowCard: true, // 首页 Now 卡片（需要 src/content/now/now.md）
  },

  /** 默认配色：'blue' 靛蓝×赭石 | 'classic' 纸黄×红笔 | 'green' 墨绿×橙 | 'mono' 炭黑×紫红 */
  defaultPalette: 'blue' as PaletteId,

  home: {
    /** 'arm' 手绘机械臂（逆运动学跟随鼠标）| 'doodle' 一根涂鸦线条 */
    hero: 'arm' as 'arm' | 'doodle',
    /** 标题上方的便利贴文字，留空不显示 */
    badge: '🎉 欢迎光临～',
    /** 机械臂在无鼠标时是否自己活动 */
    armIdle: true,
  },

  academic: {
    /** Academic 页顶部的研究方向卡片，空数组则不显示 */
    topics: [
      { emoji: '🔬', title: '方向一', desc: '一句话说明这个方向在做什么。' },
      { emoji: '🧭', title: '方向二', desc: '一句话说明这个方向在做什么。' },
      { emoji: '🧩', title: '方向三', desc: '一句话说明这个方向在做什么。' },
    ],
  },



  guestbook: {
    /**
     * Web3Forms access key（设计上就是公开的）。到 https://web3forms.com 用邮箱免费领取。
     * 留空时留言页显示"尚未配置"。
     */
    web3formsKey: '',
  },
};

/* ------------------------------------------------------------------
   下面是由配置派生的常量，组件里直接引用，一般不用改
   ------------------------------------------------------------------ */

export const SITE = config.site;

export type SectionMeta = { key: SectionKey; label: string; subtitle: string; href: string; emoji: string; desc: string };

const ALL_SECTIONS = (Object.keys(config.sections) as SectionKey[]).map<SectionMeta & { enabled: boolean }>((key) => ({
  key,
  href: `/${key}/`,
  ...config.sections[key],
}));

/** 已启用的板块，按配置顺序 */
export const SECTIONS: Record<SectionKey, SectionMeta> = Object.fromEntries(
  ALL_SECTIONS.map(({ enabled: _e, ...s }) => [s.key, s]),
) as Record<SectionKey, SectionMeta>;

export const ENABLED_SECTIONS: SectionMeta[] = ALL_SECTIONS.filter((s) => s.enabled).map(({ enabled: _e, ...s }) => s);

export const isEnabled = (key: string): key is SectionKey =>
  Object.hasOwn(config.sections, key) && config.sections[key as SectionKey].enabled;

export const NAV = [
  { label: 'Home', href: '/' },
  ...ENABLED_SECTIONS.map((s) => ({ label: s.label, href: s.href })),
  ...config.navExtra,
];
