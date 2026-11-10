import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CenterCluster } from './src/CenterCluster';
import { GarageModal, GarageTab } from './src/GarageModal';
import { PedalCluster } from './src/PedalCluster';
import { SteeringWheel } from './src/SteeringWheel';
import { DriveMode } from './src/types';
import { useEsp32Controller } from './src/useEsp32Controller';

const DRIVE_MODES: { key: DriveMode; label: string; color: string }[] = [
  { key: 'ECO', label: 'ECO', color: '#10b981' },
  { key: 'NORMAL', label: 'NORMAL', color: '#06b6d4' },
  { key: 'SPORT', label: 'SPORT', color: '#f97316' },
];

export default function App() {
  const { width, height } = useWindowDimensions();

  const {
    espIp,
    setEspIp,
    status,
    pingMs,
    gear,
    changeGear,
    driveMode,
    selectDriveMode,
    theme,
    speed,
    pedalPct,
    isBraking,
    servoAngle,
    telemetry,
    peakKmh,
    peakRpm,
    lastError,
    reconnect,
    applyGasPedal,
    releaseGasPedal,
    pressBrakeStart,
    pressBrakeEnd,
    changeServoSmooth,
    releaseSteeringWheel,
    setServoPreset,
    emergencyStop,
    resetEncoder,
    updateConfig,
  } = useEsp32Controller('192.168.4.1');

  const [garageOpen, setGarageOpen] = useState(false);
  const [garageInitialTab, setGarageInitialTab] = useState<GarageTab>('chassis');

  const openGarage = (tab: GarageTab) => {
    setGarageInitialTab(tab);
    setGarageOpen(true);
  };

  const handleApplyIp = (newIp: string) => {
    setEspIp(newIp);
    setTimeout(() => {
      reconnect();
    }, 60);
  };

  const connMeta = (() => {
    switch (status) {
      case 'connected_ws':
        return {
          dot: '#10b981',
          border: 'rgba(16, 185, 129, 0.45)',
          bg: 'rgba(16, 185, 129, 0.12)',
          label: `ONLINE • ${pingMs ?? '--'}ms`,
        };
      case 'connected_http':
        return {
          dot: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.45)',
          bg: 'rgba(56, 189, 248, 0.12)',
          label: `HTTP • ${pingMs ?? '--'}ms`,
        };
      case 'connecting':
        return {
          dot: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.45)',
          bg: 'rgba(245, 158, 11, 0.12)',
          label: 'ĐANG TÌM XE...',
        };
      default:
        return {
          dot: '#ef4444',
          border: 'rgba(239, 68, 68, 0.55)',
          bg: 'rgba(239, 68, 68, 0.15)',
          label: 'MẤT SÓNG • Chạm nối WiFi',
        };
    }
  })();

  // Tính toán kích thước co giãn chuẩn xác cho mọi tỉ lệ màn hình ngang
  const topBarHeight = 46;
  const usableHeight = Math.max(225, height - topBarHeight - 14);
  const wheelSize = Math.round(
    Math.max(168, Math.min(usableHeight - 28, width * 0.285, 244))
  );
  const gaugeSize = Math.round(
    Math.max(164, Math.min(usableHeight - 54, width * 0.275, 232))
  );

  const ambientTopColor = isBraking ? '#ef4444' : theme.primary;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" hidden />

      {/* Dải đèn viền Ambient Light đổi màu theo chế độ lái ECO / NORMAL / SPORT / R / PHANH */}
      <View
        style={[
          styles.ambientLightLine,
          {
            backgroundColor: ambientTopColor,
            shadowColor: ambientTopColor,
          },
        ]}
      />

      {/* THANH HUD TRÊN CÙNG BUỒNG LÁI */}
      <View style={[styles.topHudBar, { height: topBarHeight }]}>
        {/* Trái: Trạng thái sóng WiFi với mạch ESP32 */}
        <Pressable
          onPress={() => openGarage('wifi')}
          style={({ pressed }) => [
            styles.wifiStatusPill,
            {
              backgroundColor: connMeta.bg,
              borderColor: connMeta.border,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: connMeta.dot }]} />
          <Text style={styles.wifiStatusText}>{connMeta.label}</Text>
        </Pressable>

        {/* Giữa: Cụm nút chọn Chế độ lái ECO / NORMAL / SPORT */}
        <View style={styles.driveModeSelector}>
          {DRIVE_MODES.map((m) => {
            const active = driveMode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => selectDriveMode(m.key)}
                style={[
                  styles.driveModeBtn,
                  active && {
                    backgroundColor: 'rgba(15, 23, 42, 0.96)',
                    borderColor: m.color,
                  },
                ]}
              >
                <View
                  style={[
                    styles.modeIndicatorDot,
                    { backgroundColor: active ? m.color : '#334155' },
                  ]}
                />
                <Text
                  style={[
                    styles.driveModeText,
                    active && { color: m.color, fontWeight: '900' },
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Phải: Phanh tay khẩn cấp (P) & Nút mở Garage Cài đặt ⚙️ */}
        <View style={styles.topRightActions}>
          <Pressable
            onPress={emergencyStop}
            style={({ pressed }) => [
              styles.emergencyParkBtn,
              gear === 'P' && styles.emergencyParkBtnActive,
              pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.emergencyParkIcon}>(P)</Text>
            <Text style={styles.emergencyParkText}>PHANH TAY</Text>
          </Pressable>

          <Pressable
            onPress={() => openGarage('chassis')}
            style={({ pressed }) => [
              styles.garageBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
            ]}
          >
            <Text style={styles.garageBtnText}>⚙ GARAGE</Text>
          </Pressable>
        </View>
      </View>

      {/* KHOANG LÁI CHÍNH 3 KHU VỰC (VÔ-LĂNG TRÁI • ĐỒNG HỒ GIỮA • HỘP SỐ & CHÂN GA PHẢI) */}
      <View style={styles.cockpitArena}>
        {/* 1. Cụm Vô-lăng xoay bên tay trái */}
        <View style={styles.leftSteeringZone}>
          <SteeringWheel
            servoAngle={servoAngle}
            size={wheelSize}
            theme={theme}
            onSteerChange={changeServoSmooth}
            onSteerRelease={releaseSteeringWheel}
          />
        </View>

        {/* 2. Cụm Đồng hồ táp-lô Digital Sport chính giữa */}
        <View style={[styles.centerClusterZone, { maxWidth: gaugeSize + 32 }]}>
          <CenterCluster
            telemetry={telemetry}
            gear={gear}
            speedPct={speed}
            isBraking={isBraking}
            servoAngle={servoAngle}
            peakKmh={peakKmh}
            gaugeSize={gaugeSize}
            theme={theme}
            onResetTrip={resetEncoder}
          />
        </View>

        {/* 3. Cụm Hộp số P-R-N-D + Bàn đạp Phanh & Chân Ga bên tay phải */}
        <View style={styles.rightPedalZone}>
          <PedalCluster
            gear={gear}
            pedalPct={pedalPct}
            isBraking={isBraking}
            availableHeight={usableHeight}
            theme={theme}
            onChangeGear={changeGear}
            onGasChange={applyGasPedal}
            onGasRelease={releaseGasPedal}
            onBrakeStart={pressBrakeStart}
            onBrakeEnd={pressBrakeEnd}
          />
        </View>
      </View>

      {/* POPUP GARAGE CÀI ĐẶT MẠCH, WIFI & THÔNG SỐ KỸ THUẬT */}
      <GarageModal
        visible={garageOpen}
        initialTab={garageInitialTab}
        status={status}
        pingMs={pingMs}
        espIp={espIp}
        lastError={lastError}
        telemetry={telemetry}
        peakKmh={peakKmh}
        peakRpm={peakRpm}
        theme={theme}
        onClose={() => setGarageOpen(false)}
        onApplyIp={handleApplyIp}
        onReconnect={reconnect}
        onUpdateConfig={updateConfig}
        onTestServoAngle={setServoPreset}
        onResetEncoder={resetEncoder}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060a12',
  },
  ambientLightLine: {
    height: 2.5,
    width: '100%',
    elevation: 6,
    shadowOpacity: 0.85,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  topHudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#0a101d',
    borderBottomWidth: 1,
    borderBottomColor: '#162032',
  },
  wifiStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
    marginRight: 6,
  },
  wifiStatusText: {
    color: '#f1f5f9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  driveModeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111a2e',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  driveModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 5,
  },
  modeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  driveModeText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyParkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1218',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    gap: 5,
  },
  emergencyParkBtnActive: {
    backgroundColor: '#991b1b',
    borderColor: '#fca5a5',
  },
  emergencyParkIcon: {
    color: '#fecaca',
    fontSize: 11.5,
    fontWeight: '900',
  },
  emergencyParkText: {
    color: '#fecaca',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  garageBtn: {
    backgroundColor: '#141f35',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c3d59',
  },
  garageBtnText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cockpitArena: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  leftSteeringZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerClusterZone: {
    flex: 1.05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPedalZone: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
