import 'package:flutter/material.dart';

import '../../app/widgets/bootstrap_status_view.dart';
import '../../app/widgets/not_found_view.dart';

/// Named-route table for the app. Feature routes are registered here in
/// later implementation phases — Phase 1 wires only the bootstrap route.
class AppRouter {
  const AppRouter._();

  static const String bootstrap = '/';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case bootstrap:
        return MaterialPageRoute(builder: (_) => const BootstrapStatusView());
      default:
        return MaterialPageRoute(builder: (_) => const NotFoundView());
    }
  }
}
