/**
 * Capitalizes the first letter of each word and lowercases the rest.
 * Suitable for Names and Titles.
 */
function toTitleCase(str) {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Normalizes sentences (capitalizes first letter, resolves double spacing, fixes punctuation spacing).
 * Suitable for descriptions and reasons.
 * Accurately keeps proper nouns (like Delhi) and acronyms (like NGO) capitalized while fixing mixed case (like pArK).
 */
function toSentenceCase(str) {
  if (!str) return "";
  
  // Normalize consecutive spaces to a single space
  let cleaned = str.replace(/\s+/g, " ").trim();
  
  // Fix spaces before common punctuation (, . ! ? ; :)
  cleaned = cleaned.replace(/\s+([.,!?;:])/g, "$1");
  
  // Fix mixed case words (e.g. pArK -> park, dElHi -> delhi) but keep pure acronyms (e.g. NGO)
  const words = cleaned.split(" ");
  const formattedWords = words.map((word) => {
    if (word.length <= 1) return word;
    
    const rest = word.slice(1);
    const hasInternalUpper = /[A-Z]/.test(rest);
    const isEntirelyUpper = word === word.toUpperCase();
    
    if (hasInternalUpper && !isEntirelyUpper) {
      return word.toLowerCase();
    }
    return word;
  });
  cleaned = formattedWords.join(" ");

  // Capitalize first letter of each sentence
  return cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, char) => {
    return separator + char.toUpperCase();
  });
}

module.exports = {
  toTitleCase,
  toSentenceCase,
};
