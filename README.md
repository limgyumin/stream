# @milim/stream

A light-weight streaming utility that handles SSE (Server‑Sent Events) responses in a type-safe manner using [Fetch](https://developer.mozilla.org/ko/docs/Web/API/Fetch_API) + the [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API). It provides a simple API supporting both event-based and promise-based usage.

- Overcomes the limitations of [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).
  - Compatible with all request methods, not just GET.
  - Supports including a request body.
  - Supports including request headers.
- Guarantees complete events even in complex cases—such as chunk splitting or multiple events within a single chunk—through a robust parser following the [WHATWG](https://html.spec.whatwg.org/multipage/server-sent-events.html) standard and a Web Streams pipeline.

## Basic Usage

### Configure and connect a stream

Use the `createStream` function to configure a stream. Pass the request method, URL, headers, body, and other settings through the `config` object.

```ts
type GeminiGeneratedContentPart = {
  text: string;
};

type GeminiGeneratedContent = {
  parts: GeminiGeneratedContentPart[];
};

type GeminiGeneratedCandidate = {
  content: GeminiGeneratedContent;
};

type GeminiResponse = {
  candidates: GeminiGeneratedCandidate[];
};

const stream = createStream<GeminiResponse>({
  method: 'POST',
  url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent',
  query: {
    alt: 'sse',
  },
  headers: {
    'x-goog-api-key': GEMINI_API_KEY,
  },
  body: {
    contents: [
      {
        parts: [
          {
            text: 'Hi Gemini!',
          },
        ],
      },
    ],
  },
});
```

Then, call the `stream.connect` method on the stream object returned by `createStream` to execute it.

```ts
stream.connect();
```

### Subscribe life-cycle

To subscribe to the lifecycle of a stream, use the `stream.addEventListener` method.

You can listen for the `message` event when a message is received, the `error` event when an error occurs, and the `close` event when the stream is closed.

```ts
stream.addEventListener('message', (message) => {
  // handle message
});

stream.addEventListener('error', (error) => {
  // handle error
});

stream.addEventListener('close', () => {
  // handle close
});
```

Of course, you can also remove registered event listeners by calling the `removeEventListener` function.

```ts
stream.removeEventListener('message', handleMessage);
stream.removeEventListener('error', handleError);
stream.removeEventListener('close', handleClose);
```

## Variables

If you want to include variables when configuring a stream, you can define properties as functions within the options to pass the variables.

The option properties that can be defined as functions are `url`, `query`, and `body`.

```ts
// ...

type GeminiRequestPayload = {
  prompt: string;
};

const stream = createStream<GeminiResponse, GeminiRequestPayload>({
  // ...
  body: ({ prompt }) => ({
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  }),
});
```

If you configured the stream using variables, you can pass those variables when calling the `stream.connect` function.

```ts
stream.connect({ prompt: 'Hi Gemini!' });
```

## Using promise

You can use the `withPromise` function to handle a stream in a promise-based manner. When the function completes, it returns the last message received.

```ts
const stream = createStream<GeminiResponse>(...);

const latest = await withPromise(stream);
```

### Handle life-cycle

If you want to handle messages received during streaming in real time, pass an `onMessage` callback in the `options` object.

When using the `withPromise` function, errors are thrown if they occur, so you can handle them using `try/catch`.

```ts
try {
  const latest = await withPromise(stream, undefined, {
    onMessage: (message) => {
      // handle message
    },
  });
} catch (error) {
  // handle error
}
```

### With variables

Of course, you can still pass variables even when using the `withPromise` function.

```ts
const latest = await withPromise(stream, { prompt: 'Hi Gemini!' });
```

## Abort a stream

You can use `AbortController` to abort a stream. Both the `stream.connect` method and the `withPromise` function can receive a `signal` through the `options` object.

### Basic

```ts
const controller = new AbortController();

stream.connect(
  {
    prompt: 'Hi Gemini!',
  },
  {
    signal: controller.signal,
  },
);

controller.abort();
```

### Using promise

```ts
const controller = new AbortController();

withPromise(
  stream,
  {
    prompt: 'Hi Gemini!',
  },
  {
    signal: controller.signal,
  },
);

controller.abort();
```
