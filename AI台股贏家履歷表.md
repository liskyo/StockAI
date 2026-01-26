# AI台股贏家 (StockWinner.AI) - 專案技術履歷

## 專案簡介
一個結合 **Google Gemini 3 AI** 模型與 **即時股市數據** 的智能投資分析平台。解決了傳統看盤軟體資訊過載的問題，透過 AI 進行深度推理與總結，為使用者提供 Fundamental (基本面)、Technical (技術面)、Chips (籌碼面) 的全方位量化評分與文字分析。

## 核心技術亮點 (Key Achievements)

### 1. Advanced AI Engineering (Google GenAI)
- **多模態模型整合**: 靈活運用 `gemini-3-flash` (極速掃描) 與 `gemini-3-pro` (深度推理) 模型，針對不同場景動態切換，平衡回應速度與分析深度。
- **Structured Output (JSON Schema)**: 設計複雜的 JSON Schema 定義回傳格式，強制 AI 輸出結構化數據而非純文字，讓前端能精準繪製圖表與儀表板 (Dashboard)。
- **Grounding with Google Search**: 整合 Google Search Tool，讓 AI 能夠即時獲取最新股價、新聞與三大法人動向，解決 LLM 資料滯後 (Hallucination) 問題。
- **Deep Thinking Configuration**: 在 Pro 模式下啟用 `thinkingBudget: 16384`，讓模型執行更複雜的金融邏輯推理與風險評估。

### 2. Modern Frontend Architecture (React 19 + TypeScript)
- **Responsive & Premium UI**: 使用 **Tailwind CSS** 打造深色科技風 (Dark/Tech Theme) 介面，搭配玻璃擬態 (Glassmorphism) 與微互動動畫，提供極致的使用者體驗。
- **Type-Safe Development**: 全面採用 **TypeScript** 定義 `AIAnalysisResult`、`StockPreview` 等介面，確保前後端資料流的穩定性與可維護性。
- **Data Visualization**: 整合 **Recharts** 將 AI 分析出的數值轉化為直觀的雷達圖與趨勢圖，讓複雜數據一目了然。

### 3. Performance & Data Strategy
- **Smart Caching System**: 實作自定義的 `localStorage` 快取機制，針對股市特性設計 "以每日 12:00 PM 為界" 的資料過期邏輯，大幅減少 API 呼叫成本並提升載入速度。
- **Parallel Data Fetching**: 使用 `Promise.all` 同時請求市場熱點趨勢 (Trending) 與策略選股 (Strategy) 數據，最小化首屏載入時間 (TTFB)。
- **Resilient Error Handling**: 實作完善的錯誤處理與降級機制 (Graceful Degradation)，當 AI 服務忙碌時能自動切換至快取數據或友善提示。

## 技術棧 (Tech Stack)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **AI Integration**: Google GenAI SDK (@google/genai), Prompt Engineering
- **Libraries**: Lucide React (Icons), Recharts (Charts)
- **Architecture**: Client-side AI Inference, Serverless-ready

## 專案效益
- 將單檔股票的分析時間從人工查找的 15 分鐘縮短至 **10-30秒**。
- 提供量化評分機制 (0-100分)，幫助使用者快速過濾雜訊，鎖定潛力標的。
- 實現真正意義上的 "AI 投顧"，不僅給出買賣建議，更提供完整的邏輯推演過程。
