//@flow
//
// unions
//
import { isLeft, isRight } from '../fp';
import {
  Type,
  failures,
  identity,
  appendContext,
  useIdentity,
  Number,
  String as stringType,
  Never,
  isObject,
  values,
  AggregateError
} from './index.js';
import type { MixedFlowType, TypeOf, OutputOf } from './index.js';
import type { Props } from './props';

type MappedUnion = { [key: string]: MixedFlowType };
export function unionMap<P: MappedUnion>(
  map: P,
  toKey: (mixed => string) | string,
  name?: string = `(${values(map)
    .map(type => type.name)
    .join(' | ')})`
): Type<
  $Values<$ObjMap<P, <V: MixedFlowType>(v: V) => $PropertyType<V, '_A'>>>,
  $Values<$ObjMap<P, <V: MixedFlowType>(v: V) => $PropertyType<V, '_O'>>>,
  mixed
> {
  const transform: mixed => string = typeof toKey === 'string' ? makeToKey(toKey) : toKey;
  const is = (v: mixed) => (map[transform(v)] || Never).is(v);
  return new Type(name, is, validate, makeEncode());

  function validate(m, c) {
    const type = map[transform(m)] || Never;
    return type.validate(m, c);
  }
  function makeEncode() {
    const types = values(map);
    const findAndEncode = a => {
      const type = map[transform(a)] || Never;
      return type.encode(a);
    };
    return useIdentity(types) ? identity : findAndEncode;
  }
  function makeToKey(key: string) {
    return (v: mixed): string => {
      const val = isObject(v) ? v[key] : '';
      return String(val);
    };
  }
}

export const union: UnionFunc = (_union: any);

interface UnionFunc {
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType, E: MixedFlowType>(
    types: [A, B, C, D, E],
    name?: string
  ): Type<
    | $PropertyType<A, '_A'>
    | $PropertyType<B, '_A'>
    | $PropertyType<C, '_A'>
    | $PropertyType<D, '_A'>
    | $PropertyType<E, '_A'>,
    | $PropertyType<A, '_O'>
    | $PropertyType<B, '_O'>
    | $PropertyType<C, '_O'>
    | $PropertyType<D, '_O'>
    | $PropertyType<E, '_O'>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType>(
    types: [A, B, C, D],
    name?: string
  ): Type<
    $PropertyType<A, '_A'> | $PropertyType<B, '_A'> | $PropertyType<C, '_A'> | $PropertyType<D, '_A'>,
    $PropertyType<A, '_O'> | $PropertyType<B, '_O'> | $PropertyType<C, '_O'> | $PropertyType<D, '_O'>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType>(
    types: [A, B, C],
    name?: string
  ): Type<
    $PropertyType<A, '_A'> | $PropertyType<B, '_A'> | $PropertyType<C, '_A'>,
    $PropertyType<A, '_O'> | $PropertyType<B, '_O'> | $PropertyType<C, '_O'>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType>(
    types: [A, B],
    name?: string
  ): Type<$PropertyType<A, '_A'> | $PropertyType<B, '_A'>, $PropertyType<A, '_O'> | $PropertyType<B, '_O'>, mixed>;
}

type MixedFlowTypeFlowTypeTypeArray = $ReadOnlyArray<MixedFlowType>;
export function _union<Arr: MixedFlowTypeFlowTypeTypeArray>(
  types: Arr,
  name: string = `(${types.map(type => type.name).join(' | ')})`
): Type<$PropertyType<$ElementType<Arr, number>, '_A'>, $PropertyType<$ElementType<Arr, number>, '_O'>, mixed> {
  const len = types.length;
  const is = m => types.some(type => type.is(m));
  return new Type(name, is, validate, makeEncode());

  function validate(m, c) {
    const errors = new AggregateError();
    for (let i = 0; i < len; i++) {
      const type = types[i];
      const validation = type.validate(m, appendContext(c, String(i), type));
      if (isRight(validation)) return validation;
      else errors.push(...validation.value);
    }
    return failures(errors);
  }
  function makeEncode() {
    const findAndEncode = a => {
      const matchedType = types.find(type => type.is(a)) || Never;
      return matchedType.encode(a);
    };
    return useIdentity(types) ? identity : findAndEncode;
  }
}
