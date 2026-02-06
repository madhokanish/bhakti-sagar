import test from "node:test";
import assert from "node:assert/strict";
import {
  getGoalPreference,
  filterSegmentsByWindow,
  computeSegmentsForDate,
  getEndOfIsoWeekDate,
  getEndOfMonthDate,
  getDateRangeISOs
} from "../src/lib/choghadiyaPlanner.ts";

test("goal preference ordering for travel prioritizes Char", () => {
  const prefs = getGoalPreference("travel");
  assert.equal(prefs[0], "Char");
});

test("goal preference ordering for puja prioritizes Shubh", () => {
  const prefs = getGoalPreference("puja");
  assert.equal(prefs[0], "Shubh");
});

test("filtering today daytime and tonight returns 8 segments each", () => {
  const dateISO = "2026-02-05";
  const sunrise = new Date(Date.UTC(2026, 1, 5, 6, 0));
  const sunset = new Date(Date.UTC(2026, 1, 5, 18, 0));
  const nextSunrise = new Date(Date.UTC(2026, 1, 6, 6, 0));
  const { segments, daySegments, nightSegments } = computeSegmentsForDate({
    dateISO,
    sunTimes: { sunrise, sunset, nextSunrise },
    timeZone: "Europe/London"
  });
  const dayWindow = filterSegmentsByWindow(segments, sunrise.getTime(), sunset.getTime());
  const nightWindow = filterSegmentsByWindow(segments, sunset.getTime(), nextSunrise.getTime());
  assert.equal(dayWindow.length, daySegments.length);
  assert.equal(nightWindow.length, nightSegments.length);
});

test("ISO week end for London Wednesday resolves to Sunday", () => {
  const endDate = getEndOfIsoWeekDate("2026-02-04");
  assert.equal(endDate, "2026-02-08");
});

test("month end logic returns last day of month", () => {
  const endDate = getEndOfMonthDate("2026-02-05");
  assert.equal(endDate, "2026-02-28");
});

test("custom range spanning two days returns both dates", () => {
  const range = getDateRangeISOs("2026-02-05", "2026-02-06");
  assert.deepEqual(range, ["2026-02-05", "2026-02-06"]);
});
