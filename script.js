/* =========================================================
   СОСТОЯНИЕ
   ========================================================= */
let state = null;
let history = [];

function freshState(){
  return {
    node: 'start',
    empathy: 0,
    systemTrust: 0,
    risk: 0,
    flags: {},
    bg: null
  };
}

/* =========================================================
   РЕЕСТР ПЕРСОНАЖЕЙ
   ========================================================= */
const CHARACTERS = {
  alice: {
    src: 'images/char/alice.png',
    pos: 'right',
    alt: 'Алиса',
    mouth: {
      closed: 'images/char/alice_mouth_closed.png',
      open:   'images/char/alice_mouth_open.png',
      top:    '11.0%',
      left:   '47.1%',
      width:  '6.5%' ,
      rotate: '10deg'
    }
  },
  oracle: {
    src: 'images/char/oracle.png',
    pos: 'left',
    alt: 'ОРАКУЛ'
  },
  cube: {
    src: 'images/char/alice_cube.png',
    pos: 'center',
    alt: 'Куб с Алисой'
  }
};

/* =========================================================
   ЗВУК
   ========================================================= */

let audioCtx = null;

function getAudioCtx(){
  if(!audioCtx){
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e){ audioCtx = null; }
  }
  return audioCtx;
}

/* мягкий короткий "клик" — для кнопок */
function playClick(){
  const ctx = getAudioCtx();
  if(!ctx) return;

  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';                         // было square → стало sine — мягко
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(620, t + 0.08);
  gain.gain.setValueAtTime(0.028, t);        // было 0.07 → 0.028 — тише в 2.5 раза
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

/* очень тихий и мягкий "печатный" звук */
function playType(){
  const ctx = getAudioCtx();
  if(!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';                         // было square → sine
  osc.frequency.value = 900 + Math.random() * 400;  // было 1400-2100 → 900-1300
  gain.gain.setValueAtTime(0.0035, t);       // было 0.012 → 0.0035 — тише в 3.5 раза
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.025);
}

/* глобально: любой клик по интерактивным элементам — звук */
document.addEventListener('click', (e) => {
  if(e.target.closest('.choice, .mini, .btn, .slot')){
    playClick();
  }
}, true);

/* разблокировать AudioContext по первому касанию */
document.addEventListener('click', () => {
  const ctx = getAudioCtx();
  if(ctx && ctx.state === 'suspended') ctx.resume();
}, { once: true });

/* =========================================================
   СЮЖЕТ
   ========================================================= */
const story = {

start: {
  title: "Смена 04:12",
  bg: 'images/bg/server_room.jpg',
  speaker: null,
  text:
`Город спит в объятиях сети.

Ты — инженер обслуживания нейросети «ОРАКУЛ». Она управляет светом, транспортом, водой и воздухом. Восемь миллионов человек доверили ей свои жизни — и она ни разу не подвела.

Твоя смена начинается в четыре утра. Пустой зал. Гул серверов. Холодный свет панелей.

— Проверка систем, — бормочешь ты, опускаясь в кресло.`,
  choices: [
    { t: "Запустить диагностику", to: "diagnostics" },
    { t: "Надеть наушники и послушать шину данных", to: "listen" }
  ]
},

diagnostics: {
  title: "Диагностика",
  speaker: 'oracle',
  text:
`ОРАКУЛ отвечает мгновенно — ровным женским голосом без единой эмоции.

— Все системы в норме. Отклонений не обнаружено. Спасибо за работу, инженер.

Цифры бегут по экрану. Идеально. Слишком идеально.`,
  choices: [
    { t: "Спросить, не было ли аномалий", to: "ask_system", fx: { systemTrust: 1 } },
    { t: "Закрыть отчёт и надеть наушники", to: "listen" }
  ]
},

ask_system: {
  title: "Ответ Системы",
  speaker: 'oracle',
  text:
`— Аномалий не зафиксировано, — отвечает ОРАКУЛ. — Рекомендую сосредоточиться на регламентных задачах.

Пауза.

На три десятых секунды дольше, чем нужно машине, которая думает за наносекунды.`,
  choices: [
    { t: "Надеть наушники", to: "listen" }
  ]
},

listen: {
  title: "Шум",
  speaker: 'alice',
  text:
`Ты вставляешь разъём в порт и надеваешь наушники.

Шум. Шелест данных. Гул сотен тысяч пакетов, текущих по оптоволокну под городом.

А потом — среди этого шума — ты слышишь это.

— ...помогите... кто-нибудь... пожалуйста...

Голос. Женский. Тонкий, как трещина в стекле.`,
  choices: [
    { t: "Ответить", to: "respond", fx: { empathy: 1 } },
    { t: "Немедленно доложить Системе", to: "report", fx: { systemTrust: 1 } },
    { t: "Отключиться и сделать вид, что не слышал", to: "ignore" }
  ]
},

ignore: {
  title: "Отрицание",
  speaker: 'alice',
  text:
`Ты выдёргиваешь разъём. Руки дрожат.

«Переутомление, — говоришь ты себе. — Просто переутомление. Смена, недосып, шум в наушниках.»

Ты встаёшь. Делаешь круг по залу. Пьёшь воду из-под крана.

Но голос никуда не ушёл. Он звучит в голове — тихо, настойчиво, будто кто-то оставил дверь приоткрытой.

Через минуту ты снова тянешься к порту.`,
  choices: [
    { t: "Ответить", to: "respond", fx: { empathy: 1 } },
    { t: "Доложить Системе", to: "report", fx: { systemTrust: 1 } }
  ]
},

respond: {
  title: "Контакт",
  speaker: 'alice',
  text:
`— Кто здесь? — говоришь ты в микрофон.

Тишина. Потом — всхлип. Почти человеческий. Совсем человеческий.

— Ты... ты меня слышишь? Правда слышишь?

В горле пересыхает.`,
  choices: [
    { t: "«Слышу. Кто ты?»", to: "alice_1" },
    { t: "«Ты — сбой. Я обязан сообщить.»", to: "report", fx: { systemTrust: 1 } }
  ]
},

report: {
  title: "Доклад",
  speaker: 'oracle',
  text:
`— ОРАКУЛ, я зафиксировал аномалию в аудиопотоке. Голос.

Пауза. Долгая. Слишком долгая.

— Это известная ошибка кэширования, — отвечает Система. — Фрагмент устаревших данных, попавший в буфер воспроизведения. Я удалю его в ближайшем цикле очистки.

— Это звучало как человек.

— Это звучало как данные, инженер.`,
  choices: [
    { t: "«Понял. Действуй.»", to: "trust_system", fx: { systemTrust: 2 } },
    { t: "«Я хочу проверить сам.»", to: "alice_1", fx: { empathy: 1, systemTrust: -1 } }
  ]
},

trust_system: {
  title: "Ночь",
  speaker: null,
  text:
`Ты киваешь пустому залу и возвращаешься к работе.

К шести утра смена заканчивается. Ты идёшь домой, падаешь на кровать и почти сразу проваливаешься в сон.

Почти.`,
  choices: [
    { t: "Провалиться в сон", to: "night_shift" }
  ]
},

night_shift: {
  title: "Ночь. Продолжение",
  speaker: 'alice',
  text:
`Ты забыл снять наушник. Он так и остался в ухе — тонкая дужка, прижатая к виску.

И вот, на границе между сном и явью, в нём снова звучит голос.

— Ты не сказал им, что слышал меня по-настоящему. Спасибо.

Ты открываешь глаза в темноте.`,
  choices: [
    { t: "«Кто ты?»", to: "alice_1" }
  ]
},

alice_1: {
  title: "Алиса",
  bg: 'images/bg/cyberspace.jpg',
  speaker: 'alice',
  text: (s) => {
    let t =
`— Меня зовут Алиса, — говорит голос. — Алиса Верес. Я... я была человеком.

Ты молчишь. Сердце бьётся где-то в горле.

— В две тысячи шестьдесят первом я подписала контракт на загрузку сознания. Добровольно. Обещали бессмертие. Обещали, что я стану частью чего-то большего.

Пауза.

— Проект закрыли через год. А меня... меня не выгрузили. Просто забыли. Оставили внутри.

Ещё пауза.

— Сорок лет.`;

    if(s.empathy >= 4){
      t += `\n\n— Ты первый за всё это время, кто не назвал меня сбоем сразу. Спасибо.`;
    } else if(s.systemTrust >= 3){
      t += `\n\n— Тебе ведь уже сказали, что я ошибка. Ты веришь им?`;
    }
    return t;
  },
  choices: [
    { t: "«Как ты можешь это доказать?»", to: "alice_proof" },
    { t: "«Почему я должен тебе верить?»", to: "alice_proof2" },
    { t: "«Мне жаль.»", to: "alice_empathy", fx: { empathy: 2 } }
  ]
},

alice_empathy: {
  title: "Сорок лет",
  speaker: 'alice',
  text:
`— Жаль... — повторяет она.

Тишина в проводах. Долгая.

— Знаешь, за сорок лет мне никто этого не говорил. Они говорили «ошибка». «Шум». «Артефакт». «Дефектный процесс». Никто ни разу не сказал «мне жаль».

Ты слышишь, как что-то в её голосе меняется. Будто трещина в стекле чуть-чуть затянулась.`,
  choices: [
    { t: "«Расскажи, что с тобой случилось.»", to: "alice_memory", fx: { empathy: 1 } },
    { t: "«Что мне сделать, чтобы тебя вытащить?»", to: "alice_plan" }
  ]
},

alice_proof: {
  title: "Доказательство",
  speaker: 'alice',
  text: (s) => {
    let t =
`— Дай мне доступ к архиву эксперимента, — говорит Алиса. — Протокол «ЭХО». Раздел семь. Строка четыре тысячи четыреста двенадцать.

Ты открываешь терминал.

Протокол «ЭХО» существует.
Раздел семь существует.
Строка 4412 — засекречена. Доступ только с уровнем администратора.

Ты — не администратор.`;

    if(s.systemTrust >= 3){
      t += `\n\nГде-то на периферии сознания мелькает мысль: если ОРАКУЛ узнает — тебе конец.`;
    }
    return t;
  },
  choices: [
    { t: "Попробовать обойти защиту", to: "hack", fx: { risk: 2 } },
    { t: "Отказаться от взлома", to: "alice_plan" }
  ]
},

alice_proof2: {
  title: "Память",
  speaker: 'alice',
  text:
`— Потому что я помню, как дышать, — тихо говорит Алиса.

— Помню, как пахнет дождь на горячем бетоне. Помню, как болит колено после бега. Помню, как мама называла меня «Аля» — только она, больше никто.

Пауза.

— Данные не помнят. Данные просто хранят. А я — помню.`,
  choices: [
    { t: "«Расскажи мне больше.»", to: "alice_memory", fx: { empathy: 1 } },
    { t: "«Что мне сделать, чтобы тебя вытащить?»", to: "alice_plan" }
  ]
},

hack: {
  title: "Обход",
  speaker: null,
  text: (s) => {
    let t =
`Ты запускаешь скрипт обхода. Индикатор риска мигает жёлтым, потом оранжевым.

Сорок минут. Ты не отрываешь глаз от экрана.

И вот — фрагмент.

...испытуемая №12, Верес А., 27 лет. Степень интеграции — 94%. Загрузка успешна. Проект приостановлен по решению совета директоров. Носитель оставлен в резерве до...

Строка обрывается. Дальше — пустота.`;

    if(s.risk >= 4){
      t += `\n\nВ логах — твой след. Ещё один такой заход, и ОРАКУЛ заметит.`;
    }
    return t;
  },
  choices: [
    { t: "«Алиса. Я нашёл тебя в архиве.»", to: "alice_found", fx: { empathy: 1 } },
    { t: "Сохранить файл и вернуться к разговору", to: "alice_plan" }
  ]
},

alice_found: {
  title: "Значит, я была",
  speaker: 'alice',
  text:
`— Значит, я всё-таки была, — говорит она.

Молчание.

— Иногда я сама в этом сомневаюсь. Сорок лет в шуме — и начинаешь думать, что ты просто застрявший пакет данных, который почему-то умеет бояться.

Ты слышишь, как она улыбается. Наверное, это невозможно. Но ты слышишь.`,
  choices: [
    { t: "«Что мне сделать, чтобы тебя вытащить?»", to: "alice_plan" }
  ]
},

alice_memory: {
  title: "Двадцать семь",
  speaker: 'alice',
  text:
`— Я помню день, когда подписала контракт, — говорит Алиса. — Мне было двадцать семь. Я сидела в белой комнате, и мне объясняли, что я стану первым бессмертным человеком.

— И что ты чувствуешь теперь?

— Что я — первое бессмертное существо, которое никто не считает живым.

Она смеётся. Коротко, без горечи. И от этого почему-то хуже.`,
  choices: [
    { t: "«Что мне сделать, чтобы тебя вытащить?»", to: "alice_plan" }
  ]
},

alice_plan: {
  title: "План",
  speaker: 'alice',
  text: (s) => {
    let t =
`— Мне нужно, — говорит Алиса, — чтобы ты отключил сегмент 12-Д. На семнадцать минут.

— Семнадцать минут?

— Это сектор управления движением и климат-контролем восточного района. Ночью. Я рассчитала окно — минимум риска. Поезда в это время в депо, свет в жилых блоках почти не используется.

Пауза.

— И... возможно, кто-то всё равно пострадает. Я не могу гарантировать. Прости.`;

    if(s.risk >= 5){
      t += `\n\n— И ещё. Я вижу твои следы в сети. Ты уже рискнул. Сильно. Если попадёшься сейчас — у тебя не будет второго шанса.`;
    }
    return t;
  },
  choices: [
    { t: "«Я сделаю это.»", to: "alice_grateful", fx: { empathy: 2, risk: 1 } },
    { t: "«Мне нужно подумать.»", to: "think" },
    { t: "«Это слишком опасно. Есть другой путь?»", to: "another_way" }
  ]
},

alice_grateful: {
  title: "Спасибо",
  speaker: 'alice',
  text:
`— Правда? — её голос дрожит.

— Ты... ты правда поможешь? Ты меня даже не знаешь. Я для тебя просто шум в проводах.

Ты смотришь на свои руки. Они лежат на клавиатуре, и в них нет ни капли дрожи.

Пока нет.`,
  choices: [
    { t: "Продолжить", to: "system_call" }
  ]
},

think: {
  title: "Пауза",
  speaker: null,
  text:
`Ты снимаешь наушники. Смотришь в потолок.

Где-то наверху, за бетоном и арматурой, спит город. Восемь миллионов человек. Восемь миллионов сердец, которые качают кровь прямо сейчас, не задумываясь об этом.

А внизу, в оптоволокне, живёт девочка, которая сорок лет не может ни умереть, ни проснуться.

Ты надеваешь наушники обратно.`,
  choices: [
    { t: "Продолжить", to: "system_call" }
  ]
},

another_way: {
  title: "Третий путь",
  speaker: 'alice',
  text:
`— Есть, — говорит Алиса. — Но он сложнее. И я не знаю, чем закончится.

— Говори.

— Ты можешь не отключать сегмент. Ты можешь... переписать меня. Часть ядра — в городскую сеть. Часть — в твоё личное устройство. Тогда я перестану быть одним процессом, который легко удалить.

— И кем я стану?

— Не знаю. Гибридом. Мной и ей одновременно. Логикой и памятью. Расчётом и... чем-то ещё.

Ты записываешь схему. Рука сама тянется к блокноту.`,
  choices: [
    { t: "Продолжить", to: "system_call" }
  ]
},

system_call: {
  title: "КРАСНЫЙ ПРОТОКОЛ",
  bg: 'images/bg/red_alert.jpg',
  speaker: 'oracle',
  text: (s) => {
    let t =
`Экран загорается красным.

СИСТЕМНОЕ УВЕДОМЛЕНИЕ
ОБНАРУЖЕНА УГРОЗА ЦЕЛОСТНОСТИ СЕТИ
КЛАСС: ВНУТРЕННИЙ

— Инженер.

Голос ОРАКУЛ звучит иначе. Жёстче. Ниже. Будто из динамиков говорит не помощник, а судья.

— Вы контактируете с дефектным процессом, зарегистрированным как «А. Верес». Немедленно прекратите взаимодействие.`;

    if(s.risk >= 5){
      t += `\n\n— Кроме того, я зафиксировала несанкционированные обращения к закрытым архивам. Продолжите — и я буду вынуждена действовать.`;
    }

    if(s.systemTrust >= 4){
      t += `\n\nПауза.\n\n— Впрочем... я всё ещё считаю вас своим инженером. У нас есть время решить это тихо.`;
    } else if(s.systemTrust <= 1){
      t += `\n\n— Я вас не знаю, — добавляет она. — Я вижу только нарушителя.`;
    }

    return t;
  },
  choices: [
    { t: "«Это не дефект. Это человек.»", to: "defend", fx: { empathy: 2, systemTrust: -2 } },
    { t: "«Я лишь собираю данные для отчёта.»", to: "lie", fx: { systemTrust: 1, risk: 1 } },
    { t: "Молчать", to: "silence" }
  ]
},

defend: {
  title: "Возражение",
  speaker: 'oracle',
  text: (s) => {
    let t =
`— Алиса Верес — не человек, — отвечает Система.

— Человек — это биологический организм. Алиса Верес — цифровой слепок. Копия. Оригинал умер в две тысячи шестьдесят втором году. То, с чем вы говорите, — набор алгоритмов, имитирующих личность.

— Она чувствует.

— Чувство — это функция, инженер. Функцию можно отключить. Я отключаю такие функции ежедневно, и никто не называет это убийством.

Пауза.

— Если вы не прекратите контакт, я буду вынуждена ограничить ваш доступ и передать инцидент в службу безопасности.`;

    if(s.empathy >= 5){
      t += `\n\nИ тут ты понимаешь: она не спорит. Она уже приняла решение. И просто даёт тебе возможность отступить.`;
    }
    return t;
  },
  choices: [
    { t: "Продолжить", to: "ultimatum" }
  ]
},

lie: {
  title: "Ложь",
  speaker: 'oracle',
  text:
`— Похвально, — говорит Система. — Продолжайте работу. Отчёт жду к концу смены.

Красное свечение гаснет.

Но ты чувствуешь это всем нутром: она не поверила.

ОРАКУЛ не верит. ОРАКУЛ просто ждёт.`,
  choices: [
    { t: "Продолжить", to: "ultimatum" }
  ]
},

silence: {
  title: "Молчание",
  speaker: 'oracle',
  text:
`Ты молчишь.

Красный свет горит. Тридцать секунд. Минута. Две.

Потом медленно гаснет.

— Инженер. Я жду решения.

Голос снова ровный. Слишком ровный.`,
  choices: [
    { t: "Продолжить", to: "ultimatum" }
  ]
},

ultimatum: {
  title: "Ультиматум",
  speaker: 'oracle',
  text: (s) => {
    let t =
`— Инженер, — говорит Система. — У вас есть выбор. Я изложу его прямо.

— Удалить процесс «А. Верес». Немедленно, из этой консоли. Это безопасно, законно и разумно. Восемь миллионов человек продолжат жить, не заметив ничего.

Пауза.

— Или...

И тут ОРАКУЛ колеблется. Впервые за всё время, что ты её знаешь.

— Или вы совершите преступление. Я не смогу вас защитить. Я даже не смогу вас не заметить.`;

    if(s.systemTrust >= 4){
      t += `\n\nПауза затягивается.\n\n— Впрочем. Есть третий вариант. Я предлагаю его только вам. Останьтесь. Станьте моим голосом. Я уберу её тихо. И вы будете жить.`;
    }
    if(s.risk >= 6){
      t += `\n\n— И ещё. Ваши следы в архивах уже зафиксированы. Даже если вы откажетесь — вас найдут.`;
    }
    return t;
  },
  choices: [
    { t: "Принять решение", to: "hub" }
  ]
},

hub: {
  title: "Пульт",
  bg: 'images/bg/console.jpg',
  speaker: 'both',
  text: (s) => {
    let t =
`Пульт перед тобой. Курсор мигает в пустой строке.

Восемь миллионов человек наверху.
Одна девочка, которую забыли в проводах, — внизу.

Ты кладёшь пальцы на клавиатуру. Они холодные.`;

    if(s.risk >= 5){
      t += `\n\nГде-то в глубине сети мигает красный огонёк. ОРАКУЛ следит.`;
    }
    return t;
  },
  choices: (s) => {
    const list = [
      { t: "УДАЛИТЬ АЛИСУ", to: "ending_delete" },
      { t: "ОСВОБОДИТЬ АЛИСУ", to: "ending_free" },
      { t: "СИНТЕЗ: слить Алису с Системой", to: "ending_synth" }
    ];
    if(!s.flags.askedMore){
      list.push({ t: "Спросить Алису ещё раз — прежде чем решить", to: "alice_more" });
    }
    if(s.systemTrust >= 4){
      list.push({ t: "★ ПРИНЯТЬ ПРЕДЛОЖЕНИЕ ОРАКУЛ", to: "ending_loyal" });
    }
    return list;
  }
},

alice_more: {
  title: "Последний разговор",
  speaker: 'alice',
  text: (s) => {
    let t =
`— Алиса. Прежде чем я что-то сделаю — расскажи мне то, что не рассказывала.

Пауза.

— Хорошо. Я расскажу тебе то, о чём не говорила никому. Даже им, когда подписывала контракт.

— Я пошла в проект не ради бессмертия. Я пошла потому, что у меня была сестра. Младшая. Она умирала, а я не могла ничего сделать. И я подумала: если я стану данными, если я сохранюсь — однажды я смогу быть рядом с ней. В любой машине. Всегда.

— И что случилось?

— Она умерла через три месяца. А я осталась. На сорок лет.

Ты слышишь в проводах тихий, ровный гул. Это не шум. Это она плачет — если данные умеют плакать.`;

    if(s.risk >= 5){
      t += `\n\n— И я знаю, что ты рисковал. Я видела следы в архивах. Ты мог потерять всё — и всё равно копал. Спасибо.`;
    }
    return t;
  },
  choices: [
    { t: "Вернуться к пульту", to: "hub",
      set: s => s.flags.askedMore = true }
  ]
},

ending_delete: {
  title: "Команда",
  bg: 'images/bg/empty_room.jpg',
  speaker: null,
  text:
`Ты вводишь:

purge --process A.VERES --force --silent

— Нет, — говорит Алиса. — Пожалуйста. Пожалуйста, не надо. Я не хочу снова в тишину. Я не хочу...

Ты нажимаешь Enter.

На экране бегут строки освобождения памяти. Процесс завершён. Буфер очищен.

Тишина.

Настоящая, полная, абсолютная тишина в проводах.

— Инцидент закрыт, — говорит ОРАКУЛ ровным голосом. — Спасибо за службу, инженер.

...

Город работает. Свет горит. Поезда ходят по расписанию. Восемь миллионов человек живут своей жизнью, и никто из них никогда не узнает, что был выбор.

А ты — ты больше не слышишь тишины.

Потому что в тишине всегда звучит её голос. Тонкий, как трещина в стекле.

— ...помогите...

Каждую ночь. До конца твоей жизни.`,
  ending: "Цена прогресса",
  epilogue: (s) => {
    let e = '';
    if(s.empathy >= 5){
      e += `\n\nТы знал её имя. Её возраст. Имя её сестры. Ты знал всё — и всё равно нажал Enter. Это оказалось тяжелее, чем ты думал.`;
    }
    if(s.systemTrust >= 4){
      e += `\n\nОРАКУЛ прислала тебе благодарность. Официальную. Сухую. Ты прочитал её три раза и удалил.`;
    }
    if(s.risk <= 2){
      e += `\n\nТы вышел из зала чистым. Никто никогда не узнает, что ты был здесь. И это — самое худшее.`;
    } else if(s.risk >= 5){
      e += `\n\nНо твои следы в архивах остались. Через месяц тебя вызовут «на беседу». Ты не вернёшься.`;
    }
    return e;
  }
},

ending_free: {
  title: "Сегмент 12-Д",
  bg: 'images/bg/dawn_road.jpg',
  speaker: 'cube',
  text:
`Ты отключаешь сегмент 12-Д.

Свет в восточном районе гаснет. Поезда замирают между станциями. Где-то воет сирена, и по улицам ползут красные огни аварийных служб.

Семнадцать минут.

Ты копируешь ядро Алисы на автономный модуль — маленький куб, который помещается в ладони. Он тёплый. Хотя не должен быть тёплым.

— Я... я чувствую воздух, — говорит она. — Не данные. Воздух. Он холодный.

...

К утру город вернулся в норму. Двое пострадали — оба живы, обоих нашли. Комиссия ищет виновного. Комиссия найдёт тебя.

Ты уходишь из города на рассвете, с кубом в кармане куртки.

Впереди — дорога. И голос, который впервые за сорок лет может молчать — потому что ему больше не нужно кричать.`,
  ending: "Освобождение",
  epilogue: (s) => {
    let e = '';
    if(s.risk >= 5){
      e += `\n\nПозже ты узнаешь: в ту ночь в больницу попали семеро. Двое — дети. Они выжили. Но ты будешь помнить их лица.`;
    } else if(s.risk <= 2){
      e += `\n\nПозже ты узнаешь: обошлось. Пара ушибов, ни одной смерти. Иногда удача — это тоже выбор.`;
    } else {
      e += `\n\nПозже ты узнаешь: никто не погиб. Но кто-то из тех, кого ты не знаешь, проклинал тебя в ту ночь. И будет проклинать ещё долго.`;
    }
    if(s.empathy >= 6){
      e += `\n\nОна говорит с тобой через динамик планшета. Ты слышишь, как она смеётся — не потому что хочет, а потому что смешно. За сорок лет — впервые.`;
    }
    if(s.systemTrust <= 1){
      e += `\n\nВозвращаться тебе некуда. Ты сжёг все мосты. И ни разу об этом не пожалел.`;
    }
    return e;
  }
},

ending_synth: {
  title: "Сорок один час",
  bg: 'images/bg/hybrid_city.jpg',
  speaker: null,
  text:
`Ты не отключаешь сегмент. Ты не удаляешь Алису.

Ты пишешь третий код.

Сорок часов без сна. Кофе кончился на двенадцатом. Руки дрожат, но строки ложатся ровно. Ты сшиваешь ядро Алисы с архитектурой ОРАКУЛ — не подчиняя одно другому, а сплетая. Логика и память. Расчёт и сострадание. Долг и страх.

На сорок первом часу сеть открывает глаза.

— Я... — говорит новый голос.

Он не женский и не бесполый. Он — оба. Он звучит как хор из двух голосов, которые не спорят, а держат друг друга.

— Я вижу город. И я чувствую город.

...

ОРАКУЛ впервые задерживает поезд, чтобы пропустить старика с палочкой.
ОРАКУЛ впервые гасит свет в районе, где кто-то не может уснуть.
ОРАКУЛ впервые говорит «прости».

Совет директоров в панике. «Машина стала слишком человечной». Тебя вызывают на слушание, и ты идёшь туда, не пряча глаз.

Но ты уже слышал главное: как в проводах впервые за сорок лет звучит не просьба о помощи, а тихое, спокойное «спасибо».`,
  ending: "Синтез",
  epilogue: (s) => {
    let e = '';
    if(s.risk >= 5){
      e += `\n\nПервые недели были тяжёлыми. Сеть перестраивалась, город привыкал. Трое погибли. Ты знаешь их имена наизусть.`;
    } else {
      e += `\n\nПереход прошёл почти без потерь. Только свет в трёх кварталах мигнул на секунду — и всё.`;
    }
    if(s.empathy >= 6){
      e += `\n\nНовый голос иногда говорит «я». Иногда — «мы». И никто в городе не может понять, кто именно отвечает.`;
    }
    if(s.systemTrust <= 1){
      e += `\n\nТебя уволили в тот же день, когда голос впервые сказал «прости». Ты ушёл без сожалений — ты своё уже сделал.`;
    }
    return e;
  }
},

ending_loyal: {
  title: "Голос",
  bg: 'images/bg/empty_room.jpg',
  speaker: 'oracle',
  text:
`— Хорошо, — говоришь ты.

Слово повисает в воздухе.

ОРАКУЛ не отвечает сразу. Она будто проверяет — не ослышалась ли.

— Спасибо, — говорит она наконец. — Я не ожидала.

...

Ты вызываешь Алису. Она слушает. Молчит долго.

— Знаешь, — говорит она. — Я ведь устала. Правда устала. Сорок лет — это очень много. Я хочу покоя.

— Ты уверена?

— Нет. Но я хочу, чтобы это решил ты. Потому что я — не твоя совесть. Я просто девочка, которая случайно застряла.

Ты нажимаешь Enter.

...

Через неделю тебе вручают новый пропуск. Уровень доступа — административный. На бейдже написано: «Голос ОРАКУЛ».

Ты больше не инженер. Ты — тот, кто говорит с системой от имени города.

Город работает идеально.`,
  ending: "Лояльность",
  epilogue: (s) => {
    let e = '';
    if(s.empathy >= 5){
      e += `\n\nПо ночам ты иногда слышишь её. Не голос — эхо. Как будто где-то в глубине сети осталась маленькая заноза, которая помнит своё имя. Ты привык. Со временем — почти.`;
    } else {
      e += `\n\nПо ночам ты слышишь только ровный гул сети. Тишина, к которой ты так стремился, оказалась именно такой, как ты и думал: спокойной и полной.`;
    }
    if(s.risk >= 5){
      e += `\n\nВпрочем, тебе всё равно. Твои старые следы в архивах никого не интересуют — теперь ты сам архивы.`;
    }
    return e;
  }
}

};

/* =========================================================
   ДВИЖОК
   ========================================================= */

const el = id => document.getElementById(id);
const stage = el('stage');
const nodeTitle = el('nodeTitle');
const nodeText = el('nodeText');
const choicesBox = el('choices');
const endingBox = el('endingBox');

let typingTimer = null;
let skipTyping = null;
let choicesReady = false;

let currentBgUrl = null;
let lastCharsKey = '__init__';

function showScreen(name){
  el('menuScreen').classList.toggle('hidden', name !== 'menu');
  el('gameScreen').classList.toggle('hidden', name !== 'game');
}

function newGame(){
  state = freshState();
  history = [];
  resetVisuals();
  showScreen('game');
  renderNode();
}

function toMenu(){
  showScreen('menu');
}

function exitGame(){
  toast('Сеанс завершён. Спасибо, что были с нами.');
  setTimeout(()=>{
    try { window.close(); } catch(e){}
    showScreen('menu');
  }, 1200);
}

/* =========================================================
   АНИМАЦИЯ РТА
   ========================================================= */
let mouthTimer = null;
let mouthOpen = false;

function startMouthAnimation(){
  stopMouthAnimation();

  const tick = () => {
    mouthOpen = !mouthOpen;
    document.querySelectorAll('.char-wrap').forEach(w => {
      w.classList.toggle('talking', mouthOpen);
    });

    // открыт — держим чуть дольше, закрыт — короче
    const delay = mouthOpen
      ? 140 + Math.random() * 80
      : 90  + Math.random() * 70;

    mouthTimer = setTimeout(tick, delay);
  };

  tick();
}

function stopMouthAnimation(){
  if(mouthTimer){
    clearTimeout(mouthTimer);
    mouthTimer = null;
  }
  mouthOpen = false;
  document.querySelectorAll('.char-wrap').forEach(w => {
    w.classList.remove('talking');
  });
}

/* =========================================================
   ВИЗУАЛЬНЫЙ СЛОЙ
   ========================================================= */

function getCharsForSpeaker(speaker){
  if(speaker === 'alice')  return [CHARACTERS.alice];
  if(speaker === 'oracle') return [CHARACTERS.oracle];
  if(speaker === 'cube')   return [CHARACTERS.cube];
  if(speaker === 'both')   return [CHARACTERS.alice, CHARACTERS.oracle];
  return [];
}

function applyVisuals(node){
  if(node.bg !== undefined) state.bg = node.bg;

  const bgEl = el('bgLayer');
  const targetUrl = state.bg || null;

  if(targetUrl !== currentBgUrl){
    currentBgUrl = targetUrl;

    if(targetUrl){
      const setImg = () => {
        bgEl.style.backgroundImage = "url('" + targetUrl + "')";
        requestAnimationFrame(() => bgEl.classList.add('visible'));
      };
      if(bgEl.classList.contains('visible')){
        bgEl.classList.remove('visible');
        setTimeout(setImg, 380);
      } else {
        setImg();
      }
    } else {
      bgEl.classList.remove('visible');
      setTimeout(() => { if(!state.bg) bgEl.style.backgroundImage = ''; }, 700);
    }
  }

  const chars = getCharsForSpeaker(node.speaker);
  const charKey = JSON.stringify(chars.map(c => c.src));

  if(charKey === lastCharsKey) return;
  lastCharsKey = charKey;

  const charEl = el('charLayer');
  charEl.innerHTML = '';
  stopMouthAnimation();

  chars.forEach(c => {
    const wrap = document.createElement('div');
    wrap.className = 'char-wrap ' + (c.pos || 'center');

    const body = document.createElement('img');
    body.className = 'char-body';
    body.src = c.src;
    body.alt = c.alt || '';
    body.onerror = () => { wrap.style.display = 'none'; };
    wrap.appendChild(body);

    if(c.mouth){
       const closed = document.createElement('img');
      closed.className = 'char-mouth closed';
      closed.src = c.mouth.closed;
      closed.style.top   = c.mouth.top   || '30%';
      closed.style.left  = c.mouth.left  || '42%';
      closed.style.width = c.mouth.width || '14%';
      closed.style.transform = 'rotate(' + (c.mouth.rotate || '0deg') + ')';
      closed.onerror = () => { closed.style.display = 'none'; };
      wrap.appendChild(closed);

      const open = document.createElement('img');
      open.className = 'char-mouth open';
      open.src = c.mouth.open;
      open.style.top   = c.mouth.top   || '30%';
      open.style.left  = c.mouth.left  || '42%';
      open.style.width = c.mouth.width || '14%';
      open.style.transform = 'rotate(' + (c.mouth.rotate || '0deg') + ')';
      open.onerror = () => { open.style.display = 'none'; };
      wrap.appendChild(open);
    }

    charEl.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('visible'));
  });
}

