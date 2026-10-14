// Detects confirmed sends in Gmail's web UI with no third-party SDK and no network access.
// All Gmail-specific knowledge lives in this file (BRD: single isolated trigger module).
//
// How it works (language independent):
//   1. The user triggers a send: click on Gmail's Send button, or Ctrl/Cmd+Enter inside a compose.
//   2. We then watch that Send button. If Gmail closes the compose (button removed or hidden)
//      within CONFIRM_WINDOW_MS, the send went through. If the button stays (missing recipient,
//      error dialog, user cancelled), nothing happens.
//   3. A real send closes the compose with no further user input. So if the user clicks or
//      types anything else while we watch (e.g. the compose's X after an error dialog), the
//      watch is cancelled and the close is NOT counted as a send. Input inside Gmail's modal
//      prompts (e.g. "send without subject?") is ignored, so confirming one still counts.

const SEND_BUTTON = '.aoO'; // class of Gmail's Send button; the label text varies by language
const CONFIRM_WINDOW_MS = 8000; // long enough to answer "send without subject?" prompts
const POLL_MS = 80;
const MAX_ANCESTOR_DEPTH = 25;
const MODAL = '[role="alertdialog"], .Kj-JD'; // Gmail's error / confirmation prompts

// Enable with: localStorage.setItem('gscDebug', '1') in the Gmail tab console.
const debug = (...args) => {
  try {
    if (localStorage.getItem('gscDebug')) console.log('[send-celebration]', ...args);
  } catch { /* storage may be blocked */ }
};

function findSendButton(from) {
  if (!(from instanceof Element)) return null;
  const direct = from.closest(SEND_BUTTON);
  if (direct) return direct;
  // Keyboard path: walk up from the focused element to the nearest compose that holds a Send button.
  let node = from;
  for (let i = 0; node && node !== document.documentElement && i < MAX_ANCESTOR_DEPTH; i++) {
    const btn = node.querySelector(SEND_BUTTON);
    if (btn) return btn;
    node = node.parentElement;
  }
  return null;
}

const gone = (btn) => !btn.isConnected || btn.getClientRects().length === 0;
const watching = new Map(); // send button -> cancel()
let triggerEvent = null;

function confirmSend(btn, onSent) {
  if (watching.has(btn)) return;

  // Where the compose's Send button was, as viewport fractions, for the burst effect.
  const r = btn.getBoundingClientRect();
  const origin = {
    x: Math.min(0.95, Math.max(0.05, (r.left + r.width / 2) / window.innerWidth)),
    y: Math.min(0.95, Math.max(0.05, (r.top + r.height / 2) / window.innerHeight)),
  };

  const start = Date.now();
  const stop = () => {
    clearInterval(timer);
    watching.delete(btn);
  };
  const timer = setInterval(() => {
    if (gone(btn)) {
      stop();
      debug('send confirmed (compose closed)');
      onSent(origin);
    } else if (Date.now() - start > CONFIRM_WINDOW_MS) {
      stop();
      debug('send not confirmed (compose stayed open)');
    }
  }, POLL_MS);

  watching.set(btn, () => {
    stop();
    debug('watch cancelled (user did something else, not counted as a send)');
  });
}

// Any other user input while watching means the compose was not closed by Gmail's send.
function onUserInput(e) {
  if (!watching.size || e === triggerEvent) return;
  const t = e.target;
  if (t instanceof Element && (t.closest(SEND_BUTTON) || t.closest(MODAL))) return;
  [...watching.values()].forEach((cancel) => cancel());
}

// onTrigger(): user just pressed send (play a tick). onSent(origin): Gmail accepted the send.
export function watchSends({ onTrigger, onSent }) {
  const handle = (e) => {
    const btn = findSendButton(e.target);
    if (!btn || watching.has(btn)) return;
    triggerEvent = e;
    debug('send triggered');
    onTrigger();
    confirmSend(btn, onSent);
  };

  // Registered first so a trigger event is recorded before the cancel handlers see it.
  document.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest(SEND_BUTTON)) handle(e);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.repeat) handle(e);
  }, true);

  document.addEventListener('mousedown', onUserInput, true);
  document.addEventListener('keydown', onUserInput, true);
}
