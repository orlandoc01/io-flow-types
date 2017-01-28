//@flow
import * as assert from 'assert';
import { isLeft, isRight, Left as left, Right as right } from '../src/index.js';

describe('Either', () => {
  it('fold', () => {
    const f = (s: string) => `left${s.length}`;
    const g = (s: string) => `right${s.length}`;
    assert.strictEqual(left<string, string>('abc').fold(f, g), 'left3');
    assert.strictEqual(right<string, string>('abc').fold(f, g), 'right3');
  });

  it('map', () => {
    const f = (s: string): number => s.length;
    assert.deepEqual(right('abc').map(f), right(3));
    assert.deepEqual(left<string, string>('s').map(f), left('s'));
    assert.deepEqual(right('abc').map(f), right(3));
    assert.deepEqual(left<string, string>('s').map(f), left('s'));
  });

  it('mapLeft', () => {
    const f = (s: string): number => s.length;
    assert.deepEqual(left('abc').mapLeft(f), left(3));
    assert.deepEqual(right<string, string>('s').mapLeft(f), right('s'));
    assert.deepEqual(left('abc').mapLeft(f), left(3));
    assert.deepEqual(right<string, string>('s').mapLeft(f), right('s'));
  });

  it('ap', () => {
    const f = (s: string): number => s.length;
    assert.deepEqual(right<string, string>('abc').ap(right<string, (s: string) => number>(f)), right(3));
    assert.deepEqual(left<string, string>('a').ap(right<string, (s: string) => number>(f)), left<string, number>('a'));
    assert.deepEqual(
      right<string, string>('abc').ap(left<string, (s: string) => number>('a')),
      left<string, number>('a')
    );
    assert.deepEqual(left<string, string>('b').ap(left<string, (s: string) => number>('a')), left<string, number>('a'));
  });

  it('chain', () => {
    const f = (s: string) => right<string, number>(s.length);
    assert.deepEqual(right<string, string>('abc').chain(f), right(3));
    assert.deepEqual(left<string, string>('a').chain(f), left('a'));
    assert.deepEqual(right<string, string>('abc').chain(f), right(3));
  });

  it('getOrElse', () => {
    assert.equal(right(12).getOrElse(17), 12);
    assert.equal(left(12).getOrElse(17), 17);
  });

  it('isLeft', () => {
    assert.strictEqual(right(1).isLeft(), false);
    assert.strictEqual(left(1).isLeft(), true);
    assert.strictEqual(isLeft(right(1)), false);
    assert.strictEqual(isLeft(left(1)), true);
  });

  it('isRight', () => {
    assert.strictEqual(right(1).isRight(), true);
    assert.strictEqual(left(1).isRight(), false);
    assert.strictEqual(isRight(right(1)), true);
    assert.strictEqual(isRight(left(1)), false);
  });

  it('toString', () => {
    assert.strictEqual(right('bar').toString(), 'right("bar")');
    assert.strictEqual(right('bar').inspect(), 'right("bar")');
    assert.strictEqual(left('bar').toString(), 'left("bar")');
    assert.strictEqual(left('bar').inspect(), 'left("bar")');
    assert.strictEqual(left(true).inspect(), 'left(true)');
    assert.strictEqual(left(1).inspect(), 'left(1)');
    assert.strictEqual(left({ a: 1 }).inspect(), 'left({"a":1})');
    assert.strictEqual(left(new Date(0)).inspect(), "left(new Date('1970-01-01T00:00:00.000Z'))");
    assert.strictEqual(left([1, 2, 3]).inspect(), 'left([1, 2, 3])');
    assert.strictEqual(left(null).inspect(), 'left(null)');
    assert.strictEqual(left(() => {}).inspect(), 'left(function () {})');
  });
});
