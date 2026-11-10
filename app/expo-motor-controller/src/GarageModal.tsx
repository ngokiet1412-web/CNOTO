import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CockpitTheme,
  ConnectionStatus,
  Esp32Telemetry,
  MotorConfigPatch,
} from './types';

interface GarageModalProps {
  visible: boolean;
  initialTab?: GarageTab;
  status: ConnectionStatus;
  pingMs: number | null;
  espIp: string;
  lastError: string | null;
  telemetry: Esp32Telemetry;
  peakKmh: number;
  peakRpm: number;
  theme: CockpitTheme;
  onClose: () => void;
  onApplyIp: (newIp: string) => void;
  onReconnect: () => void;
  onUpdateConfig: (patch: MotorConfigPatch) => void;
  onTestServoAngle: (angle: number) => void;
  onResetEncoder: () => void;
}

export type GarageTab = 'wifi' | 'chassis' | 'motor' | 'diag';

const SERVO_SWING_PRESETS = [
  { label: '±35° (Hẹp)', value: 35 },
  { label: '±45° (Chuẩn)', value: 45 },
  { label: '±65° (Rộng)', value: 65 },
  { label: '±90° (0–180°)', value: 90 },
];

const MAX_PWM_PRESETS = [
  { label: '25% (64)', value: 64 },
  { label: '45% ECO (115)', value: 115 },
  { label: '73% NORMAL (185)', value: 185 },
  { label: '100% SPORT (255)', value: 255 },
];

const WHEEL_MM_PRESETS = [
  { label: '43 mm', value: 43 },
  { label: '65 mm (Chuẩn)', value: 65 },
  { label: '80 mm', value: 80 },
  { label: '100 mm', value: 100 },
];

const PPR_PRESETS = [
  { label: '10 khe', value: 10 },
  { label: '20 khe (Chuẩn)', value: 20 },
  { label: '30 khe', value: 30 },
  { label: '40 khe', value: 40 },
];

