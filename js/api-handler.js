// ============================================
// API-HANDLER.JS — Minecraft Realm
// Carga skins para GRID y para HERO Story Mode
// ============================================
'use strict';

const CONFIG = {
  SHEETS_URL:   'https://docs.google.com/spreadsheets/d/10KVo7i0rDrW_yfSfzRpXJ5ny94ZhpilfLmw-a81QniI/gviz/tq?tqx=out:json',
  MAX_PLAYERS:  10,
  DEMO_PLAYERS: [],
};

const state = { players: [] };

// ── Skin Fallback Loader ──
function tryLoadSkin(img, nickname, size, onSuccess, onError) {
  const encName = encodeURIComponent(nickname);
  const sources = [
    `https://mc-heads.net/body/${encName}/${size}`,
    `https://mineatar.io/body/${encName}/${size}.png`,
    `https://cravatar.eu/helmavatar/${encName}/${size}.png`
  ];
  let attempt = 0;

  img.onload = onSuccess;
  img.onerror = () => {
    attempt++;
    if (attempt < sources.length) {
      img.src = sources[attempt];
    } else {
      if (onError) onError();
    }
  };
  // Iniciar la primera carga
  img.src = sources[0];
}

// ── Cargar datos de jugadores ────────────────────────
async function loadPlayers() {
  if (CONFIG.SHEETS_URL && !CONFIG.SHEETS_URL.includes('TU_URL')) {
    try {
      const res  = await fetch(CONFIG.SHEETS_URL, { cache: 'no-store' });
      const text = await res.text();
      const json = JSON.parse(
        text.replace(/^\/\*O_o\*\/\s*/, '')
            .replace(/^google\.visualization\.Query\.setResponse\(/, '')
            .replace(/\);?\s*$/, '')
      );
      state.players = (json.table?.rows || [])
        .map(r => ({ nickname: r.c[0]?.v || '', status: r.c[2]?.v || '' }))
        .filter(p => p.nickname && p.status === 'Aprobado');
      return;
    } catch {}
  }
  // Fallback: demo players
  state.players = CONFIG.DEMO_PLAYERS;
}

// ════════════════════════════════════════
// HERO — Personajes estilo Story Mode
// ════════════════════════════════════════
export async function initStoryHero() {
  await loadPlayers();

  const verified = state.players
    .filter(p => p.status === 'Aprobado')
    .slice(0, 10);

  // Los slots del hero tienen IDs char-0 .. char-9
  // El orden visual Story Mode:
  // Fila trasera: char-5, char-6, char-7, char-8, char-9
  // Fila frontal: char-0(side), char-1(near), char-2(center), char-3(near), char-4(side)
  // Cargamos los más verificados en las posiciones del frente primero
  const frontSlots = [2, 1, 3, 0, 4];    // center primero, luego near, luego sides
  const backSlots  = [7, 6, 8, 5, 9];

  const allOrder = [...frontSlots, ...backSlots];

  for (let i = 0; i < allOrder.length; i++) {
    const slotId = `char-${allOrder[i]}`;
    const slot   = document.getElementById(slotId);
    if (!slot) continue;

    if (i < verified.length) {
      loadHeroChar(slot, verified[i].nickname, i * 150);
    } else {
      // Slot vacío — mostrar silueta oscura
      slot.innerHTML = `<div class="char-empty"></div>`;
    }
  }
}

function loadHeroChar(slot, nickname, delay) {
  setTimeout(() => {
    const img = new Image();
    img.alt   = nickname;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;object-position:bottom;image-rendering:pixelated;';
    
    tryLoadSkin(img, nickname, 256, 
      () => {
        slot.innerHTML = '';
        slot.appendChild(img);
        slot.classList.add('loaded');
      },
      () => {
        // Fallback total
        img.src = 'https://mc-heads.net/body/MHF_Steve/256';
      }
    );
  }, delay);
}

// ════════════════════════════════════════
// GRID DE JUGADORES (sección #players)
// ════════════════════════════════════════
export async function initPlayerGrid() {
  // Players ya fueron cargados en initStoryHero, pero si se llama solo:
  if (!state.players.length) await loadPlayers();

  const verified = state.players
    .filter(p => p.status === 'Aprobado')
    .slice(0, CONFIG.MAX_PLAYERS);

  for (let i = 0; i < CONFIG.MAX_PLAYERS; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (!slot) continue;

    if (i < verified.length) {
      loadGridSlot(slot, verified[i].nickname);
    } else {
      slot.innerHTML = `<div class="slot-empty"></div>`;
    }
  }

  // Actualizar contador
  const countEl = document.querySelector('.player-counter .count');
  if (countEl) animateCounter(countEl, 0, verified.length, 1000);
}

function loadGridSlot(slot, nickname) {
  if (slot.dataset.loaded) return;
  
  const obs = new IntersectionObserver((entries, o) => {
    if (entries[0].isIntersecting) {
      if (slot.dataset.loaded) return;
      slot.dataset.loaded = 'true';
      
      const img = new Image();
      img.alt   = nickname;
      
      tryLoadSkin(img, nickname, 128,
        () => {
          slot.innerHTML = '';
          slot.appendChild(img);
          const tag = document.createElement('span');
          tag.className   = 'name-tag';
          tag.textContent = nickname;
          slot.appendChild(tag);
          slot.classList.add('loaded');
        },
        () => {
          slot.innerHTML = `<div class="slot-empty"></div>`;
        }
      );
      
      o.unobserve(slot);
    }
  }, { rootMargin: '100px' });
  obs.observe(slot);
  slot.innerHTML = `<div class="slot-empty"></div>`;
}

function animateCounter(el, from, to, duration) {
  const start = performance.now();
  (function step(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = `${Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)))} / 10 jugadores`;
    if (t < 1) requestAnimationFrame(step);
  })(performance.now());
}
