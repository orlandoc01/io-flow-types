//@flow
import * as t from '../src/index';
import type { TypeOf } from '../src/index';
import { assertSuccess, assertFailure, assertStrictEqual, DateFromNumber } from './helpers';
import * as assert from 'assert';

describe('exact', () => {
  it('should properly typecheck values', () => {
    /** Exact **/
    const required = { foo: t.String };
    const optional = { bar: DateFromNumber, baz: t.Number };
    const T = t.exact<typeof required, typeof optional>({ required, optional });
    const a: t.TypeOf<typeof T> = { foo: 'hi', bar: new Date() };
    const b: t.OutputOf<typeof T> = { foo: 'hi', bar: 1 };
    // $FlowExpectError
    const c: t.TypeOf<typeof T> = { foo: 'hi', bar: new Date(), extra: 1 };
    // $FlowExpectError
    const d: t.OutputOf<typeof T> = { foo: 'hi', bar: 1, extra: 1 };
    // $FlowExpectError
    const e: t.TypeOf<typeof T> = { foo: 1, bar: 1 };
    // $FlowExpectError
    const f: t.TypeOf<typeof T> = ({}: {||});
    // $FlowExpectError
    const g: t.TypeOf<typeof T> = 1;

    const T2 = T.shape();
    const h: t.TypeOf<typeof T2> = { foo: 'hi' };
    const i: t.OutputOf<typeof T2> = { bar: 1 };
    const j: t.TypeOf<typeof T2> = {};
    // $FlowExpectError
    const k: t.TypeOf<typeof T2> = { foo: 'hi', bar: new Date(), extra: 1 };
    // $FlowExpectError
    const l: t.OutputOf<typeof T2> = { foo: 'hi', bar: 1, extra: 1 };
    // $FlowExpectError
    const m: t.TypeOf<typeof T2> = { foo: 1, bar: 1 };
    // $FlowExpectError
    const n: t.TypeOf<typeof T2> = 1;

    const T3 = T.readOnly();
    const o: t.TypeOf<typeof T3> = { foo: 'hi' };
    const p: t.OutputOf<typeof T3> = { foo: 'hi', bar: 1 };
    // $FlowExpectError
    const q: t.TypeOf<typeof T3> = { foo: 'hi', bar: new Date(), extra: 1 };
    // $FlowExpectError
    const s: t.OutputOf<typeof T3> = { foo: 'hi', bar: 1, extra: 1 };
    // $FlowExpectError
    const u: t.TypeOf<typeof T3> = 1;

    const T4 = T.inexact();
    const v: t.TypeOf<typeof T4> = { foo: 'hi' };
    const w: t.OutputOf<typeof T4> = { foo: 'hi', bar: 1 };
    const x: t.TypeOf<typeof T4> = { foo: 'hi', bar: new Date(), extra: 1 };
    const y: t.OutputOf<typeof T4> = { foo: 'hi', bar: 1, extra: 1 };
    // $FlowExpectError
    const z: t.TypeOf<typeof T4> = { foo: 1, bar: new Date() };
    // $FlowExpectError
    const aa: t.TypeOf<typeof T4> = 1;
  });

  it('should succeed validating a valid value (required)', () => {
    const T = t.exactAll({ foo: t.String });
    assertSuccess(T.decode({ foo: 'foo' }));
  });

  it('should succeed validating a valid value (shape)', () => {
    const T = t.exactShape({ foo: t.String });
    assertSuccess(T.decode({ foo: 'foo' }));
    // assertSuccess(T.decode({ foo: undefined }));
    assertSuccess(T.decode({}));
  });

  it('should succeed validating a valid value (required + optional)', () => {
    const required = { foo: t.String };
    const optional = { bar: t.Number };
    const T = t.exact({ required, optional });
    assertSuccess(T.decode({ foo: 'foo', bar: 1 }));
    // assertSuccess(T.decode({ foo: 'foo', bar: undefined }))
    assertSuccess(T.decode({ foo: 'foo' }));
  });

  it('should succeed validating a valid value (refinement)', () => {
    const T = t.refinement(t.exactAll({ foo: t.String }), p => p.foo.length > 2);
    assertSuccess(T.decode({ foo: 'foo' }));
  });

  it('should succeed validating a valid value (readonly)', () => {
    const T = t.exactAll({ foo: t.String }).readOnly();
    assertSuccess(T.decode({ foo: 'foo' }));
  });

  it('should succeed validating an undefined field', () => {
    const T = t.exact({ required: { foo: t.String }, optional: { bar: t.String } });
    assertSuccess(T.decode({ foo: 'foo' }));
  });

  it('should return the same reference if validation succeeded', () => {
    const T = t.exactAll({ foo: t.String });
    const value = { foo: 'foo' };
    assertStrictEqual(T.decode(value), value);
  });

  it('should fail validating an invalid value (type)', () => {
    const T = t.exactAll({ foo: t.String });
    assertFailure(T.decode({ foo: 'foo', bar: 1, baz: true }), [
      'Invalid value 1 supplied to : {| foo: string |}/bar: never',
      'Invalid value true supplied to : {| foo: string |}/baz: never'
    ]);
  });

  it('should fail validating an invalid value (partial)', () => {
    const T = t.exact({ required: { foo: t.String }, optional: { bar: t.Number } });
    assertFailure(T.decode({ foo: 'foo', baz: true }), [
      'Invalid value true supplied to : {| foo: string, bar?: number |}/baz: never'
    ]);
  });

  it('should fail validating an invalid value (shape)', () => {
    const T = t.exactShape({ foo: t.String });
    assertFailure(T.decode({ bar: 1 }), ['Invalid value 1 supplied to : {| foo?: string |}/bar: never']);
  });

  it('should fail validating an invalid value (refinement)', () => {
    const T = t.refinement(t.exactAll({ foo: t.String }), p => p.foo.length > 2);
    assertFailure(T.decode({ foo: 'foo', bar: 1 }), [
      'Invalid value 1 supplied to : ({| foo: string |} | <function1>)/bar: never'
    ]);
  });

  it('should fail validating an invalid value (readonly)', () => {
    const T = t.exactAll({ foo: t.String }).readOnly();
    assertFailure(T.decode({ foo: 'foo', bar: 1 }), ['Invalid value 1 supplied to : {| +foo: string |}/bar: never']);
  });

  it('should assign a default name', () => {
    const T1 = t.exactAll({ foo: t.String }, 'Foo');
    assert.strictEqual(T1.name, 'Foo');
    const T2 = t.exactAll({ foo: t.String });
    assert.strictEqual(T2.name, '{| foo: string |}');
  });

  it('should serialize a deserialized', () => {
    const T = t.exactAll({ a: DateFromNumber });
    assert.deepEqual(T.encode({ a: new Date(0) }), { a: 0 });
  });

  it('should return the same reference when serializing', () => {
    const T = t.exactAll({ a: t.Number });
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T1 = t.exactAll({ a: t.Number });
    assert.strictEqual(T1.is({ a: 0 }), true);
    assert.strictEqual(T1.is({ a: 0, b: 1 }), false);
    assert.strictEqual(T1.is(undefined), false);
    const T2 = t.exactAll({ a: DateFromNumber });
    assert.strictEqual(T2.is({ a: new Date(0) }), true);
    assert.strictEqual(T2.is({ a: new Date(0), b: 1 }), false);
    assert.strictEqual(T2.is(undefined), false);
  });

  it('should be convertable to inexact type', () => {
    const T = t.exactAll({ a: DateFromNumber });
    const x = { a: 0, b: 'foo' };
    assertFailure(T.decode(x), ['Invalid value "foo" supplied to : {| a: DateFromNumber |}/b: never']);
    const T2 = T.inexact();
    assertSuccess(T2.decode(x));
  });

  it('should be convertable to $Shape type', () => {
    const T = t.exactAll({ a: DateFromNumber });
    const x = {};
    assertFailure(T.decode(x), ['Invalid value undefined supplied to : {| a: DateFromNumber |}/a: DateFromNumber']);
    const T2 = T.shape();
    assertSuccess(T2.decode(x));
    assertSuccess(T2.decode({ a: 1 }));
    assertFailure(T2.decode({ a: 'hi' }), [
      'Invalid value "hi" supplied to : {| a?: DateFromNumber |}/a: DateFromNumber'
    ]);
  });
});
