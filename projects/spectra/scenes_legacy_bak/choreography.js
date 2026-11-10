gsap.ticker.lagSmoothing(0);
const $=s=>document.querySelector(s);
const AN=ANCH.lines, st=k=>(AN[k]?AN[k].start:0), en=k=>(AN[k]?AN[k].end:0);
const nrm=s=>String(s).toLowerCase().replace(/[^a-z0-9%']/g,'');
const W=(k,w,fallbackFrac=0.5)=>{
  if(!AN[k]||!AN[k].words||AN[k].words.length===0) return st(k);
  const f=AN[k].words.find(x=>nrm(x[0])===nrm(w));
  if(f) return AN[k].start+f[1];
  return AN[k].start+(AN[k].end-AN[k].start)*fallbackFrac;
};
const WI=(k,i)=>{
  if(!AN[k]||!AN[k].words||AN[k].words.length===0) return st(k);
  const idx=Math.min(Math.max(0,i),AN[k].words.length-1);
  return AN[k].start+AN[k].words[idx][1];
};
const SS=k=>(AN[k]&&AN[k].segs?AN[k].segs.filter(s=>s[1]-s[0]>=.12):[]);
const SSo=(k,i)=>{const s=SS(k);if(!s||s.length===0)return 0.02;return (s[i]||s[s.length-1])[0]};
const SG=(k,i)=>(AN[k]?AN[k].start+SSo(k,i):0);
const lastK=Object.keys(AN).pop()||'L13';
const TOTAL=+(en(lastK)+1.4).toFixed(2);
window.EVENTS=[];const ev=(n,t,o)=>window.EVENTS.push([n,+(+t).toFixed(3),o||{}]);

/* ---- key times from the measured voice ---- */
const DID=W('L2',"couldn't"), PAY=W('L3','pay');
const BOTH=SG('L8',1), REJ=SG('L9',1), PROOF=SG('L9',2)+.25;
const PT=st('L10'), VERIFY=SG('L10',1), ZERO=SG('L10',2), APPR=SG('L10',3);
const SP11A=SG('L11',1), SP11B=SG('L11',2);
const W1=en('L3')+.45,SW1=W1+.30, X1=en('L6')+.15, X2=en('L7')+.5, W4=en('L10')+.55,SW4=W4+.30, W5=en('L11')+.75,SW5=W5+.30;

function appHTML(repaired){
  const cards=[['Precision Telemetry Hub','In Stock — Next Day','$499.00',31,90],['Optical Calibration Target','Certified NIST Traced','$129.00',450,90],['Edge Neural Accelerator','Meta SAM 3.1 Ready','$899.00',31,380],['Zero-Jitter FPGA Capture','Hardware Synchronized','$349.00',450,380]];
  let h='<div class="app"><div class="a-head"><b>SPECTRA STORE</b><span>Hardware &amp; Developer Tooling</span></div>';
  cards.forEach(c=>{h+=`<div class="a-card" style="left:${c[3]}px;top:${c[4]}px"><div class="a-img">Product Visual</div><div class="a-name">${c[0]}</div><div class="a-sub">${c[1]}</div><div class="a-price">${c[2]}</div><div class="a-add">Add Cart</div></div>`});
  h+=`<div class="a-drawer"><div class="a-dt">Your Cart (2 items)</div><div class="a-dl"></div>
   <div class="a-item" style="top:86px"><b>Precision Telemetry Hub</b><small>Qty: 1 • Expedited Air</small><em>$499.00</em></div>
   <div class="a-item" style="top:181px"><b>Optical Calibration Target</b><small>Qty: 1 • Standard Pack</small><em>$129.00</em></div>
   <div class="a-row" style="top:536px"><span>Subtotal</span><i>$628.00</i></div>
   <div class="a-row" style="top:566px"><span>Estimated Shipping</span><i class="f">FREE</i></div>
   <div class="a-btn">Complete Checkout</div><div class="a-ssl">256-bit SSL Secured • Free Express Returns</div></div>`;
  if(!repaired) h+='<div class="a-occ">Quick Pay · $149.00  &rsaquo;</div>';
  return h+'</div>';
}
$('#m1s').insertAdjacentHTML('afterbegin',appHTML(false));
$('#appB').innerHTML=appHTML(false);
$('#rep').innerHTML=appHTML(true);
$('#brand').innerHTML='SPECTRA'.split('').map(c=>`<span>${c}</span>`).join('');
$('#wave').innerHTML=Array.from({length:14},()=>'<i></i>').join('');

/* ---- Lottie shockwave rings ---- */
function ringJSON(col){
  const tr={ty:'tr',p:{a:0,k:[0,0]},a:{a:0,k:[0,0]},s:{a:0,k:[100,100]},r:{a:0,k:0},o:{a:0,k:100},sk:{a:0,k:0},sa:{a:0,k:0}};
  const layers=[];
  [0,6].forEach((d,idx)=>{
    const op=d?[{t:0,s:[0],h:1},{t:d,s:[80],i:{x:[.3],y:[1]},o:{x:[.7],y:[0]}},{t:d+26,s:[0]}]:[{t:0,s:[80],i:{x:[.3],y:[1]},o:{x:[.7],y:[0]}},{t:26,s:[0]}];
    layers.push({ddd:0,ind:idx+1,ty:4,nm:'ring'+idx,sr:1,ks:{o:{a:1,k:op},r:{a:0,k:0},p:{a:0,k:[200,200,0]},a:{a:0,k:[0,0,0]},s:{a:1,k:[{t:d,s:[14,14,100],i:{x:[.2,.2,.2],y:[1,1,1]},o:{x:[.05,.05,.05],y:[0,0,0]}},{t:d+26,s:[100,100,100]}]}},ao:0,
      shapes:[{ty:'gr',it:[{ty:'el',d:1,s:{a:0,k:[320,320]},p:{a:0,k:[0,0]}},{ty:'st',c:{a:0,k:col},o:{a:0,k:100},w:{a:0,k:idx?4:6},lc:2,lj:2},tr]}],ip:0,op:40,st:0,bm:0});
  });
  return {v:'5.7.0',fr:30,ip:0,op:40,w:400,h:400,nm:'ring',ddd:0,assets:[],layers};
}
function mkRing(sel,col){const el=$(sel);const anim=lottie.loadAnimation({container:el,renderer:'svg',loop:false,autoplay:false,animationData:ringJSON(col)});anim.goToAndStop(0,true);gsap.set(el,{autoAlpha:0});return{el,anim,o:{f:0}}}
$('#cvApp').innerHTML=appHTML(false)+'<div class="cvh"></div><div class="cvs"></div><div class="cvx"></div>';
const rS=mkRing('#lotS',[.12,.65,.42,1]),rLogo=mkRing('#lotLogo',[.18,.29,1,1]);

const rc=id=>{const r=document.getElementById(id).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
const T2=rc('tab2'),TS=rc('tabS');

const tl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}});
const fmtInt=v=>Math.round(v).toLocaleString('en-US');
function count(sel,from,to,t,dur,fmt,ease){const el=$(sel);const o={v:from};el.innerHTML=fmt(from);tl.to(o,{v:to,duration:dur,ease:ease||'power2.out',onUpdate(){el.innerHTML=fmt(o.v)}},t)}
function ring(b,t){tl.set(b.el,{autoAlpha:1},t);tl.fromTo(b.o,{f:0},{f:39,duration:1.3,ease:'none',onUpdate(){b.anim.goToAndStop(b.o.f,true)}},t);tl.set(b.el,{autoAlpha:0},t+1.32)}
function wipe(id,t0){tl.fromTo(id,{x:-1970},{x:0,duration:.30,ease:'power3.in'},t0).to(id,{x:1970,duration:.34,ease:'power3.out'},t0+.30);ev('whoosh',t0,{a:1})}
const pop=(sel,t,rot)=>{tl.fromTo(sel,{scale:0,autoAlpha:0,rotation:rot||0},{scale:1,autoAlpha:1,rotation:0,duration:.4,ease:'back.out(2.2)'},t);ev('pop',t)};
function hdr(sel,t,t2){tl.fromTo(sel,{autoAlpha:1,scale:1.1,y:10,transformOrigin:'0 50%'},{autoAlpha:1,scale:1,y:0,duration:.22,ease:'power3.out',immediateRender:false},t);if(t2)tl.set(sel,{autoAlpha:0},t2)}

