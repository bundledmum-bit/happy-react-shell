interface Props {
  activeTab: "active" | "trash";
  onTabChange: (tab: "active" | "trash") => void;
  activeCount: number;
  trashCount: number;
}

export default function TrashTabs({ activeTab, onTabChange, activeCount, trashCount }: Props) {
  return (
    <div className="flex gap-1 mb-4">
      <button onClick={() => onTabChange("active")}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === "active" ? "bg-forest text-primary-foreground" : "border border-border text-text-med"}`}>
        Active ({activeCount})
      </button>
      <button onClick={() => onTabChange("trash")}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === "trash" ? "bg-destructive text-destructive-foreground" : "border border-border text-text-med"}`}>
        🗑️ Trash ({trashCount})
      </button>
    </div>
  );
}
