export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isRequired = (value) => value !== null && value !== undefined && String(value).trim() !== '';

export const minLength = (value, min) => String(value).trim().length >= min;

export const isDateRange = (desde, hasta) => new Date(desde) < new Date(hasta);
