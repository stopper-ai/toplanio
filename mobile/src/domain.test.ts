import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  categories,
  emptyDraft,
  initialState,
  slugify,
  validateDraft,
  createCommunity,
  parseStoredState,
} from "./domain.ts";

const good = () => ({
  ...emptyDraft,
  name: "İstanbul Bisiklet",
  slug: "istanbul-bisiklet",
});

test("Turkish community names yield portable bounded addresses", () => {
  assert.equal(
    slugify("  İSTANBUL Işık Çığ ÖĞÜ Şenlik  "),
    "istanbul-isik-cig-ogu-senlik",
  );
  assert.equal(slugify("Koşu & Yürüyüş / 2026!"), "kosu-yuruyus-2026");
  assert.ok(slugify("uzun-".repeat(20)).length <= 48);
  assert.ok(!slugify("uzun-".repeat(20)).endsWith("-"));
});

test("creation enforces fields and duplicate local addresses", () => {
  assert.equal(categories.length, 30);
  assert.equal(validateDraft(good()), null);
  for (const slug of ["", "ab", "-abc", "abc-", "ABC", "a b", "a".repeat(49)]) {
    assert.ok(validateDraft({ ...good(), slug }), slug);
  }
  assert.ok(validateDraft({ ...good(), name: " " }));
  assert.ok(validateDraft({ ...good(), type: "unknown" }));
  assert.ok(validateDraft({ ...good(), color: "#zzz" }));
  const community = createCommunity(
    { ...good(), name: "  İstanbul Bisiklet  " },
    [],
  );
  assert.equal(community.name, "İstanbul Bisiklet");
  assert.ok(community.id.startsWith("local-"));
  assert.throws(() => createCommunity(good(), [community]), /zaten/);
});

test("storage roundtrip preserves partial draft and locally created community", () => {
  const state = initialState();
  state.draft.name = "Yarım kalan";
  state.communities.push(createCommunity(good(), []));
  assert.deepEqual(parseStoredState(JSON.stringify(state)), state);
  const another = initialState();
  assert.equal(another.draft.name, "");
  assert.deepEqual(parseStoredState(null), another);
});

test("storage rejects corrupt, unknown, incomplete and duplicate data without reset", () => {
  for (const raw of ["", "null", "{", '{"version":2}', '{"version":1}']) {
    assert.throws(() => parseStoredState(raw));
  }
  const community = createCommunity(good(), []);
  const state = { ...initialState(), communities: [community, community] };
  assert.throws(() => parseStoredState(JSON.stringify(state)), /doğrulanamadı/);
  assert.throws(() =>
    parseStoredState(
      JSON.stringify({
        ...initialState(),
        communities: [{ ...community, createdAt: "bad" }],
      }),
    ),
  );
});
