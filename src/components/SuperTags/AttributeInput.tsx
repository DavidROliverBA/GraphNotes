import { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Mail,
  Star,
  X,
} from 'lucide-react';
import {
  SuperTagAttribute,
  isSelectConfig,
  isNumberConfig,
  isDateConfig,
  SelectOption,
} from '../../lib/superTags/types';
import { AttributeValue } from '../../lib/notes/types';

interface AttributeInputProps {
  attribute: SuperTagAttribute;
  value: AttributeValue;
  onChange: (value: AttributeValue) => void;
  disabled?: boolean;
}

export function AttributeInput({ attribute, value, onChange, disabled }: AttributeInputProps) {
  const { type, config } = attribute;

  switch (type) {
    case 'text':
      return (
        <TextInput value={value as string} onChange={onChange} disabled={disabled} />
      );
    case 'richText':
      return (
        <RichTextInput value={value as string} onChange={onChange} disabled={disabled} />
      );
    case 'number':
      return (
        <NumberInput
          value={value as number}
          onChange={onChange}
          config={isNumberConfig(config) ? config : undefined}
          disabled={disabled}
        />
      );
    case 'checkbox':
      return (
        <CheckboxInput value={value as boolean} onChange={onChange} disabled={disabled} />
      );
    case 'date':
      return (
        <DateInput
          value={value as { date: string } | null}
          onChange={onChange}
          includeTime={isDateConfig(config) ? config.includeTime : false}
          disabled={disabled}
        />
      );
    case 'select':
      return (
        <SelectInput
          value={value as string}
          onChange={onChange}
          options={isSelectConfig(config) ? config.options : []}
          disabled={disabled}
        />
      );
    case 'multiSelect':
      return (
        <MultiSelectInput
          value={value as string[]}
          onChange={onChange}
          options={isSelectConfig(config) ? config.options : []}
          disabled={disabled}
        />
      );
    case 'url':
      return (
        <UrlInput value={value as string} onChange={onChange} disabled={disabled} />
      );
    case 'email':
      return (
        <EmailInput value={value as string} onChange={onChange} disabled={disabled} />
      );
    case 'rating':
      return (
        <RatingInput value={value as number} onChange={onChange} disabled={disabled} />
      );
    case 'noteReference':
      return (
        <NoteReferenceInput
          value={value as { noteId: string } | null}
          onChange={onChange}
          disabled={disabled}
        />
      );
    default:
      return <div className="text-text-tertiary text-sm">Unsupported type: {type}</div>;
  }
}

// Text Input
function TextInput({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded focus:outline-none focus:border-accent-primary focus:bg-bg-primary disabled:opacity-50"
    />
  );
}

// Rich Text Input (textarea)
function RichTextInput({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={3}
      className="w-full px-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded focus:outline-none focus:border-accent-primary focus:bg-bg-primary disabled:opacity-50 resize-none"
    />
  );
}

// Number Input
function NumberInput({
  value,
  onChange,
  config,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  config?: { min?: number; max?: number; step?: number; format?: string };
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === '' ? null : parseFloat(val));
      }}
      min={config?.min}
      max={config?.max}
      step={config?.step}
      disabled={disabled}
      className="w-full px-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded focus:outline-none focus:border-accent-primary focus:bg-bg-primary disabled:opacity-50"
    />
  );
}

// Checkbox Input
function CheckboxInput({
  value,
  onChange,
  disabled,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`
        w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
        ${value
          ? 'bg-accent-primary border-accent-primary'
          : 'bg-bg-tertiary border-border-subtle hover:border-accent-primary'
        }
        disabled:opacity-50
      `}
    >
      {value && <Check className="w-3 h-3 text-white" />}
    </button>
  );
}

