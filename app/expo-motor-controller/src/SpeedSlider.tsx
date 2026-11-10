import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MotorDirection } from './types';

interface SpeedSliderProps {
  value: number; // 0..100
  direction: MotorDirection;
  onChange: (nextVal: number) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

export const SpeedSlider: React.FC<SpeedSliderProps> = ({
  value,
  direction,
  onChange,
  onDragStateChange,
}) => {
  const trackWidthRef = useRef<number>(1);
  const [trackWidth, setTrackWidth] = useState<number>(0);

  // Giữ callback mới nhất tránh stale closure trong PanResponder
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onDragRef = useRef(onDragStateChange);
  onDragRef.current = onDragStateChange;

  const computePercentFromX = (locationX: number) => {
    const width = Math.max(trackWidthRef.current, 1);
    const ratio = Math.min(1, Math.max(0, locationX / width));
    return Math.round(ratio * 100);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        onDragRef.current?.(true);
        const pct = computePercentFromX(evt.nativeEvent.locationX);
        onChangeRef.current(pct);
      },
      onPanResponderMove: (evt) => {
        const pct = computePercentFromX(evt.nativeEvent.locationX);
        onChangeRef.current(pct);
      },
      onPanResponderRelease: () => {
        onDragRef.current?.(false);
      },
      onPanResponderTerminate: () => {
        onDragRef.current?.(false);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const activeColor =
    direction === 'FWD'
      ? '#10b981'
      : direction === 'REV'
      ? '#f59e0b'
      : '#38bdf8';

  const clampedValue = Math.min(100, Math.max(0, value));
  const thumbLeft = trackWidth > 0 ? (clampedValue / 100) * trackWidth : 0;

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.touchArea}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View pointerEvents="none" style={styles.trackBg}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${clampedValue}%`,
                backgroundColor: activeColor,
              },
            ]}
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: Math.max(0, Math.min(Math.max(0, trackWidth - 28), thumbLeft - 14)),
              borderColor: activeColor,
            },
          ]}
        >
          <View style={[styles.thumbInner, { backgroundColor: activeColor }]} />
        </View>
      </View>

      <View style={styles.ticksRow}>
        {[0, 20, 40, 60, 80, 100].map((tick) => (
          <Text
            key={tick}
            style={[
              styles.tickLabel,
              clampedValue >= tick && tick > 0 ? { color: activeColor } : null,
            ]}
          >
            {tick}%
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  touchArea: {
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 7,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ticksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 2,
  },
  tickLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
