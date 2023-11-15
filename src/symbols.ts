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
