# Mood Tracker

An Expo / React Native mood tracker focused on one core promise:

**Track your mood in seconds, spot what affects it, and reflect on your emotional patterns over time.**

## Product Direction

This app is meant to be a gentle daily mood companion that helps users:

- capture feelings quickly
- reflect clearly on past entries
- learn patterns from moods, tags, notes, and routines

The goal is not to become a therapy replacement or a heavy quantified-self dashboard. The product should stay lightweight, supportive, private, and insightful.

## Target User

Primary target user:

**A student or young working adult who wants a simple way to track daily mood, notice triggers, and reflect without doing heavy journaling.**

This user is usually trying to answer questions like:

- Why have I been off lately?
- What makes my good days better?
- Am I stressed, tired, lonely, or overloaded?
- Is this week actually worse, or does it just feel that way?

## What People Want From a Mood Tracker

Most people do not want a raw mood database. They want help with these jobs:

- understand themselves better
- feel heard in the moment
- build better emotional habits
- remember accurately how they felt over time
- use mood data in real life for therapy, journaling, or self-reflection

In practice, the product should create this loop:

**awareness -> patterns -> decisions**

## What Users Will Do With the Data

Users usually want the app to turn data into answers, not just store it.

They want to use their data to:

- spot triggers like work, sleep, conflict, loneliness, or burnout
- spot helpers like exercise, friends, rest, or routines
- compare this week vs last week or this month vs last month
- detect emotional decline early
- reflect before making lifestyle changes
- optionally share summaries with a therapist, coach, partner, or themselves

If the app only collects moods and never explains anything back, it will feel incomplete.

## What Data Is Useful

Most useful:

- mood
- note
- tags / triggers
- sleep
- energy
- stress
- social or work context
- streak / consistency
- weekly summaries

Less useful on its own:

- large volumes of raw entries with no interpretation
- too many mood labels
- tracking that feels like homework

## Feature Decision Rule

Before adding a feature, ask:

- Does this help users capture feelings faster?
- Does this help users understand patterns better?
- Does this help users act on what they learn?

If the answer is no to all three, the feature is probably not important.

## Current App Status

The app already has a solid core and is beyond starter level in the main mood flow.

### Implemented

- daily mood logging
- single entry per date
- notes
- preset tags
- day / week / month views
- history timeline
- history filters by mood, month, and tag
- jump from history entry back to that day
- insights tab
- weekly and monthly mood summaries
- current streak, longest streak, and most common mood insights
- top tags and hard-day tag pattern summaries
- weekday rhythm insights when enough data exists
- monthly filters
- streaks
- same-mood streaks
- local storage with AsyncStorage
- haptics, sound, and celebratory feedback on first log

### Current Technical Shape

- Expo Router app with Home, History, and Insights tabs
- local-only persistence
- one mood entry per `YYYY-MM-DD`
- hardcoded mood set
- hardcoded preset tag set

### Not Yet Implemented

- settings tab
- custom tags
- weekly recap
- reminder notifications
- sleep / energy / stress context
- export / backup
- privacy lock
- multiple entries per day
- cloud sync

## Current Product Gaps

The biggest gaps right now are not basic logging. They are:

- weak reflection flow after logging
- only one main tab / screen
- no strong history experience
- no trend or insight surface
- no custom tracking beyond preset tags
- no reminder or retention loop
- no explicit privacy/export controls

## Product Pillars

### 1. Capture Fast

The app should let users log a mood, a few tags, and a short note in under 30 seconds.

### 2. Reflect Clearly

Users should be able to review their week or month and understand what happened.

### 3. Learn Patterns

The app should help connect moods to triggers, habits, and routines over time.

## Must-Have Features

These features best match the product direction:

- fast daily check-in
- history view
- insights view
- custom tags
- weekly recap
- reminders
- privacy controls

## Very Good Next Features

- energy and stress sliders
- sleep tracking
- mood pattern highlights
- search and filtering
- export / share summary

## Nice-to-Have Later

- multiple entries per day
- AI-generated advice or summaries
- social features
- heavy gamification
- advanced customization
- cloud sync

