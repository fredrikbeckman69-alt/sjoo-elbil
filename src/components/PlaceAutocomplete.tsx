import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, X, ChevronRight } from 'lucide-react';
import { SWEDISH_PREDEFINED_PLACES, PredefinedPlace, normalizePlaceQuery } from '../data/swedishPlaces';

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  autoFocus?: boolean;
  className?: string;
  onSelectPlace?: (place: PredefinedPlace) => void;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Sök stad eller adress...',
  label,
  icon,
  autoFocus = false,
  className = '',
  onSelectPlace,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrera förslag från ortsdatabasen
  const suggestions = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 1) return [];

    const norm = normalizePlaceQuery(trimmed);
    if (!norm) return [];

    const matches: PredefinedPlace[] = [];
    const seenNames = new Set<string>();

    for (const place of SWEDISH_PREDEFINED_PLACES) {
      const pNorm = normalizePlaceQuery(place.name);
      const isExact = pNorm === norm;
      const isStart = pNorm.startsWith(norm);
      const isAlias = place.aliases.some((a) => normalizePlaceQuery(a).startsWith(norm));
      const isContained = norm.length >= 3 && pNorm.includes(norm);

      if (isExact || isStart || isAlias || isContained) {
        if (!seenNames.has(place.name)) {
          seenNames.add(place.name);
          matches.push(place);
        }
      }
      if (matches.length >= 6) break;
    }

    return matches;
  }, [value]);

  // Stäng dropdown vid klick utanför
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (place: PredefinedPlace) => {
    const formatted = `${place.name}, Sverige`;
    onChange(formatted);
    if (onSelectPlace) {
      onSelectPlace(place);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
          {icon || <MapPin className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-slate-900 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition pr-8"
        />

        {value.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-white rounded-md transition"
            title="Rensa fält"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown med matchande orter */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-800">
            Förslag i Sverige
          </div>
          {suggestions.map((place, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <button
                key={`${place.name}-${idx}`}
                type="button"
                onClick={() => handleSelect(place)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs transition cursor-pointer ${
                  isHighlighted ? 'bg-cyan-500/20 text-white' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isHighlighted ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <span className="font-semibold text-white mr-1.5">{place.name}</span>
                    <span className="text-[11px] text-slate-400">{place.county}</span>
                  </div>
                </div>
                <ChevronRight className={`w-3 h-3 shrink-0 ${isHighlighted ? 'text-cyan-400' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
