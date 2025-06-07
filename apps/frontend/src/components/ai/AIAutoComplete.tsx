import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Popper,
  ClickAwayListener,
  Fade,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Psychology as BrainIcon,
  CheckCircle as AcceptIcon,
  Close as RejectIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { TRPGCharacter, TRPGCampaign } from "@trpg-ai-gm/types";

interface AISuggestion {
  id: string;
  type: "character_name" | "character_background" | "character_trait" | "quest_idea" | "npc_personality" | "location_description";
  field: string;
  suggestion: string;
  reasoning: string;
  confidence: number; // 0-100
  context?: any;
}

interface AIAutoCompleteProps {
  targetElement: HTMLElement | null;
  currentValue: string;
  field: string;
  context: {
    character?: Partial<TRPGCharacter>;
    campaign?: TRPGCampaign;
    gameSystem?: string;
    existingData?: any;
  };
  onSuggestionAccepted: (suggestion: string) => void;
  onSuggestionRejected: (suggestionId: string) => void;
  enabled: boolean;
}

const AIAutoComplete: React.FC<AIAutoCompleteProps> = ({
  targetElement,
  currentValue,
  field,
  context,
  onSuggestionAccepted,
  onSuggestionRejected,
  enabled,
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastGeneratedValue, setLastGeneratedValue] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout>();

  // AIによる提案生成
  const generateSuggestions = async (value: string, fieldType: string) => {
    if (!enabled || value.length < 2 || value === lastGeneratedValue) return;

    setLoading(true);
    setLastGeneratedValue(value);

    try {
      // 実際のAI APIの代わりにモックデータを使用
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockSuggestions = generateMockSuggestions(value, fieldType, context);
      setSuggestions(mockSuggestions);
      setOpen(mockSuggestions.length > 0);
    } catch (error) {
      console.error("AI suggestion generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // 値が変更されたときの処理
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (currentValue && currentValue.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        generateSuggestions(currentValue, field);
      }, 800);
    } else {
      setOpen(false);
      setSuggestions([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [currentValue, field, enabled]);

  // 提案を受け入れる
  const handleAcceptSuggestion = (suggestion: AISuggestion) => {
    onSuggestionAccepted(suggestion.suggestion);
    setOpen(false);
    setSuggestions([]);
  };

  // 提案を拒否する
  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    onSuggestionRejected(suggestionId);
    
    if (suggestions.length <= 1) {
      setOpen(false);
    }
  };

  // 新しい提案を生成
  const handleRefreshSuggestions = () => {
    setLastGeneratedValue("");
    generateSuggestions(currentValue, field);
  };

  // 信頼度の色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "success";
    if (confidence >= 60) return "warning";
    return "error";
  };

  // 提案タイプのアイコン
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "character_name":
      case "character_background":
      case "character_trait":
        return <BrainIcon color="primary" />;
      case "quest_idea":
        return <AIIcon color="secondary" />;
      case "npc_personality":
      case "location_description":
        return <AIIcon color="info" />;
      default:
        return <AIIcon />;
    }
  };

  if (!enabled || !targetElement) return null;

  return (
    <Popper
      open={open}
      anchorEl={targetElement}
      placement="bottom-start"
      transition
      style={{ zIndex: 1300 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <Paper
            sx={{
              mt: 1,
              maxWidth: 400,
              maxHeight: 300,
              overflow: "auto",
              border: 1,
              borderColor: "divider",
            }}
          >
            <ClickAwayListener onClickAway={() => setOpen(false)}>
              <Box>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="subtitle2" sx={{ display: "flex", alignItems: "center" }}>
                      <AIIcon sx={{ mr: 1 }} fontSize="small" />
                      AI提案
                    </Typography>
                    <Box>
                      {loading && <CircularProgress size={16} sx={{ mr: 1 }} />}
                      <IconButton size="small" onClick={handleRefreshSuggestions} disabled={loading}>
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {loading && suggestions.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      AI提案を生成中...
                    </Typography>
                  </Box>
                ) : suggestions.length === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
                      この内容に対する提案はありません。
                    </Alert>
                  </Box>
                ) : (
                  <List dense>
                    {suggestions.map((suggestion) => (
                      <ListItem
                        key={suggestion.id}
                        sx={{
                          flexDirection: "column",
                          alignItems: "stretch",
                          borderBottom: 1,
                          borderColor: "divider",
                          "&:last-child": { borderBottom: 0 },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", width: "100%", mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {getSuggestionIcon(suggestion.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={suggestion.suggestion}
                            secondary={suggestion.reasoning}
                            primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: "caption" }}
                            sx={{ flex: 1 }}
                          />
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", ml: 4 }}>
                          <Chip
                            label={`信頼度: ${suggestion.confidence}%`}
                            size="small"
                            color={getConfidenceColor(suggestion.confidence)}
                            variant="outlined"
                          />
                          <Box>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleAcceptSuggestion(suggestion)}
                            >
                              <AcceptIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRejectSuggestion(suggestion.id)}
                            >
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}

                <Box sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary">
                    ESCキーまたは外側をクリックして閉じる
                  </Typography>
                </Box>
              </Box>
            </ClickAwayListener>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};

// モック提案生成関数
const generateMockSuggestions = (
  value: string,
  field: string,
  context: any
): AISuggestion[] => {
  const suggestions: AISuggestion[] = [];

  // キャラクター名の提案
  if (field === "character_name" || field === "name") {
    if (value.length >= 2) {
      const nameVariations = [
        `${value}リス`,
        `${value}ディア`,
        `エル${value}`,
      ];
      
      nameVariations.forEach((name, index) => {
        suggestions.push({
          id: `name_${index}`,
          type: "character_name",
          field: field,
          suggestion: name,
          reasoning: `${context.gameSystem || "ファンタジー"}風のキャラクター名として適している`,
          confidence: 75 + index * 5,
        });
      });
    }
  }

  // 背景の提案
  if (field === "background" || field === "description") {
    if (value.length >= 3) {
      const backgrounds = [
        `${value}として育った孤児で、強い意志を持つ`,
        `${value}の血を引く貴族出身だが、家族の秘密を隠している`,
        `${value}を失った過去があり、それを取り戻そうとしている`,
      ];

      backgrounds.forEach((background, index) => {
        suggestions.push({
          id: `bg_${index}`,
          type: "character_background",
          field: field,
          suggestion: background,
          reasoning: "一般的なTRPGキャラクターの背景として興味深い",
          confidence: 70 + index * 3,
        });
      });
    }
  }

  // 性格特性の提案
  if (field === "personality" || field === "traits") {
    const traits = [
      "勇敢だが時として無謀",
      "知的で冷静、しかし感情を内に秘める",
      "社交的で人懐っこいが、秘密主義的な一面も",
      "実直で正義感が強い",
    ];

    traits.forEach((trait, index) => {
      suggestions.push({
        id: `trait_${index}`,
        type: "character_trait",
        field: field,
        suggestion: trait,
        reasoning: "バランスの取れた性格特性として推奨",
        confidence: 80 - index * 2,
      });
    });
  }

  return suggestions.slice(0, 3); // 最大3つの提案まで
};

export default AIAutoComplete;