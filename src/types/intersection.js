//@flow
//
// intersections
//
import { isLeft } from '../fp';
import { Type, success, failures, identity, useIdentity, AggregateError } from './index.js';
import type { MixedFlowType, TypeOf, OutputOf } from './index.js';

interface IntersectionFunc {
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType, E: MixedFlowType>(
    types: [A, B, C, D, E],
    name?: string
  ): Type<
    $PropertyType<A, '_A'> &
      $PropertyType<B, '_A'> &
      $PropertyType<C, '_A'> &
      $PropertyType<D, '_A'> &
      $PropertyType<E, '_A'>,
    $PropertyType<A, '_O'> &
      $PropertyType<B, '_O'> &
      $PropertyType<C, '_O'> &
      $PropertyType<D, '_O'> &
      $PropertyType<E, '_O'>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType>(
    types: [A, B, C, D],
    name?: string
  ): Type<
    $PropertyType<A, '_A'> & $PropertyType<B, '_A'> & $PropertyType<C, '_A'> & $PropertyType<D, '_A'>,
    $PropertyType<A, '_O'> & $PropertyType<B, '_O'> & $PropertyType<C, '_O'> & $PropertyType<D, '_O'>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType>(
    types: [A, B, C],
    name?: string
  ): Type<
    $PropertyType<A, '_A'> & $PropertyType<B, '_A'> & $PropertyType<C, '_A'>,
    $PropertyType<A, '_O'> & $PropertyType<B, '_O'> & $PropertyType<C, '_O'>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType>(
    types: [A, B],
    name?: string
  ): Type<$PropertyType<A, '_A'> & $PropertyType<B, '_A'>, $PropertyType<A, '_O'> & $PropertyType<B, '_O'>, mixed>;
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
      const errors = new AggregateError();
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
