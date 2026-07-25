import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/env_config.dart';

/// Thrown for any non-2xx API response, carrying the backend's normalized
/// error envelope (`{ success: false, error: { code, message } }`).
class ApiException implements Exception {
  ApiException(this.statusCode, this.code, this.message);

  final int statusCode;
  final String code;
  final String message;

  @override
  String toString() => 'ApiException($statusCode, $code): $message';
}

/// Thin, dependency-free wrapper around `package:http` shared by every
/// future feature module. Auth-token attachment and refresh-token retry
/// logic belong to the authentication feature and are added in a later
/// implementation phase.
class ApiClient {
  ApiClient({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? EnvConfig.apiBaseUrl;

  final http.Client _client;
  final String _baseUrl;

  Uri _resolve(String path) => Uri.parse('$_baseUrl$path');

  Future<Map<String, dynamic>> get(String path) async {
    final response = await _client.get(
      _resolve(path),
      headers: const {'Content-Type': 'application/json'},
    );
    return _handle(response);
  }

  Map<String, dynamic> _handle(http.Response response) {
    final Map<String, dynamic> body =
        response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    final error = body['error'] as Map<String, dynamic>?;
    throw ApiException(
      response.statusCode,
      error?['code'] as String? ?? 'UNKNOWN_ERROR',
      error?['message'] as String? ?? 'An unexpected error occurred',
    );
  }

  void dispose() => _client.close();
}
