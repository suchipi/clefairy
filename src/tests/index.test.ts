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
} from "../index";
import { doRun, clean, DataBag } from "./test-helpers";

test("basic success", async () => {
  const data = new DataBag();

  const result = await doRun(
    { help: optionalBoolean, inputPath: requiredPath },
    (options, ...args) => {
      data.set({ options, args });
    },
    ["--input-path", "myfile.txt", "another-file.png"],
  );

  expect(clean({ result, data })).toMatchInlineSnapshot(`
    {
      "data": DataBag {
        "args": [
          "another-file.png",
        ],
        "options": {
          "inputPath": "<rootDir>/myfile.txt",
        },
      },
      "result": {
        "error": null,
        "exitCode": 0,
        "printedErrors": [],
      },
    }
  `);
});

test("sync error throw", async () => {
  const data = new DataBag();

  const result = await doRun(
    {},
    (options, ...args) => {
      throw new Error("bad!!!");
    },
    ["stuff", "yeah stuff"],
  );

  expect(clean({ result, data })).toMatchInlineSnapshot(`
    {
      "data": DataBag {},
      "result": {
        "error": [Error: bad!!!],
        "exitCode": 1,
        "printedErrors": [
          "Error: bad!!!

    ./src/tests/index.test.ts:50:13        
    48   |     {},
    49   |     (options, ...args) => {
    50 > |       throw new Error(\\"bad!!!\\");
    51   |     },
    52   |     [\\"stuff\\", \\"yeah stuff\\"],
    53   |   );
      at [stacktrace redacted]",
        ],
      },
    }
  `);
});

test("async error throw", async () => {
  const data = new DataBag();

  const result = await doRun(
    {},
    async (options, ...args) => {
      throw new Error("bad again!!!");
    },
    ["stuff", "yeah stuff"],
  );

  expect(clean({ result, data })).toMatchInlineSnapshot(`
    {
      "data": DataBag {},
      "result": {
        "error": [Error: bad again!!!],
        "exitCode": 1,
        "printedErrors": [
          "Error: bad again!!!

    ./src/tests/index.test.ts:84:13              
    82   |     {},
    83   |     async (options, ...args) => {
    84 > |       throw new Error(\\"bad again!!!\\");
    85   |     },
    86   |     [\\"stuff\\", \\"yeah stuff\\"],
    87   |   );
      at [stacktrace redacted]",
        ],
      },
    }
  `);
});

test("returns rejected promise", async () => {
  const data = new DataBag();

  const result = await doRun(
    {},
    (options, ...args) => {
      return Promise.reject(new Error("nahh"));
    },
    ["stuff", "yeah stuff"],
  );

  expect(clean({ result, data })).toMatchInlineSnapshot(`
    {
      "data": DataBag {},
      "result": {
        "error": [Error: nahh],
        "exitCode": 1,
        "printedErrors": [
          "Error: nahh

    ./src/tests/index.test.ts:118:29                       
    116   |     {},
    117   |     (options, ...args) => {
    118 > |       return Promise.reject(new Error(\\"nahh\\"));
    119   |     },
    120   |     [\\"stuff\\", \\"yeah stuff\\"],
    121   |   );
      at [stacktrace redacted]",
        ],
      },
    }
  `);
});

test("supports several different cli flag forms", async () => {
  const data = new DataBag();

  const result = await doRun(
    {
      a: optionalString,
      aye: optionalString,
      bee: optionalString,
      ayeBee: optionalString,
      ayeBeeCee: optionalString,
      ayeBeeCeeDee: optionalString,
      almostThere: optionalNumber,
      theLastOne: optionalBoolean,
    },
    (options, ...args) => {
      data.set({ options, args });
    },
    [
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
    ],
  );

  expect(clean({ result, data })).toMatchInlineSnapshot(`
    {
      "data": DataBag {
        "args": [],
        "options": {
          "a": "letter",
          "almostThere": 3,
          "aye": "hoi",
          "ayeBeeCee": "alphabet",
          "ayeBeeCeeDee": "singing",
          "ayebee": "buzzy pirate",
          "bee": "buzz",
          "theLastOne": true,
        },
      },
      "result": {
        "error": null,
        "exitCode": 0,
        "printedErrors": [],
      },
    }
  `);
});

test("errors when args object has non-camelcase name", async () => {
  const data = new DataBag();

  const result = await doRun(
    {
      SOME_THING: optionalNumber,
    },
    (options, ...args) => {
      data.set({ options, args });
    },
    [],
  );

  expect(clean({ result, data })).toMatchInlineSnapshot(`
    {
      "data": DataBag {},
      "result": {
        "error": [Error: All option keys must be in camelCase. This one wasn't: "SOME_THING"],
        "exitCode": 1,
        "printedErrors": [
          "Error: All option keys must be in camelCase. This one wasn't: \\"SOME_THING\\"

    ./src/check-options.ts:12:13                                                   
    10   |   for (const key of Object.keys(schema)) {
    11   |     if (changeCase.camelCase(key) !== key) {
    12 > |       throw new Error(
    13   |         \`All option keys must be in camelCase. This one wasn't: \${JSO...
    14   |           key,
    15   |         )}\`,
      at [stacktrace redacted]",
        ],
      },
    }
  `);
});

test("errors when required arg isn't present", async () => {
  const data = new DataBag();

  const result = await doRun(
    {
      something: requiredNumber,
    },
    (options, ...args) => {
      data.set({ options, args });
    },
    [],
  );

  expect(clean({ result, data })).toMatchInlineSnapshot(`
    {
      "data": DataBag {},
      "result": {
        "error": [Error: 'something' is required, but it wasn't specified. Please specify it using --something.],
        "exitCode": 1,
        "printedErrors": [
          "Error: 'something' is required, but it wasn't specified. Please specify it using --something.

    ./src/check-options.ts:26:13                                                    
    24   |   for (const key of requiredOptionNames) {
    25   |     if (options[key] == null) {
    26 > |       throw new Error(
    27   |         \`'\${key}' is required, but it wasn't specified. Please specif...
    28   |           key.length === 1 ? \\"-\\" + key : \\"--\\" + changeCase.paramCase(key)
    29   |         }.\`,
      at [stacktrace redacted]",
        ],
      },
    }
  `);
});
