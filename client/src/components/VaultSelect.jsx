import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * VaultSelect - Accessible, styled dropdown matching VAULT aesthetic.
 * Replaces browser-native <select> to prevent native blue focus/selection boxes.
 *
 * Props:
 * - value: Current selected value
 * - onChange: Callback when selection changes (receives selected value)
 * - options: Array of { value: string, label: string } or string options
 * - placeholder: Optional placeholder text
 * - label: Optional prefix label (e.g. "Stock:", "Category:")
 * - className: Optional wrapper class name
 * - disabled: Boolean
 * - align: 'left' | 'right' dropdown alignment
 * - size: 'sm' | 'md'
 */
export default function VaultSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  label = '',
  className = '',
  disabled = false,
  align = 'left',
  size = 'sm',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listboxRef = useRef(null);

  // Normalize options into { value, label } format
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? opt
      : { value: opt, label: String(opt) }
  );

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Sync highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = normalizedOptions.findIndex((opt) => String(opt.value) === String(value));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < normalizedOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : normalizedOptions.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
          const selected = normalizedOptions[highlightedIndex];
          onChange(selected.value);
          setIsOpen(false);
        }
        break;
      default:
        break;
    }
  };

  const handleSelect = (optVal) => {
    if (disabled) return;
    onChange(optVal);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : 'px-3.5 py-2 text-xs sm:text-sm';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left font-mono ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 bg-[#f9fafb] hover:bg-white border rounded-xl font-bold text-[#111111] transition-all cursor-pointer select-none focus:outline-none focus:border-[#111111] shadow-xs ${sizeClasses} ${
          isOpen ? 'border-[#111111] bg-white ring-1 ring-[#111111]' : 'border-[#e5e5e5]'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-neutral-100' : ''}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {label && <span className="text-[#6b7280] font-medium">{label}</span>}
          <span className="truncate font-bold">{displayLabel}</span>
        </span>
        <ChevronDown
          size={13}
          className={`text-[#6b7280] transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-[#111111]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute mt-1.5 min-w-[160px] max-w-[280px] w-max bg-white border border-[#e5e5e5] rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {normalizedOptions.map((opt, index) => {
            const isSelected = String(opt.value) === String(value);
            const isHighlighted = index === highlightedIndex;

            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#111111] text-white font-bold'
                    : isHighlighted
                    ? 'bg-[#f3f4f6] text-[#111111]'
                    : 'text-[#374151] hover:bg-[#f9fafb]'
                }`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {isSelected && (
                  <Check size={13} className="text-amber-400 flex-shrink-0 ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
