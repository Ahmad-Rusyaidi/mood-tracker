const assert = require("node:assert/strict");

const {
  getMonthComparison,
  getWeekComparison,
  getWeekWarnings,
  matchesContextBand,
} = require("../utils/moodStats");
const {
  filterEntriesByQuickFocus,
  getEntryHighlight,
  getEntryMatchScore,
  getHistoryQuickFocusExplanation,
  getHistorySummaryStats,
  getHistorySortExplanation,
  matchesComboFilter,
  parseComboFilter,
  sortEntriesByRelevance,
} = require("../utils/history");
const { buildReadableSummary } = require("../utils/shareSummary");
const {
  getMillisecondsUntilNextLocalDay,
  isFutureISODate,
} = require("../utils/date");
const {
  buildAnalysisExperiments,
  buildAnalysisLenses,
  buildAnalysisProfile,
  buildNarrativeSummary,
  buildPatternCards,
  buildRecoveryLens,
  buildSignalQualityLens,
  buildTrajectoryLens,
  buildVolatilityLens,
  getMoodMixSummary,
  getSignalDeltaText,
  getWeekdayRhythmSummary,
} = require("../utils/insights");

const asyncStorageModulePath = require.resolve("@react-native-async-storage/async-storage");

function deleteModuleIfLoaded(modulePath) {
  try {
    delete require.cache[require.resolve(modulePath)];
  } catch {}
}

function loadStorageHarness() {
  const store = new Map();
  const asyncStorageMock = {
    async getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
    async clear() {
      store.clear();
    },
  };

  require.cache[asyncStorageModulePath] = {
    id: asyncStorageModulePath,
    filename: asyncStorageModulePath,
    loaded: true,
    exports: {
      __esModule: true,
      default: asyncStorageMock,
      ...asyncStorageMock,
    },
  };

  [
    "../storage/index",
    "../storage/json",
    "../storage/keys",
    "../storage/moodStorage",
    "../storage/appSettingsStorage",
    "../utils/backup",
  ].forEach((modulePath) => deleteModuleIfLoaded(modulePath));

  return {
    moodStorage: require("../storage/moodStorage").moodStorage,
    appSettingsStorage: require("../storage/appSettingsStorage").appSettingsStorage,
    backupUtils: require("../utils/backup"),
  };
}

function makeEntry(date, mood, extras = {}) {
  return {
    date,
    mood,
    createdAt: 1,
    updatedAt: 1,
    ...extras,
  };
}

const pendingRuns = [];

function run(name, fn) {
  const pending = Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`PASS ${name}`);
    })
    .catch((error) => {
      console.error(`FAIL ${name}`);
      throw error;
    });

  pendingRuns.push(pending);
  return pending;
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

run("parseComboFilter normalizes valid combo params", () => {
  assert.equal(parseComboFilter("low_sleep|high_stress"), "high_stress|low_sleep");
  assert.equal(parseComboFilter("tag:work|high_stress"), "high_stress|tag:work");
  assert.equal(parseComboFilter("sleep"), "all");
});

run("matchesComboFilter matches entries that satisfy all combo features", () => {
  const entry = makeEntry("2026-04-29", "sad", {
    stress: 5,
    sleep: 2,
    tags: ["work"],
  });

  assert.equal(matchesComboFilter(entry, "high_stress|low_sleep"), true);
  assert.equal(matchesComboFilter(entry, "high_stress|tag:work"), true);
  assert.equal(matchesComboFilter(entry, "high_stress|high_energy"), false);
});

run("getEntryHighlight prioritizes combo matches and describes why an entry matched", () => {
  const entry = makeEntry("2026-04-29", "sad", {
    stress: 5,
    sleep: 2,
    tags: ["work"],
  });

  const highlight = getEntryHighlight({
    entry,
    selectedTag: "work",
    selectedContext: "high:stress",
    selectedCombo: "high_stress|low_sleep",
  });

  assert.equal(highlight?.label, "Matched pattern");
  assert.match(highlight?.detail ?? "", /High stress \+ Low sleep/i);
  assert.equal(highlight?.tone, "challenging");
});

