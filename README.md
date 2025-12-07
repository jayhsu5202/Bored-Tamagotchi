# 🐣 無聊電子雞 | Bored Tamagotchi | 退屈なたまごっち

![無聊電子雞 Game Preview](images/preview.png)

![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Three.js](https://img.shields.io/badge/Three.js-r160-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)

[繁體中文](#繁體中文) | [English](#english) | [日本語](#日本語)

---

## <a id="繁體中文"></a>🇹🇼 繁體中文

**無聊電子雞** 是一個運行在瀏覽器上的 3D 體素（Voxel）風格寵物養成遊戲。完全使用 React 和 Three.js 構建，無需後端，支援離線遊玩。

### ✨ 特色功能

![Gameplay Screenshot](images/gameplay.png)

*   **3D 體素寵物**：程式化生成的寵物（小雞或小豬），每一隻都有獨特的顏色與外觀。
*   **完整養成系統**：管理寵物的飢餓度、清潔度、心情、體力與體重。
*   **互動行為**：
    *   餵食：會增加體重，小心不要讓牠過胖！
    *   打掃：清理便便以維持環境衛生。
    *   運動：移動滑鼠（或手指）引導寵物跑步，幫助牠減肥並消耗體力。
    *   睡眠：恢復體力。
*   **進化系統**：細心照顧，寵物將會長大進化。
*   **存檔功能**：透過加密代碼匯出/匯入存檔，隨時備份你的寵物。

### 📸 攝影棚模式

![Photo Mode Card Example](images/card.png)
*實際生成的寵物身分證卡片範例*

*   **拍照**：調整角度並拍攝寵物的拍立得風格卡片。
*   **分享**：下載生成的圖片與朋友分享你的專屬寵物。

### 🚀 快速開始

1.  **安裝依賴**
    ```bash
    npm install
    ```

2.  **啟動開發伺服器**
    ```bash
    npm run dev
    ```

3.  **建置專案**
    ```bash
    npm run build
    ```

### ☁️ 部署 (Cloudflare Pages)
本專案已針對 Vite 進行設定，可直接部署至 Cloudflare Pages：
1.  連結 GitHub Repo。
2.  **Build command**: `npm run build`
3.  **Build output directory**: `dist`

---

## <a id="english"></a>🇺🇸 English

**Bored Tamagotchi** is a fully functional 3D voxel pet simulation game running directly in your browser. Built with React and Three.js, it features procedural generation and interactive gameplay.

### ✨ Features

*   **3D Voxel Pets**: Procedurally generated pets (Chickens or Pigs) with unique palettes and traits.
*   **Care System**: Manage Hunger, Hygiene, Happiness, Energy, and Weight.
*   **Interactions**:
    *   **Feed**: Increases hunger and weight. Watch out for obesity!
    *   **Clean**: Clean up poop to keep your pet healthy.
    *   **Exercise**: Move your cursor to lead your pet on a run to burn calories.
    *   **Sleep**: Restore energy.
*   **Evolution**: Maintain high stats to trigger evolution and growth.
*   **Save System**: Export/Import your pet data via encrypted save strings.
*   **Photo Studio**: Take snapshots of your pet and generate downloadable stats cards.

### 🚀 Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Build for Production**
    ```bash
    npm run build
    ```

### ☁️ Deployment (Cloudflare Pages)
This project is configured for Vite and ready for Cloudflare Pages:
1.  Connect your GitHub repository.
2.  **Build command**: `npm run build`
3.  **Build output directory**: `dist`

---

## <a id="日本語"></a>🇯🇵 日本語

**退屈なたまごっち**は、ブラウザで動作する3Dボクセルスタイルのペット育成シミュレーションゲームです。ReactとThree.jsで作られており、バックエンド不要で動作します。

### ✨ 特徴

*   **3Dボクセルペット**：プロシージャル生成されたペット（ニワトリやブタ）が登場します。一匹ごとに色が異なります。
*   **育成システム**：満腹度、清潔さ、機嫌、元気、そして体重を管理しましょう。
*   **インタラクション**：
    *   **ごはん**：満腹になりますが、体重も増えます。食べ過ぎに注意！
    *   **そうじ**：うんちを片付けて病気を防ぎましょう。
    *   **運動**：マウス（または指）を動かしてペットを走らせ、ダイエットさせましょう。
    *   **ねる**：元気を回復します。
*   **進化**：大切に育てると、ペットは進化して大きくなります。
*   **セーブ機能**：暗号化されたコードでセーブデータを書き出し・読み込みが可能です。
*   **撮影スタジオ**：ペットの写真を撮って、ステータスカードとして保存できます。

### 🚀 始め方

1.  **インストール**
    ```bash
    npm install
    ```

2.  **開発サーバーの起動**
    ```bash
    npm run dev
    ```

3.  **ビルド**
    ```bash
    npm run build
    ```

### ☁️ デプロイ (Cloudflare Pages)
Cloudflare Pagesへのデプロイ設定は以下の通りです：
1.  GitHubリポジトリを連携。
2.  **Build command**: `npm run build`
3.  **Build output directory**: `dist`
