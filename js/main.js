// ============================================
// MAIN.JS — Minecraft Realm (Story Mode Edition)
// Lógica: partículas, countdown, sonidos,
// personajes hero, formulario, scroll reveal
// ============================================
'use strict';

import { initPlayerGrid, initStoryHero } from './api-handler.js';

// ── INICIO ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLetterAnimation(); // ← PRIMERO: divide letras antes de que se vean
  initParticles();
  initNavbar();
  initScrollReveal();
  initCountdown();
  initSoundSystem();
  initFormValidation();
  initAudioBanner();
  initPlayerGrid();
  initStoryHero();
});

// ════════════════════════════════════════
// ANIMACIÓN LETRA POR LETRA — Estilo Trailer
// ════════════════════════════════════════
function initLetterAnimation() {
  const title = document.querySelector('.hero-title');
  if (!title) return;

  const lines = title.querySelectorAll('.title-line');

  lines.forEach((line, lineIdx) => {
    const originalText = line.textContent.trim();
    const isHighlight  = line.classList.contains('highlight');

    // Limpiar el texto original
    line.textContent = '';

    // Crear un span por cada carácter
    [...originalText].forEach((char, charIdx) => {
      if (char === ' ') {
        // Espacio: span invisible para mantener el gap
        const sp = document.createElement('span');
        sp.className = 'letter-space';
        sp.setAttribute('aria-hidden', 'true');
        line.appendChild(sp);
        return;
      }

      const span = document.createElement('span');
      span.className = 'letter' + (isHighlight ? ' highlight-letter' : '');
      span.textContent = char;
      span.setAttribute('aria-hidden', 'true');

      // Delay: primero por línea, luego por posición dentro de la línea
      // Cada letra tarda 60ms más que la anterior
      const baseDelay  = lineIdx * 0.5;   // 0s para línea 1, 0.5s para línea 2
      const charDelay  = charIdx * 0.07;  // 70ms entre letras
      span.style.animationDelay = `${baseDelay + charDelay}s`;

      line.appendChild(span);
    });

    // Añadir texto invisible accesible para lectores de pantalla
    const ariaSpan = document.createElement('span');
    ariaSpan.className = 'sr-only';
    ariaSpan.textContent = originalText;
    ariaSpan.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
    line.appendChild(ariaSpan);
  });
}


// ════════════════════════════════════════
// COUNTDOWN — 5 de Agosto 2026
// ════════════════════════════════════════
function initCountdown() {
  // Fecha de apertura: 5 de Agosto de 2026 a medianoche (hora local)
  const OPEN_DATE = new Date('2026-08-05T00:00:00');

  const elDays  = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins  = document.getElementById('cd-mins');
  const elSecs  = document.getElementById('cd-secs');
  const wrapper = document.querySelector('.countdown-wrapper');

  if (!elDays || !elHours || !elMins || !elSecs) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = new Date();
    const diff = OPEN_DATE - now;

    if (diff <= 0) {
      // ¡Ya abrió el servidor!
      if (wrapper) {
        wrapper.innerHTML = `
          <p class="countdown-label">◈ EL SERVIDOR ESTÁ ABIERTO ◈</p>
          <p class="countdown-open">¡ÚNETE AHORA!</p>
          <p class="countdown-date">BEDROCK EDITION · EN VIVO</p>
        `;
      }
      return; // Detener el interval
    }

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((diff % (1000 * 60)) / 1000);

    // Animar solo el número que cambió
    function updateEl(el, val) {
      const newVal = pad(val);
      if (el.textContent !== newVal) {
        el.textContent = newVal;
        el.classList.remove('tick');
        void el.offsetWidth; // reflow para reiniciar animación
        el.classList.add('tick');
      }
    }

    updateEl(elDays,  days);
    updateEl(elHours, hours);
    updateEl(elMins,  mins);
    updateEl(elSecs,  secs);
  }

  tick(); // Ejecutar inmediatamente
  setInterval(tick, 1000);
}


// ════════════════════════════════════════
// PARTÍCULAS CANVAS (bloques flotantes)
// ════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLORS = ['#4caf50','#795548','#607d8b','#ff9800','#1565c0','#f5c518','#9c27b0'];
  let particles = [];
  let raf;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function newParticle() {
    return {
      x:     Math.random() * canvas.width,
      y:     canvas.height + 10,
      size:  Math.random() * 5 + 2,
      speed: Math.random() * 0.5 + 0.2,
      drift: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.1,
      rot:   Math.random() * Math.PI * 2,
      rotV:  (Math.random() - 0.5) * 0.015,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (particles.length < 30 && Math.random() < 0.06) particles.push(newParticle());
    particles = particles.filter(p => p.y > -20 && p.alpha > 0.01);
    particles.forEach(p => {
      p.y    -= p.speed;
      p.x    += p.drift;
      p.rot  += p.rotV;
      p.alpha -= 0.0005;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.globalAlpha = Math.max(0, p.alpha * 0.3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size * 0.4, p.size * 0.4);
      ctx.restore();
    });
    raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    draw();
  }, { passive: true });
  draw();
}


// ════════════════════════════════════════
// NAVBAR
// ════════════════════════════════════════
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
}