/* ===================== S1 : hook — "everything said all good… but customers couldn't pay" ===================== */
gsap.set('#b1',{yPercent:112});gsap.set('#didnt',{autoAlpha:0});gsap.set('#chkR',{scaleX:0});
gsap.set(['#h1hatch','#h1box','#h1strip','#chip1'],{autoAlpha:0});
tl.from('#tA',{x:-26,duration:.6,ease:'power4.out'},0);
tl.from('#dash',{x:-26,duration:.6,ease:'power4.out'},0);
tl.from('#m1',{y:44,duration:.65,ease:'power4.out'},0);
ev('thud',0,{a:.4});
['#d1 i','#d2 i','#d3 i'].forEach((s,i)=>{tl.fromTo(s,{scale:1.7},{scale:1,duration:.28,ease:'back.out(2.4)',immediateRender:false},.35+i*.3);ev('tap',.35+i*.3)});
tl.to('#chk',{scale:1.18,duration:.16,yoyo:true,repeat:1,ease:'power2.out',transformOrigin:'50% 50%'},WI('L1',3));ev('pop',WI('L1',3));
tl.to('#b1',{yPercent:0,duration:.5,ease:'power4.out'},st('L2')-.05);ev('whoosh',st('L2')-.05,{a:.5});
tl.fromTo('#didnt',{autoAlpha:0,scale:2.1,rotation:-4},{autoAlpha:1,scale:1,rotation:0,duration:.24,ease:'power4.in'},DID-.1);
tl.to('#chkG',{scaleX:0,duration:.08,ease:'power2.in'},DID).to('#chkR',{scaleX:1,duration:.18,ease:'back.out(3)'},DID+.06);
tl.fromTo('#flash1',{opacity:0},{opacity:.18,duration:.06,yoyo:true,repeat:3,ease:'none'},DID+.1);
tl.to('#s1',{x:-14,duration:.045,yoyo:true,repeat:5,ease:'none'},DID+.1).set('#s1',{x:0},DID+.4);
tl.to('#dash',{opacity:.45,duration:.4},DID+.3);
ev('impact',DID);
tl.fromTo('#punchBg',{autoAlpha:0},{autoAlpha:1,duration:.35,ease:'none'},st('L3'));
tl.to(['#tA','#tB','#dash'],{autoAlpha:0,duration:.25,ease:'power2.in'},st('L3'));
tl.set('#m1',{boxShadow:'none'},st('L3'));
tl.to('#m1',{scale:2.7,x:-746,y:-170,duration:.75,ease:'power4.out'},st('L3'));ev('swell',st('L3'),{d:.8});
tl.to(['#h1hatch','#h1box'],{autoAlpha:1,duration:.15},st('L3')+.8);
tl.fromTo('#h1strip',{autoAlpha:0},{autoAlpha:1,duration:.12,yoyo:true,repeat:5,ease:'none'},st('L3')+.9).set('#h1strip',{autoAlpha:1},st('L3')+1.62);
ev('ticks',st('L3')+.9,{n:5,dt:.12,a:.07});
tl.fromTo('#chip1',{autoAlpha:0,x:60,scale:.8},{autoAlpha:1,x:0,scale:1,duration:.35,ease:'back.out(2.2)'},PAY);ev('pop',PAY);
wipe('#w1',W1);
tl.set('#s1',{autoAlpha:0},SW1).set('#s2',{autoAlpha:1},SW1);

