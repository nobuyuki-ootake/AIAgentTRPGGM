// MUI Iconsのモック
// このファイルは@mui/icons-materialをインポートする代わりに使用されます

import React from "react";

// デフォルトのアイコンコンポーネント
const MockIcon = () => React.createElement("svg");

// すべてのインポートに対してモックアイコンを返すProxyを作成
const handler = {
  get: (_: unknown, prop: string | symbol) => {
    // プロパティがSymbolの場合はそのまま返す（Reactの内部処理用）
    if (typeof prop === "symbol") {
      return MockIcon;
    }
    return MockIcon;
  },
};

export default new Proxy({}, handler);
