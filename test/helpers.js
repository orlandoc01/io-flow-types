//@flow
import * as assert from 'assert';
import * as t from '../src/index';

export function assertSuccess<T>(validation: t.Validation<T>): void {
  assert.ok(validation.isRight());
}

export function assertFailure<T>(validation: t.Validation<T>, descriptions: Array<string>): void {
  assert.ok(validation.isLeft());
  if (validation.tag === 'Left') {
    assert.deepEqual(validation.value.messages(), descriptions);
  }
}

export function assertStrictEqual<T>(validation: t.Validation<T>, value: T): void {
  assert.strictEqual(validation.fold(t.identity, t.identity), value);
}

export function assertDeepEqual<T>(validation: t.Validation<T>, value: T): void {
  assert.deepEqual(validation.fold(t.identity, t.identity), value);
}

export const string2 = new t.Type<string, string>(
  'string2',
  v => typeof v === 'string' && v[1] === '-',
  (s, c) =>
    t.String.validate(s, c).chain(s => {
      if (s.length === 2) {
        return t.success(s[0] + '-' + s[1]);
      } else {
        return t.failure(s, c);
      }
    }),
  a => a[0] + a[2]
);

export const DateFromNumber = new t.Type<Date, number>(
  'DateFromNumber',
  v => v instanceof Date,
  (s, c) =>
    t.Number.validate(s, c).chain(n => {
      const d = new Date(n);
      return isNaN(d.getTime()) ? t.failure(n, c) : t.success(d);
    }),
  a => a.getTime()
);

export const NumberFromString = new t.Type<number, string, string>(
  'NumberFromString',
  t.Number.is,
  (s, c) => {
    const n = parseFloat(s);
    return isNaN(n) ? t.failure(s, c) : t.success(n);
  },
  String
);

export const IntegerFromString = t.refinement(NumberFromString, t.Integer.is, 'IntegerFromString');

export function withDefault<T: t.MixedFlowType>(
  type: T,
  defaultValue: t.TypeOf<T>
): t.Type<t.TypeOf<T>, t.OutputOf<T>, t.InputOf<T>> {
  return new t.Type(
    `withDefault(${type.name}, ${JSON.stringify(defaultValue)})`,
    type.is,
    (v, c) => type.validate(v != null ? v : defaultValue, c),
    type.encode
  );
}

const props = { number: t.Number, string: t.String };
export const NumberOrString = t.unionMap<typeof props>(props, v => typeof v);

const props2 = { string: t.String, number: DateFromNumber };
export const DateFromNumOrStr = t.unionMap<typeof props2>(props2, v => typeof v);
export const DateFromNumOrStr2 = t.union([t.Number, DateFromNumber]);
