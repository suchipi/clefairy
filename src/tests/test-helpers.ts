import { run } from "../index";
import { pathMarker } from "path-less-traveled";
import { walk } from "bibarel";
import { Path } from "clef-parse";

export const rootDir = pathMarker(__dirname, "../..");

export async function doRun(
  opts: { [key: string]: any },
  callback: (...args: any) => any,
  argv: Array<string>,
) {
  let exitCode: number = 0;
  const exit = (code?: number) => {
    exitCode = code ?? exitCode;
  };
  let printedErrors: Array<any> = [];
  const printError = (formattedError: string) => {
    printedErrors.push(formattedError);
  };

  let error: unknown = null;
  try {
    await run(opts, callback, { argv, exit, printError });
  } catch (err) {
    error = err;
  }

  return {
    exitCode,
    printedErrors,
    error,
  };
}

export function clean<T>(value: T): T {
  return walk(value, (value) => {
    if (value instanceof Path) {
      return value.replace(rootDir(), "<rootDir>");
    } else if (typeof value === "string") {
      return value
        .replaceAll(rootDir(), "<rootDir>")
        .replaceAll(
          /(?:\s+at[^\n]+\r?(?:\n|$))+/g,
          "\n  at [stacktrace redacted]",
        );
    } else {
      return value;
    }
  });
}

export class DataBag {
  set(key: string, value: any): void;
  set(obj: { [key: string]: any }): void;
  set(keyOrObj: any, maybeValue?: any): void {
    if (typeof keyOrObj === "string") {
      this[keyOrObj] = maybeValue;
    } else {
      Object.assign(this, keyOrObj);
    }
  }
}
