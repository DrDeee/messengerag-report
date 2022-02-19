import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsStringOrNull(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrNull',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'undefined' || typeof value === 'string';
        },
        defaultMessage(args: ValidationArguments) {
          return args.property + ' must be either a string or undefined';
        },
      },
    });
  };
}

export function IsInOrNull(
  enumValues: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isInOrNull',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            typeof value === 'undefined' ||
            (typeof value === 'string' && enumValues.includes(value))
          );
        },
        defaultMessage(args: ValidationArguments) {
          return (
            args.property + ' must be either in ' + enumValues + ' or undefined'
          );
        },
      },
    });
  };
}
