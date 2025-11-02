const canvas=document.getElementById('graph');
const ctx=canvas.getContext('2d');
let W,H,t=0,ys=0,os=0;
const zLabel=document.getElementById('zLabel');
const youScoreEl=document.getElementById('youScore');
const opScoreEl=document.getElementById('opScore');
const youState=document.getElementById('youState');
const opState=document.getElementById('opState');
const brandLogo=document.querySelector('.brand-logo');
const subscripts={1:'₁',2:'₂'};
const STORAGE_KEY='arithmetic-beta-waitlist';

function resizeCanvas(){
  W=canvas.clientWidth;H=canvas.clientHeight;
  const dpr=window.devicePixelRatio||1;
  canvas.width=W*dpr;canvas.height=H*dpr;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(dpr,dpr);
}
function phi(x){return (1/Math.sqrt(2*Math.PI))*Math.exp(-0.5*x*x);}
(function ensureMathHelpers(){
  if(typeof Math.sign!=='function'){
    Math.sign=x=>(x>0)-(x<0);
  }
  if(typeof Math.erf!=='function'){
    const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
    Math.erf=function(x){
      const s=Math.sign(x||0);
      x=Math.abs(x);
      const t=1/(1+p*x);
      const y=1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
      return s*y;
    };
  }
})();
function drawNormal(){
  ctx.clearRect(0,0,W,H);
  const pad=36;
  const x0=pad,x1=W-pad,y0=H-pad,y1=pad;
  const mapX=x=>x0+(x+3)/(6)*(x1-x0);
  const mapY=y=>y0-(y/phi(0))*(y0-y1);
  const root=document.documentElement;
  const line=getComputedStyle(root).getPropertyValue('--canvas-line').trim();
  const fill=getComputedStyle(root).getPropertyValue('--canvas-fill').trim();
  ctx.strokeStyle=line+'55';
  ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0,y1);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.strokeStyle=line;
  ctx.beginPath();ctx.moveTo(mapX(0),y0);ctx.lineTo(mapX(0),y1);ctx.stroke();
  ctx.fillStyle=line;
  ctx.font='12px Inter';
  ctx.textAlign='center';
  ctx.fillText('0',mapX(0),y0+24);
  ctx.textAlign='start';
  const zVals=[-2,-1,1,2];
  zVals.forEach(z=>{
    ctx.setLineDash([4,6]);
    ctx.strokeStyle=line+'88';
    ctx.beginPath();ctx.moveTo(mapX(z),y0);ctx.lineTo(mapX(z),y1);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=line;
    ctx.font='12px Inter';
    const labelSign=z>0?'+':'-';
    const labelSuffix=subscripts[Math.abs(z)]||'';
    ctx.textAlign='center';
    ctx.fillText(`${labelSign}Z${labelSuffix}`,mapX(z),y0+24);
    ctx.textAlign='start';
  });
  ctx.lineWidth=2;ctx.strokeStyle=line;
  ctx.beginPath();
  for(let x=-3;x<=3;x+=0.01){
    const X=mapX(x),Y=mapY(phi(x));
    if(x===-3)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);
  }
  ctx.stroke();
  const zx=1.6*Math.sin(t*0.8);
  ctx.fillStyle=fill;
  ctx.beginPath();
  let started=false;
  for(let x=-3;x<=zx;x+=0.01){
    const X=mapX(x),Y=mapY(phi(x));
    if(!started){ctx.moveTo(X,y0);ctx.lineTo(X,Y);started=true}else ctx.lineTo(X,Y);
  }
  ctx.lineTo(mapX(zx),y0);ctx.closePath();ctx.fill();
  ctx.setLineDash([4,6]);
  ctx.strokeStyle=line;
  ctx.beginPath();ctx.moveTo(mapX(zx),y0);ctx.lineTo(mapX(zx),y1);ctx.stroke();
  ctx.setLineDash([]);
  const p=(0.5*(1+Math.erf(zx/Math.SQRT2))).toFixed(2);
  zLabel.textContent=`Z = ${zx.toFixed(2)} • P(X ≤ Z) ≈ ${p}`;
}
function animate(){
  t+=0.016;drawNormal();
  if(os<13&&Math.random()<0.008){
    os+=1;
    opScoreEl.textContent=os;
    opState.textContent=os>=13?'Victory!':'Streak +1';
  }else if(os>=13){
    opState.textContent='Victory!';
  }
  requestAnimationFrame(animate);
}
function init(){resizeCanvas();animate();}
window.addEventListener('resize',resizeCanvas);
init();

const signupSection=document.getElementById('signup');
const ctaTop=document.getElementById('ctaTop');
const ctaMid=document.getElementById('ctaMid');
const earlyAlert=document.getElementById('earlyAccessAlert');
const alertApply=document.getElementById('alertApply');
let alertTimer=0;

