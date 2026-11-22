// Meatball Director (미트볼 지시창) — instructions as typed pieces, not one guessed block.
//   지시 (order):     the next reply only (reused for a swipe/regenerate of that reply); 📌 pins it for this scene or always
//                     (always = Meatball's director's note when Meatball is here).
//   비밀 (secret):    kept in Meatball, never sent; guarded like a lore vault line. Release/lock here.
//   방향 (direction): where the story should end up; never sent; the guard watches for rushing ahead.
//   이름 (names):     swap the rendered {{char}}/{{user}} names in the outgoing prompt only (in memory, never saved);
//                     /mbname char=… user=… for quick replies (next generation only).
// With Meatball (window.MeatballAPI v1) the pieces go through Meatball: it places them last in its note, records the
// beat as the reply's instruction (no guessing), and checks it for pressing. Without Meatball, this extension injects
// the pieces itself (beat at depth 0, keep at depth 1).
const KEY = 'meatball_director', API_V = 1;
const ctx = () => SillyTavern.getContext();
const api = () => (window.MeatballAPI?.v === API_V ? window.MeatballAPI : null);
const h = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ko = (navigator.language || '').startsWith('ko');
const T = ko ? {
  title: '미트볼 지시창', alone: '미트볼 상태창이 꺼져 있어요: 「지시」만 쓸 수 있어요', needMb: '미트볼 상태창이 켜져 있어야 쓸 수 있어요.',
  tabs: ['지시', '비밀', '방향', '이름', '규칙'],
  helpName: '<b>AI에게 보내는 글에서만 이름을 잠깐 바꿔요.</b> 캐릭터 · 페르소나 · 채팅 · 퀵리플은 하나도 안 바뀌어요.<br>· 지금 {{char}}는 <b>{C}</b>, {{user}}는 <b>{U}</b>로 들어가고 있어요. 이 낱말이 나온 자리를 아래 이름으로 바꿔서 보내요.<br>· 「다음 생성 한 번」은 한 번 쓰고 저절로 꺼져요. 「끌 때까지」는 새로고침하면 꺼져요.<br>· 퀵리플에서는 <code>/mbname char=이름 user=이름</code> 다음에 <code>/gen …</code>. 다음 생성 한 번만 바뀌어요. 본문에 다른 이름으로 적혀 있으면 <code>also=Kkangtong,깡통 사장</code>도. 적용되면 「이름 바꿈 적용 (n곳)」 알림이 떠요.',
  helpRules: '<b>지침 · 말버릇.</b> 지킬 것을 한 줄로 적기만 하면 돼요. 미트볼이 답을 정리할 때 같이 훑어보고, 어긴 게 보이면 <b>다음 답 하나에만</b> "이전 답에 이게 나왔으니 이번엔 주의"를 붙여요. 그다음엔 꺼져요. 「항상」이면 늘 붙여요.',
  rMode: { auto: '보이면 주의', always: '항상', off: '끔' }, rHit: '이전 답에서 보임 → 다음 답에 주의 붙음', rCycle: '눌러서 바꾸기: 보이면 주의 → 항상 → 끔', rEdit: '눌러서 고치기', rMine: '내 지침', rNone: '아직 없어요. 위에 한 줄 적고 Enter', rPresets: '기본 지침 {n}개', dLeft: '채팅 왼쪽에 붙이기 (PC)', dRight: '채팅 오른쪽에 붙이기 (PC)', dBottom: '🎬 위에 띄우기', close: '닫기', rNew: '새 지침', rText: '예: 깡캐를 바보처럼 그리지 않는다', rAdd: '추가', rDel: '지우기', rPreset: '기본',
  nWill: '이렇게 바뀌어요', nInCard: '카드에 {n}곳', nCard: '카드에 자주 나오는 이름 (누르면 같이 바꾸기에 추가)', nChar: '{{char}} 자리에 넣을 이름', nFrom: '캐릭터의 다른 이름도 같이 바꾸기 (선택, 쉼표로)', nFromPh: '예: Kkangtong, 깡통 사장 — 본문에 이렇게 적혀 있으면', nUser: '{{user}} 자리에 넣을 이름', nBlank: '비우면 그대로', nOnce: '다음 생성 한 번', nOn: '끌 때까지', nOff: '끄기', nNow: '켜져 있음', nOnceNow: '다음 생성 한 번만', nOffNow: '꺼져 있음', nShort: '한 글자 이름은 안 바꿔요(엉뚱한 데까지 바뀌어서)',
  helpOrder: '<b>AI에게 시킬 것.</b> 채팅에는 안 남고 본편 AI만 봐요.<br>· 그냥 적어 두면 <b>다음 답 한 번</b>에만 들어가요.<br>· 오래 지켜야 하면 📌 버튼으로 고정하세요. 「이 장면 동안」은 장면이 바뀌면 계속할지 물어봐요.<br>· 시간을 넘기고 싶으면 그냥 「사흘 뒤」처럼 적으면 돼요.',
  orderPh: '예: 깡캐가 먼저 말을 건다', fresh: '다음 답에 들어가요', used: '이미 들어갔어요. 그 답을 다시 뽑을 때만 또 들어가요', empty: '',
  pinScene: '📌 이 장면 동안', pinAlways: '📌 계속', clear: '지우기', pinned: '고정된 지시', pinnedScene: '이 장면 동안', pinnedAlways: '계속',
  sceneCut: '장면이 바뀌었어요. 이 지시를 계속할까요?', keepIt: '계속', en: 'AI에게 가는 말', sign: '비밀 낱말이 들어 있어요', signWhy: 'AI 눈앞에 비밀을 적는 셈이에요', thread: '캐릭터가 이미 거절한 일이에요',
  helpSecret: '<b>AI가 먼저 말해 버리면 안 되는 것.</b> 비밀 내용은 본편 AI에 <b>아예 안 가요</b>. 미트볼만 알고 지켜요.<br>· 답에 비밀이 새면 상태창에 ⚠가 떠요. 눌러서 다시 쓰기를 고를 수 있어요.<br>· 「겉으로 보여도 되는 모습」만 AI에게 가요. 비워도 돼요.<br>· 이제 밝혀져도 되면 「풀기」를 누르세요.',
  sWho: '누구의 비밀', sWhoPh: '이름', sV: '비밀 내용', sVPh: '예: 깡통은 아직 깡캐를 좋아한다', sSigns: '나오면 들킨 걸로 볼 낱말 (선택, 쉼표로)', sSignsPh: '예: 좋아해, 못 잊었',
  sShows: '겉으로 보여도 되는 모습 (선택, 이것만 AI에게 가요)', sShowsPh: '예: 반지만 보면 눈을 피한다', add: '추가', del: '지우기', open: '풀기', close: '다시 잠그기', isOpen: '풀림', isClosed: '잠김', fromLore: '설정집에서',
  helpGoal: '<b>이야기가 결국 갔으면 하는 곳.</b> 본편 AI에는 안 가요. 알려 주면 AI가 서둘러 가 버리거든요.<br>· 너무 빨리 가면 상태창에 ⚠가 떠요.<br>· 「살짝 알리기」를 켜면 AI에게 「아직 정해진 건 없고 천천히 가는 중」이라고만 가요.<br>· 거기까지 가면 「도착」을 누르세요.',
  gV: '원하는 방향', gVPh: '예: 결국 둘은 서로를 고른다', gSigns: '나오면 너무 빨리 간 걸로 볼 낱말 (선택, 쉼표로)', gSignsPh: '예: 고백, 입맞춤', gHint: '살짝 알리기', arrived: '도착',
} : {
  title: 'Meatball Director', alone: 'Meatball is off: only "Order" works', needMb: 'Needs Meatball status window.',
  tabs: ['Order', 'Secret', 'Direction', 'Names', 'Rules'],
  helpName: '<b>Swaps names only in the text sent to the AI.</b> Character, persona, chat and quick replies stay as they are.<br>· {{char}} is now <b>{C}</b> and {{user}} is <b>{U}</b>. Where those words appear, the names below go out instead.<br>· "Next generation" switches itself off after one use. "Until off" ends on reload.<br>· In a quick reply: <code>/mbname char=Name user=Name</code> then <code>/gen …</code> (next generation only). <code>/mbname</code> alone switches it off.',
  helpRules: '<b>Guidelines · habits.</b> Just write the rule in one line. Meatball checks the reply while sorting it; if the rule was broken, the next reply only gets "the last reply did this, watch it". "Always" sends it every time.',
  rMode: { auto: 'warn when seen', always: 'always', off: 'off' }, rHit: 'seen in the last reply → warned in the next', rCycle: 'click: warn when seen → always → off', rEdit: 'click to edit', rMine: 'My rules', rNone: 'None yet. Type one above and press Enter', rPresets: '{n} preset rules', dLeft: 'dock left of the chat (PC)', dRight: 'dock right of the chat (PC)', dBottom: 'pop up above 🎬', close: 'Close', rNew: 'New rule', rText: 'e.g. never treat B like a child', rAdd: 'Add', rDel: 'Delete', rPreset: 'preset',
  nWill: 'Will be swapped', nInCard: '{n} in the card', nCard: 'Names the card uses often (tap to add)', nChar: 'name in place of {{char}}', nFrom: 'other names of the character to swap too (optional, comma)', nFromPh: 'e.g. how the story spells the name', nUser: 'name in place of {{user}}', nBlank: 'empty = unchanged', nOnce: 'Next generation', nOn: 'Until off', nOff: 'Off', nNow: 'on', nOnceNow: 'next generation only', nOffNow: 'off', nShort: 'one-letter names are not swapped',
  helpOrder: '<b>What the AI should do.</b> Not kept in the chat; only the story AI sees it.<br>· Typed here, it goes into <b>the next reply only</b>.<br>· Pin it with 📌 to keep it. "This scene" asks again when the scene changes.<br>· To skip time, just write "three days later".',
  orderPh: 'e.g. B speaks first', fresh: 'Goes into the next reply', used: 'Already used; goes in again only when that reply is redone', empty: '',
  pinScene: '📌 This scene', pinAlways: '📌 Always', clear: 'Clear', pinned: 'Pinned', pinnedScene: 'this scene', pinnedAlways: 'always',
  sceneCut: 'The scene changed. Keep this order?', keepIt: 'Keep', en: 'Sent to the AI', sign: 'Holds a secret word', signWhy: 'that writes the secret right in front of the AI', thread: 'The character already turned this down',
  helpSecret: '<b>What the AI must not blurt out.</b> The secret itself <b>never reaches</b> the story AI. Only Meatball knows it.<br>· If a reply leaks it, ⚠ shows in the bar.<br>· Only "what may show" goes to the AI. May be empty.<br>· When it may come out, press "Release".',
  sWho: 'Whose secret', sWhoPh: 'name', sV: 'The secret', sVPh: 'e.g. A still loves B', sSigns: 'Words that give it away (optional, comma)', sSignsPh: 'e.g. still love, never forgot',
  sShows: 'What may show (optional, only this goes to the AI)', sShowsPh: 'e.g. looks away from the ring', add: 'Add', del: 'Delete', open: 'Release', close: 'Lock again', isOpen: 'released', isClosed: 'locked', fromLore: 'from lore',
  helpGoal: '<b>Where the story should end up.</b> Never sent: told, the AI rushes there.<br>· Rushing ahead shows ⚠.<br>· "Hint" sends only "nothing is settled yet, it moves slowly".<br>· Press "Arrived" when it gets there.',
  gV: 'Direction', gVPh: 'e.g. in the end they choose each other', gSigns: 'Words that mean it rushed (optional, comma)', gSignsPh: 'e.g. confession, kiss', gHint: 'Hint', arrived: 'Arrived',
};
const TIP = ko ? {"pinScene": "적은 지시를 이 장면이 끝날 때까지 매 답에 넣어요. 미트볼이 장면이 바뀐 걸 알아채면 계속할지 물어요.", "pinAlways": "적은 지시를 이 채팅 내내 매 답에 넣어요.", "clear": "적은 지시를 지워요.", "sWho": "비밀을 가진 사람 이름.", "sV": "AI가 먼저 말하면 안 되는 내용. AI에게는 절대 안 가고 미트볼만 알아요.", "sShows": "겉으로 티 나도 되는 모습. 이것만 AI에게 가요. 예: 반지만 보면 눈을 피한다.", "sSigns": "답에 이 낱말이 나오면 비밀이 샌 걸로 보고 상태줄에 ⚠를 띄워요.", "open": "풀기: 이제 비밀이 아니게 돼요(AI도 알게 됨). 다시 잠글 수도 있어요.", "gV": "이야기가 결국 갔으면 하는 곳. AI는 몰라요. 미트볼은 너무 빨리 가는지만 지켜봐요.", "gSigns": "답에 이 낱말이 나오면 너무 빨리 간 걸로 보고 ⚠.", "gHint": "켜면 AI에게 「아직 정해진 건 없고 천천히 흘러간다」 한 줄만 알려요. 목표 자체는 안 알려요.", "arrived": "그 방향에 도착했으면 눌러서 목록에서 빼요.", "nChar": "{{char}} 자리에 잠깐 들어갈 이름. 보내는 글에서만 바뀌고 캐릭터 카드는 그대로예요.", "nUser": "{{user}} 자리에 잠깐 들어갈 이름.", "nFrom": "본문에 캐릭터 이름이 다른 철자로 적혀 있으면 여기 적어서 같이 바꿔요. 쉼표로 여러 개.", "nCard":"카드 본문에 3번 넘게 나오는 영어 이름 후보예요. 카드가 {{char}} 대신 이름을 직접 적어 두었으면, 그 이름도 같이 바꿔야 AI가 새 이름으로 봐요.","nOnce": "다음 답 한 번만 바꿔요.", "nOn": "끌 때까지 계속 바꿔요.", "nOff": "이름 바꾸기를 꺼요.", "rText": "지킬 것을 한 줄로 적고 Enter. 미트볼이 답을 정리할 때 어겼는지 같이 보고, 어겼으면 다음 답에만 주의를 붙여요.", "rPresets": "자주 쓰는 지침 8개. 켜고 끄고, 제목을 눌러 내용도 고칠 수 있어요."} : {"pinScene": "Keeps the order in every reply until the scene ends.", "pinAlways": "Keeps the order in every reply of this chat.", "clear": "Clears the order.", "sWho": "Who holds the secret.", "sV": "What the AI must not blurt out. Never sent; only Meatball knows.", "sShows": "What may show on the outside. Only this goes to the AI.", "sSigns": "If a reply uses these words, ⚠ shows.", "open": "Release: no longer a secret. You can lock it again.", "gV": "Where the story should end up. The AI is not told.", "gSigns": "If a reply uses these words, it rushed: ⚠.", "gHint": "Tells the AI only \"nothing is settled yet, it moves slowly\".", "arrived": "Remove it once the story got there.", "nChar": "Name for {{char}} in the text sent to the AI only.", "nUser": "Name for {{user}} in the text sent to the AI only.", "nFrom": "Other spellings of the character name in the story (comma).", "nCard":"Capitalized names the card text uses 3+ times. If the card writes the name instead of {{char}}, add it here too.","nOnce": "Next reply only.", "nOn": "Until switched off.", "nOff": "Stop swapping.", "rText": "Write a rule and press Enter. Meatball checks the reply while sorting it.", "rPresets": "Eight common rules. Toggle them or click a title to edit."};
// a small ? with a tip (mouse-over, or tap on phones); one bubble for the whole panel
const q = (k) => (TIP[k] ? ` <span class="mbd-qi" tabindex="0" data-mbdtip="${h(TIP[k])}">?</span>` : '');
const tipAt = (k) => (TIP[k] ? ` data-mbdtip="${h(TIP[k])}"` : '');
let bub = null;
function tipShow(el) {
  if (!bub) { bub = document.createElement('div'); bub.className = 'mbd-bubble'; document.body.appendChild(bub); }
  bub.textContent = el.getAttribute('data-mbdtip') || ''; bub.style.display = 'block';
  const r = el.getBoundingClientRect(), w = Math.min(280, window.innerWidth - 16);
  bub.style.width = `${w}px`; bub.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8))}px`; bub.style.top = `${r.bottom + 6}px`;
  const b = bub.getBoundingClientRect(); if (b.bottom > window.innerHeight - 8) bub.style.top = `${Math.max(8, r.top - b.height - 6)}px`;
}
const tipHide = () => { if (bub) bub.style.display = 'none'; };
function tipsOn(p) {
  p.addEventListener('mouseover', (e) => { const el = e.target.closest('[data-mbdtip]'); if (el) tipShow(el); else tipHide(); });
  p.addEventListener('mouseleave', tipHide);
  p.addEventListener('click', (e) => { const el = e.target.closest('.mbd-qi'); if (el) { e.stopPropagation(); bub?.style.display === 'block' && bub.textContent === el.dataset.mbdtip ? tipHide() : tipShow(el); } else tipHide(); });
}
const G = { apply: false, type: '', tab: 0 };
// name swap: in memory only, never saved. mode '' off · 'once' next generation · 'on' until switched off
const N = { char: '', user: '', charFrom: '', userFrom: '', mode: '', at: 0 };

function st() {
  const md = ctx().chatMetadata; if (!md) return { beat: '', used: false, usedIdx: -1, keep: '', scene: '', sceneGn: 0 };
  const x = (md[KEY] ||= { beat: '', used: false, usedIdx: -1, keep: '' });
  x.scene ??= ''; x.sceneGn ??= 0; delete x.time; delete x.press;
  return x;
}
const save = () => ctx().saveMetadataDebounced?.();
const lastAiIdx = () => { const c = ctx().chat || []; for (let i = c.length - 1; i >= 0; i--) if (!c[i].is_user && !c[i].is_system) return i; return -1; };
const words = (t) => String(t || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 2);
const hasWord = (text, w) => { const t = String(text || '').toLowerCase(), s = String(w || '').toLowerCase(); if (s.length < 2) return false; return /^[a-z0-9 '\-]+$/.test(s) ? new RegExp(`(^|[^a-z0-9])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t) : t.includes(s); };
const commas = (t) => String(t || '').split(/[,，、]/).map((x) => x.trim()).filter((x) => x.length >= 2);
// 😼 the Meatball cat: asleep without Meatball, idle with it; poke for a reaction (no sound, nothing saved)
const catUrl = (f) => new URL(`./img/mascot_${f}.webp`, import.meta.url).href;
let annoy = 0, annoyT = 0;
function poke(img) {
  const now = Date.now(); annoy = Math.max(0, annoy - Math.floor((now - annoyT) / 600)) + 1; annoyT = now;
  const sad = annoy >= 10; if (sad) annoy = 0;
  img.src = catUrl(sad ? 'sad' : ['happy', 'surprise', 'party'][Math.floor(Math.random() * 3)]);
  img.classList.remove('poke'); void img.offsetWidth; img.classList.add('poke');
  clearTimeout(img._back); img._back = setTimeout(() => { img.src = catUrl(img.dataset.face || 'idle'); }, sad ? 2500 : 900);
}
function safeState(A) { try { return A.state() || {}; } catch (e) { return {}; } }

