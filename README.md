[![CircleCI](https://circleci.com/gh/orlandoc01/io-flow-types/tree/master.svg?style=svg)](https://circleci.com/gh/orlandoc01/io-flow-types/tree/master)
![Dependencies](https://david-dm.org/orlandoc01/io-flow-types.svg)
[![Minzip Size](https://badgen.net/bundlephobia/minzip/io-flow-types)](https://bundlephobia.com/result?p=io-flow-types)

# Summary
The work that gcanti has done with [io-ts](https://github.com/gcanti/io-ts) is really useful, but it relies on a lot of language semantics that are exclusive to Typescript and the work on [flow-io](https://github.com/gcanti/flow-io) is now deprecated and no longer maintained. As a result, I have forked his work and refactored a lot of the existing combinators/classes so they more easily align with the semantics of [Flow](https://flow.org/). 

# Table of Contents
- [The idea](#the-idea)
- [Error handling](#error-handling)
    - [Error reporters](#error-reporters)
- [Implemented types / combinators](#implemented-types--combinators)
- [Flow compatibility](#flow-compatibility)
- [Flow integration](#flow-integration)
- [Mixing required and optional props](#mixing-required-and-optional-props)
- [Union Maps](#union-maps)
- [Refinements](#refinements)
- [Custom types](#custom-types)
  - [Custom Error Messages](#custom-error-messages)
- [Tips and Tricks](#tips-and-tricks)
  - [Is there a way to turn the checks off in production code?](#is-there-a-way-to-turn-the-checks-off-in-production-code)
  - [Union of string literals](#union-of-string-literals)

# The idea

Blog post: ["Typescript and validations at runtime boundaries"](https://lorefnon.tech/2018/03/25/typescript-and-validations-at-runtime-boundaries/) by [@lorefnon](https://github.com/lorefnon)

Similiar to [io-ts](https://github.com/gcanti/io-ts), a value of type `Type<A, O, I>` (called "runtime type") is the runtime representation of the static type `A`.

A runtime type can

- decode inputs of type `I` (through `decode`)
- encode outputs of type `O` (through `encode`)
- be used as a custom type guard (through `is`)

```javascript
type Validation<A> = Either<Errors, A>;

class Type<A, +O = A, I = mixed> {
  +_A: A
  +_O: O
  +_I: I
  constructor(
    /** a unique name for this runtime type */
    name: string,
    /** a custom type guard */
    is: (v: mixed) => boolean,
    /** succeeds if a value of type I can be decoded to a value of type A */
    validate: (input: I, context: Context) => Validation<A>,
    /** converts a value of type A to a value of type O */
    encode: (a: A) => O
  ) {}
  /** a version of `validate` with a default context */
  decode(i: I): Either<Errors, A>
  /** a version of `validate` which will throw if invalid */
  assert(i: I): A
}
```

**Example**

A runtime type representing `string` can be defined as

```javascript
import * as t from 'io-flow-types'

// runtime type definition
export class StringType extends t.Type<string> {
  // equivalent to Type<string, string, mixed> as per type parameter defaults
  constructor() {
    super(
      'string',
      (m): m is string => typeof m === 'string',
      (m, c) => (this.is(m) ? t.success(m) : t.failure(m, c)),
      t.identity
    )
  }
}

// runtime type instance: use this when building other runtime types instances
export const string = new StringType()
```

A runtime type can be used to validate an object in memory (for example an API payload)

```javascript
const Person = t.inexactAll({name: t.String, age: t.Number})

// validation succeeded
Person.decode(JSON.parse('{"name":"John","age":43}')) // => right({name: "John", age: 43})

// validation failed
Person.decode(JSON.parse('{"name":"John"}')) // => left([...])

//assertion succeeded
Person.assert(JSON.parse('{"name":"John","age":43}')) // => {name: "John", age: 43}

//async assertion succeeded
Promise.resolve('{"name":"John","age":43}')
  .then(JSON.parse)
  .then(Person.getAssert())
  .then(val => {
    return val // => {name: "John", age: 43})
  });
```
# Error handling

An error that is uncovered during decoding will be packed into an instance of the `ValidationError` class.
```javascript
class ValidationError extends Error {
  +value: mixed;
  +context: Context;
  +message: string;
  constructor(value: mixed, context: Context, message?: string)
}
```

Besides having a `message` property, as is standard for Error classes in JavaScript, it also references the value which failed validation along with the context that was used in decoding. By default, if a message isn't supplied, a default one will be constructed based on the context reference

All errors that are uncovered during decoding will be packed into an instance of the `AggregateErrors` class, which is a subclass of `Array<ValidationError>`. 
```javascript
class AggregateError extends Array<ValidationError> {
  constructor(...args: ValidationError[])
  messages(): Array<string>
}
```
Errors can be still be extracted individually as elements of the wrapped array, and the messages can be extracted all at once via the introduction of the `messages()` method on this class.

An example of Error inspection is shown below:
```javascript
const Person = t.inexactAll({name: t.String, age: t.Number})

// validation failed with decode
const leftErr = Person.decode(JSON.parse('{}')) // => left([...])

if (leftErr.tag === 'Left') {
  const errs = leftErr.value;
  console.log(errs[0].message)
  // => Invalid value undefined supplied to : { name: string, age: number }/name: string
  console.log(errs[1].message)
  // => Invalid value undefined supplied to : { name: string, age: number }/age: number
}

try {
 // validation throws with assert
 Person.assert(JSON.parse('{}')) // => left([...])
} catch (errs) {
  console.log(errs[0].message)
  // => Invalid value undefined supplied to : { name: string, age: number }/name: string
  console.log(errs[1].message)
  // => Invalid value undefined supplied to : { name: string, age: number }/age: number
}

////async validation
Promise.resolve('{}')
  .then(JSON.parse)
  .then(Person.getAssert())
  .catch(errs => {
    console.log(errs[0].message)
    // => Invalid value undefined supplied to : { name: string, age: number }/name: string
    console.log(errs[1].message)
    // => Invalid value undefined supplied to : { name: string, age: number }/age: number
  });
```
### Error reporters

To implement custom error reporters, it's recommended to design an object which can implement the following interface.

```javascript
interface Reporter<A> {
  report: (validation: Validation<any>) => A
}
```

The `report` method above should be prepared to take a `Validation` instance, which will be either `left(AggregateErrors)` or `right(T)` where `T` is the correctly decoded type. The reporter should check for and then use an instance of the `AggregateErrors` class and perform the necessary transformation, using the `context` and `value` properties on `ValidationError` instances packed inside `AggregateErrors` instance.

The example below implements a `getPaths` function which can be used as the `report` method on a Reporter-like object. It basically will take validations that fail and print the paths that failed. 

```javascript
import * as t from 'io-flow-types'

const getPathFromError = (error: t.ValidationError) => {
  return error.context.map(({ key }) => key).join('.');
}

const getPaths = <A>(v: t.Validation<A>): Array<string> => {
  return v.fold(errors => [...errors].map(getPathFromError), () => ['no errors'])
}

const Person = t.exactAll({name: t.String, age: t.Number })

console.log(getPaths(Person.decode({}))) // => [ '.name', '.age' ]
```

# Implemented types / combinators

```javascript
import * as t from 'io-flow-types'
```

| Type                      | Flow                              | Runtime type / combinator                             |
| ------------------------- | --------------------------------------- | ----------------------------------------------------- |
| null                      | `null`                                  | `t.Null`                                              |
| undefined                 | `undefined`                             | `t.Undefined`                                         |
| void                      | `void`                                  | `t.Void`                                              |
| string                    | `string`                                | `t.String`                                            |
| number                    | `number`                                | `t.Number`                                            |
| boolean                   | `boolean`                               | `t.Boolean`                                           |
| any                       | `any`                                   | `t.Any`                                               |
| never                     | `never`                                 | `t.Never`                                             |
| object                    | `object`                                | `t.object`                                            |
| integer                   | ✘                                       | `t.Integer`                                           |
| literal                   | `'s'`                                   | `t.literal<'s'>('s')`                                 |
| array of any              | `Array<mixed>`                          | `t.arrayType`                                         |
| array of type             | `Array<A>`                              | `t.array(A)`                                          |
| readonly array            | `$ReadOnlyArray<A>`                     | `t.readonlyArray(A)`                                  |
| dictionary of any         | `{ [key: string]: mixed }`              | `t.Dictionary`                                        |
| dictionary of type        | `{ [key: A]: B }`                       | `t.dictionary(A, B)`                                  |
| tuple                     | `[ A, B ]`                              | `t.tuple([ A, B ])`                                   |
| union                     | `A \| B`                                | `t.union([ A, B ])` or <br> `t.unionMap({tagVal1: A, tagVal2: B}, tagName)` |
| intersection              | `A & B`                                 | `t.intersection([ A, B ])`                            |
| keyof                     | `keyof M`                               | `t.keyof(M)`                                          |
| refinement                | `A`, `Opaque: A`                        | `t.refinement(A, predicate)` or<br>`t.opaqueRefine<A, Opaque>(A, predicate)`|
| exact types               | `{\| a: A, b?: B \|}`                   | `t.exact({required: {a :A}, optional: {b: B}})`       |
|                           | `{\| a: A, b: B \|}`                    | `t.exactAll({a: A, b: B})`                            |
|                           | `{\| a?: A, b?: B \|}`                  | `t.exactShape({a: A, b: B}`                           |
| inexact types             | `{ a: A, b: b }`                        | `t.inexact({required: {a: A}, optional: {b: B}})`     |
|                           | `{ a: A, b: B }`                        | `t.inexactAll({a: A, b: B})`                          |
|                           | `{ a?: A, b?: B }`                      | `t.inexactShape({a: A, b: B})`                        |

*Note*: Assume `A` and `B` are instances of the `t.Type` class


# Flow compatibility

The library is tested against a range of `flow-bin` versions, which is listed as the `peerDependencies` section of this NPM package.

# Flow integration

Runtime types can be inspected

![instrospection](docs/images/introspection.png)

This library uses FLow extensively. Its API is defined in a way which automatically infers types for produced values

![inference](docs/images/inference.png)

Static types can be extracted from runtime types using the `TypeOf` operator

```javascript
type IPerson = t.TypeOf<typeof Person>;

// same as
type IPerson = {
  name: string
  age: number
};

// also the same as
type IPerson = $PropertyType<typeof Person, '_A'>;
```

# Mixing required and optional props

You can mix required and optional props using an intersection

```javascript
const required = {foo: t.string};
const optional = { bar: t.number }
const C = t.exact<typeof required, typeof optional>({required, optional})
type CT = t.TypeOf<typeof C>;

// same as
type CT = {
  foo: string
  bar?: number
}
```

You can call `shape` to an already defined runtime type if created with one of the `exact` or `inexact` functions

```javascript
const PersonType = t.exactAll({
  name: t.string,
  age: t.number
})

const PartialPersonType = Person.shape();

type PartialPerson = t.TypeOf<typeof PartialPersonType>;

// same as
type PartialPerson = {
  name?: string
  age?: number
}
```

# Union Maps

If you are encoding tagged unions, instead of the general purpose `union` combinator, you may want to use the
`unionMap` combinator in order to get better performances

```javascript
const A = t.exactAll({
  tag: t.literal('A'),
  foo: t.string
})

const B = t.exactAll({
  tag: t.literal('B'),
  bar: t.number
})

const U = t.unionMap({A, B}, 'tag')
```

# Refinements

You can refine a type (_any_ type) using the `refinement` combinator

```javascript
const Adult = t.refinement(Person, person => person.age >= 18, 'Adult')
```

However, unless you utilize Flow's opaque types, this can't be enforced via a static check. For stricter safety, you should use the `opaqueRefine` function and supply the opaque type as a generic

```javascript
opaque type Positive: number = number;
const positive = t.opaqueRefine<typeof t.Number, Positive>(t.Number, num => num > 0, 'Positive')
```

# Custom types

You can define your own types. Let's see an example

```javascript
import * as t from 'io-flow-types'

// represents a Date from an ISO string
const DateFromString = new t.Type<Date, string>(
  'DateFromString',
  (m): m is Date => m instanceof Date,
  (m, c) =>
    t.string.validate(m, c).chain(s => {
      const d = new Date(s)
      return isNaN(d.getTime()) ? t.failure(s, c) : t.success(d)
    }),
  a => a.toISOString()
)

const s = new Date(1973, 10, 30).toISOString()

DateFromString.decode(s)
// right(new Date('1973-11-29T23:00:00.000Z'))

DateFromString.decode('foo')
// left(errors...)
```

Note that you can **deserialize** while validating.

### Custom Error Messages

You can set your own error message by providing a `message` argument to `failure`

Example

```ts
const NumberFromString = new t.Type<number, string, unknown>(
  'NumberFromString',
  t.number.is,
  (u, c) =>
    t.string.validate(u, c).chain(s => {
      const n = +s
      return isNaN(n) ? t.failure(u, c, 'cannot parse to a number') : t.success(n)
    }),
  String
)

console.log(PathReporter.report(NumberFromString.decode('a')))
// => ['cannot parse to a number']
```

# Tips and Tricks

## Is there a way to turn the checks off in production code?

No, however you can define your own logic for that (if you _really_ trust the input)

```javascript
import * as t from 'io-flow-types';

const { NODE_ENV } = process.env

export function unsafeDecode<A, O>(value: mixed, type: t.Type<A, O>): t.Either<t.Errors, A> {
  if (NODE_ENV !== 'production' || type.encode !== t.identity) {
    return type.decode(value)
  } else {
    // unsafe cast
    return t.Right((value: any): A)
  }
}

// or...

import { failure } from 'io-flow-types/lib/PathReporter'

export function unsafeGet<A, O>(value: mixed, type: t.Type<A, O>): A {
  if (NODE_ENV !== 'production' || type.encode !== t.identity) {
    return type.decode(value).getOrElseL(errors => {
      throw new Error(failure(errors).join('\n'))
    })
  } else {
    // unsafe cast
    return ((value: any): A)
  }
}
```

## Union of string literals

Use `keyof` instead of `union` when defining a union of string literals

```javascript
const Bad = t.union([
  t.literal<'foo'>('foo'),
  t.literal<'bar'>('bar'),
  t.literal<'baz'>('baz')
  // etc...
])

const Good = t.keyof({
  foo: null,
  bar: null,
  baz: null
  // etc...
})
```

Benefits

- unique check for free
- better performance
- quick info stays responsive

# Known issues

- TODO
