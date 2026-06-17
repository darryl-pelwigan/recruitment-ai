import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";
import { useAuthStore } from "../store/authStore";
import Navbar from "../components/Navbar";

const API_BASE = "http://127.0.0.1:8000";

const STAGES = [
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
] as const;

type StageValue = (typeof STAGES)[number]["value"];

const DOT: Record<string, string> = {
  applied: "bg-blue-500",
  under_review: "bg-amber-500",
  shortlisted: "bg-teal-500",
  interview_scheduled: "bg-purple-500",
  rejected: "bg-red-500",
  hired: "bg-emerald-500",
};

const BADGE: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  under_review: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  shortlisted: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  interview_scheduled: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  hired: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const HISTORY_TEXT: Record<string, string> = {
  applied: "text-blue-700 dark:text-blue-400",
  under_review: "text-amber-700 dark:text-amber-400",
  shortlisted: "text-teal-700 dark:text-teal-400",
  interview_scheduled: "text-purple-700 dark:text-purple-400",
  rejected: "text-red-700 dark:text-red-400",
  hired: "text-emerald-700 dark:text-emerald-400",
};

interface AppCard {
  id: number;
  status: string;
  resume_url: string | null;
  cover_letter: string | null;
  created_at: string;
  ai_score: number;
  user: { id: number; full_name: string; email: string; avatar_url: string | null };
  job: { id: number; title: string; company_name: string | null };
}

interface Note {
  id: number;
  content: string;
  author: { id: number; full_name: string; avatar_url: string | null };
  created_at: string;
}

interface HistoryEntry {
  id: number;
  from_status: string | null;
  to_status: string;
  changed_by: { id: number; full_name: string; avatar_url: string | null };
  changed_at: string;
}

function stageLabel(val: string) {
  return STAGES.find((s) => s.value === val)?.label ?? val;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Avatar({
  name,
  avatarUrl,
  size = 8,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const src = avatarUrl ? `${API_BASE}${avatarUrl}` : null;
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
          {initials(name)}
        </span>
      )}
    </div>
  );
}

