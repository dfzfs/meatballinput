// Meatball Director (미트볼 지시창) — instructions as typed pieces, not one guessed block.
//   지시 (order):     the next reply only (reused for a swipe/regenerate of that reply); 📌 pins it for this scene or always
//                     (always = Meatball's director's note when Meatball is here).
//   비밀 (secret):    kept in Meatball, never sent; guarded like a lore vault line. Release/lock here.
//   방향 (direction): where the story should end up. Silent by default (the guard watches for rushing ahead); per direction it
//   can hint "moving slowly" or nudge one small step every few replies (상태창 v0.20+).
// With Meatball (window.MeatballAPI v1) the pieces go through Meatball: it places them last in its note, records the
// beat as the reply's instruction (no guessing), and checks it for pressing. Without Meatball, this extension injects
// the pieces itself (beat at depth 0, keep at depth 1).
const KEY = 'meatball_director', API_V = 1;
const ctx = () => SillyTavern.getContext();
// The newest 상태창 this 지시창 was made with: an older one still works, but some parts do nothing (e.g. 천천히 밀어주기)
const NEED_MB = '0.27.1';
const old = (v) => { if (!v) return false; const a = String(v).split('.').map(Number), b = NEED_MB.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== b[i]) return (a[i] || 0) < b[i]; } return false; };
const api = () => (window.MeatballAPI?.v === API_V ? window.MeatballAPI : null);
const h = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ko = (navigator.language || '').startsWith('ko');
const T = ko ? {
  title: '미트볼 지시창', alone: '미트볼 상태창이 꺼져 있어요: 「지시」만 쓸 수 있어요', needMb: '미트볼 상태창이 켜져 있어야 쓸 수 있어요.', oldMb: '미트볼 상태창이 옛 버전이에요({v}). {need} 이상으로 업데이트해야 다 작동해요(예: 천천히 밀어주기).',
  tabs: ['✍ 지시', '🎨 문체', '🔒 비밀', '🧭 방향'], vCustom: '✎ 직접', qBack: '↺ 숨긴 기본 질문 {n}개 되살리기', qSavedTip: '저장된 질문이에요. 🗑로 지워요.', setsTip: '대화극 · 영화처럼 같은 묶음을 한 번에 골라요. 지금 고른 걸 이름 붙여 저장할 수도 있어요.', fAdd: '새로 만들기', fFix: '고치기 · 지우기', fDone: '다 했어요', fBack: '숨긴 기본 {n}개 되살리기', fHint: '고칠 걸 누르세요. ×는 지우기', fNew: '새로 만들기', fEdit: '고치기', fTitlePh: '제목 (칩에 보이는 이름)', fTextPh: '내용: AI에게 할 말 (한국어도 돼요)', fLenPh: '내용: 예) 800자 안팎, 대사 위주로', fSave: '저장', fCancel: '취소', fReset: '↺ 원래대로', fResetTip: '처음 들어 있던 대로 되돌려요.', fUpd: '지금 고른 걸로 바꾸기', fUpdTip: '이 묶음 안 내용을 지금 고른 것(어디까지 · 시점 · 분량 · 더하기)으로 바꿔요.', fSetNote: '지금 고른 것(어디까지 · 시점 · 분량 · 더하기)이 이 이름으로 저장돼요.', fSetBase: '기본 묶음은 이름만 바꿀 수 있어요.', fAddTip: '제목과 내용을 적어 내 것을 만들어요.', delTip: '지우기', hideTip: '목록에서 숨기기 (↺로 되살릴 수 있어요)', fGone: '「{t}」 지웠어요', fHidden: '「{t}」 숨겼어요', customPh: '직접 적기 (한국어도 돼요) · Enter', customTip: '원하는 대로 직접 적어요.', ownPh: '＋ 내 것 적고 Enter', editTip: '눌러서 고르기 · 내 것 추가', setMix: '내가 고른 대로', setSavePh: '＋ 지금 고른 걸 내 느낌으로 저장 · 이름 적고 Enter', oocStyleL: '🎨 문체', oocEveryOn: '같이 적용', oocEveryOff: '안 씀', oocOptL: '더하기', oTabQ: '💬 질문', subs: ['✍ 지시', '🔒 비밀', '🧭 방향', '📜 규칙'],  commonL: '🎨 문체', commonNote: '이야기 · OOC 공통', commonTip: '매 답에 같이 가는 것: 글 느낌(대화극 · 영화처럼 같은 묶음), 어디까지 · 시점 · 분량 · 더하기. 이야기에도 OOC에도 똑같이 들어가요. 눌러서 열고 닫아요.', mStory: '✍ 이야기', mOoc: '💬 OOC', mOocTip: '이야기를 멈추고 AI에게 그냥 물어보는 모드. 미트볼 기록 · 쪽지 · 지시가 다 쉬어요.', setsL: '글 느낌', fineL: '📏 매 답', rulesL: '내 규칙 · 말버릇', styleL: '매 답', sceneHowL: '⚙ 장면 고정 방식', redoL: '↻ 이유 적고 다시 뽑기',
  setN: { plain: '🍃 기본', talk: '💬 대화극', movie: '🎬 영화처럼', novel: '📖 소설처럼', drama: '🔥 드라마', quick: '⚡ 가볍게' }, setT: { plain: '아무것도 더하지 않아요.', talk: '대사 · 말투 · 지난 일 기억 + 인풋까지만.', movie: '빠른 템포 · 감각 · 반전 · 끝은 훅.', novel: '길게 · 감정은 행동으로 · 감각 · 숨 고르기 · 복선.', drama: '갈등 · 설렘 · NPC · 끝은 훅.', quick: '짧게 · 빠른 템포 · 유머.' },
  helpRules: '<b>지침 · 말버릇.</b> 지킬 것을 한 줄로 적기만 하면 돼요. 미트볼이 답을 정리할 때 같이 훑어보고, 어긴 게 보이면 <b>다음 답 하나에만</b> "이전 답에 이게 나왔으니 이번엔 주의"를 붙여요. 그다음엔 꺼져요. 「항상」이면 늘 붙여요.',
  rMode: { auto: '보이면 주의', always: '항상', off: '끔' }, rHit: '이전 답에서 보임 → 다음 답에 주의 붙음', rCycle: '눌러서 바꾸기: 보이면 주의 → 항상 → 끔', rEdit: '눌러서 고치기', rMine: '내 지침', rNone: '아직 없어요. 위에 한 줄 적고 Enter', rPresets: '기본 지침 {n}개', dLeft: '채팅 왼쪽에 붙이기 (PC)', dRight: '채팅 오른쪽에 붙이기 (PC)', dBottom: '🎬 위에 띄우기', close: '닫기', rNew: '새 지침', rText: '예: 깡캐를 바보처럼 그리지 않는다', rAdd: '추가', rDel: '지우기', rPreset: '기본',
  helpOrder: '<b>AI에게 시킬 것.</b> 채팅에는 안 남고 본편 AI만 봐요.<br>· 그냥 적어 두면 <b>다음 답 한 번</b>에만 들어가요.<br>· 오래 지켜야 하면 📌 버튼으로 고정하세요. 「이 장면 동안」은 장면이 바뀌면 계속할지 물어봐요.<br>· 시간을 넘기고 싶으면 그냥 「사흘 뒤」처럼 적으면 돼요.',
  orderPh: '예: 깡캐가 먼저 말을 건다', fresh: '다음 답에 들어가요', used: '이미 들어갔어요. 그 답을 다시 뽑을 때만 또 들어가요', empty: '',
  bsPick: '📋 저장한 지시 꺼내기…', bsNone: '저장한 지시 없음 · 적고 ☆', bsSave: '지금 적은 지시를 제목을 붙여 저장해요 (모든 채팅에서 꺼내 쓸 수 있어요).', bsSaved: '저장된 지시예요.', bsDel: '저장 목록에서 빼요.', bsTitlePh: '제목', bsOk: '저장', bsDone: '「{t}」 저장했어요.', bsGone: '「{t}」를 목록에서 뺐어요.', sbBeat: '✍ 지시', sbScene: '🎬 장면', sbEvery: '📏 매 답', sbRedo: '↻ 다시 뽑기', rdTitle: '↻ 다시 뽑을 때 강하게', rdHelp: '마음에 안 든 답을 다시 뽑을 때, 뭐가 틀렸는지 적어 두면 「직전 버전은 이것 때문에 버려졌음, 반드시 고칠 것」으로 맨 끝에 붙어요. 이 답을 다시 뽑는 동안만 가고, 다음 답으로 넘어가면 지워져요.', rdPh: '예: 너무 쉽게 웃었음. 비밀을 직접 말해 버렸음', rdGo: '↻ 이걸로 다시 뽑기', rdOn: '↻ #{i}를 다시 뽑을 때마다 들어가요', rdFound: '지난 버전에서 보인 것 (누르면 들어가요)', rdLeak: '{w}의 비밀을 말해 버림', rdLeakNo: '비밀이 새어 나옴', rdRefuse: '거절을 쉽게 뒤집음', rdNoAi: '다시 뽑을 답이 아직 없어요',
  kBoost: '더하기', boostSub: '여러 개 골라도 돼요. 매 답에 같이 가고, 고른 건 계속 기억해요 (OOC 중엔 꺼져요). 위에 올리면 설명이 떠요.',
  bName: { talk: '대사 · 주고받기', logic: '기승전결 · 핍진성', npc: 'NPC 활용', world: '세상이 반응', voice: '말투 개성', subtext: '감정은 행동으로', sense: '감각 묘사', twist: '반전 · 변수', pace: '빠른 템포', humor: '유머', table: '표 · 그래프', html: 'HTML 시각화', spark: '설렘 · 긴장감', conflict: '갈등 키우기', breath: '숨 고르기', foreshadow: '복선', hook: '끝은 훅', memory: '지난 일 기억' },
  bTip: { talk: '서술보다 대사로, 인물들이 서로 말로 반응하며 주고받아요.', logic: '원인 → 결과가 이어지고 동기가 말이 돼요. 기승전결이 분명하고 억지 우연이 없어요.', npc: '주변 인물 · NPC가 배경이 아니라 자기 목적으로 말하고 움직여요.', world: '장소 · 사람들 · 소문 · 결과가 일어난 일에 반응해요.', voice: '인물마다 단어 · 리듬 · 말버릇이 달라요.', subtext: '감정을 말로 설명하지 않고 작은 몸짓 · 속뜻으로 보여 줘요.', sense: '소리 · 냄새 · 촉감 · 온도 · 빛을 살려요.', twist: '장면이 허락하면 뜻밖이지만 어울리는 전개를 넣어요.', pace: '묘사는 줄이고 일이 더 많이 일어나요.', humor: '인물에 맞는 가벼운 유머를 허용해요.', table: '이야기에 맞으면 목록 · 일정 · 상태판을 작은 표나 그래프로 보여 줘요.', html: '이야기에 맞으면 편지 · 폰 화면 · 간판 · 상태 카드를 채팅에 보이는 HTML · CSS로 그려요(스크립트 없음).', spark: '눈빛 · 거리 · 말할 뻔한 것 — 로맨스 긴장을 살려요.', conflict: '서로 원하는 게 달라 밀어붙여요.', breath: '큰 사건 사이에 조용한 일상 순간을 둬요.', foreshadow: '나중에 터질 작은 단서를 깔아 둬요.', hook: '다음 답이 궁금해지는 지점에서 끝내요.', memory: '앞에 있었던 일을 인물들이 기억하고 꺼내요.' },
  kLen: '분량', lenN: { auto: '알아서', short: '짧게', mid: '보통', long: '길게', custom: '직접' }, lenD: { auto: '따로 정하지 않아요 (프리셋 그대로).', short: '한두 문단.', mid: '서너 문단 정도.', long: '여섯 문단 이상, 장면에 필요한 만큼.' }, lenPh: '예: 800자 · 500 words · 4문단',
  boostPh: '내 것 추가: 예) 날씨를 꼭 한 줄 넣기', qSave: '＋ 빠른 질문으로 저장', qSaveTip: '지금 칸에 적힌 걸 빠른 질문 목록에 저장해요.',
  oocQuick: '📋 빠른 질문 고르기…', oqSend: '➤ 바로 보내기', oqEn: '🌐 영어로 입력창에', oqPut: '입력창에 넣기', oqNote: '보낼 때 앞에 (OOC: …)가 자동으로 붙어요.', oqEnFail: '번역이 늦어서 적은 그대로 넣었어요.',
  qa: { sum: '지금까지 요약', why: '왜 이렇게 됐어?', next: '다음 전개 아이디어', inner: '인물 속마음 해설', check: '설정 어긋난 데', fix: '내 글 다듬기', cast: '등장인물 정리', rel: '관계도', motive: '인물 동기 분석', time: '타임라인 정리', prompt: '지시가 왜 안 먹지?',
    sumQ: '지금까지의 이야기를 짧게 요약해 줘. 인물 관계와 아직 안 풀린 것도.', whyQ: '방금 장면이 왜 이렇게 흘러갔는지, 어떤 지시나 설정 때문인지 분석해 줘.', nextQ: '여기서 이어질 수 있는 다음 전개 아이디어를 서로 다른 방향으로 세 개 줘.', innerQ: '지금 장면에서 각 인물이 속으로 무슨 생각을 하고 있었을지 해설해 줘.', checkQ: '지금까지 설정이나 앞의 내용과 어긋난 곳이 있으면 짚어 줘.', fixQ: '내가 다음에 보낼 글을 자연스럽게 다듬어 줘: ', castQ: '지금까지 나온 인물들을 한 명씩 짧게 정리해 줘(성격 · 처지 · 지금 상태).', relQ: '인물들 사이 관계를 표로 정리해 줘.', motiveQ: '각 인물이 지금 무엇을 원하고 왜 그렇게 행동하는지 분석해 줘.', timeQ: '지금까지 있었던 일을 날짜 · 순서대로 타임라인으로 정리해 줘.', promptQ: '내가 준 지시나 설정 중 잘 안 지켜지는 게 있다면 왜 그런지, 어떻게 쓰면 더 잘 먹힐지 알려 줘.' },
  oocOpts: '이 OOC에 더하기', oocIf: '설정 무시 (가상 · IF)', oocTable: '표 · 그래프로', oocHtml: 'HTML로 보기 좋게',
  oocIfTip: '「얘네가 이랬다면?」 같은 가상 상황용. 로어북 · 월드인포 · 캐릭터 설정 · 지금까지의 사실에 안 묶이고 내 전제대로 써요. 실제 이야기는 안 바뀌어요.', oocTableTip: '분석 · 비교를 표나 그래프로 답해요.', oocHtmlTip: '답을 채팅에 보이는 HTML · CSS 카드로 보기 좋게 꾸며요.',
  oBeat: '✍ 이번 답 지시', oPin: '📌 고정해 둔 지시', oScene: '🎬 장면을 고정할 때', oSceneSub: '「📌 이 장면 동안」을 누르면 이대로 가요', oEvery: '📏 매 답', oEverySub: '지시가 없어도 늘 들어가요',
  kEnter: '장면까지', kIntro: '도입부', kSplit: '나누기', kReach: '어디까지',
  vSkip: '⏩ 타임스킵', vFill: '➡ 이어서', vIntroYes: '채우기', vIntroNo: '바로 본론', vMulti: '여러 답으로', vOne: '한 답에 기승전결', vAuto: '알아서', vUpto: '인풋까지만', vBeyond: '인풋 다음도',
  dSkip: '시간을 건너뛰어 장면으로. 인풋에 「사흘 뒤」처럼 적혀 있으면 그만큼, 없으면 알아서 적당히.', dFill: '직전 답이 멈춘 데서 자연스럽게 이어 가며 사이를 채우고 장면을 시작해요.',
  dIntroYes: '장소 · 분위기를 짧게 깔고 시작해요.', dIntroNo: '묘사로 시작하지 않고 바로 일이 벌어져요.',
  dMulti: '인풋을 한 답에 다 쓰지 않고 적당히 나눠서, 다음 답들에 이어 가요.', dOne: '한 답 안에 기승전결로 끝까지. 그 답이 나오면 고정이 풀려요(다시 뽑으면 또 들어가요).',
  dAuto: '따로 정하지 않아요.', dUpto: '내 인풋이 다루는 데까지만 쓰고 멈춰요. 내 캐릭터의 다음 행동을 대신 정하지 않아요.', dBeyond: '인풋이 다루는 것 다음까지 AI가 이야기를 더 이어 가요.',
  oocBtn: 'OOC', oocTip: 'OOC: 이야기를 멈추고 AI에게 그냥 물어봐요(분석 · 왜 이렇게 됐는지 등). 미트볼 쪽지 · 기록 · 지시 · 장면 고정이 전부 꺼지고, 맨 밑에 「위의 형식 · 트래커 · 스탯 · 분량 지시 전부 무시하고 질문에 답할 것」이 들어가요.',
  oocTitle: '💬 OOC 중 · 이야기 멈춤', oocBody: '미트볼 쪽지 · 기록 정리 · 지시 · 장면 고정 · 방향이 다 꺼져 있어요. 아래 칸에 묻거나 채팅창에 바로 보내도 돼요.', oocHide: '끌 때 OOC 대화 숨기기 (다음 이야기에 안 섞이게)', oocEvery: '매 답 설정도', oocEveryTip: '위 🎨 문체에서 고른 것(어디까지 · 시점 · 분량 · 더하기)을 OOC 답에도 같이 써요. 끄면 아래 OOC 더하기만 가요.', oocHideS: '끌 때 숨기기', qMine: '내 질문', kPov: '시점', vPov1: '1인칭', vPov3: '3인칭', vPovO: '전지적', dPovAuto: '따로 정하지 않아요.', dPov1: '상대 캐릭터의 1인칭으로 써요.', dPov3: '한 번에 한 인물 곁에 붙어 3인칭으로 써요.', dPovO: '인물들 사이를 오가며 각자 속마음까지 보여 줘요.', oocNoSpoil: '스포 금지', oocNoSpoilTip: '앞으로의 전개 계획이나 인물들이 아직 모르는 건 묻지 않으면 말하지 않아요.', oocShort: '짧게', oocShortTip: '답을 짧고 핵심만.', oocKo: '한국어로', oocKoTip: '답을 한국어로 해요.', oocAsk: '질문', oocAskPh: '예: 이 장면이 왜 이렇게 흘러갔는지 분석해 줘', oocSend: '💬 채팅으로 보내기', oocOff: '이야기로 돌아가기', oocHidden: 'OOC 대화 {n}개를 숨겼어요.', oocNote: '프리셋 · 카드에 적힌 지시는 지울 수 없어서, 맨 밑에서 「무시할 것」으로 덮어요.',
  scEnterL: '들어가기', scLenL: '길이', scFocusL: '초점', scHow: '장면 고정 방식 (계속 기억해요)', scSkip: '⏩ 건너뛰어 바로', scFill: '➡ 이어서 채우며', scOne: '한 답으로 끝', scMulti: '여러 답에 걸쳐',
  scSkipTip: '지금부터 그 장면까지의 시간은 짧게 넘기고 장면 자체로 바로 들어가요.', scFillTip: '직전 답이 멈춘 데서 이어 가며 그 사이를 짧게 채우고, 이번 답 안에 장면에 도착해요.',
  scOneTip: '한 답 안에서 장면을 끝까지 하고 마무리해요. 그 답이 나오면 고정이 저절로 풀려요(다시 뽑으면 또 들어가요).', scMultiTip: '여러 답에 걸쳐 이어져요. 첫 답은 들어가기, 그다음부턴 멈춘 데서 이어 가기.', scDone: '한 답짜리 · 답이 나오면 풀려요',
  pinScene: '📌 이 장면 동안', pinAlways: '📌 계속', clear: '지우기', pinned: '고정된 지시', pinnedScene: '이 장면 동안', pinnedAlways: '계속',
  sceneCut: '장면이 바뀌었어요. 이 지시를 계속할까요?', keepIt: '계속', en: 'AI에게 가는 말', sign: '비밀 낱말이 들어 있어요', signWhy: 'AI 눈앞에 비밀을 적는 셈이에요', thread: '캐릭터가 이미 거절한 일이에요',
  helpSecret: '<b>AI가 먼저 말해 버리면 안 되는 것.</b> 비밀 내용은 본편 AI에 <b>아예 안 가요</b>. 미트볼만 알고 지켜요.<br>· 답에 비밀이 새면 상태창에 ⚠가 떠요. 눌러서 다시 쓰기를 고를 수 있어요.<br>· 「겉으로 보여도 되는 모습」만 AI에게 가요. 비워도 돼요.<br>· 이제 밝혀져도 되면 「풀기」를 누르세요.',
  sWho: '누구의 비밀', sWhoPh: '이름', sV: '비밀 내용', sVPh: '예: 깡통은 아직 깡캐를 좋아한다', sSigns: '나오면 들킨 걸로 볼 낱말 (선택, 쉼표로)', sSignsPh: '예: 좋아해, 못 잊었',
  sShows: '겉으로 보여도 되는 모습 (선택, 이것만 AI에게 가요)', sShowsPh: '예: 반지만 보면 눈을 피한다', add: '추가',
  sWhoOpt: '누구의 비밀 (비우면 미트볼이 정해요)', sMore: '직접 더 적기', sCover: '주변에 보이는 모습 (겉)', sCoverPh: '예: 늘 밝은 반장', sOpens: '밝혀져도 되는 때', sOpensPh: '예: 서연이 스스로 털어놓을 때',
  sAuto: '추가하면 미트볼이 나머지를 채워요', sFill: '✨ 채우기', sFillPick: '✨ 고른 {n}개 채우기', sFillAll: '전부 고르기', sFilling: '미트볼이 채우는 중…', sFilled: '✨ 비밀 {n}개를 채웠어요. 마음에 안 들면 ✏️로 고쳐요.', sFillFail: '못 채운 게 {n}개 있어요. 다시 눌러 주세요.',
  sNeedWho: '누구의 비밀인지 적거나 「미트볼이 채우기」를 켜 주세요.', sEmpty: '비어 있는 칸은 ✨로 채울 수 있어요', sEdit: '✏️', sEditTip: '폼으로 불러와 고쳐요 (다시 「추가」를 눌러야 저장돼요)', sFillTip: '미트볼이 비밀을 영어 한 문장으로 다듬어 저장하고, 누가 지키는지 · 들킨 낱말 · 보여도 되는 모습 · 겉 · 밝혀질 때를 영어로 채워요. 이미 적은 칸은 그대로 둬요. 내가 쓴 글은 작게 남아요.',
  sOrig: '내가 쓴 글', fSigns: '들킨 낱말', fShows: '보여도 됨', fCover: '겉', fOpens: '밝혀질 때', needFill: '이 기능은 상태창 0.26 이상에서 돼요.', del: '지우기', open: '풀기', close: '다시 잠그기', isOpen: '풀림', isClosed: '잠김', fromLore: '설정집에서',
  helpGoal: '<b>이야기가 결국 갔으면 하는 곳.</b> 방향마다 알리는 정도를 골라요.<br>· <b>안 알림</b>: 본편 AI는 몰라요. 너무 빨리 가면 상태창에 ⚠만 떠요.<br>· <b>살짝 알리기</b>: 「아직 정해진 건 없고 천천히 가는 중」이라고만 가요. 진행을 <i>늦추는</i> 쪽이에요.<br>· <b>천천히 밀어주기</b>: 몇 답에 한 번 「이쪽으로, 자연스러우면 작은 한 걸음만, 도착은 말 것」이 가요. 진행을 <i>돕는</i> 쪽이에요. ⚠ 감시는 그대로.<br>· 이미 적은 방향은 옆 모드 버튼을 눌러 바꿔요. 거기까지 가면 「도착」을 누르세요.',
  gV: '원하는 방향', gVPh: '예: 결국 둘은 서로를 고른다', gSigns: '나오면 너무 빨리 간 걸로 볼 낱말 (선택, 쉼표로)', gSignsPh: '예: 고백, 입맞춤', gHint: '살짝 알리기', cards: '비밀 카드 보기 (단서 · 들킬 뻔 · 누가 아는지)', gMode: '알리는 정도', gNone: '안 알림', gPush: '천천히 밀어주기', gNear: '최근 답에 이 방향의 낱말이 나왔어요. 다다랐으면 「도착」을 눌러요', arrived: '도착',
  gSteps: ['아직 멀어요', '다가오는 중', '거의 다 왔어요'], gSince: '정한 뒤 {n}답', gPushes: '밀어줌 {n}번', gHits: '낱말 나온 답 {n}', gLast: '마지막 #{i}',
  sFresh: '✍ 다음 답에 들어가요', sUsed: '✓ #{i} 답에 들어갔어요', sUsedTip: '그 답을 다시 뽑으면 또 들어가요', sceneFor: '{n}답째', rSeen: '최근 {n}번 보임', rSeenTip: '이 채팅에서 이 버릇이 보인 답',
} : {
  title: 'Meatball Director', alone: 'Meatball is off: only "Order" works', needMb: 'Needs Meatball status window.', oldMb: 'Meatball status window is old ({v}). Update to {need} or later for everything to work (e.g. Nudge slowly).',
  tabs: ['✍ Order', '🎨 Style', '🔒 Secret', '🧭 Direction'], vCustom: '✎ Own', qBack: '↺ Bring back {n} hidden questions', qSavedTip: 'Saved. 🗑 deletes it.', setsTip: 'Pick a bundle like Dialogue or Cinematic at once. You can save what you picked under a name.', fAdd: 'New', fFix: 'Edit · delete', fDone: 'Done', fBack: 'Bring back {n} hidden', fHint: 'Tap one to edit. × deletes', fNew: 'New', fEdit: 'Edit', fTitlePh: 'Title (shown on the chip)', fTextPh: 'Words for the AI', fLenPh: 'e.g. about 500 words, mostly dialogue', fSave: 'Save', fCancel: 'Cancel', fReset: '↺ Reset', fResetTip: 'Back to how it came.', fUpd: 'Use what is picked now', fUpdTip: 'Replace this bundle with what is picked now.', fSetNote: 'What is picked now (how far · POV · length · extras) is saved under this name.', fSetBase: 'Built-in bundles can only be renamed.', fAddTip: 'Write a title and the words to make your own.', delTip: 'Delete', hideTip: 'Hide from the list (↺ brings it back)', fGone: 'Deleted “{t}”', fHidden: 'Hid “{t}”', customPh: 'Write your own · Enter', customTip: 'Write it the way you want.', ownPh: '＋ Your own, then Enter', editTip: 'Tap to pick · add your own', setMix: 'Mixed', setSavePh: '＋ Save the picks as my set · name, then Enter', oocStyleL: '🎨 Style', oocEveryOn: 'applies', oocEveryOff: 'off', oocOptL: 'Extras', oTabQ: '💬 Ask', subs: ['✍ Order', '🔒 Secret', '🧭 Direction', '📜 Rules'], commonL: '🎨 Style', commonNote: 'story · OOC', commonTip: 'What goes with every reply: quick sets, how far, POV, length, extras. Same for the story and for OOC. Click to open or close.', mStory: '✍ Story', mOoc: '💬 OOC', mOocTip: 'Pause the story and just ask the AI. Meatball records, notes and orders rest.', setsL: 'Quick sets', fineL: '📏 Every reply', rulesL: 'My rules · habits', styleL: 'Every reply', sceneHowL: '⚙ How a pinned scene goes', redoL: '↻ Reroll with a reason',
  setN: { plain: 'Plain', talk: '💬 Dialogue', movie: '🎬 Cinematic', novel: '📖 Novel', drama: '🔥 Drama', quick: '⚡ Light' }, setT: { plain: 'Nothing extra.', talk: 'Dialogue, voices, memory + only my input.', movie: 'Brisk, senses, twists, end on a hook.', novel: 'Long, subtext, senses, quiet moments, foreshadowing.', drama: 'Conflict, romance, NPCs, end on a hook.', quick: 'Short, brisk, humour.' },
  helpRules: '<b>Guidelines · habits.</b> Just write the rule in one line. Meatball checks the reply while sorting it; if the rule was broken, the next reply only gets "the last reply did this, watch it". "Always" sends it every time.',
  rMode: { auto: 'warn when seen', always: 'always', off: 'off' }, rHit: 'seen in the last reply → warned in the next', rCycle: 'click: warn when seen → always → off', rEdit: 'click to edit', rMine: 'My rules', rNone: 'None yet. Type one above and press Enter', rPresets: '{n} preset rules', dLeft: 'dock left of the chat (PC)', dRight: 'dock right of the chat (PC)', dBottom: 'pop up above 🎬', close: 'Close', rNew: 'New rule', rText: 'e.g. never treat B like a child', rAdd: 'Add', rDel: 'Delete', rPreset: 'preset',
  helpOrder: '<b>What the AI should do.</b> Not kept in the chat; only the story AI sees it.<br>· Typed here, it goes into <b>the next reply only</b>.<br>· Pin it with 📌 to keep it. "This scene" asks again when the scene changes.<br>· To skip time, just write "three days later".',
  orderPh: 'e.g. B speaks first', fresh: 'Goes into the next reply', used: 'Already used; goes in again only when that reply is redone', empty: '',
  bsPick: '📋 Load a saved order…', bsNone: 'No saved orders · write one and ☆', bsSave: 'Save what is written, with a title (usable in every chat).', bsSaved: 'This is a saved order.', bsDel: 'Remove it from the saved list.', bsTitlePh: 'Title', bsOk: 'Save', bsDone: 'Saved "{t}".', bsGone: 'Removed "{t}".', sbBeat: '✍ Order', sbScene: '🎬 Scene', sbEvery: '📏 Every reply', sbRedo: '↻ Reroll', rdTitle: '↻ Stronger on a reroll', rdHelp: 'When you reroll a reply you did not like, write what was wrong: it goes last as "the version before was thrown away for this; fix it". Only while rerolling this reply; cleared when the story moves on.', rdPh: 'e.g. smiled too easily. The secret was said outright', rdGo: '↻ Reroll with this', rdOn: '↻ Goes in every reroll of #{i}', rdFound: 'Seen in the last version (click to add)', rdLeak: "said {w}'s secret", rdLeakNo: 'a secret leaked', rdRefuse: 'gave in on a no too easily', rdNoAi: 'No reply to reroll yet',
  kBoost: 'Extras', boostSub: 'Pick any; they go with every reply (off during OOC). Hover for what each does.',
  bName: { talk: 'Dialogue', logic: 'Structure · plausibility', npc: 'Use NPCs', world: 'World reacts', voice: 'Distinct voices', subtext: 'Show, not tell', sense: 'Senses', twist: 'Twists', pace: 'Brisk pace', humor: 'Humour', table: 'Tables · charts', html: 'HTML visuals', spark: 'Romantic tension', conflict: 'Sharper conflict', breath: 'Quiet moments', foreshadow: 'Foreshadowing', hook: 'End on a hook', memory: 'Remember the past' },
  bTip: { talk: 'More talk between characters, reacting to each other.', logic: 'Causes lead to effects, motives make sense, clear build and payoff, no convenient coincidences.', npc: 'Side characters and NPCs act on their own aims.', world: 'Places, crowds and consequences respond.', voice: 'Each character speaks in their own way.', subtext: 'Feelings through small gestures and subtext.', sense: 'Sound, smell, touch, temperature, light.', twist: 'A fitting surprise when the scene allows.', pace: 'Less description, more happening.', humor: 'Light humour that fits the characters.', table: 'Lists, schedules or status boards as small tables or charts where they fit.', html: 'Letters, phone screens, signs or status cards drawn with inline HTML/CSS where they fit (no scripts).', spark: 'Glances, closeness, what is almost said.', conflict: 'People want different things and push.', breath: 'Quiet everyday moments between big ones.', foreshadow: 'Small hints that pay off later.', hook: 'End where the next reply is wanted.', memory: 'Characters bring up what happened before.' },
  kLen: 'Length', lenN: { auto: 'Any', short: 'Short', mid: 'Medium', long: 'Long', custom: 'Own' }, lenD: { auto: 'Nothing extra (your preset decides).', short: 'One or two paragraphs.', mid: 'Three to five paragraphs.', long: 'Six paragraphs or more, as the scene needs.' }, lenPh: 'e.g. 500 words · 4 paragraphs',
  boostPh: 'Add your own: e.g. always mention the weather', qSave: '＋ Save as quick ask', qSaveTip: 'Save what is in the box to the quick asks.',
  oocQuick: '📋 Pick a quick question…', oqSend: '➤ Send now', oqEn: '🌐 To input in English', oqPut: 'Put in input', oqNote: '(OOC: …) is added in front automatically.', oqEnFail: 'Translation was slow; put in as written.',
  qa: { sum: 'Sum up so far', why: 'Why did it go this way?', next: 'Next ideas', inner: 'What they really think', check: 'Inconsistencies', fix: 'Polish my message', cast: 'Cast list', rel: 'Relationship map', motive: 'Motives', time: 'Timeline', prompt: 'Why is my order ignored?',
    sumQ: 'Briefly sum up the story so far, with the relationships and what is still open.', whyQ: 'Why did the last scene go this way? Which instructions or settings led there?', nextQ: 'Give three different directions the story could take from here.', innerQ: 'What was each character really thinking in the current scene?', checkQ: 'Point out anything so far that contradicts the settings or earlier events.', fixQ: 'Polish the message I am about to send: ', castQ: 'List the characters so far, one line each (personality, situation, where they are now).', relQ: 'Lay out the relationships between the characters as a table.', motiveQ: 'What does each character want right now, and why do they act as they do?', timeQ: 'Put what has happened so far on a timeline, by date and order.', promptQ: 'If any of my instructions or settings are not being followed, why, and how could I write them so they work?' },
  oocOpts: 'Add to this OOC', oocIf: 'Ignore settings (what-if)', oocTable: 'Tables · charts', oocHtml: 'Pretty HTML',
  oocIfTip: 'For "what if they had…" runs: lorebook, world info, character settings and story facts are not binding; your premise wins. The real story does not change.', oocTableTip: 'Analysis and comparisons as tables or charts.', oocHtmlTip: 'The answer laid out as HTML/CSS cards in the chat.',
  oBeat: '✍ This reply', oPin: '📌 Pinned', oScene: '🎬 When a scene is pinned', oSceneSub: 'Used when you press 📌 This scene', oEvery: '📏 Every reply', oEverySub: 'Goes in even with no order',
  kEnter: 'Getting there', kIntro: 'Opening', kSplit: 'Pacing', kReach: 'How far',
  vSkip: '⏩ Time skip', vFill: '➡ Carry on', vIntroYes: 'Set the scene', vIntroNo: 'Straight in', vMulti: 'Over several replies', vOne: 'All in one reply', vAuto: 'Up to the AI', vUpto: 'Only my input', vBeyond: 'Past my input',
  dSkip: 'Skip time to the scene: as much as your message says, else a fitting amount.', dFill: 'Goes on naturally from where the last reply stopped and fills the way there.',
  dIntroYes: 'A short setting of place and mood first.', dIntroNo: 'No opening description; things happen at once.',
  dMulti: 'Your input is not used up in one reply; it is paced over the next ones.', dOne: 'Beginning to end in one reply. The pin comes off after it (a reroll still gets it).',
  dAuto: 'Nothing extra.', dUpto: 'Only as far as your message goes, then stop. Your character\'s next move is yours.', dBeyond: 'After your message, the AI carries the story on further.',
  oocBtn: 'OOC', oocTip: 'OOC: pause the story and just ask the AI (analysis, why something happened). Meatball notes, records, orders and scene pins are all off; at the very bottom goes "ignore all format, tracker, stat and length instructions above and answer".',
  oocTitle: '💬 OOC · story paused', oocBody: 'Just send your question in the chat. Meatball notes, sorting, orders, scene pins and directions are off.', oocHide: 'Hide the OOC talk when turning it off (keeps it out of the story)', oocEvery: 'Every-reply picks too', oocEveryTip: 'Your 📏 Every reply picks (how far, POV, length, extras, your own) also apply during OOC. Off: only the OOC options go.', oocHideS: 'Hide on exit', qMine: 'My questions', kPov: 'POV', vPov1: '1st person', vPov3: '3rd close', vPovO: 'Omniscient', dPovAuto: 'Nothing extra.', dPov1: "First person, from the other main character's view.", dPov3: 'Close third person, one character at a time.', dPovO: 'Moves between characters and shows what each thinks.', oocNoSpoil: 'No spoilers', oocNoSpoilTip: 'Plans for the story and what characters do not know yet stay unsaid unless asked.', oocShort: 'Short', oocShortTip: 'A short, to-the-point answer.', oocKo: 'In Korean', oocKoTip: 'Answer in Korean.', oocAsk: 'Question', oocAskPh: 'e.g. Why did this scene go this way?', oocSend: '💬 Send to chat', oocOff: 'Back to the story', oocHidden: 'Hid {n} OOC messages.', oocNote: 'Instructions in your preset or card cannot be removed; they are overridden from the bottom.',
  scEnterL: 'Entry', scLenL: 'Length', scFocusL: 'Focus', scHow: 'How a pinned scene goes (remembered)', scSkip: '⏩ Jump to it', scFill: '➡ Get there from here', scOne: 'One reply', scMulti: 'Several replies',
  scSkipTip: 'The time until the scene is passed over in a line; the reply opens on the scene itself.', scFillTip: 'Goes on from where the last reply stopped, covers the way briefly, and reaches the scene in this reply.',
  scOneTip: 'The whole scene is played out and closed in one reply. The pin comes off once that reply arrives (a reroll still gets it).', scMultiTip: 'Runs over several replies: the first gets into it, the next carry on from where it stopped.', scDone: 'one reply · comes off after it',
  pinScene: '📌 This scene', pinAlways: '📌 Always', clear: 'Clear', pinned: 'Pinned', pinnedScene: 'this scene', pinnedAlways: 'always',
  sceneCut: 'The scene changed. Keep this order?', keepIt: 'Keep', en: 'Sent to the AI', sign: 'Holds a secret word', signWhy: 'that writes the secret right in front of the AI', thread: 'The character already turned this down',
  helpSecret: '<b>What the AI must not blurt out.</b> The secret itself <b>never reaches</b> the story AI. Only Meatball knows it.<br>· If a reply leaks it, ⚠ shows in the bar.<br>· Only "what may show" goes to the AI. May be empty.<br>· When it may come out, press "Release".',
  sWho: 'Whose secret', sWhoPh: 'name', sV: 'The secret', sVPh: 'e.g. A still loves B', sSigns: 'Words that give it away (optional, comma)', sSignsPh: 'e.g. still love, never forgot',
  sShows: 'What may show (optional, only this goes to the AI)', sShowsPh: 'e.g. looks away from the ring', add: 'Add',
  sWhoOpt: 'Whose secret (empty: Meatball picks)', sMore: 'Write more yourself', sCover: 'How they look to others (cover)', sCoverPh: 'e.g. the cheerful class rep', sOpens: 'When it may come out', sOpensPh: 'e.g. when she tells it herself',
  sAuto: 'Meatball fills in the rest when added', sFill: '✨ Fill in', sFillPick: '✨ Fill in {n} picked', sFillAll: 'Pick all', sFilling: 'Meatball is filling in…', sFilled: '✨ Filled in {n} secrets. Edit with ✏️ if needed.', sFillFail: '{n} could not be filled. Try again.',
  sNeedWho: 'Write whose secret it is, or turn on "Meatball fills in".', sEmpty: 'Empty fields can be filled with ✨', sEdit: '✏️', sEditTip: 'Load into the form to edit (press Add again to save)', sFillTip: 'Meatball fills in who keeps it, give-away words, what may show, the cover and when it may come out. Fields you wrote stay.',
  sOrig: 'as you wrote it', fSigns: 'give-away', fShows: 'may show', fCover: 'cover', fOpens: 'comes out', needFill: 'Needs Meatball status 0.26 or newer.', del: 'Delete', open: 'Release', close: 'Lock again', isOpen: 'released', isClosed: 'locked', fromLore: 'from lore',
  helpGoal: '<b>Where the story should end up.</b> Pick how much the AI hears, per direction.<br>· <b>Silent</b>: the AI never knows. Rushing ahead only shows ⚠.<br>· <b>Hint</b>: only "nothing is settled, it moves slowly" — it <i>slows</i> things.<br>· <b>Nudge slowly</b>: every few replies, "this way; one small step if it fits; do not arrive" — it <i>helps</i> things move. ⚠ still watches.<br>· Change a direction you added with its mode button. Press "Arrived" when the story gets there.',
  gV: 'Direction', gVPh: 'e.g. in the end they choose each other', gSigns: 'Words that mean it rushed (optional, comma)', gSignsPh: 'e.g. confession, kiss', gHint: 'Hint', cards: 'Secret cards (clues · near misses · who knows)', gMode: 'How much the AI hears', gNone: 'Silent', gPush: 'Nudge slowly', gNear: 'Its words showed in recent replies. Press "Arrived" if the story got there', arrived: 'Arrived',
  gSteps: ['still far', 'getting closer', 'almost there'], gSince: '{n} replies since set', gPushes: 'nudged {n}×', gHits: 'words showed in {n}', gLast: 'last #{i}',
  sFresh: '✍ Goes into the next reply', sUsed: '✓ Went into reply #{i}', sUsedTip: 'Goes in again if that reply is redone', sceneFor: '{n} replies in', rSeen: 'seen {n}× lately', rSeenTip: 'Replies in this chat where this habit showed',
};
const TIP = ko ? {"pinScene": "적은 지시를 이 장면이 끝날 때까지 매 답에 넣어요. 미트볼이 장면이 바뀐 걸 알아채면 계속할지 물어요.", "pinAlways": "적은 지시를 이 채팅 내내 매 답에 넣어요.", "clear": "적은 지시를 지워요.", "sWho": "비밀을 가진 사람 이름.", "sV": "AI가 먼저 말하면 안 되는 내용. AI에게는 절대 안 가고 미트볼만 알아요.", "sShows": "겉으로 티 나도 되는 모습. 이것만 AI에게 가요. 예: 반지만 보면 눈을 피한다.", "sSigns": "답에 이 낱말이 나오면 비밀이 샌 걸로 보고 상태줄에 ⚠를 띄워요.", "open": "풀기: 이제 비밀이 아니게 돼요(AI도 알게 됨). 다시 잠글 수도 있어요.", "gV": "이야기가 결국 갔으면 하는 곳. AI는 몰라요. 미트볼은 너무 빨리 가는지만 지켜봐요.", "gSigns": "답에 이 낱말이 나오면 너무 빨리 간 걸로 보고 ⚠.", "gHint": "안 알림: AI는 몰라요(⚠ 감시만). 살짝 알리기: 「천천히 가는 중」만 가서 진행이 느려져요. 천천히 밀어주기: 몇 답에 한 번 방향을 알려 주고 작은 한 걸음만 허락해요(도착은 막음).", "gModeItem": "눌러서 안 알림 → 살짝 알리기 → 천천히 밀어주기로 바꿔요", "arrived": "그 방향에 도착했으면 눌러서 목록에서 빼요.", "rText": "지킬 것을 한 줄로 적고 Enter. 미트볼이 답을 정리할 때 어겼는지 같이 보고, 어겼으면 다음 답에만 주의를 붙여요.", "rPresets": "자주 쓰는 지침 8개. 켜고 끄고, 제목을 눌러 내용도 고칠 수 있어요."} : {"pinScene": "Keeps the order in every reply until the scene ends.", "pinAlways": "Keeps the order in every reply of this chat.", "clear": "Clears the order.", "sWho": "Who holds the secret.", "sV": "What the AI must not blurt out. Never sent; only Meatball knows.", "sShows": "What may show on the outside. Only this goes to the AI.", "sSigns": "If a reply uses these words, ⚠ shows.", "open": "Release: no longer a secret. You can lock it again.", "gV": "Where the story should end up. The AI is not told.", "gSigns": "If a reply uses these words, it rushed: ⚠.", "gHint": "Silent: the AI never knows (⚠ only). Hint: only \"it moves slowly\" goes, which slows things. Nudge slowly: every few replies the AI hears the direction and may take one small step (never the arrival).", "gModeItem": "Press to switch Silent → Hint → Nudge slowly", "arrived": "Remove it once the story got there.", "rText": "Write a rule and press Enter. Meatball checks the reply while sorting it.", "rPresets": "Eight common rules. Toggle them or click a title to edit."};
// a small ? with a tip (mouse-over, or tap on phones); one bubble for the whole panel
const q = (k) => (TIP[k] ? ` <span class="mbd-qi" tabindex="0" data-mbdtip="${h(TIP[k])}">?</span>` : '');
const tipAt = (k) => (TIP[k] ? ` data-mbdtip="${h(TIP[k])}"` : '');
const tipT = (t) => (t ? ` data-mbdtip="${h(t)}"` : '');   // any text as a hover bubble
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
const G = { apply: false, type: '', tab: 0, shown: -1 };
const fill = (t, o) => String(t).replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

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
  const t = e.target, act = document.activeElement;
  // a dropdown list (빠른 질문 · 저장한 지시) opens outside the panel in some browsers: picking from it is not "elsewhere"
  if (!t?.isConnected || t.closest?.('select, option, datalist') || (act?.tagName === 'SELECT' && p.contains(act)) || e.composedPath?.().includes(p)) return;
  if (p.contains(e.target) || e.target.closest?.('#mbd_btn, .mbd-bubble, .popup, .swal2-container, #toast-container')) return;
  p.classList.remove('open'); document.getElementById('mbd_btn')?.classList.remove('on');
}, true);
function render() {
  const p = document.getElementById('mbd_panel');
  if (!p || !p.classList?.contains('open')) return;
  const A = api(), S = A ? safeState(A) : null;
  const face = A ? 'idle' : 'sleep', d = rset().dock || 'bottom';
  migrateMine();
  const same = G.shown === G.tab, keep = same ? [p.querySelector('.mbd-sheet')?.scrollTop || 0, p.scrollTop || 0, p.querySelector('.mbd-cin')?.scrollTop || 0] : [0, 0, 0];
  p.innerHTML = `<div class="mbd-bar"><span class="mbd-dots"><i></i><i></i><i></i></span><img class="mbd-cat" data-face="${face}" src="${catUrl(face)}" alt="" draggable="false"><span class="mbd-title">meatball.exe</span><span class="mbd-q" title="">?</span>
    <span class="mbd-dock">${[['left', '⇤', T.dLeft], ['bottom', '⬓', T.dBottom], ['right', '⇥', T.dRight]].map(([k, ic, t]) => `<b data-dock="${k}" title="${h(t)}" class="${d === k ? 'on' : ''}">${ic}</b>`).join('')}</span><b class="mbd-x" title="${h(T.close)}">✕</b></div>
    <div class="mbd-tabs">${T.subs.map((t, i) => `<div class="mbd-tab${(G.tab || 0) === i ? ' on' : ''}" data-tab="${i}">${h(t)}</div>`).join('')}</div>
    <div class="mbd-sheet">${A ? '' : `<div class="mbd-dim">${h(T.alone)}</div>`}${A && old(S?.version) ? `<div class="mbd-warn">⬆ ${h(T.oldMb.replace('{v}', S.version).replace('{need}', NEED_MB))}</div>` : ''}<div id="mbd_body"></div></div>`;
  p.querySelector('.mbd-cat')?.addEventListener('click', (e) => poke(e.currentTarget));
  p.classList.toggle('ooc', !!st().ooc); document.getElementById('mbd_btn')?.classList.toggle('ooc', !!st().ooc);
  p.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { G.tab = +b.dataset.tab; render(); }));
  p.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { G.tab = +b.dataset.tab; render(); }));
  p.querySelectorAll('[data-dock]').forEach((b) => b.addEventListener('click', () => { rset().dock = b.dataset.dock; saveSet(); dock(); render(); }));
  p.querySelector('.mbd-x').addEventListener('click', () => { p.classList.remove('open'); document.getElementById('mbd_btn')?.classList.remove('on'); });
  const body = document.getElementById('mbd_body');
  if (G.shown !== G.tab) { body.classList.add('mbd-enter'); G.shown = G.tab; }
  p.classList.toggle('mbd-still', same);
  {
    const tab = G.tab > 3 ? 0 : G.tab || 0;
    const sub = body;
    if (tab === 0) tabDirect(sub, A, S);
    else if (tab === 3) tabRules(sub);
    else if (!A) sub.innerHTML = `<div class="mbd-help">${tab === 1 ? T.helpSecret : T.helpGoal}</div><div class="mbd-warn">${h(T.needMb)}</div>`;
    else if (tab === 1) tabSecret(sub, A, S);
    else tabGoal(sub, A, S);
  }
  // a tap redraws the panel: stay where you were
  if (same) { const sh = p.querySelector('.mbd-sheet'), ci = p.querySelector('.mbd-cin'); if (sh) sh.scrollTop = keep[0]; p.scrollTop = keep[1]; if (ci) ci.scrollTop = keep[2]; }
  const hp = body.querySelector('.mbd-help'), q = p.querySelector('.mbd-q');
  q.title = hp ? hp.textContent.replace(/\s+/g, ' ').trim() : '';
  // phones have no hover: tapping ? opens the same help inside the panel
  if (G.help && hp) hp.classList.add('open');
  q.onclick = () => { G.help = !G.help; if (hp) hp.classList.toggle('open', G.help); };
}
// 지시: one box for the next reply; 📌 pins it for this scene or for good (the standing one is Meatball's note)
function tabOrder(body, A, S) {
  const s = st(), keep = A ? (S.note || '') : s.keep, cut = A && s.scene.trim() && (S.lastCut || 0) > (s.sceneGn || 0);
  const popUsed = s.used && s.usedSeen !== s.usedIdx; if (popUsed) { s.usedSeen = s.usedIdx; save(); }
  const status = !s.beat.trim() ? '' : s.used ? `<span class="mbd-state used${popUsed ? ' pop' : ''}" title="${h(T.sUsedTip)}">${h(fill(T.sUsed, { i: s.usedIdx }))}</span>` : `<span class="mbd-state fresh">${h(T.sFresh)}</span>`;
  const sceneN = A && s.scene.trim() ? Math.max(0, (S.gn || 0) - (s.sceneGn || 0)) : 0;
  const pins = [s.scene.trim() ? ['scene', T.pinnedScene + (sceneOnce() ? ` · ${T.scDone}` : sceneN ? ` · ${fill(T.sceneFor, { n: sceneN })}` : ''), s.scene] : null, keep.trim() ? ['always', T.pinnedAlways, keep] : null].filter(Boolean);
  // v0.17.1 one screen: what to say, how long it holds, and two quiet openers (scene method · reroll with a reason)
  const opener = (id, label, sum, inner) => `<div class="mbd-op${G[id] ? ' open' : ''}"><div class="mbd-opl" data-op2="${id}"><span>${h(label)}</span><span class="mbd-sum">${h(sum)}</span><i>›</i></div>${G[id] ? `<div class="mbd-opin">${inner}</div>` : ''}</div>`;
  body.innerHTML = `<div class="mbd-help">${T.helpOrder}</div>
    <section class="mbd-card mbd-main">${savedLine(s.beat)}
      <textarea id="mbd_beat" class="text_pole" placeholder="${h(T.orderPh)}">${h(s.beat)}</textarea><div id="mbd_beat_info"></div>
      <div class="mbd-acts"><span class="mbd-st">${status}</span><span class="mbd-sp"></span><div id="mbd_pin_s" class="menu_button"${tipAt('pinScene')}>${h(T.pinScene)}</div><div id="mbd_pin_a" class="menu_button"${tipAt('pinAlways')}>${h(T.pinAlways)}</div><div id="mbd_clear" class="menu_button mbd-ghost"${tipAt('clear')}>${h(T.clear)}</div></div>
      ${cut ? `<div class="mbd-warn">${h(T.sceneCut)} <span id="mbd_scene_keep" class="menu_button">${h(T.keepIt)}</span> <span id="mbd_scene_clear" class="menu_button">${h(T.clear)}</span></div>` : ''}</section>
    ${pins.length ? `<section class="mbd-card">${pins.map(([k, l, v]) => `<div class="mbd-pinrow"><div><div class="mbd-pinl">📌 ${h(l)}</div><div class="mbd-pinv">${h(v)}</div></div><div class="menu_button mbd-ghost" data-unpin="${k}">${h(T.clear)}</div></div>`).join('')}</section>` : ''}
    <section class="mbd-card mbd-ops">${opener('opScene', T.sceneHowL, sceneSum(), `<div class="mbd-picks">${optPick('scEnter', 'kEnter')}${optPick('scIntro', 'kIntro')}${optPick('scLen', 'kSplit')}</div>`)}${opener('opRedo', T.redoL, (s.redo || '').trim() && s.redoIdx === lastAiIdx() ? '●' : '', redoHtml(s, S))}</section>`;
  body.querySelectorAll('[data-op2]').forEach((b) => b.addEventListener('click', () => { G[b.dataset.op2] = !G[b.dataset.op2]; render(); }));
  const sub = 'beat';
  const beat = document.getElementById('mbd_beat');
  if (beat) {
  beat.addEventListener('input', () => { const was = !!s.beat.trim() && !s.used; s.beat = beat.value; s.used = false; s.usedIdx = -1; save(); info();
    const sl = body.querySelector('.mbd-savedl'); if (sl) { const tmp = document.createElement('div'); tmp.innerHTML = savedLine(s.beat); sl.replaceWith(tmp.firstElementChild); body.querySelector('#mbd_bsrow')?.remove(); body.querySelector('.mbd-savedl').after(tmp.querySelector('#mbd_bsrow')); savedWire(body, s); }
    const el = body.querySelector('.mbd-st'); if (el && was !== !!s.beat.trim()) el.innerHTML = s.beat.trim() ? `<span class="mbd-state fresh pop">${h(T.sFresh)}</span>` : ''; });
  document.getElementById('mbd_clear')?.addEventListener('click', () => { s.beat = ''; s.used = false; s.usedIdx = -1; save(); render(); });
  const take = () => { const t = s.beat.trim(); s.beat = ''; s.used = false; s.usedIdx = -1; return t; };
  document.getElementById('mbd_pin_s')?.addEventListener('click', () => { const t = take(); if (!t) return; s.scene = [s.scene.trim(), t].filter(Boolean).join('\n'); s.sceneGn = A ? (S.gn || 0) : 0; s.sceneSent = 0; save(); render(); });
  document.getElementById('mbd_pin_a')?.addEventListener('click', () => { const t = take(); if (!t) return; const v = [keep.trim(), t].filter(Boolean).join('\n'); if (A) A.setNote(v); else { s.keep = v; putAlone(); } save(); render(); });
  body.querySelectorAll('[data-unpin]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.unpin === 'scene') s.scene = ''; else if (A) A.setNote(''); else { s.keep = ''; putAlone(); } save(); render(); }));
  document.getElementById('mbd_scene_keep')?.addEventListener('click', () => { s.sceneGn = S.gn || 0; save(); render(); });
  document.getElementById('mbd_scene_clear')?.addEventListener('click', () => { s.scene = ''; save(); render(); });
  }
  redoWire(body, s);
  pickWire(body);
  if (sub === 'beat') { info(); savedWire(body, s); }
}
// v0.16.3 saved orders: a title and the text, for every chat. Pick one to put it in; ☆ saves what is written (with a
// title), and when the box holds a saved one unchanged, ★ shows and 🗑 takes it out of the list.
function savedLine(cur) {
  const list = rset().beatSaved || [], i = list.findIndex((x) => x.text === String(cur || '').trim());
  return `<div class="mbd-qline mbd-savedl">${list.length ? `<select id="mbd_bsel" class="text_pole mbd-qsel"><option value="">${h(T.bsPick)}</option>${list.map((x, k) => `<option value="${k}">${h(x.title)}</option>`).join('')}</select>` : `<span class="mbd-dim mbd-bsnone">${h(T.bsNone)}</span>`}
    ${i >= 0 ? `<span class="mbd-star on"${tipT(T.bsSaved)}>★</span><span class="mbd-star" id="mbd_bdel"${tipT(T.bsDel)}>🗑</span>` : `<span class="mbd-star" id="mbd_bsave"${tipT(T.bsSave)}>☆</span>`}</div>
    <div class="mbd-addrow mbd-bsrow" id="mbd_bsrow" hidden><input id="mbd_bstitle" class="text_pole" placeholder="${h(T.bsTitlePh)}" /><div id="mbd_bsok" class="menu_button">${h(T.bsOk)}</div></div>`;
}
function savedWire(body, s) {
  const ta = body.querySelector('#mbd_beat'); if (!ta) return;
  const R0 = rset(), list = (R0.beatSaved ||= []);
  body.querySelector('#mbd_bsel')?.addEventListener('change', (e) => { const x = list[+e.target.value]; if (!x) return; ta.value = x.text; ta.dispatchEvent(new Event('input')); render(); });
  body.querySelector('#mbd_bsave')?.addEventListener('click', () => {
    const t = ta.value.trim(); if (!t) { ta.focus(); return; }
    const row = body.querySelector('#mbd_bsrow'), inp = body.querySelector('#mbd_bstitle');
    row.hidden = false; inp.value = t.split('\n')[0].slice(0, 24); inp.focus(); inp.select();
  });
  const ok = () => { const t = ta.value.trim(), title = (body.querySelector('#mbd_bstitle').value.trim() || t.slice(0, 24)).slice(0, 40); if (!t) return;
    const k = list.findIndex((x) => x.title === title); if (k >= 0) list[k].text = t; else list.push({ title, text: t.slice(0, 2000) }); saveSet(); window.toastr?.success(fill(T.bsDone, { t: title })); render(); };
  body.querySelector('#mbd_bsok')?.addEventListener('click', ok);
  body.querySelector('#mbd_bstitle')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ok(); } if (e.key === 'Escape') body.querySelector('#mbd_bsrow').hidden = true; });
  body.querySelector('#mbd_bdel')?.addEventListener('click', () => { const k = list.findIndex((x) => x.text === ta.value.trim()); if (k < 0) return; const [x] = list.splice(k, 1); saveSet(); window.toastr?.info(fill(T.bsGone, { t: x.title })); render(); });
  void s;
}
// v0.15 the person's own breakdown: getting there (time skip · carry on) · opening (set the scene · straight in) ·
// pacing (over several replies · all in one) — for a pinned scene; and how far (only my input · past it) for every reply.
// Kept in the extension settings for every chat until changed. Each choice carries the English words that are sent.
const GOING = 'This scene is already under way: pick up exactly where the last reply stopped and carry it forward. Do not set it up again, re-describe the place or the mood, or wrap it up';
const OPT = {
  scEnter: [['skip', 'vSkip', 'dSkip', "Time skip to the scene: if the user's message says how much time passes, use that; otherwise pick a fitting amount. One line for the passing time, then the scene"],
    ['fill', 'vFill', 'dFill', 'Go on naturally from where the last reply stopped, filling in what happens on the way, then start the scene']],
  scIntro: [['no', 'vIntroNo', 'dIntroNo', 'No opening description: start straight with what happens'],
    ['yes', 'vIntroYes', 'dIntroYes', 'Open the scene with a short setting of the place and the mood']],
  scLen: [['multi', 'vMulti', 'dMulti', 'Pace it over several replies: do not use up everything the user asked for in this one reply; take the first part and leave the rest for the next replies'],
    ['one', 'vOne', 'dOne', 'Tell the whole scene in this reply, beginning to end: setup, development, turn and close']],
  pov: [['auto', 'vAuto', 'dPovAuto', ''],
    ['first', 'vPov1', 'dPov1', "Write in first person, from the point of view of the user's character's partner in the scene (the main other character)"],
    ['third', 'vPov3', 'dPov3', 'Write in close third person, staying with one character at a time'],
    ['omni', 'vPovO', 'dPovO', 'Write in third person that can move between characters and show what each one thinks']],
  reach: [['auto', 'vAuto', 'dAuto', ''],
    ['upto', 'vUpto', 'dUpto', "Write only as far as the user's message goes, then stop. Do not go past it or decide what the user's character does next"],
    ['beyond', 'vBeyond', 'dBeyond', "After what the user's message covers, carry the story on a little further on your own"]],
};
const OLD = { mid: 'skip', cut: 'skip', flash: 'skip', dream: 'skip', slow: 'multi', open: 'multi', brief: 'one', cliff: 'one' };   // kinds from 0.14.4
const optOf = (k) => { const x = findItem(k, curId(k)) || { id: 'auto', n: T.vAuto, tip: '', t: '' }; return [x.id, x.n, x.tip, x.mine && k === 'len' ? (x.t ? `Reply length: ${x.t}` : '') : (x.t || '')]; };
const optName = (k) => optOf(k)[1];
const sceneMode = () => ({ enter: optOf('scEnter')[0], intro: optOf('scIntro')[0], len: optOf('scLen')[0] });
const sceneOnce = () => optOf('scLen')[0] === 'one';
const reachWords = () => optOf('reach')[3];
// the English words for a pinned scene: start (its first reply) · going (the ones after)
function sceneWords() {
  const one = sceneOnce(), upto = optOf('reach')[0] === 'upto';
  const len = one && upto ? "Tell the whole scene within what the user's message covers: setup, development, turn and close, without going past it" : optOf('scLen')[3];
  return { start: [optOf('scEnter')[3], optOf('scIntro')[3], len].join('. '), going: one ? '' : `${GOING}. Take the next part only; keep the rest for later replies`, focus: '' };
}
// v0.15.3 ✨ boosters: pick any; each goes into every story reply as a style line (off while OOC)
const BOOST = [
  ['talk', '💬', 'More dialogue and back-and-forth: characters react to each other in what they say, not only in narration'],
  ['logic', '🧩', 'Strong plausibility and structure: events follow from causes, motives make sense, a clear build, turn and payoff, no convenient coincidences'],
  ['npc', '👥', 'Use the side characters and NPCs actively: they have aims of their own, speak up and act, not just background'],
  ['world', '🌍', 'The world reacts: places, crowds, rumours and consequences respond to what happened'],
  ['voice', '🗣', 'Every character sounds like themselves: word choice, rhythm and habits of speech stay distinct'],
  ['subtext', '🎭', 'Feelings shown through small physical details and subtext rather than stated outright'],
  ['sense', '🌿', 'Rich sensory detail: sound, smell, touch, temperature, light'],
  ['twist', '🔀', 'Bring in an unexpected but fitting turn or complication when the scene allows'],
  ['pace', '⏱', 'Keep the pace brisk: less description, more happening'],
  ['humor', '😄', 'Light humour that fits the characters is welcome'],
  ['spark', '💞', 'Keep the romantic tension alive: glances, closeness, what is almost said'],
  ['conflict', '🔥', 'Sharpen the conflict: people want different things and push for them'],
  ['breath', '🕊', 'Leave room for quiet, everyday moments between the big ones'],
  ['foreshadow', '📜', 'Plant small hints that can pay off later'],
  ['hook', '🎣', 'End the reply on a hook that makes the next one wanted'],
  ['memory', '🧠', 'Characters remember and bring up what happened before'],
  ['table', '📊', 'Where it fits the story, show things as a small table or chart (a list, a schedule, a status board)'],
  ['html', '🎨', 'Where it fits the story, show things visually with self-contained inline HTML and CSS (a letter, a phone screen, a sign, a status card) that renders in the chat; no scripts'],
];
// 분량 (reply length): up to the AI · short · medium · long · the person's own words ("800자", "about 500 words")
const LEN = [['auto', ''], ['short', 'Reply length: short, one or two paragraphs'], ['mid', 'Reply length: medium, three to five paragraphs'], ['long', 'Reply length: long, six paragraphs or more; take the room the scene needs']];
const lenLine = () => optOf('len')[3];
// the person's own extras: any line, on/off like the others
const boostLines = () => [lenLine(), optOf('pov')[3], ...itemsOf('boost').filter((x) => chipOn('boost', x.id)).map((x) => x.t)].filter(Boolean);
// one row: a label, a segmented choice, and the words for what is picked right now
// a folded card: the title and what is picked now in one line; open to change. Which are open is kept for the session.
function foldHtml(id, title, sum, inner, tip) {
  const open = (G.folds ||= new Set()).has(id);
  return `<details class="mbd-fold" data-fold="${id}"${open ? ' open' : ''}><summary${tipT(tip)}><b>${h(title)}</b><span class="mbd-sum">${h(sum)}</span></summary><div class="mbd-foldin">${inner}</div></details>`;
}



