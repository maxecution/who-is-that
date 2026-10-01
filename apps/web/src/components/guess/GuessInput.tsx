import React, { useRef, useLayoutEffect, useImperativeHandle, forwardRef } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';

export interface GuessInputProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  onSubmit: (value: string) => void;
  label?: string;
  isDisabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export interface GuessInputHandle {
  focus: () => void;
}

export const GuessInput = forwardRef<GuessInputHandle, GuessInputProps>(function GuessInput(
  {
    options,
    value,
    onChange,
    onBlur,
    onSubmit,
    label = 'Enter your guess',
    isDisabled = false,
    error = false,
    helperText,
  },
  ref,
) {
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  return (
    <Autocomplete<string, false, false, true>
      id='guess-input'
      options={options}
      value={value}
      inputValue={value}
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === 'input') {
          onChange(newInputValue);
        }
      }}
      onChange={(_, newValue) => {
        onChange(newValue ?? '');
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !isOpen) {
          onSubmit(value);
        }
      }}
      onBlur={() => {
        // Deferred so MUI's autoSelect commit lands first; read the ref so a submit that
        // cleared the value (blur fires after click on touch devices) is not undone.
        setTimeout(() => {
          onBlur(valueRef.current);
        }, 0);
      }}
      disabled={isDisabled}
      freeSolo
      clearOnEscape
      autoComplete
      includeInputInList
      autoHighlight
      autoSelect
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(6px)',
          },
        },
        listbox: {
          sx: {
            maxHeight: 160,
            overflowY: 'auto',
          },
        },
      }}
      renderOption={(props, option, { inputValue }) => {
        const { key, ...optionProps } = props;
        const matches = match(option, inputValue, {
          insideWords: true,
        });

        const parts = parse(option, matches);

        return (
          <li key={key} {...optionProps}>
            {parts.map((part, index) => (
              <span
                key={index}
                style={{
                  fontWeight: part.highlight ? 600 : 400,
                }}>
                {part.text}
              </span>
            ))}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          className=''
          {...params}
          slotProps={{
            htmlInput: {
              ...params.inputProps,
              onClick: (event: React.MouseEvent<HTMLInputElement>) => {
                params.inputProps.onClick?.(event);
                setIsOpen(true);
              },
            },
          }}
          inputRef={inputRef}
          label={label}
          error={error}
          helperText={helperText ?? (error ? 'Invalid selection' : undefined)}
        />
      )}
    />
  );
});

export default GuessInput;
