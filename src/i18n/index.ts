import { config } from '../config';
import { zh } from './zh';
import { en } from './en';

const dicts = { zh, en };

/** 当前语言的界面文字 / UI strings for the configured language */
export const t = dicts[config.lang] ?? zh;
export type { UI } from './zh';