run("getEntryHighlight falls back to context or tag matches when no combo is active", () => {
  const entry = makeEntry("2026-04-29", "happy", {
    sleep: 5,
    tags: ["walk"],
  });

  const contextHighlight = getEntryHighlight({
    entry,
    selectedTag: "all",
    selectedContext: "high:sleep",
    selectedCombo: "all",
  });
  const tagHighlight = getEntryHighlight({
    entry,
    selectedTag: "walk",
    selectedContext: "all",
    selectedCombo: "all",
  });

  assert.equal(contextHighlight?.label, "Matched signal");
  assert.equal(contextHighlight?.detail, "Good sleep");
  assert.equal(contextHighlight?.tone, "supportive");
  assert.equal(tagHighlight?.label, "Matched tag");
  assert.equal(tagHighlight?.detail, "#walk");
});

run("getEntryMatchScore ranks stronger context matches above weaker ones", () => {
  const stronger = makeEntry("2026-04-29", "sad", {
    stress: 5,
    sleep: 1,
  });
  const weaker = makeEntry("2026-04-28", "sad", {
    stress: 4,
    sleep: 2,
  });

  const strongerScore = getEntryMatchScore(stronger, {
    selectedTag: "all",
    selectedContext: "high:stress",
    selectedCombo: "all",
  });
  const weakerScore = getEntryMatchScore(weaker, {
    selectedTag: "all",
    selectedContext: "high:stress",
    selectedCombo: "all",
  });

  assert.ok(strongerScore > weakerScore);
});

run("sortEntriesByRelevance prioritizes stronger combo matches before recency", () => {
  const entries = [
    makeEntry("2026-04-29", "sad", { stress: 4, sleep: 2 }),
    makeEntry("2026-04-28", "anxious", { stress: 5, sleep: 1 }),
    makeEntry("2026-04-27", "sad", { stress: 5, sleep: 2 }),
  ];

  const sorted = sortEntriesByRelevance(entries, {
    selectedTag: "all",
    selectedContext: "all",
    selectedCombo: "high_stress|low_sleep",
  });

  assert.equal(sorted[0]?.date, "2026-04-28");
  assert.equal(sorted[1]?.date, "2026-04-27");
});

run("sortEntriesByRelevance keeps date order when no match-driven filters are active", () => {
  const entries = [
    makeEntry("2026-04-27", "sad"),
    makeEntry("2026-04-29", "happy"),
    makeEntry("2026-04-28", "neutral"),
  ];

  const sorted = sortEntriesByRelevance(entries, {
    selectedTag: "all",
    selectedContext: "all",
    selectedCombo: "all",
  });

  assert.deepEqual(
    sorted.map((entry) => entry.date),
    ["2026-04-29", "2026-04-28", "2026-04-27"]
  );
});

run("getHistorySortExplanation describes why results are ranked", () => {
  assert.match(
    getHistorySortExplanation({
      selectedTag: "all",
      selectedContext: "all",
      selectedCombo: "high_stress|low_sleep",
    }) ?? "",
    /pressure-pattern/i
  );

  assert.match(
    getHistorySortExplanation({
      selectedTag: "walk",
      selectedContext: "all",
      selectedCombo: "all",
    }) ?? "",
    /#walk/i
  );
});

run("getHistorySummaryStats returns actionable stat-card counts", () => {
  const stats = getHistorySummaryStats(
    [
      makeEntry("2026-04-29", "happy", { sleep: 4 }),
      makeEntry("2026-04-28", "neutral"),
      makeEntry("2026-04-27", "sad", { stress: 5 }),
      makeEntry("2026-04-26", "anxious"),
    ],
    {
      selectedTag: "all",
      selectedContext: "high:stress",
      selectedCombo: "all",
    }
  );

  assert.deepEqual(
    stats.map((item) => item.key),
    ["primary", "steadier", "harder", "context"]
  );
  assert.equal(stats[0]?.label, "pressure days");
  assert.equal(stats[0]?.value, "4");
  assert.equal(stats[1]?.value, "2");
  assert.equal(stats[2]?.value, "2");
  assert.equal(stats[3]?.value, "2");
});

run("filterEntriesByQuickFocus narrows entries to the selected stat-card focus", () => {
  const entries = [
    makeEntry("2026-04-29", "happy", { sleep: 4 }),
    makeEntry("2026-04-28", "neutral"),
    makeEntry("2026-04-27", "sad", { stress: 5 }),
    makeEntry("2026-04-26", "anxious"),
  ];

  assert.deepEqual(
    filterEntriesByQuickFocus(entries, "steadier").map((entry) => entry.date),
    ["2026-04-29", "2026-04-28"]
  );
  assert.deepEqual(
    filterEntriesByQuickFocus(entries, "harder").map((entry) => entry.date),
    ["2026-04-27", "2026-04-26"]
  );
  assert.deepEqual(
    filterEntriesByQuickFocus(entries, "context").map((entry) => entry.date),
    ["2026-04-29", "2026-04-27"]
  );
});

