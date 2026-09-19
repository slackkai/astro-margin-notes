import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const [section, slug, ...titleParts] = process.argv.slice(2);
if (!['academic', 'insight', 'dailies', 'library', 'projects'].includes(section) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) {
  console.error('用法：npm run new -- insight my-first-post "文章标题"\n板块：academic / insight / dailies / library / projects；slug 使用小写英文、数字、连字符。');
  process.exitCode = 1;
} else {
  const file = resolve('src/content', section, `${slug}.md`);
  const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const body = `---\ntitle: ${JSON.stringify(titleParts.join(' ') || slug)}\ndate: ${today}\ndescription: ''\ntags: []\ndraft: true\n---\n\n在这里开始写作。\n`;
  await mkdir(dirname(file), { recursive: true });
  try {
    await writeFile(file, body, { flag: 'wx' });
    console.log(`已创建草稿：${file}\n本地预览：npm run dev；发布前将 draft 改为 false。`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.error(`文件已存在，没有覆盖：${file}`);
    process.exitCode = 1;
  }
}