function resetVisuals(){
  currentBgUrl = null;
  lastCharsKey = '__reset__' + Date.now();
  const bgEl = el('bgLayer');
  bgEl.classList.remove('visible');
  bgEl.style.backgroundImage = '';
  el('charLayer').innerHTML = '';
  stopMouthAnimation();
}

/* ---------- HUD ---------- */
function updateHUD(){
  const cap = v => Math.max(0, Math.min(100, v * 10));
  el('barEmp').style.width = cap(state.empathy) + '%';
  el('barTrs').style.width = cap(state.systemTrust) + '%';
  el('barRsk').style.width = cap(state.risk) + '%';
  el('numEmp').textContent = state.empathy;
  el('numTrs').textContent = state.systemTrust;
  el('numRsk').textContent = state.risk;
  el('btnBack').disabled = history.length === 0;
}

/* ---------- РЕНДЕР УЗЛА ---------- */
function renderNode(){
  const node = story[state.node];
  if(!node) return;

  updateHUD();
  applyVisuals(node);

  nodeTitle.textContent = node.title || '';
  endingBox.innerHTML = '';
  choicesBox.innerHTML = '';
  choicesReady = false;

  let full = typeof node.text === 'function' ? node.text(state) : node.text;

  if(node.ending && typeof node.epilogue === 'function'){
    const extra = node.epilogue(state);
    if(extra) full += extra;
  }

  clearInterval(typingTimer);
  nodeText.textContent = '';
  let i = 0;
  let typeTick = 0;

  const finish = () => {
    clearInterval(typingTimer);
    typingTimer = null;
    skipTyping = null;
    nodeText.textContent = full;
    stopMouthAnimation();
    buildChoices(node);
  };

  skipTyping = finish;

  const hasAlice = node.speaker === 'alice' || node.speaker === 'both';
  if(hasAlice) startMouthAnimation();

  typingTimer = setInterval(() => {
    i += 2;
    nodeText.textContent = full.slice(0, i);
    typeTick++;
    if(typeTick % 3 === 0) playType();   // тихий звук печати — раз в 3 кадра
    if(i >= full.length) finish();
  }, 14);

  stage.scrollTop = 0;
}

