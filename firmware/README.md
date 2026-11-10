> Public GitHub sanitization note: the Wi-Fi AP password in firmware was replaced by a placeholder. Set a strong private one for real hardware. Original unreviewed archive remains external.

# Hệ Thống Điều Khiển Xe ESP32 + IBT-2 + Micro Servo 9g (XL4015) + Cảm Biến Tốc Độ Encoder V2 (Expo)

Dự án bao gồm trọn bộ 2 thành phần đã được tối ưu hóa cho mạch thử nghiệm trên **Breadboard MB-102**:
1. **[esp32_ibt2_controller/esp32_ibt2_controller.ino](./esp32_ibt2_controller/esp32_ibt2_controller.ino)**: Firmware điều khiển đồng thời **Motor đẩy sau (IBT-2 PWM 20 kHz)**, **Micro Servo 9g lái bánh trước (PWM 50 Hz 14-bit trên `GPIO 32`)** và **Đọc cảm biến tốc độ quang Encoder V2 bằng ngắt phần cứng `IRAM` trên `GPIO 13`**, nạp trực tiếp bằng **Arduino IDE** (không cần cài thêm thư viện ngoài, tương thích cả gói board ESP32 `v2.x` lẫn `v3.x`).
2. **[expo-motor-controller/](./expo-motor-controller/)**: Ứng dụng buồng lái ngang (**Landscape Cockpit**) trên điện thoại **Android & iOS** chạy trực tiếp qua **Expo Go**, tích hợp **Vô-lăng xoay tròn tự trả tâm (`0°–180°`)**, **Hộp số `P-R-N-D` + Bàn đạp Ga/Phanh cảm ứng đa điểm**, **Đồng hồ Digital Sport (`km/h`, `RPM`, `ODO`, Chế độ `ECO/NORMAL/SPORT`)** và **Garage cân chỉnh kỹ thuật** qua WebSocket thời gian thực (`ws://192.168.4.1:81`).

---

## 1. Sơ Đồ Đấu Dây Đầy Đủ Trên Breadboard (MB-102 ↔ ESP32 ↔ IBT-2 + XL4015 + Servo 9g + Encoder V2)

![Sơ đồ cắm dây đầy đủ MB-102, ESP32-DevKitC, XL4015, Micro Servo 9g, Encoder V2 và IBT-2](./so-do-full-mb102-xl4015-servo-encoder.png)

> **⚠️ CẢNH BÁO BẮT BUỘC TRƯỚC KHI CẮM MICRO SERVO 9G:** Mạch hạ áp **DC-DC Buck XL4015** mới mua thường để sẵn áp ra gần bằng áp vào (`12V+`), trong khi **Servo 9g (SG90) cháy ngay nếu quá `6.0V`**. Hãy cấp nguồn Pin vào `IN+ / IN-` của XL4015 (chưa cắm `OUT+` vào Breadboard), đo đồng hồ VOM ở `OUT+ / OUT-` và vặn vít đồng biến trở xanh **ngược chiều kim đồng hồ 10–15 vòng** cho tới khi đạt đúng **`5.0V` (`4.8V – 5.2V`)**, rồi ngắt nguồn mới cắm dây vào rãnh nguồn MB-102!

### A. Cảm biến tốc độ Encoder V2 (Khe chữ U 3 chân IC 74HC14 + Đĩa 20 khe) & Trạm chia `3.3V`
| Điểm bắt đầu | Điểm cắm trên MB-102 | Chức năng |
| :--- | :--- | :--- |
| **Lỗ `a1` (`3V3` trên ESP32)** | **Lỗ `e25`** *(Hàng ngang 25 trái)* | Tạo **Trạm chia nguồn `3.3V` sạch** gồm 4 lỗ trống (`a25..d25`) dưới đáy ESP32 |
| **Chân `VCC` của Encoder V2** | **Lỗ `a25`** *(Trạm `3.3V`)* | Nuôi `74HC14` ở mức `3.3V` để chân `OUT` xuất xung `3.3V` an toàn tuyệt đối cho ESP32 |
| **Chân `GND` của Encoder V2** | **Rãnh nguồn Trái `(-)` vạch Xanh** *(hàng 26)* | Chung Mass (`GND`) với ESP32, XL4015, Servo 9g và IBT-2 |
| **Chân `OUT / DO` của Encoder V2** | **Lỗ `a15` (`GPIO 13` trên ESP32)** | Đếm xung ngắt tốc độ cao tính `RPM`, `km/h` và quãng đường `m` |