// ════════════════════════════════════════
// SCROLL REVEAL
// ════════════════════════════════════════
function initScrollReveal() {
  const targets = document.querySelectorAll('.pre-animate');
  if (!targets.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter(c => c.classList.contains('pre-animate'));
        const idx = siblings.indexOf(el);
        setTimeout(() => {
          el.classList.remove('pre-animate');
          el.classList.add('animate-in');
        }, idx * 80);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  targets.forEach(t => obs.observe(t));
}


// ════════════════════════════════════════
// SONIDOS
// ════════════════════════════════════════
const audio = { unlocked: false, ctx: null, sounds: {} };

function initSoundSystem() {
  const unlock = () => {
    if (audio.unlocked) return;
    try {
      audio.ctx     = new (window.AudioContext || window.webkitAudioContext)();
      audio.unlocked = true;
      ['click', 'hover', 'pop', 'success'].forEach(n =>
        preloadSound(n, `assets/sounds/${n}.mp3`)
      );
      const banner = document.getElementById('audio-banner');
      if (banner) { banner.classList.add('hidden'); setTimeout(() => banner.remove(), 400); }
    } catch {}
  };
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('click',      unlock, { once: true });
  document.addEventListener('keydown',    unlock, { once: true });
  setupButtonSounds();
}

function preloadSound(name, url) {
  fetch(url)
    .then(r => r.ok ? r.arrayBuffer() : Promise.reject())
    .then(buf => audio.ctx.decodeAudioData(buf))
    .then(dec => { audio.sounds[name] = dec; })
    .catch(() => {}); // Silencioso si no hay archivo
}

function playSound(name, vol = 0.4) {
  if (!audio.unlocked || !audio.ctx || !audio.sounds[name]) return;
  try {
    const src  = audio.ctx.createBufferSource();
    const gain = audio.ctx.createGain();
    src.buffer      = audio.sounds[name];
    gain.gain.value = vol;
    src.connect(gain);
    gain.connect(audio.ctx.destination);
    src.start(0);
  } catch {}
}

function setupButtonSounds() {
  document.querySelectorAll('.mc-btn, button').forEach(el => {
    el.addEventListener('mouseenter',  () => playSound('hover', 0.3));
    el.addEventListener('touchstart',  () => playSound('hover', 0.3), { passive: true });
    el.addEventListener('click',       () => playSound('click', 0.5));
  });
  document.querySelectorAll('.rule-card').forEach(el => {
    el.addEventListener('mouseenter', () => playSound('pop', 0.2));
  });
}


// ════════════════════════════════════════
// FORMULARIO
// ════════════════════════════════════════
function initFormValidation() {
  const form      = document.getElementById('registration-form');
  const successEl = document.getElementById('success-message');
  if (!form) return;

  const nicknameInput = document.getElementById('input-nickname');
  const emailInput    = document.getElementById('input-email');
  const submitBtn     = form.querySelector('#btn-submit');

  const validators = {
    nickname: v => {
      if (!v.trim())              return { ok: false, msg: 'Ingresa tu Gamertag.' };
      if (v.length < 3)           return { ok: false, msg: 'Mínimo 3 caracteres.' };
      if (v.length > 16)          return { ok: false, msg: 'Máximo 16 caracteres.' };
      if (!/^[\w\s\-\.]+$/.test(v)) return { ok: false, msg: 'Caracteres no válidos.' };
      return { ok: true,  msg: '✓ Gamertag válido' };
    },
    email: v => {
      if (!v.trim())                              return { ok: false, msg: 'Ingresa tu correo.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, msg: 'Formato inválido.' };
      return { ok: true, msg: '✓ Correo válido' };
    },
  };

  function validateField(input, key) {
    const hint = input.parentElement.querySelector('.form-hint');
    const res  = validators[key](input.value);
    input.classList.toggle('error', !res.ok);
    input.classList.toggle('valid', res.ok && input.value.trim() !== '');
    if (hint && input.value.trim()) {
      hint.textContent = res.msg;
      hint.className = 'form-hint ' + (res.ok ? 'success-msg' : 'error-msg');
    }
    return res.ok;
  }

  nicknameInput?.addEventListener('input', () => validateField(nicknameInput, 'nickname'));
  emailInput?.addEventListener('input',    () => validateField(emailInput,    'email'));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const okN = validateField(nicknameInput, 'nickname');
    const okE = validateField(emailInput,    'email');

    if (!okN || !okE) return;

    submitBtn.disabled   = true;
    submitBtn.textContent = '⋯ VALIDANDO IDENTIDAD...';
    playSound('click', 0.5);

    try {
      const formData = new FormData(form);
      // Ensure gamertag is the key expected by the script
      formData.set('gamertag', nicknameInput.value);

      const res  = await fetch('https://script.google.com/macros/s/AKfycbxzCX0dM3Xtrc7Mk80YuQM-aiKB5AhnXsChBHz0KD3lDGIToWStbHUbg_R5Ki32A5RTgQ/exec', { 
        method: 'POST', 
        body: formData 
      });
      const data = await res.json();
      
      if (data.status === "success") {
        form.style.display = 'none';
        if (successEl) { successEl.classList.add('visible'); playSound('success', 0.6); }
      } else {
        throw new Error(data.message || "Error al registrar");
      }
    } catch (err) {
      submitBtn.disabled    = false;
      submitBtn.textContent = '▶ REINTENTAR';
      submitBtn.style.background = 'linear-gradient(180deg, #c0392b 0%, #922b21 100%)';
      
      const hint = nicknameInput.parentElement.querySelector('.form-hint');
      if (hint) {
        hint.textContent = err.message.includes('Gamertag') ? 'Gamertag no encontrado en Xbox Live.' : 'Hubo un error de conexión.';
        hint.className = 'form-hint error-msg';
        nicknameInput.classList.add('error');
      }
    }
  });
}


// ════════════════════════════════════════
// AUDIO BANNER
// ════════════════════════════════════════
function initAudioBanner() {
  document.getElementById('audio-banner')?.addEventListener('click', () => {
    document.dispatchEvent(new Event('click'));
  });
}

// Smooth scroll en links internos
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
