import React, { useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  SelectChangeEvent,
  Stack,
  Divider,
  Autocomplete,
  Paper,
} from "@mui/material";
import {
  Character,
  TimelineEvent,
  CharacterStatus,
  PlotElement,
} from "@novel-ai-assistant/types";
import { getCharacterIcon, eventTypes } from "./TimelineUtils";
import moment from "moment";

// イベント種別の定義 (TimelineUtils.tsx に移動したためコメントアウトまたは削除)
// export const eventTypes = [
// ... (definition was here)
// ];

// デフォルトの状態を定義
const defaultStatuses: CharacterStatus[] = [
  {
    id: "default_healthy",
    name: "健康",
    type: "life",
    mobility: "normal",
    description: "心身ともに問題ない状態。",
  },
  {
    id: "default_dead",
    name: "死亡",
    type: "life",
    mobility: "impossible",
    description: "生命活動が停止した状態。",
  },
];

interface TimelineEventDialogProps {
  open: boolean;
  isEditing: boolean;
  newEvent: TimelineEvent;
  characters: Character[];
  onClose: () => void;
  onSave: () => void;
  onEventChange: (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>,
    field?: string
  ) => void;
  onCharactersChange: (event: SelectChangeEvent<string[]>) => void;
  getCharacterName: (id: string) => string;
  getPlaceName: (id: string) => string;
  onPostEventStatusChange: (
    characterId: string,
    newStatuses: CharacterStatus[]
  ) => void;
  definedCharacterStatuses?: CharacterStatus[];
  allPlots: PlotElement[];
  onRelatedPlotsChange: (selectedPlotIds: string[]) => void;
}

