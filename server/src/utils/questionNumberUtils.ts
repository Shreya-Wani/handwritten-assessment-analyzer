/**
 * Utility to normalize question numbers from OCR text.
 * Strips formatting so that "Q. 3 (b)", "Ans11(a)", and "3 (b)" all resolve to identical keys.
 */
export function normalizeQuestionNumber(raw: string | null | undefined): string {
  if (!raw) return '';
  
  // Convert to lowercase
  let norm = raw.toLowerCase();
  
  // Remove "q", "q.", "ans", "ans.", "sol", "solution" from the beginning
  norm = norm.replace(/^(?:q(?:ues)?|a(?:ns)?|sol(?:ution)?)\.?\s*/i, '');
  
  // Remove all internal whitespace
  norm = norm.replace(/\s+/g, '');
  
  // Remove trailing or leading dots (e.g. "1." -> "1")
  norm = norm.replace(/^\./, '');
  norm = norm.replace(/\.$/, '');
  
  return norm;
}
