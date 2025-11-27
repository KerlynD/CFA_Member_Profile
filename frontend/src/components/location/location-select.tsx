"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { authenticatedFetch } from "@/lib/auth";

type LocationOption = {
  fullName: string;
  city: string;
  region: string;
  country: string;
};

type LocationSelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

const MIN_QUERY_LENGTH = 2;

export function LocationSelect({ label = "Current Location", value, onChange, required }: LocationSelectProps) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep query in sync when parent updates value (e.g., after saving)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLocations = useMemo(
    () =>
      debounce(async (term: string) => {
        if (term.trim().length < MIN_QUERY_LENGTH) {
          setOptions([]);
          setIsDropdownOpen(false);
          setError(null);
          return;
        }

        setIsLoading(true);
        setError(null);
        try {
          const response = await authenticatedFetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/locations/search?q=${encodeURIComponent(term.trim())}`
          );

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Failed to search locations");
          }

          const data = await response.json();
          setOptions(data.results || []);
          setIsDropdownOpen(true);
        } catch (err) {
          console.error("Error searching locations:", err);
          setError(err instanceof Error ? err.message : "Failed to search locations");
          setOptions([]);
          setIsDropdownOpen(false);
        } finally {
          setIsLoading(false);
        }
      }, 400),
    []
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setQuery(newValue);
    fetchLocations(newValue);
  };

  const handleSelect = (option: LocationOption) => {
    setQuery(option.fullName);
    onChange(option.fullName);
    setIsDropdownOpen(false);
  };

  const clearSelection = () => {
    setQuery("");
    onChange("");
    setOptions([]);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <p className="text-sm text-gray-500 mb-2">
        Start typing to search for your city. Please select one of the suggestions.
      </p>
      <div className="relative">
        <input
          id="location"
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (options.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          placeholder="e.g. New York, NY, United States"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition pr-10"
          autoComplete="off"
          required={required}
        />
        {query && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {isLoading && (
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          Searching locations...
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!isLoading && query.length > 0 && query === value && (
        <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Location selected
        </p>
      )}
      {isDropdownOpen && options.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {options.map((option) => (
            <li key={option.fullName}>
              <button
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none flex flex-col"
                onClick={() => handleSelect(option)}
              >
                <span className="text-sm font-medium text-gray-900">{option.fullName}</span>
                <span className="text-xs text-gray-500">
                  {option.city} • {option.region || option.country}
                </span>
              </button>
            </li>
          ))}
          {options.length === 0 && (
            <li className="px-4 py-2 text-sm text-gray-500">No locations found. Try a different search.</li>
          )}
        </ul>
      )}
      {query && query !== value && (
        <p className="mt-2 text-xs text-yellow-700">
          Please select a location from the list above to ensure it's valid.
        </p>
      )}
    </div>
  );
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

