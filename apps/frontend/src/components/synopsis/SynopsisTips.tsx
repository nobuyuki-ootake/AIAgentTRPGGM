import React from "react";
import { Box, Typography, CardContent } from "@mui/material";

export const SynopsisTips: React.FC = () => {
  return (
    <CardContent>
      <Typography variant="h6" gutterBottom>
        AIアシスタントのヒント
      </Typography>
      <Typography variant="body2" color="text.secondary">
        効果的なあらすじの書き方：
      </Typography>
      <Box component="ul" sx={{ mt: 1 }}>
        <Typography component="li" variant="body2">
          主人公の目標と障害を明確にする
        </Typography>
        <Typography component="li" variant="body2">
          物語の主要な転換点を含める
        </Typography>
        <Typography component="li" variant="body2">
          物語の舞台設定と時代背景を簡潔に説明する
        </Typography>
        <Typography component="li" variant="body2">
          最終的な結末まで含める（ネタバレを気にする必要はありません）
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        必要な支援が欲しい場合は、右側のチャットパネルからAIアシスタントに質問できます。
      </Typography>
    </CardContent>
  );
};
