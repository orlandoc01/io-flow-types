//@flow
import * as assert from 'assert';
import * as t from '../src/index';
import { assertSuccess, assertFailure, assertStrictEqual, assertDeepEqual, string2, DateFromNumber } from './helpers';

describe('dictionary', () => {
  it('should properly typecheck values', () => {
    /** Basic Dictionary **/
    const T = t.dictionary<typeof t.String, typeof t.Number>(t.String, t.Number);
    const a: t.TypeOf<typeof T> = { a: 1, b: 2 };
    const b: t.OutputOf<typeof T> = { c: 3, d: 4 };
    // $FlowExpectError
    const c: t.TypeOf<typeof T> = { a: 'hi', b: '3' };
    // $FlowExpectError
    const d: t.TypeOf<typeof T> = 1;
    // $FlowExpectError
    const e: t.OutputOf<typeof T> = [1, 2, 3];

    /** Basic Dictionary with Literal Support **/
    const fooLiteral = t.literal<'foo'>('foo');
    const T2 = t.dictionary<typeof fooLiteral, typeof t.String>(fooLiteral, t.String);
    const f: t.TypeOf<typeof T2> = { foo: 'hi' };
    // $FlowExpectError
    const g: t.TypeOf<typeof T> = { foo2: 'hi' };

    /** Dictionary with Complex Output **/
    const T3 = t.dictionary<typeof t.String, typeof DateFromNumber>(t.String, DateFromNumber);
    const h: t.TypeOf<typeof T3> = { foo: new Date() };
    const i: t.OutputOf<typeof T3> = { foo: 1 };
    // $FlowExpectError
    const j: t.TypeOf<typeof T3> = { foo: 1 };
  });

  it('should succeed validating a valid value', () => {
    const T1 = t.dictionary<typeof t.String, typeof t.Number>(t.String, t.Number);
    assertSuccess(T1.decode({}));
    assertSuccess(T1.decode({ aa: 1 }));
    const T2 = t.dictionary(t.refinement(t.String, s => s.length >= 2), t.Number);
    assertSuccess(T2.decode({}));
    assertSuccess(T2.decode({ aa: 1 }));
    const T3 = t.dictionary<typeof string2, typeof t.Number>(string2, t.Number);
    assertSuccess(T3.decode({}));
    assertSuccess(T3.decode({ aa: 1 }));
    // const T4 = t.dictionary(t.String, t.any);
    // assertSuccess(T4.decode([]));
    // assertSuccess(T4.decode([1]));
    // assertSuccess(T4.decode(new Number()));
    // assertSuccess(T4.decode(new Date()));
  });

  it('should return the same reference if validation succeeded if nothing changed', () => {
    const T1 = t.dictionary<typeof t.String, typeof t.Number>(t.String, t.Number);
    const value1 = { aa: 1 };
    assertStrictEqual(T1.decode(value1), value1);
    const T2 = t.dictionary(t.refinement(t.String, s => s.length >= 2), t.Number);
    const value2 = { aa: 1 };
    assertStrictEqual(T2.decode(value2), value2);
  });

  it('should return a new reference if validation succeeded and something changed', () => {
    const T = t.dictionary(string2, t.Number);
    const value = { aa: 1 };
    assertDeepEqual(T.decode(value), { 'a-a': 1 });
  });

  it('should fail validating an invalid value', () => {
    const T1 = t.dictionary(t.String, t.Number);
    assertFailure(T1.decode(1), ['Invalid value 1 supplied to : { [K: string]: number }']);
    assertFailure(T1.decode({ aa: 's' }), ['Invalid value "s" supplied to : { [K: string]: number }/aa: number']);
    assertFailure(T1.decode([]), ['Invalid value [] supplied to : { [K: string]: number }']);
    assertFailure(T1.decode([1]), ['Invalid value [1] supplied to : { [K: string]: number }']);
    assertFailure(T1.decode(new Number()), ['Invalid value 0 supplied to : { [K: string]: number }']);
    const d = new Date();
    assertFailure(T1.decode(d), [`Invalid value ${t.toString(d)} supplied to : { [K: string]: number }`]);
    const T2 = t.dictionary(string2, t.Any);
    //NOTE: Changed this tests value unexpectedly
    assertFailure(T2.decode([1]), ['Invalid value [1] supplied to : { [K: string2]: any }']);
  });

  it('should support literals as domain type', () => {
    const fooLiteral = t.literal<'foo'>('foo');
    const T = t.dictionary<typeof fooLiteral, typeof t.String>(fooLiteral, t.String);
    assertSuccess(T.decode({ foo: 'bar' }));
    assertFailure(T.decode({ foo: 'bar', baz: 'bob' }), [
      'Invalid value "baz" supplied to : { [K: "foo"]: string }/baz: "foo"'
    ]);
  });

  it('should support keyof as domain type', () => {
    const keys = t.keyof({ foo: true, bar: true });
    const T = t.dictionary<typeof keys, typeof t.String>(keys, t.String);
    assertSuccess(T.decode({ foo: 'bar' }));
    assertFailure(T.decode({ foo: 'bar', baz: 'bob' }), [
      'Invalid value "baz" supplied to : { [K: (keyof ["foo","bar"])]: string }/baz: (keyof ["foo","bar"])'
    ]);
  });

  it('should serialize a deserialized', () => {
    const T1 = t.dictionary<typeof t.String, typeof DateFromNumber>(t.String, DateFromNumber);
    assert.deepEqual(T1.encode({ a: new Date(0), b: new Date(1) }), { a: 0, b: 1 });
    const T2 = t.dictionary(string2, t.Number);
    assert.deepEqual(T2.encode({ 'a-a': 1, 'a-b': 2 }), { aa: 1, ab: 2 });
  });

  it('should return the same reference when serializing', () => {
    const T1 = t.dictionary(t.String, t.Number);
    assert.strictEqual(T1.encode, t.identity);
    const T2 = t.dictionary(string2, t.Number);
    assert.strictEqual(T2.encode === t.identity, false);
  });

  it('should type guard', () => {
    const T1 = t.dictionary(t.String, t.Number);
    assert.strictEqual(T1.is({}), true);
    assert.strictEqual(T1.is({ a: 1 }), true);
    assert.strictEqual(T1.is({ a: 'foo' }), false);
    const T2 = t.dictionary(t.String, DateFromNumber);
    assert.strictEqual(T2.is({}), true);
    assert.strictEqual(T2.is({ a: new Date(0) }), true);
    assert.strictEqual(T2.is({ a: 0 }), false);
    const T3 = t.dictionary(string2, t.Number);
    assert.strictEqual(T3.is({}), true);
    assert.strictEqual(T3.is({ 'a-a': 1 }), true);
    assert.strictEqual(T3.is({ aa: 1 }), false);
  });

  it('should assign a default name', () => {
    const T1 = t.dictionary(t.String, t.Number);
    assert.strictEqual(T1.name, '{ [K: string]: number }');
    const T2 = t.dictionary(t.String, t.Number, 'T2');
    assert.strictEqual(T2.name, 'T2');
  });
});
