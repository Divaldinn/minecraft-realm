# ⛏ Realm Bedrock — Página Web

Página web oficial del Realm de Minecraft Bedrock Edition. Desplegada en **GitHub Pages**.

---

## 🗂️ Estructura de Archivos

```
/
├── index.html              ← SPA principal (no tocar la estructura)
├── css/
│   ├── style.css           ← Diseño principal + mobile-first
│   └── animations.css      ← Todos los @keyframes CSS
├── js/
│   ├── main.js             ← Lógica: partículas, sonidos, formulario
│   └── api-handler.js      ← Carga de skins (Crafatar / mc-heads)
├── assets/
│   ├── sounds/             ← Añadir aquí: click.mp3, hover.mp3, pop.mp3, success.mp3
│   ├── fonts/              ← Añadir aquí: Minecraftia.ttf
│   └── icons/              ← SVGs ya incluidos inline en el HTML
└── README.md
```

---

## ⚙️ Configuración Requerida

Antes de publicar, edita estos valores en `index.html`:

### 1. Web3Forms (formulario de registro)
1. Ve a [web3forms.com](https://web3forms.com) y crea una cuenta gratuita
2. Obtén tu `access_key`
3. En `index.html`, reemplaza:
   ```html
   <input type="hidden" name="access_key" value="TU_API_KEY_AQUI" />
   ```

### 2. Links de comunidad
En el `<footer>`, reemplaza:
```html
href="URL_DISCORD"    → Tu link de invitación a Discord
href="URL_WHATSAPP"   → Tu link de grupo de WhatsApp
```

### 3. Nombre del Realm (opcional)
Busca `REALM BEDROCK` en todo el HTML y cámbialo por el nombre real de tu servidor.

---

## 🎵 Sonidos (opcional pero recomendado)

Agrega estos archivos en `assets/sounds/` para activar los efectos de sonido:

| Archivo | Cuándo suena |
|---|---|
| `click.mp3` | Al hacer click en botones |
| `hover.mp3` | Al pasar el mouse por botones |
| `pop.mp3` | Al pasar por tarjetas de reglas |
| `success.mp3` | Al enviar el formulario exitosamente |

> **Tip:** Descarga sonidos de la UI de Minecraft desde [minecraft.wiki](https://minecraft.wiki/w/Sounds.json) (busca `ui.button.click`). Asegúrate de que cada archivo pese **menos de 50kb**.

---

## 🖼️ Fuente Minecraft (opcional pero recomendado)

Para el aspecto pixel art auténtico:
1. Descarga `Minecraftia.ttf` desde [Dafont](https://www.dafont.com/minecraftia.font) o [itch.io](https://itch.io)
2. Colócala en `assets/fonts/Minecraftia.ttf`

Sin la fuente, el sitio sigue funcionando con `monospace` como fallback.

---

## 👥 Mostrar Jugadores Verificados

### Opción A: Lista manual (sin Google Sheets)
En `js/api-handler.js`, edita el array `DEMO_PLAYERS`:
```javascript
DEMO_PLAYERS: [
  { nickname: 'TuJugador1', status: 'Verificado' },
  { nickname: 'TuJugador2', status: 'Verificado' },
  // ... hasta 10 jugadores
],
```

### Opción B: Google Sheets automático
1. Crea un Google Sheet con columnas: `Nickname | Correo | Estado | Fecha`
2. Ve a **Archivo → Compartir → Publicar en la web**
3. Selecciona formato **JSON** y copia la URL
4. En `js/api-handler.js`, reemplaza:
   ```javascript
   SHEETS_URL: 'TU_URL_DE_GOOGLE_SHEETS_AQUI',
   ```

---

## 🚀 Publicar en GitHub Pages

1. Sube todos los archivos a tu repositorio de GitHub
2. Ve a **Settings → Pages**
3. En **Source**, selecciona `main` branch y carpeta `/` (raíz)
4. Haz clic en **Save**
5. Tu página estará en: `https://tu-usuario.github.io/nombre-repo/`

---

## 📱 Compatibilidad

| Navegador | Soporte |
|---|---|
| Chrome (Android/iOS) | ✅ Completo |
| Safari (iOS) | ✅ Completo |
| Firefox (Android) | ✅ Completo |
| Samsung Internet | ✅ Completo |

---

## ⚠️ Notas Importantes

- **Audio**: Los navegadores modernos bloquean el audio automático. El sistema de sonido se activa al **primer toque** del usuario (hay un banner en la esquina inferior derecha).
- **Skins Bedrock**: El sistema usa `mc-heads.net` para renderizar skins. Funciona con Gamertags de Java Edition. Para Bedrock puro, se recomienda conectar un backend que resuelva el XUID via Microsoft Graph API.
- **Crafatar**: La API de Crafatar requiere UUIDs. Si quieres integración nativa con Bedrock/Xbox, actualiza `buildSkinUrl()` en `api-handler.js`.

---

*Hecho con ❤️ para la comunidad Minecraft Bedrock*
