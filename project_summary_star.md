# Project Summary: Autonomous Factory Digital Twin (STAR Method)

## Situation (情境)
我們擁有一個基於 Python 的工廠模擬核心 (`simulation/factory.py`) 和一個現代化的 React 前端儀表板 (`frontend`)，但兩者最初是脫節的。工廠缺乏「大腦」，無法應對訂單激增或機器故障，且使用者無法與模擬環境進行自然語言互動。目標是在**本地端 (Localhost)** 打造一個高互動性、由 LLM 驅動的自動化產線。

## Task (任務)
我 (Agent) 的核心任務是擔任「全端架構師」與「AI 整合工程師」：
1.  **系統整合**：打通 Python 後端與 React 前端的即時數據流。
2.  **賦予智能**：接入本地 Ollama AI 模型，使其能監控數據並自主下達控制指令 (如降溫、加速)。
3.  **解決痛點**：修復系統崩潰、通訊超時 (Timeout)、以及數據顯示不同步的問題。
4.  **優化體驗**：實現「負載平衡 (Load Balancing)」與「漸進式控制」，讓工廠運作更像真實世界。

## Action (行動)
為了達成上述目標，我執行了以下關鍵行動：
1.  **架構通訊層 (Bridge)**：
    - 開發 WebSocket Bridge (`backend/bridge.py`)，實現 60Hz 的即時狀態廣播。
    - 在前端重構 `FactoryContext.tsx`，確保畫面與後端數據毫秒級同步。
2.  **強化 AI 邏輯 (Logic)**：
    - 在 `backend/ai.py` 實作嚴格的 **Prompt Engineering**，強制 AI 輸出標準 JSON 格式。
    - 引入 **Safety Limits (安全邊界)**，防止 AI 下達危險指令 (如轉速過高)。
    - 加入 **Timeout 機制** (10秒)，確保 AI 沒反應時系統不會當機。
3.  **實現高階策略 (Strategy)**：
    - 修改 `rules.txt`，教導 AI 執行「漸進式降溫」而非直接停機，並具備「全局視野」，能跨產線支援訂單。
    - 修正後端派工邏輯，確保訂單被跨線認領時，UI 能準確顯示 "Production: Line X"。
4.  **效能調校 (Performance)**：
    - 調整訂單生成率 (0.1% -> 0.25%)，平衡系統負載與展示效果。

## Result (結果)
1.  **全自動化運作**：工廠現在能 24/7 自主運行，AI 會在過熱時自動降速、訂單多時自動加速。
2.  **高強韌性**：系統不再因為 AI 響應慢而卡死，且具備完整的錯誤處理機制。
3.  **精準可視化**：使用者能透過儀表板即時看到每一筆訂單的真實流向 (即使是跨線生產)。
4.  **人機協作**：使用者可以像玩遊戲一樣，透過對話框下達 "Cool down" 指令，AI 會立即執行並反饋。

---
**專案狀態**：`Active / Stable`
**技術棧**：Python, FastAPI, WebSocket, Next.js, Ollama/Local LLM.
