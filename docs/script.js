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

document.getElementById('ctaTop').onclick=()=>document.querySelector('#signup').scrollIntoView({behavior:'smooth'});
document.getElementById('ctaMid').onclick=e=>{e.preventDefault();document.querySelector('#signup').scrollIntoView({behavior:'smooth'});};

const form=document.getElementById('betaForm');
const msg=document.getElementById('formMsg');
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
  entries.push({...entry,submittedAt:new Date().toISOString()});
  entries.sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(entries));
  }catch(err){
    console.warn('Unable to persist submission',err);
  }
  return entries;
}
form.addEventListener('submit',e=>{
  e.preventDefault();
  const n=document.getElementById('name').value.trim(),em=document.getElementById('email').value.trim();
  if(!n||!em)return;
  const submissions=saveSubmission({name:n,email:em});
  msg.style.display='block';
  msg.textContent=`Thanks, ${n}! You’re on the Arithmeticα waitlist. We’ll notify ${em} before the arena opens. (${submissions.length} total sign-ups stored.)`;
  form.reset();
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
