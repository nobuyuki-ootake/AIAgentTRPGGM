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
import { Add as AddIcon } from "@mui/icons-material";
import {
  TRPGCharacter,
  TimelineEvent,
  CharacterStatus,
  PlaceElement,
  BaseLocation,
  EventResult,
  Item,
  EventCondition,
} from "@trpg-ai-gm/types";
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
  characters: TRPGCharacter[];
  places: (PlaceElement | BaseLocation)[];
  items: Item[];
  onClose: () => void;
  onSave: () => void;
  onEventChange: (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>,
    field?: string
  ) => void;
  onCharactersChange: (event: SelectChangeEvent<string[]>) => void;
  onEventResultsChange: (results: EventResult[]) => void;
  onEventConditionsChange: (conditions: EventCondition[]) => void;
  getCharacterName: (id: string) => string;
  getPlaceName: (id: string) => string;
  onPostEventStatusChange: (
    characterId: string,
    newStatuses: CharacterStatus[]
  ) => void;
  definedCharacterStatuses?: CharacterStatus[];
  allPlots: any[];
  onRelatedPlotsChange: (selectedPlotIds: string[]) => void;
}

const TimelineEventDialog: React.FC<TimelineEventDialogProps> = ({
  open,
  isEditing,
  newEvent,
  characters,
  places,
  items,
  onClose,
  onSave,
  onEventChange,
  onCharactersChange,
  onEventResultsChange,
  onEventConditionsChange,
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
            label="イベント名"
            fullWidth
            value={newEvent.title}
            onChange={onEventChange}
            placeholder="例：「ゴブリンの襲撃」「ボス戦」「重要NPCとの会話」など"
          />

          <TextField
            name="dayNumber"
            label="イベント発生日（日数）"
            type="number"
            fullWidth
            value={newEvent.dayNumber || 1}
            onChange={onEventChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: 1, step: 1 }}
            helperText="1日目～X日目の形式で入力してください"
          />

          <TextField
            name="description"
            label="説明"
            multiline
            rows={3}
            fullWidth
            value={newEvent.description}
            onChange={onEventChange}
            placeholder="イベントの詳細、結果、影響などを記録"
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

          {/* 関連場所（ドロップダウン選択） */}
          <FormControl fullWidth>
            <InputLabel id="place-select-label">関連場所</InputLabel>
            <Select
              labelId="place-select-label"
              name="placeId"
              value={newEvent.placeId || ""}
              onChange={(e) =>
                onEventChange(e as SelectChangeEvent<string>, "placeId")
              }
              label="関連場所"
            >
              <MenuItem value="">
                <em>場所を選択してください</em>
              </MenuItem>
              {places.map((place) => (
                <MenuItem key={place.id} value={place.id}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: 'type' in place ? "primary.main" : "secondary.main",
                        mr: 1,
                        flexShrink: 0,
                      }}
                    />
                    {place.name}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {'type' in place ? '(場所)' : '(拠点)'}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

          {/* イベント発生条件セクション */}
          <Box component={Paper} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 1 }}>
              イベント発生条件
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              このイベントが発生するために必要な条件を設定します
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              {newEvent.conditions && newEvent.conditions.length > 0 ? (
                newEvent.conditions.map((condition, index) => (
                  <Box
                    key={condition.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "grey.50",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        条件 #{index + 1}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          const newConditions = newEvent.conditions?.filter((_, i) => i !== index) || [];
                          onEventConditionsChange(newConditions);
                        }}
                      >
                        削除
                      </Button>
                    </Box>
                    
                    <Stack spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>条件タイプ</InputLabel>
                        <Select
                          value={condition.type}
                          onChange={(e) => {
                            const newConditions = [...(newEvent.conditions || [])];
                            newConditions[index] = { ...condition, type: e.target.value as EventCondition['type'] };
                            onEventConditionsChange(newConditions);
                          }}
                          label="条件タイプ"
                        >
                          <MenuItem value="item_required">アイテム所持</MenuItem>
                          <MenuItem value="flag_required">フラグ条件</MenuItem>
                          <MenuItem value="character_status">キャラクター状態</MenuItem>
                          <MenuItem value="location_required">場所条件</MenuItem>
                          <MenuItem value="quest_completed">クエスト完了</MenuItem>
                          <MenuItem value="day_range">日数範囲</MenuItem>
                          <MenuItem value="custom">カスタム条件</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="条件の説明"
                        fullWidth
                        value={condition.description}
                        onChange={(e) => {
                          const newConditions = [...(newEvent.conditions || [])];
                          newConditions[index] = { ...condition, description: e.target.value };
                          onEventConditionsChange(newConditions);
                        }}
                        placeholder="例：「魔法のカギを所持している」「村を救済済み」"
                      />

                      {condition.type === "item_required" && (
                        <>
                          <FormControl fullWidth>
                            <InputLabel>必要アイテム</InputLabel>
                            <Select
                              value={condition.itemId || ""}
                              onChange={(e) => {
                                const newConditions = [...(newEvent.conditions || [])];
                                newConditions[index] = { ...condition, itemId: e.target.value };
                                onEventConditionsChange(newConditions);
                              }}
                              label="必要アイテム"
                            >
                              <MenuItem value="">
                                <em>アイテムを選択</em>
                              </MenuItem>
                              {items.filter(item => item.type === 'key_item').map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                  <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Chip
                                      label="キーアイテム"
                                      size="small"
                                      color="primary"
                                      sx={{ mr: 1, minWidth: 80 }}
                                    />
                                    {item.name}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <TextField
                            label="必要数量"
                            type="number"
                            fullWidth
                            value={condition.itemQuantity || 1}
                            onChange={(e) => {
                              const newConditions = [...(newEvent.conditions || [])];
                              newConditions[index] = { ...condition, itemQuantity: parseInt(e.target.value) || 1 };
                              onEventConditionsChange(newConditions);
                            }}
                            inputProps={{ min: 1 }}
                          />
                        </>
                      )}

                      {condition.type === "flag_required" && (
                        <>
                          <TextField
                            label="フラグキー"
                            fullWidth
                            value={condition.flagKey || ""}
                            onChange={(e) => {
                              const newConditions = [...(newEvent.conditions || [])];
                              newConditions[index] = { ...condition, flagKey: e.target.value };
                              onEventConditionsChange(newConditions);
                            }}
                            placeholder="例：village_saved, boss_defeated"
                          />
                          
                          <TextField
                            label="期待値"
                            fullWidth
                            value={condition.flagValue || ""}
                            onChange={(e) => {
                              const newConditions = [...(newEvent.conditions || [])];
                              newConditions[index] = { ...condition, flagValue: e.target.value };
                              onEventConditionsChange(newConditions);
                            }}
                            placeholder="例：true, completed, 3"
                          />
                        </>
                      )}

                      {condition.type === "quest_completed" && (
                        <FormControl fullWidth>
                          <InputLabel>完了必須クエスト</InputLabel>
                          <Select
                            value={condition.questId || ""}
                            onChange={(e) => {
                              const newConditions = [...(newEvent.conditions || [])];
                              newConditions[index] = { ...condition, questId: e.target.value };
                              onEventConditionsChange(newConditions);
                            }}
                            label="完了必須クエスト"
                          >
                            <MenuItem value="">
                              <em>クエストを選択</em>
                            </MenuItem>
                            {allPlots.map((plot) => (
                              <MenuItem key={plot.id} value={plot.id}>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  <Chip
                                    label={plot.questType}
                                    size="small"
                                    color={plot.questType === 'メイン' ? 'primary' : 'secondary'}
                                    sx={{ mr: 1, minWidth: 60 }}
                                  />
                                  {plot.title}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {condition.type === "day_range" && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <TextField
                            label="最小日数"
                            type="number"
                            value={condition.dayMin || 1}
                            onChange={(e) => {
                              const newConditions = [...(newEvent.conditions || [])];
                              newConditions[index] = { ...condition, dayMin: parseInt(e.target.value) || 1 };
                              onEventConditionsChange(newConditions);
                            }}
                            inputProps={{ min: 1 }}
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="最大日数"
                            type="number"
                            value={condition.dayMax || 999}
                            onChange={(e) => {
                              const newConditions = [...(newEvent.conditions || [])];
                              newConditions[index] = { ...condition, dayMax: parseInt(e.target.value) || 999 };
                              onEventConditionsChange(newConditions);
                            }}
                            inputProps={{ min: 1 }}
                            sx={{ flex: 1 }}
                          />
                        </Box>
                      )}

                      {condition.type === "custom" && (
                        <TextField
                          label="カスタム条件"
                          fullWidth
                          multiline
                          rows={2}
                          value={condition.customCondition || ""}
                          onChange={(e) => {
                            const newConditions = [...(newEvent.conditions || [])];
                            newConditions[index] = { ...condition, customCondition: e.target.value };
                            onEventConditionsChange(newConditions);
                          }}
                          placeholder="詳細な条件を記述してください"
                        />
                      )}
                    </Stack>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  イベント発生条件が設定されていません
                </Typography>
              )}
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  const newCondition: EventCondition = {
                    id: crypto.randomUUID(),
                    type: "item_required",
                    description: "",
                  };
                  const newConditions = [...(newEvent.conditions || []), newCondition];
                  onEventConditionsChange(newConditions);
                }}
                sx={{ alignSelf: "flex-start" }}
              >
                条件を追加
              </Button>
            </Stack>
          </Box>

          {/* イベント結果セクション */}
          <Box component={Paper} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 1 }}>
              イベント結果
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              このイベントで得られるアイテムや設定されるフラグを管理します
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              {newEvent.results && newEvent.results.length > 0 ? (
                newEvent.results.map((result, index) => (
                  <Box
                    key={result.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "grey.50",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        結果 #{index + 1}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          const newResults = newEvent.results?.filter((_, i) => i !== index) || [];
                          onEventResultsChange(newResults);
                        }}
                      >
                        削除
                      </Button>
                    </Box>
                    
                    <Stack spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>結果タイプ</InputLabel>
                        <Select
                          value={result.type}
                          onChange={(e) => {
                            const newResults = [...(newEvent.results || [])];
                            newResults[index] = { ...result, type: e.target.value as EventResult['type'] };
                            onEventResultsChange(newResults);
                          }}
                          label="結果タイプ"
                        >
                          <MenuItem value="item_gained">アイテム取得</MenuItem>
                          <MenuItem value="item_lost">アイテム失失</MenuItem>
                          <MenuItem value="flag_set">フラグ設定</MenuItem>
                          <MenuItem value="flag_unset">フラグ解除</MenuItem>
                          <MenuItem value="condition_met">条件達成</MenuItem>
                          <MenuItem value="story_progress">ストーリー進行</MenuItem>
                          <MenuItem value="character_change">キャラクター変化</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="説明"
                        fullWidth
                        value={result.description}
                        onChange={(e) => {
                          const newResults = [...(newEvent.results || [])];
                          newResults[index] = { ...result, description: e.target.value };
                          onEventResultsChange(newResults);
                        }}
                        placeholder="例：「魔法の剣を取得」「村の救済フラグを設定」"
                      />

                      {(result.type === "item_gained" || result.type === "item_lost") && (
                        <>
                          <FormControl fullWidth>
                            <InputLabel>アイテム</InputLabel>
                            <Select
                              value={result.itemId || ""}
                              onChange={(e) => {
                                const newResults = [...(newEvent.results || [])];
                                newResults[index] = { ...result, itemId: e.target.value };
                                onEventResultsChange(newResults);
                              }}
                              label="アイテム"
                            >
                              <MenuItem value="">
                                <em>アイテムを選択</em>
                              </MenuItem>
                              {items.map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                  <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Chip
                                      label={item.type}
                                      size="small"
                                      color={
                                        item.type === "key_item" ? "primary" :
                                        item.type === "equipment" ? "secondary" : "default"
                                      }
                                      sx={{ mr: 1, minWidth: 80 }}
                                    />
                                    {item.name}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          
                          <TextField
                            label="数量"
                            type="number"
                            fullWidth
                            value={result.itemQuantity || 1}
                            onChange={(e) => {
                              const newResults = [...(newEvent.results || [])];
                              newResults[index] = { ...result, itemQuantity: parseInt(e.target.value) || 1 };
                              onEventResultsChange(newResults);
                            }}
                            inputProps={{ min: 1 }}
                          />
                        </>
                      )}

                      {(result.type === "flag_set" || result.type === "flag_unset") && (
                        <>
                          <TextField
                            label="フラグキー"
                            fullWidth
                            value={result.flagKey || ""}
                            onChange={(e) => {
                              const newResults = [...(newEvent.results || [])];
                              newResults[index] = { ...result, flagKey: e.target.value };
                              onEventResultsChange(newResults);
                            }}
                            placeholder="例：village_saved, boss_defeated"
                          />
                          
                          <TextField
                            label="フラグ値"
                            fullWidth
                            value={result.flagValue || ""}
                            onChange={(e) => {
                              const newResults = [...(newEvent.results || [])];
                              newResults[index] = { ...result, flagValue: e.target.value };
                              onEventResultsChange(newResults);
                            }}
                            placeholder="例：true, completed, 3"
                          />
                        </>
                      )}
                    </Stack>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  イベント結果が設定されていません
                </Typography>
              )}
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  const newResult: EventResult = {
                    id: crypto.randomUUID(),
                    type: "item_gained",
                    description: "",
                  };
                  const newResults = [...(newEvent.results || []), newResult];
                  onEventResultsChange(newResults);
                }}
                sx={{ alignSelf: "flex-start" }}
              >
                結果を追加
              </Button>
            </Stack>
          </Box>

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

                    const currentStatuses: CharacterStatus[] = []; // TRPGCharacterにstatusesプロパティが存在しないため空配列を使用
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
