//@flow
import { Reporter } from './Reporter';
import { getFunctionName } from './index';
import type { Context, ValidationError, AggregateError } from './index.js';

export function failure(es: AggregateError): Array<string> {
  return es.messages();
}

export function success(): Array<string> {
  return ['No errors!'];
}

export const PathReporter: Reporter<Array<string>> = {
  report: validation => validation.fold(failure, success)
};