run("getHistoryQuickFocusExplanation explains active stat-card focus clearly", () => {
  assert.match(
    getHistoryQuickFocusExplanation("harder") ?? "",
    /harder days inside these matches/i
  );
  assert.match(
    getHistoryQuickFocusExplanation("context") ?? "",
    /sleep, stress, or energy context/i
  );
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

run("buildReadableSummary ignores future-dated entries in this-month summaries", () => {
  const entries = [
    makeEntry("2026-04-29", "happy", { tags: ["rest"] }),
    makeEntry("2026-04-30", "sad", { tags: ["work"] }),
  ];

  const summary = buildSummary("thisMonth", entries);

  assert.match(summary, /April 2026: 1 check-in\./);
  assert.doesNotMatch(summary, /#work/);
});

run("getMoodMixSummary describes a dominant mood mix clearly", () => {
  const summary = getMoodMixSummary(
    { happy: 4, neutral: 1, sad: 0, anxious: 0, angry: 0 },
    "this week"
  );

  assert.match(summary, /Happy shaped most of this week/i);
});

run("getWeekdayRhythmSummary calls out the steadiest and heaviest days", () => {
  const summary = getWeekdayRhythmSummary([
    { label: "Tue", count: 3, averageScore: 4.4 },
    { label: "Thu", count: 2, averageScore: 3.2 },
    { label: "Sun", count: 2, averageScore: 1.8 },
  ]);

  assert.match(summary, /Tue looks steadiest/i);
  assert.match(summary, /Sun tends to feel heavier/i);
});

run("getSignalDeltaText formats signal swing labels", () => {
  const label = getSignalDeltaText({
    key: "sleep",
    lowCount: 2,
    highCount: 3,
    lowAverageScore: 2,
    highAverageScore: 4,
    delta: 2,
  });

  assert.equal(label, "2.0 point swing");
});

run("buildAnalysisProfile explains pressure-sensitive patterns clearly", () => {
  const profile = buildAnalysisProfile({
    weekCount: 4,
    totalCheckIns: 8,
    taggedCount: 6,
    contextualCount: 7,
    weekSummary: {
      happy: 0,
      neutral: 1,
      sad: 2,
      anxious: 1,
      angry: 0,
    },
    comparison: {
      delta: -0.9,
      previousCount: 4,
    },
    mostCommonMood: { mood: "sad", count: 3 },
    supportiveTag: { tag: "rest", count: 3 },
    challengingTag: { tag: "work", count: 4 },
    strongestContext: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1.5,
      delta: -2,
    },
  });

  assert.match(profile.title, /pressure-sensitive/i);
  assert.match(profile.body, /#work/);
  assert.match(profile.evidence, /8 check-ins/);
});

run("buildAnalysisLenses combines emotion, help, strain, and rhythm clues", () => {
  const lenses = buildAnalysisLenses({
    weekSummary: {
      happy: 1,
      neutral: 2,
      sad: 1,
      anxious: 0,
      angry: 0,
    },
    comparison: {
      delta: 0.4,
      previousCount: 4,
    },
    mostCommonMood: { mood: "neutral", count: 5 },
    supportiveTag: { tag: "walk", count: 3 },
    challengingTag: { tag: "deadline", count: 2 },
    strongestContext: {
      key: "sleep",
      lowCount: 2,
      highCount: 3,
      lowAverageScore: 2,
      highAverageScore: 4,
      delta: 2,
    },
    bestWeekday: { label: "Tue", count: 3 },
    strongestCombo: {
      features: ["high_sleep", "tag:walk"],
      count: 3,
      averageScore: 4.5,
      deltaFromBaseline: 1.2,
      tone: "supportive",
    },
  });

  assert.ok(lenses.length >= 3);
  assert.ok(lenses.some((item) => item.label === "Emotion pattern"));
  assert.ok(lenses.some((item) => item.label === "What helps"));
  assert.ok(lenses.some((item) => item.label === "What adds strain"));
});

run("buildAnalysisExperiments produces concrete next-step suggestions", () => {
  const experiments = buildAnalysisExperiments({
    supportiveTag: { tag: "walk", count: 3 },
    challengingTag: { tag: "work", count: 4 },
    sleepSignal: {
      key: "sleep",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 2,
      highAverageScore: 4,
      delta: 2,
    },
    stressSignal: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1.5,
      delta: -2,
    },
    energySignal: null,
    bestWeekday: { label: "Fri", count: 2 },
  });

  assert.equal(experiments.length, 3);
  assert.equal(experiments[0]?.label, "Main focus");
  assert.ok(
    experiments.some((item) => /#work/i.test(item.title) || /#work/i.test(item.detail))
  );
  assert.ok(
    experiments.some((item) => /walk/i.test(item.title) || /walk/i.test(item.detail))
  );
});

run("buildRecoveryLens identifies when hard days usually bounce back", () => {
  const lens = buildRecoveryLens([
    makeEntry("2026-04-20", "sad"),
    makeEntry("2026-04-21", "neutral"),
    makeEntry("2026-04-23", "anxious"),
    makeEntry("2026-04-24", "happy"),
    makeEntry("2026-04-26", "sad"),
    makeEntry("2026-04-27", "neutral"),
  ]);

  assert.match(lens.title, /bounce back/i);
  assert.match(lens.detail, /3 harder days/);
});

run("buildSignalQualityLens calls out patchy recent context coverage", () => {
  const lens = buildSignalQualityLens({
    totalCheckIns: 10,
    weekCount: 5,
    taggedThisWeek: 1,
    contextualThisWeek: 2,
  });

  assert.match(lens.title, /reasons are still patchy/i);
  assert.match(lens.detail, /1 of 5 recent days had tags/i);
});

run("buildTrajectoryLens detects when the recent direction is getting heavier", () => {
  const lens = buildTrajectoryLens([
    makeEntry("2026-04-20", "happy"),
    makeEntry("2026-04-21", "happy"),
    makeEntry("2026-04-22", "neutral"),
    makeEntry("2026-04-23", "neutral"),
    makeEntry("2026-04-24", "sad"),
    makeEntry("2026-04-25", "anxious"),
    makeEntry("2026-04-26", "sad"),
    makeEntry("2026-04-27", "angry"),
  ]);

  assert.match(lens.title, /trending heavier/i);
  assert.match(lens.detail, /heavier than the earlier half/i);
});

run("buildVolatilityLens detects stronger entry-to-entry mood swings", () => {
  const lens = buildVolatilityLens([
    makeEntry("2026-04-20", "happy"),
    makeEntry("2026-04-21", "angry"),
    makeEntry("2026-04-22", "happy"),
    makeEntry("2026-04-23", "sad"),
    makeEntry("2026-04-24", "happy"),
  ]);

  assert.match(lens.title, /swinging more than settling/i);
  assert.match(lens.detail, /points from one check-in to the next/i);
});

run("buildAnalysisExperiments prioritizes the clearest main focus first", () => {
  const experiments = buildAnalysisExperiments({
    challengingTag: { tag: "work", count: 5 },
    supportiveTag: { tag: "walk", count: 3 },
    sleepSignal: null,
    stressSignal: {
      key: "stress",
      lowCount: 2,
      highCount: 5,
      lowAverageScore: 3.5,
      highAverageScore: 1,
      delta: -2.5,
    },
    energySignal: null,
    bestWeekday: { label: "Tue", count: 2 },
  });

  assert.equal(experiments[0]?.label, "Main focus");
  assert.match(experiments[0]?.title ?? "", /#work/i);
});

run("buildPatternCards turns a supportive tag into a decision-style insight", () => {
  const cards = buildPatternCards({
    supportiveTag: { tag: "exercise", count: 4 },
    challengingTag: undefined,
    topTag: undefined,
    bestWeekday: undefined,
    strongestCombo: null,
    mostCommonMood: { mood: "happy", count: 5 },
  });

  assert.equal(cards[0]?.label, "Support to repeat");
  assert.match(cards[0]?.pattern ?? "", /#exercise/i);
  assert.match(cards[0]?.meaning ?? "", /repeatable support/i);
  assert.match(cards[0]?.suggestion ?? "", /again this week/i);
});

run("buildPatternCards gives the fallback mood insight a so-what and next step", () => {
  const cards = buildPatternCards({
    supportiveTag: undefined,
    challengingTag: undefined,
    topTag: undefined,
    bestWeekday: undefined,
    strongestCombo: null,
    mostCommonMood: { mood: "happy", count: 3 },
  });

  assert.equal(cards[0]?.label, "Current baseline");
  assert.match(cards[0]?.pattern ?? "", /mostly happy/i);
  assert.match(cards[0]?.meaning ?? "", /baseline worth protecting/i);
  assert.match(cards[0]?.suggestion ?? "", /helpful routine/i);
});

run("buildNarrativeSummary creates a plain-English story from the strongest signals", () => {
  const narrative = buildNarrativeSummary({
    entries: [
      makeEntry("2026-04-20", "happy"),
      makeEntry("2026-04-21", "neutral"),
      makeEntry("2026-04-22", "happy"),
      makeEntry("2026-04-23", "sad"),
      makeEntry("2026-04-24", "anxious"),
      makeEntry("2026-04-25", "sad"),
      makeEntry("2026-04-26", "neutral"),
    ],
    supportiveTag: { tag: "walk", count: 3 },
    challengingTag: { tag: "work", count: 4 },
    strongestContext: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1.5,
      delta: -2,
    },
    sleepSignal: {
      key: "sleep",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 2,
      highAverageScore: 4,
      delta: 2,
    },
    stressSignal: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1.5,
      delta: -2,
    },
    energySignal: null,
    bestWeekday: { label: "Fri", count: 2 },
  });

  assert.equal(narrative.eyebrow, "Plain-English read");
  assert.ok(
    /does not look random/i.test(narrative.summary) ||
      /stress is the clearest drag/i.test(narrative.summary) ||
      /pressure pattern/i.test(narrative.summary)
  );
  assert.match(narrative.summary, /#walk/i);
  assert.match(narrative.focus, /#work/i);
});

run("buildNarrativeSummary uses a pressure-pattern story when stress and hard moods dominate", () => {
  const narrative = buildNarrativeSummary({
    entries: [
      makeEntry("2026-04-20", "neutral"),
      makeEntry("2026-04-21", "sad"),
      makeEntry("2026-04-22", "anxious"),
      makeEntry("2026-04-23", "sad"),
      makeEntry("2026-04-24", "angry"),
      makeEntry("2026-04-25", "sad"),
    ],
    supportiveTag: { tag: "rest", count: 2 },
    challengingTag: { tag: "work", count: 4 },
    strongestContext: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1,
      delta: -2.5,
    },
    sleepSignal: null,
    stressSignal: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1,
      delta: -2.5,
    },
    energySignal: null,
    bestWeekday: null,
  });

  assert.match(narrative.summary, /pressure pattern/i);
  assert.match(narrative.summary, /#work/i);
});

run("buildNarrativeSummary uses a volatility story when swings are the main pattern", () => {
  const narrative = buildNarrativeSummary({
    entries: [
      makeEntry("2026-04-20", "happy"),
      makeEntry("2026-04-21", "angry"),
      makeEntry("2026-04-22", "happy"),
      makeEntry("2026-04-23", "sad"),
      makeEntry("2026-04-24", "happy"),
      makeEntry("2026-04-25", "angry"),
    ],
    supportiveTag: { tag: "walk", count: 2 },
    challengingTag: undefined,
    strongestContext: null,
    sleepSignal: null,
    stressSignal: null,
    energySignal: null,
    bestWeekday: null,
  });

  assert.match(narrative.summary, /bigger story is volatility/i);
  assert.match(narrative.summary, /#walk/i);
});

run("buildNarrativeSummary uses early timeframe wording for the first few check-ins", () => {
  const narrative = buildNarrativeSummary({
    entries: [
      makeEntry("2026-04-20", "happy"),
      makeEntry("2026-04-22", "neutral"),
      makeEntry("2026-04-24", "sad"),
    ],
    supportiveTag: undefined,
    challengingTag: undefined,
    strongestContext: null,
    sleepSignal: null,
    stressSignal: null,
    energySignal: null,
    bestWeekday: null,
  });

  assert.match(narrative.summary, /your first few check-ins/i);
});

run("buildNarrativeSummary uses this-week wording when recent data is concentrated", () => {
  const narrative = buildNarrativeSummary({
    entries: [
      makeEntry("2026-04-21", "happy"),
      makeEntry("2026-04-22", "neutral"),
      makeEntry("2026-04-23", "sad"),
      makeEntry("2026-04-24", "neutral"),
      makeEntry("2026-04-25", "happy"),
      makeEntry("2026-04-26", "neutral"),
      makeEntry("2026-04-27", "happy"),
    ],
    supportiveTag: { tag: "walk", count: 3 },
    challengingTag: { tag: "work", count: 2 },
    strongestContext: null,
    sleepSignal: null,
    stressSignal: null,
    energySignal: null,
    bestWeekday: null,
  });

  assert.match(narrative.summary, /this week/i);
});

run("buildNarrativeSummary admits when context is still too sparse to explain the pattern", () => {
  const narrative = buildNarrativeSummary({
    entries: [
      makeEntry("2026-04-21", "happy"),
      makeEntry("2026-04-22", "neutral"),
      makeEntry("2026-04-23", "sad"),
      makeEntry("2026-04-24", "neutral"),
      makeEntry("2026-04-25", "happy"),
    ],
    supportiveTag: { tag: "walk", count: 2 },
    challengingTag: { tag: "work", count: 2 },
    strongestContext: null,
    sleepSignal: null,
    stressSignal: null,
    energySignal: null,
    bestWeekday: null,
    sleepCount: 1,
    stressCount: 0,
    energyCount: 3,
  });

  assert.match(narrative.summary, /sleep and stress may matter here too/i);
  assert.match(narrative.summary, /not enough logs/i);
});

run("buildAnalysisExperiments prioritizes a repeated hard combo over isolated signals", () => {
  const experiments = buildAnalysisExperiments({
    supportiveTag: { tag: "walk", count: 2 },
    challengingTag: { tag: "work", count: 4 },
    sleepSignal: {
      key: "sleep",
      lowCount: 3,
      highCount: 2,
      lowAverageScore: 1.5,
      highAverageScore: 3.5,
      delta: 2,
    },
    stressSignal: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1.5,
      delta: -2,
    },
    energySignal: null,
    bestWeekday: null,
    strongestCombo: {
      features: ["high_stress", "low_sleep"],
      count: 3,
      averageScore: 1,
      deltaFromBaseline: -1.8,
      tone: "challenging",
    },
  });

  assert.equal(experiments[0]?.label, "Main focus");
  assert.match(experiments[0]?.title ?? "", /sleep before high-stress days/i);
});

run("buildNarrativeSummary calls out when a repeated combo is the real story", () => {
  const narrative = buildNarrativeSummary({
    entries: [
      makeEntry("2026-04-21", "neutral"),
      makeEntry("2026-04-22", "sad"),
      makeEntry("2026-04-23", "anxious"),
      makeEntry("2026-04-24", "sad"),
      makeEntry("2026-04-25", "neutral"),
      makeEntry("2026-04-26", "sad"),
    ],
    supportiveTag: undefined,
    challengingTag: { tag: "work", count: 3 },
    strongestContext: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1.5,
      delta: -2,
    },
    sleepSignal: null,
    stressSignal: {
      key: "stress",
      lowCount: 2,
      highCount: 4,
      lowAverageScore: 3.5,
      highAverageScore: 1.5,
      delta: -2,
    },
    energySignal: null,
    bestWeekday: null,
    sleepCount: 4,
    stressCount: 4,
    energyCount: 0,
    strongestCombo: {
      features: ["high_stress", "low_sleep"],
      count: 3,
      averageScore: 1,
      deltaFromBaseline: -1.8,
      tone: "challenging",
    },
  });

  assert.match(narrative.summary, /high stress landing on low-sleep days/i);
  assert.match(narrative.focus, /sleep before high-stress days/i);
  assert.equal(narrative.comboTitle, "Strong combo detected");
  assert.match(narrative.comboDetail ?? "", /High stress \+ low sleep/i);
  assert.equal(narrative.comboFilter, "high_stress|low_sleep");
  assert.ok(
    (narrative.actions ?? []).some((action) => action.label === "Open pressure days")
  );
  assert.ok(
    (narrative.actions ?? []).some((action) => action.label === "Open combo days")
  );
});

run("isFutureISODate only flags dates after the current local day", () => {
  const now = new Date(2026, 3, 29, 12, 0, 0, 0);

  assert.equal(isFutureISODate("2026-04-28", now), false);
  assert.equal(isFutureISODate("2026-04-29", now), false);
  assert.equal(isFutureISODate("2026-04-30", now), true);
});

run("getMillisecondsUntilNextLocalDay measures time to the next midnight", () => {
  const now = new Date(2026, 3, 29, 23, 59, 59, 500);

  assert.equal(getMillisecondsUntilNextLocalDay(now), 500);
});

run("moodStorage serializes concurrent writes for the same day", async () => {
  const { moodStorage } = loadStorageHarness();

  await Promise.all([
    moodStorage.setMoodForDate("2026-04-29", "happy"),
    moodStorage.setTagsForDate("2026-04-29", ["work"]),
  ]);

  const entry = await moodStorage.getByDate("2026-04-29");

  assert.equal(entry?.mood, "happy");
  assert.deepEqual(entry?.tags, ["work"]);
});

run("moodStorage replaceAll sanitizes invalid entries and cleans tags", async () => {
  const { moodStorage } = loadStorageHarness();

  const restored = await moodStorage.replaceAll([
    makeEntry("2026-04-29", "happy", {
      tags: ["  work  ", "rest", "work"],
      sleep: 9,
      stress: 0,
    }),
    makeEntry("2026-02-30", "sad"),
  ]);

  assert.equal(restored.length, 1);
  assert.deepEqual(restored[0]?.tags, ["rest", "work"]);
  assert.equal(restored[0]?.sleep, 5);
  assert.equal(restored[0]?.stress, 1);
});

run("importBackupPayloadAsync merge keeps current reminders and newer entry versions", async () => {
  const { moodStorage, appSettingsStorage, backupUtils } = loadStorageHarness();

  await moodStorage.replaceAll([
    makeEntry("2026-04-29", "happy", {
      updatedAt: 1,
      tags: ["rest"],
    }),
  ]);
  await appSettingsStorage.replaceAll({
    customTags: ["rest"],
    reminders: {
      enabled: true,
      time: "21:30",
      weekdays: [1, 3, 5],
      skipIfLogged: true,
    },
  });

  const backupPayload = JSON.stringify({
    version: 1,
    exportedAt: "2026-04-29T10:00:00.000Z",
    entries: [
      makeEntry("2026-04-29", "sad", {
        updatedAt: 2,
        tags: ["work"],
      }),
      makeEntry("2026-04-28", "neutral", {
        updatedAt: 2,
      }),
    ],
    settings: {
      customTags: ["work"],
      reminders: {
        enabled: false,
        time: "08:00",
        weekdays: [0, 2, 4],
        skipIfLogged: false,
      },
    },
  });

  const result = await backupUtils.importBackupPayloadAsync(backupPayload, "merge");
  const mergedEntries = await moodStorage.getAll();
  const mergedSettings = await appSettingsStorage.getAll();

  assert.equal(result.entryCount, 2);
  assert.equal(mergedEntries[0]?.date, "2026-04-29");
  assert.equal(mergedEntries[0]?.mood, "sad");
  assert.deepEqual(mergedSettings.customTags, ["rest", "work"]);
  assert.equal(mergedSettings.reminders.enabled, true);
  assert.equal(mergedSettings.reminders.time, "21:30");
});

run("importBackupPayloadAsync replace swaps entries and settings entirely", async () => {
  const { moodStorage, appSettingsStorage, backupUtils } = loadStorageHarness();

  await moodStorage.replaceAll([makeEntry("2026-04-20", "happy")]);
  await appSettingsStorage.replaceAll({
    customTags: ["old"],
    reminders: {
      enabled: true,
      time: "19:00",
      weekdays: [1, 2, 3, 4, 5],
      skipIfLogged: true,
    },
  });

  const backupPayload = JSON.stringify({
    version: 1,
    exportedAt: "2026-04-29T10:00:00.000Z",
    entries: [makeEntry("2026-04-29", "anxious", { tags: ["deadline"] })],
    settings: {
      customTags: ["deadline"],
      reminders: {
        enabled: false,
        time: "08:15",
        weekdays: [0, 6],
        skipIfLogged: false,
      },
    },
  });

  const result = await backupUtils.importBackupPayloadAsync(backupPayload, "replace");
  const restoredEntries = await moodStorage.getAll();
  const restoredSettings = await appSettingsStorage.getAll();

  assert.equal(result.entryCount, 1);
  assert.equal(restoredEntries[0]?.date, "2026-04-29");
  assert.equal(restoredEntries[0]?.mood, "anxious");
  assert.deepEqual(restoredSettings.customTags, ["deadline"]);
  assert.equal(restoredSettings.reminders.enabled, false);
  assert.equal(restoredSettings.reminders.time, "08:15");
});

Promise.all(pendingRuns)
  .then(() => {
    console.log("All interpretation tests passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