// Date Input
function DateInput({
  value,
  onChange,
  includeTime,
  disabled,
}: {
  value: { date: string } | null;
  onChange: (v: { date: string } | null) => void;
  includeTime: boolean;
  disabled?: boolean;
}) {
  const dateValue = value?.date ? value.date.split('T')[0] : '';
  const timeValue = value?.date && includeTime ? value.date.split('T')[1]?.slice(0, 5) : '';

  const handleDateChange = (date: string) => {
    if (!date) {
      onChange(null);
      return;
    }
    const time = includeTime && timeValue ? `T${timeValue}:00` : 'T00:00:00';
    onChange({ date: `${date}${time}Z` });
  };

  const handleTimeChange = (time: string) => {
    if (!dateValue) return;
    onChange({ date: `${dateValue}T${time}:00Z` });
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="date"
          value={dateValue}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={disabled}
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded focus:outline-none focus:border-accent-primary focus:bg-bg-primary disabled:opacity-50"
        />
      </div>
      {includeTime && (
        <input
          type="time"
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          disabled={disabled}
          className="px-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded focus:outline-none focus:border-accent-primary focus:bg-bg-primary disabled:opacity-50"
        />
      )}
    </div>
  );
}

// Select Input
function SelectInput({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  options: SelectOption[];
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded hover:bg-bg-secondary focus:outline-none focus:border-accent-primary disabled:opacity-50"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            {selected.colour && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selected.colour }}
              />
            )}
            {selected.label}
          </span>
        ) : (
          <span className="text-text-tertiary">Select...</span>
        )}
        <ChevronDown className="w-4 h-4 text-text-tertiary" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-border-subtle rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-left text-text-tertiary hover:bg-bg-tertiary"
              >
                Clear selection
              </button>
            )}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-bg-tertiary
                  ${value === option.value ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-primary'}
                `}
              >
                {option.colour && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: option.colour }}
                  />
                )}
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Multi-Select Input
function MultiSelectInput({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string[] | null;
  onChange: (v: string[]) => void;
  options: SelectOption[];
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedValues = value || [];

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded hover:bg-bg-secondary focus:outline-none focus:border-accent-primary disabled:opacity-50 min-h-[34px]"
      >
        <div className="flex flex-wrap gap-1">
          {selectedValues.length === 0 ? (
            <span className="text-text-tertiary">Select...</span>
          ) : (
            selectedValues.map((val) => {
              const option = options.find((o) => o.value === val);
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-bg-secondary rounded text-xs"
                  style={option?.colour ? { backgroundColor: `${option.colour}20`, color: option.colour } : {}}
                >
                  {option?.label || val}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(val);
                    }}
                    className="hover:text-error"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-border-subtle rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggle(option.value)}
                className={`
                  w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-bg-tertiary
                  ${selectedValues.includes(option.value) ? 'bg-accent-primary/10' : ''}
                `}
              >
                <span
                  className={`
                    w-4 h-4 rounded border flex items-center justify-center
                    ${selectedValues.includes(option.value)
                      ? 'bg-accent-primary border-accent-primary'
                      : 'border-border-subtle'
                    }
                  `}
                >
                  {selectedValues.includes(option.value) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </span>
                {option.colour && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: option.colour }}
                  />
                )}
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// URL Input
function UrlInput({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <ExternalLink className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
      <input
        type="url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="https://..."
        className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded focus:outline-none focus:border-accent-primary focus:bg-bg-primary disabled:opacity-50"
      />
    </div>
  );
}

// Email Input
function EmailInput({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
      <input
        type="email"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="email@example.com"
        className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded focus:outline-none focus:border-accent-primary focus:bg-bg-primary disabled:opacity-50"
      />
    </div>
  );
}

// Rating Input (1-5 stars)
function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
}) {
  const rating = value || 0;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === rating ? null : star)}
          disabled={disabled}
          className="p-0.5 hover:scale-110 transition-transform disabled:opacity-50"
        >
          <Star
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-text-tertiary'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Note Reference Input (simplified - would need note picker in full implementation)
function NoteReferenceInput({
  value,
  onChange,
  disabled,
}: {
  value: { noteId: string } | null;
  onChange: (v: { noteId: string } | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <FileText className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
      <input
        type="text"
        value={value?.noteId || ''}
        onChange={(e) => onChange(e.target.value ? { noteId: e.target.value } : null)}
        disabled={disabled}
        placeholder="Note ID or search..."
        className="w-full pl-8 pr-3 py-1.5 text-sm bg-bg-tertiary border border-transparent rounded focus:outline-none focus:border-accent-primary focus:bg-bg-primary disabled:opacity-50"
      />
    </div>
  );
}

export default AttributeInput;
