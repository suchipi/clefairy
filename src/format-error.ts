import util from "util";
import * as prettyPrintError from "pretty-print-error";
import { codePreviewFromError } from "code-preview-from-error";
import * as pheno from "pheno";

export function formatError(error: unknown): string {
  if (!pheno.isOfType(error, pheno.Error)) {
    return formatError(
      new Error(
        `Non-error value was thrown: ${util.inspect(error, { colors: true })}`,
      ),
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
