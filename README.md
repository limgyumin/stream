# @milim/stream

`@milim/stream` is a light-weight library that allows you to handle SSE (Server-Sent Events) in a type-safe way with a simple interface.

## Usage

First, pass the request configuration object to the `stream` function.

```ts
import { stream } from '@milim/stream';

stream({
  method: 'POST',
  url: 'https://example.com/stream',
});
```

Then, read the stream using a `for await...of` loop, and that’s it!

```ts
import { stream } from '@milim/stream';

const chunks = stream({
  method: 'POST',
  url: 'https://example.com/stream',
});

for await (const chunk of chunks) {
  console.log(chunk.data);
}
```

## Why use @milim/stream?

- Overcomes the limitations of [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).
  - Compatible with all request methods, not just GET.
  - Supports including a request body.
  - Supports including request headers.
- Ensures complete events even when receiving irregular event data through a robust parser and Web Streams pipeline built to comply with the [WHATWG](https://html.spec.whatwg.org/multipage/server-sent-events.html) standard.
