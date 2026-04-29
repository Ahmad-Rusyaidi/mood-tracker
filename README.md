# Vibe Code App

# Mood Tracker

**Track your mood in seconds, spot what affects it, and reflect on your emotional patterns over time.**

## Product Direction

This app is meant to be a gentle daily mood companion that helps users:

- capture feelings quickly
- reflect clearly on past entries
- learn patterns from moods, tags, signals, and routines

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
- preset tags
- custom tags
- on-demand tag creation from Home during check-in
- tag management in Settings with default tags and saved custom tags
- day / week / month views
- journal timeline
- journal filters by mood, month, and tag
- jump from journal entry back to that day
- insight cards can drill into Journal with stack-style back navigation
- Journal back button returns users to the exact screen they came from
- insights tab
- weekly and monthly mood summaries
- current streak, longest streak, and most common mood insights
- top tags and hard-day tag pattern summaries
- weekday rhythm insights when enough data exists
- optional sleep, energy, and stress context logging
- future dates stay in preview mode so they do not distort streaks or insights
- backup export, import, merge, and full restore
- settings tab
- export data
- clear all data
- daily reminder preferences
- scheduled daily reminders with Expo notifications
- monthly filters
- streaks
- same-mood streaks
- local storage with AsyncStorage
- haptics, sound, and celebratory feedback on first log

## Product Structure

Each main area should do one job clearly:

- `Home`: log today, use tags, and create a tag on demand while checking in
- `Journal`: browse, filter, and reopen past entries without losing the screen you drilled in from
- `Insights`: view trends, recaps, pattern summaries, and jump into matching Journal entries for proof
- `Settings`: manage reminders, saved custom tags, export, and preferences

This keeps reflection in one place instead of repeating it across multiple tabs.

## Navigation Notes

- `Insights -> Journal` is a drill-in flow, not a tab switch, so Back returns to the exact insight view you were using
- `Journal -> Home` still works when you reopen a specific date to edit that day
- future dates can be opened from the calendar, but they stay preview-only until that date arrives

## Tag Behavior

Tags now have two distinct roles in the app:

- `Default tags`: always available everywhere, shown in Settings for visibility but not meant to be edited
- `Custom tags`: can be created on Home during a check-in and are saved for reuse on future days

The split is intentional:

- `Home` is for fast, in-the-moment tagging
- `Settings` is for tag management and saved tag visibility

## Product Pillars

### 1. Capture Fast

The app should let users log a mood, a few tags, and a few quick signals in under 30 seconds.

### 2. Reflect Clearly

Users should be able to review their week or month and understand what happened.

### 3. Learn Patterns

The app should help connect moods to triggers, habits, and routines over time.
