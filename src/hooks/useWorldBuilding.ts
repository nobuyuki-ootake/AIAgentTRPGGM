import React, { useState, useEffect, useCallback } from "react";
import { useRecoilState } from "recoil";
import { currentProjectState } from "../store/atoms";
import {
  WorldBuilding,
  PlaceElement,
  CultureElement,
  FreeFieldElement,
  NovelProject,
  RuleElement,
} from "../types/index";
import { v4 as uuidv4 } from "uuid";

export function useWorldBuilding() {
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);
  const [worldBuilding, setWorldBuilding] = useState<WorldBuilding | null>(
    null
  );
  const [tabValue, setTabValue] = useState(0);
  const [mapImageUrl, setMapImageUrl] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [history, setHistory] = useState<string>("");
  const [rules, setRules] = useState<RuleElement[]>([]);
  const [newRule, setNewRule] = useState<RuleElement | null>(null);
  const [places, setPlaces] = useState<PlaceElement[]>([]);
  const [cultures, setCultures] = useState<CultureElement[]>([]);
  const [freeFields, setFreeFields] = useState<FreeFieldElement[]>([]);
  const [newFreeField, setNewFreeField] = useState<FreeFieldElement>({
    id: "",
    title: "",
    description: "",
    content: "",
    type: "free_field",
    originalType: "free_field",
    features: "",
    importance: "不明",
    relations: "",
  });
  const [isEditingFreeField, setIsEditingFreeField] = useState<boolean>(false);
  const [currentFreeFieldId, setCurrentFreeFieldId] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newPlace, setNewPlace] = useState<PlaceElement>({
    id: uuidv4(),
    name: "",
    type: "place",
    originalType: "place",
    description: "",
    features: "",
    importance: "不明",
    relations: "",
    location: "",
    population: "",
    culturalFeatures: "",
  });
  const [isEditingPlace, setIsEditingPlace] = useState<boolean>(false);
  const [currentPlaceId, setCurrentPlaceId] = useState<string>("");

  // 社会と文化のタブの状態
  const [socialStructure, setSocialStructure] = useState<string>("");
  const [government, setGovernment] = useState<string>("");
  const [economy, setEconomy] = useState<string>("");
  const [religion, setReligion] = useState<string>("");
  const [traditions, setTraditions] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [art, setArt] = useState<string>("");
  const [education, setEducation] = useState<string>("");
  const [technology, setTechnology] = useState<string>("");

  // 地理と環境のタブの状態
  const [geography, setGeography] = useState<string>("");
  const [climate, setClimate] = useState<string>("");
  const [flora, setFlora] = useState<string>("");
  const [fauna, setFauna] = useState<string>("");
  const [resources, setResources] = useState<string>("");
  const [settlements, setSettlements] = useState<string>("");
  const [naturalDisasters, setNaturalDisasters] = useState<string>("");
  const [seasonalChanges, setSeasonalChanges] = useState<string>("");

  // 歴史と伝説のタブの状態
  const [historicalEvents, setHistoricalEvents] = useState<string>("");
  const [ancientCivilizations, setAncientCivilizations] = useState<string>("");
  const [myths, setMyths] = useState<string>("");
  const [legends, setLegends] = useState<string>("");
  const [folklore, setFolklore] = useState<string>("");
  const [religions, setReligions] = useState<string>("");
  const [historicalFigures, setHistoricalFigures] = useState<string>("");
  const [conflicts, setConflicts] = useState<string>("");

  // 魔法と技術のタブの状態
  const [magicSystem, setMagicSystem] = useState<string>("");
  const [magicRules, setMagicRules] = useState<string>("");
  const [magicUsers, setMagicUsers] = useState<string>("");
  const [artifacts, setArtifacts] = useState<string>("");
  const [technologyLevel, setTechnologyLevel] = useState<string>("");
  const [inventions, setInventions] = useState<string>("");
  const [energySources, setEnergySources] = useState<string>("");
  const [transportation, setTransportation] = useState<string>("");

  // 世界観情報を取得
  useEffect(() => {
    if (currentProject?.worldBuilding) {
      setWorldBuilding(currentProject.worldBuilding);
      setMapImageUrl(currentProject.worldBuilding.mapImageUrl || "");
      setDescription(currentProject.worldBuilding.setting || "");
      setHistory(currentProject.worldBuilding.history || "");
      setRules(currentProject.worldBuilding.rules || []);
      setPlaces(currentProject.worldBuilding.places || []);
      setCultures(currentProject.worldBuilding.cultures || []);
      setFreeFields(currentProject.worldBuilding.freeFields || []);

      // 社会と文化のタブデータをセット
      setSocialStructure(currentProject.worldBuilding.socialStructure || "");
      setGovernment(currentProject.worldBuilding.government || "");
      setEconomy(currentProject.worldBuilding.economy || "");
      setReligion(currentProject.worldBuilding.religion || "");
      setTraditions(currentProject.worldBuilding.traditions || "");
      setLanguage(currentProject.worldBuilding.language || "");
      setArt(currentProject.worldBuilding.art || "");
      setEducation(currentProject.worldBuilding.education || "");
      setTechnology(currentProject.worldBuilding.technology || "");

      // 地理と環境のタブデータをセット
      setGeography(currentProject.worldBuilding.geography || "");
      setClimate(currentProject.worldBuilding.climate || "");
      setFlora(currentProject.worldBuilding.flora || "");
      setFauna(currentProject.worldBuilding.fauna || "");
      setResources(currentProject.worldBuilding.resources || "");
      setSettlements(currentProject.worldBuilding.settlements || "");
      setNaturalDisasters(currentProject.worldBuilding.naturalDisasters || "");
      setSeasonalChanges(currentProject.worldBuilding.seasonalChanges || "");

      // 歴史と伝説のタブデータをセット
      setHistoricalEvents(currentProject.worldBuilding.historicalEvents || "");
      setAncientCivilizations(
        currentProject.worldBuilding.ancientCivilizations || ""
      );
      setMyths(currentProject.worldBuilding.myths || "");
      setLegends(currentProject.worldBuilding.legends || "");
      setFolklore(currentProject.worldBuilding.folklore || "");
      setReligions(currentProject.worldBuilding.religions || "");
      setHistoricalFigures(
        currentProject.worldBuilding.historicalFigures || ""
      );
      setConflicts(currentProject.worldBuilding.conflicts || "");

      // 魔法と技術のタブデータをセット
      setMagicSystem(currentProject.worldBuilding.magicSystem || "");
      setMagicRules(currentProject.worldBuilding.magicRules || "");
      setMagicUsers(currentProject.worldBuilding.magicUsers || "");
      setArtifacts(currentProject.worldBuilding.artifacts || "");
      setTechnologyLevel(currentProject.worldBuilding.technologyLevel || "");
      setInventions(currentProject.worldBuilding.inventions || "");
      setEnergySources(currentProject.worldBuilding.energySources || "");
      setTransportation(currentProject.worldBuilding.transportation || "");
    }
  }, [currentProject]);

  // タブの切り替え
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      if (hasUnsavedChanges) {
        if (
          window.confirm(
            "保存されていない変更があります。タブを切り替えると失われます。続けますか？"
          )
        ) {
          setTabValue(newValue);
        }
      } else {
        setTabValue(newValue);
      }
    },
    [hasUnsavedChanges]
  );

  // ...（以降は元のフック本体のまま）...
}
