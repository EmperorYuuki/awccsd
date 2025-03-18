/**
 * Enhanced Anime Guide Chat Service for QuillSync AI
 * This module provides an AI-powered assistant with deep integration to glossary and chapter fetcher
 */

window.AnimeGuideChatService = {
    // Chat history storage
    chatHistory: [],
    
    // Chat suggestions based on context
    defaultSuggestions: [
      { text: "What can you help me with?", type: "general" },
      { text: "Help me configure a website", type: "command" },
      { text: "Generate glossary from my text", type: "command" }
    ],
    
    // Context-aware suggestions
    contextSuggestions: {
      glossary: [
        { text: "Extract terms from my text", type: "command" },
        { text: "Help me organize my glossary", type: "help" },
        { text: "Import/export glossary terms", type: "help" }
      ],
      chapters: [
        { text: "Add a new website to fetch from", type: "command" },
        { text: "Detect selectors from HTML", type: "command" },
        { text: "Find the next chapter", type: "command" }
      ],
      translator: [
        { text: "Translate this Chinese text", type: "command" },
        { text: "What chunking strategy is best?", type: "help" },
        { text: "Improve translation quality", type: "help" }
      ],
      settings: [
        { text: "Which model should I use?", type: "help" },
        { text: "Configure OpenRouter API", type: "help" },
        { text: "Optimize my settings", type: "command" }
      ]
    },
    
    // AI personality settings
    personality: {
      name: "Quill-chan",
      traits: ["helpful", "knowledgeable", "friendly", "efficient"],
      speakingStyle: "friendly but professional, using occasional anime-inspired emoticons"
    },
    
    // Initialize the chat service
    initialize: function() {
      this.setupChatUI();
      this.loadChatHistory();
      this.setupEventListeners();
      console.log('Enhanced AnimeGuideChatService initialized');
      
      // Initialize with welcome message if history is empty
      if (this.chatHistory.length === 0) {
        this.addAssistantMessage(
          "Hi there! I'm Quill-chan, your translation assistant! I can help you manage your glossary, configure websites for chapter fetching, and assist with translations. What would you like help with today? (◠‿◠)"
        );
      } else {
        // Render existing chat history
        this.renderChatHistory();
      }
    },
    
    // Set up the chat UI components
    setupChatUI: function() {
      try {
        // Set character style from settings
        const chatAvatar = document.querySelector('.anime-guide-chat .avatar-image');
        const miniAvatar = document.querySelector('.anime-guide-chat .mini-avatar');
        
        if (chatAvatar && window.AnimeGuideService?.settings) {
          chatAvatar.dataset.style = window.AnimeGuideService.settings.style || 'kawaii';
          chatAvatar.dataset.hairColor = this._getHairColorName(window.AnimeGuideService.settings.hairColor);
        }
        
        if (miniAvatar && window.AnimeGuideService?.settings) {
          miniAvatar.dataset.style = window.AnimeGuideService.settings.style || 'kawaii';
          miniAvatar.dataset.hairColor = this._getHairColorName(window.AnimeGuideService.settings.hairColor);
        }
        
        // Update character name from settings
        const nameDisplay = document.querySelector('.character-name');
        if (nameDisplay && window.AnimeGuideService?.settings) {
          nameDisplay.textContent = window.AnimeGuideService.settings.name || 'Quill-chan';
          this.personality.name = window.AnimeGuideService.settings.name || 'Quill-chan';
        }
        
        // Show default suggestions
        this.updateSuggestions(this.defaultSuggestions);
      } catch (error) {
        console.error('Error setting up chat UI:', error);
      }
    },
    
    // Helper function to get hair color name
    _getHairColorName: function(color) {
      if (!color) return 'pink';
      
      const colorMap = {
        '#ff69b4': 'pink',
        '#4169e1': 'blue',
        '#9370db': 'purple',
        '#ff4500': 'red',
        '#32cd32': 'green',
        '#ffd700': 'yellow'
      };
      
      return colorMap[color] || 'custom';
    },
    
    // Set up event listeners for chat functionality
    setupEventListeners: function() {
      try {
        // Chat open/close buttons
        const openChatBtn = document.getElementById('open-chat-btn');
        const closeChatBtn = document.getElementById('close-chat-btn');
        const minimizeChatBtn = document.getElementById('minimize-chat-btn');
        const expandChatBtn = document.getElementById('expand-chat-btn');
        
        if (openChatBtn) {
          openChatBtn.addEventListener('click', () => {
            this.openChat();
          });
        }
        
        if (closeChatBtn) {
          closeChatBtn.addEventListener('click', () => {
            this.closeChat();
          });
        }
        
        if (minimizeChatBtn) {
          minimizeChatBtn.addEventListener('click', () => {
            this.minimizeChat();
          });
        }
        
        if (expandChatBtn) {
          expandChatBtn.addEventListener('click', () => {
            this.toggleExpandChat();
          });
        }
        
        // Send message on button click or Enter key
        const sendChatBtn = document.getElementById('send-chat-btn');
        const chatInput = document.getElementById('chat-input');
        
        if (sendChatBtn) {
          sendChatBtn.addEventListener('click', () => {
            this.sendUserMessage();
          });
        }
        
        if (chatInput) {
          chatInput.addEventListener('keydown', (e) => {
            // Send on Enter (without shift)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              this.sendUserMessage();
            }
            
            // Adjust textarea height based on content
            setTimeout(() => {
              chatInput.style.height = 'auto';
              chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
            }, 0);
          });
          
          // Reset height on empty input
          chatInput.addEventListener('input', () => {
            if (!chatInput.value.trim()) {
              chatInput.style.height = '45px';
            }
          });
        }
        
        // Listen for tab changes to update suggestions
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
          button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            this.updateContextSuggestions(tabId);
          });
        });
        
        // Handle suggestion clicks
        document.addEventListener('click', (e) => {
          if (e.target.classList.contains('suggestion-chip')) {
            const suggestionText = e.target.textContent;
            if (chatInput) {
              chatInput.value = suggestionText;
              chatInput.focus();
            }
          }
        });
      } catch (error) {
        console.error('Error setting up event listeners:', error);
      }
    },
    
    // Open the chat panel
    openChat: function() {
      const chatPanel = document.getElementById('anime-guide-chat');
      if (chatPanel) {
        chatPanel.classList.remove('collapsed');
        
        // Focus input field
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          setTimeout(() => chatInput.focus(), 300);
        }
        
        // Scroll to bottom
        this.scrollToBottom();
      }
    },
    
    // Close the chat panel completely
    closeChat: function() {
      const chatPanel = document.getElementById('anime-guide-chat');
      if (chatPanel) {
        chatPanel.classList.add('collapsed');
        chatPanel.classList.remove('expanded');
      }
    },
    
    // Minimize the chat panel
    minimizeChat: function() {
      this.closeChat();
    },
    
    // Toggle expanded chat view
    toggleExpandChat: function() {
      const chatPanel = document.getElementById('anime-guide-chat');
      if (chatPanel) {
        chatPanel.classList.toggle('expanded');
        
        // Scroll to bottom when expanded
        if (chatPanel.classList.contains('expanded')) {
          this.scrollToBottom();
        }
      }
    },
    
    // Send a user message
    sendUserMessage: async function() {
      const chatInput = document.getElementById('chat-input');
      if (!chatInput) return;
      
      const message = chatInput.value.trim();
      if (!message) return;
      
      // Add user message to UI
      this.addUserMessage(message);
      
      // Clear input field
      chatInput.value = '';
      chatInput.style.height = '45px';
      
      // Show typing indicator
      this.showTypingIndicator();
      
      try {
        // Process the message
        const response = await this.processUserMessage(message);
        
        // Remove typing indicator and add response
        this.hideTypingIndicator();
        this.addAssistantMessage(response);
        
        // Update suggestions based on conversation content
        this.updateSuggestionsAfterResponse(message, response);
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Remove typing indicator and add error message
        this.hideTypingIndicator();
        this.addAssistantMessage(
          "I'm sorry, I encountered an error while processing your request. Please try again or ask something else!"
        );
      }
    },
    
    // Process user message and generate a response
    processUserMessage: async function(message) {
      // Check if it's a command first
      if (this.isCommand(message)) {
        return await this.executeCommand(message);
      }
      
      // Get current application context
      const context = this.getApplicationContext();
      
      // Construct prompt for AI
      const prompt = this.constructPrompt(message, context);
      
      // Use OpenRouter if available, otherwise use predefined responses
      if (window.OpenRouterService && this.canUseAI()) {
        try {
          return await this.getAIResponse(prompt);
        } catch (error) {
          console.error('Error getting AI response:', error);
          return this.getFallbackResponse(message, context);
        }
      } else {
        return this.getFallbackResponse(message, context);
      }
    },
    
    // Check if the message is a command
    isCommand: function(message) {
      const commandPrefixes = [
        "add website", "configure website", "detect", "extract", 
        "add glossary", "generate glossary", "translate", 
        "analyze", "find chapter", "fetch chapter"
      ];
      
      const lowerMessage = message.toLowerCase();
      return commandPrefixes.some(prefix => 
        lowerMessage.includes(prefix) || lowerMessage.startsWith(prefix)
      );
    },
    
    // Execute a command based on user message
    executeCommand: async function(message) {
      const lowerMessage = message.toLowerCase();
      
      // Website configuration commands
      if (lowerMessage.includes("add website") || lowerMessage.includes("configure website")) {
        if (lowerMessage.includes("http")) {
          // Extract URL
          const urlMatch = message.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            return await this.handleWebsiteConfiguration(urlMatch[0], message);
          }
        }
        return "To add a website, please provide a URL. For example: 'Add website https://example.com/novel/123'";
      }
      
      // HTML detection commands
      if (lowerMessage.includes("detect") && lowerMessage.includes("selector")) {
        // Check if the message contains HTML content
        if (message.includes("<html") || message.includes("<body") || 
            message.includes("<div") || message.includes("<p>")) {
          return await this.detectSelectorsFromHTML(message);
        }
        return "Please provide the website's HTML content so I can detect the selectors. You can copy the entire page's HTML using browser developer tools.";
      }
      
      // Regex detection commands
      if (lowerMessage.includes("detect pattern") || lowerMessage.includes("extract regex")) {
        if (lowerMessage.includes("http")) {
          // Extract URL
          const urlMatch = message.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            return await this.detectWebsitePattern(urlMatch[0]);
          }
        }
        return "Please provide a URL for pattern detection. For example: 'Detect pattern from https://example.com/novel/123'";
      }
      
      // Glossary commands
      if (lowerMessage.includes("generate glossary")) {
        return await this.handleGlossaryGeneration();
      }
      
      if (lowerMessage.includes("add glossary")) {
        // Check if there's Chinese text
        if (/[\u4e00-\u9fa5]/.test(message)) {
          return await this.addToGlossary(message);
        }
        return "Please provide the Chinese term you'd like to add to the glossary. For example: 'Add glossary term 魔法 as magic'";
      }
      
      // Translation commands
      if (lowerMessage.includes("translate")) {
        if (/[\u4e00-\u9fa5]/.test(message)) {
          return await this.quickTranslate(message);
        }
        return "Please provide Chinese text to translate. For example: 'Translate 你好'";
      }
      
      // Chapter commands
      if (lowerMessage.includes("find chapter") || lowerMessage.includes("extract chapter")) {
        if (lowerMessage.includes("http")) {
          // Extract URL
          const urlMatch = message.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            return await this.extractChapter(urlMatch[0]);
          }
        }
        return "Please provide a URL to find or extract a chapter. For example: 'Find chapter from https://example.com/novel/123'";
      }
      
      // Default response if command not recognized
      return "I'm not sure how to execute that command. Could you please be more specific?";
    },
    
    // Handle website configuration with URL
    handleWebsiteConfiguration: async function(url, fullMessage) {
      try {
        // First try to extract any HTML content from the message
        const htmlContent = this.extractHTMLFromMessage(fullMessage);
        
        if (htmlContent) {
          // We have both URL and HTML, so we can detect everything
          return await this.configureWebsiteWithHTML(url, htmlContent);
        } else {
          // We only have the URL, analyze the pattern
          return "I'll help you add this website! Let me analyze the URL pattern...\n\n" +
                 "For " + url + ", here's what I detected:\n\n" +
                 "Base URL: " + new URL(url).origin + "\n" +
                 "URL Pattern: " + this.generateRegexPattern(url) + "\n\n" +
                 "To complete the configuration, I need the website's HTML to detect selectors. Please copy the page's HTML using browser developer tools and send it to me with: 'Detect selectors from this HTML: [paste HTML here]'";
        }
      } catch (error) {
        console.error('Error handling website configuration:', error);
        return "I had trouble analyzing that URL. Please make sure it's a valid website address.";
      }
    },
    
    // Extract HTML content from a message
    extractHTMLFromMessage: function(message) {
      // Look for HTML content between tags or after a marker
      const htmlStartIndex = message.indexOf('<html');
      if (htmlStartIndex !== -1) {
        return message.substring(htmlStartIndex);
      }
      
      // Try other common HTML elements
      const bodyStartIndex = message.indexOf('<body');
      if (bodyStartIndex !== -1) {
        return '<html>' + message.substring(bodyStartIndex);
      }
      
      // Check for content after HTML marker
      const htmlMarker = message.match(/html:\s*(.*)/i);
      if (htmlMarker && htmlMarker[1]) {
        return htmlMarker[1];
      }
      
      // Look for multiple HTML tags as a sign of HTML content
      const tagMatches = message.match(/<div|<p|<span|<h\d|<ul|<table/g);
      if (tagMatches && tagMatches.length > 3) {
        // Probably HTML content, find where it starts
        const firstTagIndex = message.indexOf(tagMatches[0]);
        if (firstTagIndex !== -1) {
          return message.substring(firstTagIndex);
        }
      }
      
      return null;
    },
    
    // Configure website with URL and HTML
    configureWebsiteWithHTML: async function(url, htmlContent) {
      try {
        // Detect URL pattern
        const urlPattern = this.generateRegexPattern(url);
        const baseUrl = new URL(url).origin;
        
        // Use AI to detect selectors from HTML
        const selectors = await this.detectSelectorsUsingAI(htmlContent, url);
        
        // Create config
        const websiteConfig = {
          name: this.generateWebsiteName(url),
          baseUrl: baseUrl,
          urlPattern: urlPattern,
          selectors: selectors
        };
        
        // Save the configuration
        if (window.ChapterFetcherService && typeof window.ChapterFetcherService.addWebsiteConfiguration === 'function') {
          try {
            await window.ChapterFetcherService.addWebsiteConfiguration(websiteConfig);
            
            return "✅ Success! I've added the website configuration:\n\n" +
                   `Name: ${websiteConfig.name}\n` +
                   `Base URL: ${websiteConfig.baseUrl}\n` +
                   `URL Pattern: ${websiteConfig.urlPattern}\n\n` +
                   `Chapter Title Selector: ${websiteConfig.selectors.chapterTitle}\n` +
                   `Chapter Content Selector: ${websiteConfig.selectors.chapterContent}\n` +
                   `Prev Chapter Selector: ${websiteConfig.selectors.prevChapter || 'Not found'}\n` +
                   `Next Chapter Selector: ${websiteConfig.selectors.nextChapter || 'Not found'}\n\n` +
                   "You can now fetch chapters from this website! If the selectors don't work correctly, you can edit them in the Chapters > Website Config tab.";
          } catch (error) {
            console.error('Error saving website configuration:', error);
            return "I detected these selectors, but couldn't save the configuration automatically:\n\n" +
                   `Name: ${websiteConfig.name}\n` +
                   `Base URL: ${websiteConfig.baseUrl}\n` +
                   `URL Pattern: ${websiteConfig.urlPattern}\n\n` +
                   `Chapter Title Selector: ${websiteConfig.selectors.chapterTitle}\n` +
                   `Chapter Content Selector: ${websiteConfig.selectors.chapterContent}\n` +
                   `Prev Chapter Selector: ${websiteConfig.selectors.prevChapter || 'Not found'}\n` +
                   `Next Chapter Selector: ${websiteConfig.selectors.nextChapter || 'Not found'}\n\n` +
                   "Please go to Chapters > Website Config tab and add these manually.";
          }
        } else {
          return "I detected these selectors, but couldn't access the Chapter Fetcher service:\n\n" +
                 `Name: ${websiteConfig.name}\n` +
                 `Base URL: ${websiteConfig.baseUrl}\n` +
                 `URL Pattern: ${websiteConfig.urlPattern}\n\n` +
                 `Chapter Title Selector: ${websiteConfig.selectors.chapterTitle}\n` +
                 `Chapter Content Selector: ${websiteConfig.selectors.chapterContent}\n` +
                 `Prev Chapter Selector: ${websiteConfig.selectors.prevChapter || 'Not found'}\n` +
                 `Next Chapter Selector: ${websiteConfig.selectors.nextChapter || 'Not found'}\n\n` +
                 "Please go to Chapters > Website Config tab and add these manually.";
        }
      } catch (error) {
        console.error('Error configuring website with HTML:', error);
        return "I had trouble analyzing the HTML content. Please make sure the HTML is valid and contains chapter content.";
      }
    },
    
    // Generate a website name from URL
    generateWebsiteName: function(url) {
      try {
        const parsedUrl = new URL(url);
        let hostname = parsedUrl.hostname;
        
        // Remove www. if present
        hostname = hostname.replace(/^www\./, '');
        
        // Use only domain name without TLD
        const domainParts = hostname.split('.');
        if (domainParts.length > 1) {
          hostname = domainParts[0];
        }
        
        // Capitalize first letter
        return hostname.charAt(0).toUpperCase() + hostname.slice(1);
      } catch (error) {
        // Fallback
        return "Novel Site " + Math.floor(Math.random() * 1000);
      }
    },
    
    // Detect selectors from HTML using AI
    detectSelectorsUsingAI: async function(htmlContent, url) {
      if (!this.canUseAI()) {
        // Fallback to simple detection
        return this.detectSelectorsSimple(htmlContent);
      }
      
      try {
        // Use OpenRouter AI to analyze the HTML
        const model = this.getOpenRouterModel();
        
        const prompt = `
  You are an expert web scraper and you need to detect CSS selectors for a novel/chapter page.
  
  The URL of the page is: ${url}
  
  Here's the HTML content of the page (partial):
  \`\`\`html
  ${htmlContent.substring(0, 10000)}
  \`\`\`
  
  I need you to carefully analyze the HTML structure and identify the most specific and reliable CSS selectors for:
  
  1. Chapter title
  2. Chapter content (the main text of the chapter)
  3. Previous chapter link (if present)
  4. Next chapter link (if present)
  
  Return only a JSON object with the selectors, in this exact format:
  {
    "chapterTitle": "selector for title element",
    "chapterContent": "selector for content element", 
    "prevChapter": "selector for previous chapter link",
    "nextChapter": "selector for next chapter link"
  }
  
  Make sure to:
  - Use the most specific and unique selectors possible
  - Prioritize id and class selectors
  - Do not include any text content in selectors
  - Only return the JSON object, no additional explanation
  `;
        
        const response = await window.OpenRouterService.generateCompletion(
          model,
          prompt,
          0.2, // Low temperature for consistent results
          1000 // Max tokens
        );
        
        // Extract JSON from response
        try {
          // First, try to parse the entire response as JSON
          const selectors = JSON.parse(response);
          return {
            chapterTitle: selectors.chapterTitle || '',
            chapterContent: selectors.chapterContent || '',
            prevChapter: selectors.prevChapter || '',
            nextChapter: selectors.nextChapter || ''
          };
        } catch (error) {
          // If that fails, try to extract JSON from text
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const selectors = JSON.parse(jsonMatch[0]);
              return {
                chapterTitle: selectors.chapterTitle || '',
                chapterContent: selectors.chapterContent || '',
                prevChapter: selectors.prevChapter || '',
                nextChapter: selectors.nextChapter || ''
              };
            } catch (e) {
              // Fallback to simple detection
              return this.detectSelectorsSimple(htmlContent);
            }
          } else {
            // Fallback to simple detection
            return this.detectSelectorsSimple(htmlContent);
          }
        }
      } catch (error) {
        console.error('Error detecting selectors using AI:', error);
        // Fallback to simple detection
        return this.detectSelectorsSimple(htmlContent);
      }
    },
    
    // Simple selector detection as fallback
    detectSelectorsSimple: function(htmlContent) {
      // Basic detection for common patterns
      let chapterTitle = '';
      let chapterContent = '';
      let prevChapter = '';
      let nextChapter = '';
      
      // Look for common title selectors
      const titlePatterns = [
        /class=["'].*?title.*?["']/i,
        /class=["'].*?chapter.*?head.*?["']/i,
        /id=["'].*?title.*?["']/i,
        /id=["'].*?chapter.*?head.*?["']/i
      ];
      
      for (const pattern of titlePatterns) {
        const match = htmlContent.match(pattern);
        if (match) {
          const attr = match[0];
          if (attr.includes('id=')) {
            chapterTitle = '#' + attr.replace(/id=["'](.*?)["']/, '$1');
          } else {
            chapterTitle = '.' + attr.replace(/class=["'](.*?)["']/, '$1').replace(/\s+/g, '.');
          }
          break;
        }
      }
      
      // Look for common content selectors
      const contentPatterns = [
        /class=["'].*?chapter.*?content.*?["']/i,
        /class=["'].*?article.*?content.*?["']/i,
        /class=["'].*?novel.*?content.*?["']/i,
        /id=["'].*?chapter.*?content.*?["']/i,
        /id=["'].*?article.*?content.*?["']/i,
        /id=["'].*?content.*?["']/i
      ];
      
      for (const pattern of contentPatterns) {
        const match = htmlContent.match(pattern);
        if (match) {
          const attr = match[0];
          if (attr.includes('id=')) {
            chapterContent = '#' + attr.replace(/id=["'](.*?)["']/, '$1');
          } else {
            chapterContent = '.' + attr.replace(/class=["'](.*?)["']/, '$1').replace(/\s+/g, '.');
          }
          break;
        }
      }
      
      // Look for prev/next navigation
      const prevPatterns = [
        /class=["'].*?prev.*?["']/i,
        /class=["'].*?previous.*?["']/i,
        /id=["'].*?prev.*?["']/i
      ];
      
      for (const pattern of prevPatterns) {
        const match = htmlContent.match(pattern);
        if (match) {
          const attr = match[0];
          if (attr.includes('id=')) {
            prevChapter = '#' + attr.replace(/id=["'](.*?)["']/, '$1');
          } else {
            prevChapter = '.' + attr.replace(/class=["'](.*?)["']/, '$1').replace(/\s+/g, '.');
          }
          break;
        }
      }
      
      const nextPatterns = [
        /class=["'].*?next.*?["']/i,
        /id=["'].*?next.*?["']/i
      ];
      
      for (const pattern of nextPatterns) {
        const match = htmlContent.match(pattern);
        if (match) {
          const attr = match[0];
          if (attr.includes('id=')) {
            nextChapter = '#' + attr.replace(/id=["'](.*?)["']/, '$1');
          } else {
            nextChapter = '.' + attr.replace(/class=["'](.*?)["']/, '$1').replace(/\s+/g, '.');
          }
          break;
        }
      }
      
      return {
        chapterTitle: chapterTitle || 'h1, h2, .title',
        chapterContent: chapterContent || '.content, #content, article',
        prevChapter: prevChapter || 'a:has(.prev), a.prev, .prev a',
        nextChapter: nextChapter || 'a:has(.next), a.next, .next a'
      };
    },
    
    // Detect selectors from provided HTML
    detectSelectorsFromHTML: async function(message) {
      // Extract HTML content
      const htmlContent = this.extractHTMLFromMessage(message);
      
      if (!htmlContent) {
        return "I couldn't find valid HTML content in your message. Please make sure to include the page's HTML.";
      }
      
      try {
        // Try to find a URL in the message
        const urlMatch = message.match(/https?:\/\/[^\s]+/);
        const url = urlMatch ? urlMatch[0] : 'https://example.com';
        
        // Detect selectors
        const selectors = await this.detectSelectorsUsingAI(htmlContent, url);
        
        return "I've analyzed the HTML and detected the following selectors:\n\n" +
               `Chapter Title: ${selectors.chapterTitle}\n` +
               `Chapter Content: ${selectors.chapterContent}\n` +
               `Previous Chapter: ${selectors.prevChapter || 'Not found'}\n` +
               `Next Chapter: ${selectors.nextChapter || 'Not found'}\n\n` +
               "Would you like me to save this configuration? If so, please provide the base URL of the website.";
      } catch (error) {
        console.error('Error detecting selectors from HTML:', error);
        return "I had trouble analyzing the HTML content. Please make sure the HTML is valid and contains chapter content.";
      }
    },
    
    // Generate a regex pattern from a URL
    generateRegexPattern: function(url) {
      try {
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname;
        
        // Look for patterns in the path
        let patternPath = path;
        
        // Replace numeric parts with \d+
        patternPath = patternPath.replace(/\/\d+\//g, '/\\d+/');
        patternPath = patternPath.replace(/\/\d+$/g, '/\\d+');
        
        // Replace chapter names with a pattern
        patternPath = patternPath.replace(/\/chapter[\-_]?\d+/i, '/chapter[\\-_]?\\d+');
        
        // Replace alphanumeric IDs with regex
        patternPath = patternPath.replace(/\/[a-zA-Z0-9]{4,}\//g, '/[a-zA-Z0-9]+/');
        patternPath = patternPath.replace(/\/[a-zA-Z0-9]{4,}$/g, '/[a-zA-Z0-9]+');
        
        // Build the complete pattern
        let pattern = '^' + parsedUrl.origin.replace(/\./g, '\\.') + patternPath;
        
        // If there's a query string, add it with optional parameters
        if (parsedUrl.search) {
          pattern += '\\?.*';
        }
        
        return pattern + '$';
      } catch (error) {
        console.error('Error generating regex pattern:', error);
        return '^https?://example\\.com/path/to/chapter/\\d+$';
      }
    },
    
    // Handle glossary generation
    handleGlossaryGeneration: async function() {
      const currentProject = window.ProjectService?.getCurrentProject();
      if (!currentProject) {
        return "Please select a project first before generating glossary terms.";
      }
      
      const inputText = document.getElementById('input-text')?.value?.trim();
      if (!inputText) {
        return "I need some Chinese text in the input area to generate glossary terms. Please paste some text first.";
      }
      
      if (!window.GlossaryService) {
        return "The Glossary Service isn't available. Please check your application configuration.";
      }
      
      try {
        // Check if we have AI capabilities
        if (!this.canUseAI()) {
          return "To generate glossary terms, you need to configure the OpenRouter API in the Settings tab first.";
        }
        
        // Directly generate glossary
        const fandomContext = this.detectFandomContext(inputText);
        
        // Show processing message
        this.addAssistantMessage("Generating glossary terms from your text... This may take a moment.");
        
        // Generate glossary terms
        const result = await window.GlossaryService.generateGlossaryEntries(
          currentProject.id,
          inputText,
          true, // Auto add
          fandomContext
        );
        
        if (result.success) {
          // Clean up the processing message
          const messagesContainer = document.getElementById('chat-messages');
          if (messagesContainer) {
            const messages = messagesContainer.querySelectorAll('.message-assistant');
            if (messages.length > 0) {
              messages[messages.length - 1].remove();
            }
          }
          
          // Refresh the glossary UI if visible
          const glossaryTab = document.getElementById('glossary-terms-tab');
          if (glossaryTab && glossaryTab.classList.contains('active')) {
            window.GlossaryService.renderGlossaryTable(currentProject.id);
          }
          
          // Create result message
          let message = `✅ Success! I've generated and added ${result.stats.added} glossary terms`;
          
          if (result.stats.skipped > 0) {
            message += ` (${result.stats.skipped} duplicates were skipped)`;
          }
          
          if (fandomContext) {
            message += ` for the "${fandomContext}" context`;
          }
          
          message += ".\n\n";
          
          // Show sample terms
          if (result.entries && result.entries.length > 0) {
            message += "Here are some of the terms I added:\n";
            
            const sampleSize = Math.min(5, result.entries.length);
            for (let i = 0; i < sampleSize; i++) {
              const entry = result.entries[i];
              message += `- ${entry.chineseTerm} → ${entry.translation}\n`;
            }
            
            if (result.entries.length > sampleSize) {
              message += `...and ${result.entries.length - sampleSize} more terms.\n`;
            }
          }
          
          message += "\nThese terms will be automatically applied during translation to ensure consistency!";
          
          return message;
        } else {
          return "I encountered an error while generating glossary terms. Please try again or check the console for details.";
        }
      } catch (error) {
        console.error('Error with glossary generation:', error);
        return "I encountered an error while generating glossary terms. Please try again or check the console for details.";
      }
    },
    
    // Detect fandom context from text
    detectFandomContext: function(text) {
      // Common fandoms and their keywords
      const fandoms = [
        { name: "Cultivation", keywords: ["cultivation", "cultivator", "dao", "immortal", "spiritual", "sect", "qi", "meridian", "dantian"] },
        { name: "Xianxia", keywords: ["xianxia", "immortal", "fairy", "heavenly", "cultivate", "pill", "elixir", "spirit", "divine"] },
        { name: "Wuxia", keywords: ["wuxia", "martial", "kungfu", "sword", "saber", "hero", "jianghu", "internal energy"] },
        { name: "Fantasy", keywords: ["magic", "wizard", "spell", "sorcery", "elf", "dwarf", "dragon", "demon", "fairy"] },
        { name: "Sci-Fi", keywords: ["mecha", "robot", "spaceship", "futuristic", "galaxy", "starship", "technology", "cyber"] }
      ];
      
      // Convert text to lowercase for case-insensitive matching
      const lowerText = text.toLowerCase();
      
      // Check for genre keywords
      for (const fandom of fandoms) {
        const matched = fandom.keywords.some(keyword => lowerText.includes(keyword));
        if (matched) {
          return fandom.name;
        }
      }
      
      // No specific fandom detected
      return "";
    },
    
    // Add a term to the glossary
    addToGlossary: async function(message) {
      const currentProject = window.ProjectService?.getCurrentProject();
      if (!currentProject) {
        return "Please select a project first before adding glossary terms.";
      }
      
      if (!window.GlossaryService) {
        return "The Glossary Service isn't available. Please check your application configuration.";
      }
      
      try {
        // Try to extract Chinese term and translation
        const chineseMatch = message.match(/[\u4e00-\u9fa5]+/);
        if (!chineseMatch) {
          return "I couldn't find a Chinese term in your message. Please include the Chinese term you want to add.";
        }
        
        const chineseTerm = chineseMatch[0];
        
        // Look for "as" or "meaning" phrases to extract translation
        let translation = "";
        let category = "other";
        let notes = "";
        
        // Extract translation
        if (message.toLowerCase().includes(" as ")) {
          translation = message.split(/ as /i)[1].trim();
        } else if (message.toLowerCase().includes(" meaning ")) {
          translation = message.split(/ meaning /i)[1].trim();
        } else if (message.includes("→")) {
          translation = message.split("→")[1].trim();
        } else if (message.includes("->")) {
          translation = message.split("->")[1].trim();
        } else {
          // Try AI extraction
          if (this.canUseAI()) {
            try {
              translation = await this.extractTranslationUsingAI(message, chineseTerm);
            } catch (error) {
              console.error('Error extracting translation using AI:', error);
              return `I found the Chinese term "${chineseTerm}", but I'm not sure what the translation should be. Please specify like: "Add glossary term ${chineseTerm} as [translation]"`;
            }
          } else {
            return `I found the Chinese term "${chineseTerm}", but I'm not sure what the translation should be. Please specify like: "Add glossary term ${chineseTerm} as [translation]"`;
          }
        }
        
        // Clean up translation (remove punctuation at end)
        translation = translation.replace(/[.!?,;:]+$/, "");
        
        // Check for category
        const categoryMatch = message.match(/category:?\s*([a-zA-Z]+)/i);
        if (categoryMatch) {
          const candidateCategory = categoryMatch[1].toLowerCase();
          const validCategories = ['character', 'location', 'technique', 'item', 'concept', 'title', 'organization', 'other'];
          
          if (validCategories.includes(candidateCategory)) {
            category = candidateCategory;
          }
        }
        
        // Check for notes
        const notesMatch = message.match(/notes?:?\s*"([^"]*)"/i);
        if (notesMatch) {
          notes = notesMatch[1];
        }
        
        // Add to glossary
        await window.GlossaryService.addGlossaryEntry({
          projectId: currentProject.id,
          chineseTerm: chineseTerm,
          translation: translation,
          category: category,
          notes: notes || 'Added via Quill-chan chat'
        });
        
        // Refresh the glossary UI if visible
        const glossaryTab = document.getElementById('glossary-terms-tab');
        if (glossaryTab && glossaryTab.classList.contains('active')) {
          window.GlossaryService.renderGlossaryTable(currentProject.id);
        }
        
        return `✅ Successfully added "${chineseTerm}" → "${translation}" to your glossary as a ${category} term! Is there anything else you'd like to add?`;
      } catch (error) {
        console.error('Error adding glossary term:', error);
        return "I encountered an error while adding the term to your glossary. Please try again or add it manually.";
      }
    },
    
    // Extract translation using AI
    extractTranslationUsingAI: async function(message, chineseTerm) {
      const model = this.getOpenRouterModel();
      if (!model) {
        throw new Error('No OpenRouter model available');
      }
      
      const prompt = `
  I need to extract the English translation for a Chinese term from this message:
  "${message}"
  
  The Chinese term is: ${chineseTerm}
  
  Please extract ONLY the English translation that the user intends for this term.
  Return only the translation, nothing else.
  `;
      
      const translation = await window.OpenRouterService.generateCompletion(
        model,
        prompt,
        0.2, // Low temperature
        100  // Short response
      );
      
      return translation.trim();
    },
    
    // Perform a quick translation
    quickTranslate: async function(message) {
      if (!this.canUseAI()) {
        return "To translate text, you need to configure the OpenRouter API in the Settings tab first.";
      }
      
      // Extract Chinese text
      const chineseText = message.match(/[\u4e00-\u9fa5]+/g)?.join("");
      if (!chineseText) {
        return "I couldn't find any Chinese text to translate. Please provide some Chinese characters.";
      }
      
      try {
        // Use OpenRouter for translation
        const translationPrompt = `Translate this Chinese text to English perfectly: "${chineseText}"`;
        
        const model = this.getOpenRouterModel();
        if (!model) {
          return "Please select an OpenRouter model in the Settings tab first.";
        }
        
        const translation = await window.OpenRouterService.generateCompletion(
          model,
          translationPrompt,
          0.3, // Lower temperature for accurate translation
          1000 // Max tokens
        );
        
        return `Original: ${chineseText}\n\nTranslation: ${translation.trim()}`;
      } catch (error) {
        console.error('Error translating text:', error);
        return "I encountered an error while translating. Please try again with a shorter text or check your OpenRouter settings.";
      }
    },
    
    // Extract chapter from URL
    extractChapter: async function(url) {
      const currentProject = window.ProjectService?.getCurrentProject();
      if (!currentProject) {
        return "Please select a project first before extracting chapters.";
      }
      
      if (!window.ChapterFetcherService) {
        return "The Chapter Fetcher Service isn't available. Please check your application configuration.";
      }
      
      try {
        // Try automatic fetching through the service
        // We'll add a function to the ChapterFetcherService to support this
        
        return "I'll help you extract a chapter from " + url + "\n\n" +
               "Checking if this website is already configured...\n\n" +
               "Go to the Chapters tab and paste this URL in the fetch field, then click 'Fetch Chapters'. " +
               "If the website isn't configured yet, I can help you set it up. Just send me the website's HTML " +
               "with a message like: 'Configure website " + url + " with this HTML: [paste HTML here]'";
      } catch (error) {
        console.error('Error preparing chapter extraction:', error);
        return "I encountered an error while preparing to extract the chapter. Please try fetching it manually from the Chapters tab.";
      }
    },
    
    // Construct a prompt for the AI based on message and context
    constructPrompt: function(message, context) {
      const historyContext = this.getConversationHistoryForPrompt();
      const appContext = JSON.stringify(context);
      const personalityContext = JSON.stringify(this.personality);
      
      return `You are ${this.personality.name}, a helpful anime-inspired assistant for the QuillSync AI translation application. 
  
  Your personality: ${personalityContext}
  
  Current application context: ${appContext}
  
  Conversation history:
  ${historyContext}
  
  User message: ${message}
  
  Respond in a ${this.personality.speakingStyle} manner. Keep your responses helpful, concise, and focused on the user's needs related to translation, glossary management, chapter fetching, or settings configuration.
  
  Format your response with proper paragraphs and spacing. Do not use asterisks (*) for emphasis or markdown formatting. If you create a list, use proper line breaks.
  
  If you include any emoticons, make sure they're cute anime-style emoticons like (◕‿◕), (≧◡≦), or (づ｡◕‿‿◕｡)づ, but use them sparingly.`;
    },
    
    // Get a simplified conversation history for the AI prompt
    getConversationHistoryForPrompt: function() {
      // Use last 5 messages at most to keep context reasonable
      const recentMessages = this.chatHistory.slice(-10);
      
      return recentMessages.map(msg => {
        return `${msg.role}: ${msg.content}`;
      }).join("\n\n");
    },
    
    // Get AI response via OpenRouter API
    getAIResponse: async function(prompt) {
      if (!window.OpenRouterService) {
        throw new Error('OpenRouter service not available');
      }
      
      const model = this.getOpenRouterModel();
      if (!model) {
        throw new Error('No OpenRouter model selected');
      }
      
      const response = await window.OpenRouterService.generateCompletion(
        model,
        prompt,
        0.7, // Temperature
        2000 // Max tokens
      );
      
      return response;
    },
    
    // Get the configured OpenRouter model
    getOpenRouterModel: function() {
      const currentProject = window.ProjectService?.getCurrentProject();
      if (!currentProject || !currentProject.settings) return null;
      
      return currentProject.settings.openRouterModel || null;
    },
    
    // Check if AI can be used (API key and model configured)
    canUseAI: function() {
      const currentProject = window.ProjectService?.getCurrentProject();
      if (!currentProject || !currentProject.settings) return false;
      
      return !!(currentProject.settings.openRouterApiKey && 
               currentProject.settings.openRouterModel &&
               window.OpenRouterService);
    },
    
    // Get a fallback response if AI is not available
    getFallbackResponse: function(message, context) {
      const lowerMessage = message.toLowerCase();
      
      // Help-related questions
      if (lowerMessage.includes("help") || lowerMessage.includes("how do i")) {
        return "I'd be happy to help! QuillSync AI is a translation assistant for webnovels and other texts. You can paste Chinese text in the Translator tab, manage terms in the Glossary tab, download chapters in the Chapters tab, and configure settings in the Settings tab. What specific feature would you like help with? (｡◕‿◕｡)";
      }
      
      // Glossary-related questions
      if (lowerMessage.includes("glossary") || lowerMessage.includes("term")) {
        return "The Glossary helps you maintain consistent translations for specific terms. You can add terms manually, or use the AI generator to extract them automatically. Make sure to configure the OpenRouter API in Settings first for the best experience! (✿◠‿◠)";
      }
      
      // Translation-related questions
      if (lowerMessage.includes("translat") || lowerMessage.includes("chinese")) {
        return "To translate text, paste Chinese content in the input area, then click the Translate button. You can choose between ChatGPT or OpenRouter API as your translation method in the settings. For large texts, try adjusting the chunking strategy to get better results! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧";
      }
      
      // Chapter-related questions
      if (lowerMessage.includes("chapter") || lowerMessage.includes("novel")) {
        return "The Chapter Fetcher allows you to download novel chapters from supported websites. Enter the URL of a chapter, select how many chapters to fetch, and click 'Fetch Chapters'. You can also configure new websites in the Website Config tab! ヽ(・∀・)ﾉ";
      }
      
      // Settings-related questions
      if (lowerMessage.includes("setting") || lowerMessage.includes("config")) {
        return "In the Settings tab, you can configure your API connections, translation preferences, and appearance options. For the best experience, I recommend setting up OpenRouter API for AI-powered features. You can also customize my appearance and name there! (≧◡≦)";
      }
      
      // Default response
      return "I'm here to help with your translation needs! I can assist with using the glossary, fetching chapters, configuring websites, and other features. For more advanced help, please configure the OpenRouter API in the Settings tab to enable my AI capabilities. What would you like to do? (◕‿◕)";
    },
    
    // Get current application context
    getApplicationContext: function() {
      try {
        const context = {
          currentTab: this.getCurrentTab(),
          currentProject: this.getCurrentProjectInfo(),
          glossaryStats: this.getGlossaryStats(),
          inputStats: this.getInputStats(),
          outputStats: this.getOutputStats(),
          aiAvailable: this.canUseAI()
        };
        
        return context;
      } catch (error) {
        console.error('Error getting application context:', error);
        return { error: 'Could not retrieve application context' };
      }
    },
    
    // Get current active tab
    getCurrentTab: function() {
      const activeTabElement = document.querySelector('.tab-btn.active');
      return activeTabElement ? activeTabElement.dataset.tab : 'unknown';
    },
    
    // Get current project information
    getCurrentProjectInfo: function() {
      const currentProject = window.ProjectService?.getCurrentProject();
      if (!currentProject) return { available: false };
      
      return {
        available: true,
        name: currentProject.name,
        id: currentProject.id,
        hasOpenRouterApiKey: !!currentProject.settings?.openRouterApiKey,
        hasOpenRouterModel: !!currentProject.settings?.openRouterModel
      };
    },
    
    // Get glossary statistics
    getGlossaryStats: function() {
      const currentProject = window.ProjectService?.getCurrentProject();
      if (!currentProject || !window.GlossaryService) return { available: false };
      
      // We can't get exact count without async, so we'll return just availability
      return {
        available: true,
        serviceAvailable: !!window.GlossaryService
      };
    },
    
    // Get input text statistics
    getInputStats: function() {
      const inputText = document.getElementById('input-text')?.value || '';
      const chineseCharCount = (inputText.match(/[\u4e00-\u9fa5]/g) || []).length;
      
      return {
        available: !!inputText,
        length: inputText.length,
        chineseCharCount: chineseCharCount,
        hasChineseText: chineseCharCount > 0
      };
    },
    
    // Get output text statistics
    getOutputStats: function() {
      let outputText = '';
      
      if (window.quill) {
        outputText = window.quill.getText() || '';
      }
      
      return {
        available: !!outputText,
        length: outputText.length
      };
    },
    
    // Add a user message to the chat
    addUserMessage: function(message) {
      // Add to UI
      const messagesContainer = document.getElementById('chat-messages');
      if (messagesContainer) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message message-user';
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
      }
      
      // Add to history
      this.chatHistory.push({
        role: 'User',
        content: message,
        timestamp: Date.now()
      });
      
      // Save history
      this.saveChatHistory();
      
      // Scroll to bottom
      this.scrollToBottom();
    },
    
    // Add an assistant message to the chat
    addAssistantMessage: function(message) {
      // Add to UI
      const messagesContainer = document.getElementById('chat-messages');
      if (messagesContainer) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message message-assistant';
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
      }
      
      // Add to history
      this.chatHistory.push({
        role: 'Assistant',
        content: message,
        timestamp: Date.now()
      });
      
      // Save history
      this.saveChatHistory();
      
      // Scroll to bottom
      this.scrollToBottom();
    },
    
    // Show typing indicator
    showTypingIndicator: function() {
      const messagesContainer = document.getElementById('chat-messages');
      if (!messagesContainer) return;
      
      // Remove existing indicator if any
      this.hideTypingIndicator();
      
      // Create typing indicator
      const indicatorElement = document.createElement('div');
      indicatorElement.className = 'chat-message message-assistant message-typing';
      indicatorElement.id = 'typing-indicator';
      
      // Create three dots
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        indicatorElement.appendChild(dot);
      }
      
      messagesContainer.appendChild(indicatorElement);
      
      // Scroll to bottom
      this.scrollToBottom();
    },
    
    // Hide typing indicator
    hideTypingIndicator: function() {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    },
    
    // Scroll chat to bottom
    scrollToBottom: function() {
      const messagesContainer = document.getElementById('chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    },
    
    // Update suggestions based on context
    updateContextSuggestions: function(tabId) {
      // Start with default suggestions
      let suggestions = [...this.defaultSuggestions];
      
      // Add context-specific suggestions if available
      if (tabId && this.contextSuggestions[tabId]) {
        suggestions = [...this.contextSuggestions[tabId], ...suggestions];
      }
      
      // Update UI
      this.updateSuggestions(suggestions);
    },
    
    // Update suggestions based on conversation
    updateSuggestionsAfterResponse: function(userMessage, assistantResponse) {
      // Analyze messages to determine helpful suggestions
      const lowerUserMsg = userMessage.toLowerCase();
      const lowerAssistantMsg = assistantResponse.toLowerCase();
      
      // Default suggestions
      let suggestions = [...this.defaultSuggestions];
      
      // Website configuration scenario
      if (lowerUserMsg.includes('website') || lowerUserMsg.includes('configure') || 
          lowerAssistantMsg.includes('website') || lowerAssistantMsg.includes('configure')) {
        suggestions = [
          { text: "What selectors do I need?", type: "help" },
          { text: "Detect selectors from this HTML", type: "command" },
          { text: "Add a website URL", type: "command" }
        ];
      }
      
      // Translation scenario
      else if (lowerUserMsg.includes('translat') || lowerAssistantMsg.includes('translat')) {
        suggestions = [
          { text: "Which model is best for translation?", type: "help" },
          { text: "Improve translation quality", type: "help" },
          { text: "Generate glossary from this text", type: "command" }
        ];
      }
      
      // Glossary scenario
      else if (lowerUserMsg.includes('glossary') || lowerAssistantMsg.includes('glossary')) {
        suggestions = [
          { text: "Add term 魔法 as magic", type: "command" },
          { text: "Generate glossary from my text", type: "command" },
          { text: "How do I organize my glossary?", type: "help" }
        ];
      }
      
      // Chapter scenario
      else if (lowerUserMsg.includes('chapter') || lowerAssistantMsg.includes('chapter')) {
        suggestions = [
          { text: "Find next chapter automatically", type: "command" },
          { text: "Extract chapter from URL", type: "command" },
          { text: "Add a website configuration", type: "command" }
        ];
      }
      
      // Update UI
      this.updateSuggestions(suggestions);
    },
    
    // Update suggestions in the UI
    updateSuggestions: function(suggestions) {
      const suggestionsContainer = document.getElementById('chat-suggestions');
      if (!suggestionsContainer) return;
      
      // Clear existing suggestions
      suggestionsContainer.innerHTML = '';
      
      // Add new suggestions
      suggestions.forEach(suggestion => {
        const chip = document.createElement('div');
        chip.className = 'suggestion-chip';
        if (suggestion.type) {
          chip.classList.add(suggestion.type + '-suggestion');
        }
        chip.textContent = suggestion.text;
        suggestionsContainer.appendChild(chip);
      });
    },
    
    // Save chat history to localStorage
    saveChatHistory: function() {
      try {
        // Limit history to last 100 messages
        const trimmedHistory = this.chatHistory.slice(-100);
        localStorage.setItem('animeGuideChatHistory', JSON.stringify(trimmedHistory));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    },
    
    // Load chat history from localStorage
    loadChatHistory: function() {
      try {
        const savedHistory = localStorage.getItem('animeGuideChatHistory');
        if (savedHistory) {
          this.chatHistory = JSON.parse(savedHistory);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        this.chatHistory = [];
      }
    },
    
    // Render existing chat history
    renderChatHistory: function() {
      const messagesContainer = document.getElementById('chat-messages');
      if (!messagesContainer) return;
      
      // Clear container
      messagesContainer.innerHTML = '';
      
      // Add messages
      this.chatHistory.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.textContent = message.content;
        
        if (message.role === 'User') {
          messageElement.classList.add('message-user');
        } else {
          messageElement.classList.add('message-assistant');
        }
        
        messagesContainer.appendChild(messageElement);
      });
      
      // Scroll to bottom
      this.scrollToBottom();
    },
    
    // Clear chat history
    clearChatHistory: function() {
      this.chatHistory = [];
      localStorage.removeItem('animeGuideChatHistory');
      
      // Clear UI
      const messagesContainer = document.getElementById('chat-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
      
      // Add welcome message
      this.addAssistantMessage(
        "Hi there! I'm " + this.personality.name + ", your translation assistant! I can help you with translations, " +
        "manage your glossary, configure chapter fetching, and more. What would you like help with today? (◠‿◠)"
      );
    }
  };
  
  // Initialize the service when document is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Give a short delay to ensure other services are loaded
    setTimeout(function() {
      if (window.AnimeGuideChatService) {
        window.AnimeGuideChatService.initialize();
      }
    }, 1000);
  });