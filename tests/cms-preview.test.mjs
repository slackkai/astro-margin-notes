import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const templates = new Map();
vm.runInNewContext(readFileSync(new URL('../public/admin/previews.js', import.meta.url), 'utf8'), {
  CMS: { registerPreviewTemplate: (name, template) => templates.set(name, template) },
  createClass: value => value,
  h: (tag, props, ...children) => ({ tag, props, children: children.flat().filter(value => value !== false && value != null && value !== '') }),
});
const nodes = node => typeof node === 'object' ? [node, ...node.children.flatMap(nodes)] : [];
const strings = node => typeof node === 'object' ? node.children.flatMap(strings) : [String(node)];
const render = (collection, data, getAsset = () => undefined) => templates.get(collection).render.call({ props: {
  entry: { get: () => ({ toJS: () => data }) }, getAsset,
  widgetFor: name => ({tag:'cms-widget',props:{name},children:[]}),
} });

test('all article collections render compact metadata and fall back if the renderer is unavailable', () => {
  for (const name of ['academic','insight','dailies','library','projects']) {
    const output = render(name, {title:'试验文章',date:'2026-09-25',body:'## 正文',tags:['robotics'],draft:false,comments:false});
    const text = strings(output).join(' ');
    assert.ok(text.includes('试验文章') && text.includes('#robotics'));
    assert.ok(text.includes('评论关闭'));
    assert.ok(!text.includes('草稿') && !text.includes('undefined'));
    assert.equal(nodes(output).filter(n=>n.tag==='cms-widget' && n.props.name==='body').length,1);
  }
});

test('custom body renderer updates only for text changes and resolves delayed CMS assets', () => {
  const registered = new Map();
  const calls = [];
  let scheduled;
  let assetUrl;
  const context = {
    CMS: { registerPreviewTemplate: (name, template) => registered.set(name, template) },
    createClass: value => value,
    h: (tag, props, ...children) => ({ tag, props, children: children.flat().filter(Boolean) }),
    NotebookMarkdown: { render: body => { calls.push(body); return `<p>${body}</p>`; } },
    setTimeout: callback => { scheduled = callback; return 1; },
    clearTimeout: () => { scheduled = undefined; },
  };
  vm.runInNewContext(readFileSync(new URL('../public/admin/previews.js', import.meta.url), 'utf8'), context);
  const output = registered.get('academic').render.call({ props: {
    entry: { get: () => ({ toJS: () => ({ title: 'Test', body: 'First' }) }) },
    getAsset: () => ({ url: assetUrl }), widgetFor: () => { throw Error('Unexpected fallback'); },
  } });
  const component = nodes(output).find(node => typeof node.tag === 'object');
  const instance = { ...component.tag, props: component.props };
  assert.equal(instance.render().props.dangerouslySetInnerHTML.__html, '<p>First</p>');
  instance.render();
  assert.equal(calls.length, 1);
  instance.props = { ...instance.props, body: 'Second' };
  assert.equal(instance.render().props.dangerouslySetInnerHTML.__html, '<p>Second</p>');
  assert.equal(calls.length, 2);
  for (const path of ['./attachments/photo.webp', '/uploads/photo.webp']) {
    let src = path;
    const img = { dataset: {}, getAttribute: () => src, setAttribute: (_, value) => { src = value; } };
    instance.root = { querySelectorAll: selector => selector === 'img[src]' ? [img] : [] };
    assetUrl = undefined;
    instance.componentDidMount();
    assert.equal(src, path);
    assert.equal(typeof scheduled, 'function');
    assetUrl = 'blob:resolved-photo';
    scheduled();
    assert.equal(src, assetUrl);
    assert.equal(scheduled, undefined);
  }
  instance.componentWillUnmount();
});
test('empty optional fields disappear, status labels are readable, unsafe links are not rendered', () => {
  const output = render('library', {title:'书',body:'文字',status:'done',rating:5,url:'javascript:alert(1)',author:null,cover:'',links:{docs:'https://example.com',code:'data:text/html,x'}});
  assert.ok(strings(output).includes('已读'));
  assert.ok(strings(output).includes('★★★★★'));
  assert.deepEqual(nodes(output).filter(n=>n.tag==='a').map(n=>n.props.href), ['https://example.com']);
  assert.equal(nodes(output).filter(n=>n.tag==='img').length,0);
  assert.ok(strings(render('dailies',{date:'2026-09-25',draft:true})).includes('2026-09-25'));
});
test('relative cover and gallery paths use native reactive image previews even before assets resolve', () => {
  const output = render('projects',{title:'项目',cover:'./attachments/cover.webp',body:'正文'}, () => undefined);
  assert.equal(nodes(output).filter(n=>n.tag==='cms-widget' && n.props.name==='cover').length,1);
  const daily = render('dailies',{images:['./attachments/photo.webp'],body:'正文'}, () => undefined);
  assert.equal(nodes(daily).filter(n=>n.tag==='cms-widget' && n.props.name==='images').length,1);
});
