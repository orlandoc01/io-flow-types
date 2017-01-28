//@flow
//
// literals
//
import { Type, getDefaultContext, success, failure, identity } from './index.js';

export const literal = <V: string | number | boolean>(value: V, name?: string = JSON.stringify(value)): Type<V> => {
  const is = (m: mixed) => m === value;
  return new Type(name, is, (m, c) => (is(m) ? success(value) : failure(m, c)), identity);
};
