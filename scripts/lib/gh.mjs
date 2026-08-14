// GitHub API helpers. No dependencies — Node 18+ fetch only.

const API = 'https://api.github.com';

export async function gql(query, variables, token) {
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'rkhooda-profile',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join('; '));
  if (!json.data) throw new Error(`graphql ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  return json.data;
}

export async function rest(path, token, init = {}) {
  const res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    ...init,
    headers: {
      Authorization: `bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'rkhooda-profile',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const PROFILE_QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC,
                 orderBy: {field: PUSHED_AT, direction: DESC}) {
      nodes {
        name url description pushedAt
        primaryLanguage { name color }
        defaultBranchRef {
          target { ... on Commit { history(first: 1) { nodes { messageHeadline committedDate } } } }
        }
      }
    }
  }
}`;

/**
 * Bucket day counts into levels 0-4 using quartiles of the active days, which is
 * roughly what GitHub itself does. A flat `count / max` scale collapses to level 1
 * for the whole year as soon as one outlier day exists.
 */
function levelsFor(counts) {
  const active = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (!active.length) return () => 0;
  const at = (q) => active[Math.min(active.length - 1, Math.floor(active.length * q))];
  const [q1, q2, q3] = [at(0.25), at(0.5), at(0.75)];
  return (c) => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
}

function streaks(days) {
  let longest = 0;
  let longestEnd = -1;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = days[i].count > 0 ? run + 1 : 0;
    if (run > longest) {
      longest = run;
      longestEnd = i;
    }
  }

  // Walk back from today. Today itself may simply not have landed yet, so one
  // trailing empty day is skipped — two in a row means the streak is over.
  let end = days.length - 1;
  if (end >= 0 && days[end].count === 0) end--;
  let current = 0;
  let start = end;
  while (start >= 0 && days[start].count > 0) {
    start--;
    current++;
  }

  const range = (from, to) => (from < 0 || to < 0 ? null : { from: days[from].date, to: days[to].date });

  return {
    longest,
    current,
    longestRange: range(longestEnd - longest + 1, longestEnd),
    currentRange: current ? range(start + 1, end) : null,
  };
}

export async function fetchProfile(login, token) {
  const data = await gql(PROFILE_QUERY, { login }, token);
  const cal = data.user.contributionsCollection.contributionCalendar;

  const weeks = cal.weeks.map((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, weekday: d.weekday }))
  );
  const days = weeks.flat();
  const level = levelsFor(days.map((d) => d.count));
  for (const d of days) d.level = level(d.count);

  const repos = data.user.repositories.nodes.map((r) => ({
    name: r.name,
    url: r.url,
    description: r.description,
    pushedAt: r.pushedAt,
    language: r.primaryLanguage?.name ?? null,
    languageColor: r.primaryLanguage?.color ?? null,
    lastCommit: r.defaultBranchRef?.target?.history?.nodes?.[0]?.messageHeadline ?? null,
    lastCommitAt: r.defaultBranchRef?.target?.history?.nodes?.[0]?.committedDate ?? null,
  }));

  const byLanguage = new Map();
  for (const r of repos) if (r.language) byLanguage.set(r.language, (byLanguage.get(r.language) ?? 0) + 1);
  const languages = [...byLanguage].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return {
    login,
    total: cal.totalContributions,
    weeks,
    days,
    repos,
    languages,
    max: Math.max(1, ...days.map((d) => d.count)),
    ...streaks(days),
  };
}

export function relativeTime(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  const days = Math.floor(mins / 1440);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
}