// v0.20 one store for every list: built-in items can be renamed, rewritten or hidden; the person's own items carry a
// title (what the chip shows) and the words (what the AI gets, shown on hover). A row shows only what is picked; tap it
// for the choices, ✎ to fix or delete, ＋ to make a new one.
const uid = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const ovr = (k) => ((rset().ovr ||= {})[k] ||= {});
const hid = (k) => ((rset().hid ||= {})[k] ||= {});
const mineOf = (k) => ((rset().mine ||= {})[k] ||= []);
const PICKS = ['scEnter', 'scIntro', 'scLen', 'pov', 'reach', 'len'];
function baseOf(k) {
  if (k === 'len') return LEN.map(([id, t]) => ({ id, n: T.lenN[id], tip: T.lenD[id], t }));
  if (k === 'boost') return BOOST.map(([id, ic, t]) => ({ id, n: `${ic} ${T.bName[id]}`, tip: T.bTip[id], t }));
  if (k === 'oocopt') return OOC_OPT.map(([id, ic, t]) => ({ id, n: `${ic} ${T[id]}`, tip: T[id + 'Tip'], t }));
  if (k === 'set') return SETS.map(([id]) => ({ id, n: T.setN[id], tip: T.setT[id], t: '' }));
  return OPT[k].map(([id, v, d, t]) => ({ id, n: T[v], tip: T[d], t }));
}
function itemsOf(k, all) {
  const o = ovr(k), hd = hid(k);
  const b = baseOf(k).filter((x) => all || x.id === 'auto' || !hd[x.id]).map((x) => (o[x.id] ? { ...x, n: o[x.id].n || x.n, t: o[x.id].t ?? x.t, tip: o[x.id].t || x.tip, edited: true } : x));
  const m = k === 'set' ? (rset().setsMine || []).map((x, i) => ({ id: `m${i}`, n: x.name, tip: '', mine: true })) : mineOf(k).map((x) => ({ ...x, tip: x.t, mine: true }));
  return [...b, ...m];
}
const findItem = (k, id) => itemsOf(k, true).find((x) => x.id === id);
const curId = (k) => { const R0 = rset(), v = OLD[R0[k]] || R0[k], all = itemsOf(k); return all.some((x) => x.id === v) ? v : all[0].id; };
const chipOn = (k, id) => (k === 'boost' ? !!(rset().boost || {})[id] : String(id).startsWith('u') ? !!(rset().oocOn || {})[id] : !!rset()[id]);
function chipSet(k, id, on) {
  const R0 = rset();
  if (k === 'boost') (R0.boost ||= {})[id] = on; else if (String(id).startsWith('u')) (R0.oocOn ||= {})[id] = on; else R0[id] = on;
}
// older saves: "✎ 직접" text and own lines without a title become own items
function migrateMine() {
  const R0 = rset(); if (R0.mineV === 2) return;
  PICKS.forEach((k) => {
    if (R0[k] === 'custom') { const t = String(R0[k + 'Custom'] || '').trim(); if (t) { const id = uid(); mineOf(k).push({ id, n: t.slice(0, 16), t }); R0[k] = id; } else delete R0[k]; }
    delete R0[k + 'Custom'];
  });
  (R0.boostMine || []).forEach((x) => { if (!x.text) return; const id = uid(); mineOf('boost').push({ id, n: x.text.slice(0, 16), t: x.text }); if (x.on) (R0.boost ||= {})[id] = true; });
  (R0.oocMine || []).forEach((x) => { if (!x.text) return; const id = uid(); mineOf('oocopt').push({ id, n: x.text.slice(0, 16), t: x.text }); if (x.on) (R0.oocOn ||= {})[id] = true; });
  delete R0.boostMine; delete R0.oocMine; R0.mineV = 2; saveSet();
}
// the tray under a row: the choices, then ＋ new · ✎ fix or delete; a small form for a title and the words
function trayHtml(k, kind) {
  const edit = G.ed === k, all = itemsOf(k), hd = Object.keys(hid(k)).filter((x) => hid(k)[x]).length, f = G.form && G.form.k === k ? G.form : null;
  const cur = kind === 'pick' ? curId(k) : kind === 'set' ? setNow() : null;
  const chip = (x) => {
    const fixed = x.id === 'auto' || (kind === 'pick' && x.id === 'auto');
    if (edit) return `<span class="mbd-tg mbd-edc${fixed ? ' fixed' : ''}${f && f.id === x.id ? ' on' : ''}"${fixed ? '' : ` data-te="${k}:${x.id}"`}${tipT(x.tip)}>${x.mine ? '✎ ' : ''}${h(x.n)}${fixed ? '' : `<i class="mbd-x2" data-tdel="${k}:${x.id}"${tipT(x.mine ? T.delTip : T.hideTip)}>×</i>`}</span>`;
    const on = kind === 'chip' ? chipOn(k, x.id) : cur === x.id;
    const data = kind === 'chip' ? `data-cv="${k}:${x.id}"` : kind === 'set' ? `data-pv="set:${x.id}"` : `data-pv="${k}:${x.id}"`;
    return `<span class="mbd-tg${on ? ' on' : ''}${x.mine ? ' mbd-mine' : ''}${G.pop === `${k}:${x.id}` ? ' pop' : ''}" ${data}${tipT(x.tip)}>${x.mine ? '✎ ' : ''}${h(x.n)}</span>`;
  };
  let form = '';
  if (f) {
    const it = f.id ? findItem(k, f.id) : null, base = f.id && !it?.mine ? baseOf(k).find((x) => x.id === f.id) : null;
    const words = kind === 'set' ? `<div class="mbd-fnote">${h(f.id && !it?.mine ? T.fSetBase : T.fSetNote)}</div>` : `<textarea class="text_pole" data-fx rows="3" placeholder="${h(k === 'len' ? T.fLenPh : T.fTextPh)}">${h(it ? it.t || '' : '')}</textarea>`;
    form = `<div class="mbd-form"><div class="mbd-fhead">${h(f.id ? T.fEdit : T.fNew)}</div>
      <input class="text_pole" data-ft maxlength="24" placeholder="${h(T.fTitlePh)}" value="${h(it ? it.n : '')}" />${words}
      <div class="mbd-facts">${base && it?.edited ? `<span class="mbd-flink" data-freset${tipT(T.fResetTip)}>${h(T.fReset)}</span>` : ''}${kind === 'set' && it?.mine ? `<span class="mbd-flink" data-fupd${tipT(T.fUpdTip)}>${h(T.fUpd)}</span>` : ''}<span class="mbd-sp"></span><div class="menu_button mbd-ghost" data-fcancel>${h(T.fCancel)}</div><div class="menu_button mbd-primary" data-fsave>${h(T.fSave)}</div></div></div>`;
  }
  const foot = `<div class="mbd-tfoot"><span data-tadd="${k}"${tipT(kind === 'set' ? T.fSetNote : T.fAddTip)}>＋ ${h(T.fAdd)}</span><span data-tedit="${k}" class="${edit ? 'on' : ''}">${edit ? `✓ ${h(T.fDone)}` : `✎ ${h(T.fFix)}`}</span>${edit && hd ? `<span data-tback="${k}">↺ ${h(fill(T.fBack, { n: hd }))}</span>` : ''}</div>`;
  return `<div class="mbd-pkopts${G.fresh === k ? ' fresh' : ''}">${edit ? `<div class="mbd-fhint">${h(T.fHint)}</div>` : ''}<div class="mbd-chips">${all.map(chip).join('')}</div>${form}${foot}</div>`;
}
function pickRow(k, label) {
  const open = G.pk === k, id = curId(k), x = findItem(k, id);
  return `<div class="mbd-prow"><span class="mbd-plab">${h(label)}</span><span class="mbd-pk${open ? ' open' : ''}${id !== 'auto' && id !== baseOf(k)[0].id ? ' set' : ''}" data-pk="${k}"${tipT(x?.tip || T.editTip)}>${x?.mine ? '✎ ' : ''}${h(x?.n || '')}<i>▾</i></span></div>${open ? trayHtml(k, 'pick') : ''}`;
}
const optPick = (k, label) => pickRow(k, T[label]);
const lenPick = () => pickRow('len', T.kLen);
// chips: only the ones on, then ＋ (opens all)
function chipPick(k, label) {
  const open = G.pk === k, on = itemsOf(k).filter((x) => chipOn(k, x.id));
  return `<div class="mbd-prow mbd-crow"><span class="mbd-plab">${h(label)}</span><span class="mbd-chips mbd-onl">${on.map((x) => `<span class="mbd-tg on mini"${tipT(x.tip)}>${x.mine ? '✎ ' : ''}${h(x.n)}</span>`).join('')}<span class="mbd-tg mbd-addtg${open ? ' open' : ''}" data-pk="${k}"${tipT(T.editTip)}>${open ? '✓' : on.length ? '✎' : '＋'}</span></span></div>${open ? trayHtml(k, 'chip') : ''}`;
}
function pickWire(body) {
  const R0 = rset(), redraw = () => { saveSet(); if (st().ooc) putOoc(true); render(); };
  const kindOf = (k) => (k === 'set' ? 'set' : k === 'boost' || k === 'oocopt' ? 'chip' : 'pick');
  body.querySelectorAll('[data-pk]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.pk; G.pk = G.pk === k ? null : k; G.fresh = G.pk; G.ed = null; G.form = null; render(); }));
  body.querySelectorAll('[data-pv]').forEach((b) => b.addEventListener('click', () => {
    const [k, v] = b.dataset.pv.split(':');
    if (k === 'set') applySet(v); else R0[k] = v;
    G.pk = null; redraw();
  }));
  body.querySelectorAll('[data-cv]').forEach((b) => b.addEventListener('click', () => { const [k, id] = b.dataset.cv.split(':'); chipSet(k, id, !chipOn(k, id)); G.pop = chipOn(k, id) ? `${k}:${id}` : null; redraw(); }));
  // ＋ new · ✎ fix or delete · ↺ bring hidden ones back
  body.querySelectorAll('[data-tadd]').forEach((b) => b.addEventListener('click', () => { G.form = { k: b.dataset.tadd, id: null }; render(); setTimeout(() => body.querySelector('[data-ft]')?.focus(), 30); }));
  body.querySelectorAll('[data-tedit]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.tedit; G.ed = G.ed === k ? null : k; G.form = null; render(); }));
  body.querySelectorAll('[data-tback]').forEach((b) => b.addEventListener('click', () => { delete R0.hid[b.dataset.tback]; redraw(); }));
  body.querySelectorAll('[data-te]').forEach((b) => b.addEventListener('click', (e) => { if (e.target.dataset.tdel != null) return; const [k, id] = b.dataset.te.split(':'); G.form = { k, id }; render(); setTimeout(() => body.querySelector('[data-ft]')?.focus(), 30); }));
  body.querySelectorAll('[data-tdel]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation(); const [k, id] = b.dataset.tdel.split(':'), kind = kindOf(k), it = findItem(k, id); if (!it) return;
    if (k === 'set' && it.mine) R0.setsMine.splice(+id.slice(1), 1);
    else if (it.mine) { const l = mineOf(k), i = l.findIndex((x) => x.id === id); if (i >= 0) l.splice(i, 1); }
    else hid(k)[id] = true;
    if (kind === 'chip') chipSet(k, id, false); else if (kind === 'pick' && R0[k] === id) delete R0[k];
    if (G.form?.id === id) G.form = null;
    window.toastr?.info(fill(it.mine ? T.fGone : T.fHidden, { t: it.n }));
    redraw();
  }));
  const form = body.querySelector('.mbd-form');
  if (form) {
    const f = G.form, kind = kindOf(f.k), ti = form.querySelector('[data-ft]'), tx = form.querySelector('[data-fx]');
    const save = () => {
      const t = (tx?.value || '').trim().slice(0, 600), n = (ti.value || '').trim().slice(0, 24) || t.slice(0, 16);
      if (kind === 'set') {
        if (!n) { ti.focus(); return; }
        if (!f.id) (R0.setsMine ||= []).push({ name: n, ...pickNow() });
        else if (f.id.startsWith('m')) R0.setsMine[+f.id.slice(1)].name = n;
        else { const b = baseOf('set').find((x) => x.id === f.id); if (n === b.n) delete ovr('set')[f.id]; else ovr('set')[f.id] = { n }; }
      } else {
        if (!t && !(f.id && !findItem(f.k, f.id)?.mine)) { (tx || ti).focus(); return; }
        if (!f.id) { const id = uid(); mineOf(f.k).push({ id, n, t }); if (kind === 'chip') chipSet(f.k, id, true); else R0[f.k] = id; }
        else if (findItem(f.k, f.id)?.mine) { const x = mineOf(f.k).find((y) => y.id === f.id); x.n = n; x.t = t; }
        else { const b = baseOf(f.k).find((x) => x.id === f.id); const o = { n: n && n !== b.n ? n : undefined, t: t !== b.t ? t : undefined }; if (o.n || o.t != null) ovr(f.k)[f.id] = o; else delete ovr(f.k)[f.id]; }
      }
      G.form = null; redraw();
    };
    form.querySelector('[data-fsave]').addEventListener('click', save);
    form.querySelector('[data-fcancel]').addEventListener('click', () => { G.form = null; render(); });
    form.querySelector('[data-freset]')?.addEventListener('click', () => { delete ovr(f.k)[f.id]; G.form = null; redraw(); });
    form.querySelector('[data-fupd]')?.addEventListener('click', () => { const i = +f.id.slice(1); R0.setsMine[i] = { name: R0.setsMine[i].name, ...pickNow() }; G.form = null; redraw(); });
    ti.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); (tx && !tx.value.trim() ? tx : null)?.focus() || save(); } if (e.key === 'Escape') { G.form = null; render(); } });
    tx?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === 'Escape') { G.form = null; render(); } });
  }
  G.fresh = null; G.pop = null;
}
const sceneSum = () => ['scEnter', 'scIntro', 'scLen'].map(optName).join(' · ');
function everySum() {
  const n = itemsOf('boost').filter((x) => chipOn('boost', x.id)).length;
  return [curId('reach') !== 'auto' ? optName('reach') : '', curId('pov') !== 'auto' ? optName('pov') : '', curId('len') !== 'auto' ? optName('len') : '', n ? `✨ ${n}` : ''].filter(Boolean).join(' · ') || T.vAuto;
}

