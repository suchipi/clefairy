import util from "util";
import * as changeCase from "change-case";
import { parseArgv, Path } from "clef-parse";
import * as prettyPrintError from "pretty-print-error";
import { codePreviewFromError } from "code-preview-from-error";
import * as pheno from "pheno";

function formatError(error: unknown): string {
  if (!pheno.isOfType(error, pheno.Error_)) {
    return formatError(
      new Error(
        `Non-error value was thrown: ${util.inspect(error, { colors: true })}`
      )
    );
  }

  const formattedErrorString = prettyPrintError.formatError(error, {
    color: true,
  });
  const codeFrame = codePreviewFromError(error);

  if (codeFrame != null) {
    const [line1, ...otherLines] = formattedErrorString.split("\n");

    return [line1, "", codeFrame, "", ...otherLines].join("\n");
  } else {
    return formattedErrorString;
  }
}

export const requiredString = Symbol("requiredString");
export const requiredNumber = Symbol("requiredNumber");
export const requiredBoolean = Symbol("requiredBoolean");
export const requiredPath = Symbol("requiredPath");

const requiredSymbols = new Set([
  requiredString,
  requiredNumber,
  requiredBoolean,
  requiredPath,
]);

export const optionalString = Symbol("optionalString");
export const optionalNumber = Symbol("optionalNumber");
export const optionalBoolean = Symbol("optionalBoolean");
export const optionalPath = Symbol("optionalPath");

export type TypeSymbol =
  | typeof requiredString
  | typeof requiredNumber
  | typeof requiredBoolean
  | typeof requiredPath
  | typeof optionalString
  | typeof optionalNumber
  | typeof optionalBoolean
  | typeof optionalPath;

export type TypeSymbolToType<Input extends TypeSymbol> =
  Input extends typeof requiredString
    ? string
    : Input extends typeof requiredNumber
    ? number
    : Input extends typeof requiredBoolean
    ? boolean
    : Input extends typeof requiredPath
    ? string
    : Input extends typeof optionalString
    ? string | undefined
    : Input extends typeof optionalNumber
    ? number | undefined
    : Input extends typeof optionalBoolean
    ? boolean | undefined
    : Input extends typeof optionalPath
    ? string | undefined
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
  runOptions: { argv?: Array<string> } = {}
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
