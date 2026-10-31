import { type LayoutRectangle, StyleSheet, Text, View } from "react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  tab: string;
  onLayout: (
    name: "animated-static-footer-layout" | "animated-worklet-footer-layout",
    layout: LayoutRectangle,
  ) => void;
};

export default function AnimatedFooters({ tab, onLayout }: Props) {
  const insets = useSafeAreaInsets();
  const padding = 16 + insets.bottom;
  const animatedPadding = useAnimatedStyle(() => ({ paddingBottom: padding }));

  return (
    <>
      <Reanimated.View
        testID={`${tab}-animated-static-footer`}
        collapsable={false}
        style={[styles.footer, styles.staticFooter, { paddingBottom: padding }]}
        onLayout={(event) => onLayout("animated-static-footer-layout", event.nativeEvent.layout)}
      >
        <View testID={`${tab}-animated-static-content`} collapsable={false} style={styles.content}>
          <Text>Static</Text>
        </View>
      </Reanimated.View>
      <Reanimated.View
        testID={`${tab}-animated-worklet-footer`}
        collapsable={false}
        style={[styles.footer, styles.workletFooter, animatedPadding]}
        onLayout={(event) => onLayout("animated-worklet-footer-layout", event.nativeEvent.layout)}
      >
        <View testID={`${tab}-animated-worklet-content`} collapsable={false} style={styles.content}>
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