/* ===================== S2 : what the software reads  vs  what the customer sees ===================== */
gsap.set(['#hs1','#hs2','#hs3','#eyeIc','#cL','#cR','#li1','#li2','#li3','#li4','#cLchip','#cvChip'],{autoAlpha:0});
tl.fromTo('#cL',{autoAlpha:0,y:60},{autoAlpha:1,y:0,duration:.5,ease:'power4.out'},st('L4')-.05);ev('whoosh',st('L4')-.05,{a:.3});
hdr('#hs1',st('L4')-.05,SG('L5',1)-.1);
['#li1','#li2','#li3','#li4'].forEach((s,i)=>{const t=st('L4')+.5+i*.4;tl.fromTo(s,{autoAlpha:0,x:-30},{autoAlpha:1,x:0,duration:.3},t);ev('tap',t)});
tl.fromTo('#cLchip',{autoAlpha:0,scale:.7},{autoAlpha:1,scale:1,duration:.35,ease:'back.out(2.2)'},st('L4')+2.15);ev('chime',st('L4')+2.15);
// the customer's view
tl.to('#cL',{opacity:.38,duration:.4},st('L5'));
tl.fromTo('#cR',{autoAlpha:0,x:80},{autoAlpha:1,x:0,duration:.55,ease:'power4.out'},st('L5')+.02);ev('whoosh',st('L5')+.02,{a:.35});
hdr('#hs2',SG('L5',1)-.1,st('L6')-.05);
tl.fromTo('#cvApp .cvh',{opacity:0},{opacity:1,duration:.25},SG('L5',1)+.35);
tl.fromTo('#cvApp .cvs',{opacity:0},{opacity:1,duration:.12,yoyo:true,repeat:5,ease:'none'},SG('L5',1)+.45).set('#cvApp .cvs',{opacity:1},SG('L5',1)+1.17);
tl.fromTo('#cvApp .cvx',{opacity:0},{opacity:1,duration:.2},SG('L5',1)+.3);
ev('ticks',SG('L5',1)+.45,{n:5,dt:.12,a:.07});
tl.fromTo('#cvChip',{autoAlpha:0,scale:.7},{autoAlpha:1,scale:1,duration:.35,ease:'back.out(2.2)'},SG('L5',1)+.9);ev('pop',SG('L5',1)+.9);
// Spectra looks
const LOOK=st('L6');
tl.to('#cL',{autoAlpha:0,x:-120,duration:.45,ease:'power3.in'},LOOK-.05);
tl.to('#cR',{x:-452,duration:.7,ease:'power3.inOut'},LOOK);ev('whoosh',LOOK,{a:.35});
tl.fromTo('#eyeIc',{autoAlpha:0,scale:.5,rotation:-90},{autoAlpha:1,scale:1,rotation:0,duration:.55,ease:'back.out(1.8)',transformOrigin:'50% 50%'},LOOK+.1);ev('pop',LOOK+.1);
hdr('#hs3',LOOK+.05,X1-.05);
tl.set('#cRlab',{textContent:'SPECTRA · LOOKING',color:'#2F4BFF',backgroundColor:'rgba(47,75,255,.09)',borderColor:'rgba(47,75,255,.38)'},LOOK+.3);
tl.to('#vf',{opacity:1,duration:.3},LOOK+.5);ev('pop',LOOK+.5);
tl.fromTo('#cvScan',{y:0},{y:490,duration:.9,ease:'power1.inOut'},LOOK+.6);ev('swell',LOOK+.6,{d:.9});
tl.fromTo('#cvScan',{y:0},{y:490,duration:.9,ease:'power1.inOut',immediateRender:false},LOOK+1.5);ev('swell',LOOK+1.5,{d:.9});
tl.fromTo('#s3b',{autoAlpha:0},{autoAlpha:1,duration:.3,ease:'none'},X1);
tl.to('#s2',{autoAlpha:0,duration:.3,ease:'none'},X1+.05);

