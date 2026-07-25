# CoachX Mobile

Flutter application for the CoachX Enterprise Platform.

## Phase 1 status

This is the **project foundation only** — no business screens are
implemented yet. `lib/app/widgets/bootstrap_status_view.dart` is a
diagnostic screen confirming the app builds, themes, and can reach the
backend `/health` endpoint; it is replaced by real feature screens as
they are implemented.

## Structure

```
lib/
├── app/
│   ├── app.dart                 # Root MaterialApp (theme + routing)
│   └── widgets/                 # Foundation-only diagnostic widgets
├── core/
│   ├── config/env_config.dart   # Compile-time configuration (--dart-define)
│   ├── network/                 # ApiClient + shared network types
│   ├── routing/app_router.dart  # Named-route table
│   └── theme/app_theme.dart     # Material 3 theme
└── main.dart
```

## Running locally

```bash
flutter pub get
flutter run --dart-define-from-file=env/dev.json
```

Copy `env/dev.json.example` to `env/dev.json` first (git-ignored).
`API_BASE_URL` defaults to `http://10.0.2.2:4000/api/v1`, the special
alias the Android emulator uses to reach `localhost` on the host machine.
On iOS simulator or a physical device, override it with your machine's
LAN IP.

## Testing

```bash
flutter test
```
