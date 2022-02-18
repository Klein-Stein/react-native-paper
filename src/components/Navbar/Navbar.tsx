import * as React from 'react';
import {
  View,
  Animated,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
  StyleSheet,
  StyleProp,
  Platform,
  ViewStyle,
} from 'react-native';
import color from 'color';
import overlay from '../../styles/overlay';
import Icon, { IconSource } from '../Icon';
import Surface from '../Surface';
import Badge from '../Badge';
import TouchableRipple from '../TouchableRipple/TouchableRipple';
import Text from '../Typography/Text';
import { black, white } from '../../styles/colors';
import { withTheme } from '../../core/theming';
import useAnimatedValue from '../../utils/useAnimatedValue';
import useAnimatedValueArray from '../../utils/useAnimatedValueArray';
import useLayout from '../../utils/useLayout';
import useIsKeyboardShown from '../../utils/useIsKeyboardShown';
import NavbarRouteScreen from './NavbarRouteScreen';
import Appbar from '../Appbar';

type Route = {
  key: string;
  title?: string;
  icon?: IconSource;
  badge?: string | number | boolean;
  color?: string;
  accessibilityLabel?: string;
  testID?: string;
};

type NavigationState = {
  index: number;
  routes: Route[];
};

type TabPressEvent = {
  defaultPrevented: boolean;
  preventDefault(): void;
};

type TouchableProps = TouchableWithoutFeedbackProps & {
  key: string;
  route: Route;
  children: React.ReactNode;
  borderless?: boolean;
  centered?: boolean;
  rippleColor?: string;
};

type Props = Partial<React.ComponentPropsWithRef<typeof View>> & {
  shifting?: boolean;
  labeled?: boolean;
  navigationState: NavigationState;
  onIndexChange: (index: number) => void;
  renderScene: (props: {
    route: Route;
    jumpTo: (key: string) => void;
  }) => React.ReactNode | null;
  renderIcon?: (props: {
    route: Route;
    focused: boolean;
    color: string;
  }) => React.ReactNode;
  renderLabel?: (props: {
    route: Route;
    focused: boolean;
    color: string;
  }) => React.ReactNode;
  renderTouchable?: (props: TouchableProps) => React.ReactNode;
  getLabelText?: (props: { route: Route }) => string | undefined;
  getAccessibilityLabel?: (props: { route: Route }) => string | undefined;
  getTestID?: (props: { route: Route }) => string | undefined;
  getBadge?: (props: { route: Route }) => boolean | number | string | undefined;
  getColor?: (props: { route: Route }) => string | undefined;
  onTabPress?: (props: { route: Route } & TabPressEvent) => void;
  activeColor?: string;
  inactiveColor?: string;
  sceneAnimationEnabled?: boolean;
  keyboardHidesNavigationBar?: boolean;
  safeAreaInsets?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  barStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  theme: ReactNativePaper.Theme;
  dark?: boolean;
  children: React.ReactNode;
};

const MIN_RIPPLE_SCALE = 0.001; // Minimum scale is not 0 due to bug with animation
const MIN_TAB_WIDTH = 96;
const MAX_TAB_WIDTH = 168;
const BAR_HEIGHT = 56;
const BOTTOM_INSET = 0;
const FAR_FAR_AWAY = Platform.OS === 'web' ? 0 : 9999;

const Touchable = ({
  route: _0,
  style,
  children,
  borderless,
  centered,
  rippleColor,
  ...rest
}: TouchableProps) =>
  TouchableRipple.supported ? (
    <TouchableRipple
      {...rest}
      disabled={rest.disabled || undefined}
      borderless={borderless}
      centered={centered}
      rippleColor={rippleColor}
      style={style}
    >
      {children}
    </TouchableRipple>
  ) : (
    <TouchableWithoutFeedback {...rest}>
      <View style={style}>{children}</View>
    </TouchableWithoutFeedback>
  );