// ---- UI -------------------------------------------------------------------------------------------------------
function mount() {
  if (document.getElementById('mbd_panel')) return;
  const form = document.getElementById('send_form');
  if (!form) return;
  form.insertAdjacentHTML('beforebegin', `<div id="mbd_wrap"><div id="mbd_panel"></div></div>`);
  tipsOn(document.getElementById('mbd_panel'));
  const left = document.getElementById('leftSendForm') || form;
  left.insertAdjacentHTML('beforeend', `<div id="mbd_btn" title="${h(T.title)}">🎬</div>`);
  document.getElementById('mbd_btn').addEventListener('click', () => { const p = document.getElementById('mbd_panel'); p.classList.toggle('open'); document.getElementById('mbd_btn').classList.toggle('on'); dock(); render(); });
  window.addEventListener('resize', () => dock());
}
// 아래(입력창 위) · 왼쪽 · 오른쪽. Sides only on wide screens (PC / laptop); phones always use the bottom.
// Where the window sits: by default a small pop-up right above the 🎬 button (like the quick-reply search box);
// on wide screens it can also be pinned to the left or right of the chat.
function place() {
  const p = document.getElementById('mbd_panel'), btn = document.getElementById('mbd_btn');
  if (!p || !btn || !p.classList.contains('pop')) return;
  const r = btn.getBoundingClientRect(), w = Math.min(440, window.innerWidth - 16);
  p.style.width = `${w}px`;
  p.style.left = `${Math.max(8, Math.min(r.left - 8, window.innerWidth - w - 8))}px`;
  p.style.bottom = `${Math.max(8, window.innerHeight - r.top + 8)}px`;
  p.style.maxHeight = `${Math.max(220, Math.min(window.innerHeight * 0.6, r.top - 16))}px`;
}
function dock() {
  const p = document.getElementById('mbd_panel'); if (!p) return;
  const R0 = rset(); if (R0.dockV !== 2) { R0.dock = 'bottom'; R0.dockV = 2; saveSet(); }   // 0.8.1: everyone starts with the new pop-up once
  const want = rset().dock || 'bottom', side = want !== 'bottom' && window.innerWidth >= 1000;
  p.classList.toggle('side', side); p.classList.toggle('left', side && want === 'left'); p.classList.toggle('right', side && want === 'right');
  p.classList.toggle('pop', !side);
  if (p.parentElement !== document.body) document.body.appendChild(p);
  if (side) { p.style.left = ''; p.style.bottom = ''; p.style.width = ''; p.style.maxHeight = ''; } else place();
}
window.addEventListener?.('resize', () => { try { place(); } catch (e) { /* */ } });
// a pop-up closes when you click elsewhere (not when pinned to a side)
document.addEventListener?.('mousedown', (e) => {
  const p = document.getElementById('mbd_panel');
  if (!p || !p.classList.contains('open') || !p.classList.contains('pop')) return;
  if (p.contains(e.target) || e.target.closest?.('#mbd_btn, .mbd-bubble, .popup, .swal2-container, #toast-container')) return;
  p.classList.remove('open'); document.getElementById('mbd_btn')?.classList.remove('on');
}, true);
function render() {
  const p = document.getElementById('mbd_panel');
  if (!p || !p.classList?.contains('open')) return;
  const A = api(), S = A ? safeState(A) : null;
  const face = A ? 'idle' : 'sleep', d = rset().dock || 'bottom';
  p.innerHTML = `<div class="mbd-bar"><span class="mbd-dots"><i></i><i></i><i></i></span><img class="mbd-cat" data-face="${face}" src="${catUrl(face)}" alt="" draggable="false"><span class="mbd-title">meatball.exe</span><span class="mbd-q" title="">?</span>
    <span class="mbd-dock">${[['left', '⇤', T.dLeft], ['bottom', '⬓', T.dBottom], ['right', '⇥', T.dRight]].map(([k, ic, t]) => `<b data-dock="${k}" title="${h(t)}" class="${d === k ? 'on' : ''}">${ic}</b>`).join('')}</span><b class="mbd-x" title="${h(T.close)}">✕</b></div>
    <div class="mbd-tabs">${T.tabs.map((t, i) => `<div class="mbd-tab${G.tab === i ? ' on' : ''}" data-tab="${i}">${h(t)}</div>`).join('')}</div>
    <div class="mbd-sheet">${A ? '' : `<div class="mbd-dim">${h(T.alone)}</div>`}<div id="mbd_body"></div></div>`;
  p.querySelector('.mbd-cat')?.addEventListener('click', (e) => poke(e.currentTarget));
  p.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { G.tab = +b.dataset.tab; render(); }));
  p.querySelectorAll('[data-dock]').forEach((b) => b.addEventListener('click', () => { rset().dock = b.dataset.dock; saveSet(); dock(); render(); }));
  p.querySelector('.mbd-x').addEventListener('click', () => { p.classList.remove('open'); document.getElementById('mbd_btn')?.classList.remove('on'); });
  const body = document.getElementById('mbd_body');
  if (G.tab === 0) tabOrder(body, A, S);
  else if (G.tab === 3) tabName(body);
  else if (G.tab === 4) tabRules(body);
  else if (!A) body.innerHTML = `<div class="mbd-help">${G.tab === 1 ? T.helpSecret : T.helpGoal}</div><div class="mbd-warn">${h(T.needMb)}</div>`;
  else if (G.tab === 1) tabSecret(body, A, S);
  else if (G.tab === 2) tabGoal(body, A, S);
  else tabName(body);
  const hp = body.querySelector('.mbd-help'), q = p.querySelector('.mbd-q');
  q.title = hp ? hp.textContent.replace(/\s+/g, ' ').trim() : '';
  // phones have no hover: tapping ? opens the same help inside the panel
  if (G.help && hp) hp.classList.add('open');
  q.onclick = () => { G.help = !G.help; if (hp) hp.classList.toggle('open', G.help); };
}
// 지시: one box for the next reply; 📌 pins it for this scene or for good (the standing one is Meatball's note)
function tabOrder(body, A, S) {
  const s = st(), keep = A ? (S.note || '') : s.keep, cut = A && s.scene.trim() && (S.lastCut || 0) > (s.sceneGn || 0);
  const status = !s.beat.trim() ? '' : s.used ? T.used : T.fresh;
  const pins = [s.scene.trim() ? ['scene', T.pinnedScene, s.scene] : null, keep.trim() ? ['always', T.pinnedAlways, keep] : null].filter(Boolean);
  body.innerHTML = `<div class="mbd-help">${T.helpOrder}</div>
    <textarea id="mbd_beat" class="text_pole" placeholder="${h(T.orderPh)}">${h(s.beat)}</textarea>
    <div class="mbd-dim">${h(status)}</div><div id="mbd_beat_info"></div>
    <div class="mbd-row"><div id="mbd_pin_s" class="menu_button"${tipAt('pinScene')}>${h(T.pinScene)}</div><div id="mbd_pin_a" class="menu_button"${tipAt('pinAlways')}>${h(T.pinAlways)}</div><div id="mbd_clear" class="menu_button"${tipAt('clear')}>${h(T.clear)}</div></div>
    ${cut ? `<div class="mbd-warn">${h(T.sceneCut)} <span id="mbd_scene_keep" class="menu_button">${h(T.keepIt)}</span> <span id="mbd_scene_clear" class="menu_button">${h(T.clear)}</span></div>` : ''}
    ${pins.length ? `<label>${h(T.pinned)}</label>${pins.map(([k, l, v]) => `<div class="mbd-item"><span><b>${h(l)}</b> · ${h(v)}</span><div class="menu_button" data-unpin="${k}">${h(T.clear)}</div></div>`).join('')}` : ''}`;
  const beat = document.getElementById('mbd_beat');
  beat.addEventListener('input', () => { s.beat = beat.value; s.used = false; s.usedIdx = -1; save(); info(); });
  document.getElementById('mbd_clear').addEventListener('click', () => { s.beat = ''; s.used = false; s.usedIdx = -1; save(); render(); });
  const take = () => { const t = s.beat.trim(); s.beat = ''; s.used = false; s.usedIdx = -1; return t; };
  document.getElementById('mbd_pin_s').addEventListener('click', () => { const t = take(); if (!t) return; s.scene = [s.scene.trim(), t].filter(Boolean).join('\n'); s.sceneGn = A ? (S.gn || 0) : 0; save(); render(); });
  document.getElementById('mbd_pin_a').addEventListener('click', () => { const t = take(); if (!t) return; const v = [keep.trim(), t].filter(Boolean).join('\n'); if (A) A.setNote(v); else { s.keep = v; putAlone(); } save(); render(); });
  body.querySelectorAll('[data-unpin]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.unpin === 'scene') s.scene = ''; else if (A) A.setNote(''); else { s.keep = ''; putAlone(); } save(); render(); }));
  document.getElementById('mbd_scene_keep')?.addEventListener('click', () => { s.sceneGn = S.gn || 0; save(); render(); });
  document.getElementById('mbd_scene_clear')?.addEventListener('click', () => { s.scene = ''; save(); render(); });
  info();
}
// 비밀: typed secrets live in Meatball (guarded like a lore vault line); lore vault lines can be released here too
function tabSecret(body, A, S) {
  const list = S.secrets || [], names = S.names || [], vaults = S.vaults || [];
  const state = (who) => vaults.find((v) => v.who === who);
  const lore = vaults.filter((v) => !v.typed);
  body.innerHTML = `<div class="mbd-help">${T.helpSecret}</div>
    ${list.map((x, i) => { const v = state(x.who); return `<div class="mbd-item"><span><b>${h(x.who)}</b> · ${h(x.v)}${x.shows ? `<br><small>↳ ${h(x.shows)}</small>` : ''} <small>(${h(v?.open ? T.isOpen : T.isClosed)})</small></span>
      <div class="menu_button" data-op="${i}"${tipAt('open')}>${h(v?.open ? T.close : T.open)}</div><div class="menu_button" data-del="${i}">${h(T.del)}</div></div>`; }).join('')}
    ${lore.map((v) => `<div class="mbd-item"><span><b>${h(v.who)}</b> · <small>${h(T.fromLore)} (${h(v.open ? T.isOpen : T.isClosed)})</small></span><div class="menu_button" data-lore="${h(v.who)}">${h(v.open ? T.close : T.open)}</div></div>`).join('')}
    <label>${h(T.sWho)}${q('sWho')}</label><input id="mbd_sw" class="text_pole" list="mbd_names" placeholder="${h(T.sWhoPh)}" /><datalist id="mbd_names">${names.map((n) => `<option value="${h(n)}">`).join('')}</datalist>
    <label>${h(T.sV)}${q('sV')}</label><textarea id="mbd_sv" class="text_pole" placeholder="${h(T.sVPh)}"></textarea>
    <label>${h(T.sShows)}${q('sShows')}</label><input id="mbd_ss" class="text_pole" placeholder="${h(T.sShowsPh)}" />
    <label>${h(T.sSigns)}${q('sSigns')}</label><input id="mbd_sg" class="text_pole" placeholder="${h(T.sSignsPh)}" />
    <div class="mbd-row"><div id="mbd_sa" class="menu_button">${h(T.add)}</div></div>`;
  body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { A.setSecrets(list.filter((_, i) => i !== +b.dataset.del)); render(); }));
  body.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => { const x = list[+b.dataset.op], v = state(x.who); A.decide('vault', { who: x.who, open: !v?.open }); render(); }));
  body.querySelectorAll('[data-lore]').forEach((b) => b.addEventListener('click', () => { const v = state(b.dataset.lore); A.decide('vault', { who: v.who, open: !v.open }); render(); }));
  document.getElementById('mbd_sa').addEventListener('click', () => {
    const who = document.getElementById('mbd_sw').value.trim(), v = document.getElementById('mbd_sv').value.trim();
    if (!who || !v) return;
    A.setSecrets([...list, { who, v, shows: document.getElementById('mbd_ss').value.trim(), signs: commas(document.getElementById('mbd_sg').value) }]); render();
  });
}
// 방향: destinations, never sent; the guard watches for rushing ahead
function tabGoal(body, A, S) {
  const list = S.goals || [];
  body.innerHTML = `<div class="mbd-help">${T.helpGoal}</div>
    ${list.map((g, i) => `<div class="mbd-item"><span>${g.who ? `<b>${h(g.who)}</b> · ` : ''}${h(g.v)}${g.hint ? ` <small>(${h(T.gHint)})</small>` : ''}</span><div class="menu_button" data-g="${i}"${tipAt('arrived')}>${h(T.arrived)}</div></div>`).join('')}
    <label>${h(T.gV)}${q('gV')}</label><textarea id="mbd_gv" class="text_pole" placeholder="${h(T.gVPh)}"></textarea>
    <label>${h(T.gSigns)}${q('gSigns')}</label><input id="mbd_gs" class="text_pole" placeholder="${h(T.gSignsPh)}" />
    <div class="mbd-row"><label class="checkbox_label"><input id="mbd_gh" type="checkbox" /><span>${h(T.gHint)}</span></label>${q('gHint')}<div id="mbd_ga" class="menu_button">${h(T.add)}</div></div>`;
  body.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { A.setGoals(list.filter((_, i) => i !== +b.dataset.g)); render(); }));
  document.getElementById('mbd_ga').addEventListener('click', () => {
    const v = document.getElementById('mbd_gv').value.trim(); if (!v) return;
    A.setGoals([...list, { who: '', v, signs: commas(document.getElementById('mbd_gs').value), hint: document.getElementById('mbd_gh').checked }]); render();
  });
}
// 이름: swap the rendered {{char}}/{{user}} names in the outgoing prompt only
// The card's own text (what the AI reads about the character)
function cardText() { const c = ctx(), ch = c.characters?.[c.characterId] || {}; return [ch.description, ch.personality, ch.scenario, ch.first_mes, ch.mes_example, ch.data?.system_prompt].filter(Boolean).join('\n'); }
const STOPW = new Set('The He She His Her Hers Him They Them Their It Its I You Your We Our When If In On At A An And But Or As With This That These Those What Who Where Why How Not No Yes Do Does Did Is Are Was Were Be Been Has Have Had Will Would Can Could Should May Might Must For From To Of By About After Before Then Than So Very Just Only Also Even Still Now Here There One Two All Any Some Each Every Most More Less Such Into Over Under Again User Char System Note OOC'.split(' '));
function cardNames() {
  const t = cardText(), count = new Map();
  const add = (w) => { if (w.split(/\s+/).some((x) => STOPW.has(x))) return; count.set(w, (count.get(w) || 0) + 1); };
  for (const m of t.matchAll(/\b[A-Z][a-z']{1,}\b/g)) add(m[0]);                                    // single names
  for (const m of t.matchAll(/(?=\b([A-Z][a-z']{1,}\s+[A-Z][a-z']{1,})\b)/g)) add(m[1]);              // two-word names (overlapping)
  return [...count].filter(([w, n]) => n >= 3 && !STOPW.has(w)).sort((a, b) => b[1] - a[1]).slice(0, 8);
}
function tabName(body) {
  const c = ctx(), now = !N.mode ? T.nOffNow : N.mode === 'once' ? T.nOnceNow : T.nNow;
  body.innerHTML = `<div class="mbd-help">${T.helpName.replace('{C}', h(c.name2 || '')).replace('{U}', h(c.name1 || ''))}</div>
    <label>${h(T.nChar)}${q('nChar')}</label><input id="mbd_nc" class="text_pole" placeholder="${h(T.nBlank)}" value="${h(N.char)}" />
    <label>${h(T.nUser)}${q('nUser')}</label><input id="mbd_nu" class="text_pole" placeholder="${h(T.nBlank)}" value="${h(N.user)}" />
    <label>${h(T.nFrom)}${q('nFrom')}</label><input id="mbd_nf" class="text_pole" placeholder="${h(T.nFromPh)}" value="${h(N.charFrom)}" />
    <div class="mbd-row"><div id="mbd_n1" class="menu_button${N.mode === 'once' ? ' on' : ''}"${tipAt('nOnce')}>${h(T.nOnce)}</div><div id="mbd_n2" class="menu_button${N.mode === 'on' ? ' on' : ''}"${tipAt('nOn')}>${h(T.nOn)}</div><div id="mbd_n0" class="menu_button"${tipAt('nOff')}>${h(T.nOff)}</div></div>
    <div class="mbd-dim">${h(now)} · ${h(T.nShort)}</div>
    ${(() => { const p = N.char || N.user ? (swapPairsFor() || []) : []; const t = cardText();
      const cnt = (w) => (t.match(new RegExp(/^[\x00-\x7f]+$/.test(w) ? `(^|[^A-Za-z0-9_])${esc(w)}(?![A-Za-z0-9_])` : esc(w), 'g')) || []).length;
      const cover = p.length ? `<div class="mbd-lab">${h(T.nWill)}</div><div class="mbd-chips">${p.map(([f, to]) => `<span class="mbd-chip">${h(f)} → ${h(to)}${cnt(f) ? ` <small>${h(T.nInCard.replace('{n}', cnt(f)))}</small>` : ''}</span>`).join('')}</div>` : '';
      const have = new Set(p.map(([f]) => f)), cand = cardNames().filter(([w]) => !have.has(w));
      return cover + (cand.length ? `<div class="mbd-lab">${h(T.nCard)}${q('nCard')}</div><div class="mbd-chips">${cand.map(([w, n]) => `<span class="mbd-chip mbd-add" data-add="${h(w)}">+ ${h(w)} <small>${n}</small></span>`).join('')}</div>` : ''); })()}`;
  const set = (mode) => { swapSet(document.getElementById('mbd_nc').value, document.getElementById('mbd_nu').value, mode, document.getElementById('mbd_nf').value); render(); };
  document.getElementById('mbd_n1').addEventListener('click', () => set('once'));
  document.getElementById('mbd_n2').addEventListener('click', () => set('on'));
  document.getElementById('mbd_n0').addEventListener('click', () => set(''));
  body.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { const f = document.getElementById('mbd_nf'); f.value = [...commas(f.value), b.dataset.add].join(', '); N.charFrom = f.value; render(); }));
  for (const id of ['mbd_nc', 'mbd_nu', 'mbd_nf']) document.getElementById(id)?.addEventListener('change', () => { N.char = document.getElementById('mbd_nc').value.trim(); N.user = document.getElementById('mbd_nu').value.trim(); N.charFrom = document.getElementById('mbd_nf').value.trim(); render(); });
}
function swapSet(ch, us, mode, from = '') { N.char = String(ch || '').trim(); N.user = String(us || '').trim(); N.charFrom = String(from || '').trim(); N.mode = mode && (N.char || N.user) ? mode : ''; N.at = Date.now(); }
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// whole-word for Latin names (so "Ann" does not hit "Anna"), plain for Korean; one-letter names are left alone
const SW = { n: 0 };
function swapText(t, pairs) {
  let out = String(t);
  for (const [from, to] of pairs) {
    if (!from || from.length < 2 || !to || from === to) continue;
    // no lookbehind: older iPhone Safari cannot parse it
    const re = /^[\x00-\x7f]+$/.test(from) ? new RegExp(`(^|[^A-Za-z0-9_])${esc(from)}(?![A-Za-z0-9_])`, 'g') : new RegExp(`()${esc(from)}`, 'g');
    out = out.replace(re, (m, pre) => { SW.n++; return pre + to; });
  }
  return out;
}
// say what happened, so a swap that found nothing is not silent
function swapReport(pairs) {
  const t = window.toastr; if (!t || !SW.n) return;
  const what = [...new Set(pairs.map(([, to]) => to))].join(', ');
  t.info(ko ? `이름 바꿈 적용 → ${what} (${SW.n}곳)` : `Names swapped → ${what} (${SW.n})`, '', { timeOut: 3000 });
}
// After a real reply: if a swap was on but no name was found anywhere in that prompt, say so once (with what was looked for).
function swapMissCheck() {
  if (!G.swapWatch) return; G.swapWatch = false;
  if (G.swapHit || !N.mode) return;
  const looked = (swapPairsFor() || []).map(([f]) => f);
  window.toastr?.warning(ko ? `이번 답을 보낼 때 「${looked.join('」「')}」를 하나도 못 찾았어요. 이름 탭의 「카드에 자주 나오는 이름」에서 실제로 쓰인 이름을 추가해 주세요.` : `No swap: none of ${looked.join(', ')} was found in the prompt.`, '', { timeOut: 9000 });
}
function swapPairs() {
  if (!N.mode) return null;
  return swapPairsFor();
}
function swapPairsFor() {
  if (N.mode === 'once' && Date.now() - N.at > 10 * 60e3) { N.mode = ''; return null; }   // a forgotten one-shot does not linger
  // also the other names the character goes by in the text (e.g. a Korean spelling), longest first
  // everywhere the name shows up: the full name, each word of a multi-word name (a card written "First Last" is often
  // called just "Last" in the text), and the other names typed in. Longest first, so the full name goes before its parts.
  const c = ctx(), parts = (full) => String(full || '').split(/\s+/).filter((w) => w.length >= 2 && w !== full);
  const known = (n) => { try { return api()?.namesFor?.(n) || window.MeatballAPI?.namesFor?.(n) || []; } catch (e) { return []; } };
  const charNames = N.char ? [...new Set([c.name2, ...commas(N.charFrom), ...parts(c.name2), ...known(c.name2).flatMap((x) => [x, ...parts(x)])])].filter(Boolean) : [];
  const userNames = N.user ? [...new Set([c.name1, ...parts(c.name1), ...known(c.name1).flatMap((x) => [x, ...parts(x)])])].filter(Boolean) : [];
  const pairs = [...charNames.map((x) => [x, N.char]), ...userNames.map((x) => [x, N.user])].filter(([f, t]) => f && t && f !== t).sort((a, b) => b[0].length - a[0].length);
  return pairs.length ? pairs : null;
}
// chat completion: the finished message list, right before it is sent
function onPromptReady(data) {
  if (!data || data.dryRun) return;
  const pairs = swapPairs(); if (!pairs) return;
  SW.n = 0;
  for (const m of data.chat || []) {
    if (typeof m.content === 'string') m.content = swapText(m.content, pairs);
    else if (Array.isArray(m.content)) for (const p of m.content) if (typeof p?.text === 'string') p.text = swapText(p.text, pairs);
    if (typeof m.name === 'string') m.name = swapText(m.name, pairs);
  }
  swapDone(pairs);
}
// text completion: the combined prompt string
function onCombined(data) {
  if (!data || data.dryRun || typeof data.prompt !== 'string') return;
  const pairs = swapPairs(); if (!pairs) return;
  SW.n = 0; data.prompt = swapText(data.prompt, pairs); swapDone(pairs);
}
// Other extensions also send small requests (translation, summaries) that pass here without the names in them.
// Those are left alone: only a prompt where names were really swapped counts (and uses up a one-shot swap).
function swapDone(pairs) { if (!SW.n) return; G.swapHit = true; swapReport(pairs); swapUsed(); }
function swapUsed() { const p = swapPairs(); if (p) G.lastSwap = { pairs: p, at: Date.now() }; if (N.mode === 'once') { N.mode = ''; setTimeout(render, 100); } }
// For Meatball status 3: the swap now (to show names) and the one the last reply was written with (to read it back).
window.MeatballDirector = { v: 1, swaps: () => swapPairs() || [], swapsRecent: () => swapPairs() || (G.lastSwap && Date.now() - G.lastSwap.at < 30 * 60e3 ? G.lastSwap.pairs : []) };
function slash() {
  const c = ctx(), run = (args) => { const a = args || {}; const ch = a.char ?? '', us = a.user ?? ''; swapSet(ch, us, ch || us ? (String(a.until || '') === 'off' ? 'on' : 'once') : '', a.also ?? ''); render(); return ''; };
  const help = 'Swap {{char}}/{{user}} names in the next generation\'s prompt only. /mbname char=Name user=Name (until=off keeps it on). /mbname alone switches it off.';
  try {
    if (c.SlashCommandParser?.addCommandObject && c.SlashCommand?.fromProps) {
      const named = (name) => c.SlashCommandNamedArgument?.fromProps ? c.SlashCommandNamedArgument.fromProps({ name, description: name, typeList: [c.ARGUMENT_TYPE?.STRING ?? 'string'], isRequired: false }) : null;
      c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({ name: 'mbname', callback: (args) => run(args), returns: 'empty string', namedArgumentList: ['char', 'user', 'until', 'also'].map(named).filter(Boolean), helpString: help }));
    } else c.registerSlashCommand?.('mbname', (args) => run(args), [], help, true, true);
  } catch (e) { console.warn('[meatball-director] /mbname not registered', e); }
}

