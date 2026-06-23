import assert from "node:assert/strict";
import test from "node:test";
import {
  buildForvoUserProfileUrl,
  extractForvoPronouncedWordCount,
  extractForvoUsernameFromAccountPage,
  normalizeForvoProfileStats,
  shouldRefreshForvoProfileStats
} from "./profileStats.js";

test("extracts a Forvo username from the account page label", () => {
  const html = `
    <main>
      <h1>Мій профіль</h1>
      <p>Ім'я користувача:molodchyk</p>
      <p>Мова сайту:Українська (uk)</p>
    </main>
  `;

  assert.equal(extractForvoUsernameFromAccountPage(html), "molodchyk");
});

test("extracts a Forvo username from a profile form input", () => {
  const html = `<input id="username" name="username" value="molodchyk">`;

  assert.equal(extractForvoUsernameFromAccountPage(html), "molodchyk");
});

test("extracts the pronounced word count from the public user page", () => {
  const html = `
    <section>
      <h2>Вимовлені слова (65)</h2>
      <h2>Українська (65)</h2>
      <h3>Статистика користувача</h3>
      <p>Вимовлених слів: 65</p>
    </section>
  `;

  assert.equal(extractForvoPronouncedWordCount(html), 65);
});

test("extracts English pronounced word count labels", () => {
  assert.equal(extractForvoPronouncedWordCount("Pronounced words (1,234)"), 1234);
  assert.equal(extractForvoPronouncedWordCount("Words pronounced: 1 234"), 1234);
});

test("builds only secure Forvo profile URLs", () => {
  assert.equal(buildForvoUserProfileUrl("molodchyk"), "https://uk.forvo.com/user/molodchyk/");
  assert.equal(buildForvoUserProfileUrl("molodchyk", "https://forvo.com"), "https://forvo.com/user/molodchyk/");
  assert.equal(buildForvoUserProfileUrl("molodchyk", "https://example.com"), "");
  assert.equal(buildForvoUserProfileUrl("bad/name"), "");
});

test("normalizes stored profile stats", () => {
  assert.deepEqual(normalizeForvoProfileStats({
    username: "molodchyk",
    profileUrl: "https://uk.forvo.com/user/molodchyk/#top",
    totalPronunciations: 65.4,
    updatedAt: 123.4,
    lastError: "x".repeat(300)
  }), {
    username: "molodchyk",
    profileUrl: "https://uk.forvo.com/user/molodchyk/",
    totalPronunciations: 65,
    updatedAt: 123,
    lastError: "x".repeat(180)
  });
});

test("detects stale profile stats", () => {
  assert.equal(shouldRefreshForvoProfileStats({}, 1000), true);
  assert.equal(shouldRefreshForvoProfileStats({ updatedAt: 1000 }, 1000), false);
  assert.equal(shouldRefreshForvoProfileStats({ updatedAt: 1000 }, 1000 + 7 * 60 * 60 * 1000), true);
});