const Navbar = ({
  navigationState,
  renderScene,
  renderIcon,
  renderLabel,
  renderTouchable = (props: TouchableProps) => <Touchable {...props} />,
  getLabelText = ({ route }: { route: Route }) => route.title,
  getBadge = ({ route }: { route: Route }) => route.badge,
  getColor = ({ route }: { route: Route }) => route.color,
  getAccessibilityLabel = ({ route }: { route: Route }) =>
    route.accessibilityLabel,
  getTestID = ({ route }: { route: Route }) => route.testID,
  activeColor,
  inactiveColor,
  keyboardHidesNavigationBar = true,
  barStyle,
  labeled = true,
  style,
  theme,
  sceneAnimationEnabled = false,
  onTabPress,
  onIndexChange,
  shifting = navigationState.routes.length > 3,
  safeAreaInsets,
  children,
  dark,
  ...rest
}: Props) => {
  const { scale } = theme.animation;

  const focusedKey = navigationState.routes[navigationState.index].key;

  const visibleAnim = useAnimatedValue(1);

  const tabsAnims = useAnimatedValueArray(
    navigationState.routes.map(
      // focused === 1, unfocused === 0
      (_, i) => (i === navigationState.index ? 1 : 0)
    )
  );

  const offsetsAnims = useAnimatedValueArray(
    navigationState.routes.map(
      // offscreen === 1, normal === 0
      (_, i) => (i === navigationState.index ? 0 : 1)
    )
  );

  const indexAnim = useAnimatedValue(navigationState.index);

  const rippleAnim = useAnimatedValue(MIN_RIPPLE_SCALE);

  const [layout, onLayout] = useLayout();

  const [loaded, setLoaded] = React.useState<string[]>([focusedKey]);

  if (!loaded.includes(focusedKey)) {
    // Set the current tab to be loaded if it was not loaded before
    setLoaded((loaded2) => [...loaded2, focusedKey]);
  }

  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  const handleKeyboardShow = React.useCallback(() => {
    setKeyboardVisible(true);
    Animated.timing(visibleAnim, {
      toValue: 0,
      duration: 150 * scale,
      useNativeDriver: true,
    }).start();
  }, [scale, visibleAnim]);

  const handleKeyboardHide = React.useCallback(() => {
    Animated.timing(visibleAnim, {
      toValue: 1,
      duration: 100 * scale,
      useNativeDriver: true,
    }).start(() => {
      setKeyboardVisible(false);
    });
  }, [scale, visibleAnim]);

  const animateToIndex = React.useCallback(
    (index: number) => {
      // Reset the ripple to avoid glitch if it's currently animating
      rippleAnim.setValue(MIN_RIPPLE_SCALE);

      Animated.parallel([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: shifting ? 400 * scale : 0,
          useNativeDriver: true,
        }),
        ...navigationState.routes.map((_, i) =>
          Animated.timing(tabsAnims[i], {
            toValue: i === index ? 1 : 0,
            duration: shifting ? 150 * scale : 0,
            useNativeDriver: true,
          })
        ),
      ]).start(({ finished }) => {
        // Workaround a bug in native animations where this is reset after first animation
        tabsAnims.map(
          (tab: { setValue: (arg0: number) => unknown }, i: number) =>
            tab.setValue(i === index ? 1 : 0)
        );

        // Update the index to change bar's background color and then hide the ripple
        indexAnim.setValue(index);
        rippleAnim.setValue(MIN_RIPPLE_SCALE);

        if (finished) {
          // Position all inactive screens offscreen to save memory usage
          // Only do it when animation has finished to avoid glitches mid-transition if switching fast
          offsetsAnims.forEach(
            (offset: { setValue: (arg0: number) => void }, i: number) => {
              if (i === index) {
                offset.setValue(0);
              } else {
                offset.setValue(1);
              }
            }
          );
        }
      });
    },
    [
      indexAnim,
      shifting,
      navigationState.routes,
      offsetsAnims,
      rippleAnim,
      scale,
      tabsAnims,
    ]
  );

  React.useEffect(() => {
    // Workaround for native animated bug in react-native@^0.57
    // Context: https://github.com/callstack/react-native-paper/pull/637
    animateToIndex(navigationState.index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useIsKeyboardShown({
    onShow: handleKeyboardShow,
    onHide: handleKeyboardHide,
  });

  const prevNavigationState = React.useRef<NavigationState>();

  React.useEffect(() => {
    // Reset offsets of previous and current tabs before animation
    offsetsAnims.forEach(
      (offset: { setValue: (arg0: number) => void }, i: number | undefined) => {
        if (
          i === navigationState.index ||
          i === prevNavigationState.current?.index
        ) {
          offset.setValue(0);
        }
      }
    );

    animateToIndex(navigationState.index);
  }, [navigationState.index, animateToIndex, offsetsAnims]);

  const handleTabPress = (index: number) => {
    const event = {
      route: navigationState.routes[index],
      defaultPrevented: false,
      preventDefault: () => {
        event.defaultPrevented = true;
      },
    };

    onTabPress?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (index !== navigationState.index) {
      onIndexChange(index);
    }
  };

  const jumpTo = React.useCallback(
    (key: string) => {
      const index = navigationState.routes.findIndex(
        (route) => route.key === key
      );

      onIndexChange(index);
    },
    [navigationState.routes, onIndexChange]
  );

  const { routes } = navigationState;
  const { colors, dark: isDarkTheme, mode } = theme;

  const { backgroundColor: customBackground, elevation = 4 }: ViewStyle =
    StyleSheet.flatten(barStyle) || {};

  const approxBackgroundColor = customBackground
    ? customBackground
    : isDarkTheme && mode === 'adaptive'
    ? overlay(elevation, colors.surface)
    : colors.primary;

  const backgroundColor = shifting
    ? indexAnim.interpolate({
        inputRange: routes.map((_, i) => i),
        // FIXME: does outputRange support ColorValue or just strings?
        // @ts-expect-error
        outputRange: routes.map(
          (route) => getColor({ route }) || approxBackgroundColor
        ),
      })
    : approxBackgroundColor;

  const isDark =
    typeof approxBackgroundColor === 'string'
      ? !color(approxBackgroundColor).isLight()
      : true;

  const textColor = isDark ? white : black;
  const activeTintColor =
    typeof activeColor !== 'undefined' ? activeColor : textColor;
  const inactiveTintColor =
    typeof inactiveColor !== 'undefined'
      ? inactiveColor
      : color(textColor).alpha(0.5).rgb().string();

  const touchColor = color(activeColor || activeTintColor)
    .alpha(0.12)
    .rgb()
    .string();

  const maxTabWidth = routes.length > 3 ? MIN_TAB_WIDTH : MAX_TAB_WIDTH;
  const maxTabBarWidth = maxTabWidth * routes.length;

  const tabBarWidth = Math.min(layout.width, maxTabBarWidth);
  const tabWidth = tabBarWidth / routes.length;

  const rippleSize = layout.width / 4;

  const insets = {
    left: safeAreaInsets?.left ?? 0,
    right: safeAreaInsets?.right ?? 0,
    bottom: safeAreaInsets?.bottom ?? BOTTOM_INSET,
  };

  return (
    <View style={[styles.container, style]}>
      <Appbar {...{ dark, style, theme, ...rest }}>
        {children}
        <Surface
          style={
            [
              styles.bar,
              keyboardHidesNavigationBar
                ? {
                    // When the keyboard is shown, slide down the navigation bar
                    transform: [
                      {
                        translateY: visibleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layout.height, 0],
                        }),
                      },
                    ],
                    // Absolutely position the navigation bar so that the content is below it
                    // This is needed to avoid gap at bottom when the navigation bar is hidden
                    position: keyboardVisible ? 'absolute' : null,
                  }
                : null,
              barStyle,
            ] as StyleProp<ViewStyle>
          }
          pointerEvents={
            layout.measured
              ? keyboardHidesNavigationBar && keyboardVisible
                ? 'none'
                : 'auto'
              : 'none'
          }
          onLayout={onLayout}
        >
          <Animated.View style={[styles.barContent, { backgroundColor }]}>
            <View
              style={[
                styles.items,
                {
                  marginBottom: insets.bottom,
                  marginHorizontal: Math.max(insets.left, insets.right),
                  maxWidth: maxTabBarWidth,
                },
              ]}
              accessibilityRole={'tablist'}
            >
              {shifting ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.ripple,
                    {
                      // Since we have a single ripple, we have to reposition it so that it appears to expand from active tab.
                      // We need to move it from the top to center of the navigation bar and from the left to the active tab.
                      top: (BAR_HEIGHT - rippleSize) / 2,
                      left:
                        tabWidth * (navigationState.index + 0.5) -
                        rippleSize / 2,
                      height: rippleSize,
                      width: rippleSize,
                      borderRadius: rippleSize / 2,
                      backgroundColor: getColor({
                        route: routes[navigationState.index],
                      }),
                      transform: [
                        {
                          // Scale to twice the size  to ensure it covers the whole navigation bar
                          scale: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 8],
                          }),
                        },
                      ],
                      opacity: rippleAnim.interpolate({
                        inputRange: [0, MIN_RIPPLE_SCALE, 0.3, 1],
                        outputRange: [0, 0, 1, 1],
                      }),
                    },
                  ]}
                />
              ) : null}
              {routes.map((route, index) => {
                const focused = navigationState.index === index;
                const active = tabsAnims[index];

                // Scale the label up
                const scale2 =
                  labeled && shifting
                    ? active.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      })
                    : 1;

                // Move down the icon to account for no-label in shifting and smaller label in non-shifting.
                const translateY = labeled
                  ? shifting
                    ? active.interpolate({
                        inputRange: [0, 1],
                        outputRange: [7, 0],
                      })
                    : 0
                  : 7;

                // We render the active icon and label on top of inactive ones and cross-fade them on change.
                // This trick gives the illusion that we are animating between active and inactive colors.
                // This is to ensure that we can use native driver, as colors cannot be animated with native driver.
                const activeOpacity = active;
                const inactiveOpacity = active.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                });

                const badge = getBadge({ route });

                return renderTouchable({
                  key: route.key,
                  route,
                  borderless: true,
                  centered: true,
                  rippleColor: touchColor,
                  onPress: () => handleTabPress(index),
                  testID: getTestID({ route }),
                  accessibilityLabel: getAccessibilityLabel({ route }),
                  // @ts-expect-error We keep old a11y props for backwards compat with old RN versions
                  accessibilityTraits: focused
                    ? ['button', 'selected']
                    : 'button',
                  accessibilityComponentType: 'button',
                  accessibilityRole: Platform.OS === 'ios' ? 'button' : 'tab',
                  accessibilityState: { selected: focused },
                  style: styles.item,
                  children: (
                    <View pointerEvents="none">
                      <Animated.View
                        style={[
                          styles.iconContainer,
                          { transform: [{ translateY }] },
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.iconWrapper,
                            { opacity: activeOpacity },
                          ]}
                        >
                          {renderIcon ? (
                            renderIcon({
                              route,
                              focused: true,
                              color: activeTintColor,
                            })
                          ) : (
                            <Icon
                              source={route.icon as IconSource}
                              color={activeTintColor}
                              size={24}
                            />
                          )}
                        </Animated.View>
                        <Animated.View
                          style={[
                            styles.iconWrapper,
                            { opacity: inactiveOpacity },
                          ]}
                        >
                          {renderIcon ? (
                            renderIcon({
                              route,
                              focused: false,
                              color: inactiveTintColor,
                            })
                          ) : (
                            <Icon
                              source={route.icon as IconSource}
                              color={inactiveTintColor}
                              size={24}
                            />
                          )}
                        </Animated.View>
                        <View
                          style={[
                            styles.badgeContainer,
                            {
                              right:
                                (badge != null && typeof badge !== 'boolean'
                                  ? String(badge).length * -2
                                  : 0) - 2,
                            },
                          ]}
                        >
                          {typeof badge === 'boolean' ? (
                            <Badge visible={badge} size={8} />
                          ) : (
                            <Badge visible={badge != null} size={16}>
                              {badge}
                            </Badge>
                          )}
                        </View>
                      </Animated.View>
                      {labeled ? (
                        <Animated.View
                          style={[
                            styles.labelContainer,
                            { transform: [{ scale: scale2 }] },
                          ]}
                        >
                          <Animated.View
                            style={[
                              styles.labelWrapper,
                              { opacity: activeOpacity },
                            ]}
                          >
                            {renderLabel ? (
                              renderLabel({
                                route,
                                focused: true,
                                color: activeTintColor,
                              })
                            ) : (
                              <Text
                                style={[
                                  styles.label,
                                  { color: activeTintColor },
                                ]}
                              >
                                {getLabelText({ route })}
                              </Text>
                            )}
                          </Animated.View>
                          {shifting ? null : (
                            <Animated.View
                              style={[
                                styles.labelWrapper,
                                { opacity: inactiveOpacity },
                              ]}
                            >
                              {renderLabel ? (
                                renderLabel({
                                  route,
                                  focused: false,
                                  color: inactiveTintColor,
                                })
                              ) : (
                                <Text
                                  selectable={false}
                                  style={[
                                    styles.label,
                                    { color: inactiveTintColor },
                                  ]}
                                >
                                  {getLabelText({ route })}
                                </Text>
                              )}
                            </Animated.View>
                          )}
                        </Animated.View>
                      ) : (
                        <View style={styles.labelContainer} />
                      )}
                    </View>
                  ),
                });
              })}
            </View>
          </Animated.View>
        </Surface>
      </Appbar>
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {routes.map((route, index) => {
          if (!loaded.includes(route.key)) {
            // Don't render a screen if we've never navigated to it
            return null;
          }

          const focused = navigationState.index === index;

          const opacity = sceneAnimationEnabled
            ? tabsAnims[index]
            : focused
            ? 1
            : 0;

          const top = sceneAnimationEnabled
            ? offsetsAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, FAR_FAR_AWAY],
              })
            : focused
            ? 0
            : FAR_FAR_AWAY;

          return (
            <NavbarRouteScreen
              key={route.key}
              pointerEvents={focused ? 'auto' : 'none'}
              accessibilityElementsHidden={!focused}
              importantForAccessibility={
                focused ? 'auto' : 'no-hide-descendants'
              }
              index={index}
              visibility={opacity}
              style={[StyleSheet.absoluteFill, { opacity }]}
              collapsable={false}
              removeClippedSubviews={
                // On iOS, set removeClippedSubviews to true only when not focused
                // This is an workaround for a bug where the clipped view never re-appears
                Platform.OS === 'ios' ? navigationState.index !== index : true
              }
            >
              <Animated.View style={[styles.content, { top }]}>
                {renderScene({ route, jumpTo })}
              </Animated.View>
            </NavbarRouteScreen>
          );
        })}
      </View>
    </View>
  );
};

