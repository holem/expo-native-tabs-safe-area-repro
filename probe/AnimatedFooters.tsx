import { type ComponentRef, type RefObject, useEffect } from "react";
import { type LayoutRectangle, StyleSheet, Text, View } from "react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { trace } from "./trace";

export type UiTracePhase = "worklet-style-evaluated" | "ui-batch-tail" | "ui-first-frame" | "ui-second-frame";

type AnimatedFootersProps = {
  tab: string;
  extraPadding: number;
  controlRevision: number;
  staticFooter: RefObject<ComponentRef<typeof View> | null>;
  staticContent: RefObject<ComponentRef<typeof View> | null>;
  workletFooter: RefObject<ComponentRef<typeof View> | null>;
  workletContent: RefObject<ComponentRef<typeof View> | null>;
  onLayout: (
    name: "animated-static-footer-layout" | "animated-worklet-footer-layout",
    layout: LayoutRectangle,
  ) => void;
  onUiTrace: (phase: UiTracePhase, paddingBottom: number, uiNow: number, controlRevision: number) => void;
};

export default function AnimatedFooters({
  tab,
  extraPadding,
  controlRevision,
  staticFooter,
  staticContent,
  workletFooter,
  workletContent,
  onLayout,
  onUiTrace,
}: AnimatedFootersProps) {
  const insets = useSafeAreaInsets();
  const padding = 16 + insets.bottom + extraPadding;
  const animatedPadding = useAnimatedStyle(() => {
    if (globalThis._WORKLET) {
      // Delivery on RN is asynchronous; uiNow identifies the UI calculation.
      scheduleOnRN(onUiTrace, "worklet-style-evaluated", padding, performance.now(), controlRevision);
    }
    return { paddingBottom: padding };
  });

  useEffect(() => {
    // In pinned Reanimated, the preceding hook effects enqueue the mapper.
    // Neither this marker nor the RN microtask tail acknowledges UI execution.
    const effectEvent = trace(tab, "animated-effects-returned", { paddingBottom: padding, controlRevision });
    queueMicrotask(() => trace(tab, "rn-microtask-tail", { effectEvent, paddingBottom: padding, controlRevision }));
    // The preceding internal effect queued mapper registration in the same FIFO UI batch.
    // RAF callbacks precede mapper finalizers; the SECOND callback bounds that finalizer.
    scheduleOnUI((targetPadding: number, revision: number) => {
      "worklet";
      scheduleOnRN(onUiTrace, "ui-batch-tail", targetPadding, performance.now(), revision);
      requestAnimationFrame(() => {
        scheduleOnRN(onUiTrace, "ui-first-frame", targetPadding, performance.now(), revision);
        requestAnimationFrame(() => {
          scheduleOnRN(onUiTrace, "ui-second-frame", targetPadding, performance.now(), revision);
        });
      });
    }, padding, controlRevision);
  }, [onUiTrace, padding, controlRevision, tab]);

  return (
    <>
      <Reanimated.View
        ref={staticFooter}
        testID={`${tab}-animated-static-footer`}
        collapsable={false}
        style={[styles.footer, styles.staticFooter, { paddingBottom: padding }]}
        onLayout={(event) => onLayout("animated-static-footer-layout", event.nativeEvent.layout)}
      >
        <View ref={staticContent} testID={`${tab}-animated-static-content`} collapsable={false} style={styles.content}>
          <Text>Static</Text>
        </View>
      </Reanimated.View>
      <Reanimated.View
        ref={workletFooter}
        testID={`${tab}-animated-worklet-footer`}
        collapsable={false}
        style={[styles.footer, styles.workletFooter, animatedPadding]}
        onLayout={(event) => onLayout("animated-worklet-footer-layout", event.nativeEvent.layout)}
      >
        <View ref={workletContent} testID={`${tab}-animated-worklet-content`} collapsable={false} style={styles.content}>
          <Text>UI</Text>
        </View>
      </Reanimated.View>
    </>
  );
}

const styles = StyleSheet.create({
  footer: { position: "absolute", bottom: 0, width: "24%", padding: 16 },
  staticFooter: { left: "51%", backgroundColor: "#c5e9ce" },
  workletFooter: { left: "76%", backgroundColor: "#d8c8f0" },
  content: { height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
});
