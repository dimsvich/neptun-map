# Залізне небо — Android (Capacitor)

Это тот же веб-интерфейс, упакованный в нативную оболочку Android.
`server.py` больше не нужен: запросы к NEPTUN и Telegram идут напрямую
через нативный HTTP-клиент (`CapacitorHttp`), который не подпадает под CORS.
В обычном браузере (через `START_MAP.bat`) всё работает как раньше.

## Способ 1 — собрать APK в облаке (без Android Studio)
1. Создайте приватный репозиторий на GitHub и залейте туда содержимое этой папки.
2. Вкладка **Actions → Build APK → Run workflow**.
3. Через ~5 минут скачайте артефакт `zalizne-nebo-debug-apk` → внутри `app-debug.apk`.
4. Перекиньте на телефон, разрешите установку из неизвестных источников, установите.

## Способ 2 — локально (Android Studio или только SDK)
Нужны: Node 20+, JDK 21, Android SDK.
```
npm install
npm run sync          # копирует MapLibre в www/vendor и синхронизирует android/
cd android
./gradlew assembleDebug
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`
Либо `npx cap open android` и Run на подключённом телефоне.

## После правок в www/
`npm run sync` и пересборка.

## Иконка
Сейчас стандартная Capacitor. Для своей: положить `assets/icon.png` (1024×1024) и
`npx @capacitor/assets generate --android`.
