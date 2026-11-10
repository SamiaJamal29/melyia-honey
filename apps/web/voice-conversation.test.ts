import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const speech: Array<{text:string; lang:string; onend?:()=>void; onerror?:()=>void}> = [];
const clips: Array<{onended?:()=>void;onerror?:()=>void;pause:ReturnType<typeof vi.fn>}> = [];
const plans: Array<{history:unknown[]}> = [];
let transcripts:string[], sound=false, propose=false, clickCart:ReturnType<typeof vi.fn<()=>void>>;
let root:ShadowRoot, getMicrophone:ReturnType<typeof vi.fn>, stopTrack:ReturnType<typeof vi.fn>;
let currentScript:PropertyDescriptor|undefined;
const tick = async () => {for(let i=0;i<20;i++) await Promise.resolve();};
const button = (id:string) => root.getElementById(id) as HTMLButtonElement;
const endSpeech = async () => {clips.at(-1)!.onended!(); await tick();};
const utter = async () => {
  sound=true; await vi.advanceTimersByTimeAsync(200);
  sound=false; await vi.advanceTimersByTimeAsync(2200); await tick();
};

beforeEach(async()=>{
  localStorage.clear();
  vi.useFakeTimers(); clips.length=0; speech.length=0; plans.length=0; sound=false; propose=false;
  transcripts=['شنو سعر عسل الديرة؟','جم وزنه؟'];
  stopTrack=vi.fn(); getMicrophone=vi.fn().mockResolvedValue({getTracks:()=>[{stop:stopTrack}]});
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:getMicrophone}});
  vi.stubGlobal('speechSynthesis',{cancel:vi.fn(),getVoices:()=>[{lang:'ar-BH'}],speak:(u:typeof speech[number])=>speech.push(u)});
  vi.stubGlobal('Audio',class {pause=vi.fn();onended?:()=>void;onerror?:()=>void;constructor(public src:string){clips.push(this);}play=async()=>{};});
  vi.stubGlobal('SpeechSynthesisUtterance',class {lang=''; constructor(public text:string){}});
  vi.stubGlobal('MediaRecorder',class {
    state='inactive'; mimeType='audio/webm'; onstop?:()=>void; ondataavailable?:(e:{data:Blob})=>void;
    start(){this.state='recording';}
    stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['synthetic test audio'])}); queueMicrotask(()=>this.onstop?.());}
  });
  vi.stubGlobal('AudioContext',class {
    resume=async()=>{}; close=async()=>{};
    createAnalyser(){return {fftSize:32,getByteTimeDomainData:(b:Uint8Array)=>b.fill(sound?140:128)};}
    createMediaStreamSource(){return {connect(){}};}
  });
  vi.stubGlobal('AbortController',AbortController);
  vi.stubGlobal('AbortSignal',AbortSignal);
  URL.createObjectURL=vi.fn(()=> 'blob:generated-bahraini-voice');
  URL.revokeObjectURL=vi.fn();
  vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{
    if(url.endsWith('/speak')) return {ok:true,blob:async()=>new Blob(['RIFF voice'],{type:'audio/wav'})};
    if(url.endsWith('/health')) return {ok:true,json:async()=>({ready:true})};
    if(url.endsWith('/transcribe')) return {ok:true,json:async()=>({transcript:transcripts.shift()||'خلاص'})};
    plans.push(JSON.parse(options!.body as string));
    return {ok:true,json:async()=>({reply:'سعر عسل الديرة أربعة دينار ونص.',target:propose?'cart:tualang':null,value:''})};
  }));
  document.body.innerHTML='<button type="button" data-voice="cart:tualang">Add Al Deera Honey to cart</button>';
  const cart=document.body.querySelector('button')!;clickCart=vi.fn();cart.onclick=clickCart;
  cart.getClientRects=()=>[{width:100}] as unknown as DOMRectList;
  document.documentElement.lang='ar-BH';
  const script=document.createElement('script'); currentScript=Object.getOwnPropertyDescriptor(document,'currentScript');
  Object.defineProperty(document,'currentScript',{configurable:true,value:script});
  Function(readFileSync('public/voice-assistant.js','utf8'))();
  root=document.querySelector('voice-assistant')!.shadowRoot!;
  button('launch').click(); await tick();
});
afterEach(async()=>{
  button('close').click(); await tick(); vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();
  document.body.innerHTML='';
  if(currentScript)Object.defineProperty(document,'currentScript',currentScript);else Reflect.deleteProperty(document,'currentScript');
});