/* ===================== S3b : step 1 — say a rule ===================== */
gsap.set(['#mic','#wave','#tr','#arrow','#arrowL','#ct','#ctChip'],{autoAlpha:0});
tl.fromTo('#hb1',{autoAlpha:1,scale:1.1,y:10,transformOrigin:'0 50%'},{autoAlpha:1,scale:1,y:0,duration:.25,immediateRender:false},X1+.1);
tl.fromTo('#mic',{autoAlpha:0,scale:.6},{autoAlpha:1,scale:1,duration:.45,ease:'back.out(2)'},st('L7')-.05);ev('pop',st('L7')-.05);
tl.fromTo('#wave',{autoAlpha:0},{autoAlpha:1,duration:.2},st('L7')+.05);
const WVD=en('L7')-.5-(st('L7')+.05),wv={p:0};
tl.to(wv,{p:1,duration:WVD,ease:'none',onUpdate(){const bars=document.querySelectorAll('#wave i');const amp=Math.max(0,1-Math.max(0,wv.p-.78)*4.2);bars.forEach((b,i)=>{b.style.height=(14+110*amp*Math.abs(Math.sin(wv.p*34+i*.8))*(.55+.45*Math.sin(i*1.3)))+'px'})}},st('L7')+.05);
tl.set('#wave',{autoAlpha:.25},en('L7')-.45);
tl.fromTo('#tr',{autoAlpha:0,x:50},{autoAlpha:1,x:0,duration:.4,ease:'power4.out'},st('L7')+.05);ev('tap',st('L7')+.05);
const TXT='The Pay button must always be visible.',to={n:0},TY0=SG('L7',1),CARD=en('L7')-.3;
tl.to(to,{n:TXT.length,duration:CARD-.05-TY0,ease:'none',onUpdate(){$('#trTxt').textContent=TXT.slice(0,Math.round(to.n))}},TY0);
ev('ticks',TY0,{n:30,dt:.042,a:.06});
tl.fromTo(['#arrow','#arrowL'],{autoAlpha:0,y:-16},{autoAlpha:1,y:0,duration:.35},CARD-.15);ev('pop',CARD-.1);
tl.fromTo('#ct',{autoAlpha:0,y:80},{autoAlpha:1,y:0,duration:.5,ease:'power4.out'},CARD);ev('whoosh',CARD,{a:.4});
tl.fromTo('#ctChip',{autoAlpha:0,scale:.6},{autoAlpha:1,scale:1,duration:.35,ease:'back.out(2.4)'},CARD+.4);ev('chime',CARD+.4);
tl.fromTo('#s3c',{autoAlpha:0},{autoAlpha:1,duration:.3,ease:'none'},X2);
tl.to('#s3b',{autoAlpha:0,duration:.3,ease:'none'},X2+.05);

