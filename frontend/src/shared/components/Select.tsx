/**
 * Select Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Error State Philosophy: "Helpful, Not Punitive")
 *
 * Design Principles:
 * - Custom dropdown (native <select> is difficult to style consistently)
 * - Keyboard navigation (Enter/Space to open, Arrow keys to navigate, Escape to close)
 * - 200ms fast transitions (state changes feel responsive)
 * - Accessible (ARIA attributes, keyboard support, screen reader announcements)
 * - Helpful error messages (specific next steps, not vague "Invalid selection")
 *
 * Error Message Examples:
 * ❌ BAD: "Invalid selection"
 * ✅ GOOD: "Please select a job type to continue"
 *
 * ❌ BAD: "Required field"
 * ✅ GOOD: "Customer name is required to create a quote"
 */

import React, { useState, useRef, useEffect } from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Select label */
  label?: string;
  /** Helper text (shown below select when no error) */
  helperText?: string;
  /** Error message (helpful, specific guidance) */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Full width select */
  fullWidth?: boolean;
  /** Select size */
  size?: 'small' | 'medium' | 'large';
  /** Placeholder text */
  placeholder?: string;
  /** Available options */
  options: SelectOption[];
  /** Current value */
  value?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Additional class names */
  className?: string;
  /** Select ID */
  id?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      required = false,
      fullWidth = false,
      size = 'medium',
      placeholder = 'Select an option...',
      options,
      value,
      disabled = false,
      onChange,
      className = '',
      id,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const selectRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);

    // Generate IDs for accessibility
    const selectId = id || `select-${React.useId()}`;
    const helperTextId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;
    const listboxId = `${selectId}-listbox`;

    // Find selected option
    const selectedOption = options.find((opt) => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(selectedOption ? options.indexOf(selectedOption) : 0);
          } else if (focusedIndex >= 0) {
            handleSelectOption(options[focusedIndex].value);
          }
          break;

        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(selectedOption ? options.indexOf(selectedOption) : 0);
          } else {
            setFocusedIndex((prev) => {
              const nextIndex = prev < options.length - 1 ? prev + 1 : prev;
              // Skip disabled options
              if (options[nextIndex]?.disabled) {
                return nextIndex < options.length - 1 ? nextIndex + 1 : prev;
              }
              return nextIndex;
            });
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => {
              const nextIndex = prev > 0 ? prev - 1 : prev;
              // Skip disabled options
              if (options[nextIndex]?.disabled) {
                return nextIndex > 0 ? nextIndex - 1 : prev;
              }
              return nextIndex;
            });
          }
          break;

        case 'Home':
          event.preventDefault();
          if (isOpen) {
            setFocusedIndex(0);
          }
          break;

        case 'End':
          event.preventDefault();
          if (isOpen) {
            setFocusedIndex(options.length - 1);
          }
          break;
      }
    };

    // Scroll focused option into view
    useEffect(() => {
      if (isOpen && focusedIndex >= 0 && listboxRef.current) {
        const focusedElement = listboxRef.current.children[focusedIndex] as HTMLElement;
        if (focusedElement) {
          focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, [focusedIndex, isOpen]);

    const handleSelectOption = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setFocusedIndex(-1);
    };

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen((prev) => !prev);
        if (!isOpen && selectedOption) {
          setFocusedIndex(options.indexOf(selectedOption));
        }
      }
    };

    const containerClasses = [
      'select-container',
      fullWidth && 'select-container--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const triggerClasses = [
      'select-trigger',
      `select-trigger--${size}`,
      error && 'select-trigger--error',
      disabled && 'select-trigger--disabled',
      isOpen && 'select-trigger--open',
    ]
      .filter(Boolean)
      .join(' ');

    const describedBy = [helperText && !error ? helperTextId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses} ref={ref}>
        {label && (
          <label id={`${selectId}-label`} className="select-label">
            {label}
            {required && (
              <span className="select-label__required" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}

        <div className="select-wrapper" ref={selectRef}>
          <div
            id={selectId}
            className={triggerClasses}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={label ? `${selectId}-label` : undefined}
            aria-describedby={describedBy || undefined}
            aria-controls={listboxId}
            aria-invalid={error ? 'true' : 'false'}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
          >
            <span
              className={selectedOption ? 'select-trigger__value' : 'select-trigger__placeholder'}
            >
              {selectedOption?.label || placeholder}
            </span>
            <span className="select-trigger__icon" aria-hidden="true">
              ▼
            </span>
          </div>

          {isOpen && (
            <ul
              id={listboxId}
              ref={listboxRef}
              className="select-listbox"
              role="listbox"
              aria-labelledby={label ? `${selectId}-label` : undefined}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  className={[
                    'select-option',
                    option.value === value && 'select-option--selected',
                    index === focusedIndex && 'select-option--focused',
                    option.disabled && 'select-option--disabled',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelectOption(option.value)}
                  onMouseEnter={() => !option.disabled && setFocusedIndex(index)}
                >
                  {option.label}
                  {option.value === value && (
                    <span className="select-option__checkmark" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {helperText && !error && (
          <p id={helperTextId} className="select-helper-text">
            {helperText}
          </p>
        )}

        {error && (
          <p id={errorId} className="select-error" role="alert">
            <span className="select-error__icon" aria-hidden="true">
              ⚠
            </span>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
