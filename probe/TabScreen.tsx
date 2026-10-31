import ProbeScreen from "./ProbeScreen";

export default function TabScreen({ tab, container = "router" }: { tab: string; container?: "router" | "screens" }) {
  return <ProbeScreen tab={tab} container={container} />;
}
