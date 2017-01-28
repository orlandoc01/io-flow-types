//@flow
import * as assert from 'assert';
import * as t from '../src/index';
import { assertSuccess, assertFailure, assertStrictEqual, assertDeepEqual, DateFromNumber } from './helpers';

describe('tuple', () => {
  it('should properly typecheck values', () => {
    const T = t.tuple<typeof t.String, typeof DateFromNumber>([t.String, DateFromNumber]);
    const arr1: t.TypeOf<typeof T> = ['foo', new Date()];
    const arr2: t.OutputOf<typeof T> = ['foo', 1];
    // $FlowExpectError
    const arr3: t.TypeOf<typeof T> = 2;
    // $FlowExpectError
    const arr4: t.TypeOf<typeof T> = ['foo', 'bar'];
    // $FlowExpectError
    const arr5: t.OutputOf<typeof T> = [1, 2];
  });

  it('should succeed validating a valid value', () => {
    const T = t.tuple([t.Number, t.String]);
    assertSuccess(T.decode([1, 'a']));
  });

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.tuple([t.Number, t.String]);
    const value = [1, 'a'];
    assertStrictEqual(T.decode(value), value);
  });

  it('should return the a new reference if validation succeeded and something changed', () => {
    const T = t.tuple([DateFromNumber, t.String]);
    assertDeepEqual(T.decode([1, 'a']), [new Date(1), 'a']);
  });

  it('should fail validating an invalid value', () => {
    const T = t.tuple([t.Number, t.String]);
    assertFailure(T.decode(1), ['Invalid value 1 supplied to : [number, string]']);
    assertFailure(T.decode([]), [
      'Invalid value undefined supplied to : [number, string]/0: number',
      'Invalid value undefined supplied to : [number, string]/1: string'
    ]);
    assertFailure(T.decode([1]), ['Invalid value undefined supplied to : [number, string]/1: string']);
    assertFailure(T.decode([1, 1]), ['Invalid value 1 supplied to : [number, string]/1: string']);
    assertFailure(T.decode([1, 'foo', true]), ['Invalid value true supplied to : [number, string]/2: never']);
  });

  it('should serialize a deserialized', () => {
    const T = t.tuple([DateFromNumber, t.String]);
    assert.deepEqual(T.encode([new Date(0), 'foo']), [0, 'foo']);
  });

  it('should return the same reference when serializing', () => {
    const T = t.tuple([t.Number, t.String]);
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T1 = t.tuple([t.Number, t.String]);
    assert.strictEqual(T1.is([0, 'foo']), true);
    assert.strictEqual(T1.is([0, 2]), false);
    assert.strictEqual(T1.is(undefined), false);
    assert.strictEqual(T1.is([0]), false);
    assert.strictEqual(T1.is([0, 'foo', true]), false);
    const T2 = t.tuple([DateFromNumber, t.String]);
    assert.strictEqual(T2.is([new Date(0), 'foo']), true);
    assert.strictEqual(T2.is([new Date(0), 2]), false);
    assert.strictEqual(T2.is(undefined), false);
    assert.strictEqual(T2.is([new Date(0)]), false);
    assert.strictEqual(T2.is([new Date(0), 'foo', true]), false);
  });

  it('should assign a default name', () => {
    const T1 = t.tuple([t.Number, t.String]);
    assert.strictEqual(T1.name, '[number, string]');
    const T2 = t.tuple([t.Number, t.String], 'T2');
    assert.strictEqual(T2.name, 'T2');
  });
});
