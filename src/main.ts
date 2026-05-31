import { AssetLoader } from './assets/AssetLoader';
import { Game } from './game/Game';

// Surface any uncaught errors to the loading screen so the user
// doesn't see a silent freeze.
window.addEventListener('error', (e) => {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = `ERROR: ${e.message}`;
  console.error('Uncaught error:', e.error);
});
window.addEventListener('unhandledrejection', (e) => {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = `ERROR: ${e.reason}`;
  console.error('Unhandled rejection:', e.reason);
});

async function main(): Promise<void> {
  const canvas      = document.getElementById('game-canvas') as HTMLCanvasElement;
  const loadBar     = document.getElementById('loading-bar') as HTMLElement;
  const loadText    = document.getElementById('loading-text') as HTMLElement;
  const loadScreen  = document.getElementById('loading-screen') as HTMLElement;

  // Prevent browser scroll/zoom on touch while playing
  canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove',  e => e.preventDefault(), { passive: false });

  // ── Phase 1: asset loading ──
  loadText.textContent = 'PREPARING MODELS...';
  loadBar.style.width  = '5%';

  const loader = new AssetLoader();
  await loader.loadCritical((pct) => {
    loadBar.style.width  = `${5 + Math.round(pct * 70)}%`;
    loadText.textContent = pct < 1
      ? `LOADING ASSETS... ${Math.round(pct * 100)}%`
      : 'BUILDING WORLD...';
  });

  // ── Phase 2: world / scene construction ──
  loadBar.style.width  = '80%';
  loadText.textContent = 'BUILDING WORLD...';

  // Yield to browser so it can paint the bar update before the
  // synchronous terrain geometry is built (blocks the main thread ~50 ms).
  await new Promise(r => setTimeout(r, 50));

  let game: Game;
  try {
    game = new Game(canvas);
  } catch (err) {
    loadText.textContent = `INIT ERROR: ${err}`;
    console.error(err);
    return;
  }

  loader.loadBackground();

  // ── Phase 3: ready ──
  loadBar.style.width  = '100%';
  loadText.textContent = 'READY';

  await new Promise(r => setTimeout(r, 350));

  loadScreen.classList.add('fade-out');
  await new Promise(r => setTimeout(r, 800));
  loadScreen.style.display = 'none';

  game!.start();
}

main().catch((err) => {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = `FATAL: ${err}`;
  console.error(err);
});
