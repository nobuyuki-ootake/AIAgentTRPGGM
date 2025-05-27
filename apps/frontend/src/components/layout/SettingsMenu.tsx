import React from "react";
import { useRecoilState } from "recoil";
import { aiChatPanelOpenState } from "../../store/atoms";
import { aiChatTabState } from "../../store/atoms";

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 設定メニュー
 */
export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
}) => {
  const [_, setAIChatPanelOpen] = useRecoilState(aiChatPanelOpenState);
  const [__, setAIChatTab] = useRecoilState(aiChatTabState);

  if (!isOpen) return null;

  const handleOpenAISettings = () => {
    setAIChatPanelOpen(true);
    setAIChatTab("settings");
    onClose();
  };

  return (
    <>
      <div className="absolute right-0 top-12 w-64 bg-white rounded-md shadow-lg z-20 overflow-hidden">
        <div className="p-2 border-b">
          <h3 className="font-medium text-sm">設定</h3>
        </div>

        <div className="p-2">
          <button
            onClick={handleOpenAISettings}
            className="w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 flex items-center"
          >
            <span className="material-icons-outlined text-gray-500 mr-2 text-xl">
              smart_toy
            </span>
            <span>AI連携設定</span>
          </button>

          {/* 他の設定項目をここに追加 */}
          <button className="w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 flex items-center">
            <span className="material-icons-outlined text-gray-500 mr-2 text-xl">
              settings
            </span>
            <span>アプリ設定</span>
          </button>

          <button className="w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 flex items-center">
            <span className="material-icons-outlined text-gray-500 mr-2 text-xl">
              palette
            </span>
            <span>テーマ設定</span>
          </button>
        </div>

        <div className="border-t p-2">
          <button
            onClick={onClose}
            className="w-full px-3 py-2 text-left text-gray-500 rounded-md hover:bg-gray-100 text-sm"
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
};
