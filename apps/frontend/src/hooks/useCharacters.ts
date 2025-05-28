import { useState, useEffect, useCallback } from "react";
import { useRecoilState } from "recoil";
import { currentProjectState } from "../store/atoms";
import {
  Character,
  CustomField,
  CharacterTrait,
  Relationship,
  CharacterStatus,
  NovelProject,
} from "@novel-ai-assistant/types";
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

// キャラクター型を変換する関数
const convertToIndexCharacter = (character: Character): Character => {
  // traitsはそのまま
  const traits = character.traits || [];
  // relationshipsもそのまま
  const relationships = character.relationships || [];
  return {
    ...character,
    traits,
    relationships,
  };
};

export function useCharacters() {
  // Recoilの状態
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  // ローカルの状態
  const [characters, setCharacters] = useState<Character[]>([]);
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

  // 新規キャラクター用の初期状態
  const initialCharacterState: Partial<Character> & {
    id: string;
    name: string;
    role: "protagonist" | "antagonist" | "supporting";
  } = {
    id: "",
    name: "",
    role: "supporting",
    gender: "",
    birthDate: "",
    description: "",
    background: "",
    motivation: "",
    traits: [],
    relationships: [],
    imageUrl: "",
    customFields: [],
    statuses: [],
  };

  // フォーム入力用の状態
  const [formData, setFormData] = useState<Character>({
    ...(initialCharacterState as Character),
  });
  const [newTrait, setNewTrait] = useState("");
  const [newCustomField, setNewCustomField] = useState<CustomField>({
    id: "",
    name: "",
    value: "",
  });

  // プロジェクトからキャラクターを読み込む
  useEffect(() => {
    if (currentProject?.characters) {
      // キャラクターデータの互換性を確保
      const convertedCharacters = currentProject.characters.map((character) => {
        // traitsがstring[]の場合はCharacterTrait[]に変換
        const traits = Array.isArray(character.traits)
          ? character.traits.map((trait) => {
              if (typeof trait === "string") {
                return {
                  id: uuidv4(),
                  name: trait,
                  value: "",
                } as CharacterTrait;
              }
              // valueがundefinedの場合は空文字に補正
              return {
                ...trait,
                value: trait.value ?? "",
              } as CharacterTrait;
            })
          : [];
        // relationshipsが旧型の場合はRelationship[]に変換
        const relationships = Array.isArray(character.relationships)
          ? character.relationships.map((rel) => {
              if ("characterId" in rel) {
                return {
                  id: uuidv4(),
                  targetCharacterId: rel.characterId,
                  type:
                    "type" in rel
                      ? rel.type
                      : "relationshipType" in rel
                      ? (rel as { relationshipType?: string })
                          .relationshipType ?? ""
                      : "",
                  description: rel.description || "",
                } as Relationship;
              }
              return rel as Relationship;
            })
          : [];
        return {
          ...character,
          traits,
          relationships,
          statuses: character.statuses || [],
        } as Character;
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

  // ダイアログを開く（新規作成）
  const handleOpenDialog = useCallback(() => {
    setFormData({
      ...(initialCharacterState as Character),
      id: uuidv4(),
      statuses: [],
    });
    setTempImageUrl("");
    setSelectedEmoji("");
    setFormErrors({});
    setEditMode(false);
    setOpenDialog(true);
    setHasUnsavedChanges(false);
  }, [initialCharacterState]);

  // ダイアログを開く（編集）
  const handleEditCharacter = useCallback(
    (character: Character) => {
      // 必須フィールドを確保
      const ensuredCharacter = {
        ...initialCharacterState,
        ...character,
        description: character.description || "",
        background: character.background || "",
        motivation: character.motivation || "",
        relationships: character.relationships || [],
        traits: character.traits || [],
        customFields: character.customFields || [],
        statuses: character.statuses || [],
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
        // NovelProjectの型に合わせてキャラクターを変換
        const indexCharacters = updatedCharacters.map(convertToIndexCharacter);

        // 明示的にunknownを介して型変換
        const updatedProject = {
          ...currentProject,
          characters: indexCharacters,
          updatedAt: new Date(),
        } as unknown as NovelProject;

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

    if (!formData.role) {
      errors.role = "役割は必須です";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // キャラクターの保存
  const handleSaveCharacter = useCallback(async () => {
    // バリデーション
    if (!validateForm() || !currentProject) return;

    const characterToSave: Character = {
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

    // ここで unknown を介さずに直接 NovelProject 型を指定（型が一致している前提）
    const updatedProject: NovelProject = updatedProjectData;

    setCurrentProject(updatedProject);

    // ローカルストレージにも保存
    const projectsStr = localStorage.getItem("novelProjects");
    if (projectsStr) {
      try {
        // JSON.parseのエラーハンドリング追加
        const projects = JSON.parse(projectsStr) as NovelProject[];
        const projectIndex = projects.findIndex(
          (p) => p.id === currentProject.id
        );
        if (projectIndex !== -1) {
          projects[projectIndex] = updatedProject;
          localStorage.setItem("novelProjects", JSON.stringify(projects));
        }
      } catch (e) {
        console.error(
          "Failed to parse or save novel projects to local storage",
          e
        );
        // エラー通知などを検討
      }
    }

    // ダイアログを閉じる
    setOpenDialog(false);
    setHasUnsavedChanges(false);

    // フォームをリセット
    setFormData({ ...(initialCharacterState as Character) });
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
    (character: Character) => {
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

          let updatedCharacters: Character[];
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
              const projectsStr = localStorage.getItem("novelProjects");
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
                      "novelProjects",
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
  };
}
