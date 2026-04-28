const assert = require("node:assert/strict");

const {
  getMonthComparison,
  getWeekComparison,
  getWeekWarnings,
  matchesContextBand,
} = require("../utils/moodStats");
const { buildReadableSummary } = require("../utils/shareSummary");

function makeEntry(date, mood, extras = {}) {
  return {
    date,
    mood,
    createdAt: 1,
    updatedAt: 1,
    ...extras,
  };
}

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function buildSummary(range, entries) {
  return buildReadableSummary(entries, new Date(2026, 3, 29), range);
}

run("getWeekComparison compares current week against previous week", () => {
  const entries = [
    makeEntry("2026-04-20", "happy"),
    makeEntry("2026-04-21", "neutral"),
    makeEntry("2026-04-22", "happy"),
    makeEntry("2026-04-27", "sad"),
    makeEntry("2026-04-28", "anxious"),
    makeEntry("2026-04-29", "sad"),
  ];

  const comparison = getWeekComparison(entries, new Date(2026, 3, 29));

  assert.equal(comparison.previousCount, 3);
  assert.equal(comparison.currentCount, 3);
  assert.equal(comparison.previousAverageScore, 4.3);
  assert.equal(comparison.currentAverageScore, 1.7);
  assert.equal(comparison.delta, -2.6);
});

run("getMonthComparison compares current month against previous month", () => {
  const entries = [
    makeEntry("2026-03-02", "sad"),
    makeEntry("2026-03-14", "neutral"),
    makeEntry("2026-03-28", "sad"),
    makeEntry("2026-04-03", "happy"),
    makeEntry("2026-04-12", "happy"),
    makeEntry("2026-04-26", "neutral"),
  ];

  const comparison = getMonthComparison(entries, new Date(2026, 3, 1));

  assert.equal(comparison.previousCount, 3);
  assert.equal(comparison.currentCount, 3);
  assert.equal(comparison.previousAverageScore, 2.3);
  assert.equal(comparison.currentAverageScore, 4.3);
  assert.equal(comparison.delta, 2);
});

run("matchesContextBand detects low and high bands correctly", () => {
  const entry = makeEntry("2026-04-29", "neutral", {
    stress: 5,
    sleep: 2,
    energy: 4,
  });

  assert.equal(matchesContextBand(entry, "stress", "high"), true);
  assert.equal(matchesContextBand(entry, "stress", "low"), false);
  assert.equal(matchesContextBand(entry, "sleep", "low"), true);
  assert.equal(matchesContextBand(entry, "energy", "high"), true);
});

run("getWeekWarnings surfaces hard-streak warnings when a tough run stacks up", () => {
  const entries = [
    makeEntry("2026-04-20", "happy"),
    makeEntry("2026-04-21", "happy"),
    makeEntry("2026-04-22", "neutral"),
    makeEntry("2026-04-27", "sad", { stress: 5 }),
    makeEntry("2026-04-28", "anxious", { stress: 4 }),
    makeEntry("2026-04-29", "sad", { stress: 5 }),
  ];

  const warnings = getWeekWarnings(entries, new Date(2026, 3, 29));

  assert.equal(warnings.length, 2);
  assert.equal(warnings[0]?.id, "weekly-drop");
  assert.equal(warnings[1]?.id, "hard-streak");
  assert.match(warnings[1]?.detail ?? "", /3 tough check-ins in a row/);
});

run("buildReadableSummary uses the selected last-7-days range", () => {
  const entries = [
    makeEntry("2026-04-10", "happy", { tags: ["rest"] }),
    makeEntry("2026-04-24", "sad", { tags: ["work"] }),
    makeEntry("2026-04-26", "sad", { tags: ["work"], stress: 5 }),
    makeEntry("2026-04-28", "happy", { tags: ["rest"], sleep: 5 }),
    makeEntry("2026-04-29", "happy", { tags: ["rest"], sleep: 4 }),
  ];

  const summary = buildSummary("last7", entries);

  assert.match(summary, /Mood tracker summary: last 7 days/);
  assert.match(summary, /Last 7 days: 4 check-ins\./);
  assert.match(summary, /#rest often showed up on better days/);
});

run("buildReadableSummary uses month wording for this-month summaries", () => {
  const entries = [
    makeEntry("2026-03-02", "sad", { tags: ["work"] }),
    makeEntry("2026-03-09", "neutral", { tags: ["work"] }),
    makeEntry("2026-03-20", "sad", { tags: ["work"] }),
    makeEntry("2026-04-03", "happy", { tags: ["rest"], sleep: 5 }),
    makeEntry("2026-04-12", "happy", { tags: ["rest"], sleep: 4 }),
    makeEntry("2026-04-25", "neutral", { tags: ["rest"], sleep: 4 }),
  ];

  const summary = buildSummary("thisMonth", entries);

  assert.match(summary, /Mood tracker summary: April 2026/);
  assert.match(summary, /Compared with last month, things felt noticeably lighter\./);
  assert.match(summary, /Most common mood in this range: happy\./);
});

run("buildReadableSummary uses recent-range wording for last 3 months", () => {
  const entries = [
    makeEntry("2026-02-10", "neutral", { tags: ["routine"] }),
    makeEntry("2026-03-10", "sad", { tags: ["work"] }),
    makeEntry("2026-04-10", "happy", { tags: ["rest"], energy: 5 }),
    makeEntry("2026-04-20", "happy", { tags: ["rest"], energy: 4 }),
  ];

  const summary = buildSummary("last3Months", entries);

  assert.match(summary, /Mood tracker summary: last 3 months/);
  assert.match(
    summary,
    /This summary focuses more on recent patterns than month-over-month comparison\./
  );
  assert.match(summary, /Most common mood in this range:/);
});

console.log("All interpretation tests passed.");
