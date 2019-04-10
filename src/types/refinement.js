//@flow
import { isLeft } from '../fp';
import { Type, success, failure, getFunctionName, Number } from './index.js';
import type { Predicate, AnyFlowType, GetType, GetOutput, GetInput } from './index.js';

export function refinement<RT: AnyFlowType>(
  type: RT,
  predicate: Predicate<$Call<GetType, RT>>,
  name: string = `(${type.name} | ${getFunctionName(predicate)})`
): Type<$Call<GetType, RT>, $Call<GetOutput, RT>, $Call<GetInput, RT>> {
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
export function opaqueRefine<RT: AnyFlowType, Opaque: $Call<GetType, RT>>(
  type: RT,
  predicate: Predicate<$Call<GetType, RT>>,
  name?: string
): Type<Opaque, $Call<GetOutput, RT>, $Call<GetInput, RT>> {
  const refined = refinement(type, predicate, name);
  return refined;
}
export opaque type Int: number = number;
export const Integer = opaqueRefine<typeof Number, Int>(Number, v => v % 1 === 0, 'Integer');
