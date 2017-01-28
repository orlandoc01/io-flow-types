//@flow
import * as assert from 'assert';
import * as t from '../src/index';
import { assertSuccess, assertFailure } from './helpers';

describe('literal', () => {
  it('should properly typecheck values', () => {
    const T = t.literal<'foo'>('foo');
    const a: t.TypeOf<typeof T> = 'foo';
    const b: t.OutputOf<typeof T> = 'foo';
    // $FlowExpectError
    const c: t.TypeOf<typeof T> = 'foo1';
    // $FlowExpectError
    const d: t.TypeOf<typeof T> = 1;
    // $FlowExpectError
    const e: t.OutputOf<typeof T> = 'foo1';
    // $FlowExpectError
    const f: t.OutputOf<typeof T> = 1;
  });

  it('should succeed validating a valid value', () => {
    const T = t.literal<'a'>('a');
    assertSuccess(T.decode('a'));
  });

  it('should fail validating an invalid value', () => {
    const T = t.literal<'a'>('a');
    assertFailure(T.decode(1), ['Invalid value 1 supplied to : "a"']);
  });

  it('should return the same reference when serializing', () => {
    const T = t.literal<'a'>('a');
    assert.strictEqual(T.encode, t.identity);
  });

  it('should type guard', () => {
    const T = t.literal<'a'>('a');
    assert.strictEqual(T.is('a'), true);
    assert.strictEqual(T.is('b'), false);
    assert.strictEqual(T.is(undefined), false);
  });

  it('should assign a default name', () => {
    const T1 = t.literal<'a'>('a');
    assert.strictEqual(T1.name, '"a"');
    const T2 = t.literal<'a'>('a', 'T2');
    assert.strictEqual(T2.name, 'T2');
  });
});
