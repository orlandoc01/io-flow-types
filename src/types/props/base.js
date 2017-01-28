//@flow
import { isLeft } from '../../fp';
import {
  mapValues,
  values,
  failure,
  Type,
  success,
  failures,
  identity,
  appendContext,
  Dictionary,
  Any,
  Never
} from '../index.js';
import type {
  MixedFlowType,
  AnyFlowType,
  TypeOf,
  OutputOf,
  Errors,
  Validation,
  Is,
  Validate,
  Encode,
  Context
} from '../index.js';

export type AnyProps = $ReadOnly<{ [key: string]: AnyFlowType }>;
export type Props = $ReadOnly<{ [key: string]: MixedFlowType }>;

export type Obj = $ReadOnly<{ [key: string]: mixed }>;

export const empty = <T: Obj>(): T => ({}: any);
export const getNameFromProps = (
  props: Props,
  required: $ReadOnlyArray<string>,
  exact: boolean,
  readonly?: boolean = false
): string => {
  const requiredSet = new Set(required);
  const brackets: [string, string] = exact ? ['{|', '|}'] : ['{', '}'];
  return `${brackets[0]} ${Object.keys(props)
    .map(k => `${readonly ? '+' : ''}${k}${requiredSet.has(k) ? '' : '?'}: ${props[k].name}`)
    .join(', ')} ${brackets[1]}`;
};

export class PropsType<P: Props, A: Obj, O: Obj = A, I = mixed> extends Type<A, O, I> {
  +props: P;
  +required: $ReadOnlyArray<$Keys<P>>;
  +allowAdditional: boolean;
  constructor(
    /** a unique name for this runtime type */
    name: string,
    /** The following three properties are used to describe the overall shape of the object*/
    props: P,
    required: $ReadOnlyArray<$Keys<P>>,
    allowAdditional: boolean,
    /** a custom type guard */
    is?: Is<A> = makeIs(props, required, allowAdditional),
    /** succeeds if a value of type I can be decoded to a value of type A */
    validate?: Validate<I, A> = makeValidate(props, new Set(required), allowAdditional),
    /** converts a value of type A to a value of type O */
    encode?: Encode<A, O> = makeEncode<A, O, P>(props)
  ) {
    super(name, is, validate, encode);
    this.props = props;
    this.required = required;
    this.allowAdditional = allowAdditional;
  }
  readOnly(name?: string): PropsType<P, $ReadOnly<A>, O, I> {
    const newName = name || getNameFromProps(this.props, this.required, !this.allowAdditional, true);
    const isNotProduction = process.env.NODE_ENV !== 'production';
    const validate = (m, c) => this.validate(m, c).map(x => (isNotProduction ? Object.freeze(x) : x));
    return new PropsType(newName, this.props, this.required, this.allowAdditional, this.is, validate);
  }
  shape(name?: string): PropsType<P, $Rest<A, {}>, $Rest<O, {}>, I> {
    const newName = name || getNameFromProps(this.props, [], !this.allowAdditional);
    return new PropsType(newName, this.props, [], this.allowAdditional);
  }
}

//Helper Functions
function makeIs<P: Props>(props: P, required: $ReadOnlyArray<$Keys<P>>, allowAdditional: boolean) {
  return (m: mixed): boolean => {
    const v = m;
    if (v === null || typeof v !== 'object') {
      return false;
    }
    //First check to ensure all required keys are present in the object
    let hasAllRequired = required.every(requiredKey => requiredKey in v);
    //Next, check that all key/value pairs in the object are valid
    const isMatch =
      hasAllRequired &&
      Object.keys(v).every(key => {
        const type = props[key];
        return (type && type.is(v[key])) || (type == undefined && allowAdditional);
      });
    return isMatch;
  };
}

function makeValidate<I, A: Obj, P: Props>(
  props: P,
  required: Set<$Keys<P>>,
  allowAdditional: boolean
): Validate<I, A> {
  const optional = Object.keys(props).filter(key => !(key in required));
  return (m: I, c: Context): Validation<A> => {
    const dictionaryValidation = Dictionary.validate(m, c);
    if (isLeft(dictionaryValidation)) return dictionaryValidation;
    const o = dictionaryValidation.value;
    const errors: Errors = [];
    const requiredKeysLeft = new Set(required);
    const fallbackType = allowAdditional ? Any : Never;
    const a: A = (Object.keys(o).reduce(validateValue, o): any);
    requiredKeysLeft.forEach(failUnusedRequiredKey);
    return errors.length ? failures(errors) : success(a);

    function validateValue(acc: Object, key: string) {
      const ok = o[key];
      const type: MixedFlowType = props[key] || fallbackType;
      const validation = type.validate(ok, appendContext(c, key, type));
      requiredKeysLeft.delete(key);
      if (isLeft(validation)) {
        errors.push(...validation.value);
        return acc;
      }
      const vok = validation.value;
      const updatedAcc = vok !== ok && acc === o ? { ...o } : acc;
      updatedAcc[key] = vok;
      return updatedAcc;
    }
    function failUnusedRequiredKey(key) {
      const type = props[key];
      const err = failure(undefined, appendContext(c, key, type));
      errors.push(...err.value);
    }
  };
}

function makeEncode<A: Obj, O: Obj, P: Props>(props: P): Encode<A, O> {
  const typeValues: Array<MixedFlowType> = values(props);
  const encodeVal = (val, key) => (props[key] || Any).encode(val);
  const encodeAllVals = (a: A) => mapValues(a, encodeVal);
  const encode = typeValues.every(type => type.encode === identity) ? identity : encodeAllVals;
  return (encode: any);
}
