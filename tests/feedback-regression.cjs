// Run with: node tests/feedback-regression.cjs. No network or database writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');

function loader(mocks) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.env.DEV', 'false');
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText;
    const localRequire = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (!id.startsWith('.')) return require(id);
      const base = path.resolve(path.dirname(file), id);
      const target = [base, `${base}.ts`, `${base}.tsx`].find((p) => fs.existsSync(p));
      return load(target);
    };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

async function main() {
  let payload;
  let rows = [];
  const query = {
    select() { return this; }, order() { return this; },
    then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
  };
  const load = loader({
    '../lib/supabase': { getSupabase: () => ({
      rpc: async (name, value) => { assert.equal(name, 'submit_feedback'); payload = value; return { error: null }; },
      from: () => query,
    }) },
    './storage.service': { removeVoiceNote: async () => {} },
    './AudioPlayer': { AudioPlayer: () => React.createElement('audio') },
    '../../lib/env-detect': { detectInAppBrowser: () => null, hasRecordingSupport: () => true },
  });
  const { QUESTIONS, PICKER_QUESTION_COUNT } = load('src/lib/constants.ts');
  const service = load('src/services/feedback.service.ts');
  assert.equal(QUESTIONS.length, 9);
  assert.equal(PICKER_QUESTION_COUNT, 8);
  assert.equal(QUESTIONS[8].gu, 'Sfumatoની કામગીરીમાં એવી કઈ 5 બાબતો છે જે તમને પસંદ નથી?');
  const answers = QUESTIONS.map((q) => ({ question_no: q.no, ...(q.picker ? { choice: 'excellent' } : { message: 'Unique Q9 comment' }) }));
  await service.submitFeedback({ client_name: 'Client', companyName: 'Company', client_token: 'token', project: 'Project', consent: true, answers });
  assert.deepEqual(Object.keys(payload).sort(), ['p_answers', 'p_client_name', 'p_client_token', 'p_company_name', 'p_consent', 'p_project']);
  assert.equal(payload.p_answers.length, QUESTIONS.length);
  assert.equal(Object.hasOwn(payload.p_answers.at(-1), 'choice'), false);
  assert.equal(Object.hasOwn(payload.p_answers.at(-1), 'audio_path'), false);
  const item = service.parseFeedback({ id: 'test', created_at: '2026-10-29T00:00:00Z', feedback_answers: answers });
  rows = [item];
  assert.equal((await service.listFeedback({ search: 'Unique Q9', limit: 20, offset: 0 })).total, 1);
  assert.equal((await service.listFeedback({ needsWork: true, limit: 20, offset: 0 })).total, 0);
  const stats = await service.getFeedbackStats();
  assert.equal(stats.totalAnswers, PICKER_QUESTION_COUNT);
  assert.equal(stats.excellentPercentage, 100);
  const { FeedbackTable } = load('src/components/admin/FeedbackTable.tsx');
  const { FeedbackCard } = load('src/components/admin/FeedbackCard.tsx');
  const { FeedbackDrawer } = load('src/components/admin/FeedbackDrawer.tsx');
  const { QuestionCard } = load('src/components/form/QuestionCard.tsx');
  const q9Html = renderToStaticMarkup(React.createElement(QuestionCard, {
    questionNo: QUESTIONS.at(-1).no, questionEn: QUESTIONS.at(-1).en, questionGu: QUESTIONS.at(-1).gu,
    picker: false, message: '', voice: null, recorder: { state: 'idle' },
    answerError: 'Please type or record your answer',
  }));
  assert.ok(!q9Html.includes('role="radiogroup"'));
  assert.ok(q9Html.includes('min-height:120px'));
  assert.ok(q9Html.includes('max-height:200px'));
  assert.ok(q9Html.includes('Please type or record your answer'));
  const props = { onSelect() {}, onStatusChange() {}, onSortChange() {}, sort: 'created_at', dir: 'desc' };
  for (const component of [React.createElement(FeedbackTable, { ...props, items: [item] }), React.createElement(FeedbackCard, { ...props, item, onClick() {} })]) {
    const html = renderToStaticMarkup(component);
    assert.equal((html.match(/title="Q\d+: Excellent"/g) || []).length, PICKER_QUESTION_COUNT);
    assert.ok(html.includes('8/8'));
    assert.ok(html.includes('Q9: Unique Q9 comment'));
  }
  for (const row of [item, service.parseFeedback({ feedback_answers: [{ question_no: 99, choice: null }] }), service.parseFeedback({ satisfaction: 'excellent' })]) {
    assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(FeedbackDrawer, { item: row, onClose() {}, onStatusChange() {}, onDelete() {} })));
  }
  const drawerHtml = renderToStaticMarkup(React.createElement(FeedbackDrawer, { item, onClose() {}, onStatusChange() {}, onDelete() {} }));
  assert.equal((drawerHtml.match(/bg-success\/15/g) || []).length, PICKER_QUESTION_COUNT);
  assert.ok(drawerHtml.includes('Unique Q9 comment'));

  // Exercise the real form submit handler with controlled hooks and mocked upload/RPC boundaries.
  let states = [], cursor = 0, calls = [], uploads = 0, scrolled, failUpload = false;
  const hookReact = { ...React, useEffect() {}, useCallback: (fn) => fn, useState(initial) {
    const i = cursor++;
    if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
    return [states[i], (value) => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
  } };
  const formLoad = loader({
    react: hookReact,
    '../lib/supabase': { getSupabase() { throw Error('Unexpected network access'); } },
    '../../services/feedback.service': { submitFeedback: async (input) => { calls.push(input); await service.submitFeedback(input); } },
    '../../services/storage.service': { uploadVoiceNote: async () => { uploads++; if (failUpload) throw Error('Upload failed'); return { path: 'uploaded.webm', mime: 'audio/webm' }; } },
    '../../lib/env-detect': { detectInAppBrowser: () => null, extensionForMime: () => 'webm' },
    '../../hooks/useVoiceRecorder': { useVoiceRecorder: () => ({}) },
    sonner: { toast: { error() {} } },
  });
  const { FeedbackForm } = formLoad('src/components/form/FeedbackForm.tsx');
  function render() { cursor = 0; return FeedbackForm({}); }
  function nodes(element) {
    if (!element || typeof element !== 'object') return [];
    if (Array.isArray(element)) return element.flatMap(nodes);
    return [element, ...nodes(element.props?.children)];
  }
  global.document = { getElementById: (id) => ({ scrollIntoView() { scrolled = id; } }) };
  const voice = { blob: new Blob(['audio']), mime: 'audio/webm', durationSec: 0, url: 'blob:test' };
  states = []; calls = []; failUpload = true;
  let tree = nodes(render());
  tree.find((n) => n.props?.id === 'field-clientName').props.onChange({ target: { value: 'Client' } });
  tree.find((n) => n.props?.id === 'field-companyName').props.onChange({ target: { value: 'Company' } });
  tree.filter((n) => n.props?.questionNo && n.props.picker).forEach((n) => n.props.onChoiceChange('excellent'));
  tree.find((n) => n.props?.questionNo === 9).props.onVoiceChange(voice);
  await nodes(render()).find((n) => n.props?.onSubmit).props.onSubmit({ preventDefault() {} });
  assert.equal(calls.length, 0, 'Failed uploads must block the RPC');
  assert.ok(nodes(render()).find((n) => n.props?.questionNo === 9).props.uploadError);
  failUpload = false;
  for (const [text, recording, valid] of [['   ', null, false], ['', { ...voice, blob: new Blob([]) }, false], ['Typed', null, true], ['', voice, true], ['Both', voice, true]]) {
    states = []; calls = []; uploads = 0; scrolled = undefined;
    let tree = nodes(render());
    tree.find((n) => n.props?.id === 'field-clientName').props.onChange({ target: { value: 'Client' } });
    tree.find((n) => n.props?.id === 'field-companyName').props.onChange({ target: { value: 'Company' } });
    const cards = tree.filter((n) => n.props?.questionNo);
    assert.equal(cards.length, QUESTIONS.length);
    cards.filter((n) => n.props.picker).forEach((n) => n.props.onChoiceChange('excellent'));
    const q9 = cards.at(-1);
    assert.equal(q9.props.picker, false);
    q9.props.onMessageChange(text);
    q9.props.onVoiceChange(recording);
    tree = nodes(render());
    await tree.find((n) => n.props?.onSubmit).props.onSubmit({ preventDefault() {} });
    assert.equal(calls.length, valid ? 1 : 0);
    if (!valid) {
      assert.equal(scrolled, 'field-q9-answer');
      assert.equal(nodes(render()).find((n) => n.props?.questionNo === 9).props.answerError, 'Please type or record your answer');
    } else {
      assert.equal(Object.hasOwn(payload.p_answers.at(-1), 'choice'), false);
      assert.equal(uploads, recording ? 1 : 0);
      assert.equal(Boolean(payload.p_answers.at(-1).audio_path), Boolean(recording));
    }
  }
  delete global.document;
  console.log('PASS: form validation, voice-only upload, RPC payload, search, stats, desktop/mobile summaries, new and legacy drawers.');
}
module.exports = { loader };
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
