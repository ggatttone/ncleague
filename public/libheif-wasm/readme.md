```ts
declare const decode: (data: Uint8Array, option?: Partial<{
    needAlpha: boolean;
}>) => Promise<{
    data: Uint8Array;
    width: number;
    height: number;
    channel: number;
}>;

declare const encode: () => never;

export { decode, encode };

```

```ts
import fs from "fs";
import { decode } from "../src";
const main = async () => {
  const buf = fs.readFileSync("./heifs/compare_still_3.heic");
  const { width, height, channel, data } = await decode(buf);
  console.log(width, height, channel, width * height * channel, data.length);
};

main();

```