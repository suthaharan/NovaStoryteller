export const toggleDocumentAttribute = (attribute, value, remove, tag = 'html') => {
  try {
    const element = document.getElementsByTagName(tag.toString())[0];
    if (element) {
      const hasAttribute = element.getAttribute(attribute);
      if (remove && hasAttribute) {
        element.removeAttribute(attribute);
      } else {
        element.setAttribute(attribute, value);
      }
    }
  } catch (error) {
    // Silently fail if document is not ready
  }
};