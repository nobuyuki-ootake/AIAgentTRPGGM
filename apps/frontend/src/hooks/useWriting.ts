import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { createEmptyEditor } from "../utils/editorUtils";
import { currentProjectState } from "../store/atoms";
import {
  Descendant,
  createEditor,
  Editor,
  Transforms,
  Node,
  Point,
  Element as SlateElement,
} from "slate";
import { withReact } from "slate-react";
import {
  Chapter,
  NovelProject,
  TimelineEvent,
} from "@novel-ai-assistant/types";
import { currentChapterSelector } from "../store/selectors";
import { currentChapterIdState } from "../store/atoms";
import { v4 as uuidv4 } from "uuid";
import { withHistory } from "slate-history";
import { ReactEditor } from "slate-react";
import type { CustomElement, CustomText } from "../types/slate";

export const useWriting = () => {
  const { novelId: _novelId } = useParams() as {
    novelId: string;
  };

  const [editorKey, setEditorKey] = useState(0); // エディタの強制再レンダリング用
  const editor = useMemo(
    () => withHistory(withReact(createEditor())),
    [editorKey]
  );
  const editorRef = useRef<Editor>(editor);

  // エディタインスタンスが変更されたときにrefを更新
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const [editorValue, setEditorValue] = useState<Descendant[]>(
    createEmptyEditor() as Descendant[]
  );
  const currentChapter = useRecoilValue(currentChapterSelector);
  const [currentChapterId, setCurrentChapterId] = useRecoilState(
    currentChapterIdState
  );
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  const [newChapterDialogOpen, setNewChapterDialogOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterSynopsis, setNewChapterSynopsis] = useState("");

  const [assignEventsDialogOpen, setAssignEventsDialogOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [eventDetailDialogOpen, setEventDetailDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [currentPageInEditor, setCurrentPageInEditor] = useState(1);
  const [totalPagesInEditor, setTotalPagesInEditor] = useState(1);

  const timelineEvents: TimelineEvent[] = currentProject?.timeline || [];

  useEffect(() => {
    console.log("Current project timeline:", currentProject?.timeline);
    console.log("Timeline events in useWriting:", timelineEvents);
  }, [currentProject?.timeline]);

  useEffect(() => {
    console.log("=== currentProject changed ===");
    console.log("New currentProject:", currentProject);
    if (currentProject && currentChapterId) {
      const chapter = currentProject.chapters.find(
        (ch) => ch.id === currentChapterId
      );
      console.log("Chapter found in updated project:", chapter);
    }
  }, [currentProject, currentChapterId]);

  const selectedEvent: TimelineEvent | null =
    currentProject?.timeline?.find((event) => event.id === selectedEventId) ||
    null;

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      let pageBreakCount = 0;
      for (const [node] of Node.nodes(editor)) {
        if (
          SlateElement.isElement(node) &&
          (node as CustomElement).type === "page-break"
        ) {
          pageBreakCount++;
        }
      }
      setTotalPagesInEditor(pageBreakCount + 1);
    }
  }, [editorValue]);

  useEffect(() => {
    if (currentChapter) {
      console.log(
        `useWriting useEffect (triggered by currentChapterId change): Initializing for chapter ${currentChapter.id} (${currentChapter.title}). currentChapterId state: ${currentChapterId}`
      );
      console.log("Chapter content to load:", currentChapter.content);

      // React stateを更新
      setEditorValue(currentChapter.content);
      setCurrentPageInEditor(1);

      // エディタを再作成して新しい内容を表示
      setEditorKey((prev) => prev + 1);

      console.log("Chapter content loaded and editor recreated");
    } else {
      const emptyContent = createEmptyEditor() as Descendant[];
      setEditorValue(emptyContent);
      setCurrentPageInEditor(1);
      setTotalPagesInEditor(1);

      // エディタを再作成
      setEditorKey((prev) => prev + 1);

      console.log("Editor reset to empty content and recreated");

      if (currentChapterId) {
        console.log(
          `useWriting useEffect: No current chapter found for ID ${currentChapterId}, resetting editor.`
        );
      } else {
        console.log(
          "useWriting useEffect: No current chapter ID, resetting editor."
        );
      }
    }
  }, [currentChapterId, currentChapter]);

  const updateCurrentPageFromSelection = useCallback(() => {
    if (editorRef.current && editorRef.current.selection) {
      const editor = editorRef.current;
      const { selection } = editor;
      if (!selection) {
        return;
      }
      let breaksBeforeCursor = 0;
      for (const [node, path] of Node.nodes(editor)) {
        if (
          SlateElement.isElement(node) &&
          (node as CustomElement).type === "page-break"
        ) {
          const pageBreakStartPoint = Editor.start(editor, path);
          if (Point.isBefore(pageBreakStartPoint, selection.anchor)) {
            breaksBeforeCursor++;
          } else {
            break;
          }
        }
      }
      setCurrentPageInEditor(breaksBeforeCursor + 1);
    }
  }, [editorRef, setCurrentPageInEditor]);

  const handleEditorChange = (value: Descendant[]) => {
    setEditorValue(value);
    updateCurrentPageFromSelection();
  };

  const handleChapterSelect = (chapterId: string) => {
    setCurrentChapterId(chapterId);
    console.log(
      `useWriting handleChapterSelect: chapterId set to: ${chapterId}`
    );
  };

  const handleOpenNewChapterDialog = () => {
    setNewChapterTitle("");
    setNewChapterSynopsis("");
    setNewChapterDialogOpen(true);
  };

  const handleCloseNewChapterDialog = () => {
    setNewChapterDialogOpen(false);
  };

  const handleCreateChapter = () => {
    if (!currentProject || !newChapterTitle.trim()) return;
    const newOrder =
      currentProject.chapters.length > 0
        ? Math.max(...currentProject.chapters.map((ch) => ch.order)) + 1
        : 1;
    const newChapter: Chapter = {
      id: uuidv4(),
      title: newChapterTitle.trim(),
      synopsis: newChapterSynopsis.trim(),
      content: createEmptyEditor() as Descendant[],
      order: newOrder,
      scenes: [],
      relatedEvents: [],
      manuscriptPages: [""],
    };
    const updatedProject = {
      ...currentProject,
      chapters: [...currentProject.chapters, newChapter],
      updatedAt: new Date(),
    };
    setCurrentProject(updatedProject);
    setCurrentChapterId(newChapter.id);
    saveProject(updatedProject);
    handleCloseNewChapterDialog();
  };

  const handleOpenAssignEventsDialog = () => {
    if (!currentChapter) return;
    setSelectedEvents(currentChapter.relatedEvents || []);
    setAssignEventsDialogOpen(true);
  };

  const handleCloseAssignEventsDialog = () => {
    setAssignEventsDialogOpen(false);
  };

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleAssignEvents = () => {
    if (!currentProject || !currentChapter) return;
    const updatedChapters = currentProject.chapters.map((chapter) =>
      chapter.id === currentChapter.id
        ? { ...chapter, relatedEvents: selectedEvents }
        : chapter
    );
    const updatedProject = {
      ...currentProject,
      chapters: updatedChapters,
      updatedAt: new Date(),
    };
    setCurrentProject(updatedProject);
    saveProject(updatedProject);
    handleCloseAssignEventsDialog();
  };

  const handleOpenEventDetailDialog = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventDetailDialogOpen(true);
  };

  const handleCloseEventDetailDialog = () => {
    setEventDetailDialogOpen(false);
    setSelectedEventId(null);
  };

  const saveProject = useCallback((project: NovelProject) => {
    console.log("=== saveProject called ===");
    console.log("Project to save:", project);

    const projectsStr = localStorage.getItem("novelProjects");
    console.log("Current localStorage novelProjects:", projectsStr);

    if (projectsStr) {
      const projects = JSON.parse(projectsStr);
      console.log("Parsed projects from localStorage:", projects);

      const updatedProjects = projects.map((p: NovelProject) =>
        p.id === project.id ? project : p
      );

      console.log("Updated projects array:", updatedProjects);

      localStorage.setItem("novelProjects", JSON.stringify(updatedProjects));
      console.log("Saved to localStorage successfully");
    } else {
      console.log("No existing projects in localStorage");
    }
  }, []);

  const handleAddPageBreak = useCallback(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const pageBreakNode: CustomElement = {
        type: "page-break",
        children: [{ text: "" } as CustomText],
      };
      Transforms.insertNodes(editor, pageBreakNode as unknown as Node);
      Transforms.move(editor);
      ReactEditor.focus(editor);
    }
  }, [editorRef]);

  const handleSaveContent = useCallback(() => {
    console.log("=== handleSaveContent called ===");
    console.log("currentChapter:", currentChapter);
    console.log("currentProject:", currentProject);
    console.log("currentChapterId:", currentChapterId);
    console.log("editorValue:", editorValue);

    if (!currentChapterId || !currentProject) {
      console.log("Early return: missing currentChapterId or currentProject");
      return;
    }

    console.log(
      "Before update - currentProject.chapters:",
      currentProject.chapters
    );
    console.log("Target chapter ID:", currentChapterId);

    const updatedChapters = currentProject.chapters.map((chapter) => {
      if (chapter.id === currentChapterId) {
        console.log(
          "Updating chapter:",
          chapter.id,
          "with new content:",
          editorValue
        );
        return { ...chapter, content: editorValue };
      }
      return chapter;
    });

    console.log("After update - updatedChapters:", updatedChapters);

    const updatedProject = {
      ...currentProject,
      chapters: updatedChapters,
      updatedAt: new Date(),
    };

    console.log("Final updatedProject:", updatedProject);

    setCurrentProject(updatedProject);
    saveProject(updatedProject);
    console.log("Content saved - setCurrentProject and saveProject called");
  }, [
    currentChapterId,
    currentProject,
    editorValue,
    saveProject,
    setCurrentProject,
  ]);

  const handleAddEventToChapter = (eventId: string) => {
    if (!currentProject || !currentChapter) return;
    const updatedChapters = currentProject.chapters.map((chapter) =>
      chapter.id === currentChapter.id
        ? {
            ...chapter,
            relatedEvents: [...(chapter.relatedEvents || []), eventId],
          }
        : chapter
    );
    const updatedProject = {
      ...currentProject,
      chapters: updatedChapters,
      updatedAt: new Date(),
    };
    setCurrentProject(updatedProject);
    saveProject(updatedProject);
  };

  const handleRemoveEventFromChapter = (eventId: string) => {
    if (!currentProject || !currentChapter) return;
    const updatedChapters = currentProject.chapters.map((chapter) =>
      chapter.id === currentChapter.id
        ? {
            ...chapter,
            relatedEvents: chapter.relatedEvents?.filter(
              (id) => id !== eventId
            ),
          }
        : chapter
    );
    const updatedProject = {
      ...currentProject,
      chapters: updatedChapters,
      updatedAt: new Date(),
    };
    setCurrentProject(updatedProject);
    saveProject(updatedProject);
  };

  const handleAddNewEvent = useCallback(
    (newEvent: TimelineEvent) => {
      if (!currentProject) return;
      const updatedProject = {
        ...currentProject,
        timeline: [...(currentProject.timeline || []), newEvent],
        updatedAt: new Date(),
      };
      setCurrentProject(updatedProject);
      saveProject(updatedProject);
    },
    [currentProject, setCurrentProject, saveProject]
  );

  const navigateToPage = useCallback(
    (pageNumber: number) => {
      console.log(`navigateToPage called with pageNumber: ${pageNumber}`);
      if (editorRef.current) {
        const editor = editorRef.current;
        console.log(`  totalPagesInEditor: ${totalPagesInEditor}`);

        if (pageNumber <= 0) pageNumber = 1;
        if (pageNumber > totalPagesInEditor) pageNumber = totalPagesInEditor;
        console.log(`  normalized pageNumber: ${pageNumber}`);

        if (pageNumber === 1) {
          console.log("  Navigating to page 1 (start of editor)");
          Transforms.select(editor, Editor.start(editor, []));
        } else {
          let count = 1;
          let foundPage = false;
          for (const [node, path] of Node.nodes(editor)) {
            console.log(
              `  Iterating nodes: path=${JSON.stringify(path)}, node type=${
                SlateElement.isElement(node)
                  ? (node as CustomElement).type
                  : "text"
              }`
            );
            if (
              SlateElement.isElement(node) &&
              (node as CustomElement).type === "page-break"
            ) {
              count++;
              console.log(
                `    Found page-break, incrementing count to: ${count}`
              );
              if (count === pageNumber) {
                const pointAfterPageBreak = Editor.after(editor, path);
                if (pointAfterPageBreak) {
                  console.log(
                    `    Navigating to page ${pageNumber}, point: ${JSON.stringify(
                      pointAfterPageBreak
                    )}`
                  );
                  Transforms.select(editor, pointAfterPageBreak);
                  foundPage = true;
                } else {
                  console.warn(
                    `    Could not find point after page-break for page ${pageNumber}`
                  );
                }
                break;
              }
            }
          }
          if (!foundPage && count < pageNumber) {
            console.warn(
              `    Could not find page ${pageNumber}. Max pages found: ${count}`
            );
          }
        }
        setCurrentPageInEditor(pageNumber);
        ReactEditor.focus(editor);
      } else {
        console.warn("navigateToPage: editorRef.current is null");
      }
    },
    [editorRef, totalPagesInEditor, setCurrentPageInEditor]
  );

  const handlePreviousPageInEditor = useCallback(() => {
    if (currentPageInEditor > 1) {
      navigateToPage(currentPageInEditor - 1);
    }
  }, [currentPageInEditor, navigateToPage]);

  const handleNextPageInEditor = useCallback(() => {
    if (currentPageInEditor < totalPagesInEditor) {
      navigateToPage(currentPageInEditor + 1);
    }
  }, [currentPageInEditor, totalPagesInEditor, navigateToPage]);

  return {
    editorValue,
    currentChapter,
    currentProject,
    currentChapterId,
    timelineEvents,
    newChapterDialogOpen,
    newChapterTitle,
    newChapterSynopsis,
    assignEventsDialogOpen,
    selectedEvents,
    eventDetailDialogOpen,
    selectedEvent,
    handleEditorChange,
    handleChapterSelect,
    handleOpenNewChapterDialog,
    handleCloseNewChapterDialog,
    handleCreateChapter,
    setNewChapterTitle,
    setNewChapterSynopsis,
    handleOpenAssignEventsDialog,
    handleCloseAssignEventsDialog,
    handleToggleEvent,
    handleAssignEvents,
    handleOpenEventDetailDialog,
    handleCloseEventDetailDialog,
    handleSaveContent,
    handleAddEventToChapter,
    handleRemoveEventFromChapter,
    handleAddNewEvent,
    currentPageInEditor,
    totalPagesInEditor,
    handleAddPageBreak,
    handlePreviousPageInEditor,
    handleNextPageInEditor,
    updateCurrentPageFromSelection,
    editorRef,
    editorKey,
  };
};
