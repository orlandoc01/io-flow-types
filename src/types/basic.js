//@flow
//
// basic types
//
import { Type, getDefaultContext, success, failure, identity } from './index.js';

export const isArray = (arr: mixed): boolean %checks => Array.isArray(arr);
export const isObject = (obj: mixed): boolean %checks => typeof obj === 'object' && obj !== null;
export const isDictionary = (obj: mixed): boolean %checks =>
  isObject(obj) && Object.prototype.toString.call(obj) === '[object Object]';

/** @alias `null` */
export opaque type NullType: Type<null> = Type<null>;
export const Null: NullType = new Type('null', n => n === null);

export opaque type UndefinedType: Type<typeof undefined> = Type<typeof undefined>;
export const Undefined: UndefinedType = new Type('undefined', n => n === void 0);

export opaque type VoidType: Type<void> = Type<void>;
export const Void: VoidType = new Type('void', Undefined.is, Undefined.validate);

export opaque type AnyType: Type<any> = Type<any>;
export const Any: AnyType = new Type('any', () => true, success);

export opaque type StringType: Type<string> = Type<string>;
export const String: StringType = new Type('string', m => typeof m === 'string');

export opaque type NumberType: Type<number> = Type<number>;
export const Number: NumberType = new Type('number', m => typeof m === 'number');

export opaque type BooleanType: Type<boolean> = Type<boolean>;
export const Boolean: BooleanType = new Type('boolean', m => typeof m === 'boolean');

export opaque type MixedArrayType: Type<Array<mixed>> = Type<Array<mixed>>;
export const arrayType: MixedArrayType = new Type('Array', isArray);

export opaque type MixedDictionaryType: Type<{ [key: string]: mixed }> = Type<{ [key: string]: mixed }>;
export const Dictionary: MixedDictionaryType = new Type('Dictionary', isDictionary);

export opaque type ObjectType: Type<Object> = Type<Object>;
export const object: ObjectType = new Type('Object', isObject);

export opaque type never = mixed;
export opaque type NeverType: Type<never> = Type<never>;
export const Never: NeverType = new Type(
  'never',
  () => false,
  (m, c) => failure(m, c),
  () => {
    throw new Error('cannot encode never');
  }
);
