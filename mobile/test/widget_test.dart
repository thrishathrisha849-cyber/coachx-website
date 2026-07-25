// Foundation smoke test: confirms the app shell builds, themes, and
// routes to the bootstrap view without crashing. Deliberately does not
// assert on the health-check network call's outcome (loading vs. error
// vs. data) — Flutter's test binding intercepts all HttpClient traffic
// and returns it synchronously, so the exact FutureBuilder state at any
// given pump is an implementation detail, not something this smoke test
// should depend on. Real backend connectivity is exercised by an
// integration test in a later phase.

import 'package:flutter_test/flutter_test.dart';

import 'package:coachx_mobile/app/app.dart';

void main() {
  testWidgets('CoachXApp renders the bootstrap view', (WidgetTester tester) async {
    await tester.pumpWidget(const CoachXApp());
    await tester.pump();

    expect(find.text('CoachX Mobile Foundation'), findsOneWidget);
    expect(
      find.text('Phase 1 project scaffold — no business screens yet.'),
      findsOneWidget,
    );
  });
}