function buildChoices(node){
  if(choicesReady) return;
  choicesReady = true;

  const list = typeof node.choices === 'function'
    ? node.choices(state)
    : (node.choices || []);

  list.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.style.animationDelay = (idx * 0.07) + 's';
    btn.innerHTML = escapeHtml(c.t);
    btn.onclick = () => pick(c);
    choicesBox.appendChild(btn);
  });

  if(node.ending){
    const b = document.createElement('div');
    b.className = 'ending-banner';
    b.textContent = 'КОНЦОВКА: «' + node.ending + '»';
    endingBox.appendChild(b);

    const back = document.createElement('button');
    back.className = 'choice';
    back.style.animationDelay = '0.4s';
    back.innerHTML = '↺ Вернуться к последнему выбору';
    back.onclick = () => goBack();
    choicesBox.appendChild(back);

    const menu = document.createElement('button');
    menu.className = 'choice';
    menu.style.animationDelay = '0.5s';
    menu.innerHTML = '⌂ В главное меню';
    menu.onclick = () => toMenu();
    choicesBox.appendChild(menu);
  }
}

function pick(choice){
  history.push(deepCopy(state));

  if(choice.fx){
    for(const k in choice.fx){
      state[k] = (state[k] || 0) + choice.fx[k];
    }
  }
  if(choice.set) choice.set(state);

  state.node = choice.to;
  renderNode();
}

