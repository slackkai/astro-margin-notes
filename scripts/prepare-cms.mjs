import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { makeCmsConfig } from '../cms.config.mjs';

let repo = process.env.GITHUB_REPOSITORY;
if (!repo) {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    repo = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1];
  } catch { /* An unconnected template can still be edited locally. */ }
}
repo ||= 'slackkai/astro-margin-notes';
const site = JSON.parse(await readFile(new URL('../src/data/site.json', import.meta.url), 'utf8'));
const config = makeCmsConfig({ repo, siteUrl: process.env.SITE_URL || site.url, base: process.env.BASE_PATH || '/' });
await mkdir('public/admin/vendor', { recursive: true });
await cp('node_modules/@sveltia/cms/dist', 'public/admin/vendor', {
  recursive: true, filter: source => !source.endsWith('.map'),
});
await cp('node_modules/@sveltia/cms/LICENSE.txt', 'public/admin/vendor/LICENSE.txt');
// JSON is also valid YAML; no template interpolation of user-controlled values.
await writeFile('public/admin/config.yml', JSON.stringify(config, null, 2) + '\n');
console.log(`CMS configured for ${repo} (${config.site_url})`);
