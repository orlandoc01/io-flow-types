//@flow
import * as assert from 'assert';
import * as t from '../src/index';
import { assertSuccess, assertFailure } from './helpers';
import { failure } from '../src/PathReporter';

const BAA = new t.Type<number, string, string>(
  'BAA',
  t.Number.is,
  (s, c) => {
    const n = parseFloat(s);
    return isNaN(n) ? t.failure(s, c) : t.success(n);
  },
  n => String(n)
);
const nonEmptyString = new t.Type<string, string, string>('BAA', v => typeof v === 'string' && v.length > 0);

const BAI = t.String.pipe(
  BAA,
  'T'
);

describe('Type', () => {
  describe('decodeAsync', () => {
    it('should resolve correct values', () => {
      const str: mixed = '1';
      return Promise.resolve(str)
        .then(BAI.decodeAsync.bind(BAI))
        .then(v => assert.strictEqual(v, 1));
    });

    it('should reject incorrect value', () => {
      const str: mixed = 1;
      return Promise.resolve(str)
        .then(BAI.decodeAsync.bind(BAI))
        .catch(err => {
          assert.deepEqual(failure(err), ['Invalid value 1 supplied to : T']);
        });
    });
  });

  describe('pipe', () => {
    it('should assign a default name', () => {
      const AOI = t.String;
      const T = AOI.pipe(BAA);
      assert.strictEqual(T.name, 'pipe(string, BAA)');
    });

    it('should combine two types', () => {
      assertSuccess(BAI.decode('1'));
      assertFailure(BAI.decode(1), ['Invalid value 1 supplied to : T']);
      assertFailure(BAI.decode('a'), ['Invalid value "a" supplied to : T']);
      assert.strictEqual(BAI.encode(2), '2');
    });

    it('should use identity as decoder function', () => {
      assert.strictEqual(t.String.pipe(nonEmptyString).encode, t.identity);
    });
  });

  describe('asDecoder', () => {
    it('should return a decoder', () => {
      assertSuccess(t.String.asDecoder().decode('1'));
    });
  });

  describe('asEncoder', () => {
    it('should return an encoder', () => {
      assert.strictEqual(BAI.asEncoder().encode(2), '2');
    });
  });
});

describe('getContextEntry', () => {
  it('should return a ContextEntry', () => {
    assert.deepEqual(t.getContextEntry('key', t.String), { key: 'key', type: t.String });
  });
});