### B. Mạch hạ áp DC-DC Buck XL4015 & Micro Servo 9g (SG90)
| Điểm bắt đầu | Điểm cắm trên MB-102 / Mạch | Chức năng |
| :--- | :--- | :--- |
| **Pin `(+)` / `(-)` 7.4V–12V** | **`XL4015 IN+` / `IN-`** *(chia đôi cùng `IBT-2 B+/B-`)* | Nguồn đầu vào cho mạch hạ áp |
| **`XL4015 OUT+` (đã chỉnh `5.0V`)** | **Rãnh nguồn Trái `(+)` vạch Đỏ** *(hàng 17)* | Cấp nguồn `5.0V` riêng nuôi Servo 9g |
| **`XL4015 OUT-`** | **Rãnh nguồn Trái `(-)` vạch Xanh** *(hàng 18)* | Đường Mass đầu ra nối vào Bus GND chung |
| **Dây Đỏ / Nâu / Cam Servo 9g** | **Đỏ → `(+)` trái** \| **Nâu → `(-)` trái** \| **Cam → `Lỗ a7` (`GPIO 32`)** | Nguồn `5.0V` + Mass chung + Xung lái `0°–180°` (50 Hz) |
| **Lỗ `a14` (`GND` trên ESP32)** | **Rãnh nguồn Trái `(-)` vạch Xanh** *(hàng 14)* | **Cầu Mass chung bắt buộc** cho toàn mạch |

### C. Cụm 8 chân tín hiệu điều khiển của IBT-2 nối với ESP32-DevKitC
| Chân trên IBT-2 | Vị trí lỗ trên MB-102 (Chân ESP32) | Chức năng |
| :--- | :--- | :--- |
| **1. `RPWM`** | **Lỗ `a9` (`GPIO 25`)** | Xung PWM điều khiển tốc độ chiều Tiến (20 kHz) |
| **2. `LPWM`** | **Lỗ `a10` (`GPIO 26`)** | Xung PWM điều khiển tốc độ chiều Lùi (20 kHz) |
| **3. `R_EN`** | **Lỗ `a11` (`GPIO 27`)** | Cho phép kích hoạt nửa cầu phải |
| **4. `L_EN`** | **Lỗ `a8` (`GPIO 33`)** | Cho phép kích hoạt nửa cầu trái |
| **5. `R_IS` / 6. `L_IS`** | *(Để trống)* | Báo dòng quá tải (không nối trực tiếp vào ESP32) |
| **7. `VCC`** | **Lỗ `c25` (Trạm chia `3.3V` hàng 25 trái)** | Cấp nguồn 3.3V nuôi IC đệm 74HC244 trên IBT-2 |
| **8. `GND`** | **Rãnh nguồn Trái `(-)` vạch Xanh** *(hàng 13)* | Chung Mass (`GND`) với ESP32 (`a14`), XL4015, Servo và Encoder V2 |

### C. Cụm Domino ốc vít công suất lớn trên IBT-2
- **`B+` và `B-`**: Nối vào cực **Dương (+)** và **Âm (-)** của nguồn nuôi động cơ (Pin 2S/3S 18650 hoặc ắc quy 12V, chia đôi song song sang `IN+ / IN-` của XL4015). **Tuyệt đối không lấy chân 5V/VIN của ESP32 hay ngõ `OUT+ 5V` của XL4015 cấp vào `B+`**.
- **`M+` và `M-`**: Nối ra 2 dây của Motor đẩy sau. *(Nếu motor hoặc Servo quay ngược chiều mong muốn, bạn bật nút **"Đảo chiều quay Servo"** hoặc **"Đảo cực dây Motor"** ngay trên App Expo mà không cần tháo dây).*

---

## 2. Cách Nạp Code Vào ESP32 Bằng Arduino IDE

