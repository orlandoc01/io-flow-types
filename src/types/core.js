//@flow
import { Left, Right, isLeft, isRight } from '../fp/index.js';
import type { Either } from '../fp/index.js';

export const identity = <A>(a: A): A => a;
export type ContextEntry = {
  +key: string,
  +type: Decoder<any, any>
};
export type Predicate<A> = (val: A) => boolean;
export type Context = $ReadOnlyArray<ContextEntry>;
export type ValidationError = {
  +value: mixed,
  +context: Context
};
export type Errors = Array<ValidationError>;
export type Validation<A> = Either<Errors, A>;
export type Is<A> = (m: mixed) => boolean;
export type Validate<-I, A> = (i: I, context: Context) => Validation<A>;
export type Decode<-I, A> = (i: I) => Validation<A>;
export type Encode<A, +O> = (a: A) => O;
export type AnyFlowType = Type<any, any, any>;
export type MixedFlowType = Type<any, any, mixed>;
export type TypeOf<RT: AnyFlowType> = $PropertyType<RT, '_A'>;
export type InputOf<RT: AnyFlowType> = $PropertyType<RT, '_I'>;
export type OutputOf<RT: AnyFlowType> = $PropertyType<RT, '_O'>;

export interface Decoder<-I, A> {
  +name: string;
  +validate: Validate<I, A>;
  +decode: Decode<I, A>;
}

export interface Encoder<A, +O> {
  +encode: Encode<A, O>;
}

export class Type<A, +O = A, I = mixed> implements Decoder<I, A>, Encoder<A, O> {
  +_A: A;
  +_O: O;
  +_I: I;
  +name: string;
  +is: Is<A>;
  +validate: Validate<I, A>;
  +encode: Encode<A, O>;
  constructor(
    /** a unique name for this runtime type */
    name: string,
    /** a custom type guard */
    is: Is<A>,
    /** succeeds if a value of type I can be decoded to a value of type A */
    validate?: Validate<I, A> = (m, c) => (is(m) ? success((m: any)) : failure(m, c)),
    /** converts a value of type A to a value of type O */
    encode?: Encode<A, O> = (identity: any)
  ) {
    this.name = name;
    this.is = is;
    this.validate = validate;
    this.encode = encode;
  }
  /** a version of `validate` with a default context */
  decode(i: I): Validation<A> {
    return this.validate(i, getDefaultContext(this));
  }
  pipe<B>(ab: Type<B, A, A>, name?: string): Type<B, O, I> {
    const custEncode = b => this.encode(ab.encode(b));
    const encode = this.encode === identity && ab.encode === identity ? (identity: any) : custEncode;
    return new Type(
      name || `pipe(${this.name}, ${ab.name})`,
      ab.is,
      (i, c) => {
        const validation = this.validate(i, c);
        if (isLeft(validation)) {
          return (validation: any);
        } else {
          return ab.validate(validation.value, c);
        }
      },
      encode
    );
  }
  asDecoder(): Decoder<I, A> {
    return this;
  }
  asEncoder(): Encoder<A, O> {
    return this;
  }
}

export const getFunctionName = (f: Function | { displayName: string } | { name: string }): string =>
  (f: any).displayName || (f: any).name || `<function${(f: any).length}>`;

export const getContextEntry = (key: string, type: Decoder<any, any>): ContextEntry => ({ key, type });

export const getValidationError = (value: mixed, context: Context): ValidationError => ({ value, context });

export const getDefaultContext = (type: Decoder<any, any>): Context => ([{ key: '', type }]: Context);

export const appendContext = (c: Context, key: string, type: Decoder<any, any>): Context => {
  const len = c.length;
  const r = Array(len + 1);
  for (let i = 0; i < len; i++) {
    r[i] = c[i];
  }
  r[len] = { key, type };
  return (r: Context);
};

export const failures = <T>(errors: Errors): Validation<T> => new Left(errors);

export const failure = <T>(value: mixed, context: Context): Validation<T> =>
  failures([getValidationError(value, context)]);

export const success = <T>(value: T): Validation<T> => new Right<Errors, T>(value);

export const useIdentity = (types: $ReadOnlyArray<AnyFlowType>): boolean => {
  return types.every(type => type.encode === identity);
};

export function values<P: { +[key: string]: mixed }>(val: P): Array<$Values<P>> {
  return Object.values(val);
}
export function mapValues<P: { +[key: string]: mixed }, F: ($Values<P>, $Keys<P>) => mixed>(
  vals: P,
  iteratee: F
): Object {
  const result = {};
  Object.keys(vals).forEach(key => {
    result[key] = iteratee(vals[key], key);
  });
  return result;
}
