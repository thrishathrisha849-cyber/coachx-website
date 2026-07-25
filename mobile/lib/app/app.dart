import 'package:flutter/material.dart';

import '../core/config/env_config.dart';
import '../core/routing/app_router.dart';
import '../core/theme/app_theme.dart';

/// Root application widget. Mirrors the same shell responsibility as
/// `frontend/src/App.tsx` and `admin/src/App.tsx` — theming + routing,
/// no business logic.
class CoachXApp extends StatelessWidget {
  const CoachXApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: EnvConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      initialRoute: AppRouter.bootstrap,
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
