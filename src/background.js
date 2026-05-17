const ext = typeof browser !== 'undefined' ? browser : chrome;

const ACTIVE_RE = /^https?:\/\/((www|vm|vt|m)\.)?tiktok\.com\//i;

function setTabState(tabId, isActive) {
  if (!ext.action?.setBadgeText) return;
  ext.action.setBadgeBackgroundColor({ color: isActive ? '#10B981' : '#3F3F46', tabId });
  ext.action.setBadgeText({ text: isActive ? '' : '○', tabId });
  ext.action.setTitle({
    title: isActive ? 'TikGet — ready on this page' : 'TikGet — open a TikTok video',
    tabId
  });
}

function refreshTab(tabId) {
  ext.tabs.get(tabId, (tab) => {
    if (ext.runtime.lastError || !tab) return;
    setTabState(tabId, ACTIVE_RE.test(tab.url || ''));
  });
}

ext.tabs.onActivated.addListener(({ tabId }) => refreshTab(tabId));
ext.tabs.onUpdated.addListener((tabId, info) => {
  if (info.url || info.status === 'complete') refreshTab(tabId);
});

ext.runtime.onInstalled.addListener(({ reason }) => {
  ext.contextMenus.create({
    id: 'tk-download',
    title: 'Download with TikGet',
    contexts: ['link'],
    targetUrlPatterns: [
      '*://www.tiktok.com/*/video/*',
      '*://www.tiktok.com/t/*',
      '*://vm.tiktok.com/*',
      '*://tiktok.com/*/video/*'
    ]
  });

  if (reason === 'install') {
    ext.tabs.create({ url: ext.runtime.getURL('src/welcome.html') });
  }
});

ext.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'tk-download') return;
  ext.tabs.sendMessage(tab.id, { type: 'TK_CONTEXT_DOWNLOAD', url: info.linkUrl });
});

function sanitize(name) {
  const s = String(name ?? '').trim();
  return (s || 'download')
    .replace(/[^\w.\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'download';
}

ext.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'TK_DOWNLOAD') return false;

  const raw = String(msg.filename ?? '').replace(/^TikGet\//, '');
  const safeFile = sanitize(raw);
  const filename = `TikGet/${safeFile}`;

  ext.downloads.download(
    { url: msg.url, filename, saveAs: false, conflictAction: 'uniquify' },
    (downloadId) => {
      const err = ext.runtime.lastError;
      sendResponse(err ? { error: err.message } : { downloadId });
    }
  );

  return true;
});
