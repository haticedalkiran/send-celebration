# Send Celebration for Gmail

Arcade fireworks, sound and score whenever a Gmail message is sent. No data collected, no network calls.

**[Live demo](https://haticedalkiran.github.io/send-celebration/store/demo/live.html)**: click Send on a fake mail page and see the real effect. Add `?theme=synthwave`, `gameboy` or `casino` to try other themes.

## Setup
1. `npm install && npm run build`
2. Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → select this folder.
3. Open Gmail (reload the tab) and send a mail.

No third-party SDK, no network calls. The only permission is `storage`; the content script runs on mail.google.com.
Send detection lives in `src/detector.js`: it watches Gmail's Send button (click or Ctrl/Cmd+Enter) and celebrates once the compose closes.
Debug: in the Gmail tab console run `localStorage.setItem('gscDebug','1')`, reload, and watch `[send-celebration]` logs.

## Test checklist
- Send button, Ctrl+Enter → effect fires
- Click Undo right after sending → no effect
- Failed send (offline) → no effect
- Scheduled send → verify when it fires (InboxSDK behavior to confirm)
- During the effect, clicking/typing in Gmail works; canvas gone after ~2.5s
- DevTools Network: no requests from the extension

## Game layer
- Score: 100 points x combo multiplier (max x5). Combo = sends within 2 minutes of each other.
- Ranks by total sent: 0 / 10 / 50 / 100 / 250 / 500. Daily goal (default 10) triggers "MISSION COMPLETE!".
- Badges: first send, early bird, night owl, ten a day, combo x5, century, lucky strike. 2% jackpot chance per send.
- Themes: arcade, synthwave, gameboy, casino, random. Settings and stats page: extension Options.
- Every confirmed send is celebrated.
- Stats live in chrome.storage.local, settings in chrome.storage.sync. Nothing leaves the browser.

Store listing and privacy policy drafts live in `store/`.

## License
MIT, see `LICENSE`. Bundled third-party software: see `THIRD-PARTY-NOTICES.txt`.
