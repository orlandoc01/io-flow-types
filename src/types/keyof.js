//@flow
//
// keyof
//
import { Type, String } from './index.js';

export const keyof = <D: { [key: string]: mixed }>(
  keys: D,
  name?: string = `(keyof ${JSON.stringify(Object.keys(keys))})`
): Type<$Keys<D>> => {
  const is = (m: mixed) => String.is(m) && keys.hasOwnProperty(m);
  return new Type(name, is);
};