/* ===================== S3c : two eyes → rejected → fix → approved ===================== */
gsap.set(['#splitL','#splitR'],{opacity:0});gsap.set(['#bRej','#bVer','#bbox','#bhatch','#bstrip','#bclip','#cursor','#agree','#gauge'],{autoAlpha:0});
const hc=(i,t,t2)=>hdr('#hc'+i,t,t2);
hc(1,st('L8')-.08,BOTH-.08);hc(2,BOTH-.08,st('L9')-.06);hc(3,st('L9')-.06,REJ-.05);hc(4,REJ-.05,st('L10')-.06);
hc(5,st('L10')-.06,VERIFY-.05);hc(6,VERIFY-.05,ZERO-.05);hc(7,ZERO-.05,APPR-.05);hc(8,APPR-.05,W4);
tl.from('#ruler',{autoAlpha:0,duration:.4},X2);
tl.from('#vp',{scale:.92,autoAlpha:0,duration:.45,ease:'power4.out',transformOrigin:'50% 50%'},X2+.05);ev('thud',X2+.1,{a:.4});
tl.from('#panel',{x:-130,autoAlpha:0,duration:.45,ease:'power4.out'},st('L8')-.1);ev('whoosh',st('L8')-.1,{a:.35});
gsap.set(['#chA','#chB'],{autoAlpha:0});
pop('#chA',st('L8')+.05,-8);pop('#chB',st('L8')+.5,8);
tl.fromTo('#scan',{y:0},{y:860,duration:.95,ease:'power1.inOut'},st('L8')+.1);ev('swell',st('L8')+.1,{d:.9});
count('#nA',0,15759,st('L8')+.5,1.1,v=>fmtInt(v)+'<u>px</u>');
count('#nB',0,90,st('L8')+.65,1.0,v=>v.toFixed(2)+'<u>%</u>');
ev('ticks',st('L8')+.5,{n:14,dt:.08,a:.06});
// lock on + zoom into the button
const LOCK=st('L8')+.95;
tl.to('#bbox',{autoAlpha:1,duration:.01},LOCK);tl.from('#bbox',{scale:1.2,duration:.3,transformOrigin:'50% 50%'},LOCK);ev('click',LOCK);
tl.fromTo('#bhatch',{autoAlpha:0},{autoAlpha:1,duration:.25},LOCK+.15);
tl.fromTo('#bstrip',{autoAlpha:0},{autoAlpha:1,duration:.12,yoyo:true,repeat:3,ease:'none'},LOCK+.3).set('#bstrip',{autoAlpha:1},LOCK+.78);
tl.fromTo('#bclip',{autoAlpha:0,y:-14},{autoAlpha:1,y:0,duration:.3,ease:'back.out(2)'},LOCK+.55);ev('pop',LOCK+.55);
tl.to('#zin',{scale:1.8,x:-1024,y:-576,duration:.55,ease:'power3.inOut'},LOCK-.1);ev('whoosh',LOCK-.1,{a:.4});
tl.to('#zin',{scale:2,x:-1280,y:-720,duration:PT-.45-(LOCK+.45),ease:'sine.inOut'},LOCK+.45);
// both eyes agree
tl.fromTo('#agree',{autoAlpha:0,x:30},{autoAlpha:1,x:0,duration:.4,ease:'power4.out'},BOTH);ev('chime',BOTH);
// 9.6% hidden → gauge
tl.fromTo('#gauge',{autoAlpha:0,y:20},{autoAlpha:1,y:0,duration:.4},st('L9')-.1);
const PX=554/12,gg={v:0};
tl.to(gg,{v:9.6,duration:1.2,ease:'power2.out',onUpdate(){$('#gfill').style.width=(gg.v*PX)+'px';$('#gval').textContent=gg.v.toFixed(2)}},st('L9')+.05);
ev('ticks',st('L9')+.05,{n:15,dt:.08,a:.06});
// rejected
tl.to('#bAna',{autoAlpha:0,duration:.05},REJ);
tl.fromTo('#bRej',{autoAlpha:0,scale:1.6,transformOrigin:'0% 50%'},{autoAlpha:1,scale:1,duration:.3,ease:'back.out(2)'},REJ);
tl.to('#panel',{x:7,duration:.045,yoyo:true,repeat:5,ease:'none'},REJ+.02).set('#panel',{x:0},REJ+.3);
tl.set('#pulse',{borderColor:'#F2432D'},REJ);tl.fromTo('#pulse',{opacity:.9,scale:1},{opacity:0,scale:1.09,duration:.7,ease:'power2.out',immediateRender:false},REJ);ev('impact',REJ);
// proof
tl.set('#gnote',{textContent:'Too much: 9.60% > 1.35% allowed',color:'#F2432D'},PROOF);
tl.fromTo('#gtick',{scaleY:1},{scaleY:1.5,duration:.2,yoyo:true,repeat:3,ease:'none'},PROOF);ev('tap',PROOF);
// zoom out → cursor → "Fix it."
tl.to('#zin',{scale:1,x:0,y:0,duration:.5,ease:'power3.inOut'},PT-.45);ev('whoosh',PT-.45,{a:.35,rev:1});
tl.set('#cursor',{x:1560,y:1010,autoAlpha:1},PT-.45);
tl.fromTo('#cursor',{x:1560,y:1010},{x:T2.x-4,y:T2.y+4,duration:.6,ease:'power2.inOut'},PT-.45);
tl.to('#cursor',{scale:.82,duration:.07,yoyo:true,repeat:1},PT+.25);tl.to('#tab2',{scale:.93,duration:.07,yoyo:true,repeat:1},PT+.25);ev('click',PT+.25);
tl.set('#tab1',{backgroundColor:'#F8F4EA',color:'#4A4639',borderColor:'#B9B19B'},PT+.3).set('#tab2',{backgroundColor:'rgba(14,15,19,.10)',color:'#0E0F13',borderColor:'#0E0F13'},PT+.3);
tl.fromTo('#scan',{y:0},{y:860,duration:.5,ease:'power1.inOut'},PT+.32);ev('swell',PT+.32,{d:.5,down:1});
tl.fromTo('#rep',{clipPath:'inset(0px 0px 720px 0px)'},{clipPath:'inset(0px 0px 0px 0px)',duration:.5,ease:'power1.inOut'},PT+.32);
tl.set(['#bbox','#bhatch','#bstrip','#bclip'],{autoAlpha:0},PT+.5);
tl.to('#bRej',{autoAlpha:0,duration:.05},PT+.3);tl.set('#bAna',{autoAlpha:1,textContent:'LOOKING AGAIN…'},PT+.3);
// "Check again."  → gauge drains
count('#nA',15759,17299,VERIFY,.7,v=>fmtInt(v)+'<u>px</u>');
count('#nB',90,100,VERIFY,.7,v=>v.toFixed(2)+'<u>%</u>');
tl.to(gg,{v:0,duration:.8,ease:'power2.inOut',onUpdate(){$('#gfill').style.width=(gg.v*PX)+'px';$('#gval').textContent=gg.v.toFixed(2)}},VERIFY);
tl.to('#gfill',{backgroundColor:'#22AB78',duration:.4},VERIFY);
tl.set('#gnote',{textContent:'0.00% < 1.35% allowed → OK',color:'#12A66B'},VERIFY+.5);
ev('ticks',VERIFY,{n:10,dt:.07,a:.06});
// "Zero hidden."
tl.fromTo('#gval',{scale:1.3},{scale:1,duration:.4,ease:'back.out(2)',transformOrigin:'100% 50%'},ZERO);ev('tap',ZERO);
tl.to('#cursor',{x:TS.x-4,y:TS.y+4,duration:.3,ease:'power2.inOut'},ZERO+.05);
tl.to('#cursor',{scale:.82,duration:.07,yoyo:true,repeat:1},ZERO+.4);tl.to('#tabS',{scale:.93,duration:.07,yoyo:true,repeat:1},ZERO+.4);ev('click',ZERO+.4);
tl.set('#tabS',{backgroundColor:'rgba(14,15,19,.10)',color:'#0E0F13',borderColor:'#0E0F13'},ZERO+.46).set('#tab2',{backgroundColor:'#F8F4EA',color:'#4A4639',borderColor:'#B9B19B'},ZERO+.46);
const HX=754,HY=220+(48+360)*.8,SC=.8,sp={L:0};
const applyL=()=>{$('#rep').style.clipPath=`inset(0px 0px 0px ${sp.L}px)`;$('#sdiv').style.left=sp.L+'px'};
tl.set('#sdiv',{visibility:'visible'},ZERO+.5);
tl.to(sp,{L:1280,duration:.25,ease:'power2.in',onUpdate:applyL},ZERO+.52);
tl.to('#cursor',{x:HX+1280*SC-4,y:HY+4,duration:.25,ease:'power2.in'},ZERO+.52);ev('whoosh',ZERO+.52,{a:.3});
tl.to(sp,{L:620,duration:.7,ease:'power3.out',onUpdate:applyL},ZERO+.8);
tl.to('#cursor',{x:HX+620*SC-4,y:HY+4,duration:.7,ease:'power3.out'},ZERO+.8);
tl.to(['#splitL','#splitR'],{opacity:1,duration:.3},ZERO+.95);tl.from(['#splitL','#splitR'],{y:10,duration:.3},ZERO+.95);ev('whoosh',ZERO+.8,{a:.3,rev:1});
// "Approved."
tl.to('#bAna',{autoAlpha:0,duration:.05},APPR);
tl.fromTo('#bVer',{autoAlpha:0,scale:1.6,transformOrigin:'0% 50%'},{autoAlpha:1,scale:1,duration:.3,ease:'back.out(2)'},APPR);
tl.set('#pulse',{borderColor:'#12A66B'},APPR);tl.fromTo('#pulse',{opacity:.9,scale:1},{opacity:0,scale:1.09,duration:.8,ease:'power2.out',immediateRender:false},APPR);ev('chime',APPR);
wipe('#w4',W4);
tl.set('#s3c',{autoAlpha:0},SW4).set('#s4',{autoAlpha:1},SW4);

