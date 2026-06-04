# SPEC SẢN PHẨM: TRỢ LÝ TÀI CHÍNH CÁ NHÂN MONI AI

## 1. Bằng chứng

Phần SPEC này chỉ dựa trên các file đang có trong repo này, không dựa vào folder `02-group-spec`.

### 1.1. Bằng chứng từ trải nghiệm và tài liệu đã lưu trong repo

| Ảnh 1 | Ảnh 2 | Ảnh 3 | Ảnh 4 |
|---|---|---|---|
| <img src="img/anh1.jpg" width="220" /> | <img src="img/anh2.jpg" width="220" /> | <img src="img/anh3.jpg" width="220" /> | <img src="img/anh4.jpg" width="220" /> |

Những ảnh trong `spec/img/` cho thấy một mô hình vấn đề nhất quán:

- trợ lý tài chính đang được kỳ vọng trả lời như một chat assistant thân thiện;
- người dùng muốn hỏi về chi tiêu, kế hoạch tiết kiệm, và tình trạng tài chính của mình;
- trải nghiệm bị gãy khi hệ thống không chuyển được từ hỏi đáp sang hành động có cấu trúc.

### 1.2. Bằng chứng từ code và dữ liệu mock

Những file sau cho thấy prototype hiện tại đã chốt hướng sản phẩm khá rõ:

- `codebase/src/data/finance_data.json`
  File này chứa số dư ví, lịch sử giao dịch, tổng thu/chi, chi tiêu theo nhóm, saving goal mẫu và `moni_notes`.
- `codebase/src/tools/finance_tools.py`
  File này cho thấy nhóm không để LLM tự bịa số tài chính mà tách ra thành các tool xác định dữ liệu và tính toán như `get_current_balance`, `get_transaction_summary`, `get_category_breakdown`, `create_saving_plan`, `create_moni_note`.
- `codebase/src/agent/agent.py`
  Agent đã có guardrail rõ ràng: không được chuyển tiền/thanh toán thật, phải dùng tool cho dữ liệu factual, và phải fallback sang Moni Note khi nguồn dữ liệu lỗi.
- `codebase/frontend/src/services/chatService.js`
  Frontend đã gọi API thật tới `/agent`, nghĩa là luồng demo chính đang là giao diện chat -> backend agent -> tool -> trả lời.
- `codebase/frontend/src/pages/ChatPage/ChatPage.jsx`
  Giao diện hiện có lịch sử hội thoại, typing indicator, streaming message và thông báo lỗi khi request thất bại.

### 1.3. Tổng hợp nỗi đau và quyết định sản phẩm

Từ các file trong repo, có thể kết luận 3 vấn đề cốt lõi mà prototype đang giải:

| Vấn đề | Bằng chứng trong repo | Hướng xử lý sản phẩm |
|---|---|---|
| Người dùng muốn biết tình hình tài chính nhưng không muốn tự tổng hợp bằng tay | `finance_data.json` có giao dịch, summary, chi tiêu theo nhóm; `finance_tools.py` có tool tổng hợp | Dùng AI để biến câu chat thành truy vấn và tóm tắt ngắn gọn |
| Người dùng muốn lập kế hoạch tiết kiệm nhưng dễ gãy ở bước tính toán và cấu trúc hóa mục tiêu | `create_saving_plan` và `saving_goals` trong `finance_data.json` | Dùng AI để đọc mục tiêu từ ngôn ngữ tự nhiên và trả về mức tiết kiệm theo tháng |
| Khi dữ liệu/tool lỗi, luồng chat dễ bị gãy | `create_moni_note` và fallback trong `agent.py` | Không giả vờ trả lời, mà chuyển sang Moni Note để ghi nhận tạm thời |

## 2. Lát cắt để build

Cho **một người trẻ đang muốn tiết kiệm 5.000.000đ trong 3 tháng**, prototype dùng AI để **hiểu mục tiêu viết bằng ngôn ngữ tự nhiên, gọi tool tính số tiền cần tiết kiệm mỗi tháng và trả về kế hoạch rõ ràng**, tạo ra **một câu trả lời chat có thể dùng ngay để ra quyết định**, và nếu dữ liệu hoặc tool gặp lỗi thì **chuyển sang Moni Note để ghi nhận tạm thay vì để luồng bị gãy**.

Đây là lát cắt nhỏ nhất nhưng đủ chứng minh được 3 giả thuyết sản phẩm:

- AI có ích khi biến nhu cầu mơ hồ thành cấu trúc tài chính cụ thể.
- Số liệu tài chính nên đi qua tool xác định, không để LLM tự tưởng tượng.
- Fallback là một phần của trải nghiệm, không phải tình huống ngoại lệ bị bỏ qua.