function scrollToSignup(){
  if(signupSection){
    signupSection.scrollIntoView({behavior:'smooth'});
  }
}
function hideEarlyAlert(immediate=false){
  if(!earlyAlert)return;
  clearTimeout(alertTimer);
  if(immediate){
    earlyAlert.classList.remove('visible','fading');
    earlyAlert.classList.add('hidden');
    return;
  }
  earlyAlert.classList.add('fading');
}
function showEarlyAlert(){
  if(!earlyAlert)return;
  clearTimeout(alertTimer);
  earlyAlert.classList.remove('hidden','fading');
  requestAnimationFrame(()=>{
    earlyAlert.classList.add('visible');
  });
  alertTimer=window.setTimeout(()=>hideEarlyAlert(),10000);
}
ctaTop?.addEventListener('click',scrollToSignup);
ctaMid?.addEventListener('click',e=>{
  e.preventDefault();
  showEarlyAlert();
});
alertApply?.addEventListener('click',()=>{
  hideEarlyAlert(true);
  scrollToSignup();
});
earlyAlert?.addEventListener('transitionend',event=>{
  if(event.propertyName==='opacity'&&earlyAlert.classList.contains('fading')){
    hideEarlyAlert(true);
  }
});

const form=document.getElementById('betaForm');
const msg=document.getElementById('formMsg');
const remoteEndpoint=form?.dataset?.remoteEndpoint?.trim()||'';
const submitButton=form?.querySelector('button[type="submit"]');
const defaultSubmitText=submitButton?.textContent||'Join Waitlist';

function setMessage(text,type='success'){
  if(!msg)return;
  msg.style.display='block';
  msg.textContent=text;
  if(type==='success'){
    msg.dataset.state='success';
  }else if(type==='error'){
    msg.dataset.state='error';
  }else{
    msg.dataset.state='info';
  }
}
function loadSubmissions(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return [];
    const data=JSON.parse(raw);
    return Array.isArray(data)?data:[];
  }catch(err){
    console.warn('Unable to read saved submissions',err);
    return [];
  }
}
function saveSubmission(entry){
  const entries=loadSubmissions().filter(item=>item.email!==entry.email);
  entries.push(entry);
  entries.sort((a,b)=>{
    const byName=a.name.localeCompare(b.name,'en',{sensitivity:'base'});
    if(byName!==0)return byName;
    return a.email.localeCompare(b.email,'en',{sensitivity:'base'});
  });
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));
  }catch(err){
    console.warn('Unable to persist submission',err);
  }
  return entries;
}
async function sendToRemote(entry){
  if(!remoteEndpoint)return {ok:true};
  try{
    const response=await fetch(remoteEndpoint,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Accept':'application/json'
      },
      body:JSON.stringify(entry)
    });
    if(!response.ok){
      const contentType=response.headers.get('Content-Type')||'';
      let detail='';
      if(contentType.includes('application/json')){
        const data=await response.json().catch(()=>null);
        detail=data?.message||data?.error||'';
      }else{
        detail=await response.text();
      }
      throw new Error(detail||`Request failed with status ${response.status}`);
    }
    return {ok:true};
  }catch(err){
    console.warn('Remote submission failed',err);
    return {ok:false,error:err instanceof Error?err.message:String(err)};
  }
}
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const n=document.getElementById('name').value.trim();
  const em=document.getElementById('email').value.trim().toLowerCase();
  if(!n||!em){
    setMessage('Please fill in both your name and email before submitting.','error');
    return;
  }
  const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailPattern.test(em)){
    setMessage('Please enter a valid email address.','error');
    return;
  }
  setMessage('Submitting your details…','info');
  if(submitButton){
    submitButton.disabled=true;
    submitButton.textContent='Submitting…';
  }
  const entry={name:n,email:em,submittedAt:new Date().toISOString()};
  const submissions=saveSubmission(entry);
  const total=submissions.length;
  let message=`Thanks, ${n}! You’re on the Arithmeticα waitlist. We’ll notify ${em} before the arena opens. (${total} total sign-ups stored.)`;
  let messageType='success';
  const remoteResult=await sendToRemote(entry);
  if(!remoteResult.ok){
    message+=` We couldn't reach the signup service. Entry saved locally.`;
    messageType='error';
  }
  setMessage(message,messageType);
  form.reset();
  if(submitButton){
    submitButton.disabled=false;
    submitButton.textContent=defaultSubmitText;
  }
});

const toggle=document.getElementById('themeToggle');
const themes=['normal','light','dark'];
const themeLogos={
  normal:'images/logo_default.PNG',
  light:'images/logo_ligth.png',
  dark:'images/logo_dark.png'
};
let themeIndex=0;
const initialTheme=themes.find(th=>document.body.classList.contains(`theme-${th}`))||'normal';
themeIndex=themes.indexOf(initialTheme);
function applyTheme(theme){
  document.body.classList.remove('theme-normal','theme-light','theme-dark');
  document.body.classList.add(`theme-${theme}`);
  toggle.dataset.theme=theme;
  if(brandLogo){
    const src=themeLogos[theme]||themeLogos.normal;
    if(brandLogo.getAttribute('src')!==src){
      brandLogo.setAttribute('src',src);
    }
    brandLogo.setAttribute('alt',`Arithmeticα ${theme} logo`);
  }
  resizeCanvas();
}
applyTheme(initialTheme);
toggle.addEventListener('click',()=>{
  themeIndex=(themeIndex+1)%themes.length;
  applyTheme(themes[themeIndex]);
});
