import TabScreen from "./TabScreen";
import { ANIMATED_PROBES, EXTRA_PROVIDER, NATIVE_STATE_CONTROLS } from "./config";
import { trace } from "./trace";
import { useEffect } from "react";
import { type NativeSyntheticEvent, Platform, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs, type TabSelectedEvent, type TabsHostNavStateRequest } from "react-native-screens";

// This sets the initial selection only. Native owns subsequent user selections;
// observing an event never issues a new navigation request from JS.
const initialNavStateRequest: TabsHostNavStateRequest = { selectedScreenKey: "index", baseProvenance: 0 };

function recordTabSelected({ nativeEvent }: NativeSyntheticEvent<TabSelectedEvent>) {
  const { selectedScreenKey, provenance, isRepeated, actionOrigin } = nativeEvent;
  // This is JS delivery of native selection, not the timestamp of a tab press.
  trace(selectedScreenKey, "native-tab-selected-js", { provenance, isRepeated, actionOrigin });
}

function ScreensOnlyTabs() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    trace("root", "context", {
      insets,
      platform: Platform.OS,
      osVersion: Platform.Version,
      activityEnabled: false,
      extraProvider: EXTRA_PROVIDER,
      animatedProbes: ANIMATED_PROBES && !NATIVE_STATE_CONTROLS,
      nativeStateControls: NATIVE_STATE_CONTROLS,
      container: "screens",
    });
  }, [insets]);

  return (
    <Tabs.Host navStateRequest={initialNavStateRequest} onTabSelected={recordTabSelected}>
      {(["index", "second", "third"] as const).map((name) => (
        <Tabs.Screen
          key={name}
          screenKey={name}
          title={name}
          ios={{ icon: { type: "sfSymbol", name: "circle" }, overrideScrollViewContentInsetAdjustmentBehavior: true }}
          onWillAppear={() => trace(name, "willAppear-native-delivered")}
          onDidAppear={() => trace(name, "didAppear-native-delivered")}
          onWillDisappear={() => trace(name, "willDisappear-native-delivered")}
          onDidDisappear={() => trace(name, "didDisappear-native-delivered")}
        >
          <SafeAreaProvider>
            <View collapsable={false} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <TabScreen tab={name} container="screens" />
            </View>
          </SafeAreaProvider>
        </Tabs.Screen>
      ))}
    </Tabs.Host>
  );
}

export default function ScreensOnlyApp() {
  return (
    <SafeAreaProvider>
      <ScreensOnlyTabs />
    </SafeAreaProvider>
  );
}
