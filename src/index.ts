import * as changeCase from "change-case";
import { parseArgv } from "clef-parse";
import { formatError } from "pretty-print-error";

export const requiredString = Symbol("requiredString");
export const requiredNumber = Symbol("requiredNumber");
export const requiredBoolean = Symbol("requiredBoolean");

const requiredSymbols = new Set([
  requiredString,
  requiredNumber,
  requiredBoolean,
]);

export const optionalString = Symbol("optionalString");
export const optionalNumber = Symbol("optionalNumber");
export const optionalBoolean = Symbol("optionalBoolean");

export type TypeSymbol =
  | typeof requiredString
  | typeof requiredNumber
  | typeof requiredBoolean
  | typeof optionalString
  | typeof optionalNumber
  | typeof optionalBoolean;

export type TypeSymbolToType<Input extends TypeSymbol> =
  Input extends typeof requiredString
    ? string
    : Input extends typeof requiredNumber
    ? number
    : Input extends typeof requiredBoolean
    ? boolean
    : Input extends typeof optionalString
    ? string | undefined
    : Input extends typeof optionalNumber
    ? number | undefined
    : Input extends typeof optionalBoolean
    ? boolean | undefined
    : never;

export type ArgsObjectToOptions<Input extends { [key: string]: TypeSymbol }> = {
  [key in keyof Input]: TypeSymbolToType<Input[key]>;
};

export function run<ArgsObject extends { [key: string]: TypeSymbol }>(
  argsObject: ArgsObject,
  mainFunction: (
    options: {
      [key in keyof ArgsObject]: TypeSymbolToType<ArgsObject[key]>;
    },
    ...args: Array<string>
  ) => any,
  runOptions: { allowUnknownFlags?: boolean; argv?: Array<string> } = {}
) {
  try {
    for (const key of Object.keys(argsObject)) {
      if (changeCase.camelCase(key) !== key) {
        throw new Error(
          `All option keys must be in camelCase. This one wasn't: ${JSON.stringify(
            key
          )}`
        );
      }
    }

    const hints = {};

    for (const [key, value] of Object.entries(argsObject)) {
      const hintValue = {
        [requiredString]: String,
        [requiredNumber]: Number,
        [requiredBoolean]: Boolean,
        [optionalString]: String,
        [optionalNumber]: Number,
        [optionalBoolean]: Boolean,
      }[value];

      if (hintValue != null) {
        hints[key] = hintValue;
      }
    }

    const { options, positionalArgs } = parseArgv(
      runOptions.argv || process.argv.slice(2),
      hints
    );

    const requiredOptionNames = Object.entries(argsObject)
      .filter(([_key, value]) => requiredSymbols.has(value))
      .map(([key]) => key);

    for (const key of requiredOptionNames) {
      if (options[key] == null) {
        throw new Error(
          `'${key}' is required, but it wasn't specified. Please specify it using ${
            key.length === 1 ? "-" + key : "--" + changeCase.paramCase(key)
          }.`
        );
      }
    }

    const result = mainFunction(options, ...positionalArgs);
    if (
      typeof result === "object" &&
      result != null &&
      typeof result.then === "function"
    ) {
      result.then(
        () => {},
        (err) => {
          console.error(formatError(err));
          process.exit(1);
        }
      );
    }
  } catch (err) {
    console.error(formatError(err));
    process.exit(1);
  }
}
