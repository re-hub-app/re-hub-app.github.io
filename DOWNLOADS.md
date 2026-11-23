# Website downloads

The site reads the same-origin `/updates.json` with a five-second timeout and
no browser cache. Keep the desktop fields (`version`, `notes`, `url` and
optional `published`) and add an optional `downloads` object. See
[`test/updates.sample.json`](test/updates.sample.json) for the schema.

Supported keys: `macos`, `windows`, `linux-deb`, `linux-appimage`. Omit any
unavailable key. Each entry needs an absolute `https://` installer URL.
Use `label` for the system requirements and architecture, and `size` for
optional display text. The top-level `url` supplies the HTTPS release page
for release notes, all files and `SHA256SUMS.txt`. There is one card per
available platform. A detected platform is recommended when it has an
installer. Linux lists both formats together, with AppImage emphasized
when both are available.

With no usable installer, a failed request, or JavaScript disabled, the
existing status remains unchanged. The site does not probe asset URLs:
publish and verify the release page, checksums and all assets anonymously
**before** publishing the root manifest. Never use fixture URLs there.
Review the macOS and Windows install advisories in `script.js` if signing or
notarisation changes in a later release.

## Local test

From the repo root, run the following and open `http://127.0.0.1:8105/#status`.
The download section appears if the checkout has a usable `updates.json`.
Stop the server with Ctrl-C before trying the isolated preview.

```sh
python3 -m http.server 8105 --bind 127.0.0.1
```

Make an ignored copy to test both states without editing the published
manifest. With no `updates.json` in this new directory, the page stays dormant:

```sh
mkdir -p test/local/active
cp index.html script.js styles.css test/local/active/
cp -R img fonts licenses test/local/active/
python3 -m http.server 8105 --bind 127.0.0.1 --directory test/local/active
```

While serving the copy, add the fake fixture with
`cp test/updates.sample.json test/local/active/updates.json`. Reload and
inspect the links without following the fake URLs. Test Windows, macOS,
Linux and an unknown OS by setting both the UA and the UA Client Hints
platform. Try a fixture with only an `http://` or `javascript:` entry to
check that the dormant state returns. Stop the server when done.
