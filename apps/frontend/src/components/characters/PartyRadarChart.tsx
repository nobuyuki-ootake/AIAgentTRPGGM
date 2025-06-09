import React from "react";
import { Box, Typography } from "@mui/material";

interface RadarData {
  label: string;
  value: number; // 1-5の評価値
  maxValue: number; // 通常は5
}

interface PartyRadarChartProps {
  data: RadarData[];
  size?: number;
}

const PartyRadarChart: React.FC<PartyRadarChartProps> = ({
  data,
  size = 300,
}) => {
  const center = size / 2;
  const radius = (size / 2) - 40;
  const angleStep = (2 * Math.PI) / data.length;

  // 5段階の同心円を描画するためのポイント
  const getCirclePoints = (level: number) => {
    const r = (radius * level) / 5;
    return data.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  };

  // データポイントの座標を計算
  const dataPoints = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (radius * item.value) / item.maxValue;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, item };
  });

  // データ領域のパスを生成
  const dataPath = dataPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  // ラベル位置を計算
  const labelPoints = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = radius + 25;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    return { x, y, label: item.label };
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {/* 背景の同心円 */}
        {[1, 2, 3, 4, 5].map((level) => (
          <polygon
            key={level}
            points={getCirclePoints(level)}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* 軸線 */}
        {data.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          );
        })}

        {/* データ領域 */}
        <path
          d={dataPath}
          fill="rgba(25, 118, 210, 0.3)"
          stroke="#1976d2"
          strokeWidth="2"
        />

        {/* データポイント */}
        {dataPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#1976d2"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}

        {/* ラベル */}
        {labelPoints.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="#666"
            fontWeight="500"
          >
            {point.label}
          </text>
        ))}

        {/* 中心レベル表示 */}
        {[1, 2, 3, 4, 5].map((level) => (
          <text
            key={level}
            x={center + 5}
            y={center - (radius * level) / 5}
            fontSize="10"
            fill="#999"
            textAnchor="start"
            dominantBaseline="middle"
          >
            {level}
          </text>
        ))}
      </svg>

      {/* 凡例 */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: '#1976d2',
                borderRadius: '50%',
              }}
            />
            <Typography variant="caption">
              {item.label}: {item.value}/5
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PartyRadarChart;