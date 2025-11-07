# Web3 Scam Radar

Ứng dụng Web3 Scam Radar cung cấp giao diện thân thiện để đánh giá rủi ro phishing của ví NFT, lấy cảm hứng từ pipeline trong notebook `training-mlt (1).ipynb`.

- **Frontend (React + Vite):** tải CSV/JSON, hiển thị điểm rủi ro và tín hiệu nổi bật.
- **Backend (FastAPI, Python):** tái sử dụng logic feature engineering & heuristics từ notebook để đưa ra verdict realtime.

## 1. Cài đặt

```bash
# 1) Tạo môi trường và cài backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows PowerShell
pip install -r requirements.txt

# 2) Cài frontend
cd ..
npm install
```

## 2. Chạy ứng dụng

Hai terminal riêng biệt:

```bash
# Terminal 1 – Backend API
cd backend
.venv\Scripts\activate
uvicorn backend.app:app --reload

# Terminal 2 – Frontend
npm run dev
```

Vite đã cấu hình proxy `/api/*` tới `http://127.0.0.1:8000`.

## 3. Chuẩn bị dữ liệu

- **CSV upload:** định dạng cột tương tự dataset Kaggle (from_address, to_address, value, token_value, function_call, timestamp,...).
- **JSON API:** gửi payload tới `/api/analyze/address`.

Ví dụ payload:

```jsonc
{
  "address": "0x1234...",
  "transactions": [
    {
      "from": "0x1234...",
      "to": "0xabcd...",
      "value": 0,
      "gasUsed": 21000,
      "functionCall": "['setApprovalForAll']",
      "timestamp": "2024-11-07T10:23:45"
    }
  ]
}
```

## 4. Kiến trúc backend

- `backend/core/features.py`: trích xuất đặc trưng (tổng giao dịch, NFT dump, suspicious functions...).
- `backend/core/model.py`: mô hình logistic nhẹ với trọng số heuristic dựa trên notebook.
- `backend/services/analyzer.py`: điều phối pipeline, tạo verdict & giải thích feature.

## 5. Kiểm thử nhanh

```bash
curl http://127.0.0.1:8000/api/health
```

Hoặc gửi payload nhỏ tới `/api/analyze/address` để xác nhận luồng kết quả.

## 6. Roadmap mở rộng

- Tích hợp checkpoint MTL thực tế từ notebook.
- Bổ sung xác thực, lưu lịch sử và dashboard SOC.
- Hỗ trợ streaming (Kafka/Flink) cho giám sát realtime quy mô lớn.

---

Made with ❤️ dựa trên `training-mlt (1).ipynb`.
