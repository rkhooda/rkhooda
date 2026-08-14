# How this profile builds itself

Plain Node, no dependencies. Everything is generated from the GitHub API and
committed back to this repo, so the README never depends on a third-party
service staying up.

## One-time setup

```sh
GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY=rkhooda/rkhooda node scripts/setup.mjs
```

Creates and pins the **guestbook** and **connect4** issues, adds their labels,
and writes their links into the README. Safe to re-run.

Optional: add a `WAKATIME_API_KEY` repository secret to fill in the "last 7
days" card. Without it that card shows a placeholder instead of breaking.

## Workflows

| Workflow        | Trigger                              | What it does                                            |
| --------------- | ------------------------------------ | ------------------------------------------------------- |
| `profile.yml`   | every 3h, push to `scripts/**`       | today's animation, hero palette, currently building, WakaTime |
| `guestbook.yml` | comments on the guestbook issue      | redraws the avatar wall                                 |
| `connect4.yml`  | comments on the connect4 issue       | applies the move, plays the bot, redraws the board      |

All three share the `profile-commit` concurrency group so their commits queue
rather than racing to push.

## Local

```sh
node scripts/test.mjs                              # rules, bot, scaling, README markers
ANIM=plane GITHUB_TOKEN=$(gh auth token) node scripts/build.mjs   # force one animation
```

`ANIM` accepts `waveform`, `plane`, `ekg`, `runner`, `tetris`, `weather` or
`terminal`. Without it the animation is picked from the day of the year.

## Notes

- GitHub caches README images through its image proxy, so every generated image
  carries a `?v=` parameter that the scripts bump on each write.
- The hero palette follows *my* local time (`PROFILE_TZ`, default
  `Asia/Kolkata`) — it is the same for every visitor, not their local time.
- Connect 4 runs a depth-4 search on purpose. A perfect bot would never lose and
  nobody would play twice.
