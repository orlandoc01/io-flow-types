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
  values
} from './index.js';
import type { MixedFlowType, TypeOf, OutputOf, Errors, GetType, GetOutput } from './index.js';
import type { Props } from './props';

type MappedUnion = { [key: string]: MixedFlowType };
export function unionMap<P: MappedUnion>(
  map: P,
  toKey: (mixed => string) | string,
  name?: string = `(${values(map)
    .map(type => type.name)
    .join(' | ')})`
): Type<
  $Values<$ObjMap<P, <V: MixedFlowType>(v: V) => $Call<GetType, V>>>,
  $Values<$ObjMap<P, <V: MixedFlowType>(v: V) => $Call<GetOutput, V>>>,
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
    | $Call<GetType, A>
    | $Call<GetType, B>
    | $Call<GetType, C>
    | $Call<GetType, D>
    | $Call<GetType, E>,
    | $Call<GetOutput, A>
    | $Call<GetOutput, B>
    | $Call<GetOutput, C>
    | $Call<GetOutput, D>
    | $Call<GetOutput, E>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType, D: MixedFlowType>(
    types: [A, B, C, D],
    name?: string
  ): Type<
    $Call<GetType, A> | $Call<GetType, B> | $Call<GetType, C> | $Call<GetType, D>,
    $Call<GetOutput, A> | $Call<GetOutput, B> | $Call<GetOutput, C> | $Call<GetOutput, D>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType, C: MixedFlowType>(
    types: [A, B, C],
    name?: string
  ): Type<
    $Call<GetType, A> | $Call<GetType, B> | $Call<GetType, C>,
    $Call<GetOutput, A> | $Call<GetOutput, B> | $Call<GetOutput, C>,
    mixed
  >;
  <A: MixedFlowType, B: MixedFlowType>(
    types: [A, B],
    name?: string
  ): Type<$Call<GetType, A> | $Call<GetType, B>, $Call<GetOutput, A> | $Call<GetOutput, B>, mixed>;
}

type MixedFlowTypeFlowTypeTypeArray = $ReadOnlyArray<MixedFlowType>;
export function _union<Arr: MixedFlowTypeFlowTypeTypeArray>(
  types: Arr,
  name: string = `(${types.map(type => type.name).join(' | ')})`
): Type<$Call<GetType, $ElementType<Arr, number>>, $Call<GetOutput, $ElementType<Arr, number>>, mixed> {
  const len = types.length;
  const is = m => types.some(type => type.is(m));
  return new Type(name, is, validate, makeEncode());

  function validate(m, c) {
    const errors: Errors = [];
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
