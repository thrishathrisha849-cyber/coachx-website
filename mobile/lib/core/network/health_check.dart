import 'api_client.dart';

/// Result shape mirrors the backend's `HealthCheckResult` type in
/// `shared/src/types/environment.type.ts`, kept in sync manually until a
/// generated-client pipeline exists.
class HealthCheckResult {
  const HealthCheckResult({
    required this.status,
    required this.service,
    required this.version,
    required this.environment,
    required this.uptimeSeconds,
  });

  factory HealthCheckResult.fromJson(Map<String, dynamic> json) {
    return HealthCheckResult(
      status: json['status'] as String,
      service: json['service'] as String,
      version: json['version'] as String,
      environment: json['environment'] as String,
      uptimeSeconds: json['uptimeSeconds'] as int,
    );
  }

  final String status;
  final String service;
  final String version;
  final String environment;
  final int uptimeSeconds;
}

/// Foundation-only helper confirming the mobile app can reach the backend
/// health endpoint. Not a business feature — used by the bootstrap screen.
Future<HealthCheckResult> fetchHealth(ApiClient client) async {
  final response = await client.get('/health');
  return HealthCheckResult.fromJson(response['data'] as Map<String, dynamic>);
}
