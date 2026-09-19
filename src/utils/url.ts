import { prefixBase } from './base-path.mjs';

export const withBase = (path: string): string => prefixBase(path, import.meta.env.BASE_URL);
