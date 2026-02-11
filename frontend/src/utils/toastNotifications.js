import { toast } from 'react-toastify';

/**
 * Toast notification utility functions
 * Provides consistent patterns for success, error, info, and warning notifications
 */

/**
 * Default auto-close durations (in milliseconds)
 */
const AUTO_CLOSE = {
  SHORT: 2000,
  NORMAL: 3000,
  LONG: 4000,
  VERY_LONG: 5000,
  EXTRA_LONG: 10000,
};

/**
 * Extract error message from error object
 * @param {Error} err - Error object
 * @param {string} defaultMessage - Default message if no error message found
 * @returns {string} - Error message
 */
const extractErrorMessage = (err, defaultMessage = 'An error occurred') => {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message ||
    defaultMessage
  );
};

/**
 * Show success toast notification
 * @param {string} message - Success message
 * @param {Object} options - Toast options
 * @param {number} options.autoClose - Auto-close duration (default: 3000)
 * @param {string} options.position - Toast position (default: 'top-right')
 */
export const showSuccess = (message, options = {}) => {
  const { autoClose = AUTO_CLOSE.NORMAL, position = 'top-right', ...rest } = options;
  toast.success(message, {
    autoClose,
    position,
    ...rest,
  });
};

/**
 * Show error toast notification
 * @param {string|Error} messageOrError - Error message or Error object
 * @param {Object} options - Toast options
 * @param {number} options.autoClose - Auto-close duration (default: 4000)
 * @param {string} options.defaultMessage - Default message if error object provided
 */
export const showError = (messageOrError, options = {}) => {
  const { autoClose = AUTO_CLOSE.LONG, defaultMessage = 'An error occurred', ...rest } = options;
  const message = typeof messageOrError === 'string' 
    ? messageOrError 
    : extractErrorMessage(messageOrError, defaultMessage);
  
  toast.error(message, {
    autoClose,
    position: 'top-right',
    ...rest,
  });
};

/**
 * Show info toast notification
 * @param {string} message - Info message
 * @param {Object} options - Toast options
 * @param {number} options.autoClose - Auto-close duration (default: 5000 for processing messages)
 */
export const showInfo = (message, options = {}) => {
  const { autoClose = AUTO_CLOSE.VERY_LONG, ...rest } = options;
  toast.info(message, {
    autoClose,
    position: 'top-right',
    ...rest,
  });
};

/**
 * Show warning toast notification
 * @param {string} message - Warning message
 * @param {Object} options - Toast options
 * @param {number} options.autoClose - Auto-close duration (default: 3000)
 */
export const showWarning = (message, options = {}) => {
  const { autoClose = AUTO_CLOSE.NORMAL, ...rest } = options;
  toast.warning(message, {
    autoClose,
    position: 'top-right',
    ...rest,
  });
};

/**
 * Common success message templates
 */
export const successMessages = {
  created: (item) => `${item} created successfully!`,
  updated: (item) => `${item} updated successfully!`,
  deleted: (item) => `${item} deleted successfully!`,
  saved: (item) => `${item} saved successfully!`,
  published: (item) => `${item} published successfully!`,
  unpublished: (item) => `${item} unpublished successfully!`,
  activated: (item) => `${item} activated successfully!`,
  deactivated: (item) => `${item} deactivated successfully!`,
  removed: (item) => `${item} removed successfully!`,
  generated: (item) => `${item} generated successfully!`,
  regenerated: (item) => `${item} regenerated successfully!`,
  uploaded: (item) => `${item} uploaded successfully!`,
};

/**
 * Common error message templates
 */
export const errorMessages = {
  create: (item) => `Failed to create ${item}`,
  update: (item) => `Failed to update ${item}`,
  delete: (item) => `Failed to delete ${item}`,
  save: (item) => `Failed to save ${item}`,
  load: (item) => `Failed to load ${item}`,
  fetch: (item) => `Failed to fetch ${item}`,
  generate: (item) => `Failed to generate ${item}`,
  regenerate: (item) => `Failed to regenerate ${item}`,
  upload: (item) => `Failed to upload ${item}`,
  start: (item) => `Failed to start ${item}`,
  end: (item) => `Failed to end ${item}`,
};

/**
 * Common info message templates
 */
export const infoMessages = {
  processing: (item) => `Processing ${item}...`,
  generating: (item) => `Generating ${item}... This may take a moment.`,
  regenerating: (item) => `Regenerating ${item}...`,
  uploading: (item) => `Uploading ${item}...`,
  analyzing: (item) => `Analyzing ${item}...`,
  loading: (item) => `Loading ${item}...`,
};

