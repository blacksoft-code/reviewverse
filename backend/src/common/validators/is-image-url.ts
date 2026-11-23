import {
  isURL,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// logo / cover photo-র মতো ছবির URL যাচাই।
//
// আপলোড করা ছবির URL এখন host ছাড়া "/uploads/..." আকারে আসে
// (ফোন/অন্য device-এও যেন কাজ করে), তাই শুধু @IsUrl() দিলে সেটা
// "must be a URL address" বলে আটকে যায়। এখানে দুটোই গ্রহণযোগ্য:
//   - /uploads/... path
//   - পুরো http(s) URL (আগের মতো)
export function IsImageUrl(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isImageUrl',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a URL address or an /uploads/ path`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;

          return (
            /^\/uploads\/\S+$/.test(value) ||
            isURL(value, { require_tld: false })
          );
        },
      },
    });
  };
}
