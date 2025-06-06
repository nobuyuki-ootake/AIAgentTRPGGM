import { useState, useEffect, useCallback } from "react";
import { useRecoilState } from "recoil";
import { currentCampaignState } from "../store/atoms";
import {
  TRPGCharacter,
  CustomField,
  CharacterTrait,
  Relationship,
  CharacterStatus,
  TRPGCampaign,
  CharacterStats,
  Skill,
  Equipment,
  CharacterProgression,
} from "@trpg-ai-gm/types";
import { v4 as uuidv4 } from "uuid";

// 絵文字をデータURLに変換する関数
const emojiToDataUrl = (emoji: string): string => {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(emoji)}`;
};

// データURLから絵文字を抽出する関数
const dataUrlToEmoji = (dataUrl: string): string | null => {
  if (!dataUrl || !dataUrl.startsWith("data:text/plain;charset=utf-8,")) {
    return null;
  }
  return decodeURIComponent(dataUrl.split(",")[1]);
};

// TRPGキャラクター型を変換する関数
const convertToTRPGCharacter = (character: TRPGCharacter): TRPGCharacter => {
  // traitsはそのまま
  const traits = character.traits || [];
  // relationshipsもそのまま
  const relationships = character.relationships || [];
  
  // 基本ステータスの初期化
  const defaultStats: CharacterStats = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hitPoints: { current: 10, max: 10, temp: 0 },
    manaPoints: { current: 0, max: 0 },
    armorClass: 10,
    speed: 30,
    level: 1,
    experience: 0,
    proficiencyBonus: 2,
  };
  
  return {
    ...character,
    characterType: character.characterType || "NPC",
    stats: character.stats || defaultStats,
    skills: character.skills || [],
    equipment: character.equipment || [],
    progression: character.progression || [],
    traits,
    relationships,
  };
};


export function useCharacters() {
  // Recoilの状態
  const [currentProject, setCurrentProject] =
    useRecoilState(currentCampaignState);

  // ローカルの状態
  const [characters, setCharacters] = useState<TRPGCharacter[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 新規TRPGキャラクター用の初期状態
  const initialCharacterState: Partial<TRPGCharacter> & {
    id: string;
    name: string;
    characterType: "PC" | "NPC" | "Enemy";
  } = {
    id: "",
    name: "",
    characterType: "NPC",
    race: "",
    class: "",
    background: "",
    alignment: "",
    gender: "",
    age: "",
    appearance: "",
    personality: "",
    motivation: "",
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      hitPoints: { current: 10, max: 10, temp: 0 },
      manaPoints: { current: 0, max: 0 },
      armorClass: 10,
      speed: 30,
      level: 1,
      experience: 0,
      proficiencyBonus: 2,
    },
    skills: [],
    equipment: [],
    progression: [],
    traits: [],
    relationships: [],
    imageUrl: "",
    customFields: [],
    statuses: [],
    notes: "",
  };

  // フォーム入力用の状態
  const [formData, setFormData] = useState<TRPGCharacter>({
    ...(initialCharacterState as TRPGCharacter),
  });
  const [newTrait, setNewTrait] = useState("");
  const [newCustomField, setNewCustomField] = useState<CustomField>({
    id: "",
    name: "",
    value: "",
  });

  // プロジェクト（キャンペーン）からキャラクターを読み込む
  useEffect(() => {
    if (currentProject?.characters) {
      const convertedCharacters = currentProject.characters.map((character) => {
        return convertToTRPGCharacter(character as TRPGCharacter);
      });
      setCharacters(convertedCharacters);
    }
  }, [currentProject]);

  // 表示モードの切り替え
  const handleViewModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newMode: "list" | "grid" | null) => {
      if (newMode !== null) {
        setViewMode(newMode);
      }
    },
    []
  );

  // ダイアログを開く（編集）
  const handleEditCharacter = useCallback(
    (character: TRPGCharacter) => {
      // 必須フィールドを確保
      const ensuredCharacter = {
        ...initialCharacterState,
        ...character,
        appearance: character.appearance || "",
        background: character.background || "",
        motivation: character.motivation || "",
        relationships: character.relationships || [],
        traits: character.traits || [],
        customFields: character.customFields || [],
        statuses: character.statuses || [],
        stats: character.stats || initialCharacterState.stats,
        skills: character.skills || [],
        equipment: character.equipment || [],
        progression: character.progression || [],
      };

      setFormData(ensuredCharacter);
      setTempImageUrl(character.imageUrl || "");
      // 画像URLが絵文字データURIの場合は選択絵文字を設定
      if (
        character.imageUrl &&
        character.imageUrl.startsWith("data:text/plain;charset=utf-8,")
      ) {
        const emoji = dataUrlToEmoji(character.imageUrl);
        if (emoji) setSelectedEmoji(emoji);
      } else {
        setSelectedEmoji("");
      }
      setFormErrors({});
      setEditMode(true);
      setOpenDialog(true);
      setHasUnsavedChanges(false);
    },
    [initialCharacterState]
  );

  // ダイアログを開く（新規作成）
  const handleOpenDialog = useCallback((characterId?: string) => {
    // characterIdが渡された場合は既存キャラクターを編集
    if (characterId) {
      const character = characters.find(c => c.id === characterId);
      if (character) {
        handleEditCharacter(character);
        return;
      }
    }
    
    // 新規作成の場合
    setFormData({
      ...(initialCharacterState as TRPGCharacter),
      id: uuidv4(),
      statuses: [],
    });
    setTempImageUrl("");
    setSelectedEmoji("");
    setFormErrors({});
    setEditMode(false);
    setOpenDialog(true);
    setHasUnsavedChanges(false);
  }, [initialCharacterState, characters, handleEditCharacter]);

  // ダイアログを閉じる
  const handleCloseDialog = useCallback(() => {
    if (hasUnsavedChanges) {
      // 未保存の変更がある場合の処理（警告表示など）
      const confirm = window.confirm(
        "未保存の変更があります。破棄してもよろしいですか？"
      );
      if (!confirm) return;
    }
    setOpenDialog(false);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  // 画像アップロード処理
  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({
          ...formErrors,
          image: "画像サイズは5MB以下にしてください",
        });
        return;
      }

      // 画像のプレビューURLを作成
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTempImageUrl(result);
        setFormData({ ...formData, imageUrl: result });
        setSelectedEmoji(""); // 画像がアップロードされたら絵文字選択をクリア
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    },
    [formData, formErrors]
  );

  // 絵文字を選択
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const emojiDataUrl = emojiToDataUrl(emoji);
      setSelectedEmoji(emoji);
      setTempImageUrl(""); // 絵文字が選択されたら画像をクリア
      setFormData({ ...formData, imageUrl: emojiDataUrl });
      setHasUnsavedChanges(true);
    },
    [formData]
  );

  // 入力フィールドの変更処理
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      // エラーがあれば消去
      if (formErrors[name]) {
        setFormErrors({ ...formErrors, [name]: "" });
      }
      setHasUnsavedChanges(true);
    },
    [formData, formErrors]
  );

  // セレクトフィールドの変更処理
  const handleSelectChange = useCallback(
    (e: { target: { name: string; value: string } }) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      setHasUnsavedChanges(true);
    },
    [formData]
  );

  // 特性の追加
  const handleAddTrait = useCallback(() => {
    if (!newTrait.trim()) return;
    const traits = formData.traits || [];
    const newCharacterTrait: CharacterTrait = {
      id: uuidv4(),
      name: newTrait.trim(),
      value: "",
    };
    const updatedTraits = [...traits, newCharacterTrait];
    setFormData({ ...formData, traits: updatedTraits });
    setNewTrait("");
    setHasUnsavedChanges(true);
  }, [newTrait, formData]);

  // 特性の削除
  const handleRemoveTrait = useCallback(
    (index: number) => {
      const traits = formData.traits || [];
      const updatedTraits = traits.filter((_, i) => i !== index);
      setFormData({ ...formData, traits: updatedTraits });
      setHasUnsavedChanges(true);
    },
    [formData]
  );

  // カスタムフィールドの入力処理
  const handleCustomFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewCustomField({ ...newCustomField, [name]: value });
    },
    [newCustomField]
  );

  // カスタムフィールドの追加
  const handleAddCustomField = useCallback(() => {
    if (!newCustomField.name.trim()) return;

    const customFields = formData.customFields || [];
    const updatedCustomFields = [
      ...customFields,
      { ...newCustomField, id: uuidv4() },
    ];

    setFormData({ ...formData, customFields: updatedCustomFields });
    setNewCustomField({ id: "", name: "", value: "" });
    setHasUnsavedChanges(true);
  }, [formData, newCustomField]);

  // カスタムフィールドの削除
  const handleRemoveCustomField = useCallback(
    (id: string) => {
      const customFields = formData.customFields || [];
      const updatedCustomFields = customFields.filter(
        (field) => field.id !== id
      );
      setFormData({ ...formData, customFields: updatedCustomFields });
      setHasUnsavedChanges(true);
    },
    [formData]
  );

  // キャラクターの削除
  const handleDeleteCharacter = useCallback(
    (id: string) => {
      const confirm = window.confirm(
        "このキャラクターを削除してもよろしいですか？"
      );
      if (!confirm) return;

      const updatedCharacters = characters.filter(
        (character) => character.id !== id
      );
      setCharacters(updatedCharacters);

      // Recoilの状態も更新
      if (currentProject) {
        // TRPGCampaignの型に合わせてキャラクターを変換
        const indexCharacters = updatedCharacters.map(convertToIndexCharacter);

        // 明示的にunknownを介して型変換
        const updatedProject = {
          ...currentProject,
          characters: indexCharacters,
          updatedAt: new Date(),
        } as unknown as TRPGCampaign;

        setCurrentProject(updatedProject);

        setSnackbarMessage("キャラクターを削除しました");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    },
    [characters, currentProject, setCurrentProject]
  );

  // フォームのバリデーション
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "名前は必須です";
    }

    if (!formData.characterType) {
      errors.characterType = "キャラクタータイプは必須です";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // キャラクターの保存
  const handleSaveCharacter = useCallback(async () => {
    // バリデーション
    if (!validateForm() || !currentProject) return;

    const characterToSave: TRPGCharacter = {
      ...formData,
      statuses: formData.statuses || [],
    };

    const updatedCharacters = editMode
      ? characters.map((char) =>
          char.id === characterToSave.id ? characterToSave : char
        )
      : [...characters, characterToSave];

    // currentProject に含まれる definedCharacterStatuses も含めて更新
    const updatedProjectData = {
      ...currentProject,
      characters: updatedCharacters,
      updatedAt: new Date(),
    };

    // ここで unknown を介さずに直接 TRPGCampaign 型を指定（型が一致している前提）
    const updatedProject: TRPGCampaign = updatedProjectData;

    setCurrentProject(updatedProject);

    // ローカルストレージにも保存
    const projectsStr = localStorage.getItem("trpgCampaigns");
    if (projectsStr) {
      try {
        // JSON.parseのエラーハンドリング追加
        const projects = JSON.parse(projectsStr) as TRPGCampaign[];
        const projectIndex = projects.findIndex(
          (p) => p.id === currentProject.id
        );
        if (projectIndex !== -1) {
          projects[projectIndex] = updatedProject;
          localStorage.setItem("trpgCampaigns", JSON.stringify(projects));
        }
      } catch (e) {
        console.error(
          "Failed to parse or save TRPG campaigns to local storage",
          e
        );
        // エラー通知などを検討
      }
    }

    // ダイアログを閉じる
    setOpenDialog(false);
    setHasUnsavedChanges(false);

    // フォームをリセット
    setFormData({ ...(initialCharacterState as TRPGCharacter) });
    setTempImageUrl("");
    setSelectedEmoji("");

    // 成功メッセージを表示
    setSnackbarMessage(
      editMode
        ? "キャラクターを更新しました"
        : "新しいキャラクターを作成しました"
    );
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  }, [
    currentProject,
    characters,
    editMode,
    formData,
    setCurrentProject,
    validateForm,
    initialCharacterState,
  ]);

  // スナックバーを閉じる
  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  // 新しい特性の入力処理
  const handleNewTraitChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTrait(e.target.value);
    },
    []
  );

  // 状態管理ハンドラ
  const handleSaveStatus = useCallback(
    (statusToSave: CharacterStatus) => {
      // 1. formData の statuses を更新
      setFormData((prev) => {
        const existingStatusIndex = (prev.statuses || []).findIndex(
          (s) => s.id === statusToSave.id
        );
        const newStatuses = [...(prev.statuses || [])];
        if (existingStatusIndex > -1) {
          newStatuses[existingStatusIndex] = statusToSave;
        } else {
          newStatuses.push(statusToSave);
        }
        return { ...prev, statuses: newStatuses };
      });

      // 2. currentProject の definedCharacterStatuses を更新
      setCurrentProject((prevProject) => {
        if (!prevProject) return prevProject; // プロジェクトがない場合は何もしない

        const definedStatuses = [
          ...(prevProject.definedCharacterStatuses || []),
        ];
        const existingDefinedIndex = definedStatuses.findIndex(
          (s) => s.id === statusToSave.id
        );

        if (existingDefinedIndex > -1) {
          // 既存の定義を更新
          definedStatuses[existingDefinedIndex] = statusToSave;
        } else {
          // 新しい定義を追加
          definedStatuses.push(statusToSave);
        }

        // プロジェクトの更新日時も変更
        return {
          ...prevProject,
          definedCharacterStatuses: definedStatuses,
          updatedAt: new Date(),
        };
      });

      setHasUnsavedChanges(true);
      // 注意: setCurrentProject は非同期の場合があるため、即時反映が必要なら useEffect などで監視が必要になる可能性
      // ここでの変更は最終的に handleSaveCharacter でローカルストレージに保存される想定
    },
    [setCurrentProject]
  ); // 依存配列に setCurrentProject を追加

  const handleDeleteStatus = useCallback((statusId: string) => {
    // formData から削除
    setFormData((prev) => ({
      ...prev,
      statuses: (prev.statuses || []).filter((s) => s.id !== statusId),
    }));

    // TODO: definedCharacterStatuses からの削除ロジック (今回はスキップ)
    // 必要なら、他のキャラクターやタイムラインイベントで使用されていないかチェックしてから削除する
    // setCurrentProject(prevProject => { ... });

    setHasUnsavedChanges(true);
  }, []);
  // --- 状態管理ハンドラ 変更ここまで ---

  // キャラクター即時追加
  const addCharacter = useCallback(
    (character: TRPGCharacter) => {
      try {
        console.log("キャラクター追加:", character.name); // デバッグ用

        // IDが指定されているかを確認
        if (!character.id) {
          character.id = uuidv4(); // IDがなければ新しいIDを生成
        }

        // 関数型の更新を使用して最新のcharacters状態を取得
        setCharacters((prevCharacters) => {
          // IDでキャラクターを検索（同じIDなら上書き）
          const existingIndex = prevCharacters.findIndex(
            (c) => c.id === character.id
          );

          let updatedCharacters: TRPGCharacter[];
          if (existingIndex >= 0) {
            // 既存のキャラクターを更新
            updatedCharacters = [...prevCharacters];
            updatedCharacters[existingIndex] = {
              ...character,
              // IDはそのまま保持
            };
            console.log("既存キャラクターを更新:", character.name);
          } else {
            // 新しいキャラクターとして追加（同名でもIDが異なれば追加）
            updatedCharacters = [...prevCharacters, character];
            console.log("新規キャラクターを追加:", character.name);
          }

          // プロジェクトの更新を次のレンダリングサイクルに遅延
          setTimeout(() => {
            setCurrentProject((prevProject) => {
              if (!prevProject) return prevProject;

              const updatedProject = {
                ...prevProject,
                characters: updatedCharacters,
                updatedAt: new Date(),
              };

              // ローカルストレージも更新
              const projectsStr = localStorage.getItem("trpgCampaigns");
              if (projectsStr) {
                try {
                  const projects = JSON.parse(projectsStr) as Array<{
                    id: string;
                    [key: string]: unknown;
                  }>;
                  const projectIndex = projects.findIndex(
                    (p) => p.id === prevProject.id
                  );
                  if (projectIndex !== -1) {
                    projects[projectIndex] = updatedProject;
                    localStorage.setItem(
                      "trpgCampaigns",
                      JSON.stringify(projects)
                    );
                  }
                } catch (e) {
                  console.error("Failed to update local storage projects", e);
                }
              }

              return updatedProject;
            });
          }, 0);

          const message =
            existingIndex >= 0
              ? `キャラクター「${character.name}」を更新しました`
              : `AI生成キャラクター「${character.name}」を追加しました`;

          setSnackbarMessage(message);
          setSnackbarSeverity("success");
          setSnackbarOpen(true);

          return updatedCharacters;
        });
      } catch (error) {
        console.error("キャラクター追加/更新エラー:", error);
        setSnackbarMessage("キャラクターの追加に失敗しました");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    },
    [setCurrentProject] // charactersを依存配列から削除
  );

  // AI応答からキャラクターを解析する関数
  const parseAIResponseToCharacters = useCallback((response: string): TRPGCharacter[] => {
    try {
      // JSONオブジェクトの配列として解析を試行
      if (response.trim().startsWith('[')) {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => convertToTRPGCharacter({
            id: item.id || uuidv4(),
            name: item.name || "未設定",
            characterType: item.characterType || "NPC",
            race: item.race || "",
            class: item.class || "",
            background: item.background || "",
            alignment: item.alignment || "",
            gender: item.gender || "",
            age: item.age || "",
            appearance: item.appearance || item.description || "",
            personality: item.personality || "",
            motivation: item.motivation || "",
            stats: item.stats || initialCharacterState.stats!,
            skills: item.skills || [],
            equipment: item.equipment || [],
            progression: item.progression || [],
            traits: item.traits || [],
            relationships: item.relationships || [],
            imageUrl: item.imageUrl || "",
            customFields: item.customFields || [],
            statuses: item.statuses || [],
            notes: item.notes || "",
          }));
        }
      }
      
      // テキスト形式の解析（行ベース）
      const lines = response.split('\n').filter(line => line.trim());
      const characters: TRPGCharacter[] = [];
      let currentCharacter: Partial<TRPGCharacter> | null = null;
      
      for (const line of lines) {
        if (line.includes('名前:') || line.includes('キャラクター名:')) {
          // 前のキャラクターを保存
          if (currentCharacter && currentCharacter.name) {
            characters.push(convertToTRPGCharacter({
              ...initialCharacterState,
              ...currentCharacter,
              id: uuidv4(),
            } as TRPGCharacter));
          }
          // 新しいキャラクター開始
          currentCharacter = {
            name: line.split(':')[1]?.trim() || "未設定",
            characterType: "NPC",
          };
        } else if (currentCharacter) {
          // キャラクター情報の解析
          if (line.includes('種族:')) {
            currentCharacter.race = line.split(':')[1]?.trim();
          } else if (line.includes('クラス:') || line.includes('職業:')) {
            currentCharacter.class = line.split(':')[1]?.trim();
          } else if (line.includes('性別:')) {
            currentCharacter.gender = line.split(':')[1]?.trim();
          } else if (line.includes('年齢:')) {
            currentCharacter.age = line.split(':')[1]?.trim();
          } else if (line.includes('外見:') || line.includes('容姿:')) {
            currentCharacter.appearance = line.split(':')[1]?.trim();
          } else if (line.includes('性格:')) {
            currentCharacter.personality = line.split(':')[1]?.trim();
          } else if (line.includes('動機:') || line.includes('目標:')) {
            currentCharacter.motivation = line.split(':')[1]?.trim();
          } else if (line.includes('背景:') || line.includes('経歴:')) {
            currentCharacter.background = line.split(':')[1]?.trim();
          }
        }
      }
      
      // 最後のキャラクターを保存
      if (currentCharacter && currentCharacter.name) {
        characters.push(convertToTRPGCharacter({
          ...initialCharacterState,
          ...currentCharacter,
          id: uuidv4(),
        } as TRPGCharacter));
      }
      
      return characters;
    } catch (error) {
      console.error('AI応答の解析エラー:', error);
      return [];
    }
  }, [initialCharacterState]);

  // PC/NPCフィルタリング関数
  const getPCs = useCallback(() => {
    return characters.filter(c => c.characterType === 'PC');
  }, [characters]);

  const getNPCs = useCallback(() => {
    return characters.filter(c => c.characterType === 'NPC');
  }, [characters]);

  const getEnemies = useCallback(() => {
    return characters.filter(c => c.characterType === 'Enemy');
  }, [characters]);

  return {
    characters,
    viewMode,
    openDialog,
    editMode,
    formData,
    formErrors,
    tempImageUrl,
    selectedEmoji,
    newTrait,
    newCustomField,
    hasUnsavedChanges,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    currentProject,
    handleViewModeChange,
    handleOpenDialog,
    handleEditCharacter,
    handleCloseDialog,
    handleImageUpload,
    handleEmojiSelect,
    handleInputChange,
    handleSelectChange,
    handleAddTrait,
    handleRemoveTrait,
    handleNewTraitChange,
    handleCustomFieldChange,
    handleAddCustomField,
    handleRemoveCustomField,
    handleSaveCharacter,
    handleDeleteCharacter,
    handleCloseSnackbar,
    handleSaveStatus,
    handleDeleteStatus,
    emojiToDataUrl,
    dataUrlToEmoji,
    setFormData,
    addCharacter,
    parseAIResponseToCharacters,
    getPCs,
    getNPCs,
    getEnemies,
  };
}
