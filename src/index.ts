import * as changeCase from "change-case";
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
    const flagToPropertyNameMap: { [key: string]: string } = {};
    const flagToSymbolMap: { [key: string]: TypeSymbol } = {};
    const propertyNameToFlagNamesMap: { [key: string]: Array<string> } = {};

    for (const [key, value] of Object.entries(argsObject)) {
      const flagNames: Array<string> = [];
      if (key.length === 1) {
        flagNames.push("-" + key);
      } else {
        flagNames.push("--" + changeCase.paramCase(key));
      }

      propertyNameToFlagNamesMap[key] = flagNames;

      for (const flagName of flagNames) {
        flagToPropertyNameMap[flagName] = key;
        flagToSymbolMap[flagName] = value;
      }
    }

    const options: any = {};
    const positionalArgs: Array<any> = [];

    const argv = runOptions.argv || process.argv.slice(2);
    const argvCopy = argv.slice();
    let unknownAllowed = runOptions.allowUnknownFlags || false;

    while (argvCopy.length > 0) {
      let item = argvCopy.shift();
      if (item == null) continue;
      if (typeof item !== "string") {
        item = String(item);
      }

      if (item === "--") {
        unknownAllowed = true;
        continue;
      }

      const argType = flagToSymbolMap[item];
      if (!argType) {
        if (item.startsWith("-") && !unknownAllowed) {
          const err = new Error("Unknown command-line option: " + item);
          Object.assign(err, {
            validOptions: Object.keys(flagToPropertyNameMap),
          });
          throw err;
        } else {
          positionalArgs.push(item);
          continue;
        }
      }

      let value: any;
      switch (argType) {
        case requiredBoolean:
        case optionalBoolean: {
          if (argvCopy[0] === "false") {
            argvCopy.shift();
            value = false;
          } else {
            value = true;
          }
          break;
        }
        case requiredString:
        case optionalString: {
          value = argvCopy.shift();
          if (value == null) {
            throw new Error(
              `Expected value after command-line option '${item}'`
            );
          }
          break;
        }
        case requiredNumber:
        case optionalNumber: {
          value = argvCopy.shift();
          if (value == null) {
            throw new Error(
              `Expected value after command-line option '${item}'`
            );
          }
          value = Number(value);
          break;
        }
      }

      const key = flagToPropertyNameMap[item];
      options[key] = value;
    }

    const requiredOptionNames = Object.entries(argsObject)
      .filter(([_key, value]) => requiredSymbols.has(value))
      .map(([key]) => key);

    for (const key of requiredOptionNames) {
      if (options[key] == null) {
        const flagNames = propertyNameToFlagNamesMap[key];
        const err = new Error(
          `'${key}' is required, but it wasn't specified. Please specify it using ${flagNames
            .slice(0, -1)
            .join(", ")}, or ${flagNames[flagNames.length - 1]}.`
        );
        Object.assign(err, { flagNames });
        throw err;
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
