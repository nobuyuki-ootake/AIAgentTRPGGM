import React from "react";
import { Box, Typography, CardContent } from "@mui/material";

export const SynopsisTips: React.FC = () => {
  return (
    <CardContent>
      <Typography variant="h6" gutterBottom>
        TRPGゲームマスタリングのヒント
      </Typography>
      <Typography variant="body2" color="text.secondary">
        効果的なキャンペーン設定のポイント：
      </Typography>
      <Box component="ul" sx={{ mt: 1 }}>
        <Typography component="li" variant="body2">
          キャンペーンの世界観と舞台設定を明確にする
        </Typography>
        <Typography component="li" variant="body2">
          プレイヤーキャラクターが活躍できる冒険の機会を用意する
        </Typography>
        <Typography component="li" variant="body2">
          長期的な目標と短期的なクエストのバランスを考える
        </Typography>
        <Typography component="li" variant="body2">
          NPCや敵対勢力の動機と目的を設定する
        </Typography>
        <Typography component="li" variant="body2">
          プレイヤーの選択が物語に影響を与える仕組みを作る
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mt: 2 }}>
        AIゲームマスターアシスタントを使用して、セッション中のサポートを受けることができます。
      </Typography>
    </CardContent>
  );
};
