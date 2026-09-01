# How this profile builds itself

Plain Node, no dependencies. Everything is generated from the GitHub API and
committed back to this repo, so the README never depends on a third-party
service staying up.

## Setup

Optional: add a `WAKATIME_API_KEY` repository secret to fill in the "last 7
days" card. Without it that card shows a placeholder instead of breaking.

## Workflows

| Workflow      | Trigger                        | What it does                                                          |
| ------------- | ------------------------------ | --------------------------------------------------------------------- |
| `profile.yml` | every 3h, push to `scripts/**` | today's animation, hero palette, currently building, WakaTime, streak |
| `3d-contrib.yml` | daily                       | the contribution skyline                                              |

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
- Two themes, one source: every card is drawn in the light palette
  (`lib/svg.mjs`, olive & parchment) and its dark twin (ink: graphite ground, green
  kept only for contribution graphics) is derived
  by `lib/theme.mjs`, which maps each light colour to one dark colour. The
  README pairs `x.svg` / `x-dark.svg` with `<picture>`, which GitHub switches
  with the viewer's GitHub theme. Adding a colour means adding it to both files;
  `test.mjs` fails if a token has no dark counterpart.
- The hero has `<!-- dark-only -->` / `<!-- light-only -->` blocks (moon and
  stars vs the sun) that `build.mjs` strips per theme.
- The hero palette follows *my* local time (`PROFILE_TZ`, default
  `Asia/Kolkata`) — it is the same for every visitor, not their local time.
- Every animation's resting state is its *finished* state. Anything that starts
  invisible and animates in would render as an empty card wherever animation
  does not run.