// v0.14.1 ↻ a reroll with a reason: what was wrong with the version being thrown away goes as the strongest, last line.
// It holds for every reroll of that reply and is cleared when the story moves on (a new reply is asked for).
function redoProblems(S) {
  const out = [];
  for (const g of S.guard || []) out.push(g.kind === 'reversal' ? T.rdRefuse : g.who ? fill(T.rdLeak, { w: g.who }) : T.rdLeakNo);
  const hit = hitRules(); for (const r of allRules()) if (hit.has(r.id)) out.push(r.name);
  return [...new Set(out)].slice(0, 6);
}
function redoHtml(s, S) {
  const li = lastAiIdx(), on = !!(s.redo || '').trim() && s.redoIdx === li, probs = li >= 0 ? redoProblems(S) : [];
  return `<div class="mbd-redo2"${tipT(T.rdHelp)}>
    ${probs.length ? `<div class="mbd-dim">${h(T.rdFound)}</div><div class="mbd-rdchips">${probs.map((p) => `<span class="mbd-chip mbd-rdchip" data-rd="${h(p)}">+ ${h(p)}</span>`).join('')}</div>` : ''}
    <textarea id="mbd_redo" class="text_pole" placeholder="${h(T.rdPh)}">${h(s.redoIdx === li ? s.redo || '' : '')}</textarea>
    <div class="mbd-row">${on ? `<span class="mbd-state fresh">${h(fill(T.rdOn, { i: li }))}</span>` : '<span></span>'}<div id="mbd_redo_go" class="menu_button"${li < 0 ? ' disabled' : ''}>${h(li < 0 ? T.rdNoAi : T.rdGo)}</div></div></div>`;
}
function redoWire(body, s) {
  const ta = body.querySelector('#mbd_redo'); if (!ta) return;
  const keep = () => { s.redo = ta.value; s.redoIdx = lastAiIdx(); save(); };
  ta.addEventListener('input', keep);
  body.querySelectorAll('[data-rd]').forEach((c) => c.addEventListener('click', () => { ta.value = [ta.value.trim(), c.dataset.rd].filter(Boolean).join('\n'); keep(); render(); }));
  body.querySelector('#mbd_redo_go')?.addEventListener('click', () => {
    if (lastAiIdx() < 0) return;
    keep();
    // a new swipe of the last reply (the old one stays one swipe back)
    const b = document.querySelector('#chat .last_mes .swipe_right'); if (b) b.click(); else ctx().executeSlashCommandsWithOptions?.('/regenerate');
  });
}
// 비밀: typed secrets live in Meatball (guarded like a lore vault line); lore vault lines can be released here too
// v0.13.2 비밀: write only the secret — Meatball fills in the rest (one secret, the picked ones, up to 6 per call).
// Filled items glow once; items being filled shimmer. The person can still write any field; written fields are kept.
function tabSecret(body, A, S) {
  const list = S.secrets || [], names = S.names || [], vaults = S.vaults || [], R0 = rset(), auto = R0.secAuto !== false;
  const state = (who) => vaults.find((v) => v.who === who);
  const lore = vaults.filter((v) => !v.typed);
  const busy = G.sBusy || new Set(), pick = (G.sPick ||= new Set()), fresh = G.sFresh || new Set();
  const can = typeof A.fillSecrets === 'function';
  const empty = (x) => !(x.signs || []).length || !x.shows || !x.cover || !x.opens;
  const field = (label, v) => (v ? `<div class="mbd-sf"><em>${h(label)}</em>${h(v)}</div>` : '');
  const item = (x, i) => { const v = state(x.who);
    return `<div class="mbd-item mbd-sec${busy.has(i) ? ' busy' : ''}${fresh.has(i) ? ' fresh' : ''}">
      ${can ? `<input type="checkbox" class="mbd-spick" data-pick="${i}"${pick.has(i) ? ' checked' : ''}${busy.size ? ' disabled' : ''} />` : ''}
      <span><b>${h(x.who)}</b> · ${h(x.v)} <small>(${h(v?.open ? T.isOpen : T.isClosed)})</small>${x.vOrig && x.vOrig !== x.v ? `<div class="mbd-sorig">${h(T.sOrig)}: ${h(x.vOrig)}</div>` : ''}
        ${busy.has(i) ? `<div class="mbd-sfill">${h(T.sFilling)}</div>` : `<div class="mbd-sfs">${(x.signs || []).length ? `<div class="mbd-sf"><em>${h(T.fSigns)}</em>${x.signs.map((g) => `<i class="mbd-chip">${h(g)}</i>`).join('')}</div>` : ''}${field(T.fShows, x.shows)}${field(T.fCover, x.cover)}${field(T.fOpens, x.opens)}
        ${can && empty(x) ? `<small class="mbd-dim">${h(T.sEmpty)}</small>` : ''}</div>`}</span>
      <div class="mbd-sbtns">${can ? `<div class="menu_button" data-fill="${i}" title="${h(T.sFillTip)}"${busy.size ? ' disabled' : ''}>${h(T.sFill)}</div>` : ''}<div class="menu_button" data-op="${i}"${tipAt('open')}>${h(v?.open ? T.close : T.open)}</div><div class="menu_button" data-edit="${i}" title="${h(T.sEditTip)}">${h(T.sEdit)}</div><div class="menu_button" data-del="${i}" title="${h(T.del)}">🗑</div></div></div>`; };
  body.innerHTML = `<div class="mbd-help">${T.helpSecret}</div>${A.open && vaults.length ? `<div class="mbd-row"><div class="menu_button mbd-cards" id="mbd_cards">🔒 ${h(T.cards)}</div></div>` : ''}
    ${can && list.length > 1 ? `<div class="mbd-row mbd-sbar"><label class="checkbox_label"><input type="checkbox" id="mbd_sall"${pick.size === list.length ? ' checked' : ''}${busy.size ? ' disabled' : ''} /> ${h(T.sFillAll)}</label><div class="menu_button${pick.size ? '' : ' disabled'}" id="mbd_sfp">${h(fill(T.sFillPick, { n: pick.size }))}</div></div>` : ''}
    ${list.map(item).join('')}
    ${lore.map((v) => `<div class="mbd-item"><span><b>${h(v.who)}</b> · <small>${h(T.fromLore)} (${h(v.open ? T.isOpen : T.isClosed)})</small></span><div class="menu_button" data-lore="${h(v.who)}">${h(v.open ? T.close : T.open)}</div></div>`).join('')}
    <label>${h(T.sV)}${q('sV')}</label><textarea id="mbd_sv" class="text_pole" placeholder="${h(T.sVPh)}">${h(G.sDraft?.v || '')}</textarea>
    <label>${h(can && auto ? T.sWhoOpt : T.sWho)}${q('sWho')}</label><input id="mbd_sw" class="text_pole" list="mbd_names" placeholder="${h(T.sWhoPh)}" value="${h(G.sDraft?.who || '')}" /><datalist id="mbd_names">${names.map((n) => `<option value="${h(n)}">`).join('')}</datalist>
    <details class="mbd-more"${G.sDraft && (G.sDraft.shows || G.sDraft.cover || G.sDraft.opens || (G.sDraft.signs || []).length) ? ' open' : ''}><summary>${h(T.sMore)}</summary>
      <label>${h(T.sShows)}${q('sShows')}</label><input id="mbd_ss" class="text_pole" placeholder="${h(T.sShowsPh)}" value="${h(G.sDraft?.shows || '')}" />
      <label>${h(T.sSigns)}${q('sSigns')}</label><input id="mbd_sg" class="text_pole" placeholder="${h(T.sSignsPh)}" value="${h((G.sDraft?.signs || []).join(', '))}" />
      <label>${h(T.sCover)}</label><input id="mbd_sc" class="text_pole" placeholder="${h(T.sCoverPh)}" value="${h(G.sDraft?.cover || '')}" />
      <label>${h(T.sOpens)}</label><input id="mbd_so" class="text_pole" placeholder="${h(T.sOpensPh)}" value="${h(G.sDraft?.opens || '')}" /></details>
    <div class="mbd-row">${can ? `<label class="checkbox_label"><input type="checkbox" id="mbd_sauto"${auto ? ' checked' : ''} /> ${h(T.sAuto)}</label>` : ''}<div id="mbd_sa" class="menu_button">${h(T.add)}</div></div>`;
  G.sFresh = null;
  body.querySelector('#mbd_cards')?.addEventListener('click', () => A.open('secret'));
  body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { pick.clear(); A.setSecrets(list.filter((_, i) => i !== +b.dataset.del)); render(); }));
  body.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => { const x = list[+b.dataset.op], v = state(x.who); A.decide('vault', { who: x.who, open: !v?.open }); render(); }));
  body.querySelectorAll('[data-lore]').forEach((b) => b.addEventListener('click', () => { const v = state(b.dataset.lore); A.decide('vault', { who: v.who, open: !v.open }); render(); }));
  body.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.edit; G.sDraft = { ...list[i] }; pick.clear(); A.setSecrets(list.filter((_, k) => k !== i)); render(); body.querySelector('#mbd_sv')?.focus(); }));
  body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('change', () => { const i = +b.dataset.pick; if (b.checked) pick.add(i); else pick.delete(i); render(); }));
  body.querySelector('#mbd_sall')?.addEventListener('change', (e) => { pick.clear(); if (e.target.checked) list.forEach((_, i) => pick.add(i)); render(); });
  body.querySelector('#mbd_sauto')?.addEventListener('change', (e) => { R0.secAuto = !!e.target.checked; saveSet(); render(); });
  body.querySelectorAll('[data-fill]').forEach((b) => b.addEventListener('click', () => fillAt(A, [+b.dataset.fill])));
  body.querySelector('#mbd_sfp')?.addEventListener('click', () => { if (pick.size) fillAt(A, [...pick]); });
  document.getElementById('mbd_sa').addEventListener('click', async () => {
    const v = document.getElementById('mbd_sv').value.trim(), who = document.getElementById('mbd_sw').value.trim();
    if (!v) return;
    const x = { who, v, shows: document.getElementById('mbd_ss').value.trim(), signs: commas(document.getElementById('mbd_sg').value), cover: document.getElementById('mbd_sc').value.trim(), opens: document.getElementById('mbd_so').value.trim() };
    G.sDraft = null;
    if (can && auto) {
      // add it right away (a placeholder name until Meatball answers), then fill it like the others
      const i = list.length; A.setSecrets([...list, { ...x, who: who || '…' }]);
      await fillAt(A, [i], !who);
    } else {
      if (!who) { G.sDraft = x; window.toastr?.warning(T.sNeedWho); render(); return; }
      A.setSecrets([...list, x]); render();
    }
  });
}
// fill the secrets at these places in the list, in as few calls as the API makes (6 per call)
async function fillAt(A, idx, whoWasEmpty = false) {
  if (typeof A.fillSecrets !== 'function') { window.toastr?.warning(T.needFill); return; }
  const S0 = safeState(A), list = [...(S0.secrets || [])];
  const ids = idx.filter((i) => list[i]);
  if (!ids.length || G.sBusy?.size) return;
  G.sBusy = new Set(ids); render();
  let res = null;
  try { res = await A.fillSecrets(ids.map((i) => ({ ...list[i], who: list[i].who === '…' ? '' : list[i].who }))); } catch (e) { console.warn('[meatball-director] fill', e); }
  const now = [...(safeState(A).secrets || [])];
  let failed = 0;
  ids.forEach((i, k) => {
    const y = res?.list?.[k];
    if (y && y.who) now[i] = { ...now[i], ...y }; else failed++;
    if (whoWasEmpty && now[i]?.who === '…' && !(y && y.who)) now[i] = null;   // no name came back: keep it in the form instead
  });
  if (whoWasEmpty && ids.some((i) => now[i] === null)) G.sDraft = { ...list[ids[0]], who: '' };
  A.setSecrets(now.filter(Boolean));
  G.sBusy = null; G.sPick = new Set(); G.sFresh = new Set(ids.filter((i) => now[i]));
  render();
  const ok = ids.length - failed;
  if (ok) window.toastr?.success(fill(T.sFilled, { n: ok }));
  if (failed) window.toastr?.warning(fill(T.sFillFail, { n: failed }));
}
// 방향: destinations. Silent (never sent; the guard watches for rushing ahead), hint ("moving slowly") or push (a small step now and then)
const modeOf = (v) => ({ hint: v === 'hint', push: v === 'push' });
const modeName = (g) => (g.push ? T.gPush : g.hint ? T.gHint : T.gNone);
// v0.25: a direction card — three steps (far · getting closer · almost there) that fill as replies show its words or as
// nudges go; the step that is new since the card was last seen grows in once. Below, the numbers it stands on.
function goalCard(g, i) {
  const s = st(), seen = (s.gseen ||= {}), was = seen[g.v], step = g.step ?? (g.near ? 2 : 0), grow = was != null && step > was;
  if (was !== step) { seen[g.v] = step; save(); }
  const facts = [g.since != null ? fill(T.gSince, { n: g.since }) : '', g.pushes ? fill(T.gPushes, { n: g.pushes }) + (g.lastPush != null ? ` (${fill(T.gLast, { i: g.lastPush })})` : '') : '', g.hits ? fill(T.gHits, { n: g.hits }) + (g.lastHit != null ? ` (${fill(T.gLast, { i: g.lastHit })})` : '') : ''].filter(Boolean).map((t) => `<span>${h(t)}</span>`).join('');
  return `<div class="mbd-item mbd-goal s${step}${g.near ? ' mbd-near' : ''}${grow ? ' grow' : ''}"><span>${g.who ? `<b>${h(g.who)}</b> · ` : ''}${h(g.v)}
    <div class="mbd-gtrack" title="${h(T.gSteps[step])}">${[0, 1, 2].map((k) => `<i class="${k <= step ? 'on' : ''}${k === step && grow ? ' new' : ''}"></i>`).join('')}<em>${h(T.gSteps[step])}</em></div>
    ${facts ? `<small class="mbd-gfacts">${facts}</small>` : ''}${g.near ? `<small class="mbd-nearnote">✨ ${h(T.gNear)}</small>` : ''}</span>
    <div class="mbd-gbtns"><div class="menu_button mbd-gmode${g.push ? ' mbd-on' : ''}" data-gm="${i}"${tipAt('gModeItem')}>${h(modeName(g))}</div><div class="menu_button${g.near ? ' mbd-arrive' : ''}" data-g="${i}"${tipAt('arrived')}>${h(T.arrived)}</div></div></div>`;
}
function tabGoal(body, A, S) {
  const list = S.goals || [];
  body.innerHTML = `<div class="mbd-help">${T.helpGoal}</div>
    ${list.map((g, i) => goalCard(g, i)).join('')}
    <label>${h(T.gV)}${q('gV')}</label><textarea id="mbd_gv" class="text_pole" placeholder="${h(T.gVPh)}"></textarea>
    <label>${h(T.gSigns)}${q('gSigns')}</label><input id="mbd_gs" class="text_pole" placeholder="${h(T.gSignsPh)}" />
    <div class="mbd-row"><label>${h(T.gMode)}</label><select id="mbd_gh" class="text_pole mbd-gsel"><option value="">${h(T.gNone)}</option><option value="hint">${h(T.gHint)}</option><option value="push">${h(T.gPush)}</option></select>${q('gHint')}<div id="mbd_ga" class="menu_button">${h(T.add)}</div></div>`;
  body.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { A.setGoals(list.filter((_, i) => i !== +b.dataset.g)); render(); }));
  // 안 알림 → 살짝 알리기 → 천천히 밀어주기 → 안 알림
  body.querySelectorAll('[data-gm]').forEach((b) => b.addEventListener('click', () => {
    A.setGoals(list.map((g, i) => (i !== +b.dataset.gm ? g : g.push ? { ...g, hint: false, push: false } : g.hint ? { ...g, hint: false, push: true } : { ...g, hint: true, push: false }))); render();
  }));
  document.getElementById('mbd_ga').addEventListener('click', () => {
    const v = document.getElementById('mbd_gv').value.trim(); if (!v) return;
    A.setGoals([...list, { who: '', v, signs: commas(document.getElementById('mbd_gs').value), ...modeOf(document.getElementById('mbd_gh').value) }]); render();
  });
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
function activeRules(again = false) {
  const A = api(), hit = hitRules();
  // on a reroll the reply that slipped is the one being thrown away: say so plainly
  return [...boostLines(), ...allRules().filter((r) => r.mode === 'always' || (r.mode === 'auto' && (hit.has(r.id) || (!A && !r.preset))))
    .map((r) => (r.mode === 'auto' && hit.has(r.id) ? (again ? `The version being rewritten slipped into this (${r.en}) and was thrown away for it. This version must not: ${r.text}` : `The previous reply slipped into this (${r.en}). Watch it in this reply: ${r.text}`) : r.text))];
}

