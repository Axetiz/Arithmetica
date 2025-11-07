// Arithmeticα site JS: navigation, theme slider, and home animation
(function(){
  'use strict';

  // Utilities
  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  // THEME HANDLING
  const THEME_KEY = 'arithmetic-theme-preference';
  const THEMES = ['normal','light','dark'];
  const brandLogo = $('.brand-logo');
  const themeToggle = $('#themeToggle');
  const themeButtons = themeToggle ? $all('.theme-option', themeToggle) : [];
  const themeLogos = {
    normal: 'images/logo_default.PNG',
    light: 'images/logo_ligth.png',
    dark: 'images/logo_dark.png'
  };

  function getStoredTheme(){
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t && THEMES.includes(t)) return t;
    } catch(_) {}
    return null;
  }
  function setStoredTheme(theme){
    try { localStorage.setItem(THEME_KEY, theme); } catch(_) {}
  }
  function currentTheme(){
    const classes = document.body.classList;
    for (const t of THEMES){ if (classes.contains(`theme-${t}`)) return t; }
    return 'normal';
  }
  function applyTheme(theme){
    if (!THEMES.includes(theme)) theme = 'normal';
    THEMES.forEach(t=>document.body.classList.remove(`theme-${t}`));
    document.body.classList.add(`theme-${theme}`);
    // Sync slider buttons
    themeButtons.forEach(btn=>{
      const btnTheme = btn.dataset.setTheme || (btn.textContent||'').toLowerCase().split(/\s+/)[0];
      btn.classList.toggle('active', btnTheme===theme);
    });
    // Swap logo if present
    if (brandLogo){
      const src = themeLogos[theme] || themeLogos.normal;
      if (brandLogo.getAttribute('src') !== src){ brandLogo.setAttribute('src', src); }
      brandLogo.setAttribute('alt', `Arithmeticα ${theme} logo`);
    }
    setStoredTheme(theme);
  }
  (function initTheme(){
    const stored = getStoredTheme();
    const initial = stored || 'normal';
    applyTheme(initial);
    // Wire slider
    themeButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const t = btn.dataset.setTheme || (btn.textContent||'').toLowerCase().split(/\s+/)[0];
        applyTheme(t);
      });
    });
  })();

  // NAVIGATION: highlight active link, optional mobile toggle
  const navMenu = $('#navMenu');
  const navToggle = $('#navToggle');
  const navLinks = $all('.nav-menu .nav-link');

  (function initNav(){
    // Active link by path
    const here = location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(a=>{
      const href = (a.getAttribute('href')||'').split('/').pop();
      a.classList.toggle('active', href===here);
    });

    // Optional mobile toggle if button exists
    navToggle && navToggle.addEventListener('click', ()=>{
      if (!navMenu) return;
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen?'true':'false');
    });

    document.addEventListener('click', (e)=>{
      if (!navMenu || !navToggle) return;
      if (!navMenu.classList.contains('open')) return;
      const inside = navMenu.contains(e.target) || navToggle.contains(e.target);
      if (!inside){ navMenu.classList.remove('open'); navToggle.setAttribute('aria-expanded','false'); }
    });
  })();

  // HOME PAGE ANIMATION (normal distribution) if container exists
  const canvasHost = $('.canvas');
  const zLabel = $('#zLabel');
  if (canvasHost){
    const c = document.createElement('canvas');
    c.id = 'graph';
    c.style.width = '100%';
    c.style.height = '100%';
    canvasHost.innerHTML = '';
    canvasHost.appendChild(c);
    const ctx = c.getContext('2d');
    let W=0, H=0, t=0;

    function phi(x){ return (1/Math.sqrt(2*Math.PI))*Math.exp(-0.5*x*x); }
    // Polyfill erf if needed
    if (typeof Math.erf !== 'function'){
      const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
      Math.erf = function(x){
        const s = Math.sign(x||0); x=Math.abs(x);
        const t=1/(1+p*x);
        const y=1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
        return s*y;
      };
    }

    function resize(){
      const dpr = window.devicePixelRatio||1;
      W = canvasHost.clientWidth||600;
      H = canvasHost.clientHeight||320;
      c.width = Math.max(1, Math.floor(W*dpr));
      c.height = Math.max(1, Math.floor(H*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      const pad=36; const x0=pad, x1=W-pad, y0=H-pad, y1=pad;
      const mapX = x=> x0 + (x+3)/6*(x1-x0);
      const mapY = y=> y0 - (y/phi(0))*(y0-y1);
      const cs = getComputedStyle(document.documentElement);
      const line = cs.getPropertyValue('--canvas-line').trim()||'#fff';
      const fill = cs.getPropertyValue('--canvas-fill').trim()||'rgba(99,102,241,.4)';

      // axes
      ctx.strokeStyle = line+'55';
      ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x0,y1); ctx.lineTo(x1,y1); ctx.stroke();
      ctx.strokeStyle = line; ctx.beginPath(); ctx.moveTo(mapX(0),y0); ctx.lineTo(mapX(0),y1); ctx.stroke();

      // x ticks
      ctx.fillStyle=line; ctx.font='12px Inter'; ctx.textAlign='center'; ctx.fillText('0', mapX(0), y0+24);
      const ticks=[-2,-1,1,2];
      ticks.forEach(z=>{
        ctx.setLineDash([4,6]); ctx.strokeStyle=line+'88';
        ctx.beginPath(); ctx.moveTo(mapX(z),y0); ctx.lineTo(mapX(z),y1); ctx.stroke();
        ctx.setLineDash([]);
        ctx.textAlign='center'; ctx.fillText((z>0?'+':'')+'Z'+(z===1?'₁':z===2?'₂':''), mapX(z), y0+24);
      });

      // normal curve
      ctx.lineWidth=2; ctx.strokeStyle=line; ctx.beginPath();
      for (let x=-3;x<=3;x+=0.01){
        const X=mapX(x), Y=mapY(phi(x));
        if (x===-3) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
      }
      ctx.stroke();

      // animated z and shade
      const zx = 1.6*Math.sin(t*0.8);
      ctx.fillStyle = fill; ctx.beginPath();
      let started=false;
      for (let x=-3;x<=zx;x+=0.01){
        const X=mapX(x), Y=mapY(phi(x));
        if (!started){ ctx.moveTo(X,y0); ctx.lineTo(X,Y); started=true; }
        else ctx.lineTo(X,Y);
      }
      ctx.lineTo(mapX(zx),y0); ctx.closePath(); ctx.fill();
      ctx.setLineDash([4,6]); ctx.strokeStyle=line; ctx.beginPath(); ctx.moveTo(mapX(zx),y0); ctx.lineTo(mapX(zx),y1); ctx.stroke(); ctx.setLineDash([]);

      const p=(0.5*(1+Math.erf(zx/Math.SQRT2))).toFixed(2);
      if (zLabel){ zLabel.textContent = `Z = ${zx.toFixed(2)} • P(X ≤ Z) ≈ ${p}`; }
    }
    function loop(){ t+=0.016; draw(); requestAnimationFrame(loop); }
    function initCanvas(){ resize(); draw(); requestAnimationFrame(loop); }
    window.addEventListener('resize', resize);
    if (document.readyState==='complete' || document.readyState==='interactive') initCanvas();
    else window.addEventListener('DOMContentLoaded', initCanvas);
  }
  
  // EARLY ACCESS ALERT: show on key CTAs and scroll to form
  (function initEarlyAccess(){
    const alertEl = document.getElementById('earlyAccessAlert');
    const applyBtn = document.getElementById('alertApply');
    const ctaTop = document.getElementById('ctaTop');
    const ctaMid = document.getElementById('ctaMid');
    const inviteBtn = document.getElementById('inviteFriend');
    const nameInput = document.getElementById('name');

    if(!alertEl || !applyBtn) return;

    function showAlert(){
      alertEl.classList.remove('hidden','fading');
      // next frame to allow transition
      requestAnimationFrame(()=>{
        alertEl.classList.add('visible');
      });
    }
    function hideAlert(){
      alertEl.classList.remove('visible');
      alertEl.classList.add('fading');
      setTimeout(()=>{
        alertEl.classList.add('hidden');
        alertEl.classList.remove('fading');
      }, 220);
    }

    function scrollToSignup(){
      const target = document.getElementById('signup');
      if (target){
        target.scrollIntoView({behavior:'smooth', block:'start'});
        // focus name input when available
        if (nameInput){ setTimeout(()=>nameInput.focus(), 450); }
      }
    }

    // Bind CTAs to show the alert
    [ctaTop, ctaMid, inviteBtn].forEach(btn=>{
      if(!btn) return;
      btn.addEventListener('click', (e)=>{
        // prevent default for anchors
        if (btn.tagName === 'A') e.preventDefault();
        showAlert();
      });
    });

    // Apply button scrolls to signup and hides alert
    applyBtn.addEventListener('click', ()=>{
      hideAlert();
      scrollToSignup();
    });

    // Dismiss on backdrop click (outside content)
    alertEl.addEventListener('click', (e)=>{
      const content = alertEl.querySelector('.early-alert-content');
      if (content && !content.contains(e.target)) hideAlert();
    });

    // Dismiss with ESC
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape' && alertEl.classList.contains('visible')) hideAlert();
    });
  })();
  
  // BETA SIGNUP FORM: validate and handle submit
  (function initBetaForm(){
    const form = document.getElementById('betaForm');
    if (!form) return;
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const submitBtn = form.querySelector('.submit');
    const msgEl = document.getElementById('formMsg');
    const endpoint = (form.getAttribute('data-remote-endpoint')||'').trim();

    function setMsg(text, state){
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.setAttribute('data-state', state||'info');
      msgEl.style.display = 'block';
    }
    function clearMsg(){ if (msgEl){ msgEl.textContent=''; msgEl.removeAttribute('data-state'); msgEl.style.display='none'; } }
    function validateEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      clearMsg();
      const name = (nameEl?.value||'').trim();
      const email = (emailEl?.value||'').trim();
      if (!name || !validateEmail(email)){
        setMsg('Please enter your name and a valid email address.', 'error');
        (name? emailEl : nameEl)?.focus();
        return;
      }
      // pending state
      const prevText = submitBtn?.textContent;
      if (submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }
      setMsg('Submitting your request...', 'info');

      const payload = { name, email, ts: new Date().toISOString() };
      let ok = false;
      if (endpoint){
        try{
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify(payload)
          });
          ok = res.ok;
        }catch(_){ ok = false; }
      }
      // Local success if no endpoint or network fails
      if (!endpoint || ok){
        setMsg('Thanks! You\'re on the waitlist. We\'ll email your invite soon.', 'success');
        try{ form.reset(); }catch(_){ /* noop */ }
      } else {
        setMsg('Sorry, we could not submit right now. Please try again later.', 'error');
      }
      if (submitBtn){ submitBtn.disabled = false; submitBtn.textContent = prevText||'Join Cohort Waitlist'; }
    });
  })();

  // (Pruned) Tutor page JS removed for landing page optimization
})();
