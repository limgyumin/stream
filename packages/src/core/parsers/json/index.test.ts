import { describe, it, expect } from 'vitest';

import { createJsonParser } from '.';

describe('createJsonParser', () => {
  it.concurrent('Parses text-based chunks into JSON format.', () => {
    const parse = createJsonParser();

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
    'Splits a single chunk containing multiple events into individual chunks and parses them.',
    () => {
      const parse = createJsonParser();

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

  it.concurrent('Parses truncated chunks into normalized chunks.', () => {
    const parse = createJsonParser();

    // When a single event exists
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

    // When multiple events exist and only the last event is truncated
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

    // When a chunk containing more than two events is truncated
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
    'Parses normalized chunks when the "data" field consists of multiple lines.',
    () => {
      const parse = createJsonParser();

      // When a normal event exists
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

      // When a truncated event exists
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

  it.concurrent('Ignores empty chunks.', () => {
    const parse = createJsonParser();

    const chunk = '';

    expect(parse(chunk)).toEqual([]);
  });

  it.concurrent('Supports CR, LF, CRLF line break formats.', () => {
    const parse = createJsonParser();

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
