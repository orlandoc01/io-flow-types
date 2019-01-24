//@flow
//
// intersections
//
import { isLeft } from '../fp';
import { Type, success, failures, identity, useIdentity } from './index.js';
import type { MixedFlowType, TypeOf, OutputOf, Errors, GetType, GetOutput } from './index.js';

interface IntersectionFunc {
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType, E: MixedFlowType>(
    types: [A, B, C, D, E],
    name?: string
  ): Type<
    $Call<GetType, A> &
      $Call<GetType, B> &
      $Call<GetType, C> &
      $Call<GetType, D> &
      $Call<GetType, E>,
    $Call<GetOutput, A> &
      $Call<GetOutput, B> &
      $Call<GetOutput, C> &
      $Call<GetOutput, D> &
      $Call<GetOutput, E>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType>(
    types: [A, B, C, D],
    name?: string
  ): Type<
    $Call<GetType, A> & $Call<GetType, B> & $Call<GetType, C> & $Call<GetType, D>,
    $Call<GetOutput, A> & $Call<GetOutput, B> & $Call<GetOutput, C> & $Call<GetOutput, D>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType>(
    types: [A, B, C],
    name?: string
  ): Type<
    $Call<GetType, A> & $Call<GetType, B> & $Call<GetType, C>,
    $Call<GetOutput, A> & $Call<GetOutput, B> & $Call<GetOutput, C>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType>(
    types: [A, B],
    name?: string
  ): Type<$Call<GetType, A> & $Call<GetType, B>, $Call<GetOutput, A> & $Call<GetOutput, B>, mixed>;
}

export const intersection: IntersectionFunc = (_intersection: any);

function _intersection<RTS: $ReadOnlyArray<MixedFlowType>>(
  types: RTS,
  name: string = `(${types.map(type => type.name).join(' & ')})`
) {
  return new Type(
    name,
    m => types.every(type => type.is(m)),
    (m, c) => {
      const errors: Errors = [];
      let a = m;
      types.forEach(type => {
        const validation = type.validate(a, c);
        if (validation.isLeft()) {
          errors.push(...validation.value);
        } else {
          a = validation.value;
        }
      });
      return errors.length ? failures(errors) : success((a: any));
    },
    useIdentity(types)
      ? identity
      : a => {
          let s = a;
          types.forEach(type => (s = type.encode(s)));
          return s;
        }
  );
}
