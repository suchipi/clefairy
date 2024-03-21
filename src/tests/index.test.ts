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
          "inputPath": Path {
            "segments": [
              "<rootDir>",
              "myfile.txt",
            ],
            "separator": "/",
          },
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

    ./src/tests/index.test.ts:56:13        
    54   |     {},
    55   |     (options, ...args) => {
    56 > |       throw new Error(\\"bad!!!\\");
    57   |     },
    58   |     [\\"stuff\\", \\"yeah stuff\\"],
    59   |   );
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

    ./src/tests/index.test.ts:90:13              
    88   |     {},
    89   |     async (options, ...args) => {
    90 > |       throw new Error(\\"bad again!!!\\");
    91   |     },
    92   |     [\\"stuff\\", \\"yeah stuff\\"],
    93   |   );
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

    ./src/tests/index.test.ts:124:29                       
    122   |     {},
    123   |     (options, ...args) => {
    124 > |       return Promise.reject(new Error(\\"nahh\\"));
    125   |     },
    126   |     [\\"stuff\\", \\"yeah stuff\\"],
    127   |   );
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

    ./src/check-options.ts:17:13                                                   
    15   |   for (const key of Object.keys(schema)) {
    16   |     if (changeCase.camelCase(key) !== key) {
    17 > |       throw new Error(
    18   |         \`All option keys must be in camelCase. This one wasn't: \${JSO...
    19   |           key,
    20   |         )}\`,
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

    ./src/check-options.ts:29:13                                                    
    28   |     if (requiredSymbols.has(symbol) && value == null) {
    29 > |       throw new Error(
    30   |         \`'\${key}' is required, but it wasn't specified. Please specif...
    31   |           key.length === 1 ? \\"-\\" + key : \\"--\\" + changeCase.paramCase(key)
    32   |         }.\`,
      at [stacktrace redacted]",
        ],
      },
    }
  `);
});

test("errors when optional arg is wrong type", async () => {
  const data = new DataBag();

  const result = await doRun(
    {
      something: optionalNumber,
    },
    (options, ...args) => {
      data.set({ options, args });
    },
    ["--something", "potato"],
  );

  expect(clean({ result, data })).toMatchInlineSnapshot(`
    {
      "data": DataBag {},
      "result": {
        "error": [Error: 'something' has the wrong type: should have been 'optionalNumber', but got: NaN],
        "exitCode": 1,
        "printedErrors": [
          "Error: 'something' has the wrong type: should have been 'optionalNumber', but got: NaN

    ./src/check-options.ts:37:13                                                   
    36   |     if (!valueMatchesSymbolType(value, symbol)) {
    37 > |       throw new Error(
    38   |         \`'\${key}' has the wrong type: should have been '\${symbol.desc...
    39   |       );
    40   |     }
      at [stacktrace redacted]",
        ],
      },
    }
  `);
});
