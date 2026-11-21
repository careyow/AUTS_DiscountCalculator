# Anything Under The Sun Discount Calculator

The calculator is a single responsive PWA for desktop, iOS/iPadOS, and Android. It stores discount history and custom presets in the browser's local storage; records are not synced to a server.

## Deploy and install

Publish the project on GitHub Pages or another HTTPS host. Service workers and offline storage do not work when opening `index.html` directly as a `file://` URL. For local testing, serve the project over `localhost`.

Open the deployed site online and leave it open until the service worker finishes caching the app files and PDF dependencies. Reload once before going offline if the app was just installed.

### iPhone and iPad (Safari)

1. Open the HTTPS site in Safari.
2. Tap **Share**, then **Add to Home Screen**.
3. Keep **Open as Web App** enabled when that option is shown, then tap **Add**.
4. Launch the calculator from its Home Screen icon. After the first online load, the app shell and PDF export dependencies are cached for offline use.

### Android (Chrome)

1. Open the HTTPS site in Chrome.
2. Choose **Install app** from the browser menu or accept Chrome's install prompt. If it is not offered, choose **Add to Home screen**.
3. Launch the calculator from the installed app icon. After the first online load, the app shell and PDF export dependencies are cached for offline use.

Browser storage is local to the site's origin and device. Records saved from a `file://` copy or a different website origin do not automatically transfer to the GitHub Pages origin. Avoid private browsing and do not clear the browser's site data if you want to keep saved history and presets.

## Offline behavior

The service worker caches the app shell, logo, icons, locally hosted PDF libraries, and PDF font. Calculations, local history, and PDF generation are available offline after the first successful online load and service-worker installation. A newer deployment updates the cache version in `service-worker.js`.

Third-party assets are stored under `assets/vendor/`; their license notices are included alongside them.
