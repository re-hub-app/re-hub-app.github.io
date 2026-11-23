# Website downloads

The site reads the same-origin `/updates.json` with a five-second timeout and
no browser cache. Keep the desktop fields (`version`, `notes`, `url` and
optional `published`) and add an optional `downloads` object. See
[`test/updates.sample.json`](test/updates.sample.json) for the schema.

Supported keys: `macos`, `windows`, `linux-deb`, `linux-appimage`. Omit any
unavailable key. Each entry needs an absolute `https://` installer URL.
Labels fall back to the platform names; `size` is optional display text.
The top-level `url` supplies the HTTPS release page for “All files and
checksums.” On Linux the primary link prefers AppImage and falls back to
`.deb`; other known OSes only get their own primary link. All valid
installers are listed regardless of the visitor's OS.

With no usable installer, a failed request, or JavaScript disabled, the
existing status remains unchanged. The site does not probe asset URLs:
publish and verify the release page, checksums and all assets anonymously
**before** publishing the root manifest. Never use fixture URLs there.

## Local test

From the repo root, run the following and open `http://127.0.0.1:8105/#status`.
The dormant version should have no download links. Stop the server with
Ctrl-C before starting the active preview.

```sh
python3 -m http.server 8105 --bind 127.0.0.1
```

Make an ignored copy for active preview so the source root stays dormant:

```sh
mkdir -p test/local/active
cp index.html script.js styles.css test/local/active/
cp -R img fonts test/local/active/
cp test/updates.sample.json test/local/active/updates.json
python3 -m http.server 8105 --bind 127.0.0.1 --directory test/local/active
```

Reload the same URL. Inspect the links without following the intentionally
fake URLs. Use Chrome's user-agent override to check Windows, macOS, Linux
and an unknown OS. Clear any conflicting UA Client Hints when testing the
legacy UA fallback. Try a fixture with only an `http://` or `javascript:`
entry to check that the dormant state returns. Stop the server when done.
