import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CockpitTheme, Esp32Telemetry, GearPosition } from './types';

interface CenterClusterProps {
  telemetry: Esp32Telemetry;
  gear: GearPosition;
  speedPct: number;
  isBraking: boolean;
  servoAngle: number;
  peakKmh: number;
  gaugeSize: number;
  theme: CockpitTheme;
  onResetTrip: () => void;
}

const TOTAL_SEGMENTS = 27;
const START_DEG = -126;
const END_DEG = 126;
const MAX_GAUGE_RPM = 600;

export const CenterCluster: React.FC<CenterClusterProps> = ({
  telemetry,
  gear,
  speedPct,
  isBraking,
  servoAngle,
  peakKmh,
  gaugeSize,
  theme,
  onResetTrip,
}) => {
  const rpm = Math.max(0, Number(telemetry.rpm ?? 0));
  const kmh = Math.max(0, Number(telemetry.kmh ?? 0));
  const distM = Math.max(0, Number(telemetry.distM ?? 0));

  // Tỷ lệ lấp đầy vòng tua RPM (ưu tiên RPM thực từ Encoder; nếu bánh chưa chạm/chưa quay thì nhá nhẹ theo % ga)
  const rpmRatio = Math.min(1, rpm / MAX_GAUGE_RPM);
  const ghostThrottleRatio = speedPct / 100;
  const activeSegments = Math.round(rpmRatio * TOTAL_SEGMENTS);
  const ghostSegments = Math.round(ghostThrottleRatio * TOTAL_SEGMENTS);

  const ringRadius = gaugeSize * 0.445;
  const center = gaugeSize / 2;

  // Góc bánh trước mô phỏng trên khung xe mini (-38° .. +38°)
  const visualFrontWheelDeg = Math.max(
    -38,
    Math.min(38, ((servoAngle - 90) / 90) * 38)
  );

  const gearBadgeColor =
    gear === 'P'
      ? '#ef4444'
      : gear === 'R'
      ? '#f59e0b'
      : gear === 'N'
      ? '#94a3b8'
      : theme.primary;

  const rearDriveActive = speedPct > 0 && (gear === 'D' || gear === 'R') && !isBraking;

  return (
    <View style={styles.clusterWrap}>
      {/* VÒNG ĐỒNG HỒ DIGITAL SPORT LỚN Ở GIỮA */}
      <View style={[styles.gaugeBox, { width: gaugeSize, height: gaugeSize * 0.88 }]}>
        {/* Nền đĩa đồng hồ sâu kiểu buồng lái siêu xe */}
        <View
          style={[
            styles.gaugeDialBg,
            {
              width: gaugeSize * 0.78,
              height: gaugeSize * 0.78,
              borderRadius: (gaugeSize * 0.78) / 2,
              top: gaugeSize * 0.08,
              borderColor: isBraking
                ? 'rgba(239, 68, 68, 0.55)'
                : theme.softBg,
            },
          ]}
        />

        {/* Dải 27 vạch LED vòng tua RPM ôm cung 252 độ */}
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, idx) => {
          const frac = idx / (TOTAL_SEGMENTS - 1);
          const deg = START_DEG + frac * (END_DEG - START_DEG);
          const rad = ((deg - 90) * Math.PI) / 180;
          const x = center + Math.cos(rad) * ringRadius;
          const y = center * 0.96 + Math.sin(rad) * ringRadius;

          const isRedline = idx >= TOTAL_SEGMENTS - 5;
          const isLitByRpm = idx < activeSegments && rpm > 0.1;
          const isGhostLit = !isLitByRpm && idx < ghostSegments && rearDriveActive;

          let segColor = '#1e293b';
          let segOpacity = 0.75;
          if (isLitByRpm) {
            segColor = isRedline ? '#ef4444' : theme.primary;
            segOpacity = 1;
          } else if (isGhostLit) {
            segColor = isRedline ? '#ef4444' : theme.secondary;
            segOpacity = 0.42;
          } else if (isRedline) {
            segColor = '#451a1a';
          }

          const segHeight = idx % 3 === 0 ? 12 : 9;
          const segWidth = idx % 3 === 0 ? 4.5 : 3.5;

          return (
            <View
              key={idx}
              style={[
                styles.rpmSegment,
                {
                  width: segWidth,
                  height: segHeight,
                  left: x - segWidth / 2,
                  top: y - segHeight / 2,
                  backgroundColor: segColor,
                  opacity: segOpacity,
                  transform: [{ rotate: `${deg}deg` }],
                },
              ]}
            />
          );
        })}

        {/* Nhãn dải vòng tua ở 2 chân cung đồng hồ */}
        <Text style={[styles.scaleLeftLabel, { bottom: 6, left: gaugeSize * 0.13 }]}>
          0
        </Text>
        <Text style={[styles.scaleRightLabel, { bottom: 6, right: gaugeSize * 0.1 }]}>
          600 RPM
        </Text>

        {/* TRUNG TÂM ĐỒNG HỒ: SỐ P/R/N/D + VẬN TỐC KM/H + RPM */}
        <View style={[styles.gaugeCenterContent, { top: gaugeSize * 0.15 }]}>
          {/* Ô báo số P - R - N - D cỡ lớn chuẩn táp-lô xe thể thao */}
          <View style={styles.prndStrip}>
            {(['P', 'R', 'N', 'D'] as GearPosition[]).map((g) => {
              const active = gear === g;
              const activeCol =
                g === 'P'
                  ? '#ef4444'
                  : g === 'R'
                  ? '#f59e0b'
                  : g === 'N'
                  ? '#cbd5e1'
                  : theme.secondary;
              return (
                <View
                  key={g}
                  style={[
                    styles.prndMiniItem,
                    active && {
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: activeCol,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.prndMiniText,
                      active && {
                        color: activeCol,
                        fontSize: 15,
                        fontWeight: '900',
                      },
                    ]}
                  >
                    {g}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Chữ số vận tốc km/h chính */}
          <Text
            style={[
              styles.speedNumber,
              {
                fontSize: Math.max(34, Math.round(gaugeSize * 0.22)),
                lineHeight: Math.max(38, Math.round(gaugeSize * 0.24)),
                color: isBraking ? '#fca5a5' : '#f8fafc',
              },
            ]}
          >
            {kmh < 10 ? kmh.toFixed(2) : kmh.toFixed(1)}
          </Text>
          <Text style={[styles.speedUnit, { color: gearBadgeColor }]}>km/h</Text>

          {/* Dòng phụ: Vòng tua thực tế & Mức ga PWM */}
          <View style={styles.rpmSubPill}>
            <Text style={styles.rpmSubText}>
              {Math.round(rpm)} RPM
            </Text>
            <View style={styles.dotSep} />
            <Text
              style={[
                styles.rpmSubText,
                { color: isBraking ? '#f87171' : theme.secondary },
              ]}
            >
              {isBraking ? 'PHANH' : `GA ${speedPct}%`}
            </Text>
          </View>
        </View>
      </View>

      {/* DẢI DƯỚI TÁP-LÔ: MÔ HÌNH KHUNG XE 4 BÁNH + ODOMETER QUÃNG ĐƯỜNG */}
      <View style={styles.bottomHudCard}>
        {/* Mô hình Khung xe 4 bánh trực quan góc bánh trước & cầu sau */}
        <View style={styles.miniChassisBox}>
          {/* 2 Bánh trước xoay theo góc Servo */}
          <View style={styles.axleRow}>
            <View
              style={[
                styles.miniWheel,
                {
                  borderColor: theme.secondary,
                  transform: [{ rotate: `${visualFrontWheelDeg}deg` }],
                },
              ]}
            />
            <View style={styles.frontAxleBar} />
            <View
              style={[
                styles.miniWheel,
                {
                  borderColor: theme.secondary,
                  transform: [{ rotate: `${visualFrontWheelDeg}deg` }],
                },
              ]}
            />
          </View>

          {/* Thân khung gầm mini */}
          <View style={styles.chassisSpine} />

          {/* 2 Bánh sau truyền động IBT-2 + Đèn hậu đỏ khi Phanh/P */}
          <View style={styles.axleRow}>
            <View
              style={[
                styles.miniWheel,
                rearDriveActive && {
                  backgroundColor: theme.primary,
                  borderColor: theme.secondary,
                },
                (isBraking || gear === 'P') && {
                  backgroundColor: '#ef4444',
                  borderColor: '#fca5a5',
                },
              ]}
            />
            <View
              style={[
                styles.rearDiffDot,
                {
                  backgroundColor:
                    isBraking || gear === 'P'
                      ? '#ef4444'
                      : rearDriveActive
                      ? theme.primary
                      : '#334155',
                },
              ]}
            />
            <View
              style={[
                styles.miniWheel,
                rearDriveActive && {
                  backgroundColor: theme.primary,
                  borderColor: theme.secondary,
                },
                (isBraking || gear === 'P') && {
                  backgroundColor: '#ef4444',
                  borderColor: '#fca5a5',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.hudVertDivider} />

        {/* Thông tin Odometer & Đỉnh vận tốc */}
        <View style={styles.odoInfoCol}>
          <View style={styles.odoTopLine}>
            <Text style={styles.odoCaption}>ODO</Text>
            <Text style={[styles.odoDistanceVal, { color: theme.secondary }]}>
              {distM >= 1000
                ? `${(distM / 1000).toFixed(3)} km`
                : `${distM.toFixed(2)} m`}
            </Text>
          </View>
          <Text style={styles.peakLineText}>
            MAX {peakKmh.toFixed(1)} km/h • {telemetry.appliedServoAngle}°
          </Text>
        </View>

        {/* Nút xóa Trip ODO nhanh */}
        <Pressable
          onPress={onResetTrip}
          style={({ pressed }) => [
            styles.tripResetBtn,
            pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
          ]}
        >
          <Text style={styles.tripResetText}>0.0 ↺</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  clusterWrap: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  gaugeBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeDialBg: {
    position: 'absolute',
    backgroundColor: '#0a101d',
    borderWidth: 1.5,
  },
  rpmSegment: {
    position: 'absolute',
    borderRadius: 2,
  },
  scaleLeftLabel: {
    position: 'absolute',
    color: '#475569',
    fontSize: 9.5,
    fontWeight: '800',
  },
  scaleRightLabel: {
    position: 'absolute',
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '800',
  },
  gaugeCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prndStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  prndMiniItem: {
    minWidth: 21,
    height: 21,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  prndMiniText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
  },
  speedNumber: {
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 1,
  },
  speedUnit: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  rpmSubPill: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111a2c',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 5,
  },
  rpmSubText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#475569',
  },
  bottomHudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#0c1322',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  miniChassisBox: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  axleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 28,
  },
  miniWheel: {
    width: 6,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#1e293b',
    borderWidth: 1.2,
    borderColor: '#64748b',
  },
  frontAxleBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#334155',
  },
  chassisSpine: {
    width: 4,
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 2,
  },
  rearDiffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hudVertDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#1e293b',
  },
  odoInfoCol: {
    flex: 1,
  },
  odoTopLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  odoCaption: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  odoDistanceVal: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  peakLineText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  tripResetBtn: {
    backgroundColor: '#162235',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#293b56',
  },
  tripResetText: {
    color: '#e2e8f0',
    fontSize: 10.5,
    fontWeight: '800',
  },
});
