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
  
  /**
   * Initialize the OpenRouter service
   * @returns {Promise<void>}
   */
  initialize: function() {
    try {
      console.log('Initializing OpenRouterService');
      
      // Set up event handlers
      var testOpenRouterBtn = document.getElementById('test-openrouter-btn');
      if (testOpenRouterBtn) {
        testOpenRouterBtn.addEventListener('click', this.testConnection.bind(this));
      }
      
      var refreshModelsBtn = document.getElementById('refresh-models-btn');
      if (refreshModelsBtn) {
        refreshModelsBtn.addEventListener('click', this.refreshModels.bind(this));
      }
      
      var saveApiKeyBtn = document.getElementById('save-api-key-btn');
      if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', this.saveApiKey.bind(this));
      }
      
      var openRouterModel = document.getElementById('openrouter-model');
      if (openRouterModel) {
        openRouterModel.addEventListener('change', this.handleModelChange.bind(this));
      }
      
      // Populate model selector when settings tab is activated
      var settingsTab = document.querySelector('.tab-btn[data-tab="settings"]');
      if (settingsTab) {
        settingsTab.addEventListener('click', async () => {
          // Populate OpenRouter API key from current project
          var currentProject = window.ProjectService.getCurrentProject();
          if (currentProject) {
            var apiKeyInput = document.getElementById('openrouter-api-key');
            if (apiKeyInput) {
              apiKeyInput.value = currentProject.settings?.openRouterApiKey || '';
            }
            
            // Populate model selector
            await this.populateModelSelector();
          }
        });
      }
      
      // Initial population of API key and model settings if a project is loaded
      var currentProject = window.ProjectService.getCurrentProject();
      if (currentProject) {
        var apiKeyInput = document.getElementById('openrouter-api-key');
        if (apiKeyInput) {
          apiKeyInput.value = currentProject.settings?.openRouterApiKey || '';
        }
      }
      
      console.log('OpenRouterService initialized successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Error initializing OpenRouter service:', error);
      return Promise.reject(error);
    }
  },
  
  /**
   * Get API key for the current project
   * @returns {string|null} API key or null if not available
   */
  getApiKey: function() {
    var currentProject = window.ProjectService.getCurrentProject();
    if (!currentProject) return null;
    
    return currentProject.settings?.openRouterApiKey || null;
  },
  
  /**
   * Get model for the current project
   * @returns {string|null} Model ID or null if not available
   */
  getModel: function() {
    var currentProject = window.ProjectService.getCurrentProject();
    if (!currentProject) return null;
    
    return currentProject.settings?.openRouterModel || null;
  },
  
  /**
   * Test OpenRouter connection
   */
  testConnection: function() {
    var apiKeyInput = document.getElementById('openrouter-api-key');
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
    var currentProject = window.ProjectService.getCurrentProject();
    if (!currentProject) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('Please select a project first', 'warning');
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
      }
      return;
    }
    
    window.ProjectService.updateProjectSettings(currentProject.id, {
      openRouterApiKey: apiKeyInput.value.trim()
    })
    .then(() => {
      // Test connection by fetching models
      return this.getAvailableModels(true);
    })
    .then(models => {
      // Populate model selector
      return this.populateModelSelector()
        .then(() => models);
    })
    .then(models => {
      if (window.UIUtils) {
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
        window.UIUtils.updateProgress(100, 'Connection successful');
        window.UIUtils.showNotification(`Connection successful. Found ${models.length} available models.`, 'success');
        window.UIUtils.updateLastAction('OpenRouter connection verified');
      }
    })
    .catch(error => {
      if (window.UIUtils) {
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
        window.UIUtils.showNotification(`Connection failed: ${error.message}`, 'error');
        window.UIUtils.updateLastAction('OpenRouter connection failed');
      }
      console.error('OpenRouter connection test failed:', error);
    });
  },
  
  /**
   * Save API key
   */
  saveApiKey: function() {
    var apiKeyInput = document.getElementById('openrouter-api-key');
    if (!apiKeyInput) return;
    
    var currentProject = window.ProjectService.getCurrentProject();
    if (!currentProject) {
      if (window.UIUtils) {
        window.UIUtils.showNotification('Please select a project first', 'warning');
      }
      return;
    }
    
    window.ProjectService.updateProjectSettings(currentProject.id, {
      openRouterApiKey: apiKeyInput.value.trim()
    })
    .then(() => {
      if (window.UIUtils) {
        window.UIUtils.showNotification('API key saved', 'success');
        window.UIUtils.updateLastAction('OpenRouter API key updated');
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
    var currentProject = window.ProjectService.getCurrentProject();
    if (!currentProject) return;
    
    window.ProjectService.updateProjectSettings(currentProject.id, {
      openRouterModel: e.target.value
    })
    .then(() => {
      if (window.UIUtils) {
        window.UIUtils.updateLastAction('OpenRouter model updated');
      }
    })
    .catch(error => {
      console.error('Error saving model selection:', error);
      if (window.UIUtils) {
        window.UIUtils.showNotification(`Error saving model selection: ${error.message}`, 'error');
      }
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
  var now = Date.now();
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
  
  var apiKey = this.getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('OpenRouter API key is required. Please set it in the project settings.'));
  }
  
  console.log(`Fetching models from OpenRouter API: ${this.BASE_URL}/models`);
  
  return fetch(`${this.BASE_URL}/models`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin || 'https://quillsyncai.com',
      'X-Title': 'QuillSync AI'
    }
  })
  .then(response => {
    console.log(`OpenRouter API response status: ${response.status}`);
    
    if (!response.ok) {
      // Enhanced error handling with detailed logging
      return response.text().then(text => {
        try {
          const errorData = JSON.parse(text);
          console.error('OpenRouter API error response:', errorData);
          throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || errorData.message || text}`);
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
    var textModels = modelData.filter(model => {
      if (!model) return false;
      
      // Try different ways to check capabilities based on API response format
      if (model.capabilities && Array.isArray(model.capabilities)) {
        return model.capabilities.includes('chat') || model.capabilities.includes('completion');
      }
      
      // If capabilities is not present or not an array, include the model by default
      return true;
    });
    
    console.log(`Filtered to ${textModels.length} text generation models`);
    
    // Update cache in memory
    this.modelsCache = textModels;
    this.lastModelsFetch = now;
    
    // Save to localStorage cache
    try {
      localStorage.setItem('openrouter_models_cache', JSON.stringify(textModels));
      localStorage.setItem('openrouter_models_timestamp', now.toString());
      console.log('Models cached to localStorage successfully');
    } catch (e) {
      console.warn('Failed to save models to localStorage cache:', e);
    }
    
    return textModels;
  })
  .catch(error => {
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
   * Populate the model selector dropdown
   * @param {boolean} forceRefresh - Whether to force a refresh of the models
   * @param {string} selectId - ID of the select element
   * @returns {Promise<void>}
   */
  populateModelSelector: function(forceRefresh = false, selectId = 'openrouter-model') {
    var selectElement = document.getElementById(selectId);
    if (!selectElement) {
      console.warn(`Model selector element with ID '${selectId}' not found`);
      return Promise.resolve();
    }
    
    // Try to get API key
    var apiKey = this.getApiKey();
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
          // Sort models by provider then name
          models.sort((a, b) => {
            var providerA = (a.id || '').split('/')[0] || '';
            var providerB = (b.id || '').split('/')[0] || '';
            
            if (providerA !== providerB) {
              return providerA.localeCompare(providerB);
            }
            
            return (a.name || '').localeCompare(b.name || '');
          });
          
          // Group models by provider
          var groupedModels = {};
          models.forEach(model => {
            if (!model.id) {
              console.warn('Model missing ID:', model);
              return;
            }
            
            var provider = model.id.split('/')[0] || 'unknown';
            if (!groupedModels[provider]) {
              groupedModels[provider] = [];
            }
            groupedModels[provider].push(model);
          });
          
          // Clear select
          selectElement.innerHTML = '<option value="">Select a model</option>';
          
          // Add optgroups for each provider
          Object.entries(groupedModels).forEach(([provider, providerModels]) => {
            var optgroup = document.createElement('optgroup');
            optgroup.label = provider.charAt(0).toUpperCase() + provider.slice(1);
            
            providerModels.forEach(model => {
              var option = document.createElement('option');
              option.value = model.id;
              
              // Show pricing if available
              var pricingInfo = '';
              if (model.pricing) {
                var promptPrice = parseFloat(model.pricing.prompt || 0).toFixed(4);
                var completionPrice = parseFloat(model.pricing.completion || 0).toFixed(4);
                pricingInfo = ` (${promptPrice}/${completionPrice})`;
              }
              
              option.textContent = `${model.name || model.id}${pricingInfo}`;
              
              // Add data attributes for additional info
              option.dataset.contextLength = model.context_length || 4096;
              if (model.pricing) {
                option.dataset.promptPrice = model.pricing.prompt || 0;
                option.dataset.completionPrice = model.pricing.completion || 0;
              }
              
              optgroup.appendChild(option);
            });
            
            selectElement.appendChild(optgroup);
          });
          
          // Restore previously selected model if any
          var currentProject = window.ProjectService.getCurrentProject();
          if (currentProject?.settings?.openRouterModel) {
            selectElement.value = currentProject.settings.openRouterModel;
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
    var apiKey = this.getApiKey();
    if (!apiKey) {
      return Promise.reject(new Error('OpenRouter API key is required. Please set it in the project settings.'));
    }
    
    console.log(`Generating completion with model: ${model}, streaming: ${stream}`);
    
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
    
    return fetch(`${this.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin || 'https://quillsyncai.com',
        'X-Title': 'QuillSync AI'
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      console.log(`OpenRouter completion response status: ${response.status}`);
      
      if (!response.ok) {
        return response.text().then(text => {
          try {
            const errorData = JSON.parse(text);
            console.error('OpenRouter completion error:', errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || errorData.message || text}`);
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
          console.log('Received completion data:', data);
          
          if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error('Unexpected completion response format:', data);
            throw new Error('Invalid response format from OpenRouter API');
          }
          
          return data.choices[0].message.content;
        });
      }
    })
    .catch(error => {
      console.error('Error generating completion:', error);
      throw error;
    });
  },
  
  /**
   * Translate text using OpenRouter API
   * @param {boolean} useInput - Whether to use input text (true) or chapter text (false)
   */
  translateText: function(useInput = true) {
    var currentProject = window.ProjectService.getCurrentProject();
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
    
    var sourceText = '';
    if (useInput) {
      sourceText = document.getElementById('input-text').value.trim();
    } else {
      sourceText = document.getElementById('chapter-text').value.trim();
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
  if (window.UIUtils) {
    window.UIUtils.toggleLoading(true, 'Preparing translation with OpenRouter...');
    window.UIUtils.toggleProgressBar(true);
    window.UIUtils.updateProgress(0, 'Analyzing text...');
  }
  
  // Get chunking settings
  var strategy = document.getElementById('chunking-strategy').value;
  var chunkSize = parseInt(document.getElementById('chunk-size').value) || 1000;
  
  // Check if glossary should be applied
  var applyGlossaryToggle = document.getElementById('apply-glossary-toggle');
  var shouldApplyGlossary = applyGlossaryToggle ? applyGlossaryToggle.checked : true;
  
  // Process text with or without glossary based on toggle
  if (shouldApplyGlossary) {
    // Apply glossary if available and toggle is on
    window.GlossaryService.getGlossaryEntries(project.id)
      .then(glossaryEntries => {
        var textToTranslate = chineseText;
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
  var chunks = window.TextChunkerService.chunkText(processedText, strategy, chunkSize);
  if (chunks.length === 0) {
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
        window.UIUtils.updateProgress(10, `Estimated tokens: ${estimateResult.estimatedTokens}`);
      }
      
      // Translate each chunk
      var fullTranslation = '';
      var progress = 10;
      var progressPerChunk = 85 / chunks.length;
      
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
            var updatedTranslation = accumTranslation + (index > 0 ? '\n\n' : '') + chunkTranslation;
            
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
        
        if (window.UIUtils) {
          window.UIUtils.toggleLoading(false);
          window.UIUtils.toggleProgressBar(false);
        }
      });
    })
    .catch(error => {
      if (window.UIUtils) {
        window.UIUtils.toggleLoading(false);
        window.UIUtils.toggleProgressBar(false);
        window.UIUtils.showNotification(`Translation failed: ${error.message}`, 'error');
        window.UIUtils.updateLastAction('Translation failed');
      }
      console.error('Translation error:', error);
    });
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
    
    // Prepare prompt
    var prompt = 'Translate this Chinese text to English:';
    if (customInstructions) {
      prompt = `${customInstructions}\n\n${prompt}`;
    }
    prompt = `${prompt}\n\n${chunk}`;
    
    // Check if we should use streaming
    var useStream = !!progressCallback;
    
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
    var prompt = '';
    if (window.TextUtils) {
      prompt = window.TextUtils.generateVerificationPrompt(
        sourceText,
        translatedText,
        []  // We'll get glossary entries separately
      );
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
${sourceText}

English Translation:
${translatedText}`;
    }
    
    // Get current project to get glossary entries
    var currentProject = window.ProjectService.getCurrentProject();
    if (currentProject) {
      return window.GlossaryService.getGlossaryEntries(currentProject.id)
        .then(glossaryEntries => {
          // Update prompt with glossary if entries exist
          if (glossaryEntries.length > 0) {
            var glossarySection = 'Glossary Terms to Check:\n' +
              glossaryEntries
                .map(function(entry) { return entry.chineseTerm + ': ' + entry.translation; })
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
          var jsonStr = response;
          var jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
          
          // Parse the JSON
          var results;
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
        var jsonStr = response;
        var jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        
        try {
          var results = JSON.parse(jsonStr);
          if (!results.completeness || !results.accuracy) {
            throw new Error('Invalid verification response format');
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
        var modelInfo = models.find(m => m.id === model);
        
        if (!modelInfo) {
          console.warn(`Model ${model} not found in available models, using default pricing`);
          // Create a dummy model info with zero pricing
          modelInfo = {
            id: model,
            name: model,
            pricing: {
              prompt: 0,
              completion: 0
            }
          };
        }
        
        // Estimate tokens (rough approximation: ~4 chars per token for English, ~2 chars for Chinese)
        var chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        var otherCharCount = text.length - chineseCharCount;
        
        var tokenEstimate = Math.ceil(chineseCharCount / 2 + otherCharCount / 4);
        
        // Add some margin for system messages and instructions
        var totalTokens = tokenEstimate + 200;
        
        console.log(`Token estimate: ${totalTokens} (${chineseCharCount} Chinese chars, ${otherCharCount} other chars)`);
        
        // Calculate estimated cost
        var estimatedCost = 0;
        if (modelInfo.pricing) {
          // OpenRouter pricing is per 1M tokens
          var promptCost = (modelInfo.pricing.prompt || 0) * totalTokens / 1000000;
          
          // For completion, assume response is roughly same length as input
          var completionCost = (modelInfo.pricing.completion || 0) * totalTokens / 1000000;
          
          estimatedCost = promptCost + completionCost;
          console.log(`Estimated cost: ${estimatedCost.toFixed(6)} (prompt: ${promptCost.toFixed(6)}, completion: ${completionCost.toFixed(6)})`);
        }
        
        return {
          estimatedTokens: totalTokens,
          estimatedCost: estimatedCost,
          model: modelInfo.name || model
        };
      })
      .catch(error => {
        console.error('Error estimating tokens and cost:', error);
        // Provide a fallback estimate to not block translation
        return {
          estimatedTokens: Math.ceil(text.length / 3) + 200,
          estimatedCost: 0,
          model: model,
          isEstimateError: true
        };
      });
  }
};

// Log that OpenRouterService has been properly initialized
console.log('OpenRouterService initialized and attached to window object');