// v0.18.3 지시 = 🎨 문체 (shared, on top) + two tabs underneath: ✍ 이야기 (the order) · 💬 OOC (pressing it turns OOC on)
function tabDirect(body, A, S) {
  const ooc = !!st().ooc;
  body.innerHTML = `<div class="mbd-common${G.common ? ' open' : ''}"><div class="mbd-cl" data-common="1"${tipT(T.commonTip)}><b>${h(T.commonL)}</b><span class="mbd-cnote">${h(T.commonNote)}</span><span class="mbd-sum">${h(styleSum())}</span><i>›</i></div>${G.common ? `<div id="mbd_common" class="mbd-cin${G.freshC ? ' fresh' : ''}"></div>` : ''}</div>
    <div class="mbd-subs mbd-mtabs"><span class="mbd-subt${ooc ? '' : ' on'}" data-mode="story">${h(T.mStory)}</span><span class="mbd-subt${ooc ? ' on ooc' : ''}" data-mode="ooc"${tipT(T.mOocTip)}>${h(T.mOoc)}</span></div>
    <div id="mbd_dir"></div>`;
  body.querySelector('[data-common]').addEventListener('click', () => { G.common = !G.common; G.freshC = G.common; render(); });
  G.freshC = false;
  if (G.common) tabStyle(body.querySelector('#mbd_common'));
  body.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { const want = b.dataset.mode === 'ooc'; if (want !== ooc) setOocOn(want); }));
  const box = body.querySelector('#mbd_dir');
  if (ooc) tabOoc(box); else tabOrder(box, A, S);
}
function tabOoc(body) { body.innerHTML = oocHtml(); body.querySelector('#mbd_oocoff').addEventListener('click', () => setOocOn(false));
    // the question goes into the chat input with "(OOC: …)" around it: sent now, put in as it is, or put in in English
    const qta = body.querySelector('#mbd_oocq'), keepQ = () => { st().oocDraft = qta.value; save(); };
    // ☆ saves what is in the box as a quick question under a title; ★ = already saved; 🗑 deletes (or hides a built-in one)
    const star = body.querySelector('#mbd_qsave'), del = body.querySelector('#mbd_qdel'), row = body.querySelector('#mbd_qsrow'), tin = body.querySelector('#mbd_qstitle');
    const match = () => { const t = qta.value.trim(); return t ? askList().find((x) => x.t === t) : null; };
    const sync = () => { const m = match(); star.classList.toggle('on', !!m?.mine); star.textContent = m?.mine ? '★' : '☆'; star.dataset.mbdtip = m?.mine ? T.qSavedTip : T.qSaveTip; del.hidden = !m; del.dataset.mbdtip = m?.mine ? T.delTip : T.hideTip; };
    qta.addEventListener('input', () => { keepQ(); sync(); }); sync();
    body.querySelector('#mbd_qa').addEventListener('change', (e) => { const v = e.target.value; if (!v) return;
      if (v === 'back') { delete rset().hid.ask; saveSet(); render(); return; }
      const x = askList().find((y) => y.id === v); if (x) qta.value = x.t; keepQ(); sync(); qta.focus(); e.target.value = ''; });
    star.addEventListener('click', () => { const t = qta.value.trim(); if (!t) { qta.focus(); return; } if (match()?.mine) return; row.hidden = false; tin.value = t.split('\n')[0].slice(0, 24); tin.focus(); tin.select(); });
    const okQ = () => { const t = qta.value.trim(); if (!t) return; const title = (tin.value.trim() || t.slice(0, 24)).slice(0, 24), a = rset().askMine;
      const k = a.findIndex((x) => x.title === title); if (k >= 0) a[k].text = t.slice(0, 600); else a.push({ title, text: t.slice(0, 600) }); saveSet(); window.toastr?.success(fill(T.bsDone, { t: title })); render(); };
    body.querySelector('#mbd_qsok').addEventListener('click', okQ);
    tin.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); okQ(); } if (e.key === 'Escape') row.hidden = true; });
    del.addEventListener('click', () => { const m = match(); if (!m) return; const [t, k] = m.id.split(':');
      if (t === 'm') rset().askMine.splice(+k, 1); else hid('ask')[k] = true;
      saveSet(); window.toastr?.info(fill(m.mine ? T.fGone : T.fHidden, { t: m.n.replace(/^✎ /, '') })); render(); });
    body.querySelectorAll('[data-oq]').forEach((b) => b.addEventListener('click', async () => {
      const q = body.querySelector('#mbd_oocq').value.trim(); if (!q) return;
      let t = q;
      if (b.dataset.oq === 'en') { b.classList.add('busy'); t = await toEn(q); b.classList.remove('busy'); }
      if (putInput(oocWrap(t), b.dataset.oq === 'send')) { qta.value = ''; keepQ(); }
    }));
    pickWire(body);
    body.querySelector('[data-oevery]')?.addEventListener('click', () => { const R0 = rset(); R0.oocEvery = R0.oocEvery === false; saveSet(); putOoc(true); render(); });
    body.querySelector('#mbd_oochide').addEventListener('change', (e) => { rset().oocHide = !!e.target.checked; saveSet(); });
  }
