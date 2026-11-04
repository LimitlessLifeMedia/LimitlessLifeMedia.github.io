(() => {
'use strict';
const button = document.getElementById('one-more-night-listen');
const player = document.getElementById('one-more-night-player');
const status = document.getElementById('one-more-night-status');
if (!button || !player || !status) return;
let pending;
async function prepare() {
  if (player.src) return;
  if (pending) return pending;
  pending = (async () => {
    status.textContent = 'Loading One More Night…';
    button.disabled = true;
    const chunks = new Array(17);
    let next = 0;
    await Promise.all(Array.from({length:4}, async () => {
      while (next < 17) {
        const i = next++;
        const response = await fetch('assets/one-more-night/audio-' + String(i).padStart(2,'0') + '.txt');
        if (!response.ok) throw new Error('Audio download failed');
        const encoded = (await response.text()).trim();
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error('Invalid audio data');
        const binary = atob(encoded);
        const bytes = new Uint8Array(binary.length);
        for (let n = 0; n < binary.length; n++) bytes[n] = binary.charCodeAt(n);
        chunks[i] = bytes;
      }
    }));
    const size = chunks.reduce((sum,part) => sum+part.length,0);
    if (size !== 6109942) throw new Error('Incomplete audio download');
    const complete = new Uint8Array(size);
    let offset=0;
    chunks.forEach(part => { complete.set(part,offset); offset+=part.length; });
    const digest = await crypto.subtle.digest('SHA-256',complete);
    const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2,'0')).join('');
    if (hash !== '7d0477e5c8ddda6be18acab9da133dcaa1143e078eb92fa675d105a1a295d58f') throw new Error('Audio verification failed');
    player.src = URL.createObjectURL(new Blob([complete],{type:'audio/mpeg'}));
    player.hidden = false;
    player.load();
    status.textContent = 'Original single · 4:30';
  })();
  try { await pending; }
  catch (error) { pending = undefined; throw error; }
  finally { button.disabled = false; }
}
button.addEventListener('click', async () => {
  try {
    await prepare();
    if (!player.paused) player.pause();
    else {
      document.querySelectorAll('audio').forEach(other => { if (other !== player) other.pause(); });
      try { await player.play(); }
      catch { status.textContent = 'Ready — press play on the audio player below.'; }
    }
  } catch {
    status.textContent = 'The song could not load. Please tap Listen to retry.';
  }
});
player.addEventListener('play',()=> {
  button.textContent='Pause One More Night';
  button.setAttribute('aria-pressed','true');
  document.querySelectorAll('audio').forEach(other=>{ if(other!==player) other.pause(); });
});
function reset(){button.textContent='Listen to One More Night ▶';button.setAttribute('aria-pressed','false');}
player.addEventListener('pause',reset);
player.addEventListener('ended',reset);
document.querySelectorAll('audio').forEach(other=> {
 if(other!==player) other.addEventListener('play',()=>player.pause());
});
})();