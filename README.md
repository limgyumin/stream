# @milim/stream

## Examples

### 스트림 정의 및 커넥션 생성하기

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
  url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse',
  headers: {
    'x-goog-api-key': 'GEMINI_API_KEY',
  },
  body: {
    contents: [
      {
        parts: [
          {
            text: '안녕?',
          },
        ],
      },
    ],
  },
});

stream.connect();
```

### 이벤트 리스너로 생명주기 구독하기

```ts
stream.addEventListener('message', (message) => {
  console.log(message.data.candidates[0].content.parts[0].text);
});

stream.addEventListener('error', (error) => {
  console.error(error);
});

stream.addEventListener('close', () => {
  console.log('close');
});
```

### 외부 파라미터 전달하기

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

stream.connect({ prompt: '안녕?' });
```

### Promise 로 처리하기

```ts
const { promise, abort } = withPromise(stream, {
  onMessage: (message) => {
    console.log(message.data.candidates[0].content.parts[0].text);
  },
  onAbort: () => {
    console.log('abort');
  },
});

try {
  await promise;
} catch (error) {
  abort();

  throw error;
}
```
