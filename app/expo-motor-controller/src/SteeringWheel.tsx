import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  NativeTouchEvent,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { CockpitTheme } from './types';

interface SteeringWheelProps {
  servoAngle: number; // 0..180 (0 = Trái, 90 = Giữa, 180 = Phải)
  size: number;
  theme: CockpitTheme;
  onSteerChange: (nextServoAngle: number) => void;
  onSteerRelease: () => void;
}

const ARC_TICKS = [-90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

function normalizeDeltaDeg(delta: number): number {
  let d = delta;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export const SteeringWheel: React.FC<SteeringWheelProps> = ({
  servoAngle,
  size,
  theme,
  onSteerChange,
  onSteerRelease,
}) => {
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeTouchIdRef = useRef<string | number | null>(null);
  const prevFingerDegRef = useRef<number>(0);
  const prevLocalXRef = useRef<number>(0);
  const wheelDegRef = useRef<number>(0);
  const crossedCenterTickRef = useRef<boolean>(true);

  const [isGrabbing, setIsGrabbing] = useState(false);

  const onChangeRef = useRef(onSteerChange);
  onChangeRef.current = onSteerChange;
  const onReleaseRef = useRef(onSteerRelease);
  onReleaseRef.current = onSteerRelease;

  const handleTouchStart = (e: GestureResponderEvent) => {
    if (activeTouchIdRef.current !== null) return;
    const touch = e.nativeEvent.changedTouches[0] ?? e.nativeEvent.touches[0];
    if (!touch) return;

    // Gốc tọa độ thực của khung Vô-lăng trên màn hình tính tức thì (đồng bộ 0ms)
    originRef.current = {
      x: touch.pageX - touch.locationX,
      y: touch.pageY - touch.locationY,
    };
    activeTouchIdRef.current = touch.identifier;
    setIsGrabbing(true);

    const x = touch.locationX;
    const y = touch.locationY;
    const cx = size / 2;
    const cy = size / 2;
    const dx = x - cx;
    const dy = y - cy;

    prevLocalXRef.current = x;
    prevFingerDegRef.current = (Math.atan2(dy, dx) * 180) / Math.PI;
    wheelDegRef.current = Math.max(-90, Math.min(90, servoAngle - 90));
    crossedCenterTickRef.current = Math.abs(wheelDegRef.current) <= 3;

    try {
      Vibration.vibrate(8);
    } catch {
      // ignore
    }
  };

  const handleTouchMove = (e: GestureResponderEvent) => {
    const id = activeTouchIdRef.current;
    if (id === null) return;

    const touches = e.nativeEvent.touches;
    let matched: NativeTouchEvent | undefined;
    for (let i = 0; i < touches.length; i++) {
      if (touches[i].identifier === id) {
        matched = touches[i];
        break;
      }
    }
    if (!matched) return;

    const x = matched.pageX - originRef.current.x;
    const y = matched.pageY - originRef.current.y;
    const cx = size / 2;
    const cy = size / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);

    let nextWheelDeg = wheelDegRef.current;

    if (dist >= size * 0.14) {
      const curFingerDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const delta = normalizeDeltaDeg(curFingerDeg - prevFingerDegRef.current);
      prevFingerDegRef.current = curFingerDeg;
      // Tỷ số truyền 1.18x giúp lắc nhẹ cổ tay/ngón cái đã hết lái mượt mà
      nextWheelDeg = Math.max(-90, Math.min(90, wheelDegRef.current + delta * 1.18));
    } else {
      // Vùng gần tâm: hỗ trợ kéo ngang mượt không bị nhảy góc atan2
      const dxStep = x - prevLocalXRef.current;
      nextWheelDeg = Math.max(
        -90,
        Math.min(90, wheelDegRef.current + (dxStep / (size * 0.36)) * 90)
      );
    }

    prevLocalXRef.current = x;

    // Rung nhẹ khi đi ngang điểm cân bằng 0 độ (90° Servo)
    const nearCenter = Math.abs(nextWheelDeg) <= 2.5;
    if (nearCenter && !crossedCenterTickRef.current) {
      crossedCenterTickRef.current = true;
      try {
        Vibration.vibrate(6);
      } catch {
        // ignore
      }
    } else if (!nearCenter && Math.abs(nextWheelDeg) > 6) {
      crossedCenterTickRef.current = false;
    }

    wheelDegRef.current = nextWheelDeg;
    const nextServo = Math.round(90 + nextWheelDeg);
    onChangeRef.current(nextServo);
  };

  const finishTouchIfEnded = (e: GestureResponderEvent) => {
    const id = activeTouchIdRef.current;
    if (id === null) return;

    const changed = e.nativeEvent.changedTouches;
    let ended = false;
    for (let i = 0; i < changed.length; i++) {
      if (changed[i].identifier === id) {
        ended = true;
        break;
      }
    }
    if (!ended) {
      let stillPresent = false;
      const active = e.nativeEvent.touches;
      for (let i = 0; i < active.length; i++) {
        if (active[i].identifier === id) {
          stillPresent = true;
          break;
        }
      }
      if (!stillPresent) ended = true;
    }

    if (ended) {
      activeTouchIdRef.current = null;
      wheelDegRef.current = 0;
      setIsGrabbing(false);
      onReleaseRef.current();
    }
  };

  const wheelDeg = Math.max(-90, Math.min(90, servoAngle - 90));
  const outerRingSize = size * 0.84;
  const rimThickness = Math.max(18, Math.round(size * 0.105));
  const innerRimSize = outerRingSize - rimThickness * 2;
  const hubSize = Math.round(outerRingSize * 0.34);
  const arcRadius = size * 0.475;

  const steerText =
    Math.abs(wheelDeg) <= 2
      ? 'THẲNG LÁI • 0°'
      : wheelDeg < 0
      ? `◀ TRÁI ${Math.abs(wheelDeg)}°`
      : `PHẢI ${wheelDeg}° ▶`;

  return (
    <View style={styles.columnWrap}>
      <View
        pointerEvents="box-only"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={finishTouchIfEnded}
        onTouchCancel={finishTouchIfEnded}
        style={[styles.touchStage, { width: size, height: size }]}
      >
        {/* Vòng vạch LED báo góc đánh lái quanh nửa trên Vô-lăng */}
        {ARC_TICKS.map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const tx = size / 2 + Math.cos(rad) * arcRadius;
          const ty = size / 2 + Math.sin(rad) * arcRadius;
          const isCenter = deg === 0;
          const isMajor = deg % 30 === 0;
          const isLit =
            (wheelDeg < -2 && deg < 0 && deg >= wheelDeg) ||
            (wheelDeg > 2 && deg > 0 && deg <= wheelDeg);

          return (
            <View
              key={deg}
              style={[
                styles.arcTick,
                {
                  width: isCenter ? 4 : isMajor ? 3 : 2,
                  height: isCenter ? 11 : isMajor ? 8 : 5,
                  left: tx - (isCenter ? 2 : 1.5),
                  top: ty - (isCenter ? 5.5 : 4),
                  backgroundColor: isCenter
                    ? '#fde047'
                    : isLit
                    ? theme.primary
                    : '#263244',
                  opacity: isCenter || isLit ? 1 : isMajor ? 0.85 : 0.45,
                  transform: [{ rotate: `${deg}deg` }],
                },
              ]}
            />
          );
        })}

        {/* Hào quang nhẹ khi chạm xoay vô-lăng */}
        <View
          style={[
            styles.ambientHalo,
            {
              width: outerRingSize + 10,
              height: outerRingSize + 10,
              borderRadius: (outerRingSize + 10) / 2,
              borderColor: isGrabbing ? theme.primary : '#1e293b',
              backgroundColor: isGrabbing ? theme.softBg : 'rgba(15, 23, 42, 0.35)',
            },
          ]}
        />

        {/* KHỐI VÔ-LĂNG THỂ THAO XOAY THEO NGÓN TAY */}
        <View
          style={[
            styles.wheelBody,
            {
              width: outerRingSize,
              height: outerRingSize,
              borderRadius: outerRingSize / 2,
              borderWidth: rimThickness,
              borderColor: isGrabbing ? '#273549' : '#1c2636',
              transform: [{ rotate: `${wheelDeg}deg` }],
            },
          ]}
        >
          {/* Viền chỉ khâu kim loại mảnh bên trong vành da */}
          <View
            style={[
              styles.innerStitchRing,
              {
                width: innerRimSize + 4,
                height: innerRimSize + 4,
                borderRadius: (innerRimSize + 4) / 2,
                borderColor: isGrabbing ? theme.border : '#334155',
              },
            ]}
          />

          {/* Vạch định tâm 12 giờ chuẩn vô-lăng xe đua */}
          <View
            style={[
              styles.topCenterStripe,
              {
                top: -rimThickness - 1,
                height: rimThickness + 2,
                backgroundColor: theme.primary,
              },
            ]}
          />

          {/* Đệm tỳ ngón cái 2 bên vành 9h - 3h */}
          <View
            style={[
              styles.thumbGripLeft,
              {
                left: -rimThickness * 0.72,
                height: outerRingSize * 0.24,
              },
            ]}
          />
          <View
            style={[
              styles.thumbGripRight,
              {
                right: -rimThickness * 0.72,
                height: outerRingSize * 0.24,
              },
            ]}
          />

          {/* Nan ngang Trái - Phải của Vô-lăng 3 chấu */}
          <View
            style={[
              styles.horizontalSpokeBar,
              {
                width: innerRimSize + 6,
                height: Math.max(18, outerRingSize * 0.12),
              },
            ]}
          >
            <View style={styles.spokeAccentSlot}>
              <View style={[styles.spokeMiniLed, { backgroundColor: theme.primary }]} />
            </View>
            <View style={{ width: hubSize * 0.85 }} />
            <View style={styles.spokeAccentSlot}>
              <View style={[styles.spokeMiniLed, { backgroundColor: '#ef4444' }]} />
            </View>
          </View>

          {/* Chấu dọc dưới đáy (Twin-spoke thể thao) */}
          <View
            style={[
              styles.bottomSpokeWrap,
              {
                height: innerRimSize * 0.52,
                width: Math.max(24, outerRingSize * 0.16),
              },
            ]}
          >
            <View style={styles.bottomSpokeCutout} />
          </View>

          {/* Nắp còi / Logo trung tâm Vô-lăng */}
          <View
            style={[
              styles.centerHub,
              {
                width: hubSize,
                height: hubSize,
                borderRadius: hubSize / 2,
                borderColor: isGrabbing ? theme.primary : '#475569',
              },
            ]}
          >
            <View
              style={[
                styles.hubInnerBadge,
                {
                  width: hubSize * 0.74,
                  height: hubSize * 0.74,
                  borderRadius: (hubSize * 0.74) / 2,
                },
              ]}
            >
              <Text style={[styles.hubBrandText, { color: theme.secondary }]}>RC</Text>
              <Text style={styles.hubSubText}>SPORT</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Thanh báo góc lái dưới chân Vô-lăng */}
      <View
        style={[
          styles.angleReadoutPill,
          isGrabbing && { borderColor: theme.border, backgroundColor: theme.softBg },
        ]}
      >
        <Text
          style={[
            styles.angleReadoutText,
            { color: Math.abs(wheelDeg) <= 2 ? '#cbd5e1' : theme.secondary },
          ]}
        >
          {steerText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  columnWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchStage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  arcTick: {
    position: 'absolute',
    borderRadius: 2,
  },
  ambientHalo: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  wheelBody: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  innerStitchRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  topCenterStripe: {
    position: 'absolute',
    width: 9,
    borderRadius: 3,
    zIndex: 10,
  },
  thumbGripLeft: {
    position: 'absolute',
    width: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
  },
  thumbGripRight: {
    position: 'absolute',
    width: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
  },
  horizontalSpokeBar: {
    position: 'absolute',
    backgroundColor: '#1e293b',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  spokeAccentSlot: {
    width: 16,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  spokeMiniLed: {
    width: 6,
    height: 4,
    borderRadius: 2,
  },
  bottomSpokeWrap: {
    position: 'absolute',
    bottom: -2,
    backgroundColor: '#1e293b',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bottomSpokeCutout: {
    width: 6,
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
  },
  centerHub: {
    backgroundColor: '#162032',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    elevation: 5,
  },
  hubInnerBadge: {
    backgroundColor: '#0b111e',
    borderWidth: 1,
    borderColor: '#273549',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBrandText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  hubSubText: {
    fontSize: 7.5,
    color: '#64748b',
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: -1,
  },
  angleReadoutPill: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  angleReadoutText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
