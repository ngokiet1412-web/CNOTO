# CNOTO — BTL Công nghệ ô tô (HCMUT, HK261)

> **Nguồn phối hợp chính cho các AI agent (Codex / ChatGPT / Claude)** — cập nhật lần đầu: **2026-11-10**.  
> **Tình trạng: ĐANG TRIỂN KHAI / CHƯA NGHIỆM THU.**

## Đọc trước khi làm việc

1. [AGENTS.md](AGENTS.md) — quy tắc cho mọi agent.
2. [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) — bản chất đề tài, thay đổi phương án thiết kế.
3. [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md) — đã có / còn thiếu / mức độ xác minh.
4. [docs/SV02_GENERAL_LAYOUT.md](docs/SV02_GENERAL_LAYOUT.md) — hạng mục bố trí chung ưu tiên.
5. [sources/SOURCE_INDEX.md](sources/SOURCE_INDEX.md) — nguồn Drive/Zalo, bản CAD, bản vẽ, ảnh, code.
6. [docs/DECISIONS_AND_CONFLICTS.md](docs/DECISIONS_AND_CONFLICTS.md) — xung đột phải xử lý, không được suy đoán.
7. [docs/WORKSTREAMS.md](docs/WORKSTREAMS.md) — chia lane công việc.

## Tóm tắt đề tài

Nhóm đã **chuyển từ ý tưởng tự thiết kế/in 3D một xe mô hình** sang phương án **mua xe RC có sẵn, tháo rời, đo đạc, dựng lại CAD (reverse engineering), lắp lại và phát triển/kiểm tra hệ điện điều khiển**. Bản vẽ sơ bộ từ tháng 10 **không được xem là cấu hình đã chốt**.

Các đầu ra đã thấy: bộ CAD SolidWorks (assembly/part/STEP), 26 bản vẽ lắp BTL.001–BTL.026, tài liệu Phần 3 lắp ráp, ảnh xe RC thực tế, sơ đồ điện và code ESP32 + app Expo. Chưa chứng minh được CAD lắp tổng **đúng mating, không thiếu tham chiếu, không giao thoa** hoặc xe đã hoàn thành nghiệm thu.

## Nguyên tắc lưu trữ

- **GitHub:** code *gốc đã lọc phụ thuộc*, hướng dẫn, issue, hợp đồng giao tiếp, bảng chứng cứ và tài liệu đủ quyền công bố.
- **Google Drive / nguồn chủ:** CAD và tài liệu nặng; dùng liên kết chính xác, checksum, version và trạng thái xác minh trong [SOURCE_INDEX](sources/SOURCE_INDEX.md). Không tự nhận file đã upload vào GitHub nếu mới chỉ có link.
- **Không upload** `node_modules`, `.expo`, file khóa tạm `~$`, bản sao ZIP, tài khoản/mật khẩu/secret hay dữ liệu cá nhân lên repo public.
- Không merge nhánh thử nghiệm vào `main` hay tuyên bố nghiệm thu thay nhóm mà không có bằng chứng.

## Links

- [Thư mục Drive môn học](https://drive.google.com/drive/folders/1MnC5ETlnFnsuV9elcNisg4hBBm0W-9Vc)
- [Ảnh thật của xe, tài liệu cnoto](https://docs.google.com/document/d/1am_u-qz0aHC4FkCG0Hg1pSDOEQbMZIKDvrzGIA9GNIY/edit)
- [Tài liệu BẢN VẼ LẮP RÁP](https://docs.google.com/document/d/1-xck_Gq65nhjGl2bz79CEh4zQG6qQDT_/edit)

**Lưu ý cho agent:** tài liệu bên dưới là *snapshot handoff*, không phải bằng chứng mọi nguồn gốc đều đã được chép vào repo. Nếu nguồn chưa có quyền truy cập, báo BLOCKED thay vì đoán.


## Đã đưa trực tiếp lên GitHub (xác minh ngày 2026-11-10)

- [Mã nguồn Arduino ESP32](firmware/esp32_ibt2_controller.ino), [sơ đồ SVG](firmware/) và [app Expo](app/expo-motor-controller/) (**21 file cleaned**).
- [Chín nguồn Drive](sources/GITHUB_IMPORTED_FILES.md): bản SV02 sơ bộ, điện, treo, tấm sàn, kế hoạch/BOM.
- [Bốn nguồn bổ sung từ file Zalo](sources/ADDITIONAL_GITHUB_IMPORTS.md): Word trình tự lắp, ảnh tóm tắt xe thật, hai ứng viên part SolidWorks.
- [Prompt chuyển giao agent](docs/AGENT_START_PROMPT.md) và [các Issue nhiệm vụ](https://github.com/ngokiet1412-web/CNOTO/issues).
- [Hướng dẫn nhập CAD gốc bằng Git LFS](docs/LOCAL_CAD_IMPORT.md) — nguyên ZIP lớn và các file còn thiếu **chưa ở GitHub**.

**Cảnh báo:** code đã được import nhưng chưa biên dịch/kiểm thử; các source SV02 tháng 10 chưa phải bản theo xe RC mua thật.
