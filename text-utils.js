/**
 * Text Processing Utilities for QuillSync AI
 * This module provides functions for text manipulation, chunking, and analysis
 */

// IMPORTANT: Define TextUtils directly on window object
window.TextUtils = {
  /**
   * Count words in a text
   * @param {string} text - The text to count words in
   * @returns {number} Number of words
   */
  countWords: function(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(function(word) { return word !== ''; }).length;
  },
  
  /**
   * Estimate reading time in minutes
   * @param {string} text - The text to estimate reading time for
   * @param {number} wordsPerMinute - Reading speed in words per minute
   * @returns {number} Estimated reading time in minutes
   */
  estimateReadingTime: function(text, wordsPerMinute) {
    if (wordsPerMinute === undefined) wordsPerMinute = 200;
    var words = this.countWords(text);
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  },
  
  /**
   * Split text into chunks based on chapter titles
   * @param {string} text - The text to split
   * @returns {string[]} Array of chunks
   */
  splitByChapters: function(text) {
    if (!text || typeof text !== 'string') return [];
    
    var chapterTitleRegex = /第\d+章\s.+/g;
    var matches = Array.from(text.matchAll(chapterTitleRegex));
    var chunks = [];
    
    if (matches.length === 0) {
      chunks.push(text.trim());
    } else {
      var lastIndex = 0;
      
      // Check if there's content before the first chapter
      if (matches[0].index > 0) {
        var firstChunk = text.substring(0, matches[0].index).trim();
        if (firstChunk) chunks.push(firstChunk);
      }
      
      // Process each chapter
      for (var i = 0; i < matches.length; i++) {
        var start = matches[i].index;
        var end = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
        var chunk = text.substring(start, end).trim();
        
        if (chunk) {
          chunks.push(chunk);
        }
        
        lastIndex = end;
      }
      
      // Check if there's content after the last chapter
      if (lastIndex < text.length) {
        var lastChunk = text.substring(lastIndex).trim();
        if (lastChunk) {
          chunks.push(lastChunk);
        }
      }
    }
    
    return chunks;
  },
  
  /**
   * Split text by word count
   * @param {string} text - The text to split
   * @param {number} wordLimit - Maximum words per chunk
   * @returns {string[]} Array of chunks
   */
  splitByWordCount: function(text, wordLimit) {
    if (wordLimit === undefined) wordLimit = 1000;
    if (!text || typeof text !== 'string') return [];
    
    var paragraphs = text.split(/\n\s*\n/);
    var chunks = [];
    var currentChunk = [];
    var currentWordCount = 0;
    
    for (var i = 0; i < paragraphs.length; i++) {
      var paragraph = paragraphs[i];
      var paragraphWordCount = this.countWords(paragraph);
      
      // If a single paragraph exceeds the word limit, split it by sentences
      if (paragraphWordCount > wordLimit) {
        var sentences = paragraph.split(/(?<=[.!?。？！])\s+/);
        var sentenceChunk = [];
        var sentenceWordCount = 0;
        
        for (var j = 0; j < sentences.length; j++) {
          var sentence = sentences[j];
          var sentenceWords = this.countWords(sentence);
          
          if (sentenceWordCount + sentenceWords <= wordLimit) {
            sentenceChunk.push(sentence);
            sentenceWordCount += sentenceWords;
          } else {
            chunks.push(sentenceChunk.join(' '));
            sentenceChunk = [sentence];
            sentenceWordCount = sentenceWords;
          }
        }
        
        if (sentenceChunk.length > 0) {
          if (currentChunk.length === 0) {
            chunks.push(sentenceChunk.join(' '));
          } else {
            currentChunk.push(sentenceChunk.join(' '));
            chunks.push(currentChunk.join('\n\n'));
            currentChunk = [];
            currentWordCount = 0;
          }
        }
      } 
      // For normal paragraphs, add to current chunk if within word limit
      else if (currentWordCount + paragraphWordCount <= wordLimit) {
        currentChunk.push(paragraph);
        currentWordCount += paragraphWordCount;
      } 
      // Otherwise, start a new chunk
      else {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join('\n\n'));
        }
        currentChunk = [paragraph];
        currentWordCount = paragraphWordCount;
      }
    }
    
    // Add any remaining content
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
    }
    
    return chunks;
  },
  
  /**
   * Auto-detect the best chunking strategy
   * @param {string} text - The text to analyze
   * @returns {string[]} Array of chunks
   */
  autoChunk: function(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Check if the text contains chapter titles
    var chapterTitleRegex = /第\d+章\s.+/g;
    var hasChapterTitles = chapterTitleRegex.test(text);
    
    // If there are chapter titles, use chapter-based chunking
    if (hasChapterTitles) {
      return this.splitByChapters(text);
    }
    
    // If the text is longer than 2000 words, use word count chunking
    var totalWords = this.countWords(text);
    if (totalWords > 2000) {
      return this.splitByWordCount(text);
    }
    
    // Otherwise, keep it as a single chunk
    return [text];
  },
  
  /**
   * Apply glossary replacements to text
   * @param {string} text - The text to process
   * @param {Array} glossaryEntries - Array of glossary entries
   * @returns {string} Processed text
   */
  applyGlossary: function(text, glossaryEntries) {
    if (!text || typeof text !== 'string' || !Array.isArray(glossaryEntries)) return text;
    
    var processedText = text;
    
    // Sort entries by Chinese term length (longest first) to prevent partial replacements
    var sortedEntries = glossaryEntries.slice().sort(function(a, b) {
      return b.chineseTerm.length - a.chineseTerm.length;
    });
    
    // Replace each term
    for (var i = 0; i < sortedEntries.length; i++) {
      var entry = sortedEntries[i];
      if (!entry.chineseTerm || !entry.translation) continue;
      
      // Create a regex that matches the Chinese term exactly
      var regex = new RegExp(entry.chineseTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedText = processedText.replace(regex, entry.translation);
    }
    
    return processedText;
  },
  
  /**
   * Generate a prompt for OpenRouter API
   * @param {string} text - The text to translate
   * @param {string} customInstructions - Custom instructions to include
   * @returns {string} Formatted prompt
   */
  generateTranslationPrompt: function(text, customInstructions) {
    if (customInstructions === undefined) customInstructions = '';
    
    var prompt = 'Translate this Chinese text to English:';
    
    if (customInstructions) {
      prompt = customInstructions + '\n\n' + prompt;
    }
    
    return prompt + '\n\n' + text;
  },
  
  /**
   * Generate a verification prompt for OpenRouter API
   * @param {string} sourceText - Original Chinese text
   * @param {string} translatedText - English translation
   * @param {Array} glossaryEntries - Array of glossary entries
   * @returns {string} Formatted verification prompt
   */
  generateVerificationPrompt: function(sourceText, translatedText, glossaryEntries) {
    if (glossaryEntries === undefined) glossaryEntries = [];
    
    var glossarySection = '';
    
    if (glossaryEntries.length > 0) {
      glossarySection = 'Glossary Terms to Check:\n' +
        glossaryEntries
          .map(function(entry) { return entry.chineseTerm + ': ' + entry.translation; })
          .join('\n');
    }
    
    return 'I\'ll provide you with a Chinese text and its English translation.\n' +
      '\n' +
      'Please verify the translation and check for:\n' +
      '\n' +
      '1. Completeness: Ensure all content from the source is present in the translation.\n' +
      '2. Accuracy: Check if the meaning is conveyed correctly.\n' +
      '3. Glossary compliance: Verify if specific terms are translated consistently, based on this glossary.\n' +
      '\n' +
      'Respond in JSON format with the following structure:\n' +
      '{\n' +
      '  "completeness": 0-100 (percentage of content translated),\n' +
      '  "accuracy": 0-100 (estimated accuracy),\n' +
      '  "missingContent": ["List of sections/sentences missing"],\n' +
      '  "issues": [{\n' +
      '    "sourceText": "Original text",\n' +
      '    "translatedText": "Problematic translation",\n' +
      '    "issue": "Description of the issue",\n' +
      '    "suggestion": "Suggested correction"\n' +
      '  }]\n' +
      '}\n' +
      '\n' +
      'Chinese Text:\n' +
      sourceText + '\n' +
      '\n' +
      'English Translation:\n' +
      translatedText + '\n' +
      '\n' +
      glossarySection;
  },
  
  /**
   * Generate a glossary generation prompt for OpenRouter API
   * @param {string} text - The text to analyze
   * @param {string} fandomContext - Optional fandom context (e.g., "Naruto", "Xianxia")
   * @returns {string} Formatted prompt
   */
  generateGlossaryPrompt: function(text, fandomContext = '') {
    const fandomInfo = fandomContext ? 
      `\n\nIMPORTANT CONTEXT: This text is from the "${fandomContext}" fandom/universe. Use this context to identify special terms, names, locations, and concepts specific to this setting.` : '';
    
    return `You are a highly specialized glossary extraction expert for Chinese to English translation. Your ONLY output MUST be a valid JSON array. No explanations, markdown, or any other text.

TASK:
Extract proper nouns, terminology, and recurring phrases from this Chinese text that would need consistent translation. Chinese names, locations, titles, and setting-specific terms are particularly important.${fandomInfo}

RULES:
1. Focus on proper nouns, special terminology, and phrases that would be confusing if translated inconsistently.
2. For characters, extract full names and individual name components (given name, family name, titles, etc.).
3. If the same concept appears in different forms, include each variant.
4. Special care for: character names, locations, cultivation techniques, mythological concepts, ranks/titles.
5. Include terms even if you're unsure of the perfect translation - these are more critical for consistency.
6. Do NOT include common words or phrases unless they have special meaning in context.

REQUIRED OUTPUT FORMAT:
A valid, properly formatted JSON array where each item is an object with these fields:
- "chineseTerm": The original Chinese term (REQUIRED)
- "translation": Your suggested English translation (REQUIRED)
- "category": One of: "character", "location", "technique", "item", "concept", "title", "organization", or "other" (REQUIRED)
- "notes": Brief context or explanation (OPTIONAL)

EXAMPLE (do NOT include this in your output):
[
  {"chineseTerm": "林动", "translation": "Lin Dong", "category": "character", "notes": "Main protagonist"},
  {"chineseTerm": "元婴期", "translation": "Yuan Ying Stage", "category": "concept", "notes": "Cultivation stage"}
]

CRITICAL: 
- Verify your output is valid JSON with balanced brackets and proper comma use
- Do NOT include code blocks like \`\`\`json\`\`\` around the output
- Provide ONLY the JSON array as your complete answer

Now analyze this text:
${text.substring(0, 5000)}`;
  },

  /**
   * Generate a prompt for verifying and correcting glossary JSON
   * @param {string} glossaryJson - Raw JSON string from initial generation
   * @returns {string} Formatted verification prompt
   */
  generateGlossaryVerificationPrompt: function(glossaryJson) {
    return `You are a specialized JSON validator for glossary entries. You must fix this JSON array of glossary entries to ensure it is valid and properly formatted.

CRITICAL REQUIREMENTS:
1. Your ONLY output MUST be the corrected, valid JSON array - no explanations, no markdown, just the fixed JSON
2. Ensure all JSON syntax is valid: balanced brackets, correct commas, properly quoted strings
3. Each entry MUST have these fields:
   - "chineseTerm": string (REQUIRED)
   - "translation": string (REQUIRED)
   - "category": string (one of: "character", "location", "technique", "item", "concept", "title", "organization", "other") (REQUIRED)
   - "notes": string (can be empty) (REQUIRED)
4. If an entry is missing required fields, add them with suitable default values
5. If the input is severely malformed beyond repair, return a minimal valid array: [{"chineseTerm": "错误", "translation": "Error", "category": "other", "notes": "Glossary generation failed"}]

PROCESS:
1. Extract any JSON-like structure in the input
2. Fix syntax errors (brackets, commas, quotes)
3. Check and correct each entry for required fields
4. Return only the corrected JSON array

Here is the JSON to fix:
${glossaryJson}`;
  }
};

// Log that TextUtils has been properly initialized
console.log('TextUtils initialized and attached to window object');