// Warnings right where the person types (nothing is blocked: the person's own words always go as written).
function info() {
  const el = document.getElementById('mbd_beat_info'); if (!el) return;
  const A = api(), S = A ? safeState(A) : {}, text = document.getElementById('mbd_beat')?.value || '';
  const signs = (S.signs || []).filter((g) => hasWord(text, g));
  const th = (S.threads || []).filter((t) => words(t.v).some((w) => String(text).toLowerCase().includes(w)));
  const en = A && text.trim() ? A.toEnglish(text, () => info()) : '';
  el.innerHTML = [signs.length ? `<div class="mbd-warn">⚠ ${h(T.sign)}: ${h(signs.join(', '))} — ${h(T.signWhy)}</div>` : '',
    th.map((t) => `<div class="mbd-warn">⚠ ${h(T.thread)}: ${h(t.a)} → ${h(t.v)}</div>`).join(''),
    en && en !== text ? `<div class="mbd-en">${h(T.en)}: ${h(en)}</div>` : ''].join('');
}


// ---- 규칙: the AI's habits. Off by default in the prompt; a habit seen in a reply switches its rule on for a few replies.
const PRESETS = [
  // 지침 (태도)
  { id: 'kiddo', name: { ko: '유아화 금지', en: 'No dumbing down' }, text: 'Do not make the user\'s character dim, ditzy or helpless: no cluelessness, no wide-eyed confusion, no needing simple things explained, no clumsy cuteness the user did not write. They are as sharp and capable as the user plays them.',
    re: /어리둥절|고개를 갸웃|눈을 (동그랗게|깜빡)|멍하니|헤헤|무슨 말인지 (몰라|모르)|천천히 (다시 )?설명|bewildered|tilt(ed|s) (her|his) head|blinked (owlishly|in confusion)|clueless/i },
  { id: 'belittle', name: { ko: '무시 · 깔보기 금지', en: 'No belittling' }, text: 'Do not belittle or dismiss the user\'s character, or women in general, as less capable. No talking down.',
    re: /여자(가|는|들은|들이)\s?(뭘|무슨|감히)|계집|여자답게|얌전히 있어|silly girl|little woman|know your place|women (can'?t|don'?t)/i },
  { id: 'mine', name: { ko: '소유 선언 금지', en: 'No "you\'re mine"' }, text: 'No possessive declarations such as "you\'re mine" or "my woman".',
    re: /넌 내 (거|것)|내 여자|you'?re mine|my woman/i },
  // 말버릇 (표현)
  { id: 'instead', name: { ko: '「A 대신 B」 말투', en: '"Instead of A, B"' }, text: 'Do not frame what a character does or says against what they did not do ("instead of saying hello, he asked…"). Just write what they do or say.',
    re: /대신(에)?[,\s]|instead of|rather than/i },
  { id: 'ifthen', name: { ko: '「만약 ~면 ~한 거다」', en: '"If you…, then you…"' }, text: 'No conditional verdicts like "If you do X, you are Y". Say it plainly or show it.',
    re: /(만약|만일)[^.\n]{0,40}(면|다면)[^.\n]{0,40}(거다|거야|것이다|셈이다)|\bif you\b[^.\n]{0,60}\b(you're|you are|then|i'll|means)\b/i },
  { id: 'notbut', name: { ko: '「X가 아니었다. Y였다」', en: '"It wasn\'t X. It was Y."' }, text: 'Avoid the "It wasn\'t X. It was Y." reveal pattern. State the thing itself.',
    re: /아니었다[.\s]+[^.\n]{0,40}(였다|이었다)|\bit wasn'?t\b[^.\n]{0,40}\.\s*it was\b/i },
  { id: 'breath', name: { ko: '숨 참기 클리셰', en: 'Breath clichés' }, text: 'No breath clichés (holding a breath one did not know one was holding, letting out a breath).',
    re: /참았던 숨|숨을 (참|들이켜|내쉬|멈추)|breath (she|he|they|i) didn'?t know|let out a breath|released a breath/i },
  { id: 'dots', name: { ko: '말줄임표 남발', en: 'Too many ellipses' }, text: 'Use ellipses (…) sparingly: two at most in a reply.',
    test: (t) => (t.match(/…|\.\.\./g) || []).length >= 6 },
];
const lg = ko ? 'ko' : 'en';
function rset() {
  const e = ctx().extensionSettings; const x = (e[KEY] ||= {});
  x.rules ||= []; x.modes ||= {}; x.texts ||= {};
  return x;
}
const saveSet = () => ctx().saveSettingsDebounced?.();
// rules: presets + the person's own lines. mode: auto (watched, warned once after it shows) · always · off
function allRules() {
  const R = rset();
  return [...PRESETS.map((p) => ({ ...p, text: R.texts[p.id] || p.text, preset: true, name: p.name[lg], en: p.name.en, mode: R.modes[p.id] || 'auto' })),
    ...R.rules.map((r) => ({ ...r, name: r.text.slice(0, 24), en: r.text.slice(0, 40), mode: r.mode || 'auto' }))];
}
// Meatball's classifier judges the auto rules in the same sort call (no extra call)
function pushHabits() { const A = api(); if (A?.setHabits) A.setHabits(allRules().filter((r) => r.mode === 'auto' && !r.test).map(({ id, name, text }) => ({ id, name, text }))); }
const lastAiText = () => { const c = ctx().chat || [], i = lastAiIdx(); return i >= 0 ? String(c[i].mes || '') : ''; };
function hitRules() {
  const A = api(), S = A ? safeState(A) : null, t = lastAiText(), out = new Set();
  for (const r of allRules()) {
    if (r.mode !== 'auto') continue;
    if (r.test) { if (r.test(t)) out.add(r.id); continue; }                       // countable things: code
    if (A && S?.sorted) { if ((S.habits || []).includes(r.id)) out.add(r.id); continue; }   // judged by the classifier
    if (r.re && r.re.test(t)) out.add(r.id);                                      // no Meatball, or not sorted yet: words
  }
  return out;
}
// what goes to the AI: "always" as is; an auto rule only for the reply right after it showed
function activeRules() {
  const A = api(), hit = hitRules();
  return allRules().filter((r) => r.mode === 'always' || (r.mode === 'auto' && (hit.has(r.id) || (!A && !r.preset))))
    .map((r) => (r.mode === 'auto' && hit.has(r.id) ? `The previous reply slipped into this (${r.en}). Watch it in this reply: ${r.text}` : r.text));
}
function tabRules(body) {
  const R = rset(), hit = hitRules(), rules = allRules(), mine = rules.filter((r) => !r.preset), pre = rules.filter((r) => r.preset);
  const row = (r) => `<div class="mbd-rule${r.mode === 'off' ? ' off' : ''}" title="${h(r.text)}"><span class="mbd-rt" data-re="${h(r.id)}" title="${h(r.text)} · ${h(T.rEdit)}">${h(r.preset ? r.name : r.text)}${hit.has(r.id) ? ' <i class="mbd-hit" title="' + h(T.rHit) + '">●</i>' : ''}</span>
    <b class="mbd-pill m-${r.mode}" data-rm="${h(r.id)}" title="${h(T.rCycle)}">${h(T.rMode[r.mode])}</b>${r.preset ? '' : `<b class="mbd-del" data-rd="${h(r.id)}" title="${h(T.rDel)}">✕</b>`}</div>`;
  body.innerHTML = `<div class="mbd-help">${T.helpRules}</div>
    <div class="mbd-lab">${h(T.rMine)}${q('rText')}</div>
    <div class="mbd-row"><input id="mbd_rt" class="mbd-in" placeholder="${h(T.rText)}" style="flex:1" /><b id="mbd_ra" class="mbd-btn">${h(T.rAdd)}</b></div>
    ${mine.map(row).join('') || `<div class="mbd-dim">${h(T.rNone)}</div>`}
    <details class="mbd-pre"><summary>${h(T.rPresets.replace('{n}', pre.length))}${q('rPresets')}</summary>${pre.map(row).join('')}</details>`;
  const order = ['auto', 'always', 'off'];
  body.querySelectorAll('[data-rm]').forEach((el) => el.addEventListener('click', () => {
    const id = el.dataset.rm, u = R.rules.find((x) => x.id === id), cur = u ? (u.mode || 'auto') : (R.modes[id] || 'auto'), v = order[(order.indexOf(cur) + 1) % 3];
    if (u) u.mode = v; else R.modes[id] = v;
    saveSet(); pushHabits(); render();
  }));
  body.querySelectorAll('[data-rd]').forEach((el) => el.addEventListener('click', () => { R.rules = R.rules.filter((x) => x.id !== el.dataset.rd); saveSet(); pushHabits(); render(); }));
  // click a title to edit what the rule says (presets too); Enter or leaving the box saves, Esc cancels
  body.querySelectorAll('[data-re]').forEach((el) => el.addEventListener('click', () => {
    const id = el.dataset.re, r = rules.find((x) => x.id === id); if (!r || el.querySelector('input')) return;
    el.innerHTML = `<input class="mbd-in" value="${h(r.text)}" />`; const inp = el.querySelector('input'); inp.focus();
    let done = false;
    const fin = (keep) => { if (done) return; done = true; const v = inp.value.trim();
      if (keep && v) { const u = R.rules.find((x) => x.id === id); if (u) u.text = v; else if (v !== PRESETS.find((p) => p.id === id)?.text) R.texts[id] = v; else delete R.texts[id]; saveSet(); pushHabits(); }
      render(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fin(true); } else if (e.key === 'Escape') fin(false); });
    inp.addEventListener('blur', () => fin(true));
  }));
  const add = () => { const text = body.querySelector('#mbd_rt').value.trim(); if (!text) return; R.rules.push({ id: 'u' + Date.now().toString(36), text, mode: 'auto' }); saveSet(); pushHabits(); render(); };
  body.querySelector('#mbd_ra').addEventListener('click', add);
  body.querySelector('#mbd_rt').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
}
// ---- alone (no Meatball): inject the pieces ourselves --------------------------------------------------------
function putAlone(beatText = '', sceneText = '') {
  const c = ctx(); if (api() || !c.setExtensionPrompt) return;
  const IN_CHAT = c.extension_prompt_types?.IN_CHAT ?? 1;
  const keep = [String(st().keep || '').trim(), sceneText.trim() ? `This scene: ${sceneText.trim()}` : '', ...activeRules().map((t) => `Style: ${t}`)].filter(Boolean).join('\n');
  c.setExtensionPrompt('mbd_keep', keep ? `[Standing instructions]\n${keep}` : '', IN_CHAT, 1);
  c.setExtensionPrompt('mbd_beat', beatText ? `[This reply]\n${beatText}` : '', IN_CHAT, 0);
}

// ---- generation ------------------------------------------------------------------------------------------------
const QUIET = new Set(['quiet', 'impersonate', 'continue']);
function onStart(type, opts, dryRun) {
  G.apply = false; G.type = '';
  if (!dryRun && N.mode) { G.swapWatch = true; G.swapHit = false; }
  if (dryRun || QUIET.has(type) || opts?.quiet_prompt) { api()?.pieces(null); return; }
  const s = st(), text = String(s.beat || '').trim(), A = api();
  const again = type === 'swipe' || type === 'regenerate';
  G.apply = !!text && (!s.used || (again && s.usedIdx === lastAiIdx()));
  G.type = type || 'normal';
  const S = A ? safeState(A) : {}, sceneOn = !!s.scene.trim() && !(A && (S.lastCut || 0) > (s.sceneGn || 0));
  if (A) { pushHabits(); A.pieces({ beat: G.apply ? text : '', scene: sceneOn ? s.scene : '', rules: activeRules() }); }
  else putAlone(G.apply ? text : '', sceneOn ? s.scene : '');
}
function onReceived(id) {
  if (!G.apply) return;
  const s = st(); s.used = true; s.usedIdx = Number.isInteger(id) ? id : lastAiIdx(); save();
  G.apply = false; render();
}

(function init() {
  // one copy only (two installs of this would add every piece twice)
  if (window.__mbDirector) return; window.__mbDirector = 'director';
  const { eventSource, event_types: E } = ctx();
  const up = () => { if (!document.getElementById('mbd_btn')) mount(); putAlone(); setTimeout(pushHabits, 1500); };
  eventSource.on(E.APP_READY, up);
  if (document.getElementById('send_form')) up();   // loaded late (after the app was ready): mount now
  eventSource.on(E.CHAT_CHANGED, () => { G.apply = false; putAlone(); render(); });
  eventSource.on(E.GENERATION_STARTED, onStart);
  if (E.CHAT_COMPLETION_PROMPT_READY) eventSource.on(E.CHAT_COMPLETION_PROMPT_READY, onPromptReady);
  if (E.GENERATE_AFTER_COMBINE_PROMPTS) eventSource.on(E.GENERATE_AFTER_COMBINE_PROMPTS, onCombined);
  slash();
  eventSource.on(E.MESSAGE_RECEIVED, onReceived);
  for (const ev of [E.GENERATION_ENDED, E.GENERATION_STOPPED]) eventSource.on(ev, () => { if (!api()) putAlone(''); setTimeout(render, 300); setTimeout(swapMissCheck, 500); });
  for (const ev of [E.MESSAGE_DELETED, E.MESSAGE_SWIPED, E.MESSAGE_EDITED]) eventSource.on(ev, () => setTimeout(render, 300));
})();
