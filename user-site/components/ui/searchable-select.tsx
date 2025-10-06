"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchableSelectProps {
  options: string[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}

export function SearchableSelect({ 
  options, 
  value, 
  onValueChange, 
  placeholder = "Select an option",
  label,
  className 
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search term
  useEffect(() => {
    const filtered = options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOptions(filtered)
    setSelectedIndex(-1) // Reset selection when filtering
  }, [searchTerm, options])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (option: string) => {
    onValueChange(option)
    setIsOpen(false)
    setSearchTerm("")
    setSelectedIndex(-1)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm("")
      setSelectedIndex(-1)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[selectedIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setSearchTerm("")
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <Label className="text-sm font-semibold mb-2 block">{label}</Label>
      )}
      
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        className={cn(
          "w-full justify-between h-12 text-base font-normal",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {value || placeholder}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search districts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 h-9 text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between",
                    value === option && "bg-primary/10 text-primary",
                    selectedIndex === index && "bg-primary/5"
                  )}
                >
                  <span>{option}</span>
                  {value === option && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No districts found matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Footer with count */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            {filteredOptions.length} of {options.length} districts
          </div>
        </div>
      )}
    </div>
  )
}
