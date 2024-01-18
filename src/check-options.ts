import * as changeCase from "change-case";
import { TypeSymbol, TypeSymbolToType, requiredSymbols } from "./symbols";

export function checkOptions<ArgsObject extends { [key: string]: TypeSymbol }>(
  schema: ArgsObject,
  options: any,
): asserts options is {
  [key in keyof ArgsObject]: TypeSymbolToType<ArgsObject[key]>;
} {
  for (const key of Object.keys(schema)) {
    if (changeCase.camelCase(key) !== key) {
      throw new Error(
        `All option keys must be in camelCase. This one wasn't: ${JSON.stringify(
          key,
        )}`,
      );
    }
  }

  const requiredOptionNames = Object.entries(schema)
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
}
