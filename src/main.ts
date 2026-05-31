import { AssetLoader } from './assets/AssetLoader';
import { Game } from './game/Game';

async function main(): Promise<void> {
  const canvas   = document.getElementById('game-canvas') as HTMLCanvasElement;
  const loadBar  = document.getElementById('loading-bar') as HTMLElement;
  const loadText = document.getElementById('loading-text') as HTMLElement;
  const loadScreen = document.getElementById('loading-screen') as HTMLElement;

  // Prevent default touch behaviors on the canvas
  canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove',  e => e.preventDefault(), { passive: false });

  // Load critical assets
  loadText.textContent = 'LOADING ASSETS...';
  const loader = new AssetLoader();

  await loader.loadCritical((pct) => {
    loadBar.style.width = `${Math.round(pct * 85)}%`;
    loadText.textContent = `LOADING ASSETS... ${Math.round(pct * 85)}%`;
  });

  loadBar.style.width = '95%';
  loadText.textContent = 'BUILDING WORLD...';

  // Small delay so the bar animation is visible
  await new Promise(r => setTimeout(r, 200));

  // Instantiate game (builds world, spawns enemies, sets up HUD)
  const game = new Game(canvas);
  loader.loadBackground(); // non-critical assets continue in background

  loadBar.style.width = '100%';
  loadText.textContent = 'READY';
  await new Promise(r => setTimeout(r, 400));

  // Fade out loading screen
  loadScreen.classList.add('fade-out');
  await new Promise(r => setTimeout(r, 800));
  loadScreen.style.display = 'none';

  game.start();
}

main().catch(console.error);
