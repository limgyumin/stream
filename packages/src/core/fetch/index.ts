import qs from 'qs';

import type { AnyObject, Overwrite } from '../../types';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD';

export type HttpURL = string | URL | Request;

export type RequestConfig = Overwrite<
  RequestInit,
  {
    url: HttpURL;
    method?: HttpMethod;
    query?: AnyObject;
    body?: AnyObject;
  }
>;

export const safeFetch = async (config: RequestConfig): Promise<Response> => {
  const { url, method = 'GET', query, body, ...rest } = config;

  const options: RequestInit & { url: HttpURL } = {
    url,
    method,
    ...rest,
  };

  if (query !== undefined) {
    const stringified = qs.stringify(query, {
      arrayFormat: 'repeat',
    });

    options.url = `${url}?${stringified}`;
  }

  if (method !== 'GET' && body !== undefined) {
    options.body = JSON.stringify(body);

    options.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };
  }

  const response = await fetch(options.url, options);

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response;
};
