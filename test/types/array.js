//@flow
import * as assert from 'assert';
import * as t from '../../src/index';
import { assertSuccess, assertFailure, assertStrictEqual, assertDeepEqual, DateFromNumber } from '../helpers';

describe('array', () => {
  it('should properly typecheck values', () => {
    const T = t.array<typeof t.Number>(t.Number);
    const arr1: t.TypeOf<typeof T> = [1, 2, 3];
    const arr2: t.OutputOf<typeof T> = [1, 2, 3];
    // $FlowExpectError
    const arr3: t.TypeOf<typeof T> = 2;
    // $FlowExpectError
    const arr4: t.TypeOf<typeof T> = ['', ''];
    // $FlowExpectError
    const arr5: t.OutputOf<typeof T> = [true, false];

    const T2 = t.array<typeof DateFromNumber>(DateFromNumber);
    const arr6: t.TypeOf<typeof T2> = [new Date(), new Date()];
    const arr7: t.OutputOf<typeof T2> = [1, 2];
    // $FlowExpectError
    const arr8: t.TypeOf<typeof T2> = [1, 2, 3];
  });

  it('should succeed validating a valid value', () => {
    const T = t.array<typeof t.Number>(t.Number);
    assertSuccess(T.decode([]));
    assertSuccess(T.decode([1, 2, 3]));
  });

  it('should return the same reference if validation succeeded and nothing changed', () => {
    const T = t.array<typeof t.Number>(t.Number);
    const value = [1, 2, 3];
    assertStrictEqual(T.decode(value), value);
  });

  it('should return a new reference if validation succeeded and something changed', () => {
    const T = t.array<typeof DateFromNumber>(DateFromNumber);
    assertDeepEqual(T.decode([1, 2, 3]), [new Date(1), new Date(2), new Date(3)]);
  });

  it('should fail validating an invalid value', () => {
    const T = t.array<typeof t.Number>(t.Number);

    assertFailure(T.decode(1), ['Invalid value 1 supplied to : Array<number>']);
    assertFailure(T.decode([1, 's', 3]), ['Invalid value "s" supplied to : Array<number>/1: number']);
  });

  it('should serialize a deserialized', () => {
    const T = t.array<typeof DateFromNumber>(DateFromNumber);
    assert.deepEqual(T.encode([new Date(0), new Date(1)]), [0, 1]);
  });

  it('should return the same reference when serializing', () => {
    const T = t.array<typeof t.Number>(t.Number);
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T1 = t.array<typeof t.Number>(t.Number);
    assert.strictEqual(T1.is([]), true);
    assert.strictEqual(T1.is([0]), true);
    assert.strictEqual(T1.is([0, 'foo']), false);
    const T2 = t.array<typeof DateFromNumber>(DateFromNumber);
    assert.strictEqual(T2.is([]), true);
    assert.strictEqual(T2.is([new Date(0)]), true);
    assert.strictEqual(T2.is([new Date(0), 0]), false);
  });

  it('should assign a default name', () => {
    const T1 = t.array(t.Number);
    assert.strictEqual(T1.name, 'Array<number>');
    const T2 = t.array(t.Number, 'T2');
    assert.strictEqual(T2.name, 'T2');
  });
});

describe('readonlyArray', () => {
  it('should properly typecheck values', () => {
    const T = t.readonlyArray<typeof t.Number>(t.Number);
    const arr1: t.TypeOf<typeof T> = [1, 2, 3];
    const arr2: t.OutputOf<typeof T> = [1, 2, 3];
    // $FlowExpectError
    const arr3: t.TypeOf<typeof T> = 2;
    // $FlowExpectError
    const arr4: t.TypeOf<typeof T> = ['', ''];
    // $FlowExpectError
    const arr5: t.OutputOf<typeof T> = [true, false];

    const T2 = t.readonlyArray<typeof DateFromNumber>(DateFromNumber);
    const arr6: t.TypeOf<typeof T2> = [new Date(), new Date()];
    const arr8: t.OutputOf<typeof T2> = [1, 2];
    // $FlowExpectError
    const arr9: t.TypeOf<typeof T2> = [1, 2, 3];
  });

  it('should succeed validating a valid value', () => {
    const T = t.readonlyArray(t.Number);
    assertSuccess(T.decode([1]));
  });

  it('should fail validating an invalid value', () => {
    const T = t.readonlyArray(t.Number);
    assertFailure(T.decode(['s']), ['Invalid value "s" supplied to : $ReadOnlyArray<number>/0: number']);
  });

  it('should freeze the value', () => {
    const T = t.readonlyArray(t.Number);
    T.decode([1]).map(x => assert.ok(Object.isFrozen(x)));
  });

  it('should not freeze in production', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const T = t.readonlyArray(t.Number);
    T.decode([1]).map(x => assert.ok(!Object.isFrozen(x)));
    process.env.NODE_ENV = env;
  });

  it('should serialize a deserialized', () => {
    const T = t.readonlyArray(DateFromNumber);
    assert.deepEqual(T.encode([new Date(0), new Date(1)]), [0, 1]);
  });

  it('should return the same reference when serializing', () => {
    const T = t.readonlyArray(t.Number);
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T1 = t.readonlyArray(t.Number);
    assert.strictEqual(T1.is([]), true);
    assert.strictEqual(T1.is([0]), true);
    assert.strictEqual(T1.is([0, 'foo']), false);
    assert.strictEqual(T1.is(undefined), false);
    const T2 = t.readonlyArray(DateFromNumber);
    assert.strictEqual(T2.is([]), true);
    assert.strictEqual(T2.is([new Date(0)]), true);
    assert.strictEqual(T2.is([new Date(0), 'foo']), false);
    assert.strictEqual(T2.is(undefined), false);
  });

  it('should assign a default name', () => {
    const T1 = t.readonlyArray(t.Number);
    assert.strictEqual(T1.name, '$ReadOnlyArray<number>');
    const T2 = t.readonlyArray(t.Number, 'T2');
    assert.strictEqual(T2.name, 'T2');
  });
});
