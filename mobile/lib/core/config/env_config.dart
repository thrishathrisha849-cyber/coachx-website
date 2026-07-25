/// Central runtime configuration for the CoachX mobile app.
///
/// Values are compile-time constants provided via `--dart-define` so the
/// same codebase can target dev/staging/production without checking in
/// secrets. Nothing outside this file should read `String.fromEnvironment`
/// directly.
class EnvConfig {
  const EnvConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );

  static const String appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'CoachX',
  );

  static const bool isProduction = bool.fromEnvironment('dart.vm.product');
}
