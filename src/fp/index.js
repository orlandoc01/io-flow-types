//@flow

export type Either<L, A> = Left<L> | Right<A>;

class Left<L> {
  +tag: 'Left';
  +value: L;
  constructor(v: L) {
    this.value = v;
    this.tag = 'Left';
  }
  map<A, B>(__: (a: A) => B): Either<L, B> {
    return (this: any);
  }
  mapLeft<A, M>(f: (l: L) => M): Either<M, A> {
    return new Left(f(this.value));
  }
  getOrElse<A>(a: A): A {
    return a;
  }
  inspect(): string {
    return this.toString();
  }
  toString(): string {
    return `left(${toString(this.value)})`;
  }
  fold<A, B>(whenLeft: (l: L) => B, whenRight: (a: A) => B): B {
    return whenLeft(this.value);
  }
  ap<A, B>(fab: Either<L, (a: A) => B>): Either<L, B> {
    return ((isLeft(fab) ? fab : this): any);
  }
  chain<A, B>(f: (a: A) => Either<L, B>): Either<L, B> {
    return (this: any);
  }
  isRight() {
    return false;
  }
  isLeft() {
    return true;
  }
}

class Right<A> {
  +tag: 'Right';
  +value: A;
  constructor(v: A) {
    this.value = v;
    this.tag = 'Right';
  }
  map<L, B>(f: (a: A) => B): Either<L, B> {
    return new Right(f(this.value));
  }
  mapLeft<L, M>(_: (l: L) => M): Either<M, A> {
    return new Right(this.value);
  }
  getOrElse(_: A): A {
    return this.value;
  }
  inspect(): string {
    return this.toString();
  }
  toString(): string {
    return `right(${toString(this.value)})`;
  }
  fold<B, L>(whenLeft: (l: L) => B, whenRight: (a: A) => B): B {
    return whenRight(this.value);
  }
  ap<B, L>(fab: Either<L, (a: A) => B>): Either<L, B> {
    return isRight(fab) ? this.map(fab.value) : makeLeft(fab.value);
  }
  chain<B, L>(f: (a: A) => Either<L, B>): Either<L, B> {
    return f(this.value);
  }
  isRight() {
    return true;
  }
  isLeft() {
    return false;
  }
}

export function isLeft(v: mixed): boolean %checks {
  return v instanceof Left;
}
export function isRight(v: mixed): boolean %checks {
  return v instanceof Right;
}
const makeLeft = <L, A>(v: L): Either<L, A> => new Left(v);
const makeRight = <L, A>(v: A): Either<L, A> => new Right(v);

export { makeLeft as Left, makeRight as Right };

function toString(x: mixed): string {
  if (typeof x === 'string') {
    return JSON.stringify(x);
  }
  if (x instanceof Date) {
    return `new Date('${x.toISOString()}')`;
  }
  if (Array.isArray(x)) {
    return `[${x.map(toString).join(', ')}]`;
  }
  if (x == null) {
    return String(x);
  }
  if (typeof x.toString === 'function' && x.toString !== Object.prototype.toString) {
    return x.toString();
  }
  return JSON.stringify(x, null);
}