const SceneComponent = React.memo(({ component, ...rest }: any) =>
  React.createElement(component, rest)
);

Navbar.SceneMap = (scenes: {
  [key: string]: React.ComponentType<{
    route: Route;
    jumpTo: (key: string) => void;
  }>;
}) => {
  return ({
    route,
    jumpTo,
  }: {
    route: Route;
    jumpTo: (key: string) => void;
  }) => (
    <SceneComponent
      key={route.key}
      component={scenes[route.key ? route.key : '']}
      route={route}
      jumpTo={jumpTo}
    />
  );
};

export default withTheme(Navbar);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  bar: {
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 4,
  },
  barContent: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  items: {
    flexDirection: 'row',
    ...(Platform.OS === 'web'
      ? {
          width: '100%',
        }
      : null),
  },
  item: {
    flex: 1,
    // Top padding is 6 and bottom padding is 10
    // The extra 4dp bottom padding is offset by label's height
    paddingVertical: 6,
  },
  ripple: {
    position: 'absolute',
  },
  iconContainer: {
    height: 24,
    width: 24,
    marginTop: 2,
    marginHorizontal: 12,
    alignSelf: 'center',
  },
  iconWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  labelContainer: {
    height: 16,
    paddingBottom: 2,
  },
  labelWrapper: {
    ...StyleSheet.absoluteFillObject,
  },

  // eslint-disable-next-line react-native/no-color-literals
  label: {
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? {
          whiteSpace: 'nowrap',
          alignSelf: 'center',
        }
      : null),
  },
  badgeContainer: {
    position: 'absolute',
    left: 0,
    top: -2,
  },
});
