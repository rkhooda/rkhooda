# One-time setup

## 1. Create the repo

GitHub → **New repository** → name it **exactly** `rkhooda` (must match your username) → **Public** → do **not** add a README/license (this folder already has everything).

## 2. Push this folder

```bash
cd ~/Desktop/Coding/Projects/rkhooda
git remote add origin https://github.com/rkhooda/rkhooda.git
git push -u origin main
```

## 3. Kick the workflows (one time)

Repo → **Actions** tab → enable workflows if prompted, then:

- open **generate snake** → **Run workflow**
- open **generate 3d contribution graph** → **Run workflow**

Both re-run daily on their own afterwards. The snake shows up on your profile a minute after its run finishes; the 3D skyline commits itself into the repo.

## 4. Spotify live card (~5 min)

1. Open <https://spotify-github-profile.kittinanx.com>
2. **Login with Spotify** → approve access.
3. The site shows your card URL — copy the `uid=...` value from it.
4. In `README.md`, replace `YOUR_SPOTIFY_UID` (one spot) with that uid → commit & push.

The card shows what you're currently playing; when you're not playing anything it shows your **last played** track (`show_offline=true` handles that).

> If the kittinanx service ever goes down, the self-hosted alternative is [novatorem](https://github.com/novatorem/novatorem) on Vercel — same look, your own deployment.

## 5. Portfolio (whenever it's ready)

In `README.md`, uncomment the Portfolio badge block and drop your URL in.

---

This file isn't part of the profile — delete it whenever you're done.
