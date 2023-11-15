import * as changeCase from "change-case";
import { parseArgv, Path } from "clef-parse";
import { formatError } from "./format-error";
import {
  TypeSymbol,
  TypeSymbolToType,
  optionalBoolean,
  optionalNumber,
  optionalPath,
  optionalString,
  requiredBoolean,
  requiredNumber,
  requiredPath,
  requiredString,
  requiredSymbols,
} from "./symbols";
import Defer from "@suchipi/defer";

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
  runOptions: {
    argv?: Array<string>;
    printError?: (formattedError: string) => void;
    exit?: (code?: number) => void;
  } = {},
) {
  const exit = runOptions.exit ?? process.exit.bind(process);
  const printError = runOptions.printError ?? console.error;

  const ret = new Defer<void>();

  try {
    for (const key of Object.keys(argsObject)) {
      if (changeCase.camelCase(key) !== key) {
        throw new Error(
          `All option keys must be in camelCase. This one wasn't: ${JSON.stringify(
            key,
          )}`,
        );
      }
    }

    const hints = {};

    for (const [key, value] of Object.entries(argsObject)) {
      const hintValue = {
        [requiredString]: String,
        [requiredNumber]: Number,
        [requiredBoolean]: Boolean,
        [requiredPath]: Path,
        [optionalString]: String,
        [optionalNumber]: Number,
        [optionalBoolean]: Boolean,
        [optionalPath]: Path,
      }[value];

      if (hintValue != null) {
        hints[key] = hintValue;
      }
    }

    const { options, positionalArgs } = parseArgv(
      runOptions.argv || process.argv.slice(2),
      hints,
    );

    const requiredOptionNames = Object.entries(argsObject)
      .filter(([_key, value]) => requiredSymbols.has(value))
      .map(([key]) => key);

    for (const key of requiredOptionNames) {
      if (options[key] == null) {
        throw new Error(
          `'${key}' is required, but it wasn't specified. Please specify it using ${
            key.length === 1 ? "-" + key : "--" + changeCase.paramCase(key)
          }.`,
        );
      }
    }

    const result = mainFunction(options as any, ...positionalArgs);
    if (
      typeof result === "object" &&
      result != null &&
      typeof result.then === "function"
    ) {
      result.then(
        () => {
          ret.resolve();
        },
        (err) => {
          printError(formatError(err));
          ret.reject(err);
          exit(1);
        },
      );
    } else {
      ret.resolve();
    }
  } catch (err) {
    printError(formatError(err));
    ret.reject(err);
    exit(1);
  }

  return ret.promise;
}
