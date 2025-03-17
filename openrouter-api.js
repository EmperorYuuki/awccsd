/**
 * OpenRouter API Service for QuillSync AI
 * This module handles interactions with the OpenRouter API
 */

// IMPORTANT: Define OpenRouterService directly on window object
window.OpenRouterService = {
  // Constants
  BASE_URL: 'https://openrouter.ai/api/v1',
  
  // Cache for models
  modelsCache: null,
  lastModelsFetch: null,
  
  // Translation state tracking
  isTranslating: false,
  currentTranslation: null,
  abortController: null,
  
  /**
   * Initialize the OpenRouter service
   * @returns {Promise<void>}
   */
  initialize: function() {
    try {
      console.log('Initializing OpenRouterService');
      
      // Set up event handlers with simplified binding
      this.setupEventHandlers();
      
      console.log('OpenRouterService initialized successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Error initializing OpenRouter service:', error);
      return Promise.reject(error);
    }
  },
  
  /**
   * Set up all event handlers
   */
  setupEventHandlers: function() {
    // Helper function to safely add event listener
    const addListener = (elementId, event, handler) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener(event, handler.bind(this));
      }
    };
    
    // Test connection button
    addListener('test-openrouter-btn', 'click', this.testConnection);
    
    // Refresh models button
    addListener('refresh-models-btn', 'click', this.refreshModels);
    
    // Save API key button
    addListener('save-api-key-btn', 'click', this.saveApiKey);
    
    // Model selection dropdown
    addListener('openrouter-model', 'change', this.handleModelChange);
    
    // Settings tab activation to load models
    const settingsTab = document.querySelector('.tab-btn[data-tab="settings"]');
    if (settingsTab) {
      settingsTab.addEventListener('click', async () => {
        // Populate OpenRouter API key from current project
        const currentProject = window.ProjectService?.getCurrentProject();
        if (currentProject) {
          const apiKeyInput = document.getElementById('openrouter-api-key');
          if (apiKeyInput) {
            apiKeyInput.value = currentProject.settings?.openRouterApiKey || '';
          }
          
          // Populate model selector if we have an API key
          if (currentProject.settings?.openRouterApiKey) {
            await this.populateModelSelector();
          }
        }
      });
    }
    
    // Initial population of API key if a project is loaded
    const currentProject = window.ProjectService?.getCurrentProject();
    if (currentProject) {
      const apiKeyInput = document.getElementById('openrouter-api-key');
      if (apiKeyInput) {
        apiKeyInput.value = currentProject.settings?.openRouterApiKey || '';
      }
    }
    
    // Cancel translation button
    addListener('cancel-translation-btn', 'click', this.cancelTranslation);
  },
  
  /**
   * Cancel ongoing translation
   */
  cancelTranslation: function() {
    if (this.isTranslating && this.abortController) {
      this.abortController.abort();
      this.isTranslating = false;
      this.currentTranslation = null;
      
      if (window.UIUtils) {
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
        window.UIUtils.showNotification('Translation cancelled', 'info');
        window.UIUtils.updateLastAction('Translation cancelled');
      }
    }
  },
  
  /**
   * Get API key for the current project
   * @returns {string|null} API key or null if not available
   */
  getApiKey: function() {
    const currentProject = window.ProjectService?.getCurrentProject();
    if (!currentProject) return null;
    
    return currentProject.settings?.openRouterApiKey || null;
  },
  
  /**
   * Get model for the current project
   * @returns {string|null} Model ID or null if not available
   */
  getModel: function() {
    const currentProject = window.ProjectService?.getCurrentProject();
    if (!currentProject) return null;
    
    return currentProject.settings?.openRouterModel || null;
  },
  
  /**
   * Test OpenRouter connection
   */
  testConnection: function() {
    // Use debounce to prevent rapid clicks
    if (this._testingConnection) return;
    this._testingConnection = true;
    setTimeout(() => { this._testingConnection = false; }, 1000);
    
    const apiKeyInput = document.getElementById('openrouter-api-key');
    if (!apiKeyInput || !apiKeyInput.value.trim()) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('Please enter an OpenRouter API key', 'warning');
      }
      return;
    }
    
    if (window.UIUtils) {
      window.UIUtils.toggleLoading(true, 'Testing OpenRouter connection...');
      window.UIUtils.toggleProgressBar(true);
      window.UIUtils.updateProgress(0, 'Connecting to API...');
    }
    
    // Save the API key to the current project
    const currentProject = window.ProjectService?.getCurrentProject();
    if (!currentProject) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('Please select a project first', 'warning');
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
      }
      return;
    }
    
    // Update project settings
    window.ProjectService.updateProjectSettings(currentProject.id, {
      openRouterApiKey: apiKeyInput.value.trim()
    })
    .then(() => {
      // Test connection by fetching models
      if (window.UIUtils) {
        window.UIUtils.updateProgress(30, 'Retrieving available models...');
      }
      return this.getAvailableModels(true);
    })
    .then(models => {
      // Progress update
      if (window.UIUtils) {
        window.UIUtils.updateProgress(70, 'Updating model selector...');
      }
      
      // Populate model selector
      return this.populateModelSelector()
        .then(() => models);
    })
    .then(models => {
      if (window.UIUtils) {
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
        window.UIUtils.updateProgress(100, 'Connection successful');
        
        // Enhanced success message with model information
        const recommendedModel = this.getRecommendedModel(models);
        let message = `Connection successful. Found ${models.length} available models.`;
        
        if (recommendedModel) {
          message += ` Recommended model: ${recommendedModel.name}.`;
        }
        
        window.UIUtils.showNotification(message, 'success');
        window.UIUtils.updateLastAction('OpenRouter connection verified');
      }
    })
    .catch(error => {
      if (window.UIUtils) {
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
        
        // Enhanced error message with troubleshooting help
        let errorMessage = `Connection failed: ${error.message}`;
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage += '. Please check your API key.';
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          errorMessage += '. Please check your internet connection.';
        }
        
        window.UIUtils.showNotification(errorMessage, 'error');
        window.UIUtils.updateLastAction('OpenRouter connection failed');
      }
      console.error('OpenRouter connection test failed:', error);
    });
  },
  
  /**
   * Get recommended model from the available models
   * @param {Array} models - List of available models
   * @returns {Object|null} Recommended model or null
   */
  getRecommendedModel: function(models) {
    if (!Array.isArray(models) || models.length === 0) return null;
    
    // Try to find Claude or GPT model with good balance of capability and speed
    const preferredModels = [
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'openai/gpt-4-turbo',
      'google/gemini-pro'
    ];
    
    for (const preferredId of preferredModels) {
      const model = models.find(m => m.id === preferredId);
      if (model) return model;
    }
    
    // Fall back to any Claude or GPT model
    const claudeModel = models.find(m => m.id.includes('claude'));
    if (claudeModel) return claudeModel;
    
    const gptModel = models.find(m => m.id.includes('gpt'));
    if (gptModel) return gptModel;
    
    // If no preferred models found, return the first available
    return models[0];
  },
  
  /**
   * Save API key
   */
  saveApiKey: function() {
    const apiKeyInput = document.getElementById('openrouter-api-key');
    if (!apiKeyInput) return;
    
    const currentProject = window.ProjectService?.getCurrentProject();
    if (!currentProject) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('Please select a project first', 'warning');
      }
      return;
    }
    
    const apiKey = apiKeyInput.value.trim();
    
    // Validate API key format (basic check)
    if (apiKey && !apiKey.match(/^[a-zA-Z0-9_-]{30,}$/)) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('The API key format appears invalid. Please check it.', 'warning');
      }
      // Continue anyway as the format might vary
    }
    
    window.ProjectService.updateProjectSettings(currentProject.id, {
      openRouterApiKey: apiKey
    })
    .then(() => {
      if (window.UIUtils) {
        window.UIUtils.showNotification('API key saved', 'success');
        window.UIUtils.updateLastAction('OpenRouter API key updated');
      }
      
      // If API key was added, try to populate the models
      if (apiKey && !this.modelsCache) {
        this.populateModelSelector();
      }
    })
    .catch(error => {
      console.error('Error saving API key:', error);
      if (window.UIUtils) {
        window.UIUtils.showNotification(`Error saving API key: ${error.message}`, 'error');
      }
    });
  },
  
  /**
   * Handle model change
   * @param {Event} e - Change event
   */
  handleModelChange: function(e) {
    const currentProject = window.ProjectService?.getCurrentProject();
    if (!currentProject) return;
    
    const modelId = e.target.value;
    
    // Find the model details to show additional info
    this.getAvailableModels().then(models => {
      const selectedModel = models.find(m => m.id === modelId);
      
      window.ProjectService.updateProjectSettings(currentProject.id, {
        openRouterModel: modelId
      })
      .then(() => {
        if (window.UIUtils) {
          let message = 'OpenRouter model updated';
          
          // Add pricing info if available
          if (selectedModel?.pricing) {
            const promptPrice = parseFloat(selectedModel.pricing.prompt || 0).toFixed(4);
            const completionPrice = parseFloat(selectedModel.pricing.completion || 0).toFixed(4);
            message += ` (Pricing: ${promptPrice}/${completionPrice} per 1M tokens)`;
          }
          
          window.UIUtils.updateLastAction(message);
          
          // Show notification with model info
          if (selectedModel) {
            window.UIUtils.showNotification(`Model set to ${selectedModel.name || modelId}`, 'success');
          }
        }
      })
      .catch(error => {
        console.error('Error saving model selection:', error);
        if (window.UIUtils) {
          window.UIUtils.showNotification(`Error saving model selection: ${error.message}`, 'error');
        }
      });
    }).catch(error => {
      console.error('Error getting model details:', error);
      // Still update the model setting even if we can't get details
      window.ProjectService.updateProjectSettings(currentProject.id, {
        openRouterModel: modelId
      });
    });
  },
  
  /**
   * Refresh models
   */
  refreshModels: function() {
    if (window.UIUtils) {
      window.UIUtils.showNotification('Refreshing models...', 'info');
    }
    
    this.populateModelSelector(true)
      .then(() => {
        if (window.UIUtils) {
          window.UIUtils.showNotification('Models refreshed', 'success');
          window.UIUtils.updateLastAction('OpenRouter models refreshed');
        }
      })
      .catch(error => {
        console.error('Error refreshing models:', error);
        if (window.UIUtils) {
          window.UIUtils.showNotification(`Error refreshing models: ${error.message}`, 'error');
        }
      });
  },
  
