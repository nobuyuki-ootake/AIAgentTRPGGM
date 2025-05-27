// Vitestテスト用のグローバルモック設定

import { vi } from "vitest";
import "@testing-library/jest-dom";

// @mui/materialの超軽量モック
vi.mock("@mui/material", () => {
  const handler = {
    get: () => () => null,
  };
  return new Proxy({}, handler);
});

// @mui/icons-materialの超軽量モック
vi.mock("@mui/icons-material", () => {
  const handler = {
    get: () => () => null,
  };
  return new Proxy({}, handler);
});

// React DOMのモック化
vi.mock("react-dom/client", () => ({
  createRoot: () => ({
    render: vi.fn(),
    unmount: vi.fn(),
  }),
}));

// localStorage モック
vi.stubGlobal("localStorage", {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

// Recoilのモック
vi.mock("recoil", () => ({
  atom: vi.fn(() => ({})),
  selector: vi.fn(() => ({})),
  useRecoilState: vi.fn(() => [null, vi.fn()]),
  useRecoilValue: vi.fn(() => null),
  useSetRecoilState: vi.fn(() => vi.fn()),
  RecoilRoot: ({ children }: { children: React.ReactNode }) => children,
}));

// フォントモジュールのモック（ビルドエラー防止）
vi.mock("@fontsource/noto-sans-jp", () => ({}));
vi.mock("@fontsource/roboto", () => ({}));
vi.mock("@fontsource/m-plus-rounded-1c", () => ({}));

// React Routerのモック
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useParams: vi.fn(() => ({})),
  useLocation: vi.fn(() => ({ pathname: "/" })),
  Link: ({ children }: { children: React.ReactNode }) => children,
  NavLink: ({ children }: { children: React.ReactNode }) => children,
  Outlet: () => null,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
}));

// カスタムイベントのグローバル対応
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return true;
      },
    };
  };

// その他必要なモック