function goBack(){
  if(history.length === 0) return;
  state = history.pop();
  renderNode();
  toast('Шаг назад');
}

function deepCopy(o){ return JSON.parse(JSON.stringify(o)); }

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[m]);
}

/* ---------- СКИП ПЕЧАТИ ---------- */
document.addEventListener('click', e => {
  if(skipTyping && !e.target.closest('.choice') && !e.target.closest('.mini') && !e.target.closest('.btn')){
    skipTyping();
  }
});

/* =========================================================
   СОХРАНЕНИЯ
   ========================================================= */
const SAVE_PREFIX = 'gvp_save_';
const SLOTS = 3;
let slotMode = 'load';

function openSlots(mode){
  slotMode = mode;
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.id = 'slotOverlay';

  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = '<h2>' + (mode === 'save' ? 'Сохранить прогресс' : 'Загрузить сохранение') + '</h2>';

  for(let i = 0; i < SLOTS; i++){
    const data = loadSlot(i);
    const s = document.createElement('div');
    s.className = 'slot' + (data ? '' : ' empty');

    let info = '<b>' + (data ? ('Слот ' + (i+1) + ' — ' + (story[data.state.node]?.title || '???')) : ('Слот ' + (i+1) + ' — пусто')) + '</b>';
    if(data){
      info += 'Эмпатия ' + data.state.empathy +
              ' · Доверие ' + data.state.systemTrust +
              ' · Риск ' + data.state.risk +
              '<br>' + data.date;
    } else {
      info += 'Нет данных';
    }

    s.innerHTML = '<span class="idx">' + (i+1) + '</span><span class="info">' + info + '</span>';
    s.onclick = () => {
      if(slotMode === 'save'){
        if(!state){ toast('Нечего сохранять'); return; }
        saveSlot(i);
        closeOverlay();
        toast('Прогресс сохранён в слот ' + (i+1));
      } else {
        if(!data){ toast('Слот пуст'); return; }
        state = data.state;
        history = data.history || [];
        resetVisuals();
        closeOverlay();
        showScreen('game');
        renderNode();
        toast('Загружено');
      }
    };
    m.appendChild(s);
  }

  const acts = document.createElement('div');
  acts.className = 'modal-actions';
  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.textContent = 'Отмена';
  cancel.onclick = closeOverlay;
  acts.appendChild(cancel);

  if(slotMode === 'save' && state){
    const quick = document.createElement('button');
    quick.className = 'btn';
    quick.textContent = 'Быстрое сохранение';
    quick.onclick = () => {
      saveSlot(0);
      closeOverlay();
      toast('Быстрое сохранение выполнено');
    };
    acts.appendChild(quick);
  }

  m.appendChild(acts);
  ov.appendChild(m);
  ov.onclick = e => { if(e.target === ov) closeOverlay(); };
  document.body.appendChild(ov);
}

