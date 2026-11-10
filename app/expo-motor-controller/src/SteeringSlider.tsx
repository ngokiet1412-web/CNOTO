import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface SteeringSliderProps {
  angle: number; // 0..180 (90 = center)
  autoCenter: boolean;
  onChange: (nextAngle: number) => void;
  onReleaseCenter?: () => void;
  onDragStateChange?: (dragging: boolean) => void;
}

export const SteeringSlider: React.FC<SteeringSliderProps> = ({
  angle,
  autoCenter,
  onChange,
  onReleaseCenter,
  onDragStateChange,
}) => {
  const trackWidthRef = useRef<number>(1);
  const [trackWidth, setTrackWidth] = useState<number>(0);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const autoCenterRef = useRef(autoCenter);
  autoCenterRef.current = autoCenter;

  const onReleaseCenterRef = useRef(onReleaseCenter);
  onReleaseCenterRef.current = onReleaseCenter;

  const onDragRef = useRef(onDragStateChange);
  onDragRef.current = onDragStateChange;

  const computeAngleFromX = (locationX: number) => {
    const width = Math.max(trackWidthRef.current, 1);
    const ratio = Math.min(1, Math.max(0, locationX / width));
    return Math.round(ratio * 180);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        onDragRef.current?.(true);
        onChangeRef.current(computeAngleFromX(evt.nativeEvent.locationX));
      },
      onPanResponderMove: (evt) => {
        onChangeRef.current(computeAngleFromX(evt.nativeEvent.locationX));
      },
      onPanResponderRelease: () => {
        onDragRef.current?.(false);
        if (autoCenterRef.current) {
          onReleaseCenterRef.current?.();
        }
      },
      onPanResponderTerminate: () => {
        onDragRef.current?.(false);
        if (autoCenterRef.current) {
          onReleaseCenterRef.current?.();
        }
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const clamped = Math.min(180, Math.max(0, angle));
  const ratio = clamped / 180;
  const thumbLeft = trackWidth > 0 ? ratio * trackWidth : 0;

  // Fill bar originates from 50% center (90 deg) outward left or right!
  const fillLeftPct = clamped >= 90 ? 50 : (clamped / 180) * 100;
  const fillWidthPct = (Math.abs(clamped - 90) / 180) * 100;
  const accentColor =
    clamped === 90 ? '#a855f7' : clamped < 90 ? '#38bdf8' : '#c084fc';

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
              styles.trackFillFromCenter,
              {
                left: `${fillLeftPct}%`,
                width: `${fillWidthPct}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
          <View style={styles.centerTickLine} />
        </View>

        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: Math.max(0, Math.min(Math.max(0, trackWidth - 30), thumbLeft - 15)),
              borderColor: accentColor,
            },
          ]}
        >
          <View style={[styles.thumbInner, { backgroundColor: accentColor }]} />
        </View>
      </View>

      <View style={styles.ticksRow}>
        <Text style={styles.tickLabel}>◀ Trái (0°)</Text>
        <Text style={styles.tickLabel}>45°</Text>
        <Text style={styles.tickCenterLabel}>90° (Giữa)</Text>
        <Text style={styles.tickLabel}>135°</Text>
        <Text style={styles.tickLabel}>Phải (180°) ▶</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  touchArea: {
    height: 46,
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
    position: 'relative',
  },
  trackFillFromCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  centerTickLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: '#fde047',
  },
  thumb: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
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
  tickCenterLabel: {
    fontSize: 11,
    color: '#fde047',
    fontWeight: '800',
  },
});