const TimelineEventDialog: React.FC<TimelineEventDialogProps> = ({
  open,
  isEditing,
  newEvent,
  characters,
  onClose,
  onSave,
  onEventChange,
  onCharactersChange,
  getCharacterName,
  getPlaceName,
  onPostEventStatusChange,
  definedCharacterStatuses = [],
  allPlots,
  onRelatedPlotsChange,
}) => {
  console.log(
    "[TimelineEventDialog] definedCharacterStatuses (from props):",
    definedCharacterStatuses
  );

  const availableStatuses = useMemo(() => {
    const userDefinedIds = new Set(
      (definedCharacterStatuses || []).map((s) => s.id)
    );
    const uniqueDefaultStatuses = defaultStatuses.filter(
      (ds) => !userDefinedIds.has(ds.id)
    );
    const combined = [
      ...uniqueDefaultStatuses,
      ...(definedCharacterStatuses || []),
    ];
    console.log(
      "[TimelineEventDialog] availableStatuses (combined):",
      combined
    );
    return combined;
  }, [definedCharacterStatuses]);

  // キャラクターの状態をチップで表示するヘルパーコンポーネント (ローカルで定義)
  const CharacterStatusChips: React.FC<{ statuses?: CharacterStatus[] }> = ({
    statuses,
  }) => {
    if (!statuses || statuses.length === 0) {
      return (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ lineHeight: "normal" }}
        >
          状態なし
        </Typography>
      );
    }
    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {statuses.map((status) => (
          <Chip
            key={status.id}
            label={status.name}
            size="small"
            variant="outlined"
            color={
              status.mobility === "normal"
                ? "success"
                : status.mobility === "slow"
                ? "warning"
                : status.mobility === "impossible"
                ? "error"
                : "default"
            }
            sx={{ mb: 0.5 }}
          />
        ))}
      </Stack>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? "イベントを編集" : "新しいイベントを追加"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField
            name="title"
            label="イベントタイトル"
            fullWidth
            value={newEvent.title}
            onChange={onEventChange}
            placeholder="例：「主人公の故郷が襲撃される」「重要な手がかりを発見」など"
          />

          <TextField
            name="date"
            label="日付"
            type="date"
            fullWidth
            value={moment(newEvent.date).format("YYYY-MM-DD")}
            onChange={onEventChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            name="description"
            label="説明"
            multiline
            rows={3}
            fullWidth
            value={newEvent.description}
            onChange={onEventChange}
            placeholder="イベントの詳細を入力してください"
          />

          <FormControl fullWidth>
            <InputLabel id="event-type-select-label">イベント種別</InputLabel>
            <Select
              labelId="event-type-select-label"
              name="eventType"
              value={newEvent.eventType || ""}
              onChange={(e) =>
                onEventChange(e as SelectChangeEvent<string>, "eventType")
              }
              label="イベント種別"
            >
              {eventTypes.map((type) => {
                const IconComponent = type.iconComponent;
                return (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <IconComponent sx={{ mr: 1 }} />
                      {type.label}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="characters-select-label">
              関連キャラクター
            </InputLabel>
            <Select
              labelId="characters-select-label"
              multiple
              value={newEvent.relatedCharacters}
              onChange={onCharactersChange}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => {
                    const character = characters.find((c) => c.id === value);
                    const { color, emoji } = character
                      ? getCharacterIcon(character)
                      : { color: "#808080", emoji: "👤" };

                    return (
                      <Chip
                        key={value}
                        label={getCharacterName(value)}
                        size="small"
                        onDelete={() => {
                          // キャラクターを削除
                          const newCharacters =
                            newEvent.relatedCharacters.filter(
                              (id) => id !== value
                            );
                          onCharactersChange({
                            target: { value: newCharacters },
                          } as SelectChangeEvent<string[]>);
                        }}
                        avatar={
                          character?.imageUrl ? (
                            <Avatar
                              src={character.imageUrl}
                              sx={{ width: 20, height: 20 }}
                            />
                          ) : (
                            <Avatar
                              sx={{
                                bgcolor: color,
                                color: "white",
                                width: 20,
                                height: 20,
                                fontSize: "0.8rem",
                              }}
                            >
                              {emoji}
                            </Avatar>
                          )
                        }
                      />
                    );
                  })}
                </Box>
              )}
              label="関連キャラクター"
            >
              {characters.map((character) => {
                const { color, emoji } = getCharacterIcon(character);
                return (
                  <MenuItem key={character.id} value={character.id}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        src={character.imageUrl}
                        sx={{
                          width: 24,
                          height: 24,
                          mr: 1,
                          fontSize: "0.75rem",
                          bgcolor: !character.imageUrl ? color : undefined,
                          color: !character.imageUrl ? "white" : undefined,
                        }}
                      >
                        {!character.imageUrl && emoji}
                      </Avatar>
                      {character.name}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* 関連場所（表示のみ） */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
              関連場所
            </Typography>
            <Typography
              variant="body1"
              sx={{
                p: 1.5,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                backgroundColor: "grey.50",
                minHeight: "40px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {newEvent.placeId
                ? getPlaceName(newEvent.placeId)
                : "タイムラインチャートで場所を設定してください"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              場所はタイムラインチャート上でイベントをドラッグ&ドロップして設定できます
            </Typography>
          </Box>

          {/* 関連プロット選択 */}
          <FormControl fullWidth>
            <Autocomplete
              multiple
              id="related-plots-select"
              options={allPlots}
              getOptionLabel={(option) => option.title}
              value={allPlots.filter((plot) =>
                newEvent.relatedPlotIds?.includes(plot.id)
              )}
              onChange={(_, newValue) => {
                onRelatedPlotsChange(newValue.map((plot) => plot.id));
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="関連プロット"
                  placeholder={
                    allPlots.length > 0
                      ? "プロットを選択"
                      : "プロットが登録されていません"
                  }
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.title}
                    size="small"
                  />
                ))
              }
              disabled={allPlots.length === 0}
            />
          </FormControl>

          {newEvent.relatedCharacters &&
            newEvent.relatedCharacters.length > 0 && (
              <Box component={Paper} variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 1 }}>
                  キャラクターの状態変更
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2.5}>
                  {newEvent.relatedCharacters.map((charId) => {
                    const character = characters.find((c) => c.id === charId);
                    if (!character) return null;

                    const currentStatuses = character.statuses || [];
                    const postEventStatusesForChar =
                      newEvent.postEventCharacterStatuses?.[charId] || [];

                    return (
                      <Box
                        key={charId}
                        sx={{
                          borderBottom: 1,
                          borderColor: "divider",
                          pb: 2,
                          "&:last-child": { borderBottom: 0, pb: 0 },
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          component="div"
                          sx={{ fontWeight: "medium" }}
                        >
                          {character.name}
                        </Typography>
                        <Stack spacing={1.5} sx={{ pl: 1 }}>
                          <Box>
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                              gutterBottom
                              sx={{ mb: 0.2 }}
                            >
                              イベント前の状態:
                            </Typography>
                            <CharacterStatusChips statuses={currentStatuses} />
                          </Box>
                          <Autocomplete
                            multiple
                            size="small"
                            id={`post-status-${charId}`}
                            options={availableStatuses}
                            getOptionLabel={(option) => option?.name || ""}
                            value={availableStatuses.filter((opt) =>
                              postEventStatusesForChar.some(
                                (s) => s.id === opt?.id
                              )
                            )}
                            onChange={(_, selectedOptions) => {
                              onPostEventStatusChange(
                                charId,
                                selectedOptions || []
                              );
                            }}
                            isOptionEqualToValue={(option, value) =>
                              option?.id === value?.id
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                label="イベント後の状態"
                                placeholder="状態を選択"
                              />
                            )}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) =>
                                option && option.id && option.name ? (
                                  <Chip
                                    {...getTagProps({ index })}
                                    key={option.id}
                                    label={option.name}
                                    size="small"
                                    color={
                                      option.mobility === "normal"
                                        ? "success"
                                        : option.mobility === "slow"
                                        ? "warning"
                                        : option.mobility === "impossible"
                                        ? "error"
                                        : "default"
                                    }
                                  />
                                ) : null
                              )
                            }
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={!newEvent.title.trim() || !newEvent.date}
        >
          {isEditing ? "更新" : "作成"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimelineEventDialog;
