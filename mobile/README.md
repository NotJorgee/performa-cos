# PerformaCOS — COS Employee App (Flutter)

A Flutter mobile app for **Android and iOS** for EVSU **Contract of Service (COS) Employees**. It connects to the Performa-COS FastAPI backend in `../backend` and recreates the COS Employee screens of the web portal (`../src`).

The app covers the COS Employee module only:
- Only COS Employee accounts can sign in. HR Personnel and Department Head accounts are told to use the main web portal.
- Only COS Employee invitations can be used to register.

## Screens

| Area | Screens |
| --- | --- |
| Access | Sign in, registration opened straight from the HRMDO invitation link (no token typing), forgot password → OTP code → new password |
| Dashboard | Contract countdown, today's attendance, today's DAR count, total DAR logs |
| Attendance & Leave | Live clock, geofenced clock in / clock out using the phone's GPS, leave filing with AI text suggestions, leave history |
| Attendance Logs | Daily records for the 1st or 2nd half of a month, CSV export through the share sheet |
| Daily Report (DAR) | Camera photo with GPS campus check, location badge stamped on the photo, SHA-256 fingerprint, upload |
| Monthly Report | Records for the 1st half, 2nd half or full month, photo viewer, printable PDF report with signature blocks |
| Contract Status | Contract term, renew or decline the contract (unlocks 30 days before expiry), status updates |
| Peer Evaluations | Assigned peer review board |
| Notifications | Notification center with search, filters, mark read or unread, dismiss; checked every 30 s; bell dropdown |
| Account Settings | Profile and photo (crop with pan and pinch zoom), contact details, password change, required notification settings, active sessions |

## Project layout

```
lib/
  main.dart                 app entry, sign-in flow, screen routing
  config.dart               backend API address (--dart-define / productionApiBaseUrl / platform default)
  theme.dart                PerformaCOS colors and Material theme
  services/api.dart         REST client for the COS Employee endpoints
  state/app_state.dart      session, navigation, notification checks, in-memory cache
  screens/                  one file per screen (auth/, dashboard, attendance, DAR, ...)
  widgets/                  app shell, shared UI parts, AI text field, avatar cropper
  utils/                    campus geofence, GPS, photo stamp, dates and names, departments, ID generator, invitation-link parser
assets/images/              EVSU seal and login background
tool/preview_server.mjs     browser preview server (serves build/web and forwards /api)
test/                       unit tests (geofence, ID generator, name and date helpers)
```

## Requirements

- Flutter 3.47 or newer (Dart 3.13)
- Android: Android SDK and JDK 17
- iOS: a Mac with Xcode and CocoaPods. iOS builds cannot be made on Windows.
- A running Performa-COS backend (see `../README.md`)

## Connecting to the backend

The backend address is fixed at build time (there is no in-app server setting). `lib/config.dart` picks, in order:

1. `--dart-define=API_BASE_URL=https://api.example.edu/api` passed to `flutter run` / `flutter build`.
2. `AppConfig.productionApiBaseUrl` in `lib/config.dart`. Put the deployed backend here before building a release.
3. Platform defaults for development: Android emulator `http://10.0.2.2:8000/api`, iOS simulator `http://127.0.0.1:8000/api`, web: the page's own origin plus `/api`.

For a phone on your Wi-Fi during development, start the backend on all interfaces and pass its LAN address:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
cd ../Performa-COS.app
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8000
```

Plain HTTP is allowed on Android (`usesCleartextTraffic`) and on iOS (App Transport Security exceptions) for local testing. For production, use HTTPS and remove these exceptions.

## Deployment checklist

1. Host the FastAPI backend over HTTPS (e.g. `https://api.performacos.example`). The app calls `https://api.performacos.example/api/...`.
2. In the backend `.env`:
   - `COS_APP_URL=https://cos.performacos.example` — where COS Employee invitation links point (the hosted `build/web` of this app). Other roles keep using `APP_FRONTEND_URL`.
   - `CORS_ORIGINS=["https://cos.performacos.example","https://portal.performacos.example"]`
   - `DEBUG=False`, a strong `JWT_SECRET_KEY`, real `SMTP_*` values.
3. In this app set `AppConfig.productionApiBaseUrl = 'https://api.performacos.example/api'` (or pass `--dart-define=API_BASE_URL=...`).
4. Replace `cos.performacos.example` in `android/app/src/main/AndroidManifest.xml` with the real host of `COS_APP_URL`, and serve `https://<host>/.well-known/assetlinks.json` with the release signing key's SHA-256 so Android opens the app directly from the e-mail link.
5. Build: `flutter build web --release` (upload `build/web` to the `COS_APP_URL` host) and `flutter build apk --release` / `flutter build ipa`.

## Registration through the invitation link

HR issues an invitation in the web portal; the backend e-mails the employee a link such as
`https://cos.performacos.example/?token=EVSU-INV-COS-12345`. Tapping it:

- on a phone with the app installed opens the app's registration form with the invitation already verified (Android App Link, or the `performacos://register?token=...` custom scheme on both platforms);
- otherwise opens the same form in the browser build of this app.

There is no token field and no "Register" link on the sign-in screen. If an e-mail client refuses to open the link, the employee can paste it into the registration screen. The token stays in the link because the backend uses it to bind the new account to the role and department HR chose.

## Run and build

```bash
cd Performa-COS.app
flutter pub get
flutter test

# Android
flutter run                                  # connected device or emulator
flutter build apk --release                  # build/app/outputs/flutter-apk/app-release.apk

# iOS (on macOS)
cd ios && pod install && cd ..
flutter run -d ios
flutter build ipa                            # set your signing team in Xcode first
```

The Android release build is signed with the debug key so it can be installed for testing. Set up a release keystore before publishing to Google Play.

## Browser preview

```bash
flutter build web
node tool/preview_server.mjs                 # http://localhost:5175, forwards /api to 127.0.0.1:8000
```

Open it in a phone-sized browser window. Taking photos and getting GPS work best in the Android or iOS app.

## Permissions

| Permission | Why |
| --- | --- |
| Location (when in use) | Campus check for clock in / clock out and for DAR photo location stamps |
| Camera | DAR photo evidence and profile photo |
| Photo library (iOS) | Choosing a profile photo |