## 3. AI Product Canvas

| Ô | Trả lời dựa trên prototype hiện tại |
|---|---|
| **Value - Giá trị** | Sản phẩm dành cho sinh viên và người mới đi làm muốn theo dõi chi tiêu và lập mục tiêu tiết kiệm ngắn hạn. AI giải được việc đọc ý định từ câu chat, gọi tool để lấy dữ liệu tài chính và diễn giải thành câu trả lời dễ hiểu. So với cách làm thủ công, user đỡ phải tự tính tay mức tiết kiệm mỗi tháng và đỡ phải tự tổng hợp giao dịch. |
| **Trust - Niềm tin** | Agent đã có rule rõ ràng trong `codebase/src/agent/agent.py`: cấm hành động tài chính thật, bắt buộc dùng tool cho dữ liệu factual, và nếu lỗi thì nói thật rồi fallback sang Moni Note. User nhận ra AI sai khi số tiền không khớp, khi câu hỏi còn mơ hồ, hoặc khi tool lỗi. Khi đó user có thể hỏi lại, nhập lại mục tiêu, hoặc chuyển sang ghi chú tạm. |
| **Feasibility - Tính khả thi** | Lát cắt này khả thi vì dữ liệu mock đã có trong `finance_data.json`, API `/agent` đã có trong `codebase/src/api/main.py`, frontend đã gọi tới backend thật trong `chatService.js`, và các phép tính quan trọng nằm trong Python tools. Rủi ro lớn nhất hiện tại là parse action JSON, chat flow chưa có UI xác nhận riêng, và chat frontend chưa biểu diễn rõ trace/tool call. |
| **Tín hiệu học** | Tín hiệu học hiện tại đến từ lịch sử hội thoại lưu bằng `localStorage`, từ việc user đặt lại câu hỏi cho rõ hơn, và từ các Moni Note được tạo khi fallback. Nếu user liên tục sửa mục tiêu hoặc hỏi lại số tiền, đó là dấu hiệu prompt hoặc bước clarify của agent chưa tốt. |

## 4. Tăng năng lực hay tự động hóa

Nhóm chọn **tăng năng lực (augmentation)**.

Trong prototype này, AI chỉ nên:

- hiểu câu hỏi của người dùng;
- chọn đúng tool cần dùng;
- tóm tắt và diễn giải kết quả tài chính;
- đề xuất cách xử lý tạm thời khi hệ thống lỗi.

Con người vẫn giữ quyền quyết định ở các bước:

- có dùng kế hoạch tiết kiệm AI đề xuất hay không;
- có sửa mục tiêu/thời hạn hay không;
- có chấp nhận ghi tạm bằng Moni Note khi hệ thống lỗi hay không.

Lý do chọn augmentation:

- đây là bài toán fintech, sai số về tiền dễ làm mất niềm tin ngay;
- repo đã thể hiện rõ chủ trương "không làm hành động tài chính thật";
- dữ liệu hiện tại là mock data, phù hợp để hỗ trợ lập kế hoạch và phân tích hơn là tự động thao tác;
- những bước AI làm tốt nhất trong repo này là hiểu ý định + gọi tool + diễn giải, không phải tự quyết định thay người dùng.

Vì vậy, vai trò đúng của Moni trong lát cắt này là **trợ lý tư vấn, tính toán, và fallback**, không phải một tác nhân tự động.

## 5. Bốn đường đi của trải nghiệm

| Đường đi | Prototype hiện xử lý thế nào |
|---|---|
| **Đường thuận** | User nhập rõ: `Tôi muốn tiết kiệm 5 triệu trong 3 tháng`. Agent dùng `create_saving_plan`, có thể kết hợp `get_current_balance`, rồi trả về số tiền cần tiết kiệm mỗi tháng. Frontend hiện typing indicator, streaming text và lưu lịch sử hội thoại. |
| **Khi AI không chắc** | Nếu user nhập mơ hồ như `Tôi muốn tiết kiệm mua điện thoại`, system prompt trong `agent.py` yêu cầu agent phải hỏi một câu làm rõ ngắn gọn thay vì tự đoán số tiền hay thời gian. |
| **Khi AI sai hoặc tool lỗi** | Nếu file dữ liệu hỏng, tool lỗi, hoặc nguồn dữ liệu không sẵn sàng, `agent.py` sẽ dừng sớm và đề xuất Moni Note. Nếu request frontend lỗi, `ChatPage.jsx` sẽ hiện thông điệp lỗi để user biết rằng hệ thống chưa trả lời được. |
| **Khi người dùng sửa** | Prototype hiện chưa có nút sửa riêng cho saving goal, nhưng user có thể nhập lại mục tiêu trong cùng cuộc chat, ví dụ đổi từ `3 tháng` sang `5 tháng`. Đó là correction path thực tế nhất mà giao diện hiện tại đang hỗ trợ. |

