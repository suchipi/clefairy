import { Path } from "clef-parse";

export const requiredString = Symbol("requiredString");
export const requiredNumber = Symbol("requiredNumber");
export const requiredBoolean = Symbol("requiredBoolean");
export const requiredPath = Symbol("requiredPath");

export const requiredSymbols = new Set([
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
          ? Path
          : Input extends typeof optionalString
            ? string | undefined
            : Input extends typeof optionalNumber
              ? number | undefined
              : Input extends typeof optionalBoolean
                ? boolean | undefined
                : Input extends typeof optionalPath
                  ? Path | undefined
                  : never;

export function valueMatchesSymbolType(value: any, symbol: TypeSymbol) {
  switch (symbol) {
    case requiredPath: {
      return value instanceof Path;
    }
    case requiredString: {
      return typeof value === "string";
    }
    case optionalPath: {
      return value instanceof Path || value == null;
    }
    case optionalString: {
      return typeof value === "string" || value == null;
    }
    case requiredNumber: {
      return typeof value === "number" && !Number.isNaN(value);
    }
    case optionalNumber: {
      return (
        (typeof value === "number" && !Number.isNaN(value)) || value == null
      );
    }
    case requiredBoolean: {
      return typeof value === "boolean";
    }
    case optionalBoolean: {
      return typeof value === "boolean" || value == null;
    }
  }
}
