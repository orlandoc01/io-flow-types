//@flow
import * as assert from 'assert';
import * as t from '../../../src/index';
import { assertSuccess, assertFailure, assertStrictEqual, assertDeepEqual, DateFromNumber } from '../../helpers';

describe('inexact', () => {
  it('should properly typecheck values', () => {
    /** Inexact **/
    const required = { foo: t.String };
    const optional = { bar: DateFromNumber };
    const T = t.inexact<typeof required, typeof optional>({ required, optional });
    const a: t.TypeOf<typeof T> = { foo: 'hi', bar: new Date() };
    const b: t.OutputOf<typeof T> = { foo: 'hi', bar: 1 };
    const c: t.TypeOf<typeof T> = { foo: 'hi', bar: new Date(), extra: 1 };
    // $FlowExpectError
    const d: t.TypeOf<typeof T> = { foo: 1, bar: 1 };
    // $FlowExpectError
    const e: t.TypeOf<typeof T> = ({}: {||});
    // $FlowExpectError
    const f: t.TypeOf<typeof T> = 1;

    const T2 = T.shape();
    const g: t.TypeOf<typeof T2> = { foo: 'hi' };
    const h: t.OutputOf<typeof T2> = { bar: 1 };
    const i: t.TypeOf<typeof T2> = {};
    const j: t.TypeOf<typeof T2> = { foo: 'hi', bar: new Date(), extra: 1 };
    const k: t.OutputOf<typeof T2> = { foo: 'hi', bar: 1, extra: 1 };
    // $FlowExpectError
    const l: t.TypeOf<typeof T2> = { foo: 1, bar: 1 };
    // $FlowExpectError
    const m: t.TypeOf<typeof T2> = 1;

    const T3 = T.readOnly();
    const n: t.TypeOf<typeof T3> = { foo: 'hi' };
    const o: t.OutputOf<typeof T3> = { foo: 'hi', bar: 1 };
    const p: t.TypeOf<typeof T3> = { foo: 'hi', bar: new Date(), extra: 1 };
    // $FlowExpectError
    const q: t.OutputOf<typeof T3> = { foo: 1, bar: 1, extra: 1 };
    // $FlowExpectError
    const s: t.TypeOf<typeof T3> = 1;

    const T4 = T.exact();
    const u: t.TypeOf<typeof T4> = { foo: 'hi' };
    const v: t.OutputOf<typeof T4> = { foo: 'hi', bar: 1 };
    // $FlowExpectError
    const w: t.TypeOf<typeof T4> = { foo: 'hi', bar: new Date(), extra: 1 };
    // $FlowExpectError
    const x: t.OutputOf<typeof T4> = { foo: 'hi', bar: 1, extra: 1 };
    // $FlowExpectError
    const y: t.TypeOf<typeof T4> = { foo: 1, bar: new Date() };
    // $FlowExpectError
    const z: t.TypeOf<typeof T4> = 1;
  });
  it('should succeed validating a valid value (required + optional)', () => {
    const required = { a: t.String };
    const optional = { b: t.Number };
    const T = t.inexact<typeof required, typeof optional>({ required, optional });
    assertSuccess(T.decode({ a: 's' }));
  });

  it('should succeed validating a valid value (required)', () => {
    const required = { a: t.String };
    const T = t.inexactAll(required);
    assertSuccess(T.decode({ a: 's' }));
  });

  it('should succeed validating a valid value (shape)', () => {
    const optional = { b: t.Number };
    const T = t.inexactShape(optional);
    assertSuccess(T.decode({}));
    assertSuccess(T.decode({ b: 1 }));
  });

  it('should succeed validating a valid value', () => {
    const T = t.inexactAll({ a: t.String });
    assertSuccess(T.decode({ a: 's' }));
  });

  it('should keep unknown properties', () => {
    const T = t.inexactAll({ a: t.String });
    const validation = T.decode({ a: 's', b: 1 });
    if (validation.isRight()) {
      assert.deepEqual(validation.value, { a: 's', b: 1 });
    } else {
      assert.ok(false);
    }
  });

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.inexactAll({ a: t.String });
    const value = { a: 's' };
    assertStrictEqual(T.decode(value), value);
  });

  it('should return the a new reference if validation succeeded and something changed', () => {
    const T = t.inexactAll({ a: DateFromNumber, b: t.Number });
    assertDeepEqual(T.decode({ a: 1, b: 2 }), { a: new Date(1), b: 2 });
  });

  it('should fail validating an invalid value', () => {
    const T = t.inexactAll({ a: t.String });
    assertFailure(T.decode(1), ['Invalid value 1 supplied to : { a: string }']);
    assertFailure(T.decode({}), ['Invalid value undefined supplied to : { a: string }/a: string']);
    assertFailure(T.decode({ a: 1 }), ['Invalid value 1 supplied to : { a: string }/a: string']);
  });

  it('should serialize a deserialized', () => {
    const T = t.inexactAll({ a: DateFromNumber });
    assert.deepEqual(T.encode({ a: new Date(0) }), { a: 0 });
  });

  it('should return the same reference when serializing', () => {
    const T = t.inexactAll({ a: t.Number });
    assert.strictEqual(T.encode, t.identity);
  });

  it('should succeed validating a valid value (readonly)', () => {
    const T = t.inexactAll({ foo: t.String }).readOnly();
    assertSuccess(T.decode({ foo: 'foo' }));
  });

  it('should fail validating an invalid value (readonly)', () => {
    const T = t.inexactAll({ foo: t.String }).readOnly();
    assertFailure(T.decode({ foo: 1, bar: 1 }), ['Invalid value 1 supplied to : { +foo: string }/foo: string']);
  });

  it('should type guard', () => {
    const T1 = t.inexactAll({ a: t.Number });
    assert.strictEqual(T1.is({ a: 0 }), true);
    assert.strictEqual(T1.is(undefined), false);
    const T2 = t.inexactAll({ a: DateFromNumber });
    assert.strictEqual(T2.is({ a: new Date(0) }), true);
    assert.strictEqual(T2.is({ a: 0 }), false);
    assert.strictEqual(T2.is(undefined), false);
  });

  it('should preserve additional properties while encoding', () => {
    const T = t.inexactAll({ a: DateFromNumber });
    const x = { a: new Date(0), b: 'foo' };
    assert.deepEqual(T.encode(x), { a: 0, b: 'foo' });
  });

  it('should preserve additional properties while encoding', () => {
    const T = t.inexactAll({ a: DateFromNumber });
    const x = { a: new Date(0), b: 'foo' };
    assert.deepEqual(T.encode(x), { a: 0, b: 'foo' });
  });

  it('should be convertable to exact type', () => {
    const T = t.inexactAll({ a: DateFromNumber });
    const x = { a: 0, b: 'foo' };
    assertSuccess(T.decode(x));
    const T2 = T.exact();
    assertFailure(T2.decode(x), ['Invalid value "foo" supplied to : {| a: DateFromNumber |}/b: never']);
  });

  it('should be convertable to $Shape type', () => {
    const T = t.inexactAll({ a: DateFromNumber });
    const x = {};
    assertFailure(T.decode(x), ['Invalid value undefined supplied to : { a: DateFromNumber }/a: DateFromNumber']);
    const T2 = T.shape();
    assertSuccess(T2.decode(x));
    assertSuccess(T2.decode({ a: 1 }));
    assertFailure(T2.decode({ a: 'hi' }), [
      'Invalid value "hi" supplied to : { a?: DateFromNumber }/a: DateFromNumber'
    ]);
  });
});
