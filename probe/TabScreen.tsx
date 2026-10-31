import { EXTRA_PROVIDER, NATIVE_STATE_CONTROLS } from "./config";
import NativeStateScreen from "./NativeStateScreen";
import ProbeScreen from "./ProbeScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function TabScreen({ tab, container = "router" }: { tab: string; container?: "router" | "screens" }) {
  const Screen = NATIVE_STATE_CONTROLS ? NativeStateScreen : ProbeScreen;
  // NativeTabs already supplies a per-tab provider on iOS. This switch isolates
  // whether an additional application-level provider changes the result.
  return EXTRA_PROVIDER ? (
    <SafeAreaProvider>
      <Screen tab={tab} container={container} />
    </SafeAreaProvider>
  ) : (
    <Screen tab={tab} container={container} />
  );
}
