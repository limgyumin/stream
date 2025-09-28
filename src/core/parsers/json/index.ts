type ParsedEvent = {
  event?: string;
  retry?: number;
  id?: string;
  data: any;
};

const parseJson = (message: ParsedEvent): ParsedEvent => {
  let parsed: any;

  try {
    parsed = JSON.parse(message.data);
  } catch (error) {
    parsed = message.data;
  }

  return { ...message, data: parsed };
};

/**
 * NOTE:
 * 일반적으로 SSE(Server-Sent Events) 방식은 응답이 불규칙적이다.
 *
 * 제한된 길이 내에서 데이터를 전송하기 때문에, 데이터가 너무 큰 경우 여러개의 청크로 나눠서 응답하기도 하고,
 * 한 청크에 여러 이벤트가 포함되는 경우도 있다.
 *
 * 따라서, 이 함수는 이러한 불규칙적인 응답을 정규화 하여 완전한 데이터만을 추출한다.
 * 각 응답은 아래와 같은 형태로 파싱된다.
 *
 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 *
 * - 파싱 전
 * ```ts
 * 'data: {"text":"message"}\n\n'
 *
 * 'event: example\ndata: {"text":"message"}\n\n'
 *
 * 'event: example\nid: 123\ndata: {"text":"message"}\n\n'
 *
 * 'event: example\nid: 123\nretry: 1000\ndata: {"text":"message"}\n\n'
 * ```
 *
 * - 파싱 후
 * ```ts
 * { data: { text: 'message' } }
 *
 * { event: 'example', data: { text: 'message' } }
 *
 * { event: 'example', id: '123', data: { text: 'message' } }
 *
 * { event: 'example', id: '123', retry: 1000, data: { text: 'message' } }
 * ```
 */
export const createSSEJsonParser = () => {
  let buffer: string = '';

  return (chunk: string): ParsedEvent[] => {
    buffer += chunk;

    // NOTE: 청크 문자열을 개행 문자를 기준으로 각각의 줄로 분리한다.
    const lines = buffer.split(/\r\n|\r|\n/);
    const completed: ParsedEvent[] = [];

    let current: ParsedEvent = { data: '' };

    for (const line of lines) {
      /**
       * NOTE:
       * 줄이 빈 문자열이며 현재 메세지의 데이터가 존재하면, 변환 처리가 완료된 것으로 판단한다.
       */
      if (line === '') {
        if (current.data) {
          completed.push(parseJson(current));
          current = { data: '' };
        }

        continue;
      }

      const colonIndex = line.indexOf(':');

      if (colonIndex === -1) {
        continue;
      }

      const field = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      if (field === 'data') {
        /**
         * NOTE:
         * data 필드는 여러 줄로 구성될 수 있으며, 각 줄은 개행 문자로 구분된다.
         * 따라서, 현재 data 필드의 값이 존재하면 개행 문자를 추가하여 줄을 구분한다.
         */
        current.data = current.data ? `${current.data}\n${value}` : value;
      } else if (field === 'event') {
        current.event = value;
      } else if (field === 'id') {
        current.id = value;
      } else if (field === 'retry') {
        const retry = Number(value);

        if (Number.isFinite(retry)) {
          current.retry = retry;
        }
      }
    }

    /**
     * NOTE:
     * 하나의 청크 내에서 이벤트는 두 개의 개행 문자 (lines 에서는 빈 문자열) 로 구분되며,
     * 정상적인 청크는 두 개의 개행 문자로 끝나고, 잘린 청크는 개행 문자 없이 끝난다.
     *
     * 따라서, 마지막 빈 문자열 이후의 내용을 다음 청크에 담는다. 아래의 휴리스틱은 다음과 같은 조건을 만족한다.
     *
     * 1. 정상적인 청크인 경우, buffer 에 빈 값이 할당된다. (빈 문자열 이후의 이벤트가 존재하지 않음)
     * 2. 청크 내에 하나의 이벤트만 존재하고, 그 이벤트가 잘린 경우, 청크 내용 전체가 buffer 에 할당된다. (빈 문자열이 존재하지 않음)
     * 3. 청크 내에 여러 이벤트가 존재하고, 그 중 마지막 이벤트만 잘린 경우, 마지막 이벤트만 buffer 에 할당된다. (빈 문자열 이전의 이벤트는 정상, 이후의 이벤트는 잘린 것)
     */
    const separatorIndex = lines.lastIndexOf('');

    if (separatorIndex !== -1) {
      buffer = lines.slice(separatorIndex + 1).join('\n');
    } else {
      buffer = lines.join('\n');
    }

    return completed;
  };
};
