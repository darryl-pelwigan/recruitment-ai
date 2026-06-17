import { useEffect, useRef, useState } from "react";

export interface FilterOption {
  label: string;
  value: string;
}

interface Props {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  multiSelect?: boolean;
  allowCustomInput?: boolean;
  customInputPlaceholder?: string;
}

function CheckIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Box({ checked, circle }: { checked: boolean; circle?: boolean }) {
  const shape = circle ? "rounded-full" : "rounded-[3px]";
  return (
    <div className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 transition-colors ${shape} ${
      checked
        ? "border-teal-500 bg-teal-500"
        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
    }`}>
      {checked && <CheckIcon />}
    </div>
  );
}

export default function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  multiSelect = true,
  allowCustomInput = false,
  customInputPlaceholder = "Type and press Enter…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function toggle(value: string) {
    if (multiSelect) {
      onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
    } else {
      onChange(selected[0] === value ? [] : [value]);
      setOpen(false);
    }
  }

  function clearAll() {
    onChange([]);
    if (!multiSelect) setOpen(false);
  }

  function addCustom() {
    const val = customInput.trim();
    if (!val || selected.includes(val)) { setCustomInput(""); return; }
    onChange([...selected, val]);
    setCustomInput("");
  }

  const predefinedValues = options.map(o => o.value);
  const customValues = selected.filter(v => !predefinedValues.includes(v));

  const buttonLabel =
    selected.length === 0
      ? `${label}: All`
      : selected.length === 1
      ? `${label}: ${options.find(o => o.value === selected[0])?.label ?? selected[0]}`
      : `${label} (${selected.length} selected)`;

  const isActive = selected.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors ${
          isActive
            ? "border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        {buttonLabel}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-[175px] py-1 overflow-hidden">
          {/* All */}
          <button
            type="button"
            onClick={clearAll}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
              !isActive
                ? "text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-900/20"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Box checked={!isActive} circle={!multiSelect} />
            All
          </button>

          <div className="mx-3 my-0.5 border-t border-gray-100 dark:border-gray-800" />

          {/* Predefined options */}
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                selected.includes(opt.value)
                  ? "text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-900/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Box checked={selected.includes(opt.value)} circle={!multiSelect} />
              {opt.label}
            </button>
          ))}

          {/* Custom text input (for Location) */}
          {allowCustomInput && (
            <>
              <div className="mx-3 my-0.5 border-t border-gray-100 dark:border-gray-800" />
              <div className="p-2">
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                    placeholder={customInputPlaceholder}
                    className="flex-1 min-w-0 px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={addCustom}
                    className="px-2 py-1 text-xs font-medium rounded-md bg-teal-600 text-white hover:bg-teal-700 shrink-0"
                  >
                    Add
                  </button>
                </div>
                {customValues.map(v => (
                  <div key={v} className="flex items-center justify-between mt-1.5 px-0.5">
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[110px]">{v}</span>
                    <button
                      type="button"
                      onClick={() => onChange(selected.filter(s => s !== v))}
                      className="ml-2 text-gray-400 hover:text-red-500 shrink-0 transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
