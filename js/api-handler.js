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
async function tryLoadSkin(img, nickname, size, onSuccess, onError) {
  const encName = encodeURIComponent(nickname);
  const javaSources = [
    `https://mc-heads.net/body/${encName}/${size}`,
    `https://mineatar.io/body/${encName}/${size}.png`,
    `https://cravatar.eu/helmavatar/${encName}/${size}.png`
  ];
  let attempt = 0;

  const tryJavaFallbacks = () => {
    img.onload = onSuccess;
    img.onerror = () => {
      attempt++;
      if (attempt < javaSources.length) {
        img.src = javaSources[attempt];
      } else {
        if (onError) onError();
      }
    };
    img.src = javaSources[0];
  };

  // Intentar cargar la skin de Bedrock primero dibujándola en un canvas 2D
  try {
    const res = await fetch(`https://api.geysermc.org/v2/xbox/xuid/${encName}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!data.xuid) throw new Error();

    const skinImg = new Image();
    skinImg.crossOrigin = 'Anonymous';
    skinImg.onload = () => {
      if (skinImg.width !== 64) { tryJavaFallbacks(); return; }
      const cvs = document.createElement('canvas');
      cvs.width = 16; cvs.height = 32;
      const ctx = cvs.getContext('2d');
      // Cabeza
      ctx.drawImage(skinImg, 8, 8, 8, 8, 4, 0, 8, 8);
      ctx.drawImage(skinImg, 40, 8, 8, 8, 4, 0, 8, 8);
      // Cuerpo
      ctx.drawImage(skinImg, 20, 20, 8, 12, 4, 8, 8, 12);
      if (skinImg.height >= 64) ctx.drawImage(skinImg, 20, 36, 8, 12, 4, 8, 8, 12);
      // Brazo Derecho
      ctx.drawImage(skinImg, 44, 20, 4, 12, 0, 8, 4, 12);
      if (skinImg.height >= 64) ctx.drawImage(skinImg, 44, 36, 4, 12, 0, 8, 4, 12);
      // Brazo Izquierdo
      if (skinImg.height >= 64) {
        ctx.drawImage(skinImg, 36, 52, 4, 12, 12, 8, 4, 12);
        ctx.drawImage(skinImg, 52, 52, 4, 12, 12, 8, 4, 12);
      } else {
        ctx.drawImage(skinImg, 44, 20, 4, 12, 12, 8, 4, 12);
      }
      // Pierna Derecha
      ctx.drawImage(skinImg, 4, 20, 4, 12, 4, 20, 4, 12);
      if (skinImg.height >= 64) ctx.drawImage(skinImg, 4, 36, 4, 12, 4, 20, 4, 12);
      // Pierna Izquierda
      if (skinImg.height >= 64) {
        ctx.drawImage(skinImg, 20, 52, 4, 12, 8, 20, 4, 12);
        ctx.drawImage(skinImg, 4, 52, 4, 12, 8, 20, 4, 12);
      } else {
        ctx.drawImage(skinImg, 4, 20, 4, 12, 8, 20, 4, 12);
      }
      img.onload = onSuccess;
      img.onerror = tryJavaFallbacks;
      img.src = cvs.toDataURL('image/png');
    };
    skinImg.onerror = tryJavaFallbacks;
    skinImg.src = `https://api.geysermc.org/v2/skin/${data.xuid}`;
  } catch (e) {
    tryJavaFallbacks();
  }
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
        .map(r => ({ 
          nickname: r.c[1]?.v || '', 
          status: r.c[2]?.v || '',
          customSkin: r.c[3]?.v || '' 
        }))
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
      const p = verified[i];
      loadHeroChar(slot, p.nickname, p.customSkin, i * 150);
    } else {
      // Slot vacío — mostrar silueta oscura
      slot.innerHTML = `<div class="char-empty"></div>`;
    }
  }
}

function loadHeroChar(slot, nickname, customSkin, delay) {
  setTimeout(() => {
    const img = new Image();
    img.alt   = nickname;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;object-position:bottom;image-rendering:pixelated;';
    
    if (customSkin && customSkin.startsWith('http')) {
      img.src = customSkin;
      img.onload = () => {
        slot.innerHTML = '';
        const a = document.createElement('a');
        a.href = `https://bedrockviewer.com/profile/${encodeURIComponent(nickname)}`;
        a.target = '_blank';
        a.style.cssText = 'display:block;width:100%;height:100%;';
        a.appendChild(img);
        slot.appendChild(a);
        slot.classList.add('loaded');
      };
      img.onerror = () => { img.src = 'https://mc-heads.net/body/MHF_Steve/256'; };
    } else {
      tryLoadSkin(img, nickname, 256, 
        () => {
          slot.innerHTML = '';
          const a = document.createElement('a');
          a.href = `https://bedrockviewer.com/profile/${encodeURIComponent(nickname)}`;
          a.target = '_blank';
          a.style.cssText = 'display:block;width:100%;height:100%;';
          a.appendChild(img);
          slot.appendChild(a);
          slot.classList.add('loaded');
        },
        () => {
          // Fallback total
          img.src = 'https://mc-heads.net/body/MHF_Steve/256';
        }
      );
    }
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
      const p = verified[i];
      loadGridSlot(slot, p.nickname, p.customSkin);
    } else {
      slot.innerHTML = `<div class="slot-empty"></div>`;
    }
  }

  // Actualizar contador
  const countEl = document.querySelector('.player-counter .count');
  if (countEl) animateCounter(countEl, 0, verified.length, 1000);
}

function loadGridSlot(slot, nickname, customSkin) {
  if (slot.dataset.loaded) return;
  
  const obs = new IntersectionObserver((entries, o) => {
    if (entries[0].isIntersecting) {
      if (slot.dataset.loaded) return;
      slot.dataset.loaded = 'true';
      
      const img = new Image();
      img.alt   = nickname;
      
      const onSuccess = () => {
        slot.innerHTML = '';
        const a = document.createElement('a');
        a.href = `https://bedrockviewer.com/profile/${encodeURIComponent(nickname)}`;
        a.target = '_blank';
        a.style.cssText = 'display:block;width:100%;height:100%;text-decoration:none;';
        a.appendChild(img);
        
        const tag = document.createElement('span');
        tag.className   = 'name-tag';
        tag.textContent = nickname;
        a.appendChild(tag);
        
        slot.appendChild(a);
        slot.classList.add('loaded');
      };
      
      if (customSkin && customSkin.startsWith('http')) {
        img.src = customSkin;
        img.onload = onSuccess;
        img.onerror = () => { slot.innerHTML = `<div class="slot-empty"></div>`; };
      } else {
        tryLoadSkin(img, nickname, 128, onSuccess,
          () => {
            slot.innerHTML = `<div class="slot-empty"></div>`;
          }
        );
      }
      
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
