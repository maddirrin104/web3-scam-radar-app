import { useMemo, useState } from 'react'
import './App.css'

const TAB_UPLOAD = 'upload'
const TAB_MANUAL = 'manual'

const RISK_LABELS = {
  low: {
    title: 'Thấp',
    description: 'Ví an toàn, chưa thấy dấu hiệu bất thường.'
  },
  medium: {
    title: 'Trung bình',
    description: 'Ví có tín hiệu đáng ngờ, nên kiểm tra kỹ hơn.'
  },
  high: {
    title: 'Cao',
    description: 'Ví có nguy cơ phishing mạnh, cần hành động ngay.'
  }
}

const formatPercent = (value) => `${Math.round(value * 1000) / 10}%`

function App() {
  const [activeTab, setActiveTab] = useState(TAB_UPLOAD)
  const [address, setAddress] = useState('')
  const [file, setFile] = useState(null)
  const [manualPayload, setManualPayload] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const riskMeta = useMemo(() => {
    if (!result) return null
    return RISK_LABELS[result.verdict.risk_level]
  }, [result])

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0]
    setFile(nextFile || null)
  }

  const handleSubmitUpload = async (event) => {
    event.preventDefault()
    setError('')

    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ ví cần phân tích.')
      return
    }

    if (!file) {
      setError('Vui lòng chọn tệp CSV giao dịch.')
      return
    }

    const formData = new FormData()
    formData.append('address', address.trim())
    formData.append('file', file)

    setLoading(true)
    try {
      const response = await fetch('/api/analyze/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}))
        throw new Error(detail?.detail || 'Không thể phân tích tệp CSV.')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!manualPayload.trim()) {
      setError('Vui lòng nhập payload JSON hợp lệ.')
      return
    }

    let parsed
    try {
      parsed = JSON.parse(manualPayload)
    } catch (err) {
      setError('Dữ liệu JSON không hợp lệ. Kiểm tra lại định dạng.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/analyze/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed)
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}))
        throw new Error(detail?.detail || 'Không thể phân tích dữ liệu JSON.')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">NFT & Web3 Threat Intel</p>
          <h1>Web3 Scam Radar</h1>
          <p className="subtitle">
            Ứng dụng dựa trên pipeline Machine Learning trong notebook Kaggle để đánh giá mức độ rủi ro phishing của ví NFT.
            Tải tệp giao dịch hoặc gửi payload JSON để nhận điểm rủi ro và các dấu hiệu nổi bật.
          </p>
        </div>
      </header>

      <main className="content">
        <section className="panel">
          <div className="tab-bar">
            <button
              type="button"
              className={activeTab === TAB_UPLOAD ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(TAB_UPLOAD)}
            >
              Phân tích bằng CSV
            </button>
            <button
              type="button"
              className={activeTab === TAB_MANUAL ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(TAB_MANUAL)}
            >
              Gửi JSON thủ công
            </button>
          </div>

          {activeTab === TAB_UPLOAD ? (
            <form className="form" onSubmit={handleSubmitUpload}>
              <label className="field">
                <span>Địa chỉ ví (0x...)</span>
                <input
                  type="text"
                  placeholder="vd: 0x1234..."
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </label>

              <label className="field file-field">
                <span>Tệp giao dịch (.csv)</span>
                <input type="file" accept=".csv" onChange={handleFileChange} />
                <p className="hint">
                  Sử dụng cấu trúc cột giống dataset trong notebook: from_address, to_address, value, token_value, function_call, timestamp...
                </p>
                {file && <p className="file-name">Đã chọn: {file.name}</p>}
              </label>

              <button className="submit" type="submit" disabled={loading}>
                {loading ? 'Đang phân tích...' : 'Phân tích ngay'}
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={handleManualSubmit}>
              <label className="field">
                <span>Payload JSON</span>
                <textarea
                  rows={12}
                  placeholder={JSON.stringify(
                    {
                      address: '0x1234...',
                      transactions: [
                        {
                          from: '0x1234...',
                          to: '0xabcd...',
                          value: 0,
                          gasUsed: 21000,
                          functionCall: "['setApprovalForAll']"
                        }
                      ]
                    },
                    null,
                    2
                  )}
                  value={manualPayload}
                  onChange={(event) => setManualPayload(event.target.value)}
                />
              </label>

              <button className="submit" type="submit" disabled={loading}>
                {loading ? 'Đang phân tích...' : 'Gửi dữ liệu JSON'}
              </button>
            </form>
          )}

          {error && <div className="error-banner">{error}</div>}
        </section>

        {result && (
          <section className="panel result">
            <div className={`score-card ${result.verdict.risk_level}`}>
              <div className="score-value">{formatPercent(result.verdict.score)}</div>
              <div>
                <p className="score-label">Mức rủi ro {riskMeta?.title}</p>
                <p className="score-description">{riskMeta?.description}</p>
              </div>
            </div>

            <div className="summary">
              <h2>Kết luận</h2>
              <p>{result.verdict.summary}</p>
            </div>

            <div className="signals">
              <h3>Tín hiệu nổi bật</h3>
              <ul>
                {result.verdict.key_signals.map((signal) => (
                  <li key={signal.feature}>
                    <div className="signal-row">
                      <span className="signal-name">{signal.description}</span>
                      <span className="signal-value">{signal.contribution.toFixed(3)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <details className="raw-details">
              <summary>Dữ liệu đặc trưng chi tiết</summary>
              <div className="raw-grid">
                {Object.entries(result.verdict.feature_snapshot).map(([key, value]) => (
                  <div key={key} className="raw-item">
                    <p className="raw-key">{key}</p>
                    <p className="raw-value">{Number.isFinite(value) ? value.toFixed(4) : value}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          Lấy cảm hứng từ notebook <code>training-mlt (1).ipynb</code>. Pipeline được tinh gọn cho môi trường realtime.
        </p>
      </footer>
    </div>
  )
}

export default App
