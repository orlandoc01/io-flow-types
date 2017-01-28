//@flow
//
// arrays
//
import { isLeft } from '../fp';
import { Type, success, failures, identity, arrayType, isArray, appendContext } from './index.js';
import type { MixedFlowType, TypeOf, OutputOf, Errors } from './index.js';

export function array<RT: MixedFlowType>(
  type: RT,
  name: string = `Array<${type.name}>`
): Type<Array<$PropertyType<RT, '_A'>>, Array<$PropertyType<RT, '_O'>>, mixed> {
  const is = m => isArray(m) && m.every(type.is);
  const encode = type.encode === identity ? identity : a => a.map(type.encode);
  return new Type(name, is, validate, encode);

  function validate(m, c) {
    const arrayValidation = arrayType.validate(m, c);
    if (isLeft(arrayValidation)) {
      return arrayValidation;
    }
    const xs = arrayValidation.value;
    const errors: Errors = [];
    const a: Array<TypeOf<RT>> = xs.reduce(validateValue, xs);
    return errors.length ? failures(errors) : success(a);

    function validateValue(acc, elem, index: number) {
      const validation = type.validate(elem, appendContext(c, String(index), type));
      if (isLeft(validation)) {
        errors.push(...validation.value);
        return acc;
      }
      const vok = validation.value;
      const createNewArr = vok !== elem && acc === xs;
      const updatedAcc = createNewArr ? [...xs] : acc;
      updatedAcc[index] = vok;
      return updatedAcc;
    }
  }
}

export function readonlyArray<RT: MixedFlowType>(
  type: RT,
  name: string = `$ReadOnlyArray<${type.name}>`
): Type<$ReadOnlyArray<$PropertyType<RT, '_A'>>, $ReadOnlyArray<$PropertyType<RT, '_O'>>, mixed> {
  const arrayType = array<RT>(type);
  const is: mixed => boolean = arrayType.is;
  const isNotProduction = process.env.NODE_ENV !== 'production';
  return new Type(
    name,
    is,
    (m, c) => {
      const validation = arrayType.validate(m, c);
      return validation.map(x => (isNotProduction ? Object.freeze(x) : x));
    },
    type.encode === identity ? identity : a => a.map(type.encode)
  );
}
