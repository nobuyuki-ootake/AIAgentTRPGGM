import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";

interface SkillCheckUIProps {
  open: boolean;
  onClose: () => void;
  onResult: (result: SkillCheckResult) => void;
  difficulty?: number; // 1-100
  skillName?: string;
  characterName?: string;
}

export interface SkillCheckResult {
  success: boolean;
  value: number;
  difficulty: number;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
}

const SkillCheckUI: React.FC<SkillCheckUIProps> = ({
  open,
  onClose,
  onResult,
  difficulty = 50,
  skillName = "スキル",
  characterName = "キャラクター",
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentValue, setCurrentValue] = useState(0);
  const [result, setResult] = useState<SkillCheckResult | null>(null);
  const animationFrameRef = useRef<number>();

  // ゲージアニメーション
  useEffect(() => {
    if (isRunning) {
      const animate = () => {
        setCurrentValue((prev) => {
          const next = prev + 2;
          return next >= 100 ? 0 : next;
        });
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning]);

  // ダイアログが開いたらリセット
  useEffect(() => {
    if (open) {
      setIsRunning(false);
      setCurrentValue(0);
      setResult(null);
    }
  }, [open]);

  const handleStart = () => {
    setIsRunning(true);
    setResult(null);
  };

  const handleStop = () => {
    setIsRunning(false);
    
    // 成功判定
    const successZoneStart = difficulty - 10;
    const successZoneEnd = difficulty + 10;
    const isInSuccessZone = currentValue >= successZoneStart && currentValue <= successZoneEnd;
    const isCritical = Math.abs(currentValue - difficulty) <= 2;
    const isCriticalFailure = Math.abs(currentValue - difficulty) >= 90;

    const checkResult: SkillCheckResult = {
      success: isInSuccessZone,
      value: currentValue,
      difficulty: difficulty,
      criticalSuccess: isInSuccessZone && isCritical,
      criticalFailure: !isInSuccessZone && isCriticalFailure,
    };

    setResult(checkResult);
  };

  const handleConfirm = () => {
    if (result) {
      onResult(result);
      onClose();
    }
  };

  const getResultColor = () => {
    if (!result) return "primary";
    if (result.criticalSuccess) return "warning";
    if (result.criticalFailure) return "error";
    return result.success ? "success" : "error";
  };

  const getResultText = () => {
    if (!result) return "";
    if (result.criticalSuccess) return "クリティカル成功！";
    if (result.criticalFailure) return "ファンブル！";
    return result.success ? "成功！" : "失敗...";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {characterName}の{skillName}チェック
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 3 }}>
          <Typography variant="body1" align="center" gutterBottom>
            緑のゾーンでボタンを押してください！
          </Typography>
          
          {/* 円形ゲージの代わりに線形プログレスバーで表現 */}
          <Box sx={{ position: "relative", mt: 4, mb: 4 }}>
            <LinearProgress
              variant="determinate"
              value={currentValue}
              sx={{
                height: 40,
                borderRadius: 2,
                backgroundColor: "grey.300",
              }}
            />
            
            {/* 成功ゾーン表示 */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: `${Math.max(0, difficulty - 10)}%`,
                width: "20%",
                height: "100%",
                backgroundColor: "success.light",
                opacity: 0.5,
                borderRadius: 2,
              }}
            />
            
            {/* 難易度マーカー */}
            <Box
              sx={{
                position: "absolute",
                top: "-10px",
                left: `${difficulty}%`,
                transform: "translateX(-50%)",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                目標値
              </Typography>
            </Box>
          </Box>

          <Typography variant="h4" align="center" color="primary">
            {currentValue}
          </Typography>

          {result && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              {result.success ? (
                <CheckCircle sx={{ fontSize: 60, color: getResultColor() }} />
              ) : (
                <Cancel sx={{ fontSize: 60, color: getResultColor() }} />
              )}
              <Typography variant="h5" color={getResultColor()} sx={{ mt: 1 }}>
                {getResultText()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                目標値: {difficulty} / あなたの値: {currentValue}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        {!result ? (
          <Button
            onClick={isRunning ? handleStop : handleStart}
            variant="contained"
            color={isRunning ? "error" : "primary"}
          >
            {isRunning ? "ストップ！" : "スタート"}
          </Button>
        ) : (
          <Button onClick={handleConfirm} variant="contained" color="primary">
            確定
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SkillCheckUI;