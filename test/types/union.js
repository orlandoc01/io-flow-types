//@flow
import * as assert from 'assert';
import * as t from '../../src/index';
import {
  NumberOrString,
  DateFromNumOrStr2,
  assertSuccess,
  assertFailure,
  assertStrictEqual,
  DateFromNumber,
  DateFromNumOrStr
} from '../helpers';

describe('union', () => {
  it('should properly typecheck values', () => {
    const T = t.union<typeof t.String, typeof DateFromNumber>([t.String, DateFromNumber]);
    const a: t.TypeOf<typeof T> = 'foo';
    const b: t.TypeOf<typeof T> = new Date();
    const c: t.OutputOf<typeof T> = 'foo';
    const d: t.OutputOf<typeof T> = 1;
    // $FlowExpectError
    const e: t.TypeOf<typeof T> = 1;
    // $FlowExpectError
    const f: t.TypeOf<typeof T> = true;
    // $FlowExpectError
    const g: t.OutputOf<typeof T> = [1, 2];
  });

  it('should succeed validating a valid value', () => {
    const T = t.union([t.String, t.Number]);
    assertSuccess(T.decode('s'));
    assertSuccess(T.decode(1));
  });

  it('should return the same reference if validation succeeded', () => {
    const value: { [key: string]: mixed } | number = {};
    const T = t.union([t.Dictionary, t.Number]);
    assertStrictEqual(T.decode(value), value);
  });

  it('should fail validating an invalid value', () => {
    const T = t.union([t.String, t.Number]);
    assertFailure(T.decode(true), [
      'Invalid value true supplied to : (string | number)/0: string',
      'Invalid value true supplied to : (string | number)/1: number'
    ]);
  });

  it('should serialize a deserialized', () => {
    const T1 = t.union([t.inexactAll({ a: DateFromNumber }), t.Number]);
    assert.deepEqual(T1.encode({ a: new Date(0) }), { a: 0 });
    assert.deepEqual(T1.encode(1), 1);
    const T2 = t.union([t.Number, DateFromNumber]);
    assert.deepEqual(T2.encode(new Date(0)), 0);
  });

  it('should throw when encoding an invalid input', () => {
    // $FlowExpectError
    assert.throws(() => DateFromNumOrStr2.encode(true));
  });

  it('should return the same reference when serializing', () => {
    const T = t.union([t.exactAll({ a: t.Number }), t.String]);
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T1 = t.union([t.String, t.Number]);
    assert.strictEqual(T1.is(0), true);
    assert.strictEqual(T1.is('foo'), true);
    assert.strictEqual(T1.is(true), false);
    const T2 = t.union([t.String, DateFromNumber]);
    assert.strictEqual(T2.is(new Date(0)), true);
    assert.strictEqual(T2.is('foo'), true);
    assert.strictEqual(T2.is(true), false);
  });

  it('should assign a default name', () => {
    const T1 = t.union([t.String, t.Number]);
    assert.strictEqual(T1.name, '(string | number)');
    const T2 = t.union([t.String, t.Number], 'T2');
    assert.strictEqual(T2.name, 'T2');
  });
});

describe('unionMap', () => {
  it('should succeed validating a valid value', () => {
    const T = t.unionMap({ string: t.String, number: t.Number }, v => typeof v);
    assertSuccess(T.decode('s'));
    assertSuccess(T.decode(1));
  });

  it('should return the same reference if validation succeeded', () => {
    const Add = t.exactAll({ op: t.literal('Add'), value: t.Number });
    const Subtract = t.exactAll({ op: t.literal('Subtract'), value: t.Number });
    const T = t.unionMap({ Add, Subtract }, 'op');
    const value = { op: 'Add', value: 2 };
    assertStrictEqual(T.decode(value), value);
  });

  it('should fail validating an invalid value', () => {
    const Add = t.exactAll({ op: t.literal<'Add'>('Add'), value: t.Number });
    const Subtract = t.exactAll({ op: t.literal<'Subtract'>('Subtract'), value: t.Number });
    const T = t.unionMap({ Add, Subtract }, 'op');
    const value = { op: 'Add', value: '2' };
    const value2 = { op: 'Multiply', value: '3' };
    assertFailure(T.decode(value), [
      'Invalid value "2" supplied to : ({| op: "Add", value: number |} | {| op: "Subtract", value: number |})/value: number'
    ]);
    assertFailure(T.decode(value2), [
      'Invalid value {"op":"Multiply","value":"3"} supplied to : ({| op: "Add", value: number |} | {| op: "Subtract", value: number |})'
    ]);
    assertFailure(T.decode(3), [
      'Invalid value 3 supplied to : ({| op: "Add", value: number |} | {| op: "Subtract", value: number |})'
    ]);
  });

  it('should serialize a deserialized', () => {
    const Add = t.exactAll({ op: t.literal<'Add'>('Add'), value: DateFromNumber });
    const Subtract = t.exactAll({ op: t.literal<'Subtract'>('Subtract'), value: t.Number });
    const T = t.unionMap({ Add, Subtract }, 'op');
    assert.deepEqual(T.encode({ op: 'Add', value: new Date(0) }), { op: 'Add', value: 0 });
    assert.deepEqual(T.encode({ op: 'Subtract', value: 1 }), { op: 'Subtract', value: 1 });
  });

  it('should return the same reference when serializing', () => {
    const T = t.unionMap({ string: t.String, number: t.Number }, v => typeof v);
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T1 = t.unionMap({ string: t.String, number: t.Number }, v => typeof v);
    assert.strictEqual(T1.is(0), true);
    assert.strictEqual(T1.is('foo'), true);
    assert.strictEqual(T1.is(true), false);

    const Add = t.exactAll({ op: t.literal<'Add'>('Add'), value: DateFromNumber });
    const Subtract = t.exactAll({ op: t.literal<'Subtract'>('Subtract'), value: t.Number });
    const T2 = t.unionMap({ Add, Subtract }, 'op');
    assert.strictEqual(T2.is({ op: 'Add', value: new Date() }), true);
    assert.strictEqual(T2.is({ op: 'Subtract', value: 1 }), true);
    assert.strictEqual(T2.is({ op: 'Add', value: 1 }), false);
  });

  it('should assign a default name', () => {
    const map = { string: t.String, number: t.Number };
    const T1 = t.unionMap<typeof map>(map, v => typeof v);
    assert.strictEqual(T1.name, '(string | number)');
    const T2 = t.unionMap<typeof map>(map, v => typeof v, 'T2');
    assert.strictEqual(T2.name, 'T2');
  });

  it('should throw on complex serializations with invalid inputs', () => {
    // $FlowExpectError
    assert.throws(() => DateFromNumOrStr.encode(true));
  });
});
