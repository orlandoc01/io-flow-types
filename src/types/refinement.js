//@flow
import { isLeft } from '../fp';
import { Type, success, failure, getFunctionName, Number } from './index.js';
import type { Predicate, AnyFlowType } from './index.js';

export function refinement<RT: AnyFlowType>(
  type: RT,
  predicate: Predicate<$PropertyType<RT, '_A'>>,
  name: string = `(${type.name} | ${getFunctionName(predicate)})`
): Type<$PropertyType<RT, '_A'>, $PropertyType<RT, '_O'>, $PropertyType<RT, '_I'>> {
  return new Type(
    name,
    m => type.is(m) && predicate(m),
    (i, c) => {
      const validation = type.validate(i, c);
      if (validation.isLeft()) return validation;
      const a = validation.value;
      return predicate(a) ? success((a: any)) : failure(a, c);
    },
    type.encode
  );
}

/** Special refinement that allows users to supply an Opaque Type as the A parameter of the Type class */
export function opaqueRefine<RT: AnyFlowType, Opaque: $PropertyType<RT, '_A'>>(
  type: RT,
  predicate: Predicate<$PropertyType<RT, '_A'>>,
  name?: string
): Type<Opaque, $PropertyType<RT, '_O'>, $PropertyType<RT, '_I'>> {
  const refined = refinement(type, predicate, name);
  return refined;
}
export opaque type Int: number = number;
export const Integer = opaqueRefine<typeof Number, Int>(Number, v => v % 1 === 0, 'Integer');
