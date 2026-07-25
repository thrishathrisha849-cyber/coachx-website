import 'package:flutter/material.dart';

import '../../core/config/env_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/health_check.dart';

/// Foundation-only bootstrap view. Confirms the app builds, themes, and
/// can reach the backend health endpoint. Replaced by real feature
/// screens once the corresponding business modules are implemented.
class BootstrapStatusView extends StatefulWidget {
  const BootstrapStatusView({super.key});

  @override
  State<BootstrapStatusView> createState() => _BootstrapStatusViewState();
}

class _BootstrapStatusViewState extends State<BootstrapStatusView> {
  final ApiClient _apiClient = ApiClient();

  late final Future<HealthCheckResult> _healthFuture;

  @override
  void initState() {
    super.initState();
    _healthFuture = fetchHealth(_apiClient);
  }

  @override
  void dispose() {
    _apiClient.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text(EnvConfig.appName)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'CoachX Mobile Foundation',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Phase 1 project scaffold — no business screens yet.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FutureBuilder<HealthCheckResult>(
                future: _healthFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const CircularProgressIndicator();
                  }
                  if (snapshot.hasError) {
                    return Text(
                      'Backend unreachable: ${snapshot.error}',
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                      textAlign: TextAlign.center,
                    );
                  }
                  final health = snapshot.data!;
                  return Column(
                    children: [
                      Text('Status: ${health.status}'),
                      Text('Service: ${health.service}'),
                      Text('Environment: ${health.environment}'),
                      Text('Uptime: ${health.uptimeSeconds}s'),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