// v0.17.1 🎨 문체 — everything that goes with every reply, in one place. Quick sets pick several at once.
const SETS = [['plain', {}], ['talk', { reach: 'upto', boost: ['talk', 'voice', 'memory'] }], ['movie', { boost: ['pace', 'sense', 'hook', 'twist'] }],
  ['novel', { len: 'long', boost: ['subtext', 'sense', 'breath', 'foreshadow'] }], ['drama', { boost: ['conflict', 'spark', 'hook', 'npc'] }], ['quick', { len: 'short', boost: ['pace', 'humor'] }]];

const pickNow = () => ({ reach: curId('reach'), pov: curId('pov'), len: curId('len'), boost: itemsOf('boost').filter((x) => chipOn('boost', x.id)).map((x) => x.id).sort() });
const setKey = (x) => JSON.stringify({ reach: x.reach || 'auto', pov: x.pov || 'auto', len: x.len || 'auto', boost: (Array.isArray(x.boost) ? x.boost : Object.keys(x.boost || {}).filter((k) => x.boost[k])).slice().sort() });
function applySet(id) {
  const R0 = rset();
  const x = id.startsWith('m') ? (R0.setsMine || [])[+id.slice(1)] : (SETS.find(([k]) => k === id) || SETS[0])[1]; if (!x) return;
  const b = Array.isArray(x.boost) ? x.boost : Object.keys(x.boost || {}).filter((k) => x.boost[k]);
  R0.reach = x.reach && x.reach !== 'custom' ? x.reach : 'auto'; R0.pov = x.pov && x.pov !== 'custom' ? x.pov : 'auto'; R0.len = x.len && x.len !== 'custom' ? x.len : 'auto';
  R0.boost = Object.fromEntries(b.map((k) => [k, true]));
}
function setNow() {
  const now = setKey(pickNow()), R0 = rset();
  const mi = (R0.setsMine || []).findIndex((x) => setKey(x) === now);
  if (mi >= 0) return `m${mi}`;
  const hit = SETS.find(([k, x]) => !hid('set')[k] && setKey(x) === now);
  return hit ? hit[0] : '';
}
const setName = (id) => findItem('set', id)?.n || '';
function styleSum() { const k = setNow(); return k && k !== 'plain' ? setName(k) : everySum(); }
function tabStyle(body) {
  const cur = setNow(), open = G.pk === 'set';
  const setRow = `<div class="mbd-prow"><span class="mbd-plab">${h(T.setsL)}</span><span class="mbd-pk${open ? ' open' : ''}${cur && cur !== 'plain' ? ' set' : ''}" data-pk="set"${tipT(T.setsTip)}>${h(cur ? setName(cur) : T.setMix)}<i>▾</i></span></div>${open ? trayHtml('set', 'set') : ''}`;
  body.innerHTML = `<div class="mbd-picks">${setRow}${optPick('reach', 'kReach')}${optPick('pov', 'kPov')}${lenPick()}${chipPick('boost', T.kBoost)}</div>`;
  pickWire(body);
}
function tabRules(body) {
  const R = rset(), hit = hitRules(), rules = allRules(), mine = rules.filter((r) => !r.preset), pre = rules.filter((r) => r.preset);
  // v0.25: the replies where each habit showed, kept per chat (the last 20); a hit on a reply not seen before pings once
  const s = st(), log = (s.rhits ||= {}), li = lastAiIdx(), fresh = new Set();
  for (const id of hit) { const a = (log[id] ||= []); if (li >= 0 && !a.includes(li)) { a.push(li); fresh.add(id); if (a.length > 20) a.shift(); } }
  if (fresh.size) save();
  const n = (id) => (log[id] || []).filter((i) => i <= li).length;
  const row = (r) => `<div class="mbd-rule${r.mode === 'off' ? ' off' : ''}" title="${h(r.text)}"><span class="mbd-rt" data-re="${h(r.id)}" title="${h(r.text)} · ${h(T.rEdit)}">${h(r.preset ? r.name : r.text)}${hit.has(r.id) ? ` <i class="mbd-hit${fresh.has(r.id) ? ' new' : ''}" title="${h(T.rHit)}">●</i>` : ''}</span>${n(r.id) ? `<small class="mbd-rseen" title="${h(T.rSeenTip)}">${h(fill(T.rSeen, { n: n(r.id) }))}</small>` : ''}
    <b class="mbd-pill m-${r.mode}" data-rm="${h(r.id)}" title="${h(T.rCycle)}">${h(T.rMode[r.mode])}</b>${r.preset ? '' : `<b class="mbd-del" data-rd="${h(r.id)}" title="${h(T.rDel)}">✕</b>`}</div>`;
  body.innerHTML = `<div class="mbd-row"><input id="mbd_rt" class="mbd-in" placeholder="${h(T.rText)}" style="flex:1" /><b id="mbd_ra" class="mbd-btn">${h(T.rAdd)}</b></div>
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
function putAlone(beatText = '', sceneText = '', sceneN = null) {
  const c = ctx(); if (api() || !c.setExtensionPrompt) return;
  const IN_CHAT = c.extension_prompt_types?.IN_CHAT ?? 1;
  const sc = st(), n = sceneN ?? (sc.sceneSent || 0), W = sceneWords(), how = [n > 0 ? W.going : W.start, W.focus].filter(Boolean).join('. ');
  const keep = sc.ooc ? '' : [String(sc.keep || '').trim(), sceneText.trim() ? `This scene: ${sceneText.trim()} — ${how}` : '', reachWords() ? `How far to write: ${reachWords()}` : '', ...activeRules().map((t) => `Style: ${t}`)].filter(Boolean).join('\n');
  if (sc.ooc) beatText = '';
  c.setExtensionPrompt('mbd_keep', keep ? `[Standing instructions]\n${keep}` : '', IN_CHAT, 1);
  c.setExtensionPrompt('mbd_beat', beatText ? `[This reply]\n${beatText}` : '', IN_CHAT, 0);
}

// ---- OOC (v0.15) -------------------------------------------------------------------------------------------------
// The story stops: Meatball's notes and sorting pause (A.setOoc), the 지시창's own pieces stop, and one line goes at the
// very bottom. Instructions written in a preset or a card cannot be taken out; the line tells the AI to ignore them.
// v0.15.3 OOC options: 🌀 what-if (lore and the story's facts are not binding) · 📊 tables and charts · 🎨 HTML/CSS
const OOC_OPT = [
  ['oocIf', '🌀', "This is a what-if: the lorebook, world info, character settings and the story's established facts are not binding here. Follow the user's premise freely, even where it contradicts them; writing a scene for that premise is fine. It does not change the real story"],
  ['oocTable', '📊', 'Where it helps, answer with tables or simple charts (markdown tables, text bar charts)'],
  ['oocNoSpoil', '🙅', 'Do not reveal plans for where the story will go, or anything the characters do not know yet, unless asked'],
  ['oocShort', '✂', 'Keep the answer short and to the point'],
  ['oocKo', '🇰🇷', 'Answer in Korean'],
  ['oocHtml', '🎨', 'Where it helps, lay the answer out visually with self-contained inline HTML and CSS (cards, boxes, colour, layout) that renders in the chat; no scripts'],
];
// quick questions (fill the box; edit before sending)
const OOC_ASK = [['sum', '📝'], ['why', '🔍'], ['next', '💡'], ['inner', '💭'], ['check', '✅'], ['fix', '✍'], ['cast', '👥'], ['rel', '🕸'], ['motive', '🎯'], ['time', '⏳'], ['prompt', '🧪']];
const oocWrap = (t) => (/^\s*\(?\s*OOC\s*:/i.test(t) ? t : `(OOC: ${t})`);
// put text in SillyTavern's own input; send=true presses send. Returns false when there is no input.
function putInput(text, send) {
  const ta = document.getElementById('send_textarea'); if (!ta) return false;
  ta.value = send ? text : [ta.value.trim(), text].filter(Boolean).join('\n'); ta.dispatchEvent(new Event('input', { bubbles: true }));
  if (send) document.getElementById('send_but')?.click(); else { ta.focus(); }
  return true;
}
// Korean → English with Meatball's translation (names kept); waits up to 8 s for it, else the text as written
function toEn(text) {
  const A = api(); if (typeof A?.toEnglish !== 'function') return Promise.resolve(text);
  return new Promise((res) => { let done = false; const fin = (v) => { if (!done) { done = true; res(v); } };
    const now = A.toEnglish(text, () => fin(A.toEnglish(text, () => {})));
    if (!/[가-힣]/.test(now)) fin(now);
    setTimeout(() => { if (!done) { window.toastr?.warning(T.oqEnFail); fin(text); } }, 8000); });
}
function oocLine() {
  // 📏 매 답 picks (how far · POV · length · extras · own lines) go along unless turned off; they win over the "ignore" above
  const R0 = rset(), every = R0.oocEvery !== false ? [reachWords(), ...boostLines()].filter(Boolean) : [];
  const extra = [...itemsOf('oocopt').filter((x) => chipOn('oocopt', x.id) && x.t).map((x) => x.t), ...every];
  return ["[OOC — the story is paused]", "The user is now talking to you out of character, as the AI. Answer the user's question or request directly and plainly, as yourself, not as any character. Ignore every instruction above about how story replies are written: no narration unless asked, no trackers, status blocks or stats, no word counts or reply-length rules, no formatting rules, and no required thinking or reasoning steps, templates or tags. Do not continue the main story. This holds until the user turns OOC off.", ...(extra.length ? ['The user\'s own picks for this, which do apply:'] : []), ...extra.map((t) => `- ${t}`)].join('\n');
}
function putOoc(on) { const c = ctx(); if (!c.setExtensionPrompt) return; c.setExtensionPrompt('mbd_ooc', on ? oocLine() : '', c.extension_prompt_types?.IN_CHAT ?? 1, 0); }
// every message since OOC was turned on is marked, so Meatball never reads it as story (and it can be hidden after)
function markOoc() { const s = st(), c = ctx(), chat = c.chat || []; let n = 0; for (let i = Math.max(0, s.oocFrom ?? chat.length); i < chat.length; i++) { const m = chat[i]; if (!m) continue; m.extra ||= {}; if (!m.extra.mb_ooc) { m.extra.mb_ooc = true; n++; } } if (n) c.saveChat?.(); }
async function setOocOn(on) {
  const s = st(), A = api(), c = ctx();
  if (on) { s.ooc = true; s.oocFrom = (c.chat || []).length; save(); A?.setOoc?.(true); putAlone(); putOoc(true); G.tab = 0; render(); return; }
  markOoc();
  const from = s.oocFrom ?? (c.chat || []).length, to = (c.chat || []).length - 1;
  delete s.ooc; save(); A?.setOoc?.(false); putOoc(false); putAlone();
  if (rset().oocHide !== false && to >= from) {
    try { await c.executeSlashCommandsWithOptions?.(`/hide ${from}-${to}`); window.toastr?.info(fill(T.oocHidden, { n: to - from + 1 })); } catch (e) { console.warn('[meatball-director] hide', e); }
  }
  render();
}
// quick questions: the built-in ones (can be hidden) and the person's own, each with a title
function askList() {
  const R0 = rset(); R0.askMine = (R0.askMine || []).map((x) => (typeof x === 'string' ? { title: x.slice(0, 24), text: x } : x));
  return [...OOC_ASK.filter(([k]) => !hid('ask')[k]).map(([k, ic]) => ({ id: `p:${k}`, n: `${ic} ${T.qa[k]}`, t: T.qa[k + 'Q'] })),
    ...R0.askMine.map((x, i) => ({ id: `m:${i}`, n: `✎ ${x.title}`, t: x.text, mine: true }))];
}
function oocHtml() {
  const R0 = rset(), list = askList(), hd = Object.keys(hid('ask')).filter((k) => hid('ask')[k]).length;
  const asks = `<select id="mbd_qa" class="text_pole mbd-qsel"><option value="">${h(T.oocQuick)}</option>${list.filter((x) => !x.mine).map((x) => `<option value="${x.id}">${h(x.n)}</option>`).join('')}${list.some((x) => x.mine) ? `<optgroup label="${h(T.qMine)}">${list.filter((x) => x.mine).map((x) => `<option value="${x.id}">${h(x.n)}</option>`).join('')}</optgroup>` : ''}${hd ? `<option value="back">${h(fill(T.qBack, { n: hd }))}</option>` : ''}</select>`;
  return `<section class="mbd-card mbd-oocc"><div class="mbd-ch"><b${tipT(`${T.oocBody} ${T.oocNote}`)}>${h(T.oocTitle)}</b><span class="mbd-q2"${tipT(`${T.oocBody} ${T.oocNote}`)}>?</span></div>
    <div class="mbd-qline">${asks}<span class="mbd-star" id="mbd_qsave"${tipT(T.qSaveTip)}>☆</span><span class="mbd-star" id="mbd_qdel" hidden>🗑</span></div>
    <div class="mbd-addrow mbd-bsrow" id="mbd_qsrow" hidden><input id="mbd_qstitle" class="text_pole" maxlength="24" placeholder="${h(T.bsTitlePh)}" /><div id="mbd_qsok" class="menu_button mbd-primary2">${h(T.bsOk)}</div></div>
    <textarea id="mbd_oocq" class="text_pole" placeholder="${h(T.oocAskPh)}">${h(st().oocDraft || '')}</textarea>
    <div class="mbd-acts"><div class="menu_button mbd-primary2" data-oq="send"${tipT(T.oqNote)}>${h(T.oqSend)}</div><div class="menu_button" data-oq="en"${typeof api()?.toEnglish === 'function' ? '' : ' disabled'}${tipT(T.oqNote)}>${h(T.oqEn)}</div><div class="menu_button" data-oq="put"${tipT(T.oqNote)}>${h(T.oqPut)}</div></div>
    <div class="mbd-picks mbd-oopts"><div class="mbd-prow"><span class="mbd-plab">${h(T.oocStyleL)}</span><span class="mbd-sw2${R0.oocEvery !== false ? ' on' : ''}" data-oevery="1"${tipT(T.oocEveryTip)}><i></i>${h(R0.oocEvery !== false ? T.oocEveryOn : T.oocEveryOff)}</span></div>${chipPick('oocopt', T.oocOptL)}</div>
    <div class="mbd-oocend"><label class="checkbox_label mbd-oochide"${tipT(T.oocHide)}><input type="checkbox" id="mbd_oochide"${R0.oocHide !== false ? ' checked' : ''} /> ${h(T.oocHideS)}</label><div id="mbd_oocoff" class="menu_button mbd-primary">${h(T.oocOff)}</div></div></section>`;
}


// ---- generation ------------------------------------------------------------------------------------------------
const QUIET = new Set(['quiet', 'impersonate', 'continue']);
function onStart(type, opts, dryRun) {
  G.apply = false; G.type = '';
  if (dryRun || QUIET.has(type) || opts?.quiet_prompt) { api()?.pieces(null); return; }
  const s = st(), text = String(s.beat || '').trim(), A = api();
  const again = type === 'swipe' || type === 'regenerate';
  if (s.ooc) { G.ooc = true; markOoc(); if (A) A.pieces(null); else putAlone(); putOoc(true); return; }   // OOC: only the OOC line goes
  G.ooc = false;
  G.apply = !!text && (!s.used || (again && s.usedIdx === lastAiIdx()));
  G.type = type || 'normal';
  const S = A ? safeState(A) : {}, back = again && !s.scene.trim() && s.sceneLast?.idx === lastAiIdx() ? s.sceneLast.text : '';
  const sceneText = s.scene.trim() || back, sceneOn = !!sceneText && !(A && !back && (S.lastCut || 0) > (s.sceneGn || 0));
  if (!again && type !== 'continue' && (s.redo || '').trim()) { s.redo = ''; s.redoIdx = -1; save(); }   // a new reply: the reason is done
  const redo = again && (s.redo || '').trim() && s.redoIdx === lastAiIdx() ? s.redo.trim() : '';
  G.sceneOn = sceneOn && type !== 'continue'; G.again = again;
  const sceneN = back ? 0 : Math.max(0, (s.sceneSent || 0) - (again && s.sceneSent ? 1 : 0));
  G.sceneText = sceneOn ? sceneText : '';
  if (A) { pushHabits(); A.pieces({ beat: G.apply ? text : '', scene: sceneOn ? sceneText : '', sceneN, sceneHow: sceneWords(), reach: reachWords(), rules: activeRules(again), redo }); }
  else putAlone([G.apply ? text : '', redo ? `REWRITE — the version before this one was rejected for this; this version must fix it:\n${redo}` : ''].filter(Boolean).join('\n\n'), sceneOn ? sceneText : '', sceneN);
}
function onReceived(id) {
  if (G.ooc) { markOoc(); G.ooc = false; return; }
  if (G.sceneOn && !G.again) {
    const s0 = st(); s0.sceneSent = (s0.sceneSent || 0) + 1;
    // 「한 답으로 끝」: the scene had its reply, the pin comes off (kept aside so a reroll of that reply still gets it)
    if (sceneOnce() && s0.scene.trim()) { s0.sceneLast = { text: s0.scene, idx: lastAiIdx() }; s0.scene = ''; s0.sceneSent = 0; }
    save(); setTimeout(render, 50);
  }
  G.sceneOn = false;
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
  eventSource.on(E.CHAT_CHANGED, () => { G.apply = false; putAlone(); putOoc(!!st().ooc); render(); });
  eventSource.on(E.GENERATION_STARTED, onStart);
  eventSource.on(E.MESSAGE_RECEIVED, onReceived);
  for (const ev of [E.GENERATION_ENDED, E.GENERATION_STOPPED]) eventSource.on(ev, () => { if (!api()) putAlone(''); setTimeout(render, 300); });
  for (const ev of [E.MESSAGE_DELETED, E.MESSAGE_SWIPED, E.MESSAGE_EDITED]) eventSource.on(ev, () => setTimeout(render, 300));
})();
