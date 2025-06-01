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
  IconButton,
} from "@mui/material";
import { PowerSettingsNew, CheckCircle, Cancel } from "@mui/icons-material";

interface PowerCheckUIProps {
  open: boolean;
  onClose: () => void;
  onResult: (result: PowerCheckResult) => void;
  targetClicks?: number; // 目標クリック数
  timeLimit?: number; // 制限時間（秒）
  powerName?: string;
  characterName?: string;
}

export interface PowerCheckResult {
  success: boolean;
  clickCount: number;
  targetClicks: number;
  timeSpent: number;
  powerLevel: number; // 0-100のパワーレベル
}

const PowerCheckUI: React.FC<PowerCheckUIProps> = ({
  open,
  onClose,
  onResult,
  targetClicks = 30,
  timeLimit = 5,
  powerName = "パワー",
  characterName = "キャラクター",
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [result, setResult] = useState<PowerCheckResult | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // タイマー処理
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 0.1;
          if (newTime <= 0) {
            handleTimeUp();
            return 0;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // ダイアログが開いたらリセット
  useEffect(() => {
    if (open) {
      setIsRunning(false);
      setClickCount(0);
      setTimeLeft(timeLimit);
      setResult(null);
      startTimeRef.current = null;
    }
  }, [open, timeLimit]);

  // 目標達成チェック
  useEffect(() => {
    if (isRunning && clickCount >= targetClicks) {
      handleComplete();
    }
  }, [clickCount, targetClicks, isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    setResult(null);
    startTimeRef.current = Date.now();
  };

  const handlePowerClick = () => {
    if (isRunning) {
      setClickCount((prev) => prev + 1);
    }
  };

  const handleTimeUp = () => {
    setIsRunning(false);
    const timeSpent = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : timeLimit;
    const powerLevel = Math.min(100, Math.round((clickCount / targetClicks) * 100));

    const checkResult: PowerCheckResult = {
      success: false,
      clickCount: clickCount,
      targetClicks: targetClicks,
      timeSpent: timeSpent,
      powerLevel: powerLevel,
    };

    setResult(checkResult);
  };

  const handleComplete = () => {
    setIsRunning(false);
    const timeSpent = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
    const powerLevel = Math.min(100, Math.round((clickCount / targetClicks) * 100));

    const checkResult: PowerCheckResult = {
      success: true,
      clickCount: clickCount,
      targetClicks: targetClicks,
      timeSpent: timeSpent,
      powerLevel: powerLevel,
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
    if (result.success && result.powerLevel >= 150) return "warning"; // オーバーパワー
    return result.success ? "success" : "error";
  };

  const getResultText = () => {
    if (!result) return "";
    if (result.success && result.powerLevel >= 150) return "オーバーパワー！";
    if (result.success) return "成功！";
    if (result.powerLevel >= 80) return "惜しい！";
    return "失敗...";
  };

  const progressValue = (clickCount / targetClicks) * 100;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {characterName}の{powerName}チェック
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 3 }}>
          <Typography variant="body1" align="center" gutterBottom>
            {isRunning
              ? "ボタンを連打してゲージをMAXまで！"
              : "スタートを押してボタンを連打！"}
          </Typography>

          {/* プログレスバー */}
          <Box sx={{ position: "relative", mt: 3, mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 40,
                borderRadius: 2,
                backgroundColor: "grey.300",
                "& .MuiLinearProgress-bar": {
                  backgroundColor:
                    progressValue >= 100
                      ? "success.main"
                      : progressValue >= 80
                      ? "warning.main"
                      : "primary.main",
                },
              }}
            />
            {/* 目標ライン */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "2px",
                height: "100%",
                backgroundColor: "error.main",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: "-20px",
                right: "-10px",
                color: "error.main",
              }}
            >
              目標
            </Typography>
          </Box>

          {/* カウント表示 */}
          <Typography variant="h4" align="center" color="primary" gutterBottom>
            {clickCount} / {targetClicks}
          </Typography>

          {/* 残り時間 */}
          {isRunning && (
            <Typography
              variant="h6"
              align="center"
              color={timeLeft <= 1 ? "error" : "text.secondary"}
              gutterBottom
            >
              残り時間: {timeLeft.toFixed(1)}秒
            </Typography>
          )}

          {/* パワーボタン */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <IconButton
              onClick={handlePowerClick}
              disabled={!isRunning}
              sx={{
                width: 120,
                height: 120,
                backgroundColor: isRunning ? "error.main" : "grey.300",
                color: "white",
                "&:hover": {
                  backgroundColor: isRunning ? "error.dark" : "grey.400",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
                "&:disabled": {
                  backgroundColor: "grey.300",
                  color: "grey.500",
                },
                transition: "all 0.1s",
              }}
            >
              <PowerSettingsNew sx={{ fontSize: 60 }} />
            </IconButton>
          </Box>

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
                クリック数: {result.clickCount} / 目標: {result.targetClicks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                パワーレベル: {result.powerLevel}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                所要時間: {result.timeSpent.toFixed(1)}秒
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        {!result ? (
          <Button
            onClick={handleStart}
            variant="contained"
            color="primary"
            disabled={isRunning}
          >
            スタート
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

export default PowerCheckUI;