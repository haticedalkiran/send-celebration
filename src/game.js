// Score, combo, levels, daily goal and badges. All data stays in chrome.storage.local.
export const COMBO_WINDOW_MS = 2 * 60 * 1000;
export const JACKPOT_CHANCE = 0.02;

export const LEVELS = [
  { name: 'ROOKIE', at: 0 },
  { name: 'MAIL RUNNER', at: 10 },
  { name: 'INBOX NINJA', at: 50 },
  { name: 'SEND MASTER', at: 100 },
  { name: 'MAIL LEGEND', at: 250 },
  { name: 'INBOX OVERLORD', at: 500 },
];

export const BADGES = [
  { id: 'first_send', name: 'FIRST SEND', desc: 'Send your first mail', test: (c) => c.stats.total === 1 },
  { id: 'early_bird', name: 'EARLY BIRD', desc: 'Send a mail between 4 and 8 AM', test: (c) => c.hour >= 4 && c.hour < 8 },
  { id: 'night_owl', name: 'NIGHT OWL', desc: 'Send a mail between 10 PM and 4 AM', test: (c) => c.hour >= 22 || c.hour < 4 },
  { id: 'ten_a_day', name: 'TEN A DAY', desc: 'Send 10 mails in one day', test: (c) => c.stats.today >= 10 },
  { id: 'combo_5', name: 'COMBO x5', desc: 'Chain 5 sends within 2 minutes each', test: (c) => c.stats.combo >= 5 },
  { id: 'century', name: 'CENTURY', desc: 'Send 100 mails', test: (c) => c.stats.total >= 100 },
  { id: 'jackpot', name: 'LUCKY STRIKE', desc: 'Hit a jackpot', test: (c) => c.jackpot },
];

export function levelFor(total) {
  let index = 0;
  LEVELS.forEach((l, i) => { if (total >= l.at) index = i; });
  return { index, level: index + 1, name: LEVELS[index].name, next: LEVELS[index + 1] || null };
}

export function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const emptyStats = () => ({
  total: 0, score: 0, bestCombo: 0, combo: 0, lastSendAt: 0,
  day: dayKey(), today: 0, goalDay: '', lastMessage: '', badges: {},
});

export async function getStats() {
  const { stats } = await chrome.storage.local.get('stats');
  return { ...emptyStats(), ...(stats || {}) };
}

export async function resetStats() {
  await chrome.storage.local.remove('stats');
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Picks the headline for a send. The first rule that matches wins, from rarest to most common,
// so the message always reflects the most meaningful thing that just happened:
//   1. jackpot            lucky 2% roll
//   2. level up           crossed a rank threshold (10 / 50 / 100 / 250 / 500 mails)
//   3. daily goal reached today's send count hit the goal exactly
//   4. combo              another send within 2 minutes of the previous one
//   5. day progress       first send of the day, halfway to goal, one to go
//   6. bonus round        past the goal for the day
//   7. time of day        late-night / evening / morning flavour
//   8. generic filler
// `last` is the previous headline; it is never repeated twice in a row.
export function pickMessage(ev, last = '') {
  if (ev.jackpot) return 'JACKPOT!!!';
  if (ev.leveledUp) return 'LEVEL UP!';
  if (ev.goalReached) return 'MISSION COMPLETE!';
  if (ev.combo >= 2) return `COMBO x${ev.combo}!`;

  const { today, goal, hour } = ev;
  const progress = [];
  if (today === 1) progress.push(hour >= 5 && hour < 11 ? 'GOOD MORNING, CHAMP' : 'FIRST SEND OF THE DAY');
  if (goal >= 4 && today === Math.ceil(goal / 2)) progress.push('HALFWAY THERE!');
  if (goal >= 3 && today === goal - 1) progress.push('ONE TO GO!');
  if (progress.length) return progress[0];

  const pool = today > goal ? ['BONUS ROUND!', 'OVERTIME!', 'GG'] : [];
  if (hour >= 22 || hour < 4) pool.push('NIGHT SHIFT!');
  else if (hour >= 18) pool.push('ONE MORE DOWN', 'WRAPPING UP!');
  else if (hour >= 5 && hour < 11) pool.push('NICE SEND!', 'EARLY BIRD MODE');
  pool.push('NICE SEND!', 'GG', 'ONE MORE DOWN');

  const fresh = pool.filter((m) => m !== last);
  return pick(fresh.length ? fresh : pool);
}

// Records one confirmed send and returns everything the effect needs to render.
export async function recordSend(settings, now = new Date()) {
  const s = await getStats();
  const t = now.getTime();
  const key = dayKey(now);
  if (s.day !== key) { s.day = key; s.today = 0; }

  const levelBefore = levelFor(s.total).index;
  s.combo = s.lastSendAt && t - s.lastSendAt <= COMBO_WINDOW_MS ? s.combo + 1 : 1;
  s.lastSendAt = t;
  s.total += 1;
  s.today += 1;
  s.bestCombo = Math.max(s.bestCombo, s.combo);

  const multiplier = Math.min(s.combo, 5);
  const points = 100 * multiplier;
  s.score += points;

  const lvl = levelFor(s.total);
  const goal = settings.dailyGoal;
  const goalReached = s.today === goal && s.goalDay !== key;
  if (goalReached) s.goalDay = key;
  const jackpot = Math.random() < JACKPOT_CHANCE;

  const hour = now.getHours();
  const newBadges = BADGES.filter((b) => !s.badges[b.id] && b.test({ stats: s, hour, jackpot }));
  newBadges.forEach((b) => { s.badges[b.id] = t; });

  const ev = {
    points, multiplier, combo: s.combo, score: s.score, total: s.total,
    today: s.today, goal, level: lvl, leveledUp: lvl.index > levelBefore,
    goalReached, jackpot, newBadges, hour,
  };
  ev.message = pickMessage(ev, s.lastMessage);
  s.lastMessage = ev.message;
  await chrome.storage.local.set({ stats: s });
  return ev;
}
