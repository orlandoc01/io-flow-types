//@flow
import * as assert from 'assert';
import * as t from '../../src/index';
import { assertSuccess, assertFailure } from '../helpers';
import Bluebird from 'bluebird';

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
  describe('decodeThrows', () => {
    it('should throw and use the function name as error message', () => {
      const isErr = err => {
        assert.ok(err instanceof t.AggregateError);
        assert.deepEqual(err.messages(), ['Invalid value null supplied to : number']);
        return true;
      };
      assert.throws(() => t.Number.decodeThrows(null), isErr);
    });

    it('should return value whene there are no errors', () => {
      assert.deepEqual(t.Number.decodeThrows(1), 1);
    });
  });

  describe('decodeAsync', () => {
    it('should resolve correct values', () => {
      const str: mixed = '1';
      return Promise.resolve(str)
        .then(BAI.decodeAsync.bind(BAI))
        .then(v => assert.strictEqual(v, 1));
    });

    it('should reject incorrect value', () => {
      const str: mixed = 1;
      return Bluebird.resolve(str)
        .then(BAI.decodeAsync.bind(BAI))
        .then(() => assert.ok(false, 'should not resolve'))
        .catch(err => {
          assert.ok(err instanceof t.AggregateError);
          assert.deepEqual(err.messages(), ['Invalid value 1 supplied to : T']);
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
