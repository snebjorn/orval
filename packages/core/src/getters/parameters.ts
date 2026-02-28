import { resolveRef } from '../resolvers/ref';
import type {
  ContextSpec,
  GetterParameters,
  OpenApiParameterObject,
  OpenApiReferenceObject,
} from '../types';
import { isReference } from '../utils';
import { getParamsInPath } from './params';

interface GetParametersOptions {
  parameters: (OpenApiReferenceObject | OpenApiParameterObject)[];
  context: ContextSpec;
  route: string;
}

export function getParameters({
  parameters,
  context,
  route,
}: GetParametersOptions): GetterParameters {
  const pathTemplateParams = new Set(getParamsInPath(route));

  const result: GetterParameters = { path: [], query: [], header: [] };
  for (const p of parameters) {
    if (isReference(p)) {
      const { schema: parameter, imports } = resolveRef<OpenApiParameterObject>(
        p,
        context,
      );

      const bucket =
        parameter.name && pathTemplateParams.has(parameter.name)
          ? 'path'
          : parameter.in;

      if (bucket === 'path' || bucket === 'query' || bucket === 'header') {
        result[bucket].push({ parameter, imports });
      }
    } else {
      const bucket = p.name && pathTemplateParams.has(p.name) ? 'path' : p.in;

      if (bucket === 'query' || bucket === 'path' || bucket === 'header') {
        result[bucket].push({ parameter: p, imports: [] });
      }
    }
  }
  return result;
}
