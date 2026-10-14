# Chrome Web Store listing: Send Celebration for Gmail

## Name
Send Celebration for Gmail

## Summary (max 132 chars)
Arcade-style fireworks, sound and score every time you send an email. Not affiliated with Google.

## Category
Fun (alternative: Productivity)

## Language
English

## Detailed description
Make sending email feel like winning.

Every time you send a message in Gmail, Send Celebration for Gmail plays a short arcade-style victory: pixel fireworks, a chiptune jingle and a big retro message. Small win, every send.

WHAT YOU GET
- Pixel fireworks and chunky retro messages in four themes: Arcade, Synthwave, Game Boy and Neon Casino (or Random)
- Chiptune sounds synthesized on your device, with volume control and quiet hours
- A tiny game layer: score, combos for rapid sends, ranks from Rookie to Inbox Overlord, a daily send goal and collectible badges
- Messages that match the moment: "COMBO x3!", "HALFWAY THERE!", "MISSION COMPLETE!", "LEVEL UP!" and the occasional rare JACKPOT
- Respects "reduce motion": with that system setting on, you get only the message, no animation
- Options page to tune everything and see your stats and badges

PRIVACY FIRST
- It never reads your emails, recipients, subjects or inbox
- No account, no analytics, no tracking, no network requests
- Settings and stats stay in your browser

HOW IT WORKS
The extension runs on mail.google.com and only notices when you press Send (or Ctrl/Cmd+Enter) and Gmail closes the compose window. Nothing is sent anywhere.

KNOWN LIMITS
- Works in Gmail on the web (Chrome and Chromium-based browsers)
- Scheduled sends are not celebrated yet
- If you undo a send right after it, the celebration has already played

Send Celebration for Gmail is an independent project and is not affiliated with, endorsed by or sponsored by Google. Gmail is a trademark of Google LLC.

Credits: Press Start 2P font (SIL OFL 1.1), canvas-confetti (ISC).

## Single purpose
Show a short celebration (visual effect, sound and score) when the user sends an email in Gmail on the web.

## Permission justifications
- storage: Saves the user's settings (theme, sound, volume, quiet hours, daily goal) and local game stats (score, level, badges). No email content is stored.
- Host access to https://mail.google.com/*: The content script runs on Gmail to detect that the user pressed Send and that the compose window closed, so the celebration can play. It does not read or transmit email content.
- Remote code: None. All code, fonts and assets are packaged with the extension.

## Privacy practices tab answers
- Data collected: none (leave every data-type box unchecked)
- Certify: data not sold to third parties; not used or transferred for purposes unrelated to the single purpose; not used for creditworthiness or lending
- Privacy policy URL: host store/privacy-policy.md publicly (GitHub Pages, Gist, Notion) and paste the link

## Assets to prepare
- Icon 128x128: icons/icon128.png (done)
- Screenshots 1280x800 (1 to 5): the celebration effect in four themes, the options page, the stats and badges, a combo moment. Use a test mailbox and do not show real emails.
- Small promo tile 440x280 (required)
- Marquee promo tile 1400x560 (optional)
