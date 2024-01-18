import { Hint, Path } from "clef-parse";
import {
  TypeSymbol,
  optionalBoolean,
  optionalNumber,
  optionalPath,
  optionalString,
  requiredBoolean,
  requiredNumber,
  requiredPath,
  requiredString,
} from "./symbols";

export function getHints(argsObject: { [key: string]: TypeSymbol }): {
  [key: string]: Hint;
} {
  const hints: {
    [key: string]: Hint;
  } = {};

  for (const [key, value] of Object.entries(argsObject)) {
    const hintValue = (
      {
        [requiredString]: String,
        [requiredNumber]: Number,
        [requiredBoolean]: Boolean,
        [requiredPath]: Path,
        [optionalString]: String,
        [optionalNumber]: Number,
        [optionalBoolean]: Boolean,
        [optionalPath]: Path,
      } as const
    )[value];

    if (hintValue != null) {
      hints[key] = hintValue;
    }
  }

  return hints;
}
