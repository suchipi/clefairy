import * as changeCase from "change-case";
import {
  TypeSymbol,
  TypeSymbolToType,
  requiredSymbols,
  valueMatchesSymbolType,
} from "./symbols";

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

  for (const [key, symbol] of Object.entries(schema)) {
    const value = options[key];

    if (requiredSymbols.has(symbol) && value == null) {
      throw new Error(
        `'${key}' is required, but it wasn't specified. Please specify it using ${
          key.length === 1 ? "-" + key : "--" + changeCase.paramCase(key)
        }.`,
      );
    }

    if (!valueMatchesSymbolType(value, symbol)) {
      throw new Error(
        `'${key}' has the wrong type: should have been '${symbol.description}', but got: ${value}`,
      );
    }
  }
}
