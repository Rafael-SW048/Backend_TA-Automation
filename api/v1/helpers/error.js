class ServerError extends Error {
  constructor(message) {
    super(message);
    this.name = "ServerError";
  }
}

class OperationError extends Error {
  constructor(message) {
    super(message);
    this.name = "OperationError";
  }
}

class MissingKeyError extends Error {
  constructor(key) {
    super(`Missing key: ${key}`);
    this.name = "MissingKeyError";
    this.key = key;
  }
}

class InvalidTypeError extends Error {
  constructor(key, expectedType, actualType) {
    super(`Invalid type for key: ${key}, expected ${expectedType}, got ${actualType}`);
    this.name = "InvalidTypeError";
    this.key = key;
    this.expectedType = expectedType;
    this.actualType = actualType;
  }
}

class ValueRestrictionError extends Error {
  constructor(key, expectedValue, actualValue) {
    super(`Invalid value for key: ${key}, expected ${expectedValue}, got ${actualValue}`);
    this.name = "ValueRestrictionError";
    this.key = key;
    this.expectedValue = expectedValue;
    this.actualValue = actualValue;
  }
}

module.exports = {
  ServerError,
  OperationError,
  MissingKeyError,
  InvalidTypeError,
  ValueRestrictionError
};
