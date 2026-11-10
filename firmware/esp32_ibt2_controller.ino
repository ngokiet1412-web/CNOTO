/*
 * ============================================================================
 * DỰ ÁN: ĐIỀU KHIỂN XE WIFI ESP32 + IBT-2 + MICRO SERVO 9G + ENCODER V2
 * MẠCH NGUỒN PHỤ: HẠ ÁP DC-DC BUCK XL4015 (CHỈNH CHUẨN 5.0V NUÔI SERVO 9G)
 * CẢM BIẾN TỐC ĐỘ: ENCODER QUANG KHE CHỮ U V2 (IC 74HC14 + ĐĨA 20 KHE)
 * GIAO TIẾP: APP ĐIỆN THOẠI EXPO (WebSocket thời gian thực + HTTP dự phòng)
 * MÔI TRƯỜNG NẠP: Arduino IDE (Tương thích cả ESP32 Board v2.x và v3.x)
 * KHÔNG CẦN CÀI THÊM THƯ VIỆN NGOÀI (Zero External Dependencies)
 * ============================================================================
 *
 * SƠ ĐỒ ĐẤU DÂY TRÊN BREADBOARD MB-102 (ESP32-DevKitC + IBT-2 + XL4015 + SG90 + ENCODER V2):
 * ----------------------------------------------------------------------------
 * 1. CẮM ESP32-DevKitC LÊN MB-102:
 *    - Hàng chân TRÁI: cột b (b1 -> b19), Anten hướng lên hàng 1
 *    - Hàng chân PHẢI: cột j (j1 -> j19)
 *    -> Cột a (a1 -> a19) bên trái và các hàng dưới đáy (20 -> 25) lộ ra trống 100%!
 *
 * 2. TRẠM CHIA NGUỒN LOGIC 3.3V SẠCH (HÀNG NGANG 24 TRÁI: a24 - b24 - c24 - d24 - e24):
 *    - Nối 1 dây Đực-Đực từ Lỗ a1 (3V3 ESP32) ---> Lỗ e24 (cấp 3.3V cho cả hàng 24 trái)
 *    - Cắm dây 7.VCC (IBT-2)        ---> Lỗ b24 (3.3V)
 *    - Cắm dây VCC (Encoder V2)     ---> Lỗ a24 (3.3V -> giúp xung OUT chuẩn 3.3V an toàn cho ESP32!)
 *
 * 3. KẾT NỐI CẢM BIẾN TỐC ĐỘ ENCODER V2 (KHE CHỮ U 3 CHÂN + ĐĨA TRÒN 20 KHE):
 *    - Chân OUT / DO (Xung tốc độ)  ---> Lỗ a15 (nối chân GPIO 13 ở b15 - Đếm ngắt IRAM)
 *    - Chân VCC (Nguồn 3.3V)        ---> Lỗ a24 (Trạm chia 3.3V hàng 24 trái)
 *    - Chân GND (Mass)              ---> Thanh nguồn XANH (-) bên trái MB-102 (Mass chung)
 *
 * 4. KẾT NỐI MẠCH HẠ ÁP XL4015 & MICRO SERVO 9G (SG90):
 *    - [QUAN TRỌNG SỐ 1]: Cấp nguồn Pin/Ắc quy (6.5V-24V) vào IN+ / IN- của XL4015,
 *      LẤY ĐỒNG HỒ ĐO OUT+ / OUT- VÀ VẶN ỐC ĐỒNG TRÊN BIẾN TRỞ XANH NGƯỢC CHIỀU
 *      KIM ĐỒNG HỒ ĐẾN KHI ĐẠT ĐÚNG 5.0V (4.8V - 5.2V) TRƯỚC KHI CẮM SERVO!
 *    - XL4015 OUT+ (5.0V) ---> Thanh nguồn ĐỎ (+) bên trái MB-102
 *    - XL4015 OUT- (GND)  ---> Thanh nguồn XANH (-) bên trái MB-102
 *    - Nối Mass chung: Cắm 1 dây từ lỗ a14 (GND ESP32) ---> Thanh nguồn XANH (-)
 *    - Micro Servo 9g (3 dây):
 *        + Dây CAM / VÀNG (Signal) ---> Lỗ a7 (nối chân GPIO 32 ở b7)
 *        + Dây ĐỎ (VCC 5V)         ---> Thanh nguồn ĐỎ (+) bên trái MB-102 (5.0V XL4015)
 *        + Dây NÂU / ĐEN (GND)     ---> Thanh nguồn XANH (-) bên trái MB-102 (Mass chung)
 *
 * 5. KẾT NỐI MODULE CẦU H IBT-2 (BTS7960):
 *    - 1. RPWM  <---> Lỗ a9  (GPIO 25)
 *    - 2. LPWM  <---> Lỗ a10 (GPIO 26)
 *    - 3. R_EN  <---> Lỗ a11 (GPIO 27)
 *    - 4. L_EN  <---> Lỗ a8  (GPIO 33)
 *    - 7. VCC   <---> Lỗ b24 (Trạm chia 3.3V hàng 24 trái)
 *    - 8. GND   <---> Thanh nguồn XANH (-) bên trái MB-102 (Mass chung với a14)
 * ============================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <math.h>

// ======================= 1. CẤU HÌNH WIFI ACCESS POINT ======================
const char* WIFI_SSID     = "ESP32-Motor-RC";   // Tên WiFi do ESP32 phát ra
const char* WIFI_PASSWORD = "CHANGE_ME_BEFORE_USE";         // Mật khẩu WiFi (tối thiểu 8 ký tự)
const int   WIFI_CHANNEL  = 6;
const int   MAX_CLIENTS   = 4;

const IPAddress AP_IP(192, 168, 4, 1);
const IPAddress AP_GATEWAY(192, 168, 4, 1);
const IPAddress AP_SUBNET(255, 255, 255, 0);

// ======================= 2. CẤU HÌNH CHÂN GPIO & PWM ========================
// Kênh cầu H IBT-2 (Motor đẩy sau)
const int PIN_RPWM    = 25;   // Lỗ a9  -> IBT-2 chân 1 (RPWM)
const int PIN_LPWM    = 26;   // Lỗ a10 -> IBT-2 chân 2 (LPWM)
const int PIN_R_EN    = 27;   // Lỗ a11 -> IBT-2 chân 3 (R_EN)
const int PIN_L_EN    = 33;   // Lỗ a8  -> IBT-2 chân 4 (L_EN)

// Kênh Micro Servo 9g (SG90 / MG90S)
const int PIN_SERVO   = 32;   // Lỗ a7  -> Dây Cam/Vàng (Signal) của Servo 9g

// Kênh Cảm biến tốc độ Encoder V2 (Khe chữ U IC 74HC14 + Đĩa 20 lỗ)
const int PIN_ENCODER = 13;   // Lỗ a15 -> Chân OUT / DO của Encoder V2

const int PIN_STATUS  = 2;    // Đèn LED tích hợp trên ESP32

// Cấu hình LEDC cho Motor IBT-2 (Timer 0: 20 kHz, 8-bit 0..255)
const int PWM_FREQ       = 20000;
const int PWM_RESOLUTION = 8;
const int CH_RPWM        = 0; // Dùng Timer 0 trên ESP32 Core v2.x
const int CH_LPWM        = 1; // Dùng Timer 0 trên ESP32 Core v2.x

// Cấu hình LEDC riêng biệt cho Micro Servo 9g (Timer 2: 50 Hz, 14-bit 0..16383)
// Hoàn toàn độc lập Timer với 20kHz của IBT-2, độ mịn ~0.11 độ, không giật rung!
const int SERVO_FREQ       = 50;    // Chu kỳ 20,000 us chuẩn RC Servo
const int SERVO_RESOLUTION = 14;    // 16384 mức chia
const int CH_SERVO         = 4;     // Kênh 4 thuộc Timer 2 (tách biệt hoàn toàn Timer 0)
const int SERVO_MIN_US     = 540;   // Xung tại góc 0 độ (an toàn không kẹt nhông nhựa SG90)
const int SERVO_MAX_US     = 2400;  // Xung tại góc 180 độ (trung tâm 90 độ = 1470 us)

// ======================= 3. BIẾN TRẠNG THÁI MOTOR & SERVO ===================
enum MotorDir {
  DIR_STOP = 0,
  DIR_FWD  = 1,
  DIR_REV  = -1
};

// Trạng thái Motor đẩy sau
MotorDir targetDir         = DIR_STOP;
int      targetSpeedPct    = 0;        // 0..100%
int      targetSignedPwm   = 0;        // -255..+255
int      currentSignedPwm  = 0;        // -255..+255
int      maxPwmLimit       = 255;      // 30..255
bool     softReverse       = true;     // Giảm tốc mượt qua 0 trước khi đảo chiều
bool     invertMotor       = false;    // Đảo cực M+/M-
bool     failsafeEnabled   = true;     // Tự dừng Motor khi mất WiFi

// Trạng thái Micro Servo 9g
int      userServoAngle    = 90;       // Góc người dùng chọn trên App (0..180, 90 = Giữa)
int      servoTrim         = 0;        // Tinh chỉnh lệch tâm cơ khí (-20..+20 độ)
int      servoMaxSwing     = 90;       // Biên độ cho phép quanh tâm 90 (15..90 độ; 90 = Full 0..180)
bool     invertServo       = false;    // Đảo chiều quay Trái <-> Phải của Servo
int      appliedServoAngle = 90;       // Góc thực tế xuất ra sau khi áp Trim & Giới hạn
int      appliedServoUs    = 1470;     // Độ rộng xung thực tế (micro-giây)

// Trạng thái Cảm biến tốc độ Encoder V2 (Khe chữ U IC 74HC14 + Đĩa 20 khe)
const uint32_t ENCODER_MIN_PULSE_US     = 450UL;     // Chống nhiễu xung nhọn < 450us (>6600 RPM vẫn đếm chuẩn)
const uint32_t ENCODER_STOP_TIMEOUT_US  = 650000UL;  // Quá 0.65s không có khe qua -> tốc độ trả về 0.0
const unsigned long ENCODER_CALC_MS     = 120UL;     // Chu kỳ tính toán vận tốc mượt (~8.3 Hz)

portMUX_TYPE encoderMux = portMUX_INITIALIZER_UNLOCKED;
volatile uint32_t isrTotalPulses   = 0;
volatile uint32_t isrIntervalCount = 0;
volatile uint32_t isrIntervalSumUs = 0;
volatile uint32_t isrLastPulseUs   = 0;
volatile bool     isrHasPulse      = false;

int      pulsesPerRev          = 20;     // Số khe trên đĩa xung (mặc định 20 khe tiêu chuẩn)
int      wheelDiameterMm       = 65;     // Đường kính bánh xe tính bằng mm (mặc định 65mm)
uint32_t encoderPulsesSnapshot = 0;      // Tổng xung hiển thị trên App
float    encoderRpm            = 0.0f;   // Tốc độ vòng quay bánh xe (vòng/phút)
float    encoderSpeedMps       = 0.0f;   // Vận tốc dài (m/s)
float    encoderSpeedKmh       = 0.0f;   // Vận tốc dài (km/h)
double   encoderDistanceM      = 0.0;    // Quãng đường tích lũy (mét)
int      encoderPinLevel       = 1;      // Trạng thái tức thời mắt đọc hồng ngoại GPIO 13 (0/1)

uint32_t lastBroadcastPulses   = 0;
float    lastBroadcastRpm      = 0.0f;
int      lastBroadcastEncLevel = -1;
unsigned long lastEncoderCalcMs = 0;

// Biến thời gian vòng lặp không chặn
unsigned long lastRampTickMs       = 0;
unsigned long zeroCrossHoldUntilMs = 0;
unsigned long stoppedSinceMs       = 0;
unsigned long lastClientActivityMs = 0;
unsigned long lastTelemetryMs      = 0;
unsigned long lastLedBlinkMs       = 0;
bool          ledState             = false;
bool          enActive             = false;
int           appliedRpwm          = 0;
int           appliedLpwm          = 0;

const unsigned long RAMP_INTERVAL_MS     = 10;
const int           ACCEL_STEP_PER_TICK  = 10;
const int           DECEL_STEP_PER_TICK  = 15;
const unsigned long ZERO_CROSS_PAUSE_MS  = 45;
const unsigned long IDLE_DISABLE_EN_MS   = 200;
const unsigned long FAILSAFE_TIMEOUT_MS  = 2500;

// ======================= 4. KHỞI TẠO SERVER HTTP & WEBSOCKET ================
WebServer  httpServer(80);
WiFiServer wsServer(81);

const int MAX_WS_CLIENTS = 4;
struct WsClientSlot {
  WiFiClient client;
  bool       handshaked = false;
};
WsClientSlot wsClients[MAX_WS_CLIENTS];

// ======================= 5. ĐIỀU KHIỂN PHẦN CỨNG PWM, SERVO & ENCODER =======
void IRAM_ATTR onEncoderPulseISR() {
  uint32_t nowUs = micros();
  portENTER_CRITICAL_ISR(&encoderMux);
  uint32_t dtUs = nowUs - isrLastPulseUs;
  if (isrHasPulse && dtUs < ENCODER_MIN_PULSE_US) {
    portEXIT_CRITICAL_ISR(&encoderMux);
    return;
  }
  isrTotalPulses++;
  if (isrHasPulse && dtUs <= ENCODER_STOP_TIMEOUT_US) {
    isrIntervalCount++;
    isrIntervalSumUs += dtUs;
  }
  isrLastPulseUs = nowUs;
  isrHasPulse = true;
  portEXIT_CRITICAL_ISR(&encoderMux);
}

void resetEncoderCounters() {
  portENTER_CRITICAL(&encoderMux);
  isrTotalPulses   = 0;
  isrIntervalCount = 0;
  isrIntervalSumUs = 0;
  isrLastPulseUs   = 0;
  isrHasPulse      = false;
  portEXIT_CRITICAL(&encoderMux);

  encoderPulsesSnapshot = 0;
  encoderRpm            = 0.0f;
  encoderSpeedMps       = 0.0f;
  encoderSpeedKmh       = 0.0f;
  encoderDistanceM      = 0.0;
  lastBroadcastPulses   = 0;
  lastBroadcastRpm      = 0.0f;
}

void recomputeEncoderDerivedMetrics() {
  int safePpr = max(1, pulsesPerRev);
  float circumM = (3.14159265f * (float)constrain(wheelDiameterMm, 20, 250)) / 1000.0f;
  encoderSpeedMps  = (encoderRpm / 60.0f) * circumM;
  encoderSpeedKmh  = encoderSpeedMps * 3.6f;
  encoderDistanceM = ((double)encoderPulsesSnapshot / (double)safePpr) * (double)circumM;
}

bool updateEncoderTelemetry(unsigned long nowMs) {
  int curLevel = digitalRead(PIN_ENCODER);
  encoderPinLevel = curLevel;
  bool levelFlipped = (curLevel != lastBroadcastEncLevel);

  if (nowMs - lastEncoderCalcMs < ENCODER_CALC_MS) {
    if (levelFlipped) {
      lastBroadcastEncLevel = curLevel;
      return true;
    }
    return false;
  }
  lastEncoderCalcMs = nowMs;

  uint32_t snapTotal = 0;
  uint32_t snapCount = 0;
  uint32_t snapSumUs = 0;
  uint32_t snapLastUs = 0;
  bool     snapHasPulse = false;

  portENTER_CRITICAL(&encoderMux);
  snapTotal        = isrTotalPulses;
  snapCount        = isrIntervalCount;
  snapSumUs        = isrIntervalSumUs;
  snapLastUs       = isrLastPulseUs;
  snapHasPulse     = isrHasPulse;
  isrIntervalCount = 0;
  isrIntervalSumUs = 0;
  portEXIT_CRITICAL(&encoderMux);

  encoderPulsesSnapshot = snapTotal;
  int safePpr = max(1, pulsesPerRev);

  if (snapCount > 0 && snapSumUs > 0) {
    float rawRpm = ((float)snapCount * 60000000.0f) / ((float)snapSumUs * (float)safePpr);
    if (encoderRpm < 1.0f) {
      encoderRpm = rawRpm;
    } else {
      encoderRpm = encoderRpm * 0.55f + rawRpm * 0.45f;
    }
  } else {
    uint32_t idleUs = micros() - snapLastUs;
    if (!snapHasPulse || idleUs >= ENCODER_STOP_TIMEOUT_US) {
      encoderRpm = 0.0f;
    } else if (idleUs > 0) {
      float maxPossibleRpm = 60000000.0f / ((float)idleUs * (float)safePpr);
      if (encoderRpm > maxPossibleRpm) {
        encoderRpm = maxPossibleRpm;
      }
    }
  }

  recomputeEncoderDerivedMetrics();

  bool changed = levelFlipped ||
                 (snapTotal != lastBroadcastPulses) ||
                 (fabsf(encoderRpm - lastBroadcastRpm) >= 0.25f) ||
                 (encoderRpm == 0.0f && lastBroadcastRpm > 0.0f);

  if (changed) {
    lastBroadcastPulses   = snapTotal;
    lastBroadcastRpm      = encoderRpm;
    lastBroadcastEncLevel = curLevel;
  }
  return changed;
}

uint32_t servoUsToDuty(int pulseUs) {
  uint32_t clampedUs = (uint32_t)constrain(pulseUs, 500, 2450);
  // 14-bit (16384) trên chu kỳ 20,000us (50Hz)
  return (clampedUs * 16384UL + 10000UL) / 20000UL;
}

inline void writeServoPulseUs(int pulseUs) {
  appliedServoUs = pulseUs;
  uint32_t duty = servoUsToDuty(pulseUs);
#if defined(ESP_ARDUINO_VERSION) && (ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0))
  ledcWrite(PIN_SERVO, duty);
#else
  ledcWrite(CH_SERVO, duty);
#endif
}

void applyServoOutput() {
  int clampedInput = constrain(userServoAngle, 0, 180);
  // Đảo chiều quanh mốc trung tâm 90 độ nếu bật invertServo
  int centeredOffset = clampedInput - 90;
  if (invertServo) {
    centeredOffset = -centeredOffset;
  }

  // Giới hạn biên độ góc quay để bảo vệ thước lái khi lắp lên khung xe
  int swing = constrain(servoMaxSwing, 15, 90);
  centeredOffset = constrain(centeredOffset, -swing, swing);

  // Cộng bù lệch tâm (Trim) và kẹp an toàn trong vùng 0..180 độ vật lý
  int finalAngle = constrain(90 + centeredOffset + servoTrim, 0, 180);
  appliedServoAngle = finalAngle;

  int pulseUs = SERVO_MIN_US + ((finalAngle * (SERVO_MAX_US - SERVO_MIN_US) + 90) / 180);
  writeServoPulseUs(pulseUs);
}

void setupHardwarePins() {
  pinMode(PIN_R_EN, OUTPUT);
  pinMode(PIN_L_EN, OUTPUT);
  digitalWrite(PIN_R_EN, LOW);
  digitalWrite(PIN_L_EN, LOW);

  // Cảm biến tốc độ Encoder V2 trên GPIO 13 (Lỗ a15) có kéo trở nội INPUT_PULLUP chống nhiễu hở dây
  pinMode(PIN_ENCODER, INPUT_PULLUP);
  encoderPinLevel = digitalRead(PIN_ENCODER);
  attachInterrupt(digitalPinToInterrupt(PIN_ENCODER), onEncoderPulseISR, RISING);

#if defined(ESP_ARDUINO_VERSION) && (ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0))
  // Motor IBT-2: 20 kHz, 8-bit
  ledcAttach(PIN_RPWM, PWM_FREQ, PWM_RESOLUTION);
  ledcAttach(PIN_LPWM, PWM_FREQ, PWM_RESOLUTION);
  ledcWrite(PIN_RPWM, 0);
  ledcWrite(PIN_LPWM, 0);

  // Micro Servo 9g: 50 Hz, 14-bit (Tự động cấp Timer phần cứng riêng)
  ledcAttach(PIN_SERVO, SERVO_FREQ, SERVO_RESOLUTION);
#else
  // Motor IBT-2 trên Timer 0
  ledcSetup(CH_RPWM, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(PIN_RPWM, CH_RPWM);
  ledcSetup(CH_LPWM, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(PIN_LPWM, CH_LPWM);
  ledcWrite(CH_RPWM, 0);
  ledcWrite(CH_LPWM, 0);

  // Micro Servo 9g trên Kênh 4 (Timer 2 độc lập hoàn toàn với Timer 0)
  ledcSetup(CH_SERVO, SERVO_FREQ, SERVO_RESOLUTION);
  ledcAttachPin(PIN_SERVO, CH_SERVO);
#endif

  // Đưa Servo về vị trí cân bằng 90 độ ngay khi khởi động
  applyServoOutput();
}

inline void writeRpwmPin(uint8_t duty) {
  appliedRpwm = duty;
#if defined(ESP_ARDUINO_VERSION) && (ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0))
  ledcWrite(PIN_RPWM, duty);
#else
  ledcWrite(CH_RPWM, duty);
#endif
}

inline void writeLpwmPin(uint8_t duty) {
  appliedLpwm = duty;
#if defined(ESP_ARDUINO_VERSION) && (ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0))
  ledcWrite(PIN_LPWM, duty);
#else
  ledcWrite(CH_LPWM, duty);
#endif
}

inline void setBridgeEnable(bool enable) {
  enActive = enable;
  digitalWrite(PIN_R_EN, enable ? HIGH : LOW);
  digitalWrite(PIN_L_EN, enable ? HIGH : LOW);
}

// ======================= 6. BỘ ĐIỀU KHIỂN MOTOR & SOFT-REVERSE ==============
void recomputeTargetPwm() {
  if (targetDir == DIR_STOP || targetSpeedPct <= 0) {
    targetSignedPwm = 0;
    return;
  }
  int clampedPct = constrain(targetSpeedPct, 0, 100);
  int clampedMax = constrain(maxPwmLimit, 30, 255);
  int mag = (clampedPct * clampedMax + 50) / 100;
  mag = constrain(mag, 0, clampedMax);

  int sign = (targetDir == DIR_FWD) ? 1 : -1;
  if (invertMotor) sign = -sign;
  targetSignedPwm = sign * mag;
}

void emergencyStopNow() {
  targetDir        = DIR_STOP;
  targetSpeedPct   = 0;
  targetSignedPwm  = 0;
  currentSignedPwm = 0;
  writeRpwmPin(0);
  writeLpwmPin(0);
  setBridgeEnable(false);
  // Đưa bánh lái Servo về thẳng tâm an toàn
  userServoAngle = 90;
  applyServoOutput();
}

void applyHardwarePwm(int signedPwm, unsigned long nowMs) {
  if (signedPwm > 0) {
    writeLpwmPin(0);
    if (!enActive) setBridgeEnable(true);
    writeRpwmPin((uint8_t)constrain(signedPwm, 0, 255));
    stoppedSinceMs = 0;
  } else if (signedPwm < 0) {
    writeRpwmPin(0);
    if (!enActive) setBridgeEnable(true);
    writeLpwmPin((uint8_t)constrain(-signedPwm, 0, 255));
    stoppedSinceMs = 0;
  } else {
    writeRpwmPin(0);
    writeLpwmPin(0);
    if (targetSignedPwm == 0) {
      if (stoppedSinceMs == 0) {
        stoppedSinceMs = nowMs;
      } else if (enActive && (nowMs - stoppedSinceMs >= IDLE_DISABLE_EN_MS)) {
        setBridgeEnable(false);
      }
    }
  }
}

bool updateMotorControlLoop() {
  unsigned long nowMs = millis();
  if (nowMs - lastRampTickMs < RAMP_INTERVAL_MS) {
    return false;
  }
  lastRampTickMs = nowMs;

  int prevPwm = currentSignedPwm;

  if (!softReverse) {
    currentSignedPwm = targetSignedPwm;
  } else {
    if (nowMs < zeroCrossHoldUntilMs) {
      currentSignedPwm = 0;
    } else if (currentSignedPwm != targetSignedPwm) {
      bool reversingSign = (currentSignedPwm > 0 && targetSignedPwm < 0) ||
                           (currentSignedPwm < 0 && targetSignedPwm > 0);
      if (reversingSign) {
        if (currentSignedPwm > 0) {
          currentSignedPwm = max(0, currentSignedPwm - DECEL_STEP_PER_TICK);
        } else {
          currentSignedPwm = min(0, currentSignedPwm + DECEL_STEP_PER_TICK);
        }
        if (currentSignedPwm == 0) {
          zeroCrossHoldUntilMs = nowMs + ZERO_CROSS_PAUSE_MS;
        }
      } else {
        int diff = targetSignedPwm - currentSignedPwm;
        bool decelerating = (abs(targetSignedPwm) < abs(currentSignedPwm));
        int step = decelerating ? DECEL_STEP_PER_TICK : ACCEL_STEP_PER_TICK;

        if (abs(diff) <= step) {
          currentSignedPwm = targetSignedPwm;
        } else if (diff > 0) {
          currentSignedPwm += step;
        } else {
          currentSignedPwm -= step;
        }
      }
    }
  }

  applyHardwarePwm(currentSignedPwm, nowMs);
  return (prevPwm != currentSignedPwm);
}

// ======================= 7. SHA-1 & BASE64 CHUẨN RFC 6455 WEBSOCKET =========
static inline uint32_t rol32(uint32_t value, unsigned int bits) {
  return (value << bits) | (value >> (32 - bits));
}

void computeSha1(const uint8_t* data, size_t len, uint8_t out[20]) {
  uint32_t h0 = 0x67452301;
  uint32_t h1 = 0xEFCDAB89;
  uint32_t h2 = 0x98BADCFE;
  uint32_t h3 = 0x10325476;
  uint32_t h4 = 0xC3D2E1F0;

  uint8_t msg[256];
  if (len > 180) len = 180;
  memcpy(msg, data, len);
  msg[len] = 0x80;

  size_t paddedLen = len + 1;
  while ((paddedLen % 64) != 56) {
    msg[paddedLen++] = 0x00;
  }

  uint64_t bitLen = (uint64_t)len * 8ULL;
  for (int i = 7; i >= 0; i--) {
    msg[paddedLen++] = (uint8_t)((bitLen >> (i * 8)) & 0xFF);
  }

  for (size_t offset = 0; offset < paddedLen; offset += 64) {
    uint32_t w[80];
    for (int i = 0; i < 16; i++) {
      size_t idx = offset + i * 4;
      w[i] = ((uint32_t)msg[idx] << 24) |
             ((uint32_t)msg[idx + 1] << 16) |
             ((uint32_t)msg[idx + 2] << 8) |
             ((uint32_t)msg[idx + 3]);
    }
    for (int i = 16; i < 80; i++) {
      w[i] = rol32(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }

    uint32_t a = h0, b = h1, c = h2, d = h3, e = h4;
    for (int i = 0; i < 80; i++) {
      uint32_t f, k;
      if (i < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5A827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8F1BBCDC;
      } else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      uint32_t temp = rol32(a, 5) + f + e + k + w[i];
      e = d;
      d = c;
      c = rol32(b, 30);
      b = a;
      a = temp;
    }
    h0 += a; h1 += b; h2 += c; h3 += d; h4 += e;
  }

  uint32_t hs[5] = { h0, h1, h2, h3, h4 };
  for (int i = 0; i < 5; i++) {
    out[i * 4]     = (uint8_t)((hs[i] >> 24) & 0xFF);
    out[i * 4 + 1] = (uint8_t)((hs[i] >> 16) & 0xFF);
    out[i * 4 + 2] = (uint8_t)((hs[i] >> 8) & 0xFF);
    out[i * 4 + 3] = (uint8_t)(hs[i] & 0xFF);
  }
}

String encodeBase64(const uint8_t* data, size_t len) {
  static const char* lut = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  String out;
  out.reserve(((len + 2) / 3) * 4);

  for (size_t i = 0; i < len; i += 3) {
    uint32_t n = ((uint32_t)data[i]) << 16;
    if (i + 1 < len) n |= ((uint32_t)data[i + 1]) << 8;
    if (i + 2 < len) n |= ((uint32_t)data[i + 2]);

    out += lut[(n >> 18) & 0x3F];
    out += lut[(n >> 12) & 0x3F];
    out += (i + 1 < len) ? lut[(n >> 6) & 0x3F] : '=';
    out += (i + 2 < len) ? lut[n & 0x3F] : '=';
  }
  return out;
}

// ======================= 8. ĐÓNG GÓI JSON & PHÂN TÍCH LỆNH ==================
const char* dirToStr(MotorDir d) {
  if (d == DIR_FWD) return "FWD";
  if (d == DIR_REV) return "REV";
  return "STOP";
}

String buildTelemetryJson(const char* msgType = "state", long pingToken = -1) {
  String json;
  json.reserve(520);
  json += "{\"type\":\"";
  json += msgType;
  json += "\",\"dir\":\"";
  json += dirToStr(targetDir);
  json += "\",\"speed\":";
  json += targetSpeedPct;
  json += ",\"targetPwm\":";
  json += abs(targetSignedPwm);
  json += ",\"actualPwm\":";
  json += abs(currentSignedPwm);
  json += ",\"signedPwm\":";
  json += currentSignedPwm;
  json += ",\"rpwm\":";
  json += appliedRpwm;
  json += ",\"lpwm\":";
  json += appliedLpwm;
  json += ",\"en\":";
  json += (enActive ? 1 : 0);
  json += ",\"maxPwm\":";
  json += maxPwmLimit;
  json += ",\"softReverse\":";
  json += (softReverse ? "true" : "false");
  json += ",\"invert\":";
  json += (invertMotor ? "true" : "false");
  json += ",\"failsafe\":";
  json += (failsafeEnabled ? "true" : "false");
  // Thông số Micro Servo 9g
  json += ",\"servoAngle\":";
  json += userServoAngle;
  json += ",\"appliedServoAngle\":";
  json += appliedServoAngle;
  json += ",\"servoUs\":";
  json += appliedServoUs;
  json += ",\"servoTrim\":";
  json += servoTrim;
  json += ",\"servoSwing\":";
  json += servoMaxSwing;
  json += ",\"invertServo\":";
  json += (invertServo ? "true" : "false");
  // Thông số Cảm biến tốc độ Encoder V2
  json += ",\"rpm\":";
  json += String(encoderRpm, 1);
  json += ",\"kmh\":";
  json += String(encoderSpeedKmh, 2);
  json += ",\"mps\":";
  json += String(encoderSpeedMps, 2);
  json += ",\"pulses\":";
  json += encoderPulsesSnapshot;
  json += ",\"distM\":";
  json += String((float)encoderDistanceM, 2);
  json += ",\"encLevel\":";
  json += encoderPinLevel;
  json += ",\"ppr\":";
  json += pulsesPerRev;
  json += ",\"wheelMm\":";
  json += wheelDiameterMm;
  json += ",\"clients\":";
  json += WiFi.softAPgetStationNum();
  json += ",\"uptime\":";
  json += (millis() / 1000UL);
  if (pingToken >= 0) {
    json += ",\"t\":";
    json += pingToken;
  }
  json += "}";
  return json;
}

String extractJsonStr(const String& json, const char* key) {
  String pattern = String("\"") + key + "\"";
  int kPos = json.indexOf(pattern);
  if (kPos < 0) return "";
  int colon = json.indexOf(':', kPos + pattern.length());
  if (colon < 0) return "";
  int q1 = json.indexOf('"', colon + 1);
  if (q1 < 0) return "";
  int q2 = json.indexOf('"', q1 + 1);
  if (q2 < 0) return "";
  return json.substring(q1 + 1, q2);
}

bool hasJsonKey(const String& json, const char* key) {
  String pattern = String("\"") + key + "\"";
  return json.indexOf(pattern) >= 0;
}

long extractJsonLong(const String& json, const char* key, long fallback) {
  String pattern = String("\"") + key + "\"";
  int kPos = json.indexOf(pattern);
  if (kPos < 0) return fallback;
  int colon = json.indexOf(':', kPos + pattern.length());
  if (colon < 0) return fallback;
  int i = colon + 1;
  while (i < (int)json.length() && (json[i] == ' ' || json[i] == '\t')) i++;
  int start = i;
  if (i < (int)json.length() && (json[i] == '-' || json[i] == '+')) i++;
  while (i < (int)json.length() && isDigit(json[i])) i++;
  if (i == start) return fallback;
  return json.substring(start, i).toInt();
}

bool extractJsonBool(const String& json, const char* key, bool fallback) {
  String pattern = String("\"") + key + "\"";
  int kPos = json.indexOf(pattern);
  if (kPos < 0) return fallback;
  int colon = json.indexOf(':', kPos + pattern.length());
  if (colon < 0) return fallback;
  int i = colon + 1;
  while (i < (int)json.length() && (json[i] == ' ' || json[i] == '\t')) i++;
  if (json.startsWith("true", i) || json.startsWith("1", i)) return true;
  if (json.startsWith("false", i) || json.startsWith("0", i)) return false;
  return fallback;
}

// ======================= 9. XỬ LÝ WEBSOCKET SERVER (PORT 81) ================
void wsSendFrame(WiFiClient& client, uint8_t opcode, const uint8_t* payload, size_t len) {
  if (!client || !client.connected()) return;
  uint8_t header[4];
  size_t headerLen = 0;
  header[0] = 0x80 | (opcode & 0x0F);

  if (len <= 125) {
    header[1] = (uint8_t)len;
    headerLen = 2;
  } else {
    header[1] = 126;
    header[2] = (uint8_t)((len >> 8) & 0xFF);
    header[3] = (uint8_t)(len & 0xFF);
    headerLen = 4;
  }
  client.write(header, headerLen);
  if (len > 0) {
    client.write(payload, len);
  }
}

void wsSendText(WiFiClient& client, const String& text) {
  wsSendFrame(client, 0x01, (const uint8_t*)text.c_str(), text.length());
}

void wsBroadcastState() {
  String msg = buildTelemetryJson("state");
  for (int i = 0; i < MAX_WS_CLIENTS; i++) {
    if (wsClients[i].client && wsClients[i].client.connected() && wsClients[i].handshaked) {
      wsSendText(wsClients[i].client, msg);
    }
  }
}

int countActiveWsClients() {
  int count = 0;
  for (int i = 0; i < MAX_WS_CLIENTS; i++) {
    if (wsClients[i].client && wsClients[i].client.connected() && wsClients[i].handshaked) {
      count++;
    }
  }
  return count;
}

void handleIncomingCommand(const String& payload, WiFiClient* replyClient) {
  lastClientActivityMs = millis();
  String cmd = extractJsonStr(payload, "cmd");

  if (cmd == "estop") {
    emergencyStopNow();
    Serial.println("[E-STOP] Dung khan cap Motor & tra Servo ve tam!");
    wsBroadcastState();
    return;
  }

  if (cmd == "servo") {
    if (hasJsonKey(payload, "angle")) {
      userServoAngle = constrain((int)extractJsonLong(payload, "angle", userServoAngle), 0, 180);
      applyServoOutput();
      Serial.printf("[SERVO] Angle=%d -> Applied=%d deg (%d us)\n",
                    userServoAngle, appliedServoAngle, appliedServoUs);
    }
    wsBroadcastState();
    return;
  }

  if (cmd == "control") {
    String dStr = extractJsonStr(payload, "dir");
    if (dStr == "FWD") targetDir = DIR_FWD;
    else if (dStr == "REV") targetDir = DIR_REV;
    else if (dStr == "STOP") targetDir = DIR_STOP;

    if (hasJsonKey(payload, "speed")) {
      targetSpeedPct = constrain((int)extractJsonLong(payload, "speed", targetSpeedPct), 0, 100);
    }
    if (hasJsonKey(payload, "angle")) {
      userServoAngle = constrain((int)extractJsonLong(payload, "angle", userServoAngle), 0, 180);
      applyServoOutput();
    }
    recomputeTargetPwm();
    Serial.printf("[CTRL] Dir=%s | Speed=%d%% | TargetPWM=%d | Servo=%d deg\n",
                  dirToStr(targetDir), targetSpeedPct, targetSignedPwm, appliedServoAngle);
    wsBroadcastState();
    return;
  }

  if (cmd == "reset_encoder") {
    resetEncoderCounters();
    Serial.println("[ENCODER] Da dat lai bo dem xung & quang duong ve 0!");
    wsBroadcastState();
    return;
  }

  if (cmd == "config") {
    if (hasJsonKey(payload, "maxPwm")) {
      maxPwmLimit = constrain((int)extractJsonLong(payload, "maxPwm", maxPwmLimit), 30, 255);
    }
    if (hasJsonKey(payload, "softReverse")) {
      softReverse = extractJsonBool(payload, "softReverse", softReverse);
    }
    if (hasJsonKey(payload, "invert")) {
      invertMotor = extractJsonBool(payload, "invert", invertMotor);
    }
    if (hasJsonKey(payload, "failsafe")) {
      failsafeEnabled = extractJsonBool(payload, "failsafe", failsafeEnabled);
    }
    if (hasJsonKey(payload, "servoTrim")) {
      servoTrim = constrain((int)extractJsonLong(payload, "servoTrim", servoTrim), -20, 20);
    }
    if (hasJsonKey(payload, "servoSwing")) {
      servoMaxSwing = constrain((int)extractJsonLong(payload, "servoSwing", servoMaxSwing), 15, 90);
    }
    if (hasJsonKey(payload, "invertServo")) {
      invertServo = extractJsonBool(payload, "invertServo", invertServo);
    }
    if (hasJsonKey(payload, "ppr")) {
      pulsesPerRev = constrain((int)extractJsonLong(payload, "ppr", pulsesPerRev), 1, 600);
    }
    if (hasJsonKey(payload, "wheelMm")) {
      wheelDiameterMm = constrain((int)extractJsonLong(payload, "wheelMm", wheelDiameterMm), 20, 250);
    }
    recomputeTargetPwm();
    applyServoOutput();
    recomputeEncoderDerivedMetrics();
    Serial.printf("[CFG] MaxPWM=%d | ServoTrim=%d | PPR=%d | Wheel=%dmm\n",
                  maxPwmLimit, servoTrim, pulsesPerRev, wheelDiameterMm);
    wsBroadcastState();
    return;
  }

  if (cmd == "hb" || cmd == "ping") {
    long token = extractJsonLong(payload, "t", -1);
    if (replyClient && replyClient->connected()) {
      wsSendText(*replyClient, buildTelemetryJson("pong", token));
    }
    return;
  }

  if (cmd == "status") {
    if (replyClient && replyClient->connected()) {
      wsSendText(*replyClient, buildTelemetryJson("state"));
    }
  }
}

bool performWsHandshake(WiFiClient& client) {
  unsigned long deadline = millis() + 400;
  String wsKey = "";
  String line = "";

  while (millis() < deadline && client.connected()) {
    while (client.available()) {
      char c = (char)client.read();
      if (c == '\r') continue;
      if (c == '\n') {
        if (line.length() == 0) {
          if (wsKey.length() == 0) return false;
          String combined = wsKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
          uint8_t sha1Out[20];
          computeSha1((const uint8_t*)combined.c_str(), combined.length(), sha1Out);
          String acceptKey = encodeBase64(sha1Out, 20);

          client.print(
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n"
          );
          return true;
        }
        String lower = line;
        lower.toLowerCase();
        if (lower.startsWith("sec-websocket-key:")) {
          wsKey = line.substring(18);
          wsKey.trim();
        }
        line = "";
      } else {
        if (line.length() < 256) line += c;
      }
    }
    delay(1);
  }
  return false;
}

void pollWebSocketServer() {
  if (wsServer.hasClient()) {
    WiFiClient incoming = wsServer.available();
    incoming.setNoDelay(true);

    int freeIdx = -1;
    for (int i = 0; i < MAX_WS_CLIENTS; i++) {
      if (!wsClients[i].client || !wsClients[i].client.connected()) {
        freeIdx = i;
        break;
      }
    }
    if (freeIdx < 0) {
      wsClients[0].client.stop();
      wsClients[0].handshaked = false;
      freeIdx = 0;
    }
    wsClients[freeIdx].client = incoming;
    wsClients[freeIdx].handshaked = false;
  }

  for (int i = 0; i < MAX_WS_CLIENTS; i++) {
    WiFiClient& c = wsClients[i].client;
    if (!c) continue;

    if (!c.connected()) {
      c.stop();
      if (wsClients[i].handshaked) {
        wsClients[i].handshaked = false;
        Serial.printf("[WS] Client #%d ngat ket noi.\n", i);
        if (failsafeEnabled && countActiveWsClients() == 0 && targetDir != DIR_STOP) {
          Serial.println("[FAILSAFE] Khong con dien thoai ket noi -> Dung motor an toan!");
          targetDir = DIR_STOP;
          targetSpeedPct = 0;
          recomputeTargetPwm();
        }
      }
      continue;
    }

    if (!wsClients[i].handshaked) {
      if (c.available()) {
        if (performWsHandshake(c)) {
          wsClients[i].handshaked = true;
          lastClientActivityMs = millis();
          Serial.printf("[WS] Client #%d ket noi thanh cong!\n", i);
          wsSendText(c, buildTelemetryJson("state"));
        } else {
          c.stop();
        }
      }
      continue;
    }

    while (c.connected() && c.available() >= 2) {
      uint8_t b0 = c.read();
      uint8_t b1 = c.read();
      uint8_t opcode = b0 & 0x0F;
      bool masked = (b1 & 0x80) != 0;
      uint64_t payloadLen = b1 & 0x7F;

      unsigned long waitDeadline = millis() + 25;
      if (payloadLen == 126) {
        while (c.available() < 2 && millis() < waitDeadline) delay(1);
        if (c.available() < 2) { c.stop(); break; }
        payloadLen = ((uint16_t)c.read() << 8) | (uint16_t)c.read();
      } else if (payloadLen == 127 || payloadLen > 512) {
        c.stop();
        break;
      }

      uint8_t mask[4] = {0, 0, 0, 0};
      if (masked) {
        while (c.available() < 4 && millis() < waitDeadline) delay(1);
        if (c.available() < 4) { c.stop(); break; }
        for (int m = 0; m < 4; m++) mask[m] = c.read();
      }

      char buf[516];
      size_t readCount = 0;
      while (readCount < payloadLen && millis() < waitDeadline) {
        if (c.available()) {
          uint8_t byteVal = c.read();
          if (masked) byteVal ^= mask[readCount % 4];
          buf[readCount++] = (char)byteVal;
        } else {
          delay(1);
        }
      }
      buf[readCount] = '\0';

      if (opcode == 0x08) {
        c.stop();
        wsClients[i].handshaked = false;
        break;
      } else if (opcode == 0x09) {
        wsSendFrame(c, 0x0A, (const uint8_t*)buf, readCount);
      } else if (opcode == 0x01) {
        handleIncomingCommand(String(buf), &c);
      }
    }
  }
}

// ======================= 10. HTTP API DỰ PHÒNG & TRANG CHẨN ĐOÁN ============
void sendCorsJson(const String& body) {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  httpServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  httpServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  httpServer.send(200, "application/json", body);
}

void setupHttpRoutes() {
  httpServer.on("/", HTTP_GET, []() {
    String html =
      "<!DOCTYPE html><html><head><meta charset='utf-8'>"
      "<meta name='viewport' content='width=device-width,initial-scale=1'>"
      "<title>ESP32 RC Controller</title>"
      "<style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:20px;text-align:center}"
      ".card{background:#1e293b;border-radius:12px;padding:20px;max-width:440px;margin:auto}"
      ".ok{color:#4ade80;font-weight:bold}</style></head><body>"
      "<div class='card'><h2>ESP32 + IBT-2 + Servo 9g + Encoder V2</h2>"
      "<p class='ok'>● WiFi &amp; WebSocket (ws://192.168.4.1:81) đang hoạt động!</p>"
      "<p>Mở ứng dụng <b>Expo Go</b> để điều khiển xe &amp; xem đồng hồ tốc độ thực tế.</p>"
      "<p><small>IBT-2: 25,26,27,33 | Servo 9g: GPIO 32 | Encoder V2: GPIO 13</small></p>"
      "</div></body></html>";
    httpServer.sendHeader("Access-Control-Allow-Origin", "*");
    httpServer.send(200, "text/html", html);
  });

  httpServer.on("/status", HTTP_GET, []() {
    lastClientActivityMs = millis();
    sendCorsJson(buildTelemetryJson("state"));
  });

  httpServer.on("/encoder/reset", HTTP_GET, []() {
    lastClientActivityMs = millis();
    resetEncoderCounters();
    wsBroadcastState();
    sendCorsJson(buildTelemetryJson("state"));
  });

  httpServer.on("/servo", HTTP_GET, []() {
    lastClientActivityMs = millis();
    if (httpServer.hasArg("angle")) {
      userServoAngle = constrain(httpServer.arg("angle").toInt(), 0, 180);
      applyServoOutput();
    }
    wsBroadcastState();
    sendCorsJson(buildTelemetryJson("state"));
  });

  httpServer.on("/control", HTTP_GET, []() {
    lastClientActivityMs = millis();
    if (httpServer.hasArg("dir")) {
      String d = httpServer.arg("dir");
      d.toUpperCase();
      if (d == "FWD") targetDir = DIR_FWD;
      else if (d == "REV") targetDir = DIR_REV;
      else targetDir = DIR_STOP;
    }
    if (httpServer.hasArg("speed")) {
      targetSpeedPct = constrain(httpServer.arg("speed").toInt(), 0, 100);
    }
    if (httpServer.hasArg("angle")) {
      userServoAngle = constrain(httpServer.arg("angle").toInt(), 0, 180);
      applyServoOutput();
    }
    recomputeTargetPwm();
    wsBroadcastState();
    sendCorsJson(buildTelemetryJson("state"));
  });

  httpServer.on("/estop", HTTP_GET, []() {
    lastClientActivityMs = millis();
    emergencyStopNow();
    wsBroadcastState();
    sendCorsJson(buildTelemetryJson("state"));
  });

  httpServer.on("/config", HTTP_GET, []() {
    lastClientActivityMs = millis();
    if (httpServer.hasArg("maxPwm")) {
      maxPwmLimit = constrain(httpServer.arg("maxPwm").toInt(), 30, 255);
    }
    if (httpServer.hasArg("softReverse")) {
      softReverse = (httpServer.arg("softReverse") == "1" || httpServer.arg("softReverse") == "true");
    }
    if (httpServer.hasArg("invert")) {
      invertMotor = (httpServer.arg("invert") == "1" || httpServer.arg("invert") == "true");
    }
    if (httpServer.hasArg("failsafe")) {
      failsafeEnabled = (httpServer.arg("failsafe") == "1" || httpServer.arg("failsafe") == "true");
    }
    if (httpServer.hasArg("servoTrim")) {
      servoTrim = constrain(httpServer.arg("servoTrim").toInt(), -20, 20);
    }
    if (httpServer.hasArg("servoSwing")) {
      servoMaxSwing = constrain(httpServer.arg("servoSwing").toInt(), 15, 90);
    }
    if (httpServer.hasArg("invertServo")) {
      invertServo = (httpServer.arg("invertServo") == "1" || httpServer.arg("invertServo") == "true");
    }
    if (httpServer.hasArg("ppr")) {
      pulsesPerRev = constrain(httpServer.arg("ppr").toInt(), 1, 600);
    }
    if (httpServer.hasArg("wheelMm")) {
      wheelDiameterMm = constrain(httpServer.arg("wheelMm").toInt(), 20, 250);
    }
    recomputeTargetPwm();
    applyServoOutput();
    recomputeEncoderDerivedMetrics();
    wsBroadcastState();
    sendCorsJson(buildTelemetryJson("state"));
  });
}

// ======================= 11. SETUP & MAIN LOOP ==============================
void setup() {
  setupHardwarePins();
  pinMode(PIN_STATUS, OUTPUT);
  digitalWrite(PIN_STATUS, LOW);

  Serial.begin(115200);
  delay(200);
  Serial.println("\n=============================================================");
  Serial.println("  ESP32 + IBT-2 + SERVO 9G + ENCODER V2 WIFI RC CONTROLLER   ");
  Serial.println("=============================================================");

  WiFi.mode(WIFI_AP);
  WiFi.setSleep(false);
  WiFi.softAPConfig(AP_IP, AP_GATEWAY, AP_SUBNET);
  bool apOk = WiFi.softAP(WIFI_SSID, WIFI_PASSWORD, WIFI_CHANNEL, 0, MAX_CLIENTS);

  if (apOk) {
    Serial.printf("[WIFI] Phat WiFi thanh cong! SSID: %s | Pass: %s\n", WIFI_SSID, WIFI_PASSWORD);
    Serial.print("[WIFI] Dia chi IP ESP32: ");
    Serial.println(WiFi.softAPIP());
  } else {
    Serial.println("[WIFI] LOI khoi tao Access Point!");
  }

  setupHttpRoutes();
  httpServer.begin();
  wsServer.begin();
  wsServer.setNoDelay(true);

  Serial.println("[SERVER] HTTP Server san sang tai:      http://192.168.4.1");
  Serial.println("[SERVER] WebSocket Server san sang tai: ws://192.168.4.1:81");
  Serial.println("[PINS]   IBT-2: 25,26,27,33 | SERVO 9g: GPIO 32 | ENCODER V2: GPIO 13 (a15)");
}

void loop() {
  pollWebSocketServer();
  httpServer.handleClient();

  unsigned long nowMs = millis();
  if (failsafeEnabled && targetDir != DIR_STOP) {
    if (nowMs - lastClientActivityMs > FAILSAFE_TIMEOUT_MS) {
      Serial.println("[FAILSAFE] Qua thoi gian cho tin hieu -> Tu dong dung motor!");
      targetDir = DIR_STOP;
      targetSpeedPct = 0;
      recomputeTargetPwm();
      wsBroadcastState();
    }
  }

  bool pwmChanged     = updateMotorControlLoop();
  bool encoderChanged = updateEncoderTelemetry(nowMs);

  if (pwmChanged && (nowMs - lastTelemetryMs >= 50)) {
    lastTelemetryMs = nowMs;
    wsBroadcastState();
  } else if (encoderChanged && (nowMs - lastTelemetryMs >= 130)) {
    lastTelemetryMs = nowMs;
    if (countActiveWsClients() > 0) {
      wsBroadcastState();
    }
  } else if (nowMs - lastTelemetryMs >= 500) {
    lastTelemetryMs = nowMs;
    if (countActiveWsClients() > 0) {
      wsBroadcastState();
    }
  }

  if (countActiveWsClients() > 0) {
    digitalWrite(PIN_STATUS, HIGH);
  } else if (nowMs - lastLedBlinkMs >= 600) {
    lastLedBlinkMs = nowMs;
    ledState = !ledState;
    digitalWrite(PIN_STATUS, ledState ? HIGH : LOW);
  }
}
