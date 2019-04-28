//@flow
import * as assert from 'assert';
import * as t from '../../src/index';
import { assertSuccess, assertFailure } from '../helpers';

describe('Dictionary', () => {
  it('should properly typecheck values', () => {
    const T = t.Dictionary;
    const a: t.TypeOf<typeof T> = {};
    const b: t.OutputOf<typeof T> = {};
    // $FlowExpectError
    const c: t.TypeOf<typeof T> = [];
    // $FlowExpectError
    const d: t.OutputOf<typeof T> = true;
  });

  it('should succeed validating a valid value', () => {
    const T = t.Dictionary;
    assertSuccess(T.decode({}));
    // assertSuccess(T.decode([]));
    // assertSuccess(T.decode([1]));
    // assertSuccess(T.decode(new Number()));
    // assertSuccess(T.decode(new Date()));
  });

  it('should fail validating an invalid value', () => {
    const T = t.Dictionary;
    assertFailure(T.decode('s'), ['Invalid value "s" supplied to : Dictionary']);
    assertFailure(T.decode(1), ['Invalid value 1 supplied to : Dictionary']);
    assertFailure(T.decode(true), ['Invalid value true supplied to : Dictionary']);
    assertFailure(T.decode(null), ['Invalid value null supplied to : Dictionary']);
    assertFailure(T.decode(undefined), ['Invalid value undefined supplied to : Dictionary']);
  });
});

describe('Integer', () => {
  it('should properly typecheck values', () => {
    // $FlowExpectError
    const a: t.TypeOf<typeof t.Integer> = 1.5;
    // $FlowExpectError
    const b: t.TypeOf<typeof t.Integer> = 1;
    const validC = t.Integer.decode(1);
    if (validC.tag === 'Right') {
      const c: t.TypeOf<typeof t.Integer> = validC.value;
    }
  });

  it('should validate integers', () => {
    assertSuccess(t.Integer.decode(1));
    assertFailure(t.Integer.decode(0.5), ['Invalid value 0.5 supplied to : Integer']);
    assertFailure(t.Integer.decode('foo'), ['Invalid value "foo" supplied to : Integer']);
  });
});

describe('null', () => {
  it('should properly typecheck values', () => {
    const T = t.Null;
    const a: t.TypeOf<typeof T> = null;
    const b: t.OutputOf<typeof T> = null;
    // $FlowExpectError
    const c: t.TypeOf<typeof T> = [];
    // $FlowExpectError
    const d: t.OutputOf<typeof T> = true;
  });
  it('should support the alias `nullType`', () => {
    assertSuccess(t.Null.decode(null));
    assertFailure(t.Null.decode(1), ['Invalid value 1 supplied to : null']);
  });
});

describe('void', () => {
  it('should properly typecheck values', () => {
    const T = t.Void;
    const a: t.TypeOf<typeof T> = undefined;
    const b: t.TypeOf<typeof T> = void 0;
    const c: t.OutputOf<typeof T> = undefined;
    // $FlowExpectError
    const d: t.TypeOf<typeof T> = [];
    // $FlowExpectError
    const e: t.OutputOf<typeof T> = true;
  });
  it('should support the alias `voidType`', () => {
    assertSuccess(t.Void.decode(undefined));
    assertFailure(t.Void.decode(1), ['Invalid value 1 supplied to : void']);
  });
});

describe('object', () => {
  it('should properly typecheck values', () => {
    const T = t.object;
    const a: t.TypeOf<typeof T> = {};
    const b: t.OutputOf<typeof T> = {};
  });

  it('should decode arrays', () => {
    assertSuccess(t.object.decode([]));
  });

  it('should decode objects', () => {
    assertSuccess(t.object.decode({}));
  });

  it('should fail with primitives', () => {
    const T = t.object;
    assertFailure(T.decode('s'), ['Invalid value "s" supplied to : Object']);
    assertFailure(T.decode(1), ['Invalid value 1 supplied to : Object']);
    assertFailure(T.decode(true), ['Invalid value true supplied to : Object']);
  });

  it('should fail with null and undefined', () => {
    const T = t.object;
    assertFailure(T.decode(null), ['Invalid value null supplied to : Object']);
    assertFailure(T.decode(undefined), ['Invalid value undefined supplied to : Object']);
  });
});

