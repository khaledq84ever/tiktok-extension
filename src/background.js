const ext = typeof browser !== 'undefined' ? browser : chrome;

ext.runtime.onInstalled.addListener(() => {
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
});

ext.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'tk-download') return;
  ext.tabs.sendMessage(tab.id, { type: 'TK_CONTEXT_DOWNLOAD', url: info.linkUrl });
});

function sanitize(name) {
  return (name || 'download')
    .replace(/[^\w.\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'download';
}

ext.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'TK_DOWNLOAD') return false;

  const safeFile = sanitize(msg.filename.replace('TikGet/', ''));
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
