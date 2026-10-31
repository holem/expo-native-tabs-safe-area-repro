import AnimatedFooters from "./AnimatedFooters";
import { dumpTrace, trace } from "./trace";
import { useLayoutEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProbeScreen({ tab, container }: { tab: string; container: "router" | "screens" }) {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();

  useLayoutEffect(() => {
    trace(tab, "context", { insets, frame });
  }, [tab, insets, frame]);

  return (
    <View
      testID={`${tab}-footer-screen`}
      collapsable={false}
      style={styles.screen}
      onLayout={(event) => trace(tab, "screen-layout", event.nativeEvent.layout)}
    >
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
        <Text style={styles.heading}>{tab}</Text>
        <Text>Context bottom: {insets.bottom}</Text>
        <Text>Container: {container}</Text>
        <Text>Frame: {frame.width} × {frame.height}</Text>
        <Button title="Dump trace" onPress={dumpTrace} />
        <Text>First visit: compare the four footers.</Text>
        <Text>Native | JS | Animated static | Animated UI</Text>
      </View>
      <SafeAreaView
        testID={`${tab}-native-footer`}
        collapsable={false}
        edges={["bottom"]}
        style={[styles.footer, styles.nativeFooter]}
        onLayout={(event) => trace(tab, "native-footer-layout", event.nativeEvent.layout)}
      >
        <View testID={`${tab}-native-content`} collapsable={false} style={styles.content}>
          <Text>Native</Text>
        </View>
      </SafeAreaView>
      <View
        testID={`${tab}-js-footer`}
        collapsable={false}
        style={[styles.footer, styles.jsFooter, { paddingBottom: 16 + insets.bottom }]}
        onLayout={(event) => trace(tab, "js-footer-layout", event.nativeEvent.layout)}
      >
        <View testID={`${tab}-js-content`} collapsable={false} style={styles.content}>
          <Text>JS</Text>
        </View>
      </View>
      <AnimatedFooters
        tab={tab}
        onLayout={(name, layout) => trace(tab, name, layout)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f4f4" },
  heading: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
  footer: { position: "absolute", bottom: 0, width: "24%", padding: 16 },
  nativeFooter: { left: 0, backgroundColor: "#b8def5" },
  jsFooter: { left: "25%", backgroundColor: "#f5cbb8" },
  content: { height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
});