/**
 * Fetch available models from OpenRouter
 * @param {boolean} forceRefresh - Whether to force a refresh of the cache
 * @returns {Promise<Array>} Array of available models
 */
getAvailableModels: function(forceRefresh = false) {
  // Check cache first (cache for 24 hours)
  const now = Date.now();
  if (
    !forceRefresh && 
    this.modelsCache && 
    this.lastModelsFetch && 
    (now - this.lastModelsFetch < 24 * 60 * 60 * 1000)
  ) {
    console.log('Using cached models data from memory:', this.modelsCache.length, 'models');
    return Promise.resolve(this.modelsCache);
  }
  
  // Check for models in localStorage cache
  if (!forceRefresh && !this.modelsCache) {
    try {
      const cachedData = localStorage.getItem('openrouter_models_cache');
      const cacheTimestamp = localStorage.getItem('openrouter_models_timestamp');
      
      if (cachedData && cacheTimestamp) {
        const parsedData = JSON.parse(cachedData);
        const timestamp = parseInt(cacheTimestamp, 10);
        
        // Use cache if it's less than 24 hours old
        if (parsedData && Array.isArray(parsedData) && 
            timestamp && (now - timestamp < 24 * 60 * 60 * 1000)) {
          console.log('Using cached models data from localStorage:', parsedData.length, 'models');
          this.modelsCache = parsedData;
          this.lastModelsFetch = timestamp;
          return Promise.resolve(parsedData);
        }
      }
    } catch (e) {
      console.warn('Error reading from cache, will fetch from API:', e);
    }
  }
  
  // Get API key
  const apiKey = this.getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('OpenRouter API key is required. Please set it in the project settings.'));
  }
  
  console.log(`Fetching models from OpenRouter API: ${this.BASE_URL}/models`);
  
  // Create abort controller for timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
  
  return fetch(`${this.BASE_URL}/models`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin || 'https://quillsyncai.com',
      'X-Title': 'QuillSync AI'
    },
    signal: abortController.signal
  })
  .then(response => {
    clearTimeout(timeoutId);
    console.log(`OpenRouter API response status: ${response.status}`);
    
    if (!response.ok) {
      // Enhanced error handling with detailed logging
      return response.text().then(text => {
        try {
          const errorData = JSON.parse(text);
          console.error('OpenRouter API error response:', errorData);
          
          // Provide a more helpful error message
          if (response.status === 401) {
            throw new Error('API key is invalid or expired. Please check your OpenRouter API key.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          } else {
            throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || errorData.message || text}`);
          }
        } catch (e) {
          console.error('OpenRouter API raw error response:', text);
          throw new Error(`API request failed with status ${response.status}: ${text}`);
        }
      });
    }
    
    console.log('OpenRouter API response successful, parsing JSON...');
    return response.json();
  })
  .then(responseData => {
    // Log the response structure for debugging
    console.log('Raw API response received');
    
    // Check if the response has a data property (which appears to be the case)
    let modelData = responseData;
    
    // Handle the nested data structure that's coming back
    if (responseData && responseData.data && Array.isArray(responseData.data)) {
      console.log('Found models array in data property, using it directly');
      modelData = responseData.data;
    } else if (responseData && responseData.models && Array.isArray(responseData.models)) {
      console.log('Found models array in models property, using it directly');
      modelData = responseData.models;
    } else if (!Array.isArray(modelData)) {
      console.error('Unexpected response format, data is not in expected structure:', responseData);
      // Provide an empty array as a fallback to prevent errors
      modelData = [];
    }
    
    console.log(`Processing ${modelData.length} models from API response`);
    
    // Filter for models that support text generation
    const textModels = modelData.filter(model => {
      if (!model) return false;
      
      // Try different ways to check capabilities based on API response format
      if (model.capabilities && Array.isArray(model.capabilities)) {
        return model.capabilities.includes('chat') || model.capabilities.includes('completion');
      }
      
      // If capabilities is not present or not an array, include the model by default
      return true;
    });
    
    console.log(`Filtered to ${textModels.length} text generation models`);
    
    // Enhance models with additional metadata for better UI presentation
    const enhancedModels = textModels.map(model => {
      // Add provider display name
      if (model.id) {
        const provider = model.id.split('/')[0] || 'unknown';
        model.providerDisplayName = this.getProviderDisplayName(provider);
      }
      
      // Add model class category
      model.category = this.categorizeModel(model);
      
      return model;
    });
    
    // Sort models by category and name for better organization
    enhancedModels.sort((a, b) => {
      // Sort by category first
      if (a.category !== b.category) {
        // Premium models first
        if (a.category === 'premium') return -1;
        if (b.category === 'premium') return 1;
        // Then balanced models
        if (a.category === 'balanced') return -1;
        if (b.category === 'balanced') return 1;
        // Then economy models
        if (a.category === 'economy') return -1;
        if (b.category === 'economy') return 1;
      }
      
      // Sort by provider next
      const providerA = (a.id || '').split('/')[0] || '';
      const providerB = (b.id || '').split('/')[0] || '';
      if (providerA !== providerB) {
        return providerA.localeCompare(providerB);
      }
      
      // Finally, sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
    
    // Update cache in memory
    this.modelsCache = enhancedModels;
    this.lastModelsFetch = now;
    
    // Save to localStorage cache
    try {
      localStorage.setItem('openrouter_models_cache', JSON.stringify(enhancedModels));
      localStorage.setItem('openrouter_models_timestamp', now.toString());
      console.log('Models cached to localStorage successfully');
    } catch (e) {
      console.warn('Failed to save models to localStorage cache:', e);
    }
    
    return enhancedModels;
  })
  .catch(error => {
    clearTimeout(timeoutId);
    
    // Improved error handling with specific error types
    if (error.name === 'AbortError') {
      console.error('Request to fetch models timed out');
      throw new Error('Request to fetch models timed out. Please check your internet connection and try again.');
    }
    
    console.error('Error fetching OpenRouter models:', error);
    
    // If we have cached models, return them as fallback
    if (this.modelsCache && this.modelsCache.length > 0) {
      console.log('Using cached models as fallback after fetch error');
      return this.modelsCache;
    }
    
    throw error;
  });
},

  /**
   * Get display name for a model provider
   * @param {string} provider - Provider identifier from model.id
   * @returns {string} Formatted provider name
   */
  getProviderDisplayName: function(provider) {
    const providerNames = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google',
      'mistral': 'Mistral AI',
      'meta': 'Meta',
      'cohere': 'Cohere',
      'azure': 'Azure'
    };
    
    return providerNames[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
  },
  
  /**
   * Categorize model by its capabilities and pricing
   * @param {Object} model - Model data
   * @returns {string} Category label ('premium', 'balanced', 'economy')
   */
  categorizeModel: function(model) {
    // Premium models - high capability, usually higher cost
    if (model.id && (
        model.id.includes('gpt-4') || 
        model.id.includes('claude-3-opus') || 
        model.id.includes('claude-3-sonnet') || 
        model.id.includes('gemini-pro') ||
        model.id.includes('gemini-1.5')
    )) {
      return 'premium';
    }
    
    // Balanced models - good capability with moderate cost
    if (model.id && (
        model.id.includes('gpt-3.5') || 
        model.id.includes('claude-3-haiku') || 
        model.id.includes('claude-instant') ||
        model.id.includes('mistral-medium') ||
        model.id.includes('mistral-large')
    )) {
      return 'balanced';
    }
    
    // Economy models - more affordable but potentially less capable
    return 'economy';
  },
  
  /**
   * Populate the model selector dropdown
   * @param {boolean} forceRefresh - Whether to force a refresh of the models
   * @param {string} selectId - ID of the select element
   * @returns {Promise<void>}
   */
  populateModelSelector: function(forceRefresh = false, selectId = 'openrouter-model') {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) {
      console.warn(`Model selector element with ID '${selectId}' not found`);
      return Promise.resolve();
    }
    
    // Try to get API key
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.log('No API key available, showing API key required message');
      selectElement.innerHTML = '<option value="">API Key Required</option>';
      return Promise.resolve();
    }
    
    // Show loading state
    selectElement.innerHTML = '<option value="">Loading models...</option>';
    console.log('Fetching models for selector...');
    
    // Fetch models
    return this.getAvailableModels(forceRefresh)
      .then(models => {
        console.log(`Received ${models.length} models, organizing for selector...`);
        
        try {
          // Group models by category and provider
          const groupedModels = {};
          
          // Create categories first
          ['premium', 'balanced', 'economy'].forEach(category => {
            groupedModels[category] = {};
          });
          
          // Group by category then provider
          models.forEach(model => {
            if (!model.id) {
              console.warn('Model missing ID:', model);
              return;
            }
            
            const category = model.category || 'economy';
            const provider = model.id.split('/')[0] || 'unknown';
            
            if (!groupedModels[category][provider]) {
              groupedModels[category][provider] = [];
            }
            
            groupedModels[category][provider].push(model);
          });
          
          // Clear select and add default option
          selectElement.innerHTML = '<option value="">Select a model</option>';
          
          // Add models by category then provider
          ['premium', 'balanced', 'economy'].forEach(category => {
            if (Object.keys(groupedModels[category]).length === 0) return;
            
            // Create category group
            const categoryGroup = document.createElement('optgroup');
            categoryGroup.label = {
              'premium': '🌟 Premium Models',
              'balanced': '⚖️ Balanced Models',
              'economy': '💰 Economy Models'
            }[category];
            
            let hasModels = false;
            
            // Add provider groups within category
            Object.entries(groupedModels[category]).forEach(([provider, providerModels]) => {
              if (providerModels.length === 0) return;
              
              hasModels = true;
              
              // Create provider group
              const providerGroup = document.createElement('optgroup');
              providerGroup.label = '    ' + this.getProviderDisplayName(provider);
              providerGroup.style.marginLeft = '10px';
              
              // Add models for this provider
              providerModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                
                // Show pricing if available
                let pricingInfo = '';
                if (model.pricing) {
                  const promptPrice = parseFloat(model.pricing.prompt || 0).toFixed(4);
                  const completionPrice = parseFloat(model.pricing.completion || 0).toFixed(4);
                  pricingInfo = ` ($${promptPrice}/$${completionPrice})`;
                }
                
                option.textContent = `${model.name || model.id}${pricingInfo}`;
                
                // Add data attributes for additional info
                option.dataset.contextLength = model.context_length || 4096;
                if (model.pricing) {
                  option.dataset.promptPrice = model.pricing.prompt || 0;
                  option.dataset.completionPrice = model.pricing.completion || 0;
                }
                
                providerGroup.appendChild(option);
              });
              
              categoryGroup.appendChild(providerGroup);
            });
            
            if (hasModels) {
              selectElement.appendChild(categoryGroup);
            }
          });
          
          // Simple fallback if we couldn't organize by category and provider
          if (selectElement.options.length <= 1) {
            models.forEach(model => {
              if (!model.id) return;
              
              const option = document.createElement('option');
              option.value = model.id;
              option.textContent = model.name || model.id;
              selectElement.appendChild(option);
            });
          }
          
          // Restore previously selected model if any
          const currentProject = window.ProjectService?.getCurrentProject();
          if (currentProject?.settings?.openRouterModel) {
            selectElement.value = currentProject.settings.openRouterModel;
            
            // If the saved model doesn't exist in the list, show a warning
            if (selectElement.value !== currentProject.settings.openRouterModel) {
              if (window.UIUtils) {
                window.UIUtils.showNotification(
                  'The previously selected model is no longer available. Please select a new model.',
                  'warning'
                );
              }
            }
          }
          
          console.log('Successfully populated model selector');
        } catch (error) {
          console.error('Error while processing models for selector:', error);
          throw error;
        }
      })
      .catch(error => {
        console.error('Error populating model selector:', error);
        selectElement.innerHTML = '<option value="">Error loading models</option>';
        throw error;
      });
  },
  
  /**
   * Generate a completion using OpenRouter API
   * @param {string} model - Model ID
   * @param {string} prompt - Text prompt
   * @param {number} temperature - Temperature parameter (0-1)
   * @param {number} maxTokens - Maximum number of tokens to generate
   * @param {boolean} stream - Whether to stream the response
   * @returns {Promise<string|Response>} Generated text or response for streaming
   */
  generateCompletion: function(model, prompt, temperature = 0.7, maxTokens = 2000, stream = false) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return Promise.reject(new Error('OpenRouter API key is required. Please set it in the project settings.'));
    }
    
    if (!model) {
      return Promise.reject(new Error('Model ID is required. Please select a model in the Settings tab.'));
    }
    
    // Sanitize and validate input
    if (!prompt || typeof prompt !== 'string') {
      return Promise.reject(new Error('Invalid prompt provided'));
    }
    
    // Ensure temperature is within valid range
    temperature = Math.max(0, Math.min(1, temperature));
    
    // Ensure max tokens is reasonable 
    maxTokens = Math.max(100, Math.min(32000, maxTokens));
    
    console.log(`Generating completion with model: ${model}, streaming: ${stream}`);
    
    // Create abort controller
    this.abortController = new AbortController();
    
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      stream: stream,
      transforms: ["middle-out"]  // For handling very long texts
    };
    
    console.log(`Sending request to ${this.BASE_URL}/chat/completions`);
    
    // Set request timeout
    const timeoutId = setTimeout(() => {
      this.abortController.abort();
    }, 120000); // 2 minutes timeout
    
    return fetch(`${this.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin || 'https://quillsyncai.com',
        'X-Title': 'QuillSync AI'
      },
      body: JSON.stringify(requestBody),
      signal: this.abortController.signal
    })
    .then(response => {
      clearTimeout(timeoutId);
      console.log(`OpenRouter completion response status: ${response.status}`);
      
      if (!response.ok) {
        return response.text().then(text => {
          try {
            const errorData = JSON.parse(text);
            console.error('OpenRouter completion error:', errorData);
            
            // Enhanced error messages
            if (response.status === 401) {
              throw new Error('API key is invalid or expired. Please check your OpenRouter API key.');
            } else if (response.status === 429) {
              throw new Error('Rate limit exceeded. Please try again later or use a different model.');
            } else if (response.status === 400 && text.includes('context')) {
              throw new Error('Input is too long for this model. Please try a smaller chunk or different model.');
            } else {
              throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || errorData.message || text}`);
            }
          } catch (e) {
            console.error('OpenRouter completion raw error:', text);
            throw new Error(`API request failed with status ${response.status}: ${text}`);
          }
        });
      }
      
      if (stream) {
        console.log('Returning streaming response');
        // Return the response object for caller to handle streaming
        return response;
      } else {
        console.log('Processing non-streaming response');
        // Handle non-streaming response
        return response.json().then(data => {
          console.log('Received completion data');
          
          if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error('Unexpected completion response format:', data);
            throw new Error('Invalid response format from OpenRouter API');
          }
          
          // Extract and return content
          return data.choices[0].message.content;
        });
      }
    })
    .catch(error => {
      clearTimeout(timeoutId);
      
      // Enhanced error handling
      if (error.name === 'AbortError') {
        if (this.abortController.signal.reason === 'timeout') {
          console.error('Request timed out');
          throw new Error('The translation request timed out. The server might be busy, please try again later.');
        } else {
          console.error('Request was cancelled');
          throw new Error('Translation request was cancelled.');
        }
      }
      
      console.error('Error generating completion:', error);
      throw error;
    });
  },
  
  /**
   * Translate text using OpenRouter API
   * @param {boolean} useInput - Whether to use input text (true) or chapter text (false)
   */
  translateText: function(useInput = true) {
    // Prevent multiple concurrent translations
    if (this.isTranslating) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('Translation already in progress. Please wait or cancel the current translation.', 'warning');
      }
      return;
    }
    
    const currentProject = window.ProjectService?.getCurrentProject();
    if (!currentProject) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('Please select a project first', 'warning');
      }
      return;
    }
    
    // Check if OpenRouter is configured
    if (!currentProject.settings?.openRouterApiKey) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('OpenRouter API key is not configured. Please set it in Settings tab.', 'warning');
      }
      return;
    }
    
    if (!currentProject.settings?.openRouterModel) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('OpenRouter model is not selected. Please select a model in Settings tab.', 'warning');
      }
      return;
    }
    
    // Get source text
    let sourceText = '';
    if (useInput) {
      sourceText = document.getElementById('input-text')?.value?.trim() || '';
    } else {
      sourceText = document.getElementById('chapter-text')?.value?.trim() || '';
    }
    
    if (!sourceText) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('Please enter text to translate', 'warning');
      }
      return;
    }
    
    this.translateChineseText(sourceText, currentProject);
  },
  
  /**
   * Translate Chinese text to English
   * @param {string} chineseText - Chinese text to translate
   * @param {Object} project - Current project
   */
  translateChineseText: function(chineseText, project) {
    // Set translation state
    this.isTranslating = true;
    this.currentTranslation = null;
    
    if (window.UIUtils) {
      window.UIUtils.toggleLoading(true, 'Preparing translation with OpenRouter...');
      window.UIUtils.toggleProgressBar(true);
      window.UIUtils.updateProgress(0, 'Analyzing text...');
    }
    
    // Show cancel button if it exists
    const cancelBtn = document.getElementById('cancel-translation-btn');
    if (cancelBtn) {
      cancelBtn.style.display = 'block';
    }
    
    // Get chunking settings
    const strategy = document.getElementById('chunking-strategy')?.value || 'auto';
    const chunkSize = parseInt(document.getElementById('chunk-size')?.value) || 1000;
    
    // Check if glossary should be applied
    const applyGlossaryToggle = document.getElementById('apply-glossary-toggle');
    const shouldApplyGlossary = applyGlossaryToggle ? applyGlossaryToggle.checked : true;
    
    // Process text with or without glossary based on toggle
    if (shouldApplyGlossary) {
      // Apply glossary if available and toggle is on
      window.GlossaryService.getGlossaryEntries(project.id)
        .then(glossaryEntries => {
          let textToTranslate = chineseText;
          if (glossaryEntries.length > 0) {
            textToTranslate = window.GlossaryService.applyGlossary(chineseText, glossaryEntries);
            console.log(`Applied ${glossaryEntries.length} glossary terms`);
            
            if (window.UIUtils) {
              window.UIUtils.showNotification(`Applied ${glossaryEntries.length} glossary terms before translation`, 'info', 3000);
            }
          } else {
            console.log('No glossary terms to apply');
          }
          
          // Continue with translation process using processed text
          this.processTranslation(textToTranslate, chineseText, project, strategy, chunkSize);
        })
        .catch(error => {
          console.error('Error applying glossary:', error);
          // Continue with original text
          this.processTranslation(chineseText, chineseText, project, strategy, chunkSize);
        });
    } else {
      // Skip glossary application if toggle is off
      if (window.UIUtils) {
        window.UIUtils.showNotification('Glossary application skipped (toggle is off)', 'info', 3000);
      }
      
      // Continue with translation using original text
      this.processTranslation(chineseText, chineseText, project, strategy, chunkSize);
    }
  },
  
  /**
   * Process the translation after optional glossary application
   * @param {string} processedText - Text to translate (possibly with glossary applied)
   * @param {string} originalText - Original text before processing (for verification)
   * @param {Object} project - Current project
   * @param {string} strategy - Chunking strategy
   * @param {number} chunkSize - Chunk size
   */
  processTranslation: function(processedText, originalText, project, strategy, chunkSize) {
    // Chunk the text
    const textChunker = window.TextChunkerService || window.TextUtils;
    let chunks = [];
    
    if (textChunker) {
      if (strategy === 'auto' && textChunker.autoChunk) {
        chunks = textChunker.autoChunk(processedText, chunkSize);
      } else if (strategy === 'chapter' && textChunker.chunkByChapters) {
        chunks = textChunker.chunkByChapters(processedText);
      } else if (strategy === 'word-count' && textChunker.chunkByWordCount) {
        chunks = textChunker.chunkByWordCount(processedText, chunkSize);
      } else {
        // Fallback if specific method not found
        chunks = this.chunkText(processedText, chunkSize);
      }
    } else {
      // Fallback chunking if no chunker service is available
      chunks = this.chunkText(processedText, chunkSize);
    }
    
    if (chunks.length === 0) {
      this.isTranslating = false;
      if (window.UIUtils) {
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
        window.UIUtils.showNotification('No valid text chunks to translate', 'error');
      }
      return;
    }
    
    if (window.UIUtils) {
      window.UIUtils.updateProgress(5, `Preparing to translate ${chunks.length} chunks...`);
    }
    
    // Estimate tokens and cost
    this.estimateTokensAndCost(processedText, project.settings.openRouterModel)
      .then(estimateResult => {
        console.log('Translation estimate:', estimateResult);
        
        if (window.UIUtils) {
          let message = `Estimated ${estimateResult.estimatedTokens} tokens`;
          if (estimateResult.estimatedCost > 0) {
            message += ` (approx. $${estimateResult.estimatedCost.toFixed(5)})`;
          }
          window.UIUtils.updateProgress(10, message);
        }
        
        // Translate each chunk
        let fullTranslation = "";
        let progress = 10;
        const progressPerChunk = 85 / chunks.length;
        
        // Process chunks sequentially
        return chunks.reduce((promise, chunk, index) => {
          return promise.then(accumTranslation => {
            if (window.UIUtils) {
              window.UIUtils.updateProgress(
                Math.round(progress),
                `Translating chunk ${index + 1}/${chunks.length}`
              );
            }
            
            return this.translateChunk(
              chunk,
              project.settings.openRouterModel,
              project.instructions || '',
              partialTranslation => {
                // This callback is called with incremental updates if streaming
                if (window.quill) {
                  window.quill.setText(accumTranslation + partialTranslation);
                }
              }
            )
            .then(chunkTranslation => {
              const updatedTranslation = accumTranslation + (index > 0 ? '\n\n' : '') + chunkTranslation;
              
              // Update translation in editor
              if (window.quill) {
                window.quill.setText(updatedTranslation);
              }
              
              progress += progressPerChunk;
              return updatedTranslation;
            });
          });
        }, Promise.resolve(''))
        .then(finalTranslation => {
          if (window.UIUtils) {
            window.UIUtils.updateProgress(95, 'Finalizing translation...');
          }
          
          // Save the translation to the project
          if (window.quill) {
            return window.ProjectService.updateProjectOutput(
              project.id,
              window.quill.getContents().ops
            )
            .then(() => finalTranslation);
          }
          
          return finalTranslation;
        })
        .then(finalTranslation => {
          this.isTranslating = false;
          this.currentTranslation = finalTranslation;
          
          if (window.UIUtils) {
            window.UIUtils.updateProgress(100, 'Translation complete');
            window.UIUtils.showNotification('Translation completed successfully', 'success');
            window.UIUtils.updateLastAction('Translation completed');
            window.UIUtils.updateWordCounts();
          }
          
          // Verify translation if enabled in project settings
          if (project.settings?.autoVerify) {
            this.verifyTranslation(originalText, finalTranslation, project.settings.openRouterModel);
          }
          
          // Hide cancel button
          const cancelBtn = document.getElementById('cancel-translation-btn');
          if (cancelBtn) {
            cancelBtn.style.display = 'none';
          }
          
          if (window.UIUtils) {
            window.UIUtils.toggleLoading(false);
            window.UIUtils.toggleProgressBar(false);
          }
        });
      })
      .catch(error => {
        this.isTranslating = false;
        
        // Hide cancel button
        const cancelBtn = document.getElementById('cancel-translation-btn');
        if (cancelBtn) {
          cancelBtn.style.display = 'none';
        }
        
        if (window.UIUtils) {
          window.UIUtils.toggleLoading(false);
          window.UIUtils.toggleProgressBar(false);
          
          // Enhanced error message with recovery suggestions
          let errorMessage = `Translation failed: ${error.message}`;
          let errorType = 'error';
          
          if (error.name === 'AbortError') {
            errorMessage = 'Translation was cancelled.';
            errorType = 'info';
          } else if (error.message.includes('Invalid API key')) {
            errorMessage += ' Please check your API key in the Settings tab.';
          } else if (error.message.includes('Rate limit')) {
            errorMessage += ' Try again in a few minutes or select a different model.';
          } else if (error.message.includes('too long')) {
            errorMessage += ' Try using smaller chunks or a model with larger context.';
          }
          
          window.UIUtils.showNotification(errorMessage, errorType);
          window.UIUtils.updateLastAction('Translation failed');
        }
        
        console.error('Translation error:', error);
      });
  },
  
  /**
   * Basic chunking fallback if TextChunkerService is not available
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Target words per chunk
   * @returns {Array<string>} Chunked text
   */
  chunkText: function(text, chunkSize) {
    if (!text) return [];
    if (chunkSize === undefined) chunkSize = 1000;
    
    // If text is small enough, return as a single chunk
    const estimatedWords = text.split(/\s+/).length;
    if (estimatedWords <= chunkSize) {
      return [text];
    }
    
    // Split by paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;
    
    for (const paragraph of paragraphs) {
      const paragraphSize = paragraph.split(/\s+/).length;
      
      if (currentSize + paragraphSize <= chunkSize) {
        currentChunk.push(paragraph);
        currentSize += paragraphSize;
      } else {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join('\n\n'));
          currentChunk = [paragraph];
          currentSize = paragraphSize;
        } else {
          // Paragraph is larger than chunk size, force include it
          chunks.push(paragraph);
        }
      }
    }
    
    // Add the last chunk if there's anything left
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
    }
    
    return chunks;
  },
  
  /**
   * Translate a single chunk using OpenRouter
   * @param {string} chunk - Text chunk to translate
   * @param {string} model - Model ID to use
   * @param {string} customInstructions - Custom prompt instructions
   * @param {Function} progressCallback - Callback for streaming updates
   * @returns {Promise<string>} Translated text
   */
  translateChunk: function(chunk, model, customInstructions = '', progressCallback = null) {
    if (!chunk || typeof chunk !== 'string' || !chunk.trim()) {
      return Promise.reject(new Error('Invalid or empty chunk provided for translation'));
    }
    
    if (!model) {
      return Promise.reject(new Error('Model ID is required'));
    }
    
    // Prepare prompt - use TextUtils if available
    let prompt = '';
    if (window.TextUtils && typeof window.TextUtils.generateTranslationPrompt === 'function') {
      prompt = window.TextUtils.generateTranslationPrompt(chunk, customInstructions);
    } else {
      // Fallback prompt generation
      prompt = 'Translate this Chinese text to English:';
      if (customInstructions) {
        prompt = `${customInstructions}\n\n${prompt}`;
      }
      prompt = `${prompt}\n\n${chunk}`;
    }
    
    // Check if we should use streaming
    const useStream = !!progressCallback;
    
    if (useStream) {
      // Handle streaming response
      return this.generateCompletion(
        model,
        prompt,
        0.3, // Lower temperature for more consistent translations
        4000, // Higher max tokens for translations
        true  // Stream the response
      )
      .then(response => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        
        // Process the stream
        const processStream = ({ done, value }) => {
          if (done) return fullText;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data:')) continue;
            
            const jsonStr = line.replace('data:', '').trim();
            if (jsonStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(jsonStr);
              if (data.choices && data.choices[0]) {
                const content = data.choices[0].delta?.content || '';
                if (content) {
                  fullText += content;
                  
                  // Call progress callback
                  if (progressCallback) {
                    progressCallback(fullText);
                  }
                }
              }
            } catch (error) {
              console.warn('Error parsing streaming response:', error);
            }
          }
          
          // Continue reading
          return reader.read().then(processStream);
        };
        
        // Start reading
        return reader.read().then(processStream);
      });
    } else {
      // Non-streaming response
      return this.generateCompletion(
        model,
        prompt,
        0.3,  // Lower temperature for more consistent translations
        4000, // Higher max tokens for translations
        false // Don't stream
      );
    }
  },
  
  /**
   * Verify translation quality
   * @param {string} sourceText - Original Chinese text
   * @param {string} translatedText - English translation
   * @param {string} model - Model ID to use
   * @returns {Promise<Object>} Verification results
   */
  verifyTranslation: function(sourceText, translatedText, model) {
    if (!sourceText || !translatedText) {
      return Promise.reject(new Error('Source and translated text are required'));
    }
    
    if (!model) {
      return Promise.reject(new Error('Model ID is required'));
    }
    
    // Generate the verification prompt
    let prompt = '';
    if (window.TextUtils && typeof window.TextUtils.generateVerificationPrompt === 'function') {
      // This will better handle large texts and include glossary terms
      prompt = window.TextUtils.generateVerificationPrompt(sourceText, translatedText, []);
    } else {
      prompt = `I'll provide you with a Chinese text and its English translation.

Please verify the translation and check for:

1. Completeness: Ensure all content from the source is present in the translation.
2. Accuracy: Check if the meaning is conveyed correctly.

Respond in JSON format with the following structure:
{
  "completeness": 0-100 (percentage of content translated),
  "accuracy": 0-100 (estimated accuracy),
  "missingContent": ["List of sections/sentences missing"],
  "issues": [{
    "sourceText": "Original text",
    "translatedText": "Problematic translation",
    "issue": "Description of the issue",
    "suggestion": "Suggested correction"
  }]
}

Chinese Text:
${sourceText.length > 2000 ? sourceText.substring(0, 2000) + '...' : sourceText}

English Translation:
${translatedText.length > 2000 ? translatedText.substring(0, 2000) + '...' : translatedText}`;
    }
    
    // Get current project to get glossary entries
    const currentProject = window.ProjectService?.getCurrentProject();
    if (currentProject) {
      return window.GlossaryService.getGlossaryEntries(currentProject.id)
        .then(glossaryEntries => {
          // Update prompt with glossary if entries exist
          if (glossaryEntries.length > 0) {
            const glossarySection = 'Glossary Terms to Check:\n' +
              glossaryEntries
                .map(entry => `${entry.chineseTerm}: ${entry.translation}`)
                .join('\n');
            
            prompt += '\n\n' + glossarySection;
          }
          
          // Request verification from OpenRouter
          return this.generateCompletion(
            model,
            prompt,
            0.2,  // Very low temperature for consistent JSON
            2000, // Enough tokens for detailed verification
            false // Don't stream
          );
        })
        .then(response => {
          // Extract JSON from response
          let jsonStr = response;
          const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
          
          // Parse the JSON
          let results;
          try {
            results = JSON.parse(jsonStr);
          } catch (error) {
            console.error('Failed to parse verification response:', response);
            throw new Error('Invalid JSON response from verification service');
          }
          
          // Validate the response structure
          if (!results.completeness || !results.accuracy) {
            throw new Error('Invalid verification response format');
          }
          
          // Show detailed verification results to the user
          if (window.UIUtils) {
            let notificationType = 'info';
            
            // Determine notification type based on scores
            if (results.accuracy < 70 || results.completeness < 70) {
              notificationType = 'warning';
            } else if (results.accuracy >= 90 && results.completeness >= 90) {
              notificationType = 'success';
            }
            
            let message = `Translation Verification:\n` +
                          `Accuracy: ${results.accuracy}%, Completeness: ${results.completeness}%\n`;
            
            // Add issue summary if there are issues
            if (results.issues && results.issues.length > 0) {
              message += `Found ${results.issues.length} issues that may need review.\n`;
              
              // Add a few examples if available
              if (results.issues.length > 0) {
                message += `Example issue: ${results.issues[0].issue}`;
              }
            } else {
              message += 'No significant issues found.';
            }
            
            window.UIUtils.showNotification(message, notificationType, 10000);
          }
          
          return results;
        });
    } else {
      // If no project, just do basic verification without glossary
      return this.generateCompletion(
        model,
        prompt,
        0.2,
        2000,
        false
      )
      .then(response => {
        // Extract and parse JSON
        let jsonStr = response;
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        
        try {
          const results = JSON.parse(jsonStr);
          if (!results.completeness || !results.accuracy) {
            throw new Error('Invalid verification response format');
          }
          
          // Show simplified results notification
          if (window.UIUtils) {
            let notificationType = 'info';
            if (results.accuracy < 70 || results.completeness < 70) {
              notificationType = 'warning';
            } else if (results.accuracy >= 90 && results.completeness >= 90) {
              notificationType = 'success';
            }
            
            window.UIUtils.showNotification(
              `Translation quality: Accuracy ${results.accuracy}%, Completeness ${results.completeness}%`,
              notificationType,
              5000
            );
          }
          
          return results;
        } catch (error) {
          console.error('Failed to parse verification response:', response);
          throw new Error('Invalid JSON response from verification service');
        }
      });
    }
  },
  
  /**
   * Estimate token usage and cost for a text
   * @param {string} text - Text to estimate
   * @param {string} model - Model ID
   * @returns {Promise<Object>} Token usage and cost estimate
   */
  estimateTokensAndCost: function(text, model) {
    if (!text || !model) {
      return Promise.reject(new Error('Text and model are required'));
    }
    
    console.log(`Estimating tokens and cost for model: ${model}`);
    
    // Fetch model info to get pricing
    return this.getAvailableModels()
      .then(models => {
        const modelInfo = models.find(m => m.id === model);
        
        if (!modelInfo) {
          console.warn(`Model ${model} not found in available models, using default pricing`);
          // Create a dummy model info with zero pricing
          return {
            id: model,
            name: model,
            pricing: {
              prompt: 0,
              completion: 0
            }
          };
        }
        
        return modelInfo;
      })
      .then(modelInfo => {
        // Estimate tokens (rough approximation: ~4 chars per token for English, ~2 chars for Chinese)
        const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const otherCharCount = text.length - chineseCharCount;
        
        const tokenEstimate = Math.ceil(chineseCharCount / 2 + otherCharCount / 4);
        
        // Add some margin for system messages and instructions
        const totalTokens = tokenEstimate + 200;
        
        console.log(`Token estimate: ${totalTokens} (${chineseCharCount} Chinese chars, ${otherCharCount} other chars)`);
        
        // Calculate estimated cost
        let estimatedCost = 0;
        if (modelInfo.pricing) {
          // OpenRouter pricing is per 1M tokens
          const promptCost = (modelInfo.pricing.prompt || 0) * totalTokens / 1000000;
          
          // For completion, assume response is roughly same length as input
          const completionCost = (modelInfo.pricing.completion || 0) * totalTokens / 1000000;
          
          estimatedCost = promptCost + completionCost;
          console.log(`Estimated cost: ${estimatedCost.toFixed(6)} (prompt: ${promptCost.toFixed(6)}, completion: ${completionCost.toFixed(6)})`);
        }
        
        return {
          estimatedTokens: totalTokens,
          estimatedCost: estimatedCost,
          model: modelInfo.name || model,
          contextLength: modelInfo.context_length || 4096
        };
      })
      .catch(error => {
        console.error('Error estimating tokens and cost:', error);
        // Provide a fallback estimate to not block translation
        return {
          estimatedTokens: Math.ceil(text.length / 3) + 200,
          estimatedCost: 0,
          model: model,
          contextLength: 4096,
          isEstimateError: true
        };
      });
  }
};

// Log that OpenRouterService has been properly initialized
console.log('OpenRouterService initialized and attached to window object');