export default function Pipeline() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const emptyColumns = () => {
    const c: Record<string, AppCard[]> = {};
    STAGES.forEach((s) => { c[s.value] = []; });
    return c;
  };

  const [columns, setColumns] = useState<Record<string, AppCard[]>>(emptyColumns);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // Drag state
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingFromStatus, setDraggingFromStatus] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  // Drawer state
  const [selected, setSelected] = useState<AppCard | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"notes" | "history">("notes");
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const canManage = user && ["admin", "hr", "recruiter"].includes(user.role);

  useEffect(() => {
    if (!canManage) {
      navigate("/jobs");
      return;
    }
    Promise.all([
      api.get(`/applications/job/${id}`),
      api.get(`/jobs/${id}`),
    ])
      .then(([appsRes, jobRes]) => {
        const grouped = emptyColumns();
        (appsRes.data.applications as AppCard[]).forEach((app) => {
          if (grouped[app.status]) grouped[app.status].push(app);
        });
        setColumns(grouped);
        setJobTitle(jobRes.data.title);
      })
      .finally(() => setLoading(false));
  }, [id, canManage, navigate]);

  const openDrawer = useCallback(async (card: AppCard) => {
    setSelected(card);
    setNotes([]);
    setHistory([]);
    setNoteInput("");
    setDrawerTab("notes");
    setDrawerLoading(true);
    try {
      const [notesRes, historyRes] = await Promise.all([
        api.get(`/applications/${card.id}/notes`),
        api.get(`/applications/${card.id}/history`),
      ]);
      setNotes(notesRes.data);
      setHistory(historyRes.data);
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  async function handleAddNote() {
    if (!noteInput.trim() || !selected) return;
    setAddingNote(true);
    try {
      const res = await api.post(`/applications/${selected.id}/notes`, {
        content: noteInput.trim(),
      });
      setNotes((prev) => [...prev, res.data]);
      setNoteInput("");
    } finally {
      setAddingNote(false);
    }
  }

  async function handleMove(appId: number, fromStatus: string, toStatus: string) {
    if (fromStatus === toStatus) return;
    const card = columns[fromStatus]?.find((c) => c.id === appId);
    if (!card) return;

    setColumns((prev) => ({
      ...prev,
      [fromStatus]: prev[fromStatus].filter((c) => c.id !== appId),
      [toStatus]: [...(prev[toStatus] || []), { ...card, status: toStatus }],
    }));

    try {
      await api.patch(`/applications/${appId}/status`, { status: toStatus });
      if (selected?.id === appId) {
        setSelected((s) => (s ? { ...s, status: toStatus } : null));
        const res = await api.get(`/applications/${appId}/history`);
        setHistory(res.data);
      }
    } catch {
      // Revert optimistic update
      setColumns((prev) => ({
        ...prev,
        [toStatus]: prev[toStatus].filter((c) => c.id !== appId),
        [fromStatus]: [...(prev[fromStatus] || []), { ...card, status: fromStatus }],
      }));
    }
  }

  function onDragStart(e: React.DragEvent, appId: number, fromStatus: string) {
    setDraggingId(appId);
    setDraggingFromStatus(fromStatus);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, st: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(st);
  }

  function onDragLeave(e: React.DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverStatus(null);
    }
  }

  function onDrop(e: React.DragEvent, toStatus: string) {
    e.preventDefault();
    setDragOverStatus(null);
    if (draggingId !== null && draggingFromStatus !== null) {
      handleMove(draggingId, draggingFromStatus, toStatus);
    }
    setDraggingId(null);
    setDraggingFromStatus(null);
  }

  function onDragEnd() {
    setDraggingId(null);
    setDraggingFromStatus(null);
    setDragOverStatus(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <Link
              to={`/jobs/${id}/applicants`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-1"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Applicants
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pipeline
            </h1>
            {jobTitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {jobTitle}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 self-end">
            Drag cards between columns to move applicants
          </p>
        </div>

        {/* Kanban board */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((s) => (
              <div
                key={s.value}
                className="min-w-[260px] h-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4 flex-1 items-start">
            {STAGES.map((stage) => {
              const cards = columns[stage.value] || [];
              const isOver = dragOverStatus === stage.value;
              return (
                <div
                  key={stage.value}
                  className={`min-w-[240px] w-[240px] flex flex-col rounded-2xl border transition-colors duration-150 ${
                    isOver
                      ? "border-teal-400 dark:border-teal-600 bg-teal-50/40 dark:bg-teal-900/10"
                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                  }`}
                  onDragOver={(e) => onDragOver(e, stage.value)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, stage.value)}
                >
                  {/* Column header */}
                  <div className="px-3 pt-3 pb-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${DOT[stage.value]}`}
                    />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-1 leading-none">
                      {stage.label}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 font-medium">
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
                    {cards.length === 0 && (
                      <div
                        className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors duration-150 ${
                          isOver
                            ? "border-teal-400 dark:border-teal-600"
                            : "border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        <p className="text-[11px] text-gray-400 dark:text-gray-600">
                          Drop here
                        </p>
                      </div>
                    )}
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, card.id, stage.value)}
                        onDragEnd={onDragEnd}
                        onClick={() => openDrawer(card)}
                        className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing hover:shadow-sm transition-all select-none ${
                          draggingId === card.id ? "opacity-40 scale-95" : ""
                        } ${
                          selected?.id === card.id
                            ? "ring-2 ring-teal-500 border-transparent bg-white dark:bg-gray-800"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={card.user.full_name}
                            avatarUrl={card.user.avatar_url}
                            size={8}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {card.user.full_name}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                              {card.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {formatDate(card.created_at)}
                          </p>
                          {card.resume_url && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 inline-flex items-center gap-0.5">
                              <svg
                                width="9"
                                height="9"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              CV
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Backdrop */}
      {selected && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          onClick={() => setSelected(null)}
        />
      )}

      {/* Applicant drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl transition-transform duration-300 ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selected && (
          <>
            {/* Drawer header */}
            <div className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <Avatar
                name={selected.user.full_name}
                avatarUrl={selected.user.avatar_url}
                size={10}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {selected.user.full_name}
                </p>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    BADGE[selected.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {stageLabel(selected.status)}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-5">
                {/* Contact info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span className="truncate">{selected.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Applied {formatDate(selected.created_at)}
                  </div>
                  {selected.resume_url && (
                    <a
                      href={`${API_BASE}${selected.resume_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Download Resume
                    </a>
                  )}
                </div>

                {/* Move stage */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                    Move to Stage
                  </label>
                  <select
                    value={selected.status}
                    onChange={(e) => {
                      const toStatus = e.target.value;
                      const fromStatus = selected.status;
                      handleMove(selected.id, fromStatus, toStatus);
                      setSelected((s) => (s ? { ...s, status: toStatus } : null));
                    }}
                    className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cover letter */}
                {selected.cover_letter && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Cover Letter
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      {selected.cover_letter}
                    </p>
                  </div>
                )}

                {/* Tabs */}
                <div>
                  <div className="flex border-b border-gray-100 dark:border-gray-800 mb-3">
                    <button
                      onClick={() => setDrawerTab("notes")}
                      className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                        drawerTab === "notes"
                          ? "border-teal-500 text-teal-600 dark:text-teal-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      Notes{notes.length > 0 ? ` (${notes.length})` : ""}
                    </button>
                    <button
                      onClick={() => setDrawerTab("history")}
                      className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                        drawerTab === "history"
                          ? "border-teal-500 text-teal-600 dark:text-teal-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      History{history.length > 0 ? ` (${history.length})` : ""}
                    </button>
                  </div>

                  {drawerLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  ) : drawerTab === "notes" ? (
                    <div>
                      {notes.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                          No notes yet
                        </p>
                      ) : (
                        <div className="space-y-3 mb-3">
                          {notes.map((note) => (
                            <div key={note.id} className="flex gap-2">
                              <Avatar
                                name={note.author.full_name}
                                avatarUrl={note.author.avatar_url}
                                size={6}
                              />
                              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                    {note.author.full_name}
                                  </p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                                    {formatDatetime(note.created_at)}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                  {note.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2 pt-2">
                        <textarea
                          ref={noteTextareaRef}
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                              handleAddNote();
                            }
                          }}
                          placeholder="Add a note… (Ctrl+Enter to submit)"
                          rows={3}
                          className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                        <button
                          onClick={handleAddNote}
                          disabled={!noteInput.trim() || addingNote}
                          className="w-full py-2 text-xs font-medium rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-colors"
                        >
                          {addingNote ? "Adding…" : "Add Note"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // History tab
                    <div>
                      {history.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                          No status changes yet
                        </p>
                      ) : (
                        <div className="relative pl-5">
                          <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-100 dark:bg-gray-800" />
                          <div className="space-y-4">
                            {history.map((h) => (
                              <div key={h.id} className="relative">
                                <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white dark:ring-gray-900" />
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                                  {h.from_status ? (
                                    <>
                                      <span
                                        className={`font-semibold ${
                                          HISTORY_TEXT[h.from_status] ??
                                          "text-gray-600"
                                        }`}
                                      >
                                        {stageLabel(h.from_status)}
                                      </span>
                                      <span className="mx-1 text-gray-400">→</span>
                                      <span
                                        className={`font-semibold ${
                                          HISTORY_TEXT[h.to_status] ??
                                          "text-gray-600"
                                        }`}
                                      >
                                        {stageLabel(h.to_status)}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      Entered as{" "}
                                      <span
                                        className={`font-semibold ${
                                          HISTORY_TEXT[h.to_status] ??
                                          "text-gray-600"
                                        }`}
                                      >
                                        {stageLabel(h.to_status)}
                                      </span>
                                    </>
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                  by {h.changed_by.full_name} ·{" "}
                                  {formatDatetime(h.changed_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
