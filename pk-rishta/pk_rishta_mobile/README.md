# Hum Rishta Mobile (Flutter + Riverpod)

Flutter app for Hum Rishta (humrishta.com), connected to the Node backend with the same core features as the Angular web app.

## Run

1. Start backend: `cd pk-rishta-backend && npm start` (port 3000)
2. Start app:
   ```bash
   cd pk_rishta_mobile
   flutter pub get
   flutter run
   ```

### API URL
- Android emulator: `http://10.0.2.2:3000/api`
- Windows / iOS simulator: `http://localhost:3000/api`
- Custom: `flutter run --dart-define=API_BASE_URL=http://YOUR_IP:3000/api`

## Architecture

```
lib/
  core/           # theme, router, network, shared widgets
  data/           # models + repositories (API layer)
  features/       # UI screens by feature
  app.dart        # MaterialApp + bootstrap
  main.dart       # entry + ProviderScope
```

**State management:** Riverpod (`authProvider`, repository providers, `FutureProvider` for lists)

## Implemented features

| Feature | Status |
|--------|--------|
| Login / Register | ✅ |
| Home (hero, stats, recent profiles, profile gate) | ✅ |
| Search + Matching profiles | ✅ |
| Profile detail + contact request | ✅ |
| My Profile (4-step tabs, photo upload) | ✅ (simplified fields) |
| Activity (sent/received requests, complaints) | ✅ |
| Notifications bell | ✅ |
| Blog, About, Contact, Privacy, Terms | ✅ |
| Admin dashboard + contact request review | ✅ (basic) |
| Profile blur/lock for incomplete users | ✅ |
| Incoming requests lock until profile complete | ✅ |

## Next steps (optional)

- Full my-profile parity with web (all dropdowns, partner multi-select)
- Full admin screens (users, profiles CRUD, dropdowns, complaints thread)
- Push notifications (FCM)
