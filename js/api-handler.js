// ============================================
// API-HANDLER.JS — Minecraft Realm
// Manejo de Crafatar API y carga de skins
// ============================================

'use strict';

// ── Configuración ──────────────────────────────────────
const CONFIG = {
  // Reemplaza con tu URL de Google Sheets publicado como JSON
  // Formato: https://docs.google.com/spreadsheets/d/TU_ID/gviz/tq?tqx=out:json&sheet=Jugadores
  SHEETS_URL: 'TU_URL_DE_GOOGLE_SHEETS_AQUI',

  // URL base de Crafatar para renders de cuerpo completo
  CRAFATAR_BASE: 'https://crafatar.com/renders/body',

  // Parámetros de Crafatar
  CRAFATAR_PARAMS: '?overlay&scale=4',

  // Cuántos jugadores mostrar en el grid
  MAX_PLAYERS: 10,

  // Nicknames de ejemplo para mostrar mientras no haya Google Sheets configurado
  // ¡Cámbialos por los de tus jugadores reales!
  DEMO_PLAYERS: [
    // Estos son nombres de Java Edition para demostración visual.
    // Para Bedrock, el sistema usa el Gamertag de Xbox.
    { nickname: 'Notch',    status: 'Verificado' },
    { nickname: 'jeb_',     status: 'Verificado' },
    { nickname: 'Dream',    status: 'Verificado' },
    { nickname: 'Technoblade', status: 'Verificado' },
    { nickname: 'Dinnerbone',  status: 'Verificado' },
  ],
};

// ── Estado global ──────────────────────────────────────
const state = {
  players: [],
  loadedCount: 0,
};

// ── Inicialización ──────────────────────────────────────
export async function initPlayerGrid() {
  try {
    // 1. Intentar cargar desde Google Sheets
    if (CONFIG.SHEETS_URL && !CONFIG.SHEETS_URL.includes('TU_URL')) {
      state.players = await fetchFromSheets();
    } else {
      // Usar datos de demostración si no hay Sheets configurado
      console.info('[Realm] Usando jugadores de demostración. Configura SHEETS_URL para datos reales.');
      state.players = CONFIG.DEMO_PLAYERS;
    }

    // 2. Renderizar los slots
    await renderPlayerSlots();

    // 3. Actualizar contador
    updatePlayerCounter(state.players.length);

  } catch (err) {
    console.error('[Realm] Error al cargar jugadores:', err);
    // Fallback: mostrar demos si todo falla
    state.players = CONFIG.DEMO_PLAYERS;
    await renderPlayerSlots();
  }
}

// ── Fetch desde Google Sheets ──────────────────────────
async function fetchFromSheets() {
  const response = await fetch(CONFIG.SHEETS_URL, {
    mode: 'cors',
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const text = await response.text();

  // Google Sheets devuelve JSONP, hay que limpiar el prefijo
  // Formato: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const jsonText = text
    .replace(/^\/\*O_o\*\/\s*/, '')
    .replace(/^google\.visualization\.Query\.setResponse\(/, '')
    .replace(/\);?\s*$/, '');

  const data = JSON.parse(jsonText);
  const rows = data.table?.rows || [];

  // Mapear filas: col 0 = Nickname, col 1 = Correo, col 2 = Estado
  return rows
    .map(row => ({
      nickname: row.c[0]?.v || '',
      correo:   row.c[1]?.v || '',
      status:   row.c[2]?.v || 'Pendiente',
    }))
    .filter(p => p.nickname && p.status === 'Verificado');
}

// ── Renderizar slots de skins ──────────────────────────
async function renderPlayerSlots() {
  const verifiedPlayers = state.players
    .filter(p => p.status === 'Verificado')
    .slice(0, CONFIG.MAX_PLAYERS);

  for (let i = 0; i < CONFIG.MAX_PLAYERS; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (!slot) continue;

    if (i < verifiedPlayers.length) {
      const player = verifiedPlayers[i];
      // Carga lazy: solo si está en el viewport o cerca
      loadSkinWhenVisible(slot, player.nickname, i);
    } else {
      // Slot vacío
      setEmptySlot(slot);
    }
  }
}

// ── Carga lazy con IntersectionObserver ───────────────
function loadSkinWhenVisible(slot, nickname, index) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadSkin(slot, nickname);
          obs.unobserve(slot);
        }
      });
    },
    { rootMargin: '100px', threshold: 0 }
  );
  observer.observe(slot);

  // Placeholder mientras carga
  slot.innerHTML = `
    <span class="empty-icon" aria-hidden="true">⋯</span>
    <span class="name-tag">${escapeHtml(nickname)}</span>
  `;
}

