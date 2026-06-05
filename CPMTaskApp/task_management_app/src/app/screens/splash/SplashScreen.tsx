import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLinearGradient, SplashBackdrop } from '../../components';
import { styles } from '../../theme/styles';

export function SplashScreen({ progress }: { progress: number }) {
  const glowScale = useRef(new Animated.Value(1)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const topSparkleScale = useRef(new Animated.Value(1)).current;
  const bottomSparkleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createPulse = (
      value: Animated.Value,
      toValue: number,
      duration: number,
      delay = 0,
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    const glowAnimation = createPulse(glowScale, 1.14, 900);
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -10,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 10,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const topSparkleAnimation = createPulse(topSparkleScale, 1.28, 650, 120);
    const bottomSparkleAnimation = createPulse(bottomSparkleScale, 1.22, 700, 260);

    glowAnimation.start();
    floatAnimation.start();
    topSparkleAnimation.start();
    bottomSparkleAnimation.start();

    return () => {
      glowAnimation.stop();
      floatAnimation.stop();
      topSparkleAnimation.stop();
      bottomSparkleAnimation.stop();
    };
  }, [bottomSparkleScale, glowScale, logoFloat, topSparkleScale]);

  return (
    <SafeAreaView style={styles.splashOuter}>
      <View style={styles.splashPanel}>
        <SplashBackdrop />
        <View style={styles.splashContent}>
          <Animated.View
            style={[styles.splashLogoWrap, { transform: [{ translateY: logoFloat }] }]}>
            {/* <Animated.View
              style={[
                styles.splashGlowRing,
                { transform: [{ scale: glowScale }] },
              ]}
            /> */}
            <View style={styles.splashLogoCore}>
              <Text style={styles.splashLogoIcon}>✓</Text>
            </View>
            <Animated.View
              style={[
                styles.sparkleTop,
                { transform: [{ scale: topSparkleScale }] },
              ]}
            />
            <Animated.View
              style={[
                styles.sparkleBottom,
                { transform: [{ scale: bottomSparkleScale }] },
              ]}
            />
          </Animated.View>
          <Text style={styles.splashTitle}>TaskFlow</Text>
          <Text style={styles.splashSubtitle}>
            Manage Your Tasks, Master Your Time
          </Text>
          <View style={styles.progressTrack}>
            <AppLinearGradient
              colors={['rgba(255,255,255,0.98)', 'rgba(233,213,255,0.88)']}
              locations={[0, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFillBar, { width: `${progress}%` }]}
              fallback={
                <View
                  style={[
                    styles.progressFillBar,
                    styles.progressFillBarFallback,
                    { width: `${progress}%` },
                  ]}
                />
              }
            />
          </View>
          {/* <Text style={styles.progressLabel}>{progress}%</Text> */}
          {/* <View style={styles.loadingDots}>
            <View style={styles.loadingDot} />
            <View style={[styles.loadingDot, styles.loadingDotSoft]} />
            <View style={[styles.loadingDot, styles.loadingDotBright]} />
          </View> */}
        </View>
      </View>
    </SafeAreaView>
  );
}
