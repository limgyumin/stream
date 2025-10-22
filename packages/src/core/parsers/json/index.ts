type ParsedEvent = {
  event?: string;
  retry?: number;
  id?: string;
  data: any;
};

const parseJson = (event: ParsedEvent): ParsedEvent => {
  let parsed: any;

  try {
    parsed = JSON.parse(event.data);
  } catch (error) {
    parsed = event.data;
  }

  return { ...event, data: parsed };
};

/**
 * @see https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 *
 * Normalize irregular chunks, such as truncated chunks or chunks containing multiple events.
 * Chunks that pass through this function are transformed into the following format.
 *
 * **Before**
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
 * **After**
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
export const createJsonParser = (): ((chunk: string) => ParsedEvent[]) => {
  let buffer: string = '';

  return (chunk: string): ParsedEvent[] => {
    buffer += chunk;

    /**
     * Split the chunk string into individual lines based on newline characters.
     */
    const lines = buffer.split(/\r\n|\r|\n/);
    const completed: ParsedEvent[] = [];

    let current: ParsedEvent = { data: '' };

    for (const line of lines) {
      /**
       * If a line is an empty string and there is existing data for the current event,
       * it is considered that the transformation is complete.
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
         * The `data` field can consist of multiple lines, each separated by a newline character.
         * Therefore, if there is an existing value in the `data` field, append a newline character to separate the lines.
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
     * Within a single chunk, events are separated by two newline characters (represented as empty strings in `lines`).
     * A normal chunk ends with two newline characters, while a truncated chunk ends without a newline.
     *
     * Therefore, any content after the last empty string is stored in the next chunk. The following heuristics apply:
     *
     * 1. For a normal chunk, the `buffer` is assigned an empty value (no events exist after the empty string).
     * 2. If there is only one event in the chunk and it is truncated, the entire chunk content is assigned to `buffer` (no empty string exists).
     * 3. If there are multiple events in the chunk and only the last event is truncated, only the last event is assigned to `buffer` (events before the empty string are complete, and events after it are truncated).
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
