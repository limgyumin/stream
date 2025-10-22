import { config, stream } from './core';

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

type GeminiRequestPayload = {
  prompt: string;
};

const geminiConfig = (payload: GeminiRequestPayload) =>
  config<GeminiResponse>({
    method: 'POST',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent',
    query: {
      alt: 'sse',
    },
    headers: {
      'x-goog-api-key': 'AIzaSyBeN7dETQDA9bYk8CtguQiD1UXc53wqoRo',
    },
    body: {
      contents: [
        {
          parts: [
            {
              text: payload.prompt,
            },
          ],
        },
      ],
    },
  });

const chunks = stream(geminiConfig({ prompt: '저녁 메뉴 추천해줘' }), {
  signal: AbortSignal.timeout(1000 * 15),
});

for await (const chunk of chunks) {
  console.log(chunk.data.candidates[0].content.parts[0].text);
}
