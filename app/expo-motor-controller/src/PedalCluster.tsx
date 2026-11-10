import React, { useCallback, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  NativeTouchEvent,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { CockpitTheme, GearPosition } from './types';

interface PedalClusterProps {
  gear: GearPosition;
  pedalPct: number;
  isBraking: boolean;
  availableHeight: number;
  theme: CockpitTheme;
  onChangeGear: (gear: GearPosition) => void;
  onGasChange: (pct: number) => void;
  onGasRelease: () => void;
  onBrakeStart: () => void;
  onBrakeEnd: () => void;
}

const GEARS: { key: GearPosition; sub: string }[] = [
  { key: 'P', sub: 'ĐỖ' },
  { key: 'R', sub: 'LÙI' },
  { key: 'N', sub: 'MO' },
  { key: 'D', sub: 'TIẾN' },
];

export const PedalCluster: React.FC<PedalClusterProps> = ({
  gear,
  pedalPct,
  isBraking,
  availableHeight,
  theme,
  onChangeGear,
  onGasChange,
  onGasRelease,
  onBrakeStart,
  onBrakeEnd,
}) => {
  const gasOriginYRef = useRef<number>(0);
  const gasLayoutHeightRef = useRef<number>(240);
  const gasTouchIdRef = useRef<string | number | null>(null);
  const brakeTouchIdRef = useRef<string | number | null>(null);

  const [isPressingGas, setIsPressingGas] = useState(false);

  const onGasChangeRef = useRef(onGasChange);
  onGasChangeRef.current = onGasChange;
  const onGasReleaseRef = useRef(onGasRelease);
  onGasReleaseRef.current = onGasRelease;

  const handleGasLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) gasLayoutHeightRef.current = h;
  }, []);

  const computeGasPctFromLocalY = (localY: number): number => {
    const h = Math.max(1, gasLayoutHeightRef.current);
    const topPad = h * 0.1;
    const botPad = h * 0.08;
    const usable = Math.max(1, h - topPad - botPad);
    // localY nhỏ (phía đỉnh bàn đạp) -> 100%; localY lớn (phía đáy bàn đạp) -> ~18% ga rà nhẹ
    const ratioFromBottom = Math.min(1, Math.max(0, 1 - (localY - topPad) / usable));
    return Math.round(18 + ratioFromBottom * 82);
  };

  const handleGasTouchStart = (e: GestureResponderEvent) => {
    if (gasTouchIdRef.current !== null) return;
    const touch = e.nativeEvent.changedTouches[0] ?? e.nativeEvent.touches[0];
    if (!touch) return;

    gasOriginYRef.current = touch.pageY - touch.locationY;
    gasTouchIdRef.current = touch.identifier;
    setIsPressingGas(true);

    try {
      Vibration.vibrate(10);
    } catch {
      // ignore
    }

    const pct = computeGasPctFromLocalY(touch.locationY);
    onGasChangeRef.current(pct);
  };

  const handleGasTouchMove = (e: GestureResponderEvent) => {
    const id = gasTouchIdRef.current;
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

    const localY = matched.pageY - gasOriginYRef.current;
    const pct = computeGasPctFromLocalY(localY);
    onGasChangeRef.current(pct);
  };

  const finishGasIfEnded = (e: GestureResponderEvent) => {
    const id = gasTouchIdRef.current;
    if (id === null) return;

    let ended = false;
    const changed = e.nativeEvent.changedTouches;
    for (let i = 0; i < changed.length; i++) {
      if (changed[i].identifier === id) {
        ended = true;
        break;
      }
    }
    if (!ended) {
      let stillActive = false;
      const touches = e.nativeEvent.touches;
      for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === id) {
          stillActive = true;
          break;
        }
      }
      if (!stillActive) ended = true;
    }

    if (ended) {
      gasTouchIdRef.current = null;
      setIsPressingGas(false);
      onGasReleaseRef.current();
    }
  };

  // Xử lý bàn đạp Phanh độc lập hoàn toàn cho đa điểm mượt mà
  const handleBrakeTouchStart = (e: GestureResponderEvent) => {
    if (brakeTouchIdRef.current !== null) return;
    const touch = e.nativeEvent.changedTouches[0] ?? e.nativeEvent.touches[0];
    if (!touch) return;
    brakeTouchIdRef.current = touch.identifier;
    onBrakeStart();
  };

  const finishBrakeIfEnded = (e: GestureResponderEvent) => {
    const id = brakeTouchIdRef.current;
    if (id === null) return;

    let ended = false;
    const changed = e.nativeEvent.changedTouches;
    for (let i = 0; i < changed.length; i++) {
      if (changed[i].identifier === id) {
        ended = true;
        break;
      }
    }
    if (!ended) {
      let stillActive = false;
      const touches = e.nativeEvent.touches;
      for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === id) {
          stillActive = true;
          break;
        }
      }
      if (!stillActive) ended = true;
    }

    if (ended) {
      brakeTouchIdRef.current = null;
      onBrakeEnd();
    }
  };

  const lockedGear = gear === 'P' || gear === 'N';
  const gasAccent = lockedGear ? '#64748b' : theme.primary;
  const pedalHeight = Math.max(210, Math.min(310, availableHeight - 10));

  return (
    <View style={[styles.rightZoneRow, { height: pedalHeight }]}>
      {/* CỘT TRONG: CẦN SỐ P-R-N-D (TRÊN) + BÀN ĐẠP PHANH (DƯỚI) */}
      <View style={styles.innerControlCol}>
        {/* Hộp số tự động P - R - N - D */}
        <View style={styles.shifterBox}>
          <Text style={styles.shifterCaption}>HỘP SỐ</Text>
          <View style={styles.shifterGate}>
            {GEARS.map((item) => {
              const active = gear === item.key;
              const activeColor =
                item.key === 'P'
                  ? '#ef4444'
                  : item.key === 'R'
                  ? '#f59e0b'
                  : item.key === 'N'
                  ? '#cbd5e1'
                  : theme.primary;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => onChangeGear(item.key)}
                  style={[
                    styles.gearSlotBtn,
                    active && {
                      backgroundColor: 'rgba(15, 23, 42, 0.96)',
                      borderColor: activeColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.gearLetter,
                      active && { color: activeColor, fontWeight: '900' },
                    ]}
                  >
                    {item.key}
                  </Text>
                  <Text
                    style={[
                      styles.gearSubLabel,
                      active && { color: '#e2e8f0' },
                    ]}
                  >
                    {item.sub}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BÀN ĐẠP CHÂN PHANH */}
        <View
          pointerEvents="box-only"
          onTouchStart={handleBrakeTouchStart}
          onTouchEnd={finishBrakeIfEnded}
          onTouchCancel={finishBrakeIfEnded}
          style={[
            styles.brakePedal,
            isBraking && styles.brakePedalPressed,
          ]}
        >
          <View style={styles.brakeTopLightStrip}>
            <View
              style={[
                styles.brakeTopLed,
                { backgroundColor: isBraking ? '#ef4444' : '#451a1a' },
              ]}
            />
          </View>

          {/* Các rãnh cao su chống trượt bàn đạp Phanh */}
          <View style={styles.brakeTreadsWrap}>
            {[0, 1, 2].map((r) => (
              <View
                key={r}
                style={[
                  styles.brakeTreadBar,
                  isBraking && { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.brakeTitle, isBraking && { color: '#fecaca' }]}>
            PHANH
          </Text>
        </View>
      </View>

      {/* CỘT NGOÀI CÙNG BÊN PHẢI: BÀN ĐẠP GA THỂ THAO DÀI (VUỐT 0 -> 100%) */}
      <View
        onLayout={handleGasLayout}
        pointerEvents="box-only"
        onTouchStart={handleGasTouchStart}
        onTouchMove={handleGasTouchMove}
        onTouchEnd={finishGasIfEnded}
        onTouchCancel={finishGasIfEnded}
        style={[
          styles.gasPedalOuter,
          isPressingGas && {
            borderColor: gasAccent,
            transform: [{ scale: 0.985 }],
          },
        ]}
      >
        {/* Lớp dải sáng dâng từ đáy lên theo mức đạp ga */}
        <View
          style={[
            styles.gasFillBg,
            {
              height: `${pedalPct}%`,
              backgroundColor: lockedGear
                ? 'rgba(100, 116, 139, 0.24)'
                : theme.softBg,
              borderTopWidth: pedalPct > 0 ? 2 : 0,
              borderTopColor: gasAccent,
            },
          ]}
        />

        {/* Đầu hiển thị % ga hiện tại */}
        <View style={styles.gasHeaderBadge}>
          <Text style={[styles.gasPctValue, { color: pedalPct > 0 ? gasAccent : '#94a3b8' }]}>
            {pedalPct}%
          </Text>
          <Text style={styles.gasTopHint}>MAX</Text>
        </View>

        {/* Các rãnh kim loại dọc chuẩn chân ga xe thể thao */}
        <View style={styles.gasMetalPlate}>
          {[100, 75, 50, 25].map((mark) => {
            const lit = pedalPct >= mark && !lockedGear;
            return (
              <View key={mark} style={styles.gasScaleRow}>
                <View
                  style={[
                    styles.gasGripSlot,
                    lit && {
                      backgroundColor: theme.primary,
                      borderColor: theme.secondary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.gasGripSlot,
                    lit && {
                      backgroundColor: theme.primary,
                      borderColor: theme.secondary,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Chân bàn đạp Ga */}
        <View style={styles.gasFooterWrap}>
          {isPressingGas && lockedGear ? (
            <Text style={styles.lockedGearWarn}>ĐANG SỐ {gear}</Text>
          ) : (
            <Text
              style={[
                styles.gasLabelText,
                isPressingGas && !lockedGear && { color: theme.secondary },
              ]}
            >
              {gear === 'R' ? 'GA LÙI' : 'CHÂN GA'}
            </Text>
          )}
          <Text style={styles.gasSubHint}>Chạm / Vuốt lên</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rightZoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  innerControlCol: {
    width: 96,
    justifyContent: 'space-between',
    gap: 8,
  },
  shifterBox: {
    flex: 1.25,
    backgroundColor: '#0c1322',
    borderRadius: 13,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'space-between',
  },
  shifterCaption: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  shifterGate: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 4,
  },
  gearSlotBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#131d31',
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },
  gearLetter: {
    color: '#64748b',
    fontSize: 13.5,
    fontWeight: '800',
  },
  gearSubLabel: {
    color: '#475569',
    fontSize: 9.5,
    fontWeight: '800',
  },
  brakePedal: {
    flex: 0.92,
    backgroundColor: '#171f30',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 5,
  },
  brakePedalPressed: {
    backgroundColor: '#2c1219',
    borderColor: '#ef4444',
    transform: [{ scale: 0.96 }],
  },
  brakeTopLightStrip: {
    width: '100%',
    alignItems: 'center',
  },
  brakeTopLed: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
  },
  brakeTreadsWrap: {
    width: '100%',
    gap: 6,
  },
  brakeTreadBar: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: '#29374d',
  },
  brakeTitle: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  gasPedalOuter: {
    width: 102,
    backgroundColor: '#141d2f',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2c3c56',
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    elevation: 6,
  },
  gasFillBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  gasHeaderBadge: {
    alignItems: 'center',
    zIndex: 2,
  },
  gasPctValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  gasTopHint: {
    color: '#475569',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  gasMetalPlate: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-evenly',
    paddingVertical: 6,
    zIndex: 2,
  },
  gasScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  gasGripSlot: {
    width: 14,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#0b111e',
    borderWidth: 1,
    borderColor: '#29374d',
  },
  gasFooterWrap: {
    alignItems: 'center',
    zIndex: 2,
  },
  gasLabelText: {
    color: '#e2e8f0',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  gasSubHint: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 1,
  },
  lockedGearWarn: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
  },
});
