//@flow
import * as assert from 'assert';
import * as t from '../src';
import { ThrowReporter } from '../src/ThrowReporter';

describe('ThrowReporter', () => {
  it('should use the function name as error message', () => {
    const isErr = err => {
      assert.deepEqual(err, ['Invalid value <function 0> supplied to : number']);
      return true;
    };
    assert.throws(() => ThrowReporter.report(t.Number.decode(() => {})), isErr);
  });

  it('should return void whene there are no errors', () => {
    assert.deepEqual(ThrowReporter.report(t.Number.decode(1)), undefined);
  });
});
