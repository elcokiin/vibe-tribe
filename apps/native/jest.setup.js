require("@testing-library/jest-native/extend-expect");
require("react-native-gesture-handler/jestSetup");

const { mockAuthClient } = require("./tests/mocks/auth-client");
const { mockRouterPush, mockRouterBack } = require("./tests/mocks/router");

const originalConsoleError = console.error;

jest.mock("@tanstack/devtools-event-client", () => ({
  EventClient: class EventClient {
    constructor() {}
    emit() {}
    on() {
      return () => {};
    }
    onAll() {
      return () => {};
    }
    onAllPluginEvents() {
      return () => {};
    }
  },
}), { virtual: true });

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const AnimatedView = React.forwardRef((props, ref) => React.createElement("AnimatedView", { ...props, ref }));

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      createAnimatedComponent: () => AnimatedView,
    },
    createAnimatedComponent: () => AnimatedView,
    FadeOut: {},
    ZoomIn: {},
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "Light",
  },
}));

jest.mock("expo-router", () => ({
  Link: ({ children }) => children,
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
  }),
  Redirect: ({ href }) => {
    const React = require("react");
    return React.createElement("Text", null, `REDIRECT:${href}`);
  },
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: {
    Images: "Images",
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const Icon = ({ children }) => React.createElement("Icon", null, children || "icon");

  return {
    Server: Icon,
    ShieldCheck: Icon,
    ShieldX: Icon,
    ChevronLeft: Icon,
    ChevronRight: Icon,
    MoonStar: Icon,
    Sun: Icon,
    type: {},
  };
});

jest.mock("@/lib/auth-client", () => ({
  authClient: mockAuthClient,
}));

jest.mock("@/utils/orpc", () => require("@/tests/mocks/orpc"));

jest.mock("@/contexts/app-theme-context", () => ({
  useAppTheme: () => ({
    currentTheme: "light",
    isLight: true,
    isDark: false,
    setTheme: jest.fn(),
    toggleTheme: jest.fn(),
  }),
  AppThemeProvider: ({ children }) => children,
}));

jest.mock("@/components/container", () => ({
  Container: ({ children }) => children,
}));

jest.mock("@/components/app-background", () => ({
  AppBackground: ({ children }) => children,
}));

jest.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => null,
}));

jest.mock("@/components/ui/icon", () => ({
  Icon: () => null,
}));

jest.mock("@/components/ui/text", () => {
  const React = require("react");

  return {
    Text: ({ children }) => React.createElement("Text", null, children),
  };
});

jest.mock("@/components/ui/button", () => {
  const React = require("react");

  return {
    Button: ({ children, onPress, disabled }) =>
      React.createElement("Button", { onPress, disabled }, children),
  };
});

jest.mock("@/components/ui/input", () => {
  const React = require("react");

  return {
    Input: ({ value, onChangeText, placeholder, onSubmitEditing, onBlur }) =>
      React.createElement("TextInput", {
        value,
        onChangeText,
        placeholder,
        onSubmitEditing,
        onBlur,
      }),
  };
});

jest.mock("@/components/ui/label", () => {
  const React = require("react");

  return {
    Label: ({ children }) => React.createElement("Label", null, children),
  };
});

jest.mock("@/components/ui/card", () => {
  const React = require("react");

  const Wrapper = ({ children }) => React.createElement("Card", null, children);

  return {
    Card: Wrapper,
    CardContent: Wrapper,
    CardDescription: Wrapper,
    CardFooter: Wrapper,
    CardHeader: Wrapper,
    CardTitle: Wrapper,
  };
});

jest.mock("@/components/ui/badge", () => {
  const React = require("react");

  return {
    Badge: ({ children }) => React.createElement("Badge", null, children),
  };
});

jest.mock("@vibetribe/env/native", () => ({
  env: {
    EXPO_PUBLIC_SERVER_URL: "http://localhost:4000",
  },
}));

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args) => {
    const [firstArg] = args;

    if (typeof firstArg === "string" && firstArg.includes("react-test-renderer is deprecated")) {
      return;
    }

    originalConsoleError(...args);
  });
});

afterAll(() => {
  if (typeof console.error.mockRestore === "function") {
    console.error.mockRestore();
  }
});

afterEach(() => {
  jest.clearAllTimers();
});