describe('any', () => {
  it('should properly typecheck values', () => {
    const T = t.Any;
    const a: t.TypeOf<typeof T> = 1;
    const b: t.OutputOf<typeof T> = [];
  });

  it('should decode any value', () => {
    assertSuccess(t.Any.decode(null));
    assertSuccess(t.Any.decode(undefined));
    assertSuccess(t.Any.decode('foo'));
    assertSuccess(t.Any.decode(1));
    assertSuccess(t.Any.decode(true));
    assertSuccess(t.Any.decode(t.identity));
    assertSuccess(t.Any.decode({}));
    assertSuccess(t.Any.decode([]));
    assertSuccess(t.Any.decode(/a/));
  });

  it('should accept any value', () => {
    assert.ok(t.Any.is(null));
    assert.ok(t.Any.is(undefined));
    assert.ok(t.Any.is('foo'));
    assert.ok(t.Any.is(1));
    assert.ok(t.Any.is(true));
    assert.ok(t.Any.is(t.identity));
    assert.ok(t.Any.is({}));
    assert.ok(t.Any.is([]));
    assert.ok(t.Any.is(/a/));
  });
});

describe('never', () => {
  it('should properly typecheck values', () => {
    const T = t.Never;
    // $FlowExpectError
    const a: t.TypeOf<typeof T> = 1;
    // $FlowExpectError
    const b: t.OutputOf<typeof T> = [];
  });
  it('should not decode any value', () => {
    assertFailure(t.Never.decode(null), ['Invalid value null supplied to : never']);
    assertFailure(t.Never.decode(undefined), ['Invalid value undefined supplied to : never']);
    assertFailure(t.Never.decode('foo'), ['Invalid value "foo" supplied to : never']);
    assertFailure(t.Never.decode(1), ['Invalid value 1 supplied to : never']);
    assertFailure(t.Never.decode(true), ['Invalid value true supplied to : never']);
    assertFailure(t.Never.decode(t.identity), ['Invalid value <function identity> supplied to : never']);
    assertFailure(t.Never.decode({}), ['Invalid value {} supplied to : never']);
    assertFailure(t.Never.decode([]), ['Invalid value [] supplied to : never']);
    assertFailure(t.Never.decode(/a/), ['Invalid value /a/ supplied to : never']);
  });

  it('should not accept any value', () => {
    assert.ok(!t.Never.is(null));
    assert.ok(!t.Never.is(undefined));
    assert.ok(!t.Never.is('foo'));
    assert.ok(!t.Never.is(1));
    assert.ok(!t.Never.is(true));
    assert.ok(!t.Never.is(t.identity));
    assert.ok(!t.Never.is({}));
    assert.ok(!t.Never.is([]));
    assert.ok(!t.Never.is(/a/));
  });

  it('should not encode any value', () => {
    // $FlowExpectError
    assert.throws(() => t.Never.encode('a'));
  });
});

describe('boolean', () => {
  it('should properly typecheck values', () => {
    const T = t.Boolean;
    const a: t.TypeOf<typeof T> = true;
    const b: t.OutputOf<typeof T> = true;
    // $FlowExpectError
    const c: t.TypeOf<typeof T> = 1;
    // $FlowExpectError
    const d: t.OutputOf<typeof T> = [];
  });
  it('should decode boolean values', () => {
    assertSuccess(t.Boolean.decode(true));
    assertSuccess(t.Boolean.decode(false));
  });

  it('should not decode non-boolean values', () => {
    assertFailure(t.Boolean.decode(1), ['Invalid value 1 supplied to : boolean']);
  });
});
