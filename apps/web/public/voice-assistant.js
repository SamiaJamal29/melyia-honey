/* Add this script to a website you own; only advertised controls can be used. */
(() => {
  'use strict';
  if (document.querySelector('voice-assistant')) return;
  const script = document.currentScript;
  if (script.dataset.pilot === "true" && new URLSearchParams(location.search).get("voice-test") !== "1") return;
  const endpoint = (script.dataset.endpoint || '/api/assistant').replace(/\/$/, '');
  const melyia = script.dataset.site === 'melyia';
  const host = document.createElement('voice-assistant');
  document.body.append(host);
  const root = host.attachShadow({mode: 'open'});
  root.innerHTML = `<style>
    :host{position:fixed;bottom:22px;right:22px;z-index:2147483000;font:15px/1.5 system-ui;color:#f9f1dd}
    *{box-sizing:border-box}button,input,textarea,select{font:inherit}button{cursor:pointer;border:1px solid #71603d;background:#e6b34b;color:#211a0e;border-radius:12px;padding:10px 15px;font-weight:650}button:disabled{opacity:.5;cursor:wait}
    #launch{box-shadow:0 8px 40px #0005}section{width:min(380px,calc(100vw - 28px));max-height:calc(100dvh - 90px);overflow:auto;background:#201f19;border:1px solid #776947;border-radius:20px;box-shadow:0 16px 65px #0007;padding:20px;margin-bottom:12px}
    [hidden]{display:none!important}header{display:flex;align-items:center;justify-content:flex-end;gap:8px}h2{font-size:22px;margin:0}p{margin:9px 0;color:#d4cbb5}.small{font-size:12px}label{display:block;margin-top:12px}textarea{width:100%;min-height:85px;resize:vertical;background:#131510;color:#fff;border:1px solid #867957;border-radius:10px;padding:10px}select{padding:6px;background:#131510;color:white;border-radius:7px}nav{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#reply{white-space:pre-wrap;color:#fff}#status{color:#e6c67f}#clear,#close{width:44px;height:44px;padding:0;display:grid;place-items:center;border-radius:12px;background:transparent;color:#eee;transition-property:background-color,border-color,color,transform;transition-duration:150ms;transition-timing-function:ease-out}#clear{border-color:#776947;color:#e6c67f}#clear:hover:not(:disabled){background:#3a321f;border-color:#b99b52;color:#f5d78f}#close{border-color:transparent}#close:hover{background:#343229}#clear:active:not(:disabled),#close:active{transform:scale(.96)}#mute{width:auto}#pending{border-top:1px solid #655b42;margin-top:12px;padding-top:12px}
    #messages{min-height:200px;max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:8px 0}#messages p{margin:0;max-width:90%;padding:10px 13px;border-radius:15px;white-space:pre-wrap;overflow-wrap:anywhere}#messages .user{align-self:flex-end;background:#e6b34b;color:#211a0e}#messages .assistant{align-self:flex-start;background:#343229;color:#fff}#composer{display:flex;align-items:flex-end;gap:8px;border-top:1px solid #655b42;padding-top:12px}#composer textarea{min-height:44px;max-height:100px;height:44px;resize:vertical;flex:1;min-width:0}#composer button{width:44px;height:44px;flex-shrink:0;padding:10px;display:grid;place-items:center}#voice[aria-pressed="true"]{background:#b43c35;color:#fff}svg{width:21px;height:21px}button:focus-visible,textarea:focus-visible{outline:2px solid #f5d78f;outline-offset:3px}#status:empty{display:none}#status{font-size:12px}summary{cursor:pointer}
    </style><section aria-label="Website voice assistant" hidden>
    <header><button id="clear" aria-label="Clear saved chat" title="Clear saved chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 13h10l1-13"/></svg></button><button id="close" aria-label="Close assistant">×</button></header>
    <div id="messages" role="log" aria-live="polite" aria-label="Conversation"></div>
    <p id="storage-error" class="small" role="status" hidden></p>
    <p id="status" role="status" aria-live="polite"></p>
    <details id="recordings"><summary>Saved microphone clips</summary><label><input id="keep-audio" type="checkbox"> Save new microphone clips on this device</label><p class="small">Only your microphone is saved. Clips are not sent for training.</p><div id="clip-list"></div><button id="delete-clips">Delete all clips</button></details>
    <div id="pending" hidden><p id="proposal"></p><nav><button id="confirm">Confirm action</button><button id="cancel">Cancel</button></nav></div>
    <div id="composer">
      <textarea id="command" dir="auto" rows="1" maxlength="2000" aria-label="Your message" placeholder="اكتب رسالتك…"></textarea>
      <button id="send" aria-label="Send message" title="Send message">➤</button>
      <button id="voice" aria-label="Start voice conversation" title="Start voice conversation" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg></button>
    </div>
    <button id="connect" hidden>Connect assistant</button><button id="record" hidden disabled>Record</button><input type="checkbox" id="mute" hidden>
    </section><button id="launch" aria-expanded="false" aria-label="Open chat">🎙</button>`;
  const $ = id => root.getElementById(id);
  const panel = root.querySelector('section');
  let ready = false, busy = false, recorder, stream, timer, pending, generation = 0, discard = false, conversation = false, finishSpeech, clipAudio, speechRequest, silenceTimer, audioContext;
  const history = [];
  const chatKey=melyia?'melyia-voice-chat-v1':'website-voice-chat-v1';
  let savedChat=[], unreadableChat=false;
  let clipUrls=[];
  const uiWords = {
    "Saved microphone clips": "تسجيلات المايك المحفوظة",
    "Save new microphone clips on this device": "احفظ تسجيلات المايك الجديدة على هالجهاز",
    "Only your microphone is saved. Clips are not sent for training.": "ينحفظ صوت المايك فقط. التسجيلات ما تنرسل للتدريب.",
    "Delete all clips": "امسح كل التسجيلات",
    "Could not save microphone clip.": "ما قدرنا نحفظ تسجيل المايك.",
    "Chat could not be saved on this browser.": "ما قدرنا نحفظ المحادثة على هالمتصفح.",
    "Assistant unavailable. Try again.": "المساعد مو متاح الحين. جرّب مرة ثانية.",
    "Preparing the Bahraini voice…": "قاعد أجهز الرد بالصوت البحريني…",
    "Speaking…": "قاعد أرد عليك…",
    "Say confirm or cancel for the displayed action.": "أسمعك… قول «أكد» أو «إلغاء» للإجراء المعروض.",
    "Start voice conversation": "ابدأ محادثة صوتية",
    "Stop conversation": "وقف المحادثة",
    "Listening. Pause when finished; I will reply automatically.": "أسمعك… إذا خلصت، اسكت شوي وبرد عليك تلقائيًا.",
    "No speech heard. Start again when ready.": "ما سمعت كلام. ابدأ المحادثة من جديد إذا جهزت.",
    "Voice conversation stopped.": "وقفت المحادثة والمايك.",
    "Bahraini voice unavailable. Read the reply and try again.": "الصوت البحريني مو متاح الحين. اقرأ الرد وجرّب مرة ثانية.",
    "Website voice assistant": "المساعد الصوتي للموقع",
    "Close assistant": "إغلاق المساعد",
    "Connect assistant": "اتصل بالمساعد",
    "Mute spoken replies": "كتم الرد الصوتي",
    "Your words · عدّل اللي كتبته": "كلامك · عدّل اللي كتبته",
    "Record": "سجّل صوتك",
    "Understand & act": "افهم ونفّذ",
    "Connect first. Chrome may ask to reach your local assistant.": "اتصل أولًا. قد يطلب Chrome السماح بالوصول إلى المساعد المحلي.",
    "Confirm action": "تأكيد الإجراء",
    "Cancel": "إلغاء",
    "🍯 Talk to me": "🍯 تكلّم معاي",
    "Ready. Record or type a request.": "جاهز. تكلّم أو اكتب طلبك.",
    "Connecting to your local models…": "جارٍ الاتصال بالنماذج المحلية…",
    "Understanding…": "قاعد أفهم طلبك…",
    "Review the proposed action and confirm.": "راجع الإجراء المقترح وأكّده.",
    "Answered. You can ask another question.": "تم الرد. تقدر تسأل سؤال ثاني.",
    "Record or type something first.": "سجّل صوتك أو اكتب شي أول.",
    "Action cancelled.": "تم إلغاء الإجراء.",
    "Stop recording": "وقف التسجيل",
    "Transcribing…": "قاعد أكتب كلامك…",
    "Check your transcript, then press Understand & act.": "راجع كلامك المكتوب، وبعدين اضغط «افهم ونفّذ».",
    "Recording cancelled.": "تم إلغاء التسجيل.",
    "Listening… Press Stop when finished (maximum 60 seconds).": "أسمعك… اضغط «وقف التسجيل» إذا خلصت (الحد 60 ثانية).",
    "Field filled. Please review it.": "تمت تعبئة الحقل. راجعه قبل المتابعة.",
    "Button clicked. Check the page to verify the result.": "تم الضغط على الزر. تأكد من النتيجة في الصفحة.",
    "Assistant busy. Please try again.": "المساعد مشغول الحين. جرّب مرة ثانية.",
    "That control is unavailable on this page. Please try again.": "هالإجراء مو متاح في هالصفحة. جرّب مرة ثانية."
};
  const originalLabels = new WeakMap();
  function localize() {
    const arabic = document.documentElement.lang.startsWith('ar');
    host.dir = arabic ? 'rtl' : 'ltr';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('#messages, style')) continue;
      const original = originalLabels.get(node) || node.textContent.trim();
      if (uiWords[original]) {
        originalLabels.set(node, original);
        node.textContent = arabic ? uiWords[original] : original;
      }
    }
    $('clear').setAttribute('aria-label',arabic?'مسح المحادثة المحفوظة':'Clear saved chat');
    $('clear').title=$('clear').getAttribute('aria-label');
    $('close').setAttribute('aria-label', arabic ? uiWords['Close assistant'] : 'Close assistant');
    $('launch').setAttribute('aria-label',arabic?'افتح المحادثة':'Open chat');
    $('command').setAttribute('aria-label',arabic?'رسالتك':'Your message');
    $('command').placeholder=arabic?'اكتب رسالتك…':'Type a message…';
    $('send').setAttribute('aria-label',arabic?'إرسال':'Send message');
    $('send').title=arabic?'إرسال':'Send message';
    $('voice').setAttribute('aria-label',arabic?uiWords[conversation?'Stop conversation':'Start voice conversation']:(conversation?'Stop conversation':'Start voice conversation'));
    $('voice').title=$('voice').getAttribute('aria-label');
    $('messages').setAttribute('aria-label',arabic?'المحادثة':'Conversation');
    panel.setAttribute('aria-label', arabic ? uiWords['Website voice assistant'] : 'Website voice assistant');
  }
  function status(text) { $('status').textContent = text; localize(); }
  function buttons() {
    $('send').disabled = busy || !!recorder || conversation;
    $('record').disabled = !ready || busy || conversation;
    $('voice').disabled = !conversation && (busy || !!recorder);
    $('voice').setAttribute('aria-pressed',String(conversation));
    $('voice').innerHTML=conversation?'■':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>'; localize();
  }
  function cancelSpeech() { speechRequest?.abort(); speechRequest=null; clipAudio?.pause(); clipAudio=null; finishSpeech?.(false); }
  function storageError() {
    $('storage-error').hidden=false;
    $('storage-error').textContent='Chat could not be saved on this browser.';localize();
  }
  function saveChat() {
    if(unreadableChat) return storageError();
    try {localStorage.setItem(chatKey,JSON.stringify(savedChat));$('storage-error').hidden=true;}
    catch {storageError();}
  }
  function clips() {
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(chatKey+'-audio',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('clips',{keyPath:'id',autoIncrement:true});
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
  }
  async function clipStore(mode,operation) {
    const db=await clips();
    try {
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('clips',mode);
        operation(tx.objectStore('clips'));
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      });
    } finally {db.close();}
  }
  async function showClips() {
    clipUrls.forEach(URL.revokeObjectURL);clipUrls=[];
    $('clip-list').replaceChildren();
    await clipStore('readonly',store=>{
      const request=store.getAll();
      request.onsuccess=()=>{
        for(const clip of request.result.reverse()) {
          const row=document.createElement('div'), label=document.createElement('p'), audio=document.createElement('audio'), link=document.createElement('a');
          label.textContent=new Date(clip.created).toLocaleString();
          audio.controls=true;audio.setAttribute('aria-label',label.textContent);
          const url=URL.createObjectURL(clip.audio);clipUrls.push(url);audio.src=url;
          link.href=url;link.download=`voice-${clip.created}.${clip.type.includes('mp4')?'mp4':'webm'}`;
          link.textContent=document.documentElement.lang.startsWith('ar')?'تنزيل':'Download';
          row.append(label,audio,link);$('clip-list').append(row);
        }
      };
    });
  }
  async function saveClip(audio,type) {
    await clipStore('readwrite',store=>store.add({audio,type,created:Date.now()}));
    if($('recordings').open) await showClips();
  }
  function message(role,text,save=true) {
    const bubble=document.createElement('p');bubble.className=role;bubble.dir='auto';bubble.textContent=text;
    $('messages').append(bubble);
    $('messages').scrollTop=$('messages').scrollHeight;
    if(save) {savedChat.push({role,content:text});saveChat();}
    $('clear').disabled=!savedChat.length&&!unreadableChat;
  }
  function restoreChat() {
    try {
      const saved=JSON.parse(localStorage.getItem(chatKey)||'[]');
      if(!Array.isArray(saved)||!saved.every(t=>t&&['user','assistant'].includes(t.role)&&typeof t.content==='string'&&t.content.length<=10000)) throw new Error('Invalid chat');
      savedChat=saved.map(({role,content})=>({role,content}));
      savedChat.forEach(t=>message(t.role,t.content,false));
      history.push(...savedChat.slice(-4).map(t=>({role:t.role,content:t.content.slice(0,1000)})));
    } catch {unreadableChat=true;storageError();}
    $('clear').disabled=!savedChat.length&&!unreadableChat;
  }
  async function say(text) {
    message('assistant',text); cancelSpeech();
    if ($('mute').checked) return true;
    const current=generation;
    let url='/static/voice/greeting-bahraini-female.wav?v=lively-1', objectUrl;
    if (!melyia || text !== 'هلا والله! شنو تبي؟') {
      status('Preparing the Bahraini voice…');
      const controller=new AbortController(); speechRequest=controller;
      try {
        const blob=await request('/speak',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({text}),signal:controller.signal},true);
        if (current!==generation || controller.signal.aborted) return false;
        objectUrl=URL.createObjectURL(blob); url=objectUrl;
      } catch {return false;}
      finally {if(speechRequest===controller) speechRequest=null;}
    }
    if (current!==generation) {if(objectUrl) URL.revokeObjectURL(objectUrl);return false;}
    if(conversation) status('Speaking…');
    return new Promise(resolve=>{
      const audio=new Audio(url); clipAudio=audio;
      let finished=false;
      const timeout=setTimeout(()=>finish(false),120000);
      function finish(ok) {
        if(finished)return; finished=true; clearTimeout(timeout); audio.pause();
        if(clipAudio===audio) clipAudio=null;
        if(objectUrl) URL.revokeObjectURL(objectUrl);
        finishSpeech=null; resolve(ok);
      }
      finishSpeech=finish;audio.onended=()=>finish(true);audio.onerror=()=>finish(false);
      audio.play().catch(()=>finish(false));
    });
  }
  function clearPending() { pending = null; $('pending').hidden = true; }
  async function request(path, options = {}, binary = false) {
    const response = await fetch(endpoint + path, {...options, mode: 'cors', credentials: 'omit',
      targetAddressSpace: /^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(endpoint) ? 'loopback' : undefined,
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(180000)]) : AbortSignal.timeout(180000)});
    if (response.ok && binary) return response.blob();
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Request failed.');
    return result;
  }
  // Only safe same-site links plus owner-marked fields and buttons are advertised.
  function productLink(slug) {
    return document.querySelector(`[data-voice-product="${slug}"]`) || Array.from(document.querySelectorAll(`a[href="/shop/${slug}"]`)).find(a => /honey/i.test(a.textContent));
  }
  function targets() {
    const result = new Map();
    for (const a of document.querySelectorAll(melyia ? 'a[href]' : 'a[data-voice]')) {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || /\/(?:checkout|delete|logout|payment|remove)(?:\/|$)/i.test(url.pathname)) continue;
      const id = melyia ? 'page:' + url.pathname + url.hash : a.dataset.voice;
      if (id && (!result.has(id) || a.dataset?.voiceLabel || /honey/i.test(a.textContent))) result.set(id, {id, label: (a.dataset?.voiceLabel || a.getAttribute('aria-label') || a.textContent.trim() || url.pathname).slice(0,180), kind:'navigate', element:a});
    }
    for (const field of document.querySelectorAll('input[data-voice],textarea[data-voice]')) {
      if (!['text','search','textarea'].includes(field.type) || field.autocomplete === 'cc-number') continue;
      const id = field.dataset.voice;
      if (id) result.set(id, {id, label:(field.getAttribute('aria-label') || field.placeholder || id).slice(0,180), kind:'fill', element:field});
    }
    for (const button of document.querySelectorAll('button[type="button"][data-voice]')) {
      const id = button.dataset.voice;
      if (id) result.set(id, {id, label:(button.dataset.voiceLabel || button.textContent.trim()).slice(0,180), kind:'click', element:button});
    }
    if (melyia) for (const slug of ['tualang','kelulut','acacia','gelam']) {
      const a = productLink(slug);
      const container = a?.parentElement?.parentElement?.parentElement;
      const button = container && Array.from(container.querySelectorAll('button')).find(b => b.textContent.trim() === 'Add to cart');
      if (button) result.set('cart:'+slug, {id:'cart:'+slug, label:'Add one '+a.textContent.trim()+' to cart', kind:'click', element:button});
    }
    return result;
  }
  function navigationFor(command, available) {
    const text=command.toLowerCase();
    if (!/\b(?:open|go to|take me to|navigate to)\b|بطل|بطّل|افتح|روح|ودني|ودّني/.test(text)) return;
    const pages=Array.from(available.values()).filter(target=>target.kind==='navigate');
    if (/\b(?:cart|basket|bag)\b|كارت|كورت|السلة|السله|عربة/.test(text)) {
      const cart=pages.find(target=>new URL(target.element.href).pathname==='/cart');
      if (cart) return cart;
    }
    const product=pages.find(target=>{
      const path=new URL(target.element.href).pathname;
      const slug=path.split('/')[2];
      const visibleName=target.element.textContent.trim().toLowerCase();
      return path.startsWith('/shop/') && ((visibleName.length>2 && text.includes(visibleName)) || text.includes(target.label.toLowerCase()) || (slug && text.split(/[^a-z0-9-]+/).includes(slug)));
    });
    if (product) return product;
    if (/\b(?:shop|store|honey)\b|العسل|المتجر|الدكان|تسوق|تسوّق/.test(text)) {
      const shop=pages.find(target=>new URL(target.element.href).pathname==='/shop');
      if (shop) return shop;
    }
    const named=pages.filter(target=>target.label.length>2 && text.includes(target.label.toLowerCase()));
    if (named.length===1) return named[0];
  }
  function openPage(action, command) {
    execute(action);
    const path=new URL(action.element.href).pathname;
    const name=path==='/cart' ? ['السلة','cart'] : path==='/shop' ? ['العسل','shop'] : path==='/' ? ['الرئيسية','home'] : [action.element.textContent.trim() || action.label,action.label];
    return /[\u0600-\u06ff]/.test(command) ? `فتحت لك صفحة ${name[0]}.` : `Opened the ${name[1]} page.`;
  }
  function context() {
    const chunks = Array.from(document.querySelectorAll('[data-voice-context]')).map(e=>e.getAttribute('data-voice-context') || e.textContent.trim());
    // Public-page opt-in: never read form values; avoid this option on private/account pages.
    if (!melyia && script.dataset.readPage === 'true') {
      const page = document.querySelector('main, [role="main"], article') || document.body;
      chunks.push(page.innerText || '');
    }
    if (melyia) for (const slug of ['tualang','kelulut','acacia','gelam']) {
      const a = productLink(slug);
      if (a) chunks.push(a.parentElement.parentElement.parentElement.textContent.trim());
    }
    return (document.title+'\n'+(script.dataset.currency ? 'Catalog currency: '+script.dataset.currency+'.\n' : '')+chunks.join('\n')).slice(0,6000);
  }
  function execute(action) {
    const current = targets().get(action.id);
    const el = current?.element;
    if (!el || !el.isConnected || el.disabled || (current.kind !== 'navigate' && !el.getClientRects().length) || current.kind !== action.kind) {
      throw new Error('That control is unavailable on this page. Please try again.');
    }
    if (current.kind === 'navigate') {
      const url = new URL(el.href);
      if (url.origin !== location.origin) throw new Error('External navigation is not allowed.');
      status('Opening '+current.label+'…');
      el.click();
    } else if (current.kind === 'fill') {
      const setter = Object.getOwnPropertyDescriptor(el.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, action.value);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      el.focus(); status('Field filled. Please review it.');
    } else {
      el.click(); status('Button clicked. Check the page to verify the result.');
    }
  }
  $('launch').onclick = () => {
    panel.hidden = !panel.hidden; $('launch').hidden=!panel.hidden; $('launch').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) $('command').focus(); else endConversation();
  };
  $('clear').onclick=()=>{
    const arabic=document.documentElement.lang.startsWith('ar');
    if(!window.confirm(arabic?'تمسح المحادثة المحفوظة من هالجهاز؟':'Clear the saved chat from this device?'))return;
    endConversation('');
    try {localStorage.removeItem(chatKey);unreadableChat=false;$('storage-error').hidden=true;}
    catch {storageError();return;}
    savedChat=[];history.length=0;$('messages').replaceChildren();$('command').value='';$('clear').disabled=true;
  };
  $('close').onclick = () => { endConversation(); panel.hidden = true; $('launch').hidden=false; $('launch').setAttribute('aria-expanded','false'); stop(); cancelSpeech(); $('launch').focus(); };
  $('recordings').ontoggle=()=>{if($('recordings').open) showClips().catch(()=>status('Could not save microphone clip.'));};
  $('delete-clips').onclick=async()=>{
    if(!window.confirm(document.documentElement.lang.startsWith('ar')?'تمسح كل تسجيلات المايك المحفوظة؟':'Delete all saved microphone clips?')) return;
    try {await clipStore('readwrite',store=>store.clear());await showClips();}
    catch {status('Could not save microphone clip.');}
  };
  async function connect() {
    busy = true; buttons(); status('Connecting to your local models…');
    try { await request('/health'); ready = true; $('connect').hidden = true; status(''); }
    catch { status('Assistant unavailable. Try again.'); }
    finally { busy = false; buttons(); }
  };
  $('connect').onclick = connect;
  $('command').oninput = () => { if (conversation) endConversation(); else { generation++; clearPending();} };
  $('mute').onchange = () => { if ($('mute').checked) {if(conversation) endConversation(); else cancelSpeech();} };
  async function send() {
    const command = $('command').value.trim();
    if (!command) return status('Record or type something first.');
    const currentGeneration = ++generation;
    const directNavigation=navigationFor(command, targets());
    if (directNavigation) {
      message('user',command); $('command').value=''; clearPending();
      try {
        const reply=openPage(directNavigation, command);
        history.push({role:'user',content:command.slice(0,1000)},{role:'assistant',content:reply});
        history.splice(0,Math.max(0,history.length-4));
        await replyAndListen(reply);
      } catch(e) { status(e.message); }
      return;
    }
    if(!ready) {await connect();if(!ready || currentGeneration!==generation || panel.hidden)return;}
    message('user',command);
    $('command').value='';
    clearPending(); busy = true; buttons(); status('Understanding…'); cancelSpeech();
    let spokenReply;
    try {
      const available = targets();
      const result = await request('/plan', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        command, site:melyia?'melyia':'generic', history, context:context(), targets:Array.from(available.values(), ({id,label,kind})=>({id,label,kind}))})});
      if (currentGeneration !== generation) return;
      spokenReply=result.reply;
      if (!result.target) status('Answered. You can ask another question.');
      else {
        const target = available.get(result.target);
        if (!target) throw new Error('Assistant selected an unknown action.');
        const action = {...target, value:result.value};
        if (action.kind === 'navigate') spokenReply=openPage(action, command);
        else { pending = action; $('proposal').textContent = action.label + (action.kind === 'fill' ? ': '+action.value : ''); $('pending').hidden = false; status('Review the proposed action and confirm.');
          if(conversation) spokenReply += /[\u0600-\u06ff]/.test(result.reply) ? ' قول «أكد» إذا تبي أنفّذ، أو «إلغاء».' : ' Say confirm to approve the displayed action, or cancel.'; }
      }
      history.push({role:'user',content:command.slice(0,1000)},{role:'assistant',content:spokenReply.slice(0,1000)});
      history.splice(0,Math.max(0,history.length-4));
    } catch(e) { endConversation(e.message); }
    finally { busy = false; buttons(); }
    if (spokenReply && currentGeneration === generation) await replyAndListen(spokenReply);
  }
  $('send').onclick = send;
  $('command').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!$('send').disabled)send();}};
  $('confirm').onclick = () => { if(conversation) {generation++;discard=true;stop();return spokenCommand('confirm');} const action = pending; clearPending(); try { if (action) execute(action); } catch(e) {status(e.message);} };
  $('cancel').onclick = () => {if(conversation) {generation++;discard=true;stop();return spokenCommand('cancel');} clearPending(); status('Action cancelled.');};
  function stop() {
    clearTimeout(timer); clearInterval(silenceTimer); silenceTimer = null;
    audioContext?.close().catch(()=>{}); audioContext = null;
    stream?.getTracks().forEach(t=>t.stop());
    if (recorder?.state === 'recording') recorder.stop();
  }
  function endConversation(message = 'Voice conversation stopped.') {
    conversation = false; generation++; discard = true; clearPending(); stop(); cancelSpeech(); buttons(); status(message);
  }
  async function replyAndListen(text) {
    const current = generation;
    if (conversation) status('Speaking…');
    const spoken = await say(text);
    if (current !== generation) return;
    if (!spoken) {
      if(conversation) endConversation('Bahraini voice unavailable. Read the reply and try again.');
      else status('Bahraini voice unavailable. Read the reply and try again.');
      return;
    }
    if (!conversation) {status(pending?'Review the proposed action and confirm.':'');return;}
    await capture(true);
  }
  async function spokenCommand(text) {
    const answer = text.trim().toLowerCase().replace(/[ً-ْ،,.!؟?]/g,'').replace(/\s+/g,' ');
    if (/^(stop|stop conversation|وقف|وقف المحادثة|خلاص)$/.test(answer)) return endConversation();
    if (pending) {
      message('user',text);
      if (/^(yes|confirm|yes confirm|نعم|اي|إي|اي نعم|إي نعم|أكد|اكد|تأكيد|تاكيد)$/.test(answer)) {
        const action = pending; clearPending();
        try { execute(action); await replyAndListen('تم الضغط على الزر أو تعبئة الحقل. راجع النتيجة في الصفحة.'); }
        catch(e) { endConversation(e.message); }
      } else if (/^(no|cancel|لا|الغاء|إلغاء|لا خلاص)$/.test(answer)) {
        clearPending(); await replyAndListen('تم الإلغاء. شنو تبي بعد؟');
      } else {
        await replyAndListen('ما نفذت شي. قول «أكد» عشان أنفّذ، أو «إلغاء».');
      }
      return;
    }
    await send();
  }
  async function capture(automatic = false) {
    if (recorder || busy || panel.hidden || (automatic && !conversation)) return;
    const captureGeneration = ++generation;
    if (!automatic) clearPending();
    cancelSpeech(); discard = false; busy = true; buttons();
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
      if (captureGeneration !== generation || panel.hidden || (automatic && !conversation)) {
        acquired.getTracks().forEach(t=>t.stop()); busy=false; buttons(); return;
      }
      stream = acquired;
      const recording = new MediaRecorder(stream); recorder=recording; const chunks=[];
      const keepAudio=$('keep-audio').checked;
      let heard = !automatic;
      recorder.ondataavailable = e => { if(e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        if (recorder !== recording) return;
        const mime = recording.mimeType; recorder = null; stop();
        $('record').textContent='Record';
        if (discard || captureGeneration !== generation) {busy=false; buttons(); return;}
        if (automatic && !heard) {busy=false; endConversation('No speech heard. Start again when ready.'); return;}
        busy = true; buttons(); status('Transcribing…');
        try {
          const audio=new Blob(chunks,{type:mime});
          if(keepAudio) try {await saveClip(audio,mime);} catch {status('Could not save microphone clip.');}
          const form = new FormData(); form.append('audio',audio,mime.includes('mp4')?'voice.mp4':'voice.webm');
          const result = await request('/transcribe',{method:'POST',body:form});
          if (captureGeneration !== generation) return;
          $('command').value=result.transcript;
          busy=false; buttons();
          if (automatic && conversation) {
            if (!result.transcript.trim()) return endConversation('No speech heard. Start again when ready.');
            await spokenCommand(result.transcript);
          } else status('Check your transcript, then press Understand & act.');
        } catch(e) { if (captureGeneration === generation) endConversation(e.message); }
        finally { if (!recorder) {busy=false; buttons();} }
      };
      recorder.start(); busy = false;
      timer=setTimeout(stop,60000);
      if (automatic) {
        audioContext = new AudioContext();
        await audioContext.resume();
        const meter = audioContext.createAnalyser(), buffer = new Uint8Array(meter.fftSize);
        audioContext.createMediaStreamSource(stream).connect(meter);
        let last = Date.now();
        // shortcut: Same fixed silence threshold as the notes app; calibrate with real microphones before public use.
        silenceTimer=setInterval(()=>{
          meter.getByteTimeDomainData(buffer);
          const rms=Math.sqrt(buffer.reduce((sum,v)=>sum+(v-128)**2,0)/buffer.length);
          if (rms>6) {heard=true; last=Date.now();}
          if (Date.now()-last>(heard?2000:8000)) stop();
        },100);
      }
      $('record').textContent=automatic?'Record':'Stop recording'; buttons();
      status(automatic?(pending?'Say confirm or cancel for the displayed action.':'Listening. Pause when finished; I will reply automatically.'):'Listening… Press Stop when finished (maximum 60 seconds).');
    } catch(e) {
      discard=true; stop(); recorder=null; busy=false; buttons();
      endConversation('Microphone unavailable: '+e.message);
    }
  }
  $('record').onclick = () => recorder ? stop() : capture();
  $('voice').onclick = async () => {
    if (conversation) return endConversation();
    if (busy || recorder) return;
    const current=generation;
    if(!ready) {await connect();if(!ready || current!==generation || panel.hidden)return;}
    conversation=true; clearPending(); $('mute').checked=false; buttons();
    await replyAndListen('هلا والله! شنو تبي؟');
  };
  restoreChat();
  localize();
  const languageObserver = new MutationObserver(localize);
  languageObserver.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  window.addEventListener('pagehide',()=>endConversation());
})();
