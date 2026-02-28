import { describe, expect, it } from 'vitest';

import type { ContextSpec, OpenApiParameterObject } from '../types';
import { getParameters } from './parameters';

const context: ContextSpec = {
  spec: {},
  // @ts-expect-error -- partial mock
  output: { override: {} },
};

const makeParam = (
  overrides: Partial<OpenApiParameterObject> & { name: string; in: string },
): OpenApiParameterObject => overrides as OpenApiParameterObject;

describe('getParameters', () => {
  it('categorises a path parameter into the path bucket', () => {
    const result = getParameters({
      parameters: [makeParam({ name: 'id', in: 'path', required: true })],
      context,
      route: '/pets/{id}',
    });

    expect(result.path).toHaveLength(1);
    expect(result.path[0].parameter.name).toBe('id');
    expect(result.query).toHaveLength(0);
    expect(result.header).toHaveLength(0);
  });

  it('categorises a query parameter into the query bucket', () => {
    const result = getParameters({
      parameters: [makeParam({ name: 'limit', in: 'query' })],
      context,
      route: '/pets',
    });

    expect(result.query).toHaveLength(1);
    expect(result.query[0].parameter.name).toBe('limit');
    expect(result.path).toHaveLength(0);
  });

  it('categorises a header parameter into the header bucket', () => {
    const result = getParameters({
      parameters: [makeParam({ name: 'X-Request-Id', in: 'header' })],
      context,
      route: '/pets',
    });

    expect(result.header).toHaveLength(1);
    expect(result.header[0].parameter.name).toBe('X-Request-Id');
  });

  it('reclassifies a query parameter as path when it appears in the route template', () => {
    const result = getParameters({
      parameters: [
        makeParam({
          name: 'modelId',
          in: 'query',
          required: true,
          schema: { type: 'string' },
        }),
      ],
      context,
      route: '/api/model/unfavorite/{modelId}',
    });

    expect(result.path).toHaveLength(1);
    expect(result.path[0].parameter.name).toBe('modelId');
    expect(result.query).toHaveLength(0);
  });

  it('reclassifies a header parameter as path when it appears in the route template', () => {
    const result = getParameters({
      parameters: [makeParam({ name: 'tenantId', in: 'header' })],
      context,
      route: '/tenants/{tenantId}/users',
    });

    expect(result.path).toHaveLength(1);
    expect(result.path[0].parameter.name).toBe('tenantId');
    expect(result.header).toHaveLength(0);
  });

  it('does not reclassify a query parameter when it is NOT in the route template', () => {
    const result = getParameters({
      parameters: [
        makeParam({ name: 'modelId', in: 'query', schema: { type: 'string' } }),
      ],
      context,
      route: '/api/models',
    });

    expect(result.query).toHaveLength(1);
    expect(result.path).toHaveLength(0);
  });

  it('handles multiple parameters with mixed correct and incorrect "in" values', () => {
    const result = getParameters({
      parameters: [
        makeParam({ name: 'orgId', in: 'query', required: true }),
        makeParam({ name: 'userId', in: 'path', required: true }),
        makeParam({ name: 'search', in: 'query' }),
      ],
      context,
      route: '/orgs/{orgId}/users/{userId}',
    });

    expect(result.path).toHaveLength(2);
    expect(result.path.map((p) => p.parameter.name)).toEqual([
      'orgId',
      'userId',
    ]);
    expect(result.query).toHaveLength(1);
    expect(result.query[0].parameter.name).toBe('search');
  });

  it('returns empty buckets when there are no parameters', () => {
    const result = getParameters({
      parameters: [],
      context,
      route: '/pets',
    });

    expect(result).toEqual({ path: [], query: [], header: [] });
  });

  it('ignores parameters with unsupported "in" values (e.g. cookie)', () => {
    const result = getParameters({
      parameters: [makeParam({ name: 'session', in: 'cookie' })],
      context,
      route: '/pets',
    });

    expect(result.path).toHaveLength(0);
    expect(result.query).toHaveLength(0);
    expect(result.header).toHaveLength(0);
  });
});
