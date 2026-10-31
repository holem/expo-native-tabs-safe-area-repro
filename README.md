# Expo NativeTabs safe-area first-visit reproduction

Minimal source reproduction for [expo/expo#42486](https://github.com/expo/expo/issues/42486). No dependency patches or workaround are included.

Use Node 24, pnpm 12.14.0, and Xcode with an iOS simulator (the recording used Xcode 27.2).

```sh
pnpm install --frozen-lockfile
pnpm ios
```

Choose the simulator when prompted. This builds and installs the development client; `pnpm start` can reconnect to that installed build later.

1. Cold-launch the app and record the screen.
2. Tap `second → index → second → third`, pausing about two seconds on each.
3. Compare the first and repeated visits. Press **Dump trace** after the sequence and save the `[tabs-probe]` lines from Metro.

The four bottom columns are blue: native `SafeAreaView`; orange: plain `View` with hook padding; green: `Animated.View` with static hook padding; purple: `Animated.View` with `useAnimatedStyle`. Each has a 44-point child and 16-point padding. Insets are read as provided; no value is hard-coded.

The measured source fixture used iPhone 15 / iOS 26.5: the hook initially returned bottom `34`, then `83` on the first visit; revisits retained `83`. Expected: no visible first-visit jump. Context and layout callbacks are buffered until Dump; they do not acknowledge presented pixels.

Versions are pinned in `package.json` and the copied lockfile: Expo 58.0.21, Expo Router 58.0.28, React 19.3.0, React Native 0.88.1, Screens 4.30.1, Safe Area Context 5.10.1, Reanimated 4.7.1, Worklets 0.13.0.

Default: Expo Router NativeTabs with `activityEnabled=false`. For the optional raw `react-native-screens` comparison, set `SCREENS_ONLY=true` in `probe/config.ts` and reload. No separate prerender/lazy override is added.

This is a clean derivative of the measured fixture, retaining its four footer implementations and geometry while removing research instrumentation. A clean frozen install, TypeScript and ESLint checks passed for this public copy; it has not been rebuilt and rerun on iOS.

[Repro ZIP](https://github.com/holem/expo-native-tabs-safe-area-repro/releases/download/v1/repro.zip) · [Recording](https://github.com/holem/expo-native-tabs-safe-area-repro/releases/download/v1/first-tab-visit-ios-26.5.mp4) · [Diagnostic logs and recorded fixture](https://github.com/holem/expo-native-tabs-safe-area-repro/releases/download/v1/diagnostics.zip). The recording uses the instrumented raw Screens mode; that exact fixture is in the diagnostics archive.
