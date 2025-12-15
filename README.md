AFCON Fantasy App
=================

Comprehensive guide: A → Z for this repo.

Project overview
----------------
- Purpose: A fantasy football app focused on the AFCON competition.
- Stack: Expo (React Native), Firebase, Node.js scripts for data seeding and fetching.

Repository layout
-----------------
Top-level:
- `package.json` — root scripts and tooling.
- `afcon-fantasy/` — main Expo app and source code.

Inside `afcon-fantasy/`:
- `app/` — primary screens and routes for the Expo app.
- `components/` — shared React components (UI pieces, pitch, jersey, etc.).
- `constants/` — theme and constants.
- `contexts/` — `AuthContext.js` for authentication state.
- `hooks/` — custom hooks.
- `screens/` — older or alternate screens used by the project.
- `services/` — API wrappers and service logic (`apiFootballService.js`, `footballDataService.ts`).
- `scripts/` — Node scripts to fetch, seed, import and manage teams/players data.
- `tmp/` — generated JSON artifacts (cached squads, groups, etc.).

Quick start (development)
-------------------------
Prerequisites:
- Node.js (LTS)
- npm or yarn
- Expo CLI (for running the mobile app)
- Git configured with credentials that can push to GitHub

Install dependencies (root may have just helpers; primary app deps live in `afcon-fantasy`):

```bash
# from repo root
cd afcon-fantasy
npm install
# or
# yarn
```

Run the Expo app (development):

```bash
cd afcon-fantasy
npx expo start
```

Open the app in Expo Go (iOS/Android) or the web with the QR/URL shown.

Node scripts (data fetching / seeding)
-------------------------------------
Most automation lives in `afcon-fantasy/scripts/`.
Common scripts:
- `seedPlayers.js` — seed player documents to Firestore
- `seedMatches.js` — seed fixtures/matches to Firestore
- `fetch-afcon-squads.js`, `fetch-afcon-groups-and-squads.js` — fetch squads data and write to `tmp/`
- `get-api-football-teams.js` — helpers around API-Football
- `import-afcon-teams-to-firebase.js` — push team data to Firebase

Run a script:

```bash
cd afcon-fantasy/scripts
# run with node (examples)
node seedPlayers.js
node seedMatches.js
```

Environment / secrets
---------------------
- `firebase.js` contains Firebase configuration and initialisation used by the project. Do not commit secrets publicly.
- If you need to run scripts locally, set necessary env vars (Firebase service account, API keys) as described in your private docs or CI.

Git, branches and pushing
-------------------------
This repo will be pushed to your GitHub repository. Typical flow:

```bash
# set remote (only once)
git remote add origin https://github.com/Achtout-Mohamed/AFCON-PROJECT.git
# create main branch locally
git branch -M main
# push
git push -u origin main
```

If you use a different default branch name (e.g., `master`), adapt the commands.

Building / production
---------------------
- For mobile builds, use Expo's build services (`eas build`) or Expo Classic builds depending on your setup.
- Ensure environment variables and Firebase production credentials are configured in CI or EAS secrets.

Testing
-------
- There are no formal unit tests in the repo by default. If you add Jest or Detox, include instructions here.

Troubleshooting
---------------
- npm install errors: delete `node_modules` and reinstall (`rm -rf node_modules && npm install`).
- Firebase auth/permission issues: verify service account credentials or Firestore rules.
- Push failures: ensure your local Git user is configured and you have permission to push to the target repository.

Contributing
------------
- Follow standard GitHub flow: branch from `main`, open pull requests with a clear description.
- Keep changes focused and follow the existing code style.

Useful file references
----------------------
- `afcon-fantasy/app/` — main app screens and layout.
- `afcon-fantasy/scripts/` — scripts used to fetch and seed data.
- `afcon-fantasy/services/` — API and data logic.
- `afcon-fantasy/firebase.js` — local Firebase init (sensitive; do not publish private keys).

Privacy & security
------------------
- Never commit API keys, service account JSON, or other secrets.
- Use environment variables or CI secret storage for production credentials.

Next steps / suggestions
------------------------
- Add a `CONTRIBUTING.md` with branching and PR guidelines.
- Add CI for linting and running scripts where appropriate.
- Add GitHub Actions to automatically run the seed scripts in a safe staging environment.

License
-------
- Add a license file if you want to specify reuse terms (e.g., MIT). If you want, I can add one for you.

Contact / author
----------------
Project maintained by project owner. For help with pushing, CI, or adding a license, ask and I will assist.
