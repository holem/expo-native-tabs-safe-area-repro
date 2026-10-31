import { ACTIVITY_ENABLED, EXTRA_PROVIDER, NATIVE_STATE_CONTROLS } from "./config";
import { insetsObjectId, trace } from "./trace";
import { requestDumpTrace } from "./trace-ui";
import { type ComponentRef, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Button, type LayoutRectangle, SafeAreaView as CoreSafeAreaView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";

export default function NativeStateScreen({ tab, container }: { tab: string; container: "router" | "screens" }) {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const screen = useRef<ComponentRef<typeof View>>(null);
  const rncContainer = useRef<ComponentRef<typeof View>>(null);
  const rncMarker = useRef<ComponentRef<typeof View>>(null);
  const rncChild = useRef<ComponentRef<typeof View>>(null);
  const coreContainer = useRef<ComponentRef<typeof CoreSafeAreaView>>(null);
  const coreMarker = useRef<ComponentRef<typeof View>>(null);
  const coreChild = useRef<ComponentRef<typeof View>>(null);

  const measure = useCallback(
    (reason: string) => {
      // These callbacks report Fabric layout and JS delivery, not presented pixels.
      const request = trace(tab, "native-state-measure-request", { reason, insets, frame });
      for (const [name, ref] of [
        ["native-state-screen", screen],
        ["rnc-container", rncContainer],
        ["rnc-marker", rncMarker],
        ["rnc-child", rncChild],
        ["rn-core-container", coreContainer],
        ["rn-core-marker", coreMarker],
        ["rn-core-child", coreChild],
      ] as const) {
        ref.current?.measureInWindow((x, y, width, height) => {
          trace(tab, "native-state-measure-result", { request, name, x, y, width, height });
        });
      }
    },
    [tab, insets, frame],
  );

  const recordLayout = useCallback(
    (name: string, layout: LayoutRectangle) => {
      trace(tab, "native-state-layout", { name, ...layout });
      if (name === "rnc-marker" || name === "rn-core-marker") measure(`${name}-layout`);
    },
    [tab, measure],
  );

  useEffect(() => {
    trace(tab, "native-state-mode", {
      mode: "native-state",
      nativeStateControls: NATIVE_STATE_CONTROLS,
      animatedProbes: false,
      activityEnabled: container === "screens" ? false : ACTIVITY_ENABLED,
      extraProvider: EXTRA_PROVIDER,
      container,
    });
  }, [tab, container]);

  useLayoutEffect(() => {
    trace(tab, "native-state-context-commit", { insetsObjectId: insetsObjectId(insets), insets, frame });
    measure("context-commit");
  }, [tab, insets, frame, measure]);

  return (
    <View
      ref={screen}
      testID={`${tab}-native-state-screen`}
      collapsable={false}
      style={styles.screen}
      onLayout={(event) => recordLayout("native-state-screen", event.nativeEvent.layout)}
    >
      <SafeAreaView
        ref={rncContainer}
        testID={`${tab}-rnc-container`}
        collapsable={false}
        edges={["bottom"]}
        style={[styles.container, styles.rncContainer]}
        onLayout={(event) => recordLayout("rnc-container", event.nativeEvent.layout)}
      >
        <View
          ref={rncMarker}
          testID={`${tab}-rnc-marker`}
          collapsable={false}
          style={[styles.marker, styles.rncMarker]}
          onLayout={(event) => recordLayout("rnc-marker", event.nativeEvent.layout)}
        >
          <View
            ref={rncChild}
            testID={`${tab}-rnc-child`}
            collapsable={false}
            style={styles.child}
            onLayout={(event) => recordLayout("rnc-child", event.nativeEvent.layout)}
          >
            <Text>RNC</Text>
          </View>
        </View>
      </SafeAreaView>
      <CoreSafeAreaView
        ref={coreContainer}
        testID={`${tab}-rn-core-container`}
        collapsable={false}
        style={[styles.container, styles.coreContainer]}
        onLayout={(event) => recordLayout("rn-core-container", event.nativeEvent.layout)}
      >
        <View
          ref={coreMarker}
          testID={`${tab}-rn-core-marker`}
          collapsable={false}
          style={[styles.marker, styles.coreMarker]}
          onLayout={(event) => recordLayout("rn-core-marker", event.nativeEvent.layout)}
        >
          <View
            ref={coreChild}
            testID={`${tab}-rn-core-child`}
            collapsable={false}
            style={styles.child}
            onLayout={(event) => recordLayout("rn-core-child", event.nativeEvent.layout)}
          >
            <Text>RN core</Text>
          </View>
        </View>
      </CoreSafeAreaView>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.heading}>{tab}: RNC | RN core</Text>
        <Text>Context bottom: {insets.bottom}</Text>
        <Text>Container: {container}</Text>
        <Text>Frame: {frame.width} × {frame.height}</Text>
        <Text>Compare marker top with the UIKit outline.</Text>
        <Button title="Dump trace" onPress={requestDumpTrace} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f4f4" },
  container: { position: "absolute", top: 0, bottom: 0, width: "48%", justifyContent: "flex-end" },
  rncContainer: { left: 0 },
  coreContainer: { right: 0 },
  marker: { padding: 16 },
  rncMarker: { backgroundColor: "#b8def5" },
  coreMarker: { backgroundColor: "#f5cbb8" },
  child: { height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  header: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 16 },
  heading: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
});