/* ===================== S4 : the 18 hidden buttons ===================== */
const mkTiles=id=>{$(id+' .tiles').innerHTML=Array.from({length:18},()=>'<div class="tile"><b></b><i></i><s></s></div>').join('')};
mkTiles('#rA');mkTiles('#rB');
gsap.set(['#h4','#rA','#rB'],{autoAlpha:0});gsap.set('.tile',{autoAlpha:0});
tl.fromTo('#h4',{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.5},SW4+.05);ev('tap',SW4+.05);
tl.fromTo(['#rA','#rB'],{autoAlpha:0},{autoAlpha:1,duration:.4,stagger:.12},SW4+.2);
const TP=st('L11')+.1;
['#rA','#rB'].forEach((id,r)=>{document.querySelectorAll(id+' .tile').forEach((el,i)=>{tl.fromTo(el,{autoAlpha:0,scale:.6,y:14},{autoAlpha:1,scale:1,y:0,duration:.25,ease:'back.out(2)'},TP+i*.035+r*.02)})});
ev('ticks',TP,{n:18,dt:.035,a:.05});
const RED=['rgba(242,67,45,.16)','rgba(242,67,45,.6)','#FF9A8A','✕'], GRN=['rgba(18,166,107,.18)','rgba(18,166,107,.65)','#5FE0A8','✓'];
function flip(el,t,c){tl.set(el,{backgroundColor:c[0],borderColor:c[1]},t);tl.set(el.querySelector('s'),{opacity:1,color:c[2],textContent:c[3]},t);tl.set([el.querySelector('b'),el.querySelector('i')],{opacity:0},t)}
const OKI=7,TA=SP11A+.05;
document.querySelectorAll('#rA .tile').forEach((el,i)=>{
  const t=TA+i*.048;
  if(i===OKI){flip(el,t,GRN);tl.fromTo(el,{scale:1.3},{scale:1,duration:.3,ease:'back.out(2)',immediateRender:false},t);tl.set('#rA .sv',{textContent:'1'},t);ev('chime',t)}
  else{flip(el,t,RED);if(i%3===0)ev('tap',t)}
});
tl.fromTo('#rA .stat',{scale:1.25},{scale:1,duration:.35,ease:'back.out(2)',immediateRender:false},TA+OKI*.048);
const TB=SP11B+.12;
document.querySelectorAll('#rB .tile').forEach((el,i)=>{
  const t=TB+i*.075;flip(el,t,GRN);tl.set('#rB .sv',{textContent:String(i+1)},t);
  if(i%2===0)ev('tap',t);
});
const TB_END=TB+17*.075;
tl.fromTo('#rB .stat',{scale:1.35},{scale:1,duration:.4,ease:'back.out(2)',immediateRender:false},TB_END);
ring(rS,TB_END);ev('impact',TB_END);ev('chime',TB_END+.02);
wipe('#w5',W5);
tl.set('#s4',{autoAlpha:0},SW5).set('#s5',{autoAlpha:1},SW5);

