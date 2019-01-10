//@flow
import * as assert from 'assert';
import * as t from '../src/index';
import { assertSuccess, assertFailure, DateFromNumber } from './helpers';

describe('readonly', () => {
  it('should succeed validating a valid value', () => {
    const T = t.exactAll({ a: t.Number }).readOnly();
    assertSuccess(T.decode({ a: 1 }));
  });

  it('should fail validating an invalid value', () => {
    const T = t.exactAll({ a: t.Number }).readOnly();
    assertFailure(T.decode({}), ['Invalid value undefined supplied to : {| +a: number |}/a: number']);
  });

  it('should freeze the value', () => {
    const T = t.exactAll({ a: t.Number }).readOnly();
    T.decode({ a: 1 }).map(x => assert.ok(Object.isFrozen(x)));
  });

  it('should not freeze in production', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const T = t.exactAll({ a: t.Number }).readOnly();
    T.decode({ a: 1 }).map(x => assert.ok(!Object.isFrozen(x)));
    process.env.NODE_ENV = env;
  });

  it('should serialize a deserialized', () => {
    const T = t.exactAll({ a: DateFromNumber }).readOnly();
    assert.deepEqual(T.encode({ a: new Date(0) }), { a: 0 });
  });

  it('should return the same reference when serializing', () => {
    const T = t.exactAll({ a: t.Number }).readOnly();
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T1 = t.exactAll({ a: t.Number }).readOnly();
    assert.strictEqual(T1.is({ a: 1 }), true);
    assert.strictEqual(T1.is({ a: 'foo' }), false);
    assert.strictEqual(T1.is(undefined), false);
    const T2 = t.exactAll({ a: DateFromNumber }).readOnly();
    assert.strictEqual(T2.is({ a: new Date(0) }), true);
    assert.strictEqual(T2.is({ a: 0 }), false);
    assert.strictEqual(T2.is(undefined), false);
  });

  it('should assign a default name', () => {
    const T1 = t.exactAll({ a: t.Number }).readOnly();
    assert.strictEqual(T1.name, '{| +a: number |}');
    const T2 = t.exactAll({ a: t.Number }).readOnly('T2');
    assert.strictEqual(T2.name, 'T2');
  });
});
