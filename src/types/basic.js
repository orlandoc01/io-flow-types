//@flow
//
// basic types
//
import { Type, getDefaultContext, success, failure, identity } from './index.js';

export const isArray = (arr: mixed): boolean %checks => Array.isArray(arr);
export const isObject = (obj: mixed): boolean %checks => typeof obj === 'object' && obj !== null;
export const isDictionary = (obj: mixed): boolean %checks =>
  isObject(obj) && Object.prototype.toString.call(obj) === '[object Object]';

export opaque type NullType: Type<null> = Type<null>;
/** an instance of `Type` (`Type<null, null, mixed`>) that decodes `null` instances.
 * @since 0.1.0
 */
export const Null: NullType = new Type('null', n => n === null);

export opaque type UndefinedType: Type<typeof undefined> = Type<typeof undefined>;
/** an instance of `Type` (`Type<undefined, undefined, mixed`>) that decodes `undefined` instances.
 * @since 0.1.0
 */
export const Undefined: UndefinedType = new Type('undefined', n => n === void 0);

export opaque type VoidType: Type<void> = Type<void>;
/** an instance of `Type` (`Type<void, void, mixed`>) that decodes `void` instances.
 * @since 0.1.0
 */
export const Void: VoidType = new Type('void', Undefined.is, Undefined.validate);

export opaque type AnyType: Type<any> = Type<any>;
/** an instance of `Type` (`Type<any, any, mixed`>) that decodes `any` instances.
 * @since 0.1.0
 */
export const Any: AnyType = new Type('any', () => true, success);

export opaque type StringType: Type<string> = Type<string>;
/** an instance of `Type` (`Type<string, string, mixed`>) that decodes `string` instances.
 * @since 0.1.0
 */
export const String: StringType = new Type('string', m => typeof m === 'string');

export opaque type NumberType: Type<number> = Type<number>;
/** an instance of `Type` (`Type<number, number, mixed`>) that decodes `number` instances.
 * @since 0.1.0
 */
export const Number: NumberType = new Type('number', m => typeof m === 'number');

export opaque type BooleanType: Type<boolean> = Type<boolean>;
/** an instance of `Type` (`Type<boolean, boolean, mixed`>) that decodes `boolean` instances.
 * @since 0.1.0
 */
export const Boolean: BooleanType = new Type('boolean', m => typeof m === 'boolean');

export opaque type MixedArrayType: Type<Array<mixed>> = Type<Array<mixed>>;
/** an instance of `Type` (`Type<Array<mixed>, Array<mixed>, mixed`>) that decodes an Array instances.
 * @since 0.1.0
 */
export const arrayType: MixedArrayType = new Type('Array', isArray);

export opaque type MixedDictionaryType: Type<{ [key: string]: mixed }> = Type<{ [key: string]: mixed }>;
/** an instance of `Type` that decodes Dictionary instances (which are repesented with flow as { [key: string]: mixed }).
 * @since 0.1.0
 */
export const Dictionary: MixedDictionaryType = new Type('Dictionary', isDictionary);

export opaque type ObjectType: Type<Object> = Type<Object>;
/** an instance of `Type` that decodes Object instances.
 * @since 0.1.0
 */
export const object: ObjectType = new Type('Object', isObject);

export opaque type never = mixed;
export opaque type NeverType: Type<never> = Type<never>;
/** an instance of `Type` that will not decode values of any type and will fail encoding anything
 * @since 0.1.0
 * @type Type
 */
export const Never: NeverType = new Type(
  'never',
  () => false,
  (m, c) => failure(m, c),
  () => {
    throw new Error('cannot encode never');
  }
);