/* ===================== S5 : close ===================== */
gsap.set(['#logoIc','#brand','#tag','#url','#devrow'],{autoAlpha:0});gsap.set(['#wd1','#wd2','#wd3','#wd4','#wd5','#dv1','#dv2','#dv3'],{autoAlpha:0});
gsap.set(['#ct1','#ct2'],{yPercent:112});
tl.to('#ct1',{yPercent:0,duration:.5,ease:'power4.out'},st('L12'));ev('tap',st('L12'));
tl.to('#ct2',{yPercent:0,duration:.5,ease:'power4.out'},WI('L12',3)-.1);ev('tap',WI('L12',3)-.1);
tl.to('#catch',{autoAlpha:0,y:-60,duration:.35,ease:'power2.in'},st('L13')-.25);
const E=st('L13');
tl.fromTo('#logoIc',{autoAlpha:0,scale:0,rotation:-100},{autoAlpha:1,scale:1,rotation:0,duration:.6,ease:'back.out(1.8)',transformOrigin:'50% 50%'},E);
ring(rLogo,E+.05);ev('impact',E+.02);ev('chime',E+.05);
tl.set('#brand',{autoAlpha:1},E);
tl.from('#brand span',{yPercent:70,autoAlpha:0,duration:.4,stagger:.05,ease:'back.out(2)'},E+.02);
[['#wd1',1],['#wd2',2],['#wd3',3],['#wd4',4],['#wd5',5]].forEach(([s,i])=>{const t=WI('L13',i);tl.fromTo(s,{autoAlpha:0,y:34,scale:.9},{autoAlpha:1,y:0,scale:1,duration:.3,ease:'back.out(2)'},t-.05);ev('pop',t-.05)});
tl.set('#tag',{autoAlpha:1},E);
const UT=WI('L13',4)-.15;
tl.fromTo('#url',{autoAlpha:0,y:50},{autoAlpha:1,y:0,duration:.45,ease:'back.out(1.8)'},UT);
const URL_='spectra-lyart.vercel.app',uo={n:0};
tl.to(uo,{n:URL_.length,duration:.8,ease:'none',onUpdate(){$('#urltxt').textContent=URL_.slice(0,Math.round(uo.n))}},UT+.25);
ev('ticks',UT+.25,{n:24,dt:.033,a:.05});
tl.fromTo('#caret',{opacity:1},{opacity:0,duration:.2,yoyo:true,repeat:9,ease:'steps(1)'},UT+.25);
tl.set('#devrow',{autoAlpha:1},en('L13')-.7);
tl.fromTo(['#dv1','#dv2','#dv3'],{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:.35,stagger:.14},en('L13')-.7);
tl.to('#urlbox',{scale:1.035,duration:.3,yoyo:true,repeat:1,ease:'sine.inOut'},en('L13')+.15);
ev('chime',en('L13')+.15);

