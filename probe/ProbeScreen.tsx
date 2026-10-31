import AnimatedFooters, { type UiTracePhase } from "./AnimatedFooters";
import { ANIMATED_PROBES } from "./config";
import { insetsObjectId, trace } from "./trace";
import { requestDumpTrace } from "./trace-ui";
import { type ComponentRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProbeScreen({ tab, container }: { tab: string; container: "router" | "screens" }) {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const [control, setControl] = useState({ extraPadding: 0, revision: 0 });
  const controlSequence = useRef(0);
  const screen = useRef<ComponentRef<typeof View>>(null);
  const nativeFooter = useRef<ComponentRef<typeof View>>(null);
  const nativeContent = useRef<ComponentRef<typeof View>>(null);
  const jsFooter = useRef<ComponentRef<typeof View>>(null);
  const jsContent = useRef<ComponentRef<typeof View>>(null);
  const staticFooter = useRef<ComponentRef<typeof View>>(null);
  const staticContent = useRef<ComponentRef<typeof View>>(null);
  const workletFooter = useRef<ComponentRef<typeof View>>(null);
  const workletContent = useRef<ComponentRef<typeof View>>(null);

  const measure = useCallback(
    (reason: string) => {
      // Every callback links to its request; delivery time is not UIKit event time.
      const request = trace(tab, "measure-request", { reason, insets, frame });
      for (const [name, ref] of [
        ["screen", screen],
        ["native-footer", nativeFooter],
        ["native-content", nativeContent],
        ["js-footer", jsFooter],
        ["js-content", jsContent],
        ...(ANIMATED_PROBES
          ? ([
              ["animated-static-footer", staticFooter],
              ["animated-static-content", staticContent],
              ["animated-worklet-footer", workletFooter],
              ["animated-worklet-content", workletContent],
            ] as const)
          : []),
      ] as const) {
        ref.current?.measureInWindow((x, y, width, height) => {
          trace(tab, "measure-result", { request, name, x, y, width, height });
        });
      }
    },
    [tab, insets, frame],
  );

  const reportUiTrace = useCallback(
    (phase: UiTracePhase, paddingBottom: number, uiNow: number, controlRevision: number) => {
      trace(tab, phase, { paddingBottom, uiNow, controlRevision });
    },
    [tab],
  );

  useEffect(() => {
    trace(tab, "effect-mount");
    return () => {
      trace(tab, "effect-cleanup");
    };
  }, [tab]);

  useLayoutEffect(() => {
    trace(tab, "context-commit", { insetsObjectId: insetsObjectId(insets), insets, frame });
    measure("context-commit");
  }, [tab, insets, frame, measure]);

  useLayoutEffect(() => {
    if (control.revision === 0) return;
    trace(tab, "padding-control-commit", {
      controlRevision: control.revision,
      extraPadding: control.extraPadding,
      paddingBottom: 16 + insets.bottom + control.extraPadding,
      insetsObjectId: insetsObjectId(insets),
      insets,
    });
    measure("padding-control-commit");
  }, [tab, control, insets, measure]);

  return (
    <View
      ref={screen}
      testID={`${tab}-footer-screen`}
      collapsable={false}
      style={styles.screen}
      onLayout={(event) => {
        trace(tab, "screen-layout", event.nativeEvent.layout);
        measure("screen-layout");
      }}
    >
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
        <Text style={styles.heading}>{tab}</Text>
        <Text>Context bottom: {insets.bottom}</Text>
        <Text>Container: {container}</Text>
        <Text>
          Frame: {frame.width} × {frame.height}
        </Text>
        <Button title="Dump trace" onPress={requestDumpTrace} />
        {ANIMATED_PROBES ? (
          <>
            <Text>Extra padding: {control.extraPadding} (revision {control.revision})</Text>
            <Button title="Toggle extra padding" onPress={() => {
              const revision = ++controlSequence.current;
              const next = { extraPadding: revision % 2 === 1 ? 48 : 0, revision };
              trace(tab, "padding-control-request", { controlRevision: next.revision, extraPadding: next.extraPadding, insets });
              setControl(next);
            }} />
          </>
        ) : null}
        <Text>First visit: compare footer heights and their logs.</Text>
        <Text>
          {ANIMATED_PROBES
            ? "Native | JS | Animated static | Animated UI"
            : "Left: native SafeAreaView. Right: JS padding from context."}
        </Text>
      </View>
      <SafeAreaView
        ref={nativeFooter}
        testID={`${tab}-native-footer`}
        collapsable={false}
        edges={["bottom"]}
        style={[styles.footer, styles.nativeFooter, ANIMATED_PROBES && styles.comparisonFooter]}
        onLayout={(event) => {
          trace(tab, "native-footer-layout", event.nativeEvent.layout);
          measure("native-footer-layout");
        }}
      >
        <View ref={nativeContent} testID={`${tab}-native-content`} collapsable={false} style={styles.content}>
          <Text>Native</Text>
        </View>
      </SafeAreaView>
      <View
        ref={jsFooter}
        testID={`${tab}-js-footer`}
        collapsable={false}
        style={[
          styles.footer,
          styles.jsFooter,
          ANIMATED_PROBES && styles.comparisonFooter,
          ANIMATED_PROBES && styles.comparisonJsFooter,
          { paddingBottom: 16 + insets.bottom + control.extraPadding },
        ]}
        onLayout={(event) => {
          trace(tab, "js-footer-layout", event.nativeEvent.layout);
          measure("js-footer-layout");
        }}
      >
        <View ref={jsContent} testID={`${tab}-js-content`} collapsable={false} style={styles.content}>
          <Text>JS</Text>
        </View>
      </View>
      {ANIMATED_PROBES ? (
        <AnimatedFooters
          tab={tab}
          extraPadding={control.extraPadding}
          controlRevision={control.revision}
          staticFooter={staticFooter}
          staticContent={staticContent}
          workletFooter={workletFooter}
          workletContent={workletContent}
          onUiTrace={reportUiTrace}
          onLayout={(name, layout) => trace(tab, name, layout)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f4f4" },
  heading: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
  footer: { position: "absolute", bottom: 0, width: "48%", padding: 16 },
  nativeFooter: { left: 0, backgroundColor: "#b8def5" },
  jsFooter: { right: 0, backgroundColor: "#f5cbb8" },
  comparisonFooter: { width: "24%" },
  comparisonJsFooter: { left: "25%", right: undefined },
  content: { height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
});