describe('voice-to-voice conversation',()=>{
  it('waits for playback, detects silence, sends text automatically and keeps two-turn context',async()=>{
    button('voice').click();await tick();
    expect(clips[0]).toHaveProperty('src','/static/voice/greeting.wav?v=voice-a');expect(speech).toHaveLength(0);expect(getMicrophone).not.toHaveBeenCalled();
    await endSpeech();expect(getMicrophone).toHaveBeenCalledTimes(1);
    await utter();expect(plans).toHaveLength(1);expect(root.getElementById('messages')!.textContent).toContain('شنو سعر عسل الديرة؟');
    expect(getMicrophone).toHaveBeenCalledTimes(1);expect(stopTrack).toHaveBeenCalled();
    expect(clips[1]).toHaveProperty('src','blob:generated-bahraini-voice');expect(speech).toHaveLength(0);
    await endSpeech();expect(getMicrophone).toHaveBeenCalledTimes(2);
    await utter();expect(plans[1].history).toHaveLength(2);
    button('voice').click();await tick();
    expect(getMicrophone).toHaveBeenCalledTimes(2);
  });
  it('executes only the displayed action after explicit spoken confirmation',async()=>{
    propose=true;transcripts=['ضيف عسل الديرة للسلة','مو متأكد','أكد'];
    button('voice').click();await tick();await endSpeech();await utter();
    expect(clickCart).not.toHaveBeenCalled();expect(root.getElementById('pending')).not.toHaveAttribute('hidden');
    await endSpeech();await utter();expect(clickCart).not.toHaveBeenCalled();expect(plans).toHaveLength(1);
    await endSpeech();await utter();expect(clickCart).toHaveBeenCalledTimes(1);expect(plans).toHaveLength(1);
  });
  it('cancels a displayed action by voice and never confirms it later accidentally',async()=>{
    propose=true;transcripts=['ضيف عسل الديرة','إلغاء'];
    button('voice').click();await tick();await endSpeech();await utter();
    await endSpeech();await utter();expect(clickCart).not.toHaveBeenCalled();
    expect(root.getElementById('pending')).toHaveAttribute('hidden');
  });
  it('stops after silence instead of recording indefinitely',async()=>{
    button('voice').click();await tick();await endSpeech();
    await vi.advanceTimersByTimeAsync(8300);
    expect(plans).toHaveLength(0);expect(stopTrack).toHaveBeenCalled();
    expect(button('voice').getAttribute('aria-label')).toBe('ابدأ محادثة صوتية');
  });
  it('discards transcription that finishes after Stop',async()=>{
    let finish!:(v:Response)=>void;
    vi.mocked(fetch).mockImplementation(async(url)=>String(url).endsWith('/transcribe')
      ? new Promise(resolve=>{finish=resolve}) : {ok:true,json:async()=>({ready:true})} as Response);
    button('voice').click();await tick();await endSpeech();await utter();
    button('voice').click();await tick();
    finish({ok:true,json:async()=>({transcript:'ضيف عسل الديرة'})} as Response);await tick();
    expect(plans).toHaveLength(0);expect(speech).toHaveLength(0);
    expect(root.getElementById('command')).toHaveValue('');
  });
  it('stops cached playback without opening the microphone after a late ended event',async()=>{
    button('voice').click();await tick();
    button('voice').click();await tick();
    expect(clips[0].pause).toHaveBeenCalled();
    clips[0].onended!();await tick();expect(getMicrophone).not.toHaveBeenCalled();
  });
  it('does not switch to a different voice when the previous clip fails',async()=>{
    button('voice').click();await tick();clips[0].onerror!();await tick();
    expect(getMicrophone).not.toHaveBeenCalled();expect(speech).toHaveLength(0);
    expect(button('voice').getAttribute('aria-label')).toBe('ابدأ محادثة صوتية');
  });
  it('discards generated voice after Stop and never uses browser speech',async()=>{
    let finish!:(v:Response)=>void;
    vi.mocked(fetch).mockImplementation(async(url)=>String(url).endsWith('/speak')
      ? new Promise(resolve=>{finish=resolve}) : String(url).endsWith('/transcribe')
      ? {ok:true,json:async()=>({transcript:'جم سعره؟'})} as Response
      : {ok:true,json:async()=>({reply:'أربعة ونص',target:null,value:''})} as Response);
    button('voice').click();await tick();await endSpeech();await utter();
    button('voice').click();await tick();
    finish({ok:true,blob:async()=>new Blob(['audio'])} as Response);await tick();
    expect(clips).toHaveLength(1);expect(getMicrophone).toHaveBeenCalledTimes(1);expect(speech).toHaveLength(0);
  });
  it('shows manual voice failures without using browser speech',async()=>{
    vi.mocked(fetch).mockImplementation(async(url)=>String(url).endsWith('/speak')
      ? {ok:false,json:async()=>({detail:'Voice generation failed'})} as Response
      : {ok:true,json:async()=>({reply:'هلا',target:null,value:''})} as Response);
    (root.getElementById('command') as HTMLTextAreaElement).value='هلا';button('send').click();await tick();
    expect(root.getElementById('status')!.textContent).toContain('الصوت البحريني مو متاح');
    expect(speech).toHaveLength(0);expect(clips).toHaveLength(0);
  });
  it('does not start the microphone or greeting after closing during connection',async()=>{
    let finish!:(v:Response)=>void;
    vi.mocked(fetch).mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
    button('voice').click();await tick();button('close').click();await tick();
    finish({ok:true,json:async()=>({ready:true})} as Response);await tick();
    expect(clips).toHaveLength(0);expect(getMicrophone).not.toHaveBeenCalled();
  });
  it('connects and sends typed chat with Enter, keeping user and assistant bubbles',async()=>{
    const input=root.getElementById('command') as HTMLTextAreaElement;
    input.value='جم سعر عسل الديرة؟';
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await tick();
    expect(plans).toHaveLength(1);expect(input.value).toBe('');
    expect(root.querySelector('.user')!.textContent).toBe('جم سعر عسل الديرة؟');
    expect(root.querySelector('.assistant')!.textContent).toContain('أربعة دينار ونص');
    const spoken=vi.mocked(fetch).mock.calls.find(([url])=>String(url).endsWith('/speak'));
    expect(JSON.parse((spoken![1] as RequestInit).body as string).text).toBe('سعر عسل الديرة أربعة دينار ونص.');
    expect(clips.at(-1)).toHaveProperty('src','blob:generated-bahraini-voice');
    expect(speech).toHaveLength(0);expect(getMicrophone).not.toHaveBeenCalled();
  });
  it('releases a late microphone grant after the user stops',async()=>{
    let grant!:(s:unknown)=>void;
    getMicrophone.mockImplementation(()=>new Promise(resolve=>{grant=resolve}));
    button('voice').click();await tick();await endSpeech();
    button('voice').click();grant({getTracks:()=>[{stop:stopTrack}]});await tick();
    expect(stopTrack).toHaveBeenCalled();expect(plans).toHaveLength(0);
  });
});
