# Anything Under The Sun Discount Calculator

The calculator is a single responsive PWA for desktop, iOS/iPadOS, and Android. It stores discount history and custom presets in the browser's local storage; records are not synced to a server.

## Deploy and install

For GitHub Pages, configure the repository to deploy the `main` branch from its root folder. This is a project site, so its URL is `https://careyow.github.io/AUTS_DiscountCalculator/`. The manifest start URL and service-worker resources are scoped to that repository subdirectory.

Service workers and offline storage require HTTPS or `localhost`; opening `index.html` directly as a `file://` URL is not supported. For local testing, serve the project over `localhost`.

Open the deployed site online and wait for the service worker to install and cache the app files and PDF dependencies. Reload once before going offline if the app was just installed. When a new service-worker version takes control, the app refreshes to load the updated files; if an older open tab does not refresh, reload or reopen it. App updates do not clear local history or preset storage.

### iPhone and iPad (Safari)

1. Open the HTTPS site in Safari.
2. Tap **Share**, then **Add to Home Screen**.
3. Keep **Open as Web App** enabled when that option is shown, then tap **Add**.
4. Launch the calculator from its Home Screen icon. After the first online load and service-worker installation, the app shell and PDF export dependencies are cached for offline use.

### Android (Chrome)

1. Open the HTTPS site in Chrome.
2. Choose **Install app** from the browser menu or accept Chrome's install prompt. If it is not offered, choose **Add to Home screen**.
3. Launch the calculator from the installed app icon. After the first online load and service-worker installation, the app shell and PDF export dependencies are cached for offline use.

Browser storage is local to the site's origin and device. Records saved from a `file://` copy or a different website origin do not automatically transfer to the GitHub Pages origin. Avoid private browsing and do not clear the browser's site data if you want to keep saved history and presets.

## Offline behavior

The service worker caches the app shell, manifest, logo, icons, locally hosted PDF libraries, and PDF font. Calculations, local history, and PDF generation are available offline after the first successful online load and service-worker installation. A newer deployment updates the versioned cache in `service-worker.js`; outdated app-shell caches are removed, while browser local storage is untouched.

Third-party assets are stored under `assets/vendor/`; their license notices are included alongside them.

## Test offline behavior

1. Open the HTTPS app while online and wait for its first load and service-worker installation to finish.
2. In Chrome/Edge DevTools, open **Application** → **Service Workers** and confirm the worker is activated. Under **Cache Storage**, confirm the `anything-under-the-sun-discount-calculator-v2` cache contains the app shell and PDF assets.
3. Reload once while online. Then enable **Network** → **Offline** in DevTools and reload the app URL.
4. Calculate a discount, enter a product name, select a preset, save a test record, open history, and restore the record.
5. Export the test history to PDF while still offline. Verify the PDF opens/downloads, then disable offline mode.

On a phone or tablet, complete the initial online load and installation first, then enable Airplane Mode and open the installed app. Test calculations, history, and PDF export. Use a disposable test history record if testing the Clear History action.
