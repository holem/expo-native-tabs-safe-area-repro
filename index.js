const { SCREENS_ONLY } = require("./probe/config");

if (SCREENS_ONLY) {
  const { registerRootComponent } = require("expo");
  const ScreensOnlyApp = require("./probe/ScreensOnlyApp").default;
  registerRootComponent(ScreensOnlyApp);
} else {
  require("expo-router/entry");
}