1. Mở phần mềm **Arduino IDE** trên máy tính.
2. Nếu chưa cài gói mạch ESP32:
   - Vào **File → Preferences** → ô *Additional Boards Manager URLs* dán:
     `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
   - Vào **Tools → Board → Boards Manager**, tìm **`esp32`** (của *Espressif Systems*) và nhấn **Install**.
3. Mở file [`esp32_ibt2_controller/esp32_ibt2_controller.ino`](./esp32_ibt2_controller/esp32_ibt2_controller.ino).
4. Chọn mạch & cổng nạp:
   - **Tools → Board → esp32 → ESP32 Dev Module**
   - **Tools → Port → COMx** (cổng USB của mạch ESP32)
5. Nhấn nút **Upload (→)**. *(Nếu màn hình hiện `Connecting.....` lâu, nhấn giữ nút **BOOT** trên mạch ESP32 khoảng 2 giây rồi thả ra).*
6. Mở **Tools → Serial Monitor** (chọn tốc độ `115200 baud`), bạn sẽ thấy thông báo:
   - Tên WiFi phát ra: **`ESP32-Motor-RC`** | Mật khẩu: **`CHANGE_ME_BEFORE_USE`**
   - Địa chỉ IP mạch: **`192.168.4.1`**

---

## 3. Cách Chạy App Điều Khiển Trên Điện Thoại (Android & iOS)

1. Cài ứng dụng **Expo Go** từ Google Play (Android) hoặc App Store (iPhone).
2. Mở Terminal / PowerShell tại thư mục `expo-motor-controller` và chạy:

```powershell
cd "d:\Xe Điều Khiển\expo-motor-controller"
npm start
```

3. **Hai cách kết nối cực tiện khi dùng chế độ ESP32 tự phát WiFi riêng (`192.168.4.1`):**
   - **Cách 1 (Khuyên dùng - Nhanh nhất):**
     1. Điện thoại và máy tính đang bắt chung WiFi nhà → dùng điện thoại quét mã **QR** trên Terminal để mở App trong **Expo Go** (hoặc chạy `npm run start:tunnel` nếu khác mạng).
     2. Khi giao diện điều khiển đã hiện lên trên điện thoại, bạn mở **Cài đặt WiFi** của điện thoại → chuyển sang bắt mạng **`ESP32-Motor-RC`** (Mật khẩu: `CHANGE_ME_BEFORE_USE`).
     3. Nếu điện thoại hỏi *"Mạng WiFi này không có Internet, giữ kết nối?"*, hãy chọn **Giữ kết nối (Keep Wi-Fi)**.
     4. Quay trở lại cửa sổ **Expo Go** → App tự động bắt kết nối WebSocket (`ĐÃ KẾT NỐI REALTIME (WS)`) ngay lập tức!
   - **Cách 2 (Không cần mạng WiFi nhà):**
     1. Cho **cả Laptop và Điện thoại** cùng bắt trực tiếp vào WiFi **`ESP32-Motor-RC`** do ESP32 phát ra.
     2. Trên Laptop chạy lệnh `npm run start:offline` rồi quét mã QR mở trên Expo Go.

---

## 4. Các Kho Mã Nguồn Mở (GitHub Open-Source) Tham Khảo & Mở Rộng

Nếu sau này bạn muốn mở rộng thêm tính năng cho xe, dưới đây là các dự án mã nguồn mở chuẩn phổ biến nhất trong cộng đồng ESP32 & React Native:

- **Điều khiển xe ESP32 qua WebSocket & PWM:**
  - [`Links2004/arduinoWebSockets`](https://github.com/Links2004/arduinoWebSockets) — Thư viện WebSocket chuyên dụng cho ESP32/Arduino.
  - [`Hiroshimeow/ESP32_WebSocket_Car`](https://github.com/Hiroshimeow/ESP32_WebSocket_Car) — Mẫu xe điều khiển thời gian thực qua WebSocket và WiFi.
  - [`TheDeveloperOps/ESP-RC-CAR`](https://github.com/TheDeveloperOps/ESP-RC-CAR) — Mẫu xe điều khiển WiFi Access Point kèm Joystick cảm ứng.
- **Điều khiển Servo bánh lái trước cho ESP32:**
  - [`madhephaestus/ESP32Servo`](https://github.com/madhephaestus/ESP32Servo) — Thư viện chuẩn điều khiển góc Servo SG90/MG996R trên ESP32 không xung đột kênh PWM với động cơ sau.
- **Nạp firmware qua trình duyệt / Nạp không dây OTA (khi đã đóng vỏ xe):**
  - [`ayushsharma82/ElegantOTA`](https://github.com/ayushsharma82/ElegantOTA) — Trang cập nhật code `.bin` không dây qua WiFi (`http://192.168.4.1/update`).
  - [`esphome/esp-web-tools`](https://github.com/esphome/esp-web-tools) / [`espressif/esptool-js`](https://github.com/espressif/esptool-js) — Công cụ nạp firmware ESP32 trực tiếp trên trình duyệt Chrome/Edge qua cáp USB (Web Serial).
- **Giao diện tay cầm React Native / Expo tham khảo:**
  - [`salihbektas/react-native-esp32-bluetooth-RC-car`](https://github.com/salihbektas/react-native-esp32-bluetooth-RC-car) — Mẫu bố cục nút điều khiển xe RC viết bằng React Native / Expo.
