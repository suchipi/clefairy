# clefairy

CLI creation helper

- Parses and validates argv according to your specification (and gives you TypeScript types)
- Calls your function, and, if an error occurs (via sync throw or Promise rejection):
  - Pretty-prints the error
  - Exits the process with status code 1

## Usage Example

```ts
import { run, optionalBoolean, requiredString, optionalString } from "clefairy";

run(
  {
    someColor: optionalString,
    someName: requiredString,
    v: optionalBoolean,
  },
  async (options, ...args) => {
    console.log({ options, args });
  },
  {
    // If you don't pass anything here, it defaults to process.argv.slice(2)
    // But I pass something here for this example to make it clearer how the
    // input argv maps to the options in the function.
    argv: ["-v", "--some-name", "Jeff", "one", "two", "--", "--hi"],
  }
);

// This gets logged:
// {
//   options: { v: true, someName: 'Jeff' },
//   args: [ 'one', 'two', '--hi' ]
// }
```

## License

MIT
