import { test, expect } from "vitest";
import {
  optionalBoolean,
  optionalNumber,
  optionalPath,
  optionalString,
  requiredBoolean,
  requiredNumber,
  requiredPath,
  requiredString,
  checkOptions,
  getHints,
} from "../index";
import { doRun, clean, DataBag } from "./test-helpers";
import { parseArgv } from "clef-parse";

test("supports several different cli flag forms", async () => {
  const schema = {
    a: optionalString,
    aye: optionalString,
    bee: optionalString,
    ayeBee: optionalString,
    ayeBeeCee: optionalString,
    ayeBeeCeeDee: optionalString,
    almostThere: optionalNumber,
    theLastOne: optionalBoolean,
  } as const;

  const argv = [
    "-a",
    "letter",
    "--aye",
    "hoi",
    "-bee",
    "buzz",
    "--ayeBee",
    "buzzy pirate",
    "--aye-bee-cee",
    "alphabet",
    "--aye-bee-cee-dee=singing",
    "--the_last_one",
    "--ALMOST_THERE=3",
  ];

  const hints = getHints(schema);
  const result = parseArgv(argv, hints);

  expect(() => {
    checkOptions(schema, result.options);
  }).not.toThrowError();
});

test("errors when args object has non-camelcase name", async () => {
  const schema = {
    SOME_THING: optionalNumber,
  } as const;

  const argv = [];

  const hints = getHints(schema);
  const result = parseArgv(argv, hints);

  expect(() => {
    checkOptions(schema, result.options);
  }).toThrowErrorMatchingInlineSnapshot('"All option keys must be in camelCase. This one wasn\'t: \\"SOME_THING\\""');
});

test("errors when required arg isn't present", async () => {
  const schema = {
    something: requiredNumber,
  } as const;

  const argv = [];

  const hints = getHints(schema);
  const result = parseArgv(argv, hints);

  expect(() => {
    checkOptions(schema, result.options);
  }).toThrowErrorMatchingInlineSnapshot('"\'something\' is required, but it wasn\'t specified. Please specify it using --something."');
});

test("errors when required arg is wrong type", async () => {
  const schema = {
    something: requiredNumber,
  } as const;

  const argv = ["--something", "potato"];

  const hints = getHints(schema);
  const result = parseArgv(argv, hints);

  expect(() => {
    checkOptions(schema, result.options);
  }).toThrowErrorMatchingInlineSnapshot('"\'something\' has the wrong type: should have been \'requiredNumber\', but got: NaN"');
});

test("errors when optional arg is wrong type", async () => {
  const schema = {
    something: optionalNumber,
  } as const;

  const argv = ["--something", "potato"];

  const hints = getHints(schema);
  const result = parseArgv(argv, hints);

  expect(() => {
    checkOptions(schema, result.options);
  }).toThrowErrorMatchingInlineSnapshot('"\'something\' has the wrong type: should have been \'optionalNumber\', but got: NaN"');
});
