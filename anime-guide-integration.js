/**
 * Anime Guide Integration for QuillSync AI
 * This script integrates the enhanced chat capabilities with the existing anime guide
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Anime Guide Integration...');
    
    // No need to inject CSS as it's now part of the main anime-guide.css file
    
    // Integrate the chat panel with the existing anime guide
    initializeIntegration();
  });
  
  /**
   * Initialize the integration between the original anime guide and the new chat
   */
  function initializeIntegration() {
    // Wait for AnimeGuideService to be available
    if (!window.AnimeGuideService) {
      console.log('Waiting for AnimeGuideService...');
      setTimeout(initializeIntegration, 500);
      return;
    }
    
    // Store reference to original methods we'll be extending
    const originalShowMessage = window.AnimeGuideService.showMessage;
    const originalInitialize = window.AnimeGuideService.initialize;
    
    // Extend the AnimeGuideService.showMessage method to connect with chat
    window.AnimeGuideService.showMessage = function(message, animation, duration) {
      // Call the original method first
      originalShowMessage.call(this, message, animation, duration);
      
      // If chat service is available, also add the message to chat
      if (window.AnimeGuideChatService) {
        // Only add non-empty messages to chat
        if (message && typeof message === 'string' && message.trim().length > 0) {
          // Clean up the message formatting
          const cleanedMessage = message
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove ** for bold
            .replace(/\*(.*?)\*/g, '$1')      // Remove * for emphasis
            .replace(/\_\_(.*?)\_\_/g, '$1')  // Remove __ for underline
            .trim();
          
          window.AnimeGuideChatService.addAssistantMessage(cleanedMessage);
        }
      }
    };
    
    // Extend the initialize method to connect with chat service initialization
    window.AnimeGuideService.initialize = function() {
      // Call the original method first
      originalInitialize.call(this);
      
      // Connect the original anime guide with the chat
      connectGuideToChat();
    };
    
    // Link message box interaction with chat
    connectMessageBoxToChat();
    
    // If AnimeGuideService was already initialized, connect guide to chat now
    connectGuideToChat();
    
    console.log('Anime Guide Integration initialized successfully');
  }
  
  /**
   * Connect the original anime guide popup with the chat panel
   */
  function connectGuideToChat() {
    const guideMessage = document.querySelector('.guide-message');
    if (!guideMessage) return;
    
    // Add click handler to open chat when clicking on guide message
    guideMessage.addEventListener('click', function(e) {
      // Ignore if clicking on buttons within the message
      if (e.target.tagName === 'BUTTON') return;
      
      // Open the chat panel if available
      if (window.AnimeGuideChatService) {
        window.AnimeGuideChatService.openChat();
      }
      
      // Hide the original guide popup
      const guideElement = document.getElementById('anime-guide');
      if (guideElement) {
        guideElement.style.display = 'none';
      }
    });
    
    // Add tooltip to indicate clickable
    guideMessage.title = 'Click to open chat with ' + (window.AnimeGuideService?.settings?.name || 'Quill-chan');
    guideMessage.style.cursor = 'pointer';
  }
  
  /**
   * Connect the guide message box to the chat
   */
  function connectMessageBoxToChat() {
    // Add double-click handler to the guide text
    const guideText = document.getElementById('guide-text');
    if (guideText) {
      guideText.addEventListener('dblclick', function() {
        // Open chat if available
        if (window.AnimeGuideChatService) {
          window.AnimeGuideChatService.openChat();
        }
        
        // Hide the original guide popup
        const guideElement = document.getElementById('anime-guide');
        if (guideElement) {
          guideElement.style.display = 'none';
        }
      });
    }
  }
  
  // When the chat panel is initialized, sync settings from AnimeGuideService
  function syncSettings() {
    if (!window.AnimeGuideService || !window.AnimeGuideChatService) return;
    
    // Update chat settings based on AnimeGuideService settings
    const nameDisplay = document.querySelector('.character-name');
    if (nameDisplay && window.AnimeGuideService.settings) {
      nameDisplay.textContent = window.AnimeGuideService.settings.name || 'Quill-chan';
    }
    
    // Update character avatar style
    const chatAvatar = document.querySelector('.anime-guide-chat .avatar-image');
    const miniAvatar = document.querySelector('.anime-guide-chat .mini-avatar');
    
    if (chatAvatar && window.AnimeGuideService.settings) {
      chatAvatar.dataset.style = window.AnimeGuideService.settings.style || 'kawaii';
    }
    
    if (miniAvatar && window.AnimeGuideService.settings) {
      miniAvatar.dataset.style = window.AnimeGuideService.settings.style || 'kawaii';
    }
  }
  
  // Listen for settings changes to keep the chat panel in sync
  function setupSettingsListener() {
    // Watch for changes to anime guide settings in the settings panel
    const nameInput = document.getElementById('anime-guide-name');
    if (nameInput) {
      nameInput.addEventListener('change', syncSettings);
    }
    
    const styleSelect = document.getElementById('anime-guide-style');
    if (styleSelect) {
      styleSelect.addEventListener('change', syncSettings);
    }
    
    const hairColorInput = document.getElementById('anime-guide-hair-color');
    if (hairColorInput) {
      hairColorInput.addEventListener('change', syncSettings);
    }
  }
  
  // Run the settings listener setup
  setTimeout(setupSettingsListener, 2000);