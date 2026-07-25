import 'package:flutter/material.dart';

/// Central theme definition. Real brand tokens (colors, type scale)
/// replace these generic placeholders when the design system is built.
class AppTheme {
  const AppTheme._();

  static const Color _seedColor = Color(0xFF1C68F5);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: _seedColor,
          brightness: Brightness.light,
        ),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: _seedColor,
          brightness: Brightness.dark,
        ),
      );
}
