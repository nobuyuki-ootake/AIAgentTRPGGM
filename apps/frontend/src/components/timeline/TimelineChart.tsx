import React, { useCallback } from "react";
import {
  Box,
  Typography,
  // Avatar, // PlaceColumn内で使用される可能性はあるが、Chart直接では不要に
  // AvatarGroup, // 同上
  // Tooltip, // EventCardに移管またはPlaceColumnで再検討
  useTheme,
  Paper,
} from "@mui/material";
// import { FiberManualRecord as DotIcon } from "@mui/icons-material"; // EventCardで表示
// import { TimelineItem, TimelineGroup } from "../../hooks/useTimeline"; // より具体的な型へ
import {
  TimelineEvent,
  PlaceElement,
  PlotElement,
} from "@novel-ai-assistant/types"; // Plotの代わりにPlotElementを使用
// import { getCharacterIcon } from "./TimelineUtils"; // EventCardやPlaceColumnへ
import PlaceColumn from "./PlaceColumn"; // デフォルトインポートに変更
import moment from "moment"; // momentを追加

interface TimelineChartProps {
  timelineEvents: TimelineEvent[];
  places: PlaceElement[];
  plots: PlotElement[]; // Plot を PlotElement に変更
  dateArray: string[]; // Array<{ date: number; label: string }> から string[] に変更
  safeMinY: number; // 追加
  safeMaxY: number; // 追加
  onEventClick: (id: string) => void;
  onDeleteEvent?: (id: string) => void;
}

const TimelineChart: React.FC<TimelineChartProps> = ({
  timelineEvents,
  places,
  plots, // Plot を PlotElement に変更
  dateArray,
  safeMinY, // 追加
  safeMaxY, // 追加
  onEventClick,
  onDeleteEvent,
}) => {
  const theme = useTheme();

  const eventsByPlace = React.useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    places.forEach((place) => {
      const eventsInPlace = timelineEvents
        .filter((event) => event.placeId === place.id) // placeId を参照
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      map.set(place.id, eventsInPlace);
    });
    return map;
  }, [timelineEvents, places]);

  const calculateYPositionPercent = useCallback(
    (dateValue: number | string) => {
      const eventTime =
        typeof dateValue === "string" ? moment(dateValue).valueOf() : dateValue;
      // console.logで渡される値を確認
      console.log("[TimelineChart] calculateYPos INPUT:", {
        dateValue,
        eventTime,
        safeMinY,
        safeMaxY,
        dateArrayLen: dateArray.length,
      });

      if (safeMinY === safeMaxY || dateArray.length === 0) {
        console.log(
          "[TimelineChart] calculateYPos EARLY RETURN 0 (minY === maxY or dateArray empty)"
        );
        return 0;
      }

      if (eventTime <= safeMinY) {
        // console.log("[TimelineChart] calculateYPos RETURNING 0 (eventTime <= safeMinY)");
        return 0;
      }
      if (eventTime >= safeMaxY) {
        // console.log("[TimelineChart] calculateYPos RETURNING 100 (eventTime >= safeMaxY)");
        return 100;
      }
      const totalDuration = safeMaxY - safeMinY;
      if (totalDuration === 0) {
        // このケースは最初のifでカバーされるはずだが念のため
        // console.log("[TimelineChart] calculateYPos RETURNING 0 (totalDuration is 0)");
        return 0;
      }
      const percent = ((eventTime - safeMinY) / totalDuration) * 100;
      console.log("[TimelineChart] calculateYPos RESULT percent:", percent);
      return percent;
    },
    [safeMinY, safeMaxY, dateArray]
  ); // 依存配列にdateArrayも追加

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        タイムラインチャート
      </Typography>
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          height: 600,
          position: "relative",
          borderRadius: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* X軸（場所）ラベル */}
        <Box
          sx={{
            display: "flex",
            width: "100%",
            height: 40,
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
            // X軸ヘッダー自体がスクロールしないようにするため、ここは overflowX: hidden または、親の overflowX: auto に任せる
          }}
        >
          {places.map((place, index) => (
            <Box
              key={place.id}
              sx={{
                flex: "1 0 0%", // flexプロパティを調整
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                px: 1,
                borderRight: index < places.length - 1 ? 1 : 0,
                borderColor: "divider",
                minWidth: 180, // 最小幅をデータ列と合わせる
              }}
            >
              <Typography variant="subtitle2" noWrap>
                {place.name}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Y軸（時間）ラベルとチャート本体のコンテナ */}
        <Box
          sx={{
            display: "flex",
            flexGrow: 1,
            position: "relative",
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          {/* Y軸（時間）ラベルコンテナ */}
          <Box
            sx={{
              width: 80,
              height: "100%",
              position: "relative",
              borderRight: 1,
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            {dateArray.map((dateString, index) => {
              // dateInfoをdateStringに変更
              const yPercent = calculateYPositionPercent(dateString);
              const displayLabel = moment(dateString).format("MM/DD"); // ラベルをフォーマット

              return (
                <React.Fragment key={`date-label-${dateString}-${index}`}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: `${yPercent}%`,
                      width: "100%",
                      height: "1px",
                      backgroundColor: "divider",
                      zIndex: 1,
                      left: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      left: 8,
                      top: `calc(${yPercent}% - 9px)`,
                      bgcolor: theme.palette.background.paper,
                      px: 0.5,
                      color: "text.secondary",
                      zIndex: 2,
                    }}
                  >
                    {displayLabel} {/* フォーマットされたラベルを表示 */}
                  </Typography>
                </React.Fragment>
              );
            })}
          </Box>

          {/* 場所の列 (PlaceColumn) を描画するエリア */}
          <Box
            sx={{
              display: "flex",
              flexGrow: 1,
              height: "100%",
              overflowX: "auto", // X軸スクロールを有効化
              position: "relative", // グリッド線のために追加
            }}
          >
            {/* Y軸グリッド線 */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%", // PlaceColumnエリア全体の幅
                height: "100%",
                zIndex: 0, // イベントカードより背面
                pointerEvents: "none", // グリッド線がクリックイベントを妨げないように
              }}
            >
              {dateArray.map((dateString, index) => {
                const yPercent = calculateYPositionPercent(dateString);
                // グリッド線がチャートの上端と下端に重ならないように微調整（オプション）
                // if (yPercent === 0 || yPercent === 100) return null;
                return (
                  <Box
                    key={`grid-line-${dateString}-${index}`}
                    sx={{
                      position: "absolute",
                      top: `${yPercent}%`,
                      left: 0,
                      width: "100%",
                      height: "1px",
                      backgroundColor: theme.palette.divider, // より目立たない色が良い場合は調整
                      // borderTop: `1px dashed ${theme.palette.divider}`, // 破線にする場合
                    }}
                  />
                );
              })}
            </Box>

            {places.map((place, index) => (
              <PlaceColumn
                key={place.id}
                place={place}
                plots={plots} // plotsを渡す
                events={eventsByPlace.get(place.id) || []}
                onEventClick={onEventClick}
                onDeleteEvent={onDeleteEvent}
                droppableId={`place-column-${place.id}`}
                calculateYPositionPercent={calculateYPositionPercent}
                sx={{
                  // width: 250, // 固定幅を削除
                  // flexShrink: 0, // flexShrinkを削除
                  flex: "1 0 0%", // flexプロパティを調整
                  minWidth: 180, // 最小幅を設定 (ヘッダーと合わせる)
                  borderRight: index < places.length - 1 ? 1 : 0,
                  borderColor: "divider",
                  position: "relative",
                  overflowY: "auto", // 各カラム内の縦スクロールは維持
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TimelineChart;