/**
 * Common warning message templates
 */
export const warningMessages = {
  noContent: (item) => `${item} has no content. Please generate it first.`,
  empty: (item) => `${item} cannot be empty`,
  notFound: (item) => `${item} not found`,
  unavailable: (item) => `${item} is not available yet`,
  validation: (message) => `Validation error: ${message}`,
};

/**
 * Show success toast with template message
 * @param {string} template - Template key (e.g., 'created', 'updated')
 * @param {string} item - Item name (e.g., 'Story', 'Playlist')
 * @param {Object} options - Toast options
 */
export const showSuccessTemplate = (template, item, options = {}) => {
  const message = successMessages[template]?.(item) || `${item} ${template} successfully!`;
  showSuccess(message, options);
};

/**
 * Show error toast with template message or error object
 * @param {string|Error} templateOrError - Template key or Error object
 * @param {string} item - Item name (optional, only if template is string)
 * @param {Object} options - Toast options
 */
export const showErrorTemplate = (templateOrError, item = null, options = {}) => {
  if (typeof templateOrError === 'string') {
    const message = errorMessages[templateOrError]?.(item) || `Failed to ${templateOrError} ${item}`;
    showError(message, options);
  } else {
    // It's an error object
    showError(templateOrError, { defaultMessage: item ? errorMessages.load?.(item) : 'An error occurred', ...options });
  }
};

/**
 * Show info toast with template message
 * @param {string} template - Template key (e.g., 'processing', 'generating')
 * @param {string} item - Item name (e.g., 'Story', 'Audio')
 * @param {Object} options - Toast options
 */
export const showInfoTemplate = (template, item, options = {}) => {
  const message = infoMessages[template]?.(item) || `Processing ${item}...`;
  showInfo(message, options);
};

/**
 * Show warning toast with template message
 * @param {string} template - Template key (e.g., 'noContent', 'empty')
 * @param {string} item - Item name or message
 * @param {Object} options - Toast options
 */
export const showWarningTemplate = (template, item, options = {}) => {
  const message = warningMessages[template]?.(item) || item;
  showWarning(message, options);
};

/**
 * Handle API error and show appropriate toast
 * @param {Error} err - Error object
 * @param {Object} options - Options
 * @param {string} options.defaultMessage - Default error message
 * @param {string} options.item - Item name for template messages
 * @param {string} options.action - Action name (e.g., 'create', 'update')
 */
export const handleApiError = (err, options = {}) => {
  const { defaultMessage, item, action } = options;
  
  let message = extractErrorMessage(err, defaultMessage);
  
  // Use template if item and action provided
  if (item && action && !defaultMessage) {
    message = errorMessages[action]?.(item) || message;
  }
  
  showError(message, { autoClose: AUTO_CLOSE.LONG });
  return message;
};

/**
 * Show toast for CRUD operations
 */
export const crudToasts = {
  /**
   * Show success toast for create operation
   */
  created: (item, options = {}) => {
    showSuccessTemplate('created', item, options);
  },
  
  /**
   * Show success toast for update operation
   */
  updated: (item, options = {}) => {
    showSuccessTemplate('updated', item, options);
  },
  
  /**
   * Show success toast for delete operation
   */
  deleted: (item, options = {}) => {
    showSuccessTemplate('deleted', item, options);
  },
  
  /**
   * Show success toast for save operation
   */
  saved: (item, options = {}) => {
    showSuccessTemplate('saved', item, options);
  },
  
  /**
   * Handle error for create operation
   */
  createError: (err, item, options = {}) => {
    handleApiError(err, { item, action: 'create', ...options });
  },
  
  /**
   * Handle error for update operation
   */
  updateError: (err, item, options = {}) => {
    handleApiError(err, { item, action: 'update', ...options });
  },
  
  /**
   * Handle error for delete operation
   */
  deleteError: (err, item, options = {}) => {
    handleApiError(err, { item, action: 'delete', ...options });
  },
  
  /**
   * Handle error for save operation
   */
  saveError: (err, item, options = {}) => {
    handleApiError(err, { item, action: 'save', ...options });
  },
};

/**
 * Show toast for story-specific operations
 */
