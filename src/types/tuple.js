//@flow
//
// tuples
//
import { isLeft } from '../fp';
import {
  Type,
  Never,
  getValidationError,
  useIdentity,
  success,
  failures,
  identity,
  appendContext,
  arrayType
} from './index.js';
import type { MixedFlowType, Errors, GetType, GetOutput } from './index.js';

export interface TupleFunc {
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType, E: MixedFlowType>(
    types: [A, B, C, D, E],
    name?: string
  ): Type<
    [
      $Call<GetType, A>,
      $Call<GetType, B>,
      $Call<GetType, C>,
      $Call<GetType, D>,
      $Call<GetType, E>
    ],
    [
      $Call<GetOutput, A>,
      $Call<GetOutput, B>,
      $Call<GetOutput, C>,
      $Call<GetOutput, D>,
      $Call<GetOutput, E>
    ],
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType>(
    types: [A, B, C, D],
    name?: string
  ): Type<
    [$Call<GetType, A>, $Call<GetType, B>, $Call<GetType, C>, $Call<GetType, D>],
    [$Call<GetOutput, A>, $Call<GetOutput, B>, $Call<GetOutput, C>, $Call<GetOutput, D>],
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType>(
    types: [A, B, C],
    name?: string
  ): Type<
    [$Call<GetType, A>, $Call<GetType, B>, $Call<GetType, C>],
    [$Call<GetOutput, A>, $Call<GetOutput, B>, $Call<GetOutput, C>],
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType>(
    types: [A, B],
    name?: string
  ): Type<[$Call<GetType, A>, $Call<GetType, B>], [$Call<GetOutput, A>, $Call<GetOutput, B>], mixed>;
}
function _tuple<RTS: Array<MixedFlowType>>(types: RTS, name: string = `[${types.map(type => type.name).join(', ')}]`) {
  const len = types.length;
  return new Type(
    name,
    m => Array.isArray(m) && m.length === len && types.every((type, i) => type.is(m[i])),
    (m, c) => {
      const arrayValidation = arrayType.validate(m, c);
      if (isLeft(arrayValidation)) {
        return arrayValidation;
      } else {
        const as = arrayValidation.value;
        let t: Array<any> = as;
        const errors: Errors = [];
        for (let i = 0; i < len; i++) {
          const a = as[i];
          const type = types[i];
          const validation = type.validate(a, appendContext(c, String(i), type));
          if (isLeft(validation)) {
            errors.push(...validation.value);
          } else {
            const va = validation.value;
            if (va !== a) {
              /* istanbul ignore next */
              if (t === as) {
                t = as.slice();
              }
              t[i] = va;
            }
          }
        }
        if (as.length > len) {
          errors.push(getValidationError(as[len], appendContext(c, String(len), Never)));
        }
        return errors.length ? failures(errors) : success(t);
      }
    },
    useIdentity(types) ? identity : a => types.map((type, i) => type.encode(a[i]))
  );
}

export const tuple: TupleFunc = (_tuple: any);
