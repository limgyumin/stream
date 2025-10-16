import { describe, it, expect } from 'vitest';

import { createSSEJsonParser } from '.';

describe('createSSEJsonParser', () => {
  it.concurrent('텍스트 형식의 청크를 JSON 형식으로 파싱한다.', () => {
    const parse = createSSEJsonParser();

    const chunks = [
      'data: {"text":"stable"}\n\n',
      'event: test\ndata: {"text":"stable"}\n\n',
      'event: test\ndata: {"text":"stable"}\nid: 123\n\n',
      'event: test\ndata: {"text":"stable"}\nid: 123\nretry: 1000\n\n',
    ];

    expect(chunks.flatMap(parse)).toEqual([
      { data: { text: 'stable' } },
      { event: 'test', data: { text: 'stable' } },
      { event: 'test', data: { text: 'stable' }, id: '123' },
      { event: 'test', data: { text: 'stable' }, id: '123', retry: 1000 },
    ]);
  });

  it.concurrent(
    '하나의 청크에 여러 데이터가 포함된 경우 개별 요소로 파싱한다.',
    () => {
      const parse = createSSEJsonParser();

      const chunks = [
        'data: {"text":"stable"}\n\ndata: {"text":"stable"}\n\n',
        'event: test\ndata: {"text":"stable"}\n\nevent: test\ndata: {"text":"stable"}\n\n',
        'event: test\ndata: {"text":"stable"}\nid: 123\n\nevent: test\ndata: {"text":"stable"}\nid: 123\n\n',
        'event: test\ndata: {"text":"stable"}\nid: 123\nretry: 1000\n\nevent: test\ndata: {"text":"stable"}\nid: 123\nretry: 1000\n\n',
      ];

      expect(chunks.flatMap(parse)).toEqual([
        { data: { text: 'stable' } },
        { data: { text: 'stable' } },
        { event: 'test', data: { text: 'stable' } },
        { event: 'test', data: { text: 'stable' } },
        { event: 'test', data: { text: 'stable' }, id: '123' },
        { event: 'test', data: { text: 'stable' }, id: '123' },
        { event: 'test', data: { text: 'stable' }, id: '123', retry: 1000 },
        { event: 'test', data: { text: 'stable' }, id: '123', retry: 1000 },
      ]);
    },
  );

  it.concurrent('잘린 청크가 전달된 경우 정규화된 청크로 파싱한다.', () => {
    const parse = createSSEJsonParser();

    // 단일 이벤트만 존재하는 경우
    const chunks1 = [
      'data: ',
      '{"text":"unstable"}\n\n',
      'event: test\ndata: ',
      '{"text":"unstable"}\n\n',
      'event: test\nid: 123\ndata: ',
      '{"text":"unstable"}\n\n',
      'event: test\nid: 123\nretry: 1000\ndata: ',
      '{"text":"unstable"}\n\n',
    ];

    expect(chunks1.flatMap(parse)).toEqual([
      { data: { text: 'unstable' } },
      { event: 'test', data: { text: 'unstable' } },
      { event: 'test', id: '123', data: { text: 'unstable' } },
      { event: 'test', id: '123', retry: 1000, data: { text: 'unstable' } },
    ]);

    // 여러 이벤트가 존재하고, 마지막 이벤트만 잘린 경우
    const chunks2 = [
      'data: {"text":"stable"}\n\ndata: ',
      '{"text":"unstable"}\n\n',
      'event: test\ndata: {"text":"stable"}\n\nevent: test\ndata: ',
      '{"text":"unstable"}\n\n',
      'event: test\nid: 123\ndata: {"text":"stable"}\n\nevent: test\nid: 123\ndata: ',
      '{"text":"unstable"}\n\n',
      'event: test\nid: 123\nretry: 1000\ndata: {"text":"stable"}\n\nevent: test\nid: 123\nretry: 1000\ndata: ',
      '{"text":"unstable"}\n\n',
    ];

    expect(chunks2.flatMap(parse)).toEqual([
      { data: { text: 'stable' } },
      { data: { text: 'unstable' } },
      { event: 'test', data: { text: 'stable' } },
      { event: 'test', data: { text: 'unstable' } },
      { event: 'test', id: '123', data: { text: 'stable' } },
      { event: 'test', id: '123', data: { text: 'unstable' } },
      { event: 'test', id: '123', retry: 1000, data: { text: 'stable' } },
      { event: 'test', id: '123', retry: 1000, data: { text: 'unstable' } },
    ]);

    // 단일 이벤트가 2개를 초과하는 청크로 잘린 경우
    const chunks3 = [
      'data: ',
      '{"text":"long ',
      'and unstable"}\n\n',
      'event: test\ndata: ',
      '{"text":"long ',
      'and unstable"}\n\n',
      'event: test\nid: 123\ndata: ',
      '{"text":"long ',
      'and unstable"}\n\n',
      'event: test\nid: 123\nretry: 1000\ndata: ',
      '{"text":"long ',
      'and unstable"}\n\n',
    ];

    expect(chunks3.flatMap(parse)).toEqual([
      { data: { text: 'long and unstable' } },
      { event: 'test', data: { text: 'long and unstable' } },
      { event: 'test', id: '123', data: { text: 'long and unstable' } },
      {
        event: 'test',
        id: '123',
        retry: 1000,
        data: { text: 'long and unstable' },
      },
    ]);
  });

  it.concurrent(
    'data 필드가 여러 줄로 구성된 경우 정규화된 청크로 파싱한다.',
    () => {
      const parse = createSSEJsonParser();

      // 정상적인 이벤트인 경우
      const chunks1 = [
        'data: text1\ndata: text2\n\n',
        'event: test\ndata: text1\ndata: text2\n\n',
        'event: test\nid: 123\ndata: text1\ndata: text2\n\n',
        'event: test\nid: 123\nretry: 1000\ndata: text1\ndata: text2\n\n',
      ];

      expect(chunks1.flatMap(parse)).toEqual([
        { data: 'text1\ntext2' },
        { event: 'test', data: 'text1\ntext2' },
        { event: 'test', id: '123', data: 'text1\ntext2' },
        { event: 'test', id: '123', retry: 1000, data: 'text1\ntext2' },
      ]);

      // 잘린 이벤트인 경우
      const chunks2 = [
        'data: text1',
        '\ndata: text2\n\n',
        'event: test\ndata: text1',
        '\ndata: text2\n\n',
        'event: test\nid: 123\ndata: text1',
        '\ndata: text2\n\n',
        'event: test\nid: 123\nretry: 1000\ndata: text1',
        '\ndata: text2\n\n',
      ];

      expect(chunks2.flatMap(parse)).toEqual([
        { data: 'text1\ntext2' },
        { event: 'test', data: 'text1\ntext2' },
        { event: 'test', id: '123', data: 'text1\ntext2' },
        { event: 'test', id: '123', retry: 1000, data: 'text1\ntext2' },
      ]);
    },
  );

  it.concurrent('빈 청크가 전달된 경우 무시한다.', () => {
    const parse = createSSEJsonParser();

    const chunk = '';

    expect(parse(chunk)).toEqual([]);
  });

  it.concurrent('CR, LF, CRLF 개행 문자 형식을 지원한다.', () => {
    const parse = createSSEJsonParser();

    const chunks = [
      'event: test\ndata: {"text":"CR"}\r\r',
      'event: test\ndata: {"text":"LF"}\n\n',
      'event: test\ndata: {"text":"CRLF"}\r\n\r\n',
    ];

    expect(chunks.flatMap(parse)).toEqual([
      { event: 'test', data: { text: 'CR' } },
      { event: 'test', data: { text: 'LF' } },
      { event: 'test', data: { text: 'CRLF' } },
    ]);
  });
});
