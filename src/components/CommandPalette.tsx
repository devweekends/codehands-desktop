import { useState, useEffect } from "react";
import { SearchIcon } from "./Icons";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Settings" | "Views";
  shortcut?: string;
  symbol: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, extra?: string) => void;
  onNewTask: () => void;
  toggleTheme: () => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate, onNewTask, toggleTheme }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: "new-task",
      title: "Create New Task",
      category: "Actions",
      shortcut: "Ctrl+N",
      symbol: "+",
      action: () => {
        onNewTask();
        onClose();
      },
    },
    {
      id: "view-overview",
      title: "Go to Dashboard Overview",
      category: "Navigation",
      shortcut: "G O",
      symbol: "O",
      action: () => {
        onNavigate("overview");
        onClose();
      },
    },
    {
      id: "view-projects",
      title: "Go to Projects",
      category: "Navigation",
      shortcut: "G P",
      symbol: "P",
      action: () => {
        onNavigate("projects");
        onClose();
      },
    },
    {
      id: "view-tasks",
      title: "Go to Task Workspace",
      category: "Navigation",
      shortcut: "G T",
      symbol: "T",
      action: () => {
        onNavigate("tasks");
        onClose();
      },
    },
    {
      id: "view-workflows",
      title: "Open Workflow Builder",
      category: "Views",
      shortcut: "G W",
      symbol: "W",
      action: () => {
        onNavigate("workflows");
        onClose();
      },
    },
    {
      id: "view-review",
      title: "Open Review Queue",
      category: "Views",
      shortcut: "G R",
      symbol: "R",
      action: () => {
        onNavigate("review");
        onClose();
      },
    },
    {
      id: "view-models",
      title: "Models & Routing Hub",
      category: "Views",
      shortcut: "G M",
      symbol: "M",
      action: () => {
        onNavigate("models");
        onClose();
      },
    },
    {
      id: "view-memory",
      title: "Repository Memory",
      category: "Navigation",
      symbol: "D",
      action: () => {
        onNavigate("memory");
        onClose();
      },
    },
    {
      id: "view-analytics",
      title: "Usage & Analytics",
      category: "Navigation",
      symbol: "A",
      action: () => {
        onNavigate("analytics");
        onClose();
      },
    },
    {
      id: "view-settings",
      title: "Open Settings",
      category: "Settings",
      shortcut: "Ctrl+,",
      symbol: "S",
      action: () => {
        onNavigate("settings");
        onClose();
      },
    },
    {
      id: "toggle-theme",
      title: "Toggle Light/Dark Theme",
      category: "Settings",
      symbol: "T",
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filtered, onClose]);

  if (!isOpen) return null;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="palette-input-wrap">
          <SearchIcon size={16} color="#666C7E" />
          <input
            autoFocus
            type="text"
            className="palette-input"
            placeholder="Type a command or navigate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="palette-esc-kbd">Esc</kbd>
        </div>

        <div className="palette-results">
          {filtered.length === 0 ? (
            <div className="palette-empty">No matching commands found.</div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                className={`palette-item ${idx === selectedIndex ? "active" : ""}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className="palette-item-icon">{item.symbol}</span>
                <span className="palette-item-title">{item.title}</span>
                <span className="palette-item-cat">{item.category}</span>
                {item.shortcut && <kbd className="palette-item-shortcut">{item.shortcut}</kbd>}
              </button>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span><kbd>Up</kbd> <kbd>Down</kbd> to navigate</span>
          <span><kbd>Enter</kbd> to select</span>
          <span><kbd>Esc</kbd> to dismiss</span>
        </div>
      </div>
    </div>
  );
}
