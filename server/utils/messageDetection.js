// Normalize message for detection
export const normalizeMessage = (text) => {
  if (!text) return '';
  
  // Remove emojis
  let normalized = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  
  // Remove punctuation except spaces
  normalized = normalized.replace(/[^\w\s]/g, '');
  
  // Convert to lowercase and trim extra spaces
  normalized = normalized.toLowerCase().trim().replace(/\s+/g, ' ');
  
  return normalized;
};

// Detect special trigger
export const detectSpecialTrigger = (text) => {
  const normalized = normalizeMessage(text);
  
  // Good Night triggers
  const goodNightPatterns = [
    'good night',
    'goodnight',
    'gn',
    'nighty night',
    'night night'
  ];
  
  // Good Morning triggers
  const goodMorningPatterns = [
    'good morning',
    'goodmorning',
    'gm',
    'morning'
  ];
  
  // Hi/Hello triggers
  const hiHelloPatterns = [
    /^hi+$/,           // hi, hii, hiii, etc.
    /^hello+$/,        // hello, hellooo, etc.
    /^hey+$/,          // hey, heyy, etc.
    /^hiya+$/,         // hiya
    'sup',
    'heya',
    'yo'
  ];
  
  // Check Good Night
  for (const pattern of goodNightPatterns) {
    if (normalized === pattern || normalized.startsWith(pattern + ' ')) {
      return 'good-night';
    }
  }
  
  // Check Good Morning
  for (const pattern of goodMorningPatterns) {
    if (normalized === pattern || normalized.startsWith(pattern + ' ')) {
      return 'good-morning';
    }
  }
  
  // Check Hi/Hello
  for (const pattern of hiHelloPatterns) {
    if (typeof pattern === 'string') {
      if (normalized === pattern || normalized.startsWith(pattern + ' ')) {
        return 'hi-hello';
      }
    } else {
      // Regex pattern
      if (pattern.test(normalized)) {
        return 'hi-hello';
      }
    }
  }
  
  return null;
};