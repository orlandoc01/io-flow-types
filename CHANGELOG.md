# Changelog

**Note**: Gaps between patch versions are faulty/broken releases. **Note**: A feature tagged as Experimental is in a
high state of flux, you're at risk of it changing without notice.

## 0.2.0 (fc80726)
### Added
- Add new `ValidationError` class with default error message using `PathReporter` logic
- Add new `AggregateError` class for error handling multiple `ValidationError` instances
### Changed
- `Validation<A>` is now `Either<AggregateError, A>`
    * `AggregateError` is subclass of `Array<ValidationError>`, so should be backwards compatible
- Add `assert` method on `Type` class
- Add `getAssert` method on `Type` class
- `toString` will now render the name for function or a default string with its arity
- Restructured tests directory
### Removed
- remove `PathReporter` - `ValidationError` message uses path logic for message
- remove `ThrowReporter` - added `assert` method mimicks the logic
- remove `getFunctionName` export
- remove `getContextEntry` export
- remove `getValidationError` export

## 0.1.3
### Fixed
- Patches type error emerging after 0.95.1 for toString

## 0.1.2
### Fixed
- Patches flow-bin peer dependency range to avoid JSON.stringify conflict in 0.95.0 release of flow


## 0.1.1
Initial release
