# TikGet — TikTok Downloader (No Watermark)

> Browser extension to download TikTok videos in HD without the watermark. MP4 or MP3 audio, one click.

<p align="center">
  <img src="assets/icon-128.png" width="96" alt="TikGet icon" />
</p>

<p align="center">
  <a href="https://github.com/khaledq84ever/tiktok-extension/releases/latest"><img src="https://img.shields.io/github/v/release/khaledq84ever/tiktok-extension?label=version&color=EE1D52" alt="Latest release"/></a>
  <img src="https://img.shields.io/badge/Manifest-V3-EE1D52" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Firefox-supported-EE1D52" alt="Supported browsers" />
  <img src="https://img.shields.io/badge/WCAG-AA-10B981" alt="WCAG AA verified" />
</p>

---

## Features

- **No watermark** on any download (HD or SD)
- **Auto download buttons** on every video while you browse TikTok
- **Right-click any link** → "Download with TikGet"
- **Three formats**: HD MP4, SD MP4 (faster), MP3 audio
- **Settings drawer**: in-page toggle, filename template, default quality
- **API status pill** shows backend health (online / slow / offline)
- **Light + dark mode** (auto-follows your OS)
- **Full keyboard navigation** + screen-reader labels
- **Zero build step** — pure vanilla JS + CSS

## Install (Developer Mode)

1. Download the latest release zip from [Releases](https://github.com/khaledq84ever/tiktok-extension/releases/latest) **or** `git clone` this repo
2. Open `chrome://extensions` (Chrome / Edge / Brave) or `about:debugging` (Firefox)
3. Enable **Developer mode**
4. Click **Load unpacked** → pick the extension folder

Works on Chrome 109+, Edge 109+, Firefox 121+, Brave, Opera, and any other Chromium-based browser.

## Tech

| Layer | Used |
|---|---|
| Spec | Manifest V3 |
| UI | Vanilla HTML / CSS / ES modules (no build) |
| Fonts | Inter Variable + Space Grotesk (Google Fonts) |
| Backend | [`ravishing-acceptance-production-f209.up.railway.app`](https://ravishing-acceptance-production-f209.up.railway.app) — Flask + yt-dlp |
| A11y | WCAG AA contrast verified, `prefers-reduced-motion` respected |

## Filename templates

In the settings drawer, customize how downloads are named:

```
{uploader}_{title}     →  user123_dance_challenge
{title}                →  dance_challenge
{uploader}_{id}        →  user123_7234829374
```

## Credits

Programmed by **[@KhaledQ84Ever](https://x.com/KhaledQ84Ever)** · made with ♥ in Kuwait
