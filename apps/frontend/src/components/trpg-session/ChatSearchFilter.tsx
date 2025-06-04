import React, { useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  SelectChangeEvent,
} from "@mui/material";
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
} from "@mui/icons-material";
import { ChatMessage } from "./ChatInterface";

export interface ChatSearchCriteria {
  searchText: string;
  senderFilter: "all" | "player" | "gm" | "system";
  hasSpellCheck: boolean;
  timeRange: "all" | "last_hour" | "last_day" | "last_week";
}

interface ChatSearchFilterProps {
  messages: ChatMessage[];
  searchCriteria: ChatSearchCriteria;
  onSearchCriteriaChange: (criteria: ChatSearchCriteria) => void;
  onFilteredMessagesChange: (filtered: ChatMessage[]) => void;
}

const ChatSearchFilter: React.FC<ChatSearchFilterProps> = ({
  messages,
  searchCriteria,
  onSearchCriteriaChange,
  onFilteredMessagesChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  // フィルター処理
  const applyFilters = (criteria: ChatSearchCriteria) => {
    let filtered = [...messages];

    // テキスト検索
    if (criteria.searchText.trim()) {
      const searchLower = criteria.searchText.toLowerCase();
      filtered = filtered.filter(
        (msg) =>
          msg.message.toLowerCase().includes(searchLower) ||
          msg.sender.toLowerCase().includes(searchLower) ||
          (msg.diceRoll?.purpose && msg.diceRoll.purpose.toLowerCase().includes(searchLower))
      );
    }

    // 送信者フィルター
    if (criteria.senderFilter !== "all") {
      filtered = filtered.filter((msg) => msg.senderType === criteria.senderFilter);
    }

    // ダイスロール フィルター
    if (criteria.hasSpellCheck) {
      filtered = filtered.filter((msg) => msg.diceRoll !== undefined);
    }

    // 時間範囲フィルター
    if (criteria.timeRange !== "all") {
      const now = new Date();
      const timeLimit = new Date();
      
      switch (criteria.timeRange) {
        case "last_hour":
          timeLimit.setHours(now.getHours() - 1);
          break;
        case "last_day":
          timeLimit.setDate(now.getDate() - 1);
          break;
        case "last_week":
          timeLimit.setDate(now.getDate() - 7);
          break;
      }
      
      filtered = filtered.filter((msg) => new Date(msg.timestamp) >= timeLimit);
    }

    onFilteredMessagesChange(filtered);
  };

  // 検索条件更新
  const updateCriteria = (updates: Partial<ChatSearchCriteria>) => {
    const newCriteria = { ...searchCriteria, ...updates };
    onSearchCriteriaChange(newCriteria);
    applyFilters(newCriteria);
  };

  // クリア機能
  const clearFilters = () => {
    const resetCriteria: ChatSearchCriteria = {
      searchText: "",
      senderFilter: "all",
      hasSpellCheck: false,
      timeRange: "all",
    };
    onSearchCriteriaChange(resetCriteria);
    onFilteredMessagesChange(messages);
  };

  // アクティブフィルター数計算
  const activeFiltersCount = [
    searchCriteria.searchText.trim() !== "",
    searchCriteria.senderFilter !== "all",
    searchCriteria.hasSpellCheck,
    searchCriteria.timeRange !== "all",
  ].filter(Boolean).length;

  return (
    <Box>
      {/* 検索バー */}
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="メッセージを検索..."
          value={searchCriteria.searchText}
          onChange={(e) => updateCriteria({ searchText: e.target.value })}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1 }} />,
          }}
        />
        <IconButton
          onClick={() => setExpanded(!expanded)}
          color={activeFiltersCount > 0 ? "primary" : "default"}
        >
          <FilterList />
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size="small"
              color="primary"
              sx={{ position: "absolute", top: -8, right: -8, minWidth: 20, height: 20 }}
            />
          )}
        </IconButton>
        {activeFiltersCount > 0 && (
          <IconButton onClick={clearFilters} color="secondary">
            <Clear />
          </IconButton>
        )}
      </Box>

      {/* 拡張フィルター */}
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="body2">
            詳細フィルター {activeFiltersCount > 0 && `(${activeFiltersCount}個適用中)`}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* 送信者フィルター */}
            <FormControl size="small" fullWidth>
              <InputLabel>送信者</InputLabel>
              <Select
                value={searchCriteria.senderFilter}
                label="送信者"
                onChange={(e: SelectChangeEvent) =>
                  updateCriteria({ senderFilter: e.target.value as any })
                }
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="player">プレイヤー</MenuItem>
                <MenuItem value="gm">GM</MenuItem>
                <MenuItem value="system">システム</MenuItem>
              </Select>
            </FormControl>

            {/* 時間範囲フィルター */}
            <FormControl size="small" fullWidth>
              <InputLabel>時間範囲</InputLabel>
              <Select
                value={searchCriteria.timeRange}
                label="時間範囲"
                onChange={(e: SelectChangeEvent) =>
                  updateCriteria({ timeRange: e.target.value as any })
                }
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="last_hour">過去1時間</MenuItem>
                <MenuItem value="last_day">過去24時間</MenuItem>
                <MenuItem value="last_week">過去1週間</MenuItem>
              </Select>
            </FormControl>

            {/* ダイスロール フィルター */}
            <Box>
              <Chip
                label="ダイスロールのみ"
                clickable
                color={searchCriteria.hasSpellCheck ? "primary" : "default"}
                onClick={() => updateCriteria({ hasSpellCheck: !searchCriteria.hasSpellCheck })}
                icon={searchCriteria.hasSpellCheck ? <Clear /> : undefined}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ChatSearchFilter;