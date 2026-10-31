import { ACTIVITY_ENABLED } from "../probe/config";
import { trace } from "../probe/trace";
import { NativeTabs } from "expo-router/native-tabs";

export default function RootLayout() {
  return (
    <NativeTabs activityEnabled={ACTIVITY_ENABLED}>
      {(["index", "second", "third"] as const).map((name) => (
        <NativeTabs.Trigger
          key={name}
          name={name}
          listeners={{
            tabPress: () => trace(name, "tabPress"),
            focus: () => trace(name, "focus"),
            blur: () => trace(name, "blur"),
          }}
        >
          <NativeTabs.Trigger.Label>{name}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="circle" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
