import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [inputValue, setInputValue] = useState('')
  const [inputType, setInputType] = useState('address') // 'address' or 'transaction'
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or default to light mode
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  // Update theme when dark mode changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }, [isDarkMode])

  // Mock data based on notebook results
  const modelStats = {
    mlp: {
      transaction: { accuracy: 0.8575, precision: 0.8355, recall: 0.8902, f1: 0.8620, auc: 0.9199 },
      account: { accuracy: 0.9154, precision: 0.8119, recall: 0.9498, f1: 0.8754, auc: 0.9531 }
    },
    ftTransformer: {
      transaction: { accuracy: 0.7887, precision: 0.7190, recall: 0.9481, f1: 0.8178, auc: 0.9092 },
      account: { accuracy: 0.9129, precision: 0.8191, recall: 0.9266, f1: 0.8696, auc: 0.9644 }
    }
  }

  const handleAnalyze = async () => {
    if (!inputValue.trim()) {
      setError('Vui lòng nhập địa chỉ hoặc hash giao dịch')
      return
    }

    // Validate Ethereum address format (basic)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    const txHashRegex = /^0x[a-fA-F0-9]{64}$/
    
    if (inputType === 'address' && !ethAddressRegex.test(inputValue)) {
      setError('Địa chỉ Ethereum không hợp lệ. Vui lòng nhập địa chỉ 42 ký tự bắt đầu bằng 0x')
      return
    }
    
    if (inputType === 'transaction' && !txHashRegex.test(inputValue)) {
      setError('Hash giao dịch không hợp lệ. Vui lòng nhập hash 66 ký tự bắt đầu bằng 0x')
      return
    }

    setError(null)
    setIsAnalyzing(true)

    // Simulate API call - In real app, this would call your backend
    setTimeout(() => {
      // Mock prediction results
      const mockRiskScore = Math.random() * 100
      const isPhishing = mockRiskScore > 50
      
      const mockResults = {
        input: inputValue,
        type: inputType,
        riskScore: mockRiskScore,
        isPhishing: isPhishing,
        confidence: Math.random() * 20 + 80, // 80-100%
        mlpPrediction: {
          probability: Math.random(),
          prediction: isPhishing ? 'Phishing' : 'Benign',
          confidence: Math.random() * 15 + 85
        },
        ftTransformerPrediction: {
          probability: Math.random(),
          prediction: isPhishing ? 'Phishing' : 'Benign',
          confidence: Math.random() * 15 + 85
        },
        features: {
          suspiciousFuncCount: Math.floor(Math.random() * 10),
          transferFuncCount: Math.floor(Math.random() * 20),
          approvalFuncCount: Math.floor(Math.random() * 5),
          totalTransactions: Math.floor(Math.random() * 1000),
          avgGasPrice: (Math.random() * 100).toFixed(2),
          neighborCount: Math.floor(Math.random() * 100)
        },
        timestamp: new Date().toISOString()
      }

      setResults(mockResults)
      setIsAnalyzing(false)
    }, 2000)
  }

  const getRiskColor = (score) => {
    if (score >= 70) return '#ef4444' // Red - High risk
    if (score >= 40) return '#f59e0b' // Orange - Medium risk
    return '#10b981' // Green - Low risk
  }

  const getRiskLabel = (score) => {
    if (score >= 70) return 'NGUY HIỂM'
    if (score >= 40) return 'CẢNH BÁO'
    return 'AN TOÀN'
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <h1 className="title">
                <span className="title-icon">🛡️</span>
                Web3 Scam Radar
              </h1>
              <p className="subtitle">
                Phát hiện lừa đảo NFT và Ethereum bằng AI đa nhiệm vụ
              </p>
      </div>
            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle dark mode"
              title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              <svg 
                className="theme-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                {isDarkMode ? (
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                ) : (
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                )}
              </svg>
        </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Input Section - Moved to top */}
          <section className="input-section">
            <div className="input-section-header">
              <h2 className="input-section-title">Bắt đầu kiểm tra ngay</h2>
              <p className="input-section-subtitle">
                Nhập địa chỉ Ethereum hoặc hash giao dịch để nhận phân tích chi tiết về rủi ro lừa đảo
              </p>
            </div>
            <div className="input-card">
              <div className="input-header">
                <h2>Kiểm tra Địa chỉ/Giao dịch</h2>
                <p>Nhập địa chỉ Ethereum hoặc hash giao dịch để phân tích</p>
              </div>

              <div className="input-tabs">
                <button
                  className={`tab-button ${inputType === 'address' ? 'active' : ''}`}
                  onClick={() => {
                    setInputType('address')
                    setResults(null)
                    setError(null)
                  }}
                >
                  📍 Địa chỉ
                </button>
                <button
                  className={`tab-button ${inputType === 'transaction' ? 'active' : ''}`}
                  onClick={() => {
                    setInputType('transaction')
                    setResults(null)
                    setError(null)
                  }}
                >
                  🔗 Giao dịch
                </button>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder={
                    inputType === 'address'
                      ? '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
                      : '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                  }
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setError(null)
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                />
                <button
                  className="analyze-button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="spinner"></span>
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      🔍 Phân tích
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </section>

          {/* Results Section */}
          {results && (
            <section className="results-section">
              {/* Risk Assessment Card */}
              <div className="risk-card">
                <div className="risk-header">
                  <h3>Đánh giá Rủi ro</h3>
                  <span
                    className="risk-badge"
                    style={{ backgroundColor: getRiskColor(results.riskScore) }}
                  >
                    {getRiskLabel(results.riskScore)}
                  </span>
                </div>
                <div className="risk-score-container">
                  <div className="risk-score-circle">
                    <svg className="risk-score-svg" viewBox="0 0 120 120">
                      <circle
                        className="risk-score-bg"
                        cx="60"
                        cy="60"
                        r="54"
                      />
                      <circle
                        className="risk-score-progress"
                        cx="60"
                        cy="60"
                        r="54"
                        style={{
                          stroke: getRiskColor(results.riskScore),
                          strokeDasharray: `${(results.riskScore / 100) * 339.29} 339.29`
                        }}
                      />
                    </svg>
                    <div className="risk-score-value">
                      <span className="score-number">{results.riskScore.toFixed(1)}</span>
                      <span className="score-label">Điểm rủi ro</span>
                    </div>
                  </div>
                  <div className="risk-details">
                    <div className="risk-detail-item">
                      <span className="detail-label">Kết quả:</span>
                      <span className={`detail-value ${results.isPhishing ? 'danger' : 'safe'}`}>
                        {results.isPhishing ? '⚠️ Phishing Detected' : '✅ An toàn'}
                      </span>
                    </div>
                    <div className="risk-detail-item">
                      <span className="detail-label">Độ tin cậy:</span>
                      <span className="detail-value">{results.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="risk-detail-item">
                      <span className="detail-label">Loại kiểm tra:</span>
                      <span className="detail-value">
                        {results.type === 'address' ? '📍 Địa chỉ' : '🔗 Giao dịch'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Predictions */}
              <div className="predictions-grid">
                <div className="prediction-card">
                  <div className="prediction-header">
                    <h4>MLP Model</h4>
                    <span className="model-badge">Multi-Layer Perceptron</span>
                  </div>
                  <div className="prediction-body">
                    <div className="prediction-result">
                      <span className={`prediction-label ${results.mlpPrediction.prediction === 'Phishing' ? 'danger' : 'safe'}`}>
                        {results.mlpPrediction.prediction === 'Phishing' ? '⚠️ Phishing' : '✅ Benign'}
                      </span>
                      <div className="prediction-metrics">
                        <div className="metric-item">
                          <span>Xác suất:</span>
                          <span>{(results.mlpPrediction.probability * 100).toFixed(2)}%</span>
                        </div>
                        <div className="metric-item">
                          <span>Độ tin cậy:</span>
                          <span>{results.mlpPrediction.confidence.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="prediction-card">
                  <div className="prediction-header">
                    <h4>FT-Transformer</h4>
                    <span className="model-badge">Transformer-based</span>
                  </div>
                  <div className="prediction-body">
                    <div className="prediction-result">
                      <span className={`prediction-label ${results.ftTransformerPrediction.prediction === 'Phishing' ? 'danger' : 'safe'}`}>
                        {results.ftTransformerPrediction.prediction === 'Phishing' ? '⚠️ Phishing' : '✅ Benign'}
                      </span>
                      <div className="prediction-metrics">
                        <div className="metric-item">
                          <span>Xác suất:</span>
                          <span>{(results.ftTransformerPrediction.probability * 100).toFixed(2)}%</span>
                        </div>
                        <div className="metric-item">
                          <span>Độ tin cậy:</span>
                          <span>{results.ftTransformerPrediction.confidence.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Analysis */}
              <div className="features-card">
                <h3>Phân tích Đặc trưng</h3>
                <div className="features-grid">
                  <div className="feature-item">
                    <span className="feature-icon">🔧</span>
                    <div className="feature-content">
                      <span className="feature-name">Hàm đáng ngờ</span>
                      <span className="feature-value">{results.features.suspiciousFuncCount}</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">↔️</span>
                    <div className="feature-content">
                      <span className="feature-name">Hàm chuyển</span>
                      <span className="feature-value">{results.features.transferFuncCount}</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">✅</span>
                    <div className="feature-content">
                      <span className="feature-name">Hàm phê duyệt</span>
                      <span className="feature-value">{results.features.approvalFuncCount}</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <div className="feature-content">
                      <span className="feature-name">Tổng giao dịch</span>
                      <span className="feature-value">{results.features.totalTransactions}</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">⛽</span>
                    <div className="feature-content">
                      <span className="feature-name">Gas trung bình</span>
                      <span className="feature-value">{results.features.avgGasPrice} Gwei</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">👥</span>
                    <div className="feature-content">
                      <span className="feature-name">Số láng giềng</span>
                      <span className="feature-value">{results.features.neighborCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Model Statistics Section */}
          <section className="stats-section">
            <div className="stats-section-header">
              <h2 className="section-title">Hiệu năng Mô hình AI</h2>
              <p className="section-subtitle">
                Các mô hình được huấn luyện trên dataset lớn với hàng triệu giao dịch thực tế. 
                Xem chi tiết hiệu năng của từng mô hình dưới đây.
              </p>
            </div>
            <div className="stats-grid stats-grid-inline">
              {/* MLP Transaction Stats */}
              <div className="stat-card">
                <div className="stat-header">
                  <h4>MLP - Giao dịch</h4>
                  <span className="stat-badge">Transaction Level</span>
                </div>
                <div className="stat-metrics">
                  <div className="stat-metric">
                    <span className="metric-name">Accuracy</span>
                    <span className="metric-value">{(modelStats.mlp.transaction.accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">Precision</span>
                    <span className="metric-value">{(modelStats.mlp.transaction.precision * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">Recall</span>
                    <span className="metric-value">{(modelStats.mlp.transaction.recall * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">F1-Score</span>
                    <span className="metric-value">{(modelStats.mlp.transaction.f1 * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">AUC</span>
                    <span className="metric-value">{(modelStats.mlp.transaction.auc * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* MLP Account Stats */}
              <div className="stat-card">
                <div className="stat-header">
                  <h4>MLP - Tài khoản</h4>
                  <span className="stat-badge">Account Level</span>
                </div>
                <div className="stat-metrics">
                  <div className="stat-metric">
                    <span className="metric-name">Accuracy</span>
                    <span className="metric-value">{(modelStats.mlp.account.accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">Precision</span>
                    <span className="metric-value">{(modelStats.mlp.account.precision * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">Recall</span>
                    <span className="metric-value">{(modelStats.mlp.account.recall * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">F1-Score</span>
                    <span className="metric-value">{(modelStats.mlp.account.f1 * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">AUC</span>
                    <span className="metric-value">{(modelStats.mlp.account.auc * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* FT-Transformer Transaction Stats */}
              <div className="stat-card">
                <div className="stat-header">
                  <h4>FT-Transformer - Giao dịch</h4>
                  <span className="stat-badge">Transaction Level</span>
                </div>
                <div className="stat-metrics">
                  <div className="stat-metric">
                    <span className="metric-name">Accuracy</span>
                    <span className="metric-value">{(modelStats.ftTransformer.transaction.accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">Precision</span>
                    <span className="metric-value">{(modelStats.ftTransformer.transaction.precision * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">Recall</span>
                    <span className="metric-value">{(modelStats.ftTransformer.transaction.recall * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">F1-Score</span>
                    <span className="metric-value">{(modelStats.ftTransformer.transaction.f1 * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">AUC</span>
                    <span className="metric-value">{(modelStats.ftTransformer.transaction.auc * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* FT-Transformer Account Stats */}
              <div className="stat-card">
                <div className="stat-header">
                  <h4>FT-Transformer - Tài khoản</h4>
                  <span className="stat-badge">Account Level</span>
                </div>
                <div className="stat-metrics">
                  <div className="stat-metric">
                    <span className="metric-name">Accuracy</span>
                    <span className="metric-value">{(modelStats.ftTransformer.account.accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">Precision</span>
                    <span className="metric-value">{(modelStats.ftTransformer.account.precision * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">Recall</span>
                    <span className="metric-value">{(modelStats.ftTransformer.account.recall * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">F1-Score</span>
                    <span className="metric-value">{(modelStats.ftTransformer.account.f1 * 100).toFixed(2)}%</span>
                  </div>
                  <div className="stat-metric">
                    <span className="metric-name">AUC</span>
                    <span className="metric-value">{(modelStats.ftTransformer.account.auc * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Additional Info Section */}
          <section className="info-section">
            <div className="info-content">
              <div className="info-main">
                <h2 className="info-title">Bảo vệ tài sản Web3 của bạn một cách thông minh</h2>
                <p className="info-description">
                  Web3 Scam Radar sử dụng công nghệ AI tiên tiến để phân tích và phát hiện các mối đe dọa lừa đảo 
                  trong không gian Web3. Với độ chính xác cao và tốc độ phân tích nhanh chóng, bạn có thể yên tâm 
                  khi thực hiện các giao dịch NFT và Ethereum.
                </p>
              </div>
              
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-card-icon">🎯</div>
                  <h3 className="info-card-title">Độ Chính Xác Cao</h3>
                  <p className="info-card-text">
                    Được huấn luyện trên dataset lớn với hàng triệu giao dịch thực tế, các mô hình AI của chúng tôi 
                    đạt độ chính xác trên 90% trong việc phát hiện lừa đảo.
                  </p>
                </div>
                
                <div className="info-card">
                  <div className="info-card-icon">⚡</div>
                  <h3 className="info-card-title">Tốc Độ Nhanh</h3>
                  <p className="info-card-text">
                    Phân tích hoàn tất trong vòng chưa đầy 1 giây. Không cần chờ đợi lâu, bạn có thể kiểm tra ngay 
                    lập tức trước khi thực hiện bất kỳ giao dịch nào.
                  </p>
                </div>
                
                <div className="info-card">
                  <div className="info-card-icon">🔒</div>
                  <h3 className="info-card-title">Bảo Mật & Riêng Tư</h3>
                  <p className="info-card-text">
                    Tất cả phân tích được thực hiện an toàn và bảo mật. Chúng tôi không lưu trữ, theo dõi hay chia sẻ 
                    bất kỳ thông tin cá nhân nào của bạn.
                  </p>
                </div>
                
                <div className="info-card">
                  <div className="info-card-icon">📈</div>
                  <h3 className="info-card-title">Cập Nhật Liên Tục</h3>
                  <p className="info-card-text">
                    Các mô hình AI được cập nhật thường xuyên với dữ liệu mới nhất để đảm bảo khả năng phát hiện 
                    các chiêu trò lừa đảo mới nhất.
                  </p>
                </div>
              </div>

              <div className="use-cases-section">
                <h3 className="use-cases-title">Khi nào nên sử dụng Web3 Scam Radar?</h3>
                <div className="use-cases-grid">
                  <div className="use-case-item">
                    <span className="use-case-icon">🛒</span>
                    <div className="use-case-content">
                      <h4>Trước khi mua NFT</h4>
                      <p>Kiểm tra địa chỉ của người bán để đảm bảo an toàn trước khi thực hiện giao dịch mua NFT.</p>
                    </div>
                  </div>
                  <div className="use-case-item">
                    <span className="use-case-icon">💸</span>
                    <div className="use-case-content">
                      <h4>Kiểm tra giao dịch</h4>
                      <p>Phân tích hash giao dịch để xác minh tính hợp pháp và an toàn của giao dịch trước khi xác nhận.</p>
                    </div>
                  </div>
                  <div className="use-case-item">
                    <span className="use-case-icon">🔗</span>
                    <div className="use-case-content">
                      <h4>Kết nối ví</h4>
                      <p>Kiểm tra địa chỉ trước khi kết nối ví của bạn với các ứng dụng DeFi hoặc NFT marketplace.</p>
                    </div>
                  </div>
                  <div className="use-case-item">
                    <span className="use-case-icon">🤝</span>
                    <div className="use-case-content">
                      <h4>Giao dịch P2P</h4>
                      <p>Xác minh đối tác giao dịch trong các giao dịch peer-to-peer để tránh bị lừa đảo.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cta-section">
                <div className="cta-content">
                  <h3 className="cta-title">Sẵn sàng bảo vệ tài sản Web3 của bạn?</h3>
                  <p className="cta-text">
                    Bắt đầu sử dụng Web3 Scam Radar ngay hôm nay. Hoàn toàn miễn phí và không cần đăng ký.
                  </p>
                  <button 
                    className="cta-button"
                    onClick={() => {
                      document.querySelector('.input-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Bắt đầu kiểm tra ngay →
                  </button>
                </div>
              </div>
            </div>
          </section>
      </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-main">
              <h3 className="footer-title">Web3 Scam Radar</h3>
              <p className="footer-description">
                Công cụ phát hiện lừa đảo NFT và Ethereum hàng đầu, sử dụng công nghệ AI đa nhiệm vụ tiên tiến 
                để bảo vệ cộng đồng Web3 khỏi các mối đe dọa.
        </p>
      </div>
            <div className="footer-info">
              <div className="footer-section">
                <h4 className="footer-section-title">Công nghệ</h4>
                <ul className="footer-links">
                  <li>Multi-Task Learning</li>
                  <li>MLP Neural Network</li>
                  <li>FT-Transformer</li>
                  <li>Feature Engineering</li>
                </ul>
              </div>
              <div className="footer-section">
                <h4 className="footer-section-title">Tính năng</h4>
                <ul className="footer-links">
                  <li>Phân tích địa chỉ</li>
                  <li>Phân tích giao dịch</li>
                  <li>Đánh giá rủi ro</li>
                  <li>Báo cáo chi tiết</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>Web3 Scam Radar - Phát hiện lừa đảo bằng Multi-Task Learning</p>
            <p className="footer-note">
              Sử dụng mô hình MLP và FT-Transformer được huấn luyện trên dataset Web3 phishing với độ chính xác cao
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