## What To Avoid

- too many required fields
- turning check-ins into homework
- too much raw data with no interpretation
- trying to feel clinical when the product is really for reflection
- complicated charts too early

## Feature Priority Table

| Feature | Why users care | Product impact | Build difficulty | Priority |
|---|---|---:|---:|---:|
| `History timeline` | Lets users review past moods and notes in one place | High | Low-Medium | `P1` |
| `Insights tab` | Turns raw entries into trends and patterns | High | Medium | `P1` |
| `Custom tags` | People want to track their own real triggers | High | Medium | `P1` |
| `Weekly recap` | Gives users a simple reason to come back | High | Medium | `P1` |
| `Reminder notifications` | Improves consistency and retention | High | Medium | `P1` |
| `Search + filter history` | Helps users actually use old data | Medium-High | Medium | `P2` |
| `Stress / energy / sleep fields` | Makes pattern detection much more useful | High | Medium | `P2` |
| `Privacy / export settings` | Builds trust for sensitive data | Medium-High | Medium | `P2` |
| `Pattern highlights` | Shows useful insight like anxious + work | High | Medium-High | `P2` |
| `Multiple entries per day` | Better reflects real emotional changes | Medium | High | `P3` |
| `Cloud backup / sync` | Helpful for long-term use across devices | Medium | High | `P3` |
| `AI summaries` | Nice polish, but not core yet | Medium | Medium-High | `P3` |

## Recommended Build Order

1. History timeline
2. Insights tab
3. Custom tags
4. Weekly recap
5. Reminder notifications
6. Stress / energy / sleep fields
7. Privacy / export improvements
8. Multiple entries per day
9. Backup / sync

## Why This Order

- `History` is the easiest high-value feature and makes current data useful immediately.
- `Insights` turns logging into reflection.
- `Custom tags` make the data personal.
- `Weekly recap` creates payoff and return value.
- `Reminders` help consistency once the product already feels useful.
- deeper context fields and privacy features should come next.

## 3-Week Roadmap

### Week 1: History

Goal: make past entries useful.

- build a History tab
- show entries in reverse chronological order
- display date, mood, tags, and short note preview
- add simple filters by mood, tag, and month
- let users tap an entry to jump back to that day

### Week 2: Insights

Goal: turn logs into reflection.

- build an Insights tab
- add summary cards for:
  - entries this week
  - entries this month
  - current streak
  - longest streak
  - most common mood
- add simple trend views:
  - weekly mood counts
  - monthly mood counts
- add pattern sections:
  - most-used tags
  - common tags on sad / anxious days
  - best mood days by weekday if enough data exists

### Week 3: Personalization + Retention

Goal: make tracking personal and consistent.

- add custom tags
- keep preset tags but let users create their own
- add weekly recap
- add reminder notifications
- add a basic Settings tab for reminder toggle, export, and clear data

## Suggested Release Milestones

- `v0.2`: History
- `v0.3`: Insights
- `v0.4`: Custom tags + weekly recap + reminders

## Progress Snapshot

### Done

- `Week 1`: History is now implemented
- `Week 2`: Insights is now implemented

### Next

- `Week 3`: Custom tags, weekly recap, reminders, and basic Settings

## Best Next Milestone

The strongest near-term milestone is:

**Reflection Release**

Includes:

- History timeline
- Insights tab
- Custom tags
- Weekly recap

This is the point where the app starts feeling like a real product instead of only a logging screen.

## Architecture Notes For Future Features

Current storage is built around one entry per date. That is fine for the current product direction, but it matters for roadmap planning.

If we later add:

- morning / afternoon / night check-ins
- multiple mood changes per day
- more advanced journaling

then the storage model will likely need to move from:

- `date -> entry`

to something more like:

- `date -> entries[]`

That should be treated as a planned later refactor, not an immediate change.

## Immediate Next Step

Build `Week 3`: customization and retention.

That continues the product shift from:

- logging data
- reviewing data
- understanding patterns

to:

- tracking personal triggers more accurately
- giving users a reason to return regularly
