import test from "node:test";
import assert from "node:assert/strict";
import {
  computeSegments,
  getCurrentSegment,
  getWeekdayForDate,
  formatTimeWithDay,
  getDateKey
} from "../src/lib/choghadiya.ts";

test("creates 8 day and 8 night segments for London Feb 5 2026", () => {
  const sunrise = new Date(Date.UTC(2026, 1, 5, 7, 32));
  const sunset = new Date(Date.UTC(2026, 1, 5, 16, 57));
  const nextSunrise = new Date(Date.UTC(2026, 1, 6, 7, 31));
  const weekday = 4; // Thursday

  const { daySegments, nightSegments } = computeSegments({ sunrise, sunset, nextSunrise, weekday });

  assert.equal(daySegments.length, 8);
  assert.equal(nightSegments.length, 8);
  assert.equal(daySegments[0].start.getTime(), sunrise.getTime());
  assert.equal(daySegments[7].end.getTime(), sunset.getTime());
  assert.equal(nightSegments[0].start.getTime(), sunset.getTime());
  assert.equal(nightSegments[7].end.getTime(), nextSunrise.getTime());
});

test("weekday mapping respects timezone", () => {
  const date = new Date(Date.UTC(2026, 1, 5, 12, 0));
  const londonWeekday = getWeekdayForDate(date, "Europe/London");
  assert.equal(londonWeekday, 4);
});

test("current segment detection is inclusive of start and exclusive of end", () => {
  const sunrise = new Date(Date.UTC(2026, 1, 5, 6, 0));
  const sunset = new Date(Date.UTC(2026, 1, 5, 18, 0));
  const nextSunrise = new Date(Date.UTC(2026, 1, 6, 6, 0));
  const { daySegments } = computeSegments({ sunrise, sunset, nextSunrise, weekday: 4 });
  const first = daySegments[0];
  const atStart = getCurrentSegment(daySegments, new Date(first.start.getTime()));
  const atEnd = getCurrentSegment(daySegments, new Date(first.end.getTime()));
  assert.equal(atStart?.name, first.name);
  assert.notEqual(atEnd?.name, first.name);
});

test("formatting changes with timezone for late-night times", () => {
  const sunrise = new Date(Date.UTC(2026, 1, 5, 23, 30));
  const baseDateKey = getDateKey(sunrise, "UTC");
  const utcDisplay = formatTimeWithDay(sunrise, "UTC", baseDateKey);
  const istDisplay = formatTimeWithDay(sunrise, "Asia/Kolkata", baseDateKey);
  assert.notEqual(utcDisplay, istDisplay);
});