export const storyToasts = {
  /**
   * Story created successfully
   */
  created: (options = {}) => {
    showSuccess('Story created successfully! Generating audio narration...', {
      autoClose: AUTO_CLOSE.VERY_LONG,
      ...options,
    });
  },
  
  /**
   * Story regenerated successfully
   */
  regenerated: (options = {}) => {
    showSuccessTemplate('regenerated', 'Story', options);
  },
  
  /**
   * Audio generated successfully
   */
  audioGenerated: (options = {}) => {
    showSuccessTemplate('generated', 'Audio', options);
  },
  
  /**
   * Audio regenerated successfully
   */
  audioRegenerated: (options = {}) => {
    showSuccessTemplate('regenerated', 'Audio', options);
  },
  
  /**
   * Scenes generated successfully
   */
  scenesGenerated: (options = {}) => {
    showSuccessTemplate('generated', 'Scenes', options);
  },
  
  /**
   * Story published/unpublished
   */
  published: (isPublished, options = {}) => {
    showSuccessTemplate(isPublished ? 'published' : 'unpublished', 'Story', options);
  },
  
  /**
   * Story processing started
   */
  processing: (options = {}) => {
    showInfo('Creating your story with Amazon Nova AI... This may take a moment.', {
      autoClose: AUTO_CLOSE.VERY_LONG,
      ...options,
    });
  },
  
  /**
   * Image upload and analysis started
   */
  imageUploading: (options = {}) => {
    showInfo('Uploading image and analyzing with Titan...', {
      autoClose: AUTO_CLOSE.VERY_LONG,
      ...options,
    });
  },
  
  /**
   * Image uploaded and story regenerating
   */
  imageUploaded: (options = {}) => {
    showSuccess('Image uploaded! Story is being regenerated with Nova AI...', {
      autoClose: AUTO_CLOSE.LONG,
      ...options,
    });
  },
  
  /**
   * Audio file not found, regenerating
   */
  audioNotFound: (options = {}) => {
    showInfo('Audio file not found. Regenerating audio...', options);
  },
  
  /**
   * Story has no content
   */
  noContent: (options = {}) => {
    showWarningTemplate('noContent', 'Story', options);
  },
  
  /**
   * Audio not available
   */
  audioUnavailable: (options = {}) => {
    showWarningTemplate('unavailable', 'Audio narration', options);
  },
  
  /**
   * Handle story generation error
   */
  generationError: (err, options = {}) => {
    handleApiError(err, { item: 'Story', action: 'generate', defaultMessage: 'Failed to generate story', ...options });
  },
  
  /**
   * Handle audio generation error
   */
  audioError: (err, options = {}) => {
    handleApiError(err, { item: 'Audio', action: 'generate', defaultMessage: 'Failed to generate audio', ...options });
  },
  
  /**
   * Handle scene generation error
   */
  scenesError: (err, options = {}) => {
    showError(err, { defaultMessage: 'Failed to generate scenes', ...options });
  },
  
  /**
   * Scenes initialized successfully
   */
  scenesInitialized: (count, options = {}) => {
    showSuccess(`Successfully initialized ${count} scene(s)`, options);
  },
  
  /**
   * Scene image uploaded successfully
   */
  sceneImageUploaded: (options = {}) => {
    showSuccess('Scene image uploaded successfully!', options);
  },
  
  /**
   * Scene added successfully
   */
  sceneAdded: (sceneNumber, options = {}) => {
    showSuccess(`Scene ${sceneNumber} added successfully!`, options);
  },
  
  scenesError: (err, options = {}) => {
    handleApiError(err, { item: 'Scenes', action: 'generate', defaultMessage: 'Failed to generate scenes', ...options });
  },
};

/**
 * Show toast for validation errors
 */
export const validationToasts = {
  /**
   * Field is empty
   */
  empty: (field, options = {}) => {
    showWarning(`${field} cannot be empty`, options);
  },
  
  /**
   * File size too large
   */
  fileTooLarge: (maxSize = '10MB', options = {}) => {
    showError(`File size must be less than ${maxSize}`, options);
  },
  
  /**
   * Invalid file type
   */
  invalidFileType: (allowedTypes = 'image', options = {}) => {
    showError(`Please select a valid ${allowedTypes} file`, options);
  },
  
  /**
   * No file selected
   */
  noFileSelected: (fileType = 'file', options = {}) => {
    showError(`Please select a ${fileType}`, options);
  },
};

/**
 * Export AUTO_CLOSE constants for use in components
 */
export { AUTO_CLOSE };

