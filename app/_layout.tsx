import { ACTIVITY_ENABLED, ANIMATED_PROBES, EXTRA_PROVIDER, NATIVE_STATE_CONTROLS } from "../probe/config";
import { trace } from "../probe/trace";
import { NativeTabs } from "expo-router/native-tabs";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RootLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    trace("root", "context", {
      insets,
      platform: Platform.OS,
      osVersion: Platform.Version,
      activityEnabled: ACTIVITY_ENABLED,
      extraProvider: EXTRA_PROVIDER,
      animatedProbes: ANIMATED_PROBES && !NATIVE_STATE_CONTROLS,
      nativeStateControls: NATIVE_STATE_CONTROLS,
      container: "router",
    });
  }, [insets]);

  return (
    <NativeTabs activityEnabled={ACTIVITY_ENABLED}>
      {(["index", "second", "third"] as const).map((name) => (
        <NativeTabs.Trigger
          key={name}
          name={name}
          listeners={{
            tabPress: () => trace(name, "tabPress-js"),
            focus: () => trace(name, "focus-js"),
            blur: () => trace(name, "blur-js"),
          }}
          unstable_nativeProps={{
            onWillAppear: () => trace(name, "willAppear-native-delivered"),
            onDidAppear: () => trace(name, "didAppear-native-delivered"),
            onWillDisappear: () => trace(name, "willDisappear-native-delivered"),
            onDidDisappear: () => trace(name, "didDisappear-native-delivered"),
          }}
        >
          <NativeTabs.Trigger.Label>{name}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="circle" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
