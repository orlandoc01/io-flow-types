//@flow
import * as assert from 'assert';
import * as t from '../../src/index';
import { assertSuccess, assertFailure, assertStrictEqual, assertDeepEqual, DateFromNumber } from '../helpers';

describe('intersection', () => {
  it('should properly typecheck values', () => {
    const p1 = t.inexactAll({ foo: DateFromNumber });
    const p2 = t.inexactAll({ bar: t.String });
    const T = t.intersection<typeof p1, typeof p2>([p1, p2]);
    const a: t.TypeOf<typeof T> = { foo: new Date(), bar: 'hi' };
    const b: t.OutputOf<typeof T> = { foo: 1, bar: 'hi' };
    // $FlowExpectError
    const c: t.TypeOf<typeof T> = { foo: new Date() };
    // $FlowExpectError
    const d: t.TypeOf<typeof T> = { bar: 'hi' };
    // $FlowExpectError
    const e: t.OutputOf<typeof T> = { foo: 1, bar: 1 };
    // $FlowExpectError
    const f: t.OutputOf<typeof T> = {};
  });

  it('should succeed validating a valid value', () => {
    const T = t.intersection([t.inexactAll({ a: t.Number }), t.inexactAll({ b: t.Number })]);
    assertSuccess(T.decode({ a: 1, b: 2 }));
  });

  it('should keep unknown properties', () => {
    const T = t.intersection([t.inexactAll({ a: t.Number }), t.inexactAll({ b: t.Number })]);
    const validation = T.decode({ a: 1, b: 1, c: true });
    if (validation.isRight()) {
      assert.deepEqual(validation.value, { a: 1, b: 1, c: true });
    } else {
      assert.ok(false);
    }
  });

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.intersection([t.inexactAll({ a: t.Number }), t.inexactAll({ b: t.Number })]);
    const value = { a: 1, b: 2 };
    assertStrictEqual(T.decode(value), value);
  });

  it('should return a new reference if validation succeeded and something changed', () => {
    const T = t.intersection([t.inexactAll({ a: DateFromNumber }), t.inexactAll({ b: t.Number })]);
    assertDeepEqual(T.decode({ a: 1, b: 2 }), { a: new Date(1), b: 2 });
  });

  it('should fail validating an invalid value', () => {
    const T = t.intersection([t.inexactAll({ a: t.Number }), t.inexactAll({ b: t.Number })]);
    assertFailure(T.decode({ a: 1 }), [
      'Invalid value undefined supplied to : ({ a: number } & { b: number })/b: number'
    ]);
  });

  it('should serialize a deserialized', () => {
    const T = t.intersection([t.inexactAll({ a: DateFromNumber }), t.inexactAll({ b: t.Number })]);
    assert.deepEqual(T.encode({ a: new Date(0), b: 1 }), { a: 0, b: 1 });
  });

  it('should return the same reference when serializing', () => {
    const T = t.intersection([t.inexactAll({ a: t.Number }), t.inexactAll({ b: t.Number })]);
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T = t.intersection([t.inexactAll({ a: DateFromNumber }), t.inexactAll({ b: t.Number })]);
    assert.strictEqual(T.is({ a: new Date(0), b: 1 }), true);
    assert.strictEqual(T.is({ a: new Date(0) }), false);
    assert.strictEqual(T.is(undefined), false);
  });
});
