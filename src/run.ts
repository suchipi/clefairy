import { parseArgv } from "clef-parse";
import { runMain } from "@suchipi/run-main";
import { TypeSymbol, TypeSymbolToType } from "./symbols";
import { checkOptions } from "./check-options";
import { getHints } from "./get-hints";

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
): Promise<void> {
  const exit = runOptions.exit ?? process.exit.bind(process);
  const printError = runOptions.printError ?? console.error;

  return runMain(
    () => {
      const hints = getHints(argsObject);

      const { options, positionalArgs } = parseArgv(
        runOptions.argv || process.argv.slice(2),
        hints,
      );

      checkOptions(argsObject, options);

      return mainFunction(options as any, ...positionalArgs);
    },
    {
      exit,
      printError,
    },
  );
}
