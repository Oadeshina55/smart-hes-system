import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { ElectricBolt } from '@mui/icons-material';
import axios from 'axios';

interface MeterSuggestion {
  meterNumber: string;
  brand?: string;
  area?: string;
  customer?: string;
}

interface MeterAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

const MeterAutocomplete: React.FC<MeterAutocompleteProps> = ({
  value,
  onChange,
  label = 'Meter Number',
  placeholder = 'Enter meter number...',
  error = false,
  helperText,
  disabled = false,
  fullWidth = true,
  size = 'medium',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<MeterSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced search function with 2 second delay
  const debouncedSearch = useCallback((searchValue: string) => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Don't search for queries shorter than 2 characters
    if (searchValue.trim().length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    // Set loading state
    setLoading(true);

    // Create new timer
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get('/meters/autocomplete/search', {
          params: { q: searchValue },
        });

        if (response.data.success) {
          setOptions(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 2000); // 2 second delay

    setDebounceTimer(timer);
  }, [debounceTimer]);

  // Handle input value change
  const handleInputChange = (event: React.SyntheticEvent, newValue: string) => {
    setInputValue(newValue);
    debouncedSearch(newValue);
  };

  // Handle selection change
  const handleChange = (event: React.SyntheticEvent, newValue: MeterSuggestion | string | null) => {
    if (typeof newValue === 'string') {
      onChange(newValue);
      setInputValue(newValue);
    } else if (newValue && typeof newValue === 'object') {
      onChange(newValue.meterNumber);
      setInputValue(newValue.meterNumber);
    } else {
      onChange('');
      setInputValue('');
    }
  };

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <Autocomplete
      freeSolo
      value={inputValue}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={options}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.meterNumber;
      }}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      filterOptions={(x) => x} // Disable built-in filtering since we do server-side search
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText || (loading ? 'Searching meters...' : '')}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                <ElectricBolt sx={{ color: 'action.active', mr: 1, fontSize: 20 }} />
                {params.InputProps.startAdornment}
              </Box>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.meterNumber}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ElectricBolt sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {option.meterNumber}
              </Typography>
              {option.brand && (
                <Chip
                  label={option.brand}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, ml: 3, mt: 0.5 }}>
              {option.area && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Area: {option.area}
                </Typography>
              )}
              {option.customer && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  • Customer: {option.customer}
                </Typography>
              )}
            </Box>
          </Box>
        </li>
      )}
      noOptionsText={
        inputValue.trim().length < 2
          ? 'Type at least 2 characters to search'
          : loading
          ? 'Searching...'
          : 'No meters found'
      }
    />
  );
};

export default MeterAutocomplete;
