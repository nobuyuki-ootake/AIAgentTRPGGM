import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";

interface SearchableListProps<T> {
  items: T[];
  searchFields: (keyof T)[];
  renderItem: (item: T, index: number) => React.ReactNode;
  placeholder?: string;
  sortOptions?: {
    label: string;
    value: string;
    sortFn: (a: T, b: T) => number;
  }[];
  filterOptions?: {
    label: string;
    value: string;
    filterFn: (item: T) => boolean;
  }[];
  emptyMessage?: string;
  showItemCount?: boolean;
}

function SearchableList<T extends Record<string, unknown>>({
  items,
  searchFields,
  renderItem,
  placeholder = "検索...",
  sortOptions = [],
  filterOptions = [],
  emptyMessage = "項目がありません",
  showItemCount = true,
}: SearchableListProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [filterBy, setFilterBy] = useState("");

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // 検索フィルタリング
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchLower);
          }
          if (typeof value === "number") {
            return value.toString().includes(searchLower);
          }
          return false;
        })
      );
    }

    // カスタムフィルタリング
    if (filterBy) {
      const filterOption = filterOptions.find((opt) => opt.value === filterBy);
      if (filterOption) {
        result = result.filter(filterOption.filterFn);
      }
    }

    // ソート
    if (sortBy) {
      const sortOption = sortOptions.find((opt) => opt.value === sortBy);
      if (sortOption) {
        result.sort(sortOption.sortFn);
      }
    }

    return result;
  }, [
    items,
    searchTerm,
    sortBy,
    filterBy,
    searchFields,
    sortOptions,
    filterOptions,
  ]);

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSortBy("");
    setFilterBy("");
  };

  return (
    <Box>
      {/* 検索・フィルター・ソートコントロール */}
      <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {/* 検索バー */}
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* フィルター・ソートコントロール */}
        {(sortOptions.length > 0 || filterOptions.length > 0) && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {sortOptions.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>並び順</InputLabel>
                <Select
                  value={sortBy}
                  label="並び順"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="">
                    <em>デフォルト</em>
                  </MenuItem>
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {filterOptions.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>フィルター</InputLabel>
                <Select
                  value={filterBy}
                  label="フィルター"
                  onChange={(e) => setFilterBy(e.target.value)}
                >
                  <MenuItem value="">
                    <em>すべて</em>
                  </MenuItem>
                  {filterOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {(searchTerm || sortBy || filterBy) && (
              <Tooltip title="フィルターをクリア">
                <IconButton size="small" onClick={handleClearFilters}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* 結果数表示 */}
        {showItemCount && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {filteredAndSortedItems.length} / {items.length} 件
            </Typography>
            {(searchTerm || filterBy) && (
              <Chip
                label={`フィルター適用中`}
                size="small"
                variant="outlined"
                color="primary"
                onDelete={handleClearFilters}
              />
            )}
          </Box>
        )}
      </Box>

      {/* リスト表示 */}
      {filteredAndSortedItems.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filterBy
              ? "検索条件に一致する項目がありません"
              : emptyMessage}
          </Typography>
        </Box>
      ) : (
        <List sx={{ maxHeight: "400px", overflow: "auto" }}>
          {filteredAndSortedItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              {renderItem(item, index)}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default SearchableList;
