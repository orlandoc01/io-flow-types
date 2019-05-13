//@flow
//
// dictionaries
//
import { isLeft } from '../fp';
import {
  Type,
  Any,
  isDictionary,
  success,
  failures,
  identity,
  appendContext,
  Dictionary,
  AggregateError
} from './index.js';
import type { MixedFlowType, AnyFlowType, TypeOf, OutputOf } from './index.js';

export type TypeOfDictionary<D: AnyFlowType, C: AnyFlowType> = { [K: TypeOf<D>]: TypeOf<C> };

export type OutputOfDictionary<D: AnyFlowType, C: AnyFlowType> = { [K: OutputOf<D>]: OutputOf<C> };

export const dictionary = <D: MixedFlowType, C: MixedFlowType>(
  domain: D,
  codomain: C,
  name: string = `{ [K: ${domain.name}]: ${codomain.name} }`
): Type<
  { [K: $PropertyType<D, '_A'>]: $PropertyType<C, '_A'> },
  { [K: $PropertyType<D, '_O'>]: $PropertyType<C, '_O'> },
  mixed
> => {
  const isIndexSignatureRequired = codomain !== Any;
  return new Type(
    name,
    m => isDictionary(m) && Object.keys(m).every(k => domain.is(k) && codomain.is(m[k])),
    (m, c) => {
      const dictionaryValidation = Dictionary.validate(m, c);
      if (isLeft(dictionaryValidation)) {
        return dictionaryValidation;
      }
      const o = dictionaryValidation.value;
      const a: { [key: string]: any } = {};
      const errors = new AggregateError();
      const keys = Object.keys(o);
      const len = keys.length;
      let changed: boolean = false;
      for (let i = 0; i < len; i++) {
        let k = keys[i];
        const ok = o[k];
        const domainValidation = domain.validate(k, appendContext(c, k, domain));
        const codomainValidation = codomain.validate(ok, appendContext(c, k, codomain));
        if (isLeft(domainValidation)) {
          errors.push(...domainValidation.value);
        } else {
          const vk = domainValidation.value;
          changed = changed || vk !== k;
          k = vk;
        }
        if (isLeft(codomainValidation)) {
          errors.push(...codomainValidation.value);
        } else {
          const vok = codomainValidation.value;
          changed = changed || vok !== ok;
          a[k] = vok;
        }
      }
      return errors.length ? failures(errors) : success(changed ? a : o);
    },
    domain.encode === identity && codomain.encode === identity
      ? identity
      : a => {
          const s: { [key: string]: any } = {};
          const keys = Object.keys(a);
          const len = keys.length;
          for (let i = 0; i < len; i++) {
            const k = keys[i];
            s[String(domain.encode(k))] = codomain.encode(a[k]);
          }
          return s;
        }
  );
};
