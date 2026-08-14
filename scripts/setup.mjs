// One-time bootstrap: creates the guestbook and Connect 4 issues, labels and
// pins them, then writes their links into the README. Safe to re-run.
import { gql, rest } from './lib/gh.mjs';
import { readReadme, writeReadme, updateSection } from './lib/readme.mjs';

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;

if (!TOKEN || !REPO) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required');

async function ensureLabel(name, color, description) {
  try {
    await rest(`/repos/${REPO}/labels/${name}`, TOKEN);
  } catch {
    await rest(`/repos/${REPO}/labels`, TOKEN, { method: 'POST', body: JSON.stringify({ name, color, description }) });
    console.log(`created label ${name}`);
  }
}

async function ensureIssue(label, title, body) {
  const open = await rest(`/repos/${REPO}/issues?labels=${label}&state=open&per_page=1`, TOKEN);
  if (open[0]) {
    console.log(`issue #${open[0].number} already carries "${label}"`);
    return open[0];
  }
  const issue = await rest(`/repos/${REPO}/issues`, TOKEN, {
    method: 'POST',
    body: JSON.stringify({ title, body, labels: [label] }),
  });
  console.log(`created issue #${issue.number} — ${title}`);

  try {
    await gql('mutation($id: ID!) { pinIssue(input: {issueId: $id}) { issue { number } } }', { id: issue.node_id }, TOKEN);
    console.log(`pinned #${issue.number}`);
  } catch (err) {
    console.warn(`could not pin #${issue.number} (${err.message}) — pin it by hand`);
  }
  return issue;
}

await ensureLabel('guestbook', '7aa2f7', 'Comment here and your avatar joins the wall');
await ensureLabel('connect4', 'bb9af7', 'The live Connect 4 game');

const guestbook = await ensureIssue(
  'guestbook',
  'Sign the guestbook',
  [
    'Leave any comment and your avatar joins the wall on my profile.',
    '',
    '**Only your avatar and username are shown — nothing you type is rendered.**',
    'Delete your comment and you disappear from the wall on the next run.',
    '',
    '_The wall updates within a minute or so._',
  ].join('\n')
);

const connect4 = await ensureIssue(
  'connect4',
  'Play me at Connect 4',
  [
    'Comment a number from **1 to 7** to drop a disc in that column. The bot answers straight away and the board on my profile redraws.',
    '',
    '- 🔴 you · 🟡 the bot',
    '- Games reset automatically once somebody wins.',
    '- The running score lives on my profile.',
    '',
    '_First comment starts the game._',
  ].join('\n')
);

let md = readReadme();
md = updateSection(
  md,
  'guestbook-link',
  `<a href="${guestbook.html_url}"><img src="https://img.shields.io/badge/sign_the_guestbook-7aa2f7?style=for-the-badge&logo=github&logoColor=white&labelColor=1a1b26" alt="Sign the guestbook" /></a>`
);
md = updateSection(
  md,
  'connect4-link',
  `<a href="${connect4.html_url}"><img src="https://img.shields.io/badge/make_your_move-bb9af7?style=for-the-badge&logo=github&logoColor=white&labelColor=1a1b26" alt="Play me at Connect 4" /></a>`
);
writeReadme(md);

console.log(`\nguestbook → ${guestbook.html_url}\nconnect 4 → ${connect4.html_url}`);