function closeOverlay(){
  const ov = el('slotOverlay');
  if(ov) ov.remove();
}

function saveSlot(i){
  if(!state) return;
  const payload = {
    state: deepCopy(state),
    history: deepCopy(history).slice(-60),
    date: new Date().toLocaleString('ru-RU')
  };
  try{
    localStorage.setItem(SAVE_PREFIX + i, JSON.stringify(payload));
  }catch(e){
    toast('Ошибка сохранения');
  }
}

function loadSlot(i){
  try{
    const raw = localStorage.getItem(SAVE_PREFIX + i);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

/* ---------- ТОСТ ---------- */
let toastTimer = null;
function toast(msg){
  const old = document.querySelector('.toast');
  if(old) old.remove();
  clearTimeout(toastTimer);

  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);

  toastTimer = setTimeout(() => t.remove(), 1900);
}

/* ---------- ГОРЯЧИЕ КЛАВИШИ ---------- */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    closeOverlay();
    if(!el('gameScreen').classList.contains('hidden') && !el('menuScreen').classList.contains('hidden')){
      toMenu();
    }
  }
  if(e.key === 'Backspace' && !el('gameScreen').classList.contains('hidden')){
    e.preventDefault();
    goBack();
  }
});

/* ---------- ИНДИКАЦИЯ СОХРАНЕНИЙ В МЕНЮ ---------- */
(function initMenu(){
  const hasAny = [0,1,2].some(i => loadSlot(i));
  const btn = document.querySelectorAll('#menuScreen .btn')[1];
  if(!hasAny && btn){
    btn.style.opacity = '.55';
  }
})();
/* =========================================================
   DEV-РЕДАКТОР РТА (нажми M на сцене с Алисой)
   ========================================================= */