export const GarageModal: React.FC<GarageModalProps> = ({
  visible,
  initialTab = 'chassis',
  status,
  pingMs,
  espIp,
  lastError,
  telemetry,
  peakKmh,
  peakRpm,
  theme,
  onClose,
  onApplyIp,
  onReconnect,
  onUpdateConfig,
  onTestServoAngle,
  onResetEncoder,
}) => {
  const [activeTab, setActiveTab] = useState<GarageTab>(initialTab);
  const [ipDraft, setIpDraft] = useState<string>(espIp);

  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setIpDraft(espIp);
    }
  }, [visible, initialTab, espIp]);

  const isConnected = status === 'connected_ws' || status === 'connected_http';

  const handleSaveIp = () => {
    const clean = ipDraft.trim() || '192.168.4.1';
    setIpDraft(clean);
    onApplyIp(clean);
  };

  const tabs: { key: GarageTab; label: string; sub: string }[] = [
    { key: 'chassis', label: 'Thước Lái & Bánh', sub: 'Trim • Góc • Encoder' },
    { key: 'motor', label: 'Động Cơ & Bảo Vệ', sub: 'PWM • Đảo cực • An toàn' },
    { key: 'wifi', label: 'Kết Nối WiFi Xe', sub: 'IP ESP32 • Hướng dẫn' },
    { key: 'diag', label: 'Thông Số Mạch', sub: 'RPWM • µs • Khe xung' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Thanh tiêu đề Garage */}
          <View style={styles.topHeader}>
            <View style={styles.titleRow}>
              <View style={[styles.accentBar, { backgroundColor: theme.primary }]} />
              <Text style={styles.modalTitle}>GARAGE • CÂN CHỈNH &amp; KỸ THUẬT XE</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕ Đóng về Buồng lái</Text>
            </Pressable>
          </View>

          <View style={styles.bodyColumns}>
            {/* Cột Tab điều hướng bên trái */}
            <View style={styles.sidebar}>
              {tabs.map((t) => {
                const active = activeTab === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setActiveTab(t.key)}
                    style={[
                      styles.tabBtn,
                      active && {
                        backgroundColor: theme.softBg,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabTitle,
                        active && { color: '#ffffff' },
                      ]}
                    >
                      {t.label}
                    </Text>
                    <Text style={styles.tabSub}>{t.sub}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Vùng nội dung bên phải */}
            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.contentInner}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === 'chassis' && (
                <View style={styles.sectionStack}>
                  <View style={styles.panelBox}>
                    <Text style={styles.panelHeading}>
                      Căn thẳng tâm bánh trước (Servo Trim: {telemetry.servoTrim > 0 ? `+${telemetry.servoTrim}` : telemetry.servoTrim}°)
                    </Text>
                    <Text style={styles.panelHint}>
                      Dùng khi buông vô-lăng (90°) mà bánh xe thực tế hơi lệch trái/phải.
                    </Text>
                    <View style={styles.btnRow}>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() =>
                          onUpdateConfig({
                            servoTrim: Math.max(-20, telemetry.servoTrim - 2),
                          })
                        }
                      >
                        <Text style={styles.actionBtnText}>◀ Lệch Trái -2°</Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => onUpdateConfig({ servoTrim: 0 })}
                      >
                        <Text style={styles.actionBtnText}>Về chuẩn 0°</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, { borderColor: theme.border }]}
                        onPress={() =>
                          onUpdateConfig({
                            servoTrim: Math.min(20, telemetry.servoTrim + 2),
                          })
                        }
                      >
                        <Text style={[styles.actionBtnText, { color: theme.secondary }]}>
                          Lệch Phải +2° ▶
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.panelBox}>
                    <Text style={styles.panelHeading}>
                      Giới hạn góc bẻ lái tối đa (Bảo vệ thước lái Servo 9g)
                    </Text>
                    <View style={styles.btnRow}>
                      {SERVO_SWING_PRESETS.map((item) => {
                        const active = Math.abs(telemetry.servoSwing - item.value) <= 3;
                        return (
                          <Pressable
                            key={item.value}
                            onPress={() => onUpdateConfig({ servoSwing: item.value })}
                            style={[
                              styles.pillBtn,
                              active && {
                                backgroundColor: theme.softBg,
                                borderColor: theme.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillBtnText,
                                active && { color: theme.secondary },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.panelBox}>
                    <Text style={styles.panelHeading}>
                      Cấu hình Cảm biến tốc độ Encoder V2 (Hiện tại: Ø{telemetry.wheelMm} mm • {telemetry.ppr} khe)
                    </Text>
                    <View style={styles.btnRow}>
                      {WHEEL_MM_PRESETS.map((item) => {
                        const active = (telemetry.wheelMm ?? 65) === item.value;
                        return (
                          <Pressable
                            key={item.value}
                            onPress={() => onUpdateConfig({ wheelMm: item.value })}
                            style={[
                              styles.pillBtn,
                              active && {
                                backgroundColor: theme.softBg,
                                borderColor: theme.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillBtnText,
                                active && { color: theme.secondary },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                      <Pressable
                        style={styles.pillBtn}
                        onPress={() =>
                          onUpdateConfig({
                            wheelMm: Math.max(20, (telemetry.wheelMm ?? 65) - 5),
                          })
                        }
                      >
                        <Text style={styles.pillBtnText}>-5mm</Text>
                      </Pressable>
                      <Pressable
                        style={styles.pillBtn}
                        onPress={() =>
                          onUpdateConfig({
                            wheelMm: Math.min(250, (telemetry.wheelMm ?? 65) + 5),
                          })
                        }
                      >
                        <Text style={styles.pillBtnText}>+5mm</Text>
                      </Pressable>
                    </View>

                    <View style={[styles.btnRow, { marginTop: 8 }]}>
                      {PPR_PRESETS.map((item) => {
                        const active = (telemetry.ppr ?? 20) === item.value;
                        return (
                          <Pressable
                            key={item.value}
                            onPress={() => onUpdateConfig({ ppr: item.value })}
                            style={[
                              styles.pillBtn,
                              active && {
                                backgroundColor: theme.softBg,
                                borderColor: theme.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillBtnText,
                                active && { color: theme.secondary },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'motor' && (
                <View style={styles.sectionStack}>
                  <View style={styles.panelBox}>
                    <Text style={styles.panelHeading}>
                      Trần công suất Motor sau (Max PWM: {telemetry.maxPwm} / 255)
                    </Text>
                    <View style={styles.btnRow}>
                      {MAX_PWM_PRESETS.map((item) => {
                        const active = Math.abs(telemetry.maxPwm - item.value) <= 6;
                        return (
                          <Pressable
                            key={item.value}
                            onPress={() => onUpdateConfig({ maxPwm: item.value })}
                            style={[
                              styles.pillBtn,
                              active && {
                                backgroundColor: theme.softBg,
                                borderColor: theme.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillBtnText,
                                active && { color: theme.secondary },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.panelBox}>
                    <View style={styles.switchItem}>
                      <View style={styles.switchTextCol}>
                        <Text style={styles.switchName}>
                          Đảo chiều bẻ lái Servo (Trái ↔ Phải)
                        </Text>
                        <Text style={styles.switchSub}>
                          Đổi hướng quay bánh trước bằng phần mềm
                        </Text>
                      </View>
                      <Switch
                        value={telemetry.invertServo}
                        onValueChange={(val) => onUpdateConfig({ invertServo: val })}
                        trackColor={{ false: '#334155', true: theme.primary }}
                        thumbColor="#f8fafc"
                      />
                    </View>

                    <View style={styles.switchItem}>
                      <View style={styles.switchTextCol}>
                        <Text style={styles.switchName}>
                          Đảo cực dây Motor (M+ ↔ M-)
                        </Text>
                        <Text style={styles.switchSub}>
                          Đổi chiều Tiến/Lùi mà không cần tháo dây cầu H IBT-2
                        </Text>
                      </View>
                      <Switch
                        value={telemetry.invert}
                        onValueChange={(val) => onUpdateConfig({ invert: val })}
                        trackColor={{ false: '#334155', true: theme.primary }}
                        thumbColor="#f8fafc"
                      />
                    </View>

                    <View style={styles.switchItem}>
                      <View style={styles.switchTextCol}>
                        <Text style={styles.switchName}>
                          Đảo chiều êm (Soft-Reverse)
                        </Text>
                        <Text style={styles.switchSub}>
                          Giảm tốc mượt về 0 trước khi đảo chiều chống sụt áp ESP32
                        </Text>
                      </View>
                      <Switch
                        value={telemetry.softReverse}
                        onValueChange={(val) => onUpdateConfig({ softReverse: val })}
                        trackColor={{ false: '#334155', true: '#10b981' }}
                        thumbColor="#f8fafc"
                      />
                    </View>

                    <View style={[styles.switchItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <View style={styles.switchTextCol}>
                        <Text style={styles.switchName}>
                          Tự ngắt khi mất sóng WiFi (Failsafe 2.5s)
                        </Text>
                        <Text style={styles.switchSub}>
                          Tự dừng xe an toàn nếu điện thoại rời vùng phủ sóng
                        </Text>
                      </View>
                      <Switch
                        value={telemetry.failsafe}
                        onValueChange={(val) => onUpdateConfig({ failsafe: val })}
                        trackColor={{ false: '#334155', true: '#10b981' }}
                        thumbColor="#f8fafc"
                      />
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'wifi' && (
                <View style={styles.sectionStack}>
                  <View style={styles.panelBox}>
                    <Text style={styles.panelHeading}>
                      Trạng thái kết nối mạch ESP32 ({isConnected ? `${pingMs ?? '--'} ms` : 'Chưa kết nối'})
                    </Text>
                    <View style={styles.ipFormRow}>
                      <Text style={styles.ipFieldLabel}>Địa chỉ IP:</Text>
                      <TextInput
                        style={styles.ipTextInput}
                        value={ipDraft}
                        onChangeText={setIpDraft}
                        placeholder="192.168.4.1"
                        placeholderTextColor="#64748b"
                        keyboardType="numbers-and-punctuation"
                        autoCapitalize="none"
                      />
                      <Pressable
                        style={[styles.saveIpBtn, { backgroundColor: theme.primary }]}
                        onPress={handleSaveIp}
                      >
                        <Text style={styles.saveIpBtnText}>Lưu &amp; Nối</Text>
                      </Pressable>
                      <Pressable style={styles.actionBtn} onPress={onReconnect}>
                        <Text style={styles.actionBtnText}>↻ Dò lại</Text>
                      </Pressable>
                    </View>
                    {lastError && !isConnected ? (
                      <Text style={styles.errText}>{lastError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.panelBox}>
                    <Text style={styles.panelHeading}>
                      Hướng dẫn kết nối WiFi trực tiếp với Xe:
                    </Text>
                    <Text style={styles.guideLine}>
                      1. Mở Cài đặt WiFi trên điện thoại → chọn mạng{' '}
                      <Text style={styles.codeHighlight}>ESP32-Motor-RC</Text> (Mật khẩu:{' '}
                      <Text style={styles.codeHighlight}>CHANGE_ME_BEFORE_USE</Text>).
                    </Text>
                    <Text style={styles.guideLine}>
                      2. Nếu máy hỏi mạng không có Internet, chọn{' '}
                      <Text style={{ color: '#f8fafc', fontWeight: '800' }}>
                        Giữ kết nối WiFi (Keep Wi-Fi)
                      </Text>
                      .
                    </Text>
                    <Text style={styles.guideLine}>
                      3. Quay lại ứng dụng — WebSocket thời gian thực (`ws://192.168.4.1:81`) sẽ tự nhận ngay!
                    </Text>
                  </View>
                </View>
              )}

              {activeTab === 'diag' && (
                <View style={styles.sectionStack}>
                  <View style={styles.diagGrid}>
                    <View style={styles.diagBox}>
                      <Text style={styles.diagLabel}>CẦU H IBT-2 (GPIO 25/26)</Text>
                      <Text style={styles.diagVal}>
                        RPWM: {telemetry.rpwm} • LPWM: {telemetry.lpwm}
                      </Text>
                      <Text style={styles.diagSub}>
                        Chân EN: {telemetry.en ? 'ĐANG BẬT (HIGH)' : 'NGẮT NGHỈ (LOW)'}
                      </Text>
                    </View>

                    <View style={styles.diagBox}>
                      <Text style={styles.diagLabel}>SERVO 9G (GPIO 32)</Text>
                      <Text style={styles.diagVal}>
                        {telemetry.appliedServoAngle}° ({telemetry.servoUs} µs)
                      </Text>
                      <Text style={styles.diagSub}>
                        Trim: {telemetry.servoTrim}° • Biên độ: ±{telemetry.servoSwing}°
                      </Text>
                    </View>

                    <View style={styles.diagBox}>
                      <Text style={styles.diagLabel}>ENCODER V2 (GPIO 13)</Text>
                      <Text style={styles.diagVal}>
                        {telemetry.pulses} xung ({telemetry.encLevel ? 'Khe HIGH 1' : 'Khe LOW 0'})
                      </Text>
                      <Text style={styles.diagSub}>
                        Đỉnh: {peakKmh.toFixed(2)} km/h • {peakRpm.toFixed(1)} RPM
                      </Text>
                    </View>

                    <View style={styles.diagBox}>
                      <Text style={styles.diagLabel}>HỆ THỐNG ESP32</Text>
                      <Text style={styles.diagVal}>
                        Uptime: {telemetry.uptime}s
                      </Text>
                      <Text style={styles.diagSub}>
                        Thiết bị WiFi: {telemetry.clients} • Vận tốc: {Number(telemetry.mps ?? 0).toFixed(2)} m/s
                      </Text>
                    </View>
                  </View>

                  <View style={styles.panelBox}>
                    <Text style={styles.panelHeading}>
                      Kiểm tra nhanh góc Servo trên bàn &amp; Xóa bộ đếm xung
                    </Text>
                    <View style={styles.btnRow}>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => onTestServoAngle(0)}
                      >
                        <Text style={styles.actionBtnText}>Thử 0° (Trái)</Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => onTestServoAngle(90)}
                      >
                        <Text style={styles.actionBtnText}>Thử 90° (Giữa)</Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => onTestServoAngle(180)}
                      >
                        <Text style={styles.actionBtnText}>Thử 180° (Phải)</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, { borderColor: '#22d3ee' }]}
                        onPress={onResetEncoder}
                      >
                        <Text style={[styles.actionBtnText, { color: '#67e8f9' }]}>
                          ↺ Reset Xung &amp; ODO
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.84)',
    paddingHorizontal: 22,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  modalCard: {
    flex: 1,
    backgroundColor: '#0b111e',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  closeBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeBtnText: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: '800',
  },
  bodyColumns: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 175,
    backgroundColor: '#090e1a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    padding: 10,
    gap: 7,
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#11192c',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
  },
  tabSub: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  contentScroll: {
    flex: 1,
  },
  contentInner: {
    padding: 14,
  },
  sectionStack: {
    gap: 10,
  },
  panelBox: {
    backgroundColor: '#11192c',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  panelHeading: {
    color: '#f1f5f9',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 6,
  },
  panelHint: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#1a253d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: {
    color: '#e2e8f0',
    fontSize: 11.5,
    fontWeight: '800',
  },
  pillBtn: {
    backgroundColor: '#162035',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#29374d',
  },
  pillBtnText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '800',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  switchTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  switchName: {
    color: '#f1f5f9',
    fontSize: 12.5,
    fontWeight: '800',
  },
  switchSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  ipFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ipFieldLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  ipTextInput: {
    flex: 1,
    backgroundColor: '#090d16',
    color: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 13,
  },
  saveIpBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveIpBtnText: {
    color: '#030712',
    fontSize: 12,
    fontWeight: '900',
  },
  errText: {
    color: '#fca5a5',
    fontSize: 11,
    marginTop: 6,
  },
  guideLine: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 3,
  },
  codeHighlight: {
    color: '#4ade80',
    fontWeight: '900',
  },
  diagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  diagBox: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#11192c',
    borderRadius: 11,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  diagLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  diagVal: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },
  diagSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
});
