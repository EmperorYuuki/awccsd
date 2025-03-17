/**
 * Anime Guide Component for QuillSync AI
 * This module handles the interactive anime assistant character
 */

const AnimeGuideService = (function() {
  // Default settings
  const DEFAULT_SETTINGS = {
    enabled: true,
    name: 'Quill-chan',
    style: 'kawaii',
    hairColor: '#ff69b4',
    showTips: true
  };
  
  // State
  let settings = Object.assign({}, DEFAULT_SETTINGS);
  let tipShown = false;
  let tutorialStep = 0;
  let tutorialActive = false;
  
  // Tutorial messages
  const TUTORIAL_MESSAGES = [
    "Welcome to QuillSync AI! I'm Quill-chan, and I'll guide you through getting started!",
    "First, create a new project using the 'Create Project' button in the sidebar.",
    "Next, set up your ChatGPT or OpenRouter API connection in the Settings tab.",
    "Now you can paste Chinese text in the input area or fetch chapters from supported websites.",
    "To translate, select your chunking strategy and click the 'Translate' button.",
    "Use the Glossary tab to manage terms and ensure consistent translations.",
    "You can export your translations in different formats using the Export button."
  ];
  
  // Random tips
  const RANDOM_TIPS = [
    "Remember to save your projects regularly by exporting them!",
    "You can use keyboard shortcuts: Ctrl+T to translate, Ctrl+F to fetch chapters, and Ctrl+S to export.",
    "The glossary ensures consistency in your translations. Take time to set it up!",
    "You can preview a translation before processing the entire text.",
    "Switch between ChatGPT and OpenRouter API for different translation approaches.",
    "For long novels, fetch multiple chapters at once by increasing the 'Chapter Count'.",
    "Use the Refine button to improve existing translations without starting over.",
    "Different chunking strategies work better for different texts. Experiment!",
    "Check the Settings tab to customize QuillSync AI to your preferences.",
    "You can change my appearance and behavior in the Settings tab under 'Anime Guide'!"
  ];
  
  /**
   * Initialize the anime guide component
   */
  const initialize = function() {
    try {
      // Load settings from localStorage
      loadSettings();
      
      // Apply settings
      applySettings();
      
      // Set up event handlers
      var guideCloseBtn = document.getElementById('guide-close-btn');
      if (guideCloseBtn) {
        guideCloseBtn.addEventListener('click', hide);
      }
      
      // Set up settings form handlers
      var enableAnimeGuide = document.getElementById('enable-anime-guide');
      if (enableAnimeGuide) {
        enableAnimeGuide.addEventListener('change', function(e) {
          settings.enabled = e.target.checked;
          saveSettings();
          applySettings();
        });
      }
      
      var animeGuideName = document.getElementById('anime-guide-name');
      if (animeGuideName) {
        animeGuideName.addEventListener('change', function(e) {
          settings.name = e.target.value;
          saveSettings();
          applySettings();
        });
      }
      
      var animeGuideStyle = document.getElementById('anime-guide-style');
      if (animeGuideStyle) {
        animeGuideStyle.addEventListener('change', function(e) {
          settings.style = e.target.value;
          saveSettings();
          applySettings();
          updatePreview();
        });
      }
      
      var animeGuideHairColor = document.getElementById('anime-guide-hair-color');
      if (animeGuideHairColor) {
        animeGuideHairColor.addEventListener('change', function(e) {
          settings.hairColor = e.target.value;
          saveSettings();
          applySettings();
          updatePreview();
        });
      }
      
      // Initial showing of guide if enabled
      if (settings.enabled) {
        setTimeout(function() {
          showWelcomeMessage();
        }, 1000);
      }
      
      // Create preview if in settings tab
      updatePreview();
    } catch (error) {
      console.error('Error initializing anime guide:', error);
    }
  };
  
  /**
   * Load settings from localStorage
   */
  const loadSettings = function() {
    const savedSettings = localStorage.getItem('animeGuideSettings');
    if (savedSettings) {
      try {
        settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error parsing anime guide settings:', error);
        settings = Object.assign({}, DEFAULT_SETTINGS);
      }
    }
  };
  
  /**
   * Save settings to localStorage
   */
  const saveSettings = function() {
    localStorage.setItem('animeGuideSettings', JSON.stringify(settings));
  };
  
  /**
   * Apply current settings to the UI
   */
  const applySettings = function() {
    // Apply visibility
    const guideElement = document.getElementById('anime-guide');
    if (guideElement) {
      guideElement.style.display = settings.enabled ? 'flex' : 'none';
    }
    
    // Apply character style
    const character = document.querySelector('.anime-character');
    if (character) {
      character.dataset.style = settings.style || 'kawaii';
      
      // Apply hair color
      if (isCustomHairColor(settings.hairColor)) {
        character.dataset.hairColor = 'custom';
        applyCustomHairColor(character, settings.hairColor);
      } else {
        const colorName = getStandardHairColorName(settings.hairColor);
        character.dataset.hairColor = colorName;
        character.style.filter = ''; // Clear any custom filter
      }
    }
    
    // Apply settings in form if available
    var enableAnimeGuide = document.getElementById('enable-anime-guide');
    if (enableAnimeGuide) {
      enableAnimeGuide.checked = settings.enabled;
    }
    
    var animeGuideName = document.getElementById('anime-guide-name');
    if (animeGuideName) {
      animeGuideName.value = settings.name;
    }
    
    var animeGuideStyle = document.getElementById('anime-guide-style');
    if (animeGuideStyle) {
      animeGuideStyle.value = settings.style;
    }
    
    var animeGuideHairColor = document.getElementById('anime-guide-hair-color');
    if (animeGuideHairColor) {
      animeGuideHairColor.value = settings.hairColor;
    }
  };
  
  /**
   * Update the preview in settings
   */
  const updatePreview = function() {
    const previewContainer = document.getElementById('anime-guide-preview-container');
    if (!previewContainer) return;
    
    // Clear existing content
    previewContainer.innerHTML = '';
    
    // Create character element
    const character = document.createElement('div');
    character.className = 'anime-character';
    character.dataset.style = settings.style || 'kawaii';
    
    // Apply hair color
    if (isCustomHairColor(settings.hairColor)) {
      character.dataset.hairColor = 'custom';
      applyCustomHairColor(character, settings.hairColor);
    } else {
      const colorName = getStandardHairColorName(settings.hairColor);
      character.dataset.hairColor = colorName;
    }
    
    // Create message bubble
    const message = document.createElement('div');
    message.className = 'guide-message';
    message.innerHTML = '<p>Hi! I\'m ' + settings.name + '. I\'ll help you translate fanfiction!</p>';
    
    // Add to preview
    previewContainer.appendChild(character);
    previewContainer.appendChild(message);
  };
  
  /**
   * Check if a hair color is custom (not one of the standard colors)
   * @param {string} color - Hair color value
   * @returns {boolean} Whether it's a custom color
   */
  const isCustomHairColor = function(color) {
    const standardColors = ['#ff69b4', '#4169e1', '#9370db', '#ff4500', '#32cd32', '#ffd700'];
    return standardColors.indexOf(color) === -1;
  };
  
  /**
   * Get the standard color name for a hair color value
   * @param {string} color - Hair color value
   * @returns {string} Color name
   */
  const getStandardHairColorName = function(color) {
    switch (color) {
      case '#ff69b4': return 'pink';
      case '#4169e1': return 'blue';
      case '#9370db': return 'purple';
      case '#ff4500': return 'red';
      case '#32cd32': return 'green';
      case '#ffd700': return 'yellow';
      default: return 'custom';
    }
  };
  
  /**
   * Apply a custom hair color using CSS filters
   * @param {HTMLElement} element - Element to apply the filter to
   * @param {string} color - Color value
   */
  const applyCustomHairColor = function(element, color) {
    try {
      // Convert hex to RGB
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Calculate hue rotation (very approximate)
      const hue = rgbToHue(r, g, b);
      const hueRotation = hue - 330; // Assuming the base color is pink (330° hue)
      
      // Calculate saturation adjustment
      const hslValues = rgbToHsl(r, g, b);
      const satAdjust = hslValues[1] * 100;
      
      // Create filter
      element.style.filter = 'hue-rotate(' + hueRotation + 'deg) saturate(' + (satAdjust / 50) + ')';
    } catch (error) {
      console.error('Error applying custom hair color:', error);
      element.style.filter = '';
    }
  };
  
  /**
   * Approximate RGB to Hue conversion
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {number} Hue value (0-360)
   */
  const rgbToHue = function(r, g, b) {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    
    if (max !== min) {
      const d = max - min;
      if (max === r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else if (max === b) {
        h = (r - g) / d + 4;
      }
      
      h = h * 60;
    }
    
    return h;
  };
  
  /**
   * Convert RGB to HSL
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {Array} HSL values ([0-360, 0-1, 0-1])
   */
  const rgbToHsl = function(r, g, b) {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      if (max === r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else if (max === b) {
        h = (r - g) / d + 4;
      }
      
      h = h * 60;
    }
    
    return [h, s, l];
  };
  
  /**
   * Show a message from the anime guide
   * @param {string} message - Message to show
   * @param {string} [animation='idle'] - Animation to play
   * @param {number} [duration=5000] - How long to show the message in milliseconds
   */
  const showMessage = function(message, animation, duration) {
    if (!animation) animation = 'idle';
    if (duration === undefined) duration = 5000;
    
    if (!settings.enabled) return;
    
    const guideElement = document.getElementById('anime-guide');
    const messageElement = document.getElementById('guide-text');
    const characterElement = document.querySelector('.anime-character');
    
    if (!guideElement || !messageElement || !characterElement) return;
    
    // Show the guide
    guideElement.style.display = 'flex';
    
    // Set the message
    messageElement.textContent = message;
    
    // Apply the animation
    characterElement.className = 'anime-character';
    void characterElement.offsetWidth; // Force reflow
    characterElement.classList.add(animation);
    
    // Auto-hide after duration if specified
    if (duration > 0) {
      setTimeout(function() {
        hide();
      }, duration);
    }
    
    tipShown = true;
  };
  
  /**
   * Hide the anime guide
   */
  const hide = function() {
    const guideElement = document.getElementById('anime-guide');
    if (guideElement) {
      guideElement.style.display = 'none';
    }
  };
  
  /**
   * Show the welcome message
   */
  const showWelcomeMessage = function() {
    const hasSeenWelcome = localStorage.getItem('animeGuideWelcomeShown') === 'true';
    
    if (!hasSeenWelcome) {
      showMessage('Hi! I\'m ' + settings.name + ', your translation assistant. Would you like a tutorial?', 'waving', 0);
      localStorage.setItem('animeGuideWelcomeShown', 'true');
      
      // Add tutorial buttons
      appendTutorialButtons();
    } else {
      // Maybe show a random tip instead
      if (settings.showTips && Math.random() < 0.5) {
        showRandomTip();
      }
    }
  };
  
  /**
   * Append tutorial confirmation buttons to the message
   */
  const appendTutorialButtons = function() {
    const messageElement = document.getElementById('guide-text');
    if (!messageElement) return;
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'guide-buttons';
    buttonsDiv.innerHTML = '\
      <button id="start-tutorial-btn" class="guide-btn">Yes, show tutorial</button>\
      <button id="skip-tutorial-btn" class="guide-btn">No thanks</button>\
    ';
    
    messageElement.parentNode.appendChild(buttonsDiv);
    
    // Add event listeners
    var startTutorialBtn = document.getElementById('start-tutorial-btn');
    if (startTutorialBtn) {
      startTutorialBtn.addEventListener('click', startTutorial);
    }
    
    var skipTutorialBtn = document.getElementById('skip-tutorial-btn');
    if (skipTutorialBtn) {
      skipTutorialBtn.addEventListener('click', function() {
        hide();
        // Maybe show a tip later
        setTimeout(function() {
          if (settings.enabled && settings.showTips) {
            showRandomTip();
          }
        }, 60000); // Show a tip after 1 minute
      });
    }
  };
  
  /**
   * Start the tutorial
   */
  const startTutorial = function() {
    tutorialActive = true;
    tutorialStep = 0;
    
    // Remove tutorial buttons if present
    const buttonsDiv = document.querySelector('.guide-buttons');
    if (buttonsDiv) {
      buttonsDiv.remove();
    }
    
    showTutorialStep();
  };
  
  /**
   * Show the current tutorial step
   */
  const showTutorialStep = function() {
    if (tutorialStep >= TUTORIAL_MESSAGES.length) {
      // Tutorial complete
      tutorialActive = false;
      showMessage('All done! You\'re ready to start translating. Have fun!', 'happy', 5000);
      return;
    }
    
    // Show the current step message
    showMessage(TUTORIAL_MESSAGES[tutorialStep], 'talking', 0);
    
    // Add tutorial navigation buttons
    appendTutorialNavButtons();
  };
  
  /**
   * Append tutorial navigation buttons
   */
  const appendTutorialNavButtons = function() {
    const messageElement = document.getElementById('guide-text');
    if (!messageElement) return;
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'guide-buttons';
    
    let buttonHtml = '';
    if (tutorialStep > 0) {
      buttonHtml += '<button id="prev-tutorial-btn" class="guide-btn">Previous</button>';
    }
    
    if (tutorialStep < TUTORIAL_MESSAGES.length - 1) {
      buttonHtml += '<button id="next-tutorial-btn" class="guide-btn">Next</button>';
    } else {
      buttonHtml += '<button id="finish-tutorial-btn" class="guide-btn">Finish</button>';
    }
    
    buttonHtml += '<button id="skip-all-tutorial-btn" class="guide-btn">Skip All</button>';
    
    buttonsDiv.innerHTML = buttonHtml;
    messageElement.parentNode.appendChild(buttonsDiv);
    
    // Add step indicators
    const stepsDiv = document.createElement('div');
    stepsDiv.className = 'tutorial-steps';
    
    for (let i = 0; i < TUTORIAL_MESSAGES.length; i++) {
      const step = document.createElement('div');
      step.className = 'step-indicator ' + (i === tutorialStep ? 'active' : '');
      stepsDiv.appendChild(step);
    }
    
    messageElement.parentNode.appendChild(stepsDiv);
    
    // Add event listeners
    var prevTutorialBtn = document.getElementById('prev-tutorial-btn');
    if (prevTutorialBtn) {
      prevTutorialBtn.addEventListener('click', function() {
        tutorialStep = Math.max(0, tutorialStep - 1);
        showTutorialStep();
      });
    }
    
    var nextTutorialBtn = document.getElementById('next-tutorial-btn');
    if (nextTutorialBtn) {
      nextTutorialBtn.addEventListener('click', function() {
        tutorialStep = Math.min(TUTORIAL_MESSAGES.length - 1, tutorialStep + 1);
        showTutorialStep();
      });
    }
    
    var finishTutorialBtn = document.getElementById('finish-tutorial-btn');
    if (finishTutorialBtn) {
      finishTutorialBtn.addEventListener('click', function() {
        tutorialActive = false;
        showMessage('All done! You\'re ready to start translating. Have fun!', 'happy', 5000);
      });
    }
    
    var skipAllTutorialBtn = document.getElementById('skip-all-tutorial-btn');
    if (skipAllTutorialBtn) {
      skipAllTutorialBtn.addEventListener('click', function() {
        tutorialActive = false;
        hide();
      });
    }
  };
  
  /**
   * Show a random tip
   */
  const showRandomTip = function() {
    if (!settings.enabled || !settings.showTips) return;
    
    const randomIndex = Math.floor(Math.random() * RANDOM_TIPS.length);
    showMessage('💡 Tip: ' + RANDOM_TIPS[randomIndex], 'pointing', 8000);
  };
  
  /**
   * Show a contextual tip based on user action
   * @param {string} context - The context to show a tip for
   */
  const showContextualTip = function(context) {
    if (!settings.enabled || !settings.showTips || tutorialActive) return;
    
    // Define tips for different contexts
    const contextualTips = {
      'project-created': 'Great! Now you can set up ChatGPT or OpenRouter in the Settings tab.',
      'translation-started': 'Translating... Use the Glossary tab to manage consistent terms.',
      'translation-completed': 'Translation complete! Don\'t forget to export or save your work.',
      'chapter-fetched': 'Chapter fetched! You can fetch multiple chapters at once by increasing the Chapter Count.',
      'glossary-opened': 'The glossary helps maintain consistency. Try the AI generator to extract terms automatically!',
      'settings-opened': 'You can customize my appearance here! Try changing my style or hair color.'
    };
    
    // Show tip if available for this context
    if (contextualTips[context]) {
      showMessage(contextualTips[context], 'pointing', 6000);
    }
  };
  
  /**
   * Event handler for application events to show contextual tips
   * @param {string} action - The action that occurred
   */
  const handleAppAction = function(action) {
    if (!settings.enabled || !settings.showTips || tutorialActive) return;
    
    // Map actions to contexts
    const actionToContext = {
      'Project created': 'project-created',
      'Project added': 'project-created',
      'Translation started': 'translation-started',
      'Translation completed': 'translation-completed',
      'Chapter fetched': 'chapter-fetched',
      'Chapters fetched': 'chapter-fetched'
    };
    
    const context = actionToContext[action];
    if (context) {
      // Add a slight delay so the tip appears after the action completes
      setTimeout(function() {
        showContextualTip(context);
      }, 500);
    }
    
    // Special handling for random tips
    // Show a random tip occasionally when actions occur
    if (!tipShown && Math.random() < 0.2) {
      setTimeout(function() {
        showRandomTip();
      }, 1000);
    }
  };
  
  /**
   * Set up listeners for tab changes to show contextual tips
   */
  const setupTabListeners = function() {
    // Main tabs
    document.querySelectorAll('.tab-btn').forEach(function(tab) {
      tab.addEventListener('click', function() {
        const tabId = tab.getAttribute('data-tab');
        
        if (tabId === 'glossary') {
          showContextualTip('glossary-opened');
        } else if (tabId === 'settings') {
          showContextualTip('settings-opened');
        }
      });
    });
    
    // Listen for last action updates
    const lastActionElement = document.getElementById('last-action');
    if (lastActionElement) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'characterData' || mutation.type === 'childList') {
            const action = lastActionElement.textContent;
            handleAppAction(action);
          }
        });
      });
      
      observer.observe(lastActionElement, {
        characterData: true,
        childList: true,
        subtree: true
      });
    }
  };
  
  return {
    initialize: initialize,
    showMessage: showMessage,
    hide: hide,
    showRandomTip: showRandomTip,
    showContextualTip: showContextualTip,
    setupTabListeners: setupTabListeners,
    settings: settings
  };
})();

// Ensure it's attached to the window
window.AnimeGuideService = AnimeGuideService;