// ── Cargar una skin específica ─────────────────────────
async function loadSkin(slot, nickname) {
  return new Promise(resolve => {
    // Crafatar usa UUIDs para Java. Para Bedrock con el gamertag,
    // usamos un proxy que resuelve el UUID via API de Mojang.
    // Si el jugador es Bedrock, se intenta con el gamertag directamente.
    const skinUrl = buildSkinUrl(nickname);

    const img = new Image();
    img.alt = nickname;
    img.loading = 'lazy';
    img.decoding = 'async';

    img.onload = () => {
      // Limpiar slot y mostrar skin
      slot.innerHTML = '';
      slot.appendChild(img);

      // Añadir name tag
      const nameTag = document.createElement('span');
      nameTag.className = 'name-tag';
      nameTag.textContent = nickname;
      slot.appendChild(nameTag);

      slot.classList.add('loaded');
      slot.setAttribute('aria-label', `Jugador: ${nickname}`);

      // Efecto de brillo al cargar
      triggerPickupEffect(slot);

      state.loadedCount++;
      resolve(true);
    };

    img.onerror = () => {
      // Si falla la carga, mostrar silueta de Steve
      setFallbackSkin(slot, nickname);
      resolve(false);
    };

    img.src = skinUrl;
  });
}

// ── Construir URL de skin ──────────────────────────────
function buildSkinUrl(nickname) {
  // Crafatar acepta UUIDs. Como alternativa directa para demos,
  // usamos el endpoint de Minotar que acepta nombres directamente.
  // Para producción con Bedrock, se recomienda resolver el XUID via tu Apps Script.
  return `https://mc-heads.net/body/${encodeURIComponent(nickname)}/128`;
}

// ── Slot vacío ─────────────────────────────────────────
function setEmptySlot(slot) {
  slot.innerHTML = `<span class="empty-icon" aria-hidden="true">?</span>`;
  slot.classList.remove('loaded');
  slot.removeAttribute('aria-label');
}

// ── Fallback (skin por defecto) ────────────────────────
function setFallbackSkin(slot, nickname) {
  // Usar la skin de Steve como fallback
  const img = document.createElement('img');
  img.src = 'https://mc-heads.net/body/MHF_Steve/128';
  img.alt = nickname;
  img.style.opacity = '0.4';

  slot.innerHTML = '';
  slot.appendChild(img);

  const nameTag = document.createElement('span');
  nameTag.className = 'name-tag';
  nameTag.textContent = nickname;
  slot.appendChild(nameTag);

  slot.classList.add('loaded');
}

// ── Efecto visual de "item pickup" ─────────────────────
function triggerPickupEffect(slot) {
  slot.style.animation = 'itemPickup 0.6s ease-out, skinAppear 0.5s ease-out';
  setTimeout(() => { slot.style.animation = ''; }, 700);
}

// ── Actualizar contador de jugadores ───────────────────
export function updatePlayerCounter(count) {
  const countEl = document.querySelector('.player-counter .count');
  if (!countEl) return;

  // Animación de conteo
  animateCounter(countEl, 0, count, 1200);
}

function animateCounter(el, from, to, duration) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(from + (to - from) * eased);
    el.textContent = `${current} / ${CONFIG.MAX_PLAYERS} jugadores`;

    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ── Utilidades ─────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Exportar para uso en main.js ───────────────────────
export { CONFIG, state };