/* ===================== captions ===================== */
const CAPS=[
 ['L3',[[0,'A bar was covering part of the Pay button.']]],
 ['L4',[[0,'Normal checks just read a list of parts.']]],
 ['L5',[[0,'They never see what customers see.']]],
 ['L6',[[0,'Spectra looks at the screen, like a person.']]],
 ['L7',[[0,'Say a rule:'],[SSo('L7',1),'the Pay button must always be visible.']]],
 ['L8',[[0,'Two different eyes look.'],[SSo('L8',1),'Both must agree.']]],
 ['L9',[[0,'9.6% hidden.'],[SSo('L9',1),'Rejected, with proof.']]],
 ['L10',[[0,'Fix it.'],[SSo('L10',1),'Check again.'],[SSo('L10',2),'Zero hidden.'],[SSo('L10',3),'Approved.']]],
 ['L11',[[0,'18 hidden buttons.'],[SSo('L11',1),'Normal checks caught one.'],[SSo('L11',2),'Spectra caught all 18.']]]
];
CAPS.forEach(([k,chunks])=>chunks.forEach(([off,txt],i)=>{
  const t0=st(k)+off-.03, t1=(i+1<chunks.length?st(k)+chunks[i+1][0]-.06:en(k)+.18);
  tl.set('#capT',{textContent:txt},t0);
  tl.fromTo('#cap',{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:.16,ease:'power2.out',immediateRender:false},t0);
  tl.to('#cap',{autoAlpha:0,duration:.14,ease:'power1.in'},t1-.02);
}));

tl.to({},{duration:.01},TOTAL-.01);
window.TOTAL=TOTAL;
window.seek=t=>{tl.time(Math.min(t,TOTAL-.001),false)};
window.ready=document.fonts.ready.then(()=>Promise.all(['800 80px BR','700 80px BR','italic 400 80px IS','400 20px JB','700 20px JB','500 20px IN','600 20px IN','700 20px IN','700 20px SG'].map(f=>document.fonts.load(f))));
