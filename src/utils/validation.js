// Simple form validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

export const validateDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

export const getFieldError = (value, rules) => {
  if (!rules) return null;

  // Required check
  if (rules.required && !validateRequired(value)) {
    return rules.requiredMessage || 'This field is required';
  }

  // Email check
  if (rules.email && !validateEmail(value)) {
    return rules.emailMessage || 'Please enter a valid email address';
  }

  // Password check
  if (rules.password && !validatePassword(value)) {
    return rules.passwordMessage || 'Password must be at least 6 characters';
  }

  // Number check
  if (rules.number) {
    if (!validateNumber(value, rules.min, rules.max)) {
      if (rules.min !== null && rules.max !== null) {
        return rules.numberMessage || `Please enter a number between ${rules.min} and ${rules.max}`;
      }
      if (rules.min !== null) {
        return rules.numberMessage || `Please enter a number greater than or equal to ${rules.min}`;
      }
      if (rules.max !== null) {
        return rules.numberMessage || `Please enter a number less than or equal to ${rules.max}`;
      }
      return rules.numberMessage || 'Please enter a valid number';
    }
  }

  // Date check
  if (rules.date && !validateDate(value)) {
    return rules.dateMessage || 'Please enter a valid date';
  }

  // Custom validation
  if (rules.custom && typeof rules.custom === 'function') {
    const customError = rules.custom(value);
    if (customError) return customError;
  }

  return null;
};

export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;

  Object.keys(schema).forEach((field) => {
    const value = formData[field];
    const rules = schema[field];
    const error = getFieldError(value, rules);

    if (error) {
      errors[field] = error;
      isValid = false;
    }
  });

  return { errors, isValid };
};

export default {
  validateEmail,
  validatePassword,
  validateRequired,
  validateNumber,
  validateDate,
  getFieldError,
  validateForm,
};



