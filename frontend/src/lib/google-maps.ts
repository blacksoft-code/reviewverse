// শুধু Google Maps-এর link গ্রহণযোগ্য — backend-এর GOOGLE_MAPS_URL_REGEX-এর
// সাথে হুবহু এক (google.com/maps, maps.google.com, maps.app.goo.gl, goo.gl/maps)
const GOOGLE_MAPS_URL_REGEX =
  /^https?:\/\/(?:(?:www\.|maps\.)?google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})\/maps|maps\.google\.(?:com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})(?:\/|\?|$)|maps\.app\.goo\.gl\/|goo\.gl\/maps(?:\/|\?|$))/i;

export function isGoogleMapsUrl(value: string) {
  return GOOGLE_MAPS_URL_REGEX.test(value.trim());
}
