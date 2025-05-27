import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useDroppable } from "@dnd-kit/core";
import {
  TimelineEvent,
  PlaceElement,
  PlotElement,
} from "@novel-ai-assistant/types"; // PlotElement をインポート
// import { getEventTypeIconComponent } from "./TimelineUtils"; // TimelineEventCard に移譲
// import { Event as EventIcon } from "@mui/icons-material"; // TimelineEventCard に移譲
import TimelineEventCard from "./TimelineEventCard"; // TimelineEventCard をインポート
import { SxProps, Theme } from "@mui/material/styles"; // SxProps をインポート

interface PlaceColumnProps {
  place: PlaceElement;
  plots: PlotElement[]; // plots プロパティを追加
  events: TimelineEvent[];
  onEventClick: (id: string) => void;
  droppableId: string; // DND Kit 用のID
  // dateArray: Array<{ date: number; label: string }>; // 未使用のためコメントアウト
  calculateYPositionPercent: (dateValue: number | string) => number; // Y軸計算ヘルパー
  sx?: SxProps<Theme>; // any から SxProps<Theme> に変更
}

const PlaceColumn: React.FC<PlaceColumnProps> = ({
  place,
  plots, // plots を追加
  events,
  onEventClick,
  droppableId,
  // dateArray,
  calculateYPositionPercent,
  sx,
}) => {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId, // props から受け取った ID を使用
    data: {
      type: "timeline-place-column",
      placeId: place.id,
      placeTitle: place.name, // place.title から place.name に変更
    },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        ...sx, // 外部から渡されたスタイルを適用
        height: "100%",
        position: "relative", // イベントカードを絶対配置するため
        overflowY: "auto", // イベントが多い場合に備えて
      }}
    >
      {/* isOver状態の背景を専用Boxで描画 */}
      {isOver && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.palette.action.hover,
            zIndex: 0, // 背景を他の要素より背後にするために低いzIndexを設定
            borderRadius: theme.shape.borderRadius, // 親要素の角丸に合わせる場合
          }}
        />
      )}
      {/* この列に属するイベントを描画 */}
      {events.map((event) => {
        const yPercent = calculateYPositionPercent(event.date);
        // 同じ日時のイベントが重ならないように、orderやindexに基づいてオフセットをかけることを検討
        // ここでは簡単のため、yPercentのみで配置

        let plotName: string | undefined = undefined;
        if (event.relatedPlotIds && event.relatedPlotIds.length > 0) {
          const firstPlotId = event.relatedPlotIds[0];
          const plot = plots.find((p) => p.id === firstPlotId);
          plotName = plot ? plot.title : undefined;
        }

        return (
          <Box
            key={event.id}
            sx={{
              position: "absolute",
              top: `${yPercent}%`,
              left: "50%", // 列の中央に配置
              transform: "translateX(-50%)", // 中央揃えのための調整
              width: "90%", // 列の幅に対して90%程度の幅で表示
              zIndex: 100, // 他の要素より手前に (10から100に変更)
              // marginTop: `${_index * 2}px`, // 同日イベントの重なり回避（簡易的）
            }}
          >
            <TimelineEventCard
              event={event}
              placeName={place.name}
              plotName={plotName} // plotName を渡す
              onEdit={() => onEventClick(event.id)}
              // onDelete が必要であれば、useTimeline から渡す必要がある
              dndContextType="chart" // dndContextType を "chart" として渡す
            />
          </Box>
        );
      })}
      {events.length === 0 && isOver && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "text.secondary",
            p: 2,
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            width: "80%",
            zIndex: 101, // zIndex を 1 から 101 に変更
            backgroundColor: theme.palette.background.default, // 背景色を明示的に設定
          }}
        >
          <Typography variant="caption">
            ここにイベントシードをドロップして追加
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PlaceColumn;
