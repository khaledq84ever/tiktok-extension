const ext = typeof browser !== 'undefined' ? browser : chrome;

const API = 'https://ravishing-acceptance-production-f209.up.railway.app';

const DOWNLOAD_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

const VIDEO_RE = /\/(@[^/]+\/video\/\d+|t\/\w+|v\/\d+)/;

function getVideoUrl(item) {
  const link = item.querySelector('a[href*="/video/"], a[href*="/t/"]');
  if (link) {
    const href = link.getAttribute('href') || '';
    if (VIDEO_RE.test(href)) {
      return href.startsWith('http') ? href.split('?')[0] : `https://www.tiktok.com${href.split('?')[0]}`;
    }
  }
  if (VIDEO_RE.test(location.pathname)) {
    return `https://www.tiktok.com${location.pathname}`;
  }
  return null;
}

function hasVideo(item) {
  return item.querySelector('video') !== null;
}

function alreadyInjected(item) {
  return item.querySelector('.tk-wrap') !== null;
}

async function apiPost(path, body) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function pollStatus(jobId) {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 500));
    const r = await fetch(`${API}/status/${jobId}`);
    const d = await r.json();
    if (d.status === 'done') return d;
    if (d.status === 'error') return null;
  }
  return null;
}

function sanitize(name) {
  return (name || 'download')
    .replace(/[^\w.\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'download';
}

function triggerDownload(jobId, filename) {
  const url = `${API}/download/${jobId}`;
  const safeFile = `TikGet/${sanitize(filename)}`;

  return new Promise((resolve) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(); } };

    try {
      ext.runtime.sendMessage(
        { type: 'TK_DOWNLOAD', url, filename: safeFile },
        () => {
          if (ext.runtime.lastError) iframeFallback(url);
          done();
        }
      );
    } catch (_) {
      iframeFallback(url);
      done();
    }

    setTimeout(() => {
      if (!settled) { iframeFallback(url); done(); }
    }, 4000);
  });
}

function iframeFallback(url) {
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', '');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 2000);
}

async function handleDownload(videoUrl, format, quality, btn, label) {
  btn.disabled = true;
  btn.classList.add('tk-loading');
  btn.innerHTML = `<span class="tk-spinner"></span>${label}ing…`;

  try {
    const info = await apiPost('/info', { url: videoUrl });
    if (info.error) throw new Error(info.error);

    const startData = await apiPost('/start', {
      url: info.url || videoUrl,
      title: info.title || 'tiktok',
      format,
      quality
    });
    if (startData.error) throw new Error(startData.error);

    const result = await pollStatus(startData.job_id);
    if (!result) throw new Error('Processing failed');

    await triggerDownload(startData.job_id, result.filename);

    btn.classList.remove('tk-loading');
    btn.classList.add('tk-done');
    btn.innerHTML = `${DOWNLOAD_ICON} Saved!`;
    setTimeout(() => {
      btn.classList.remove('tk-done');
      btn.disabled = false;
      btn.innerHTML = `${DOWNLOAD_ICON} ${label}`;
    }, 3000);
  } catch (err) {
    btn.classList.remove('tk-loading');
    btn.classList.add('tk-error');
    btn.innerHTML = `✕ ${err.message.slice(0, 28)}`;
    btn.disabled = false;
    setTimeout(() => {
      btn.classList.remove('tk-error');
      btn.innerHTML = `${DOWNLOAD_ICON} ${label}`;
    }, 4000);
  }
}

function buildWrap(videoUrl) {
  const wrap = document.createElement('div');
  wrap.className = 'tk-wrap';

  const hdBtn = document.createElement('button');
  hdBtn.className = 'tk-btn';
  hdBtn.innerHTML = `${DOWNLOAD_ICON} HD MP4`;
  hdBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    handleDownload(videoUrl, 'mp4', 'hd', hdBtn, 'HD MP4');
  });
  wrap.appendChild(hdBtn);

  const mp3Btn = document.createElement('button');
  mp3Btn.className = 'tk-btn tk-btn-alt';
  mp3Btn.innerHTML = `${DOWNLOAD_ICON} MP3`;
  mp3Btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    handleDownload(videoUrl, 'mp3', 'hd', mp3Btn, 'MP3');
  });
  wrap.appendChild(mp3Btn);

  return wrap;
}

function injectFeedItem(item) {
  if (alreadyInjected(item)) return;
  if (!hasVideo(item)) return;

  const videoUrl = getVideoUrl(item);
  if (!videoUrl) return;

  const wrap = buildWrap(videoUrl);
  const actions = item.querySelector('[class*="action-bar"], [data-e2e="like-icon"]')?.closest('div');
  if (actions) {
    actions.insertAdjacentElement('afterend', wrap);
  } else {
    item.appendChild(wrap);
  }
}

function ensureVideoPageFab() {
  if (!VIDEO_RE.test(location.pathname)) return;
  if (document.querySelector('.tk-fab')) return;

  const url = `https://www.tiktok.com${location.pathname}`;
  const fab = document.createElement('div');
  fab.className = 'tk-fab';
  fab.appendChild(buildWrap(url));
  document.body.appendChild(fab);
}

const FEED_SELECTORS = [
  '[data-e2e="recommend-list-item-container"]',
  '[data-e2e="feed-video"]',
  'div[class*="DivItemContainer"]',
  'article'
];

function scanFeed() {
  FEED_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(item => {
      if (!alreadyInjected(item) && hasVideo(item)) injectFeedItem(item);
    });
  });
  ensureVideoPageFab();
}

ext.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TK_CONTEXT_DOWNLOAD') {
    const tmp = document.createElement('button');
    tmp.style.position = 'fixed';
    tmp.style.top = '14px';
    tmp.style.right = '14px';
    tmp.style.zIndex = '999999';
    tmp.className = 'tk-btn tk-btn-fab';
    tmp.innerHTML = `${DOWNLOAD_ICON} Starting…`;
    document.body.appendChild(tmp);
    handleDownload(msg.url, 'mp4', 'hd', tmp, 'Done');
    setTimeout(() => tmp.remove(), 6000);
  }
});

let debounceTimer = null;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(scanFeed, 200);
});
observer.observe(document.body, { childList: true, subtree: true });

setInterval(scanFeed, 2500);
scanFeed();