## 6. Những kiểu lỗi đáng lo nhất

### Lỗi 1: AI bịa hoặc tính sai số tiền

- Thường xuất hiện khi agent không dùng tool hoặc diễn giải sai kết quả tool.
- Người chịu thiệt là user, vì chỉ cần sai một con số là uy tín của trợ lý tài chính giảm rất nhanh.
- Prototype xử lý bằng cách bắt buộc dữ liệu factual đi qua tool, còn phép tính tiết kiệm nằm trong `create_saving_plan` của `finance_tools.py`.

### Lỗi 2: Dữ liệu hoặc tool hỏng làm gãy luồng

- Thường xuất hiện khi file JSON không đọc được, schema sai, hoặc tool runtime lỗi.
- Người chịu thiệt là user đang ở giữa một tác vụ có cam kết cao như xem số dư, tổng hợp chi tiêu, hay lập kế hoạch tiết kiệm.
- Prototype xử lý bằng fallback Moni Note. `agent.py` đã có nhánh riêng cho `FILE_NOT_FOUND`, `JSON_READ_ERROR`, và các lỗi dữ liệu để không giả vờ trả lời.

### Lỗi 3: User yêu cầu hành động tài chính thật

- Thường xuất hiện khi user nhận AI là một tác nhân có thể chuyển tiền, thanh toán, hoặc thao tác trên dữ liệu thật.
- Người chịu rủi ro là cả user lẫn sản phẩm, vì đây là vùng nhạy cảm và vượt quá phạm vi prototype.
- Prototype xử lý bằng guardrail: từ chối lịch sự và đề xuất phương án an toàn hơn như ghi chú tạm bằng Moni Note hoặc lập kế hoạch mô phỏng.

## 7. Kế hoạch kiểm thử và bằng chứng demo

### Hai input demo chính

**Input 1 - Đường thuận**

```text
Tôi muốn tiết kiệm 5 triệu trong 3 tháng.
```

Kỳ vọng:

- backend gọi `create_saving_plan`;
- bot trả về mức tiết kiệm mỗi tháng xấp xỉ 1.666.667đ;
- giao diện chat hiện typing indicator, streaming và lưu lịch sử hội thoại.

**Input 2 - Đầu vào khó / recovery**

Cách 1:

```text
Tôi muốn tiết kiệm để mua điện thoại.
```

Kỳ vọng:

- agent không tự đoán giá tiền hoặc thời hạn;
- agent hỏi lại một câu ngắn để làm rõ.

Cách 2:

- tạo lỗi dữ liệu mock trong buổi test nội bộ;
- hỏi:

```text
Số dư hiện tại của tôi là bao nhiêu?
```

Kỳ vọng:

- agent không bịa số dư;
- agent thông báo rằng hiện chưa đọc được dữ liệu;
- agent đề xuất Moni Note làm phương án tạm.

### Bằng chứng cần giữ để demo

- ảnh chụp happy path trong giao diện chat;
- ảnh chụp trường hợp agent hỏi lại khi input mơ hồ;
- ảnh chụp trường hợp fallback sang Moni Note;
- file dữ liệu mẫu `codebase/src/data/finance_data.json`;
- code tool `codebase/src/tools/finance_tools.py`;
- guardrail và fallback trong `codebase/src/agent/agent.py`;
- logic gọi backend và hiện lỗi trong `codebase/frontend/src/services/chatService.js` và `codebase/frontend/src/pages/ChatPage/ChatPage.jsx`.

### Đánh đổi nhóm chấp nhận

- Ưu tiên tính đúng và recovery an toàn hơn là làm giao diện phức tạp.
- Ưu tiên dùng dữ liệu mock để chứng minh logic sản phẩm trước khi nói đến tích hợp tài khoản thật.
- Chấp nhận correction path hiện tại còn đơn giản qua chat text, vì mục tiêu của prototype là chứng minh AI + tool + fallback.

## 8. Phân công

| Thành viên | Phụ trách |
|---|---|
| Trần Đức Tâm | Evidence |
| Lê Quốc Bảo | SPEC |
| Kim Hồng Giang | Frontend |
| Lê Quang Miền | Backend |
| TranNgocThuy | Data |
