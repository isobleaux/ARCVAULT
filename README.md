# MacroSnap

A macro tracker you drive with your camera. Photograph a meal and Claude breaks
it into its components with per-item macros; log a workout and it estimates not
just the calories burned but the **fuel** — how many grams of carbohydrate, fat
and protein your body actually oxidised.

Mobile-first, installable as a PWA, built on Next.js 16 + Postgres.

---

## What it does

**Photo → macros.** Point the camera at a plate. Every component comes back
separately — the chicken, the rice, the oil it was cooked in — with calories,
protein, carbs, fat, fibre, sugar, saturated fat and sodium, plus a confidence
rating and the assumptions behind each estimate ("assumed 1 tbsp of oil; sauce
volume hidden under the rice"). You scale portions with +/− before anything is
saved. Nothing is logged until you confirm it.

**Both sides of the ledger.** Most trackers tell you calories out. MacroSnap
also estimates the substrate split: at 80% of VO₂max a 45-minute run burns
almost entirely carbohydrate; a long easy walk leans on fat and starts drawing
on protein. The Today screen shows the day's total expenditure broken into
resting, everyday movement and workouts, with the fuel mix underneath.

**Targets that come from you.** Resting rate via Mifflin-St Jeor, multiplied by
a baseline-movement factor, offset by your goal. Protein anchored to
bodyweight, fat given a hormonal-health floor, carbs as the remainder, fibre at
14 g per 1000 kcal.

**Also:** manual entry with a macro-vs-calorie consistency check, a saved-food
library, weight logging, and 7/14/30-day trends with a table view.

---

## Running it

```bash
cp .env.example .env          # then fill in DATABASE_URL + NEXTAUTH_SECRET
npm install
npm run db:migrate            # creates the schema
npm run db:seed               # optional: demo account with 3 weeks of history
npm run dev
```

Open <http://localhost:3000>. The seed creates
`demo@macrosnap.app` / `macrosnap123`.

### Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Any Postgres instance |
| `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | yes | e.g. `http://localhost:3000` |
| `ANTHROPIC_API_KEY` | no | Without it the camera flow is disabled and the app falls back to manual entry — everything else works |
| `ANTHROPIC_MODEL` | no | Defaults to `claude-opus-5` |
| `UPLOAD_DIR` | no | Where meal photos are written. Defaults to `./public/uploads` |

---

## How the estimates work

Everything numeric lives in [`src/lib/energy.ts`](src/lib/energy.ts) as pure
functions with no I/O, so the preview in the UI and the row written to the
database are computed by the same code and cannot drift apart.

### Resting and total burn

BMR from **Mifflin-St Jeor**, then a baseline activity multiplier.

Those multipliers (1.20 → 1.75) are deliberately lower than the textbook
Harris-Benedict set (1.2 → 1.9), because the classic numbers bake planned
exercise into the figure. MacroSnap logs workouts separately and adds them on
top, so using the classic multipliers would count every gym session twice. The
onboarding copy says so explicitly: *"not counting workouts"*.

Workouts contribute their **net** cost (above resting) to the day's target,
while the UI shows the gross figure people expect to see — the resting hours a
workout overlaps are already inside TDEE.

### Calories burned

`kcal = MET × 3.5 × kg ÷ 200 × minutes`, with MET values per activity and
intensity from the 2011 Compendium of Physical Activities.

### Fuel mix — the interesting part

1. Estimate VO₂max from age, sex, BMI and activity level (Jackson's
   non-exercise model).
2. Work out what fraction of VO₂max the session was performed at:
   `MET × 3.5 ÷ VO₂max`.
3. Map that to a **respiratory exchange ratio** — about 0.75 at very light
   effort, approaching 1.00 at maximum.
4. Convert RER to a carbohydrate share: `(RER − 0.707) ÷ 0.293`. Fat is the
   remainder.
5. Protein takes 2% of energy, rising toward 8% on endurance sessions past an
   hour as glycogen depletes.
6. Divide by 4 / 9 / 4 kcal per gram.

Non-exercise expenditure uses a fixed RER of 0.83, roughly the mixed-diet
resting default.

**This is what your body used, not a prescription for what to eat.** It is a
population-average model — real substrate use varies with training status,
diet and how recently you last ate.

---

## Photo analysis

[`src/modules/vision/`](src/modules/vision) calls `claude-opus-5` with the
image plus any hint you typed, and constrains the reply with a JSON Schema via
`output_config.format`, so the response is always a valid object rather than
prose that needs parsing.

The prompt tells the model to size portions against visible references (a
dinner plate is ~27cm, a fork ~19cm, a closed fist ~1 cup), to break sauces and
cooking oil out as their own items rather than folding them in silently, and to
check that `protein×4 + carbs×4 + fat×9` lands within ~10% of its own calorie
figure. On top of that the server reconciles two things the model can still get
wrong: a subset exceeding its parent (fibre above total carbs, saturated above
total fat) and macros that do not add up to the stated calories.

Refusals, missing keys, rate limits and unreadable photos all resolve to a
specific message with a link to manual entry — the app never dead-ends.
Server-side model fallback is enabled so a declined request is retried
automatically rather than lost.

Images are downscaled to 1600px in the browser before upload, which cuts both
cellular upload time and image-token cost without hurting portion estimation.

---

## Design notes

Three colour jobs are kept strictly apart so a hue always means one thing:
**lime** is interaction (buttons, focus, active tab) and never a datum,
**orange** is energy wherever it appears, and four fixed categorical slots carry
the macros — protein, carbs, fat, fibre, assigned in that order and never
cycled.

Those four were validated with the `dataviz` palette checker in both light and
dark mode: lightness band, chroma floor, CVD separation (worst adjacent pair
ΔE 13.0 dark / 16.3 light under simulated deuteranopia), normal-vision floor
(19.3 / 19.6) and contrast against the card surface. In light mode carbs and
fat sit just below 3:1, which is only legal because every macro mark in the app
ships a visible numeric label and the trends page offers a table view — those
labels are a required accessibility channel, not decoration.

---

## Layout

```
src/
  lib/
    energy.ts          BMR, TDEE, targets, MET table, substrate model
    dates.ts           UTC-midnight day keys — day rollups never straddle timezones
    auth.ts            NextAuth options + a cookie-decode fallback for session lookup
    image.ts           Client-side downscale before upload
  modules/
    vision/            JSON schema, prompt, Claude call, response reconciliation
    diary/             Day summary + trend rollups, Zod validation
    profile/           Target computation and persistence
    storage/           Local-disk photo storage (swap this one file for S3)
  components/
    charts/            Rings, meters, stat tiles, trend charts
  app/
    (app)/             Authenticated shell: today, add, activity, foods, trends, settings
    (auth)/            Sign in / sign up
    api/               REST endpoints
```

---

## Caveats

- Photo estimates are estimates. Treat them as a fast, consistent way to track
  trends, not as a food scale.
- The substrate model uses population averages and an *estimated* VO₂max. The
  direction it moves in (harder → more carbohydrate) is solid; the absolute
  grams are indicative.
- Meal photos are stored on the server and sent to the Claude API for analysis.
- Not medical advice, and not built for anyone managing a clinical condition.
