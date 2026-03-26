global.__DEV__ = true;
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [
    ["UIManager", {}, [], [], []],
    ["NativeUnimoduleProxy", { viewManagersMetadata: {} }, [], [], []],
  ],
};

jest.mock("react-native/Libraries/ReactNative/NativeUIManager", () => ({
  getConstants: () => ({}),
  hasViewManagerConfig: () => true,
  getViewManagerConfig: () => ({}),
}));

jest.mock("react-native/Libraries/Utilities/NativePlatformConstantsIOS", () => ({
  getConstants: () => ({
    forceTouchAvailable: false,
    interfaceIdiom: "phone",
    isTesting: true,
    osVersion: "18.0",
    reactNativeVersion: { major: 0, minor: 83, patch: 2 },
    systemName: "iOS",
  }),
}));

jest.mock("react-native/Libraries/TurboModule/TurboModuleRegistry", () => ({
  get: jest.fn((moduleName) => {
    if (moduleName === "SourceCode") {
      return {
        getConstants: () => ({
          scriptURL: "http://localhost/index.bundle",
        }),
      };
    }

    if (moduleName === "DeviceInfo") {
      return {
        getConstants: () => ({
          Dimensions: {
            window: {
              fontScale: 1,
              scale: 2,
              width: 390,
              height: 844,
            },
            screen: {
              fontScale: 1,
              scale: 2,
              width: 390,
              height: 844,
            },
          },
        }),
      };
    }

    return null;
  }),
  getEnforcing: jest.fn((moduleName) => {
    if (moduleName === "SourceCode") {
      return {
        getConstants: () => ({
          scriptURL: "http://localhost/index.bundle",
        }),
      };
    }

    if (moduleName === "DeviceInfo") {
      return {
        getConstants: () => ({
          Dimensions: {
            window: {
              fontScale: 1,
              scale: 2,
              width: 390,
              height: 844,
            },
            screen: {
              fontScale: 1,
              scale: 2,
              width: 390,
              height: 844,
            },
          },
        }),
      };
    }

    return {};
  }),
}));
