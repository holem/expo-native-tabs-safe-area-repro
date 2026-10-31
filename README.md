# Expo NativeTabs safe-area reproduction

Reproduction and diagnostics for [expo/expo#42486](https://github.com/expo/expo/issues/42486). Four columns compare native SafeAreaView, plain View, Animated.View with static padding, and Animated.View with useAnimatedStyle.

Use Node 24, pnpm 12.14.0, and Xcode with an iOS simulator. Install and start Metro in one terminal:

```sh
pnpm install --frozen-lockfile
mkdir -p logs
pnpm start 2>&1 | tee logs/metro.log
```

In another terminal:

```sh
pnpm ios
```

Choose the simulator when prompted. This builds and installs the development client. The recorded run used iPhone 15 / iOS 26.5 and Xcode 27.2.

1. Cold-launch the app on `index` and start a recording.
2. Visit `second → index → second → third`, pausing about two seconds on each.
3. Wait four seconds, then press **Dump trace** once. Leave **Toggle extra padding** alone.
4. Collect native logs and frame files:

```sh
pnpm logs:ios
```

JS/UI records are in `logs/metro.log`; native logs and per-frame captures are in `logs/<pid>/`. If needed, set `REPRO_SIMULATOR` to the simulator UDID or increase the collection window with `REPRO_LOG_WINDOW=1h`.

Expected: no visible first-visit jump. In the measured fixture, the hook initially returned bottom `34`, then `83` on the first visit; revisits retained `83`. The JS footer height changed `110→159`. Values are measured, not hard-coded.

The diagnostic patches in `patches/` apply automatically during installation through `patchedDependencies`. They trace provider events, React scheduling, Reanimated mapper/props operations, native state/mounts and model/presentation geometry; the pink outline is a native UIKit reference. They preserve the original state/event/scheduling choices. There is no corrective patch. Native instrumentation requires the development build above; Metro reload alone cannot install it. Logs have capture timestamps and bounded buffers; check drop counters. A known observer serialization gap affects some `performWorkOnRoot:end` records, not the product updates; other render/commit markers remain available. Instrumentation can affect timing, and presentation-layer samples are not paint acknowledgments.

Default is Expo Router NativeTabs with `activityEnabled=false`. Set `SCREENS_ONLY=true` in `probe/config.ts` for the raw react-native-screens comparison used in the recording. That instrumented fixture was run on iOS; the public Router configuration has not been rebuilt and rerun on iOS.

Pinned versions: Expo 58.0.21, Expo Router 58.0.28, React 19.3.0, React Native 0.88.1, Screens 4.30.1, Safe Area Context 5.10.1, Reanimated 4.7.1, Worklets 0.13.0. Dependency licenses are in `LICENSES/`.
