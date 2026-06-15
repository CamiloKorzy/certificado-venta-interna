import React, { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const MultiSelect = ({ label, options, selected, onChange, singleSelection = false }: { label: string, options: string[], selected: string[], onChange: (v: string[]) => void, singleSelection?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (singleSelection) {
      if (option !== 'Todos' && option !== 'Todas') {
        onChange([option]);
        setIsOpen(false);
      } else {
        onChange([option]);
        setIsOpen(false);
      }
      return;
    }

    if (option === 'Todos' || option === 'Todas') {
      onChange([option]);
      return;
    }
    
    let newSelected = selected.filter(s => s !== 'Todos' && s !== 'Todas');
    if (newSelected.includes(option)) {
      newSelected = newSelected.filter(s => s !== option);
    } else {
      newSelected.push(option);
    }
    
    if (newSelected.length === 0) {
      newSelected = [options[0]]; // fallback to Todos/Todas
    }
    
    onChange(newSelected);
  };

  const displayText = (selected.includes('Todos') || selected.includes('Todas')) 
    ? options[0] 
    : (selected.length === 1 ? selected[0] : `${selected.length} seleccionados`);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div 
        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-white transition-colors cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto">
          {options.map(option => {
            const isSelected = selected.includes(option);
            return (
              <div 
                key={option}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 flex items-center gap-2"
                onClick={() => toggleOption(option)}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center
                  ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
                <span className="text-slate-700">{option}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