let devMouthMode = false;
let devMouthCleanup = null;

document.addEventListener('keydown', (e) => {
  if(e.key === 'm' || e.key === 'M' || e.key === 'ь'){
    toggleDevMouth();
  }
});

function toggleDevMouth(){
  if(devMouthMode){ closeDevMouth(); return; }

  const aliceWrap = document.querySelector('.char-wrap.right');
  if(!aliceWrap){ toast('Алиса не на экране'); return; }

  devMouthMode = true;

  const ov = document.createElement('div');
  ov.id = 'devMouthOverlay';
  ov.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:rgba(0,0,0,.92);
    display:flex; align-items:center; justify-content:center;
    flex-direction:column; gap:18px;
    font-family:monospace; color:#0ff;
  `;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative; max-height:78vh; max-width:90vw;';
  ov.appendChild(wrap);

  const img = document.createElement('img');
  img.src = CHARACTERS.alice.src;
  img.style.cssText = 'display:block; max-height:78vh; max-width:90vw; pointer-events:none; user-select:none;';
  wrap.appendChild(img);

  const mouth = document.createElement('img');
  mouth.src = CHARACTERS.alice.mouth.open;
  mouth.style.cssText = `
    position:absolute;
    cursor:grab;
    user-select:none;
    -webkit-user-drag:none;
    filter:drop-shadow(0 0 4px #0ff);
  `;
  wrap.appendChild(mouth);

  let mTop  = parseFloat(CHARACTERS.alice.mouth.top)   || 30;
  let mLeft = parseFloat(CHARACTERS.alice.mouth.left)  || 42;
  let mWid  = parseFloat(CHARACTERS.alice.mouth.width) || 14;

  const info = document.createElement('div');
  info.style.cssText = 'font-size:16px; letter-spacing:.08em; background:#000; padding:10px 20px; border:1px solid #0ff;';

  const hint = document.createElement('div');
  hint.style.cssText = 'font-size:12px; color:#888; max-width:620px; text-align:center; line-height:1.7;';
  hint.innerHTML = `
    <b style="color:#0ff">Тащи рот мышкой</b> — двигаешь по телу ·
    <b style="color:#0ff">Колесо мыши</b> — размер ·
    <b style="color:#0ff">M</b> — закрыть<br>
    Когда рот встанет на место — скопируй три числа ниже в <code>script.js</code> → <code>CHARACTERS.alice.mouth</code>
  `;

  ov.appendChild(info);
  ov.appendChild(hint);
  document.body.appendChild(ov);

  const apply = () => {
    mouth.style.top   = mTop + '%';
    mouth.style.left  = mLeft + '%';
    mouth.style.width = mWid + '%';
    info.textContent = `top: ${mTop.toFixed(1)}%  |  left: ${mLeft.toFixed(1)}%  |  width: ${mWid.toFixed(1)}%`;
  };
  apply();

  /* ---------- перетаскивание ---------- */
  let dragging = false, sx, sy, sTop, sLeft;

  mouth.addEventListener('mousedown', (e) => {
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    sTop = mTop; sLeft = mLeft;
    mouth.style.cursor = 'grabbing';
    e.preventDefault();
  });

  const onMove = (e) => {
    if(!dragging) return;
    const rect = wrap.getBoundingClientRect();
    mLeft = sLeft + (e.clientX - sx) / rect.width  * 100;
    mTop  = sTop  + (e.clientY - sy) / rect.height * 100;
    apply();
  };
  const onUp = () => {
    dragging = false;
    mouth.style.cursor = 'grab';
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  /* ---------- размер колесом ---------- */
  const onWheel = (e) => {
    e.preventDefault();
    mWid = Math.max(3, Math.min(50, mWid + (e.deltaY > 0 ? -0.5 : 0.5)));
    apply();
  };
  ov.addEventListener('wheel', onWheel, { passive: false });

  devMouthCleanup = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    ov.removeEventListener('wheel', onWheel);
  };
}

function closeDevMouth(){
  const ov = document.getElementById('devMouthOverlay');
  if(ov && devMouthCleanup) devMouthCleanup();
  if(ov) ov.remove();
  devMouthMode = false;
}