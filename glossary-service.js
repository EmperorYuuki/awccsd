/**
 * Glossary Service for QuillSync AI
 * This module handles glossary CRUD operations and term replacement
 */

// IMPORTANT: Define GlossaryService directly on window object
window.GlossaryService = {
  /**
   * Get all glossary entries for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Array of glossary entries
   */
  getGlossaryEntries: function(projectId) {
    return new Promise(function(resolve, reject) {
      try {
        if (!projectId) {
          reject(new Error('Project ID is required'));
          return;
        }
        
        window.StorageUtils.getByIndex('glossary', 'projectId', projectId).then(function(entries) {
          resolve(entries || []);
        }).catch(function(error) {
          console.error('Error getting glossary entries:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Error in getGlossaryEntries:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Add a new glossary entry
   * @param {Object} entry - Glossary entry to add
   * @returns {Promise<Object>} The added entry
   */
  addGlossaryEntry: function(entry) {
    return new Promise(function(resolve, reject) {
      try {
        if (!entry.projectId) {
          reject(new Error('Project ID is required'));
          return;
        }
        
        if (!entry.chineseTerm || !entry.translation) {
          reject(new Error('Chinese term and translation are required'));
          return;
        }
        
        // Check for duplicates
        window.GlossaryService.getGlossaryEntries(entry.projectId).then(function(existingEntries) {
          var duplicate = existingEntries.find(function(e) { 
            return e.chineseTerm === entry.chineseTerm; 
          });
          
          if (duplicate) {
            reject(new Error('A glossary entry for "' + entry.chineseTerm + '" already exists'));
            return;
          }
          
          // Add ID if not provided
          if (!entry.id) {
            entry.id = window.StorageUtils.generateUUID();
          }
          
          window.StorageUtils.saveItem('glossary', entry).then(function() {
            resolve(entry);
          }).catch(function(error) {
            reject(error);
          });
        }).catch(function(error) {
          reject(error);
        });
      } catch (error) {
        console.error('Error adding glossary entry:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Update a glossary entry
   * @param {Object} entry - Updated entry
   * @returns {Promise<Object>} The updated entry
   */
  updateGlossaryEntry: function(entry) {
    return new Promise(function(resolve, reject) {
      try {
        if (!entry.id) {
          reject(new Error('Entry ID is required'));
          return;
        }
        
        // Check if the entry exists
        window.StorageUtils.getItem('glossary', entry.id).then(function(existingEntry) {
          if (!existingEntry) {
            reject(new Error('Glossary entry with ID "' + entry.id + '" not found'));
            return;
          }
          
          // Check for duplicates if chineseTerm changed
          if (entry.chineseTerm !== existingEntry.chineseTerm) {
            window.GlossaryService.getGlossaryEntries(entry.projectId).then(function(existingEntries) {
              var duplicate = existingEntries.find(function(e) {
                return e.chineseTerm === entry.chineseTerm && e.id !== entry.id;
              });
              
              if (duplicate) {
                reject(new Error('A glossary entry for "' + entry.chineseTerm + '" already exists'));
                return;
              }
              
              window.StorageUtils.saveItem('glossary', entry).then(function() {
                resolve(entry);
              }).catch(function(error) {
                reject(error);
              });
            }).catch(function(error) {
              reject(error);
            });
          } else {
            window.StorageUtils.saveItem('glossary', entry).then(function() {
              resolve(entry);
            }).catch(function(error) {
              reject(error);
            });
          }
        }).catch(function(error) {
          reject(error);
        });
      } catch (error) {
        console.error('Error updating glossary entry:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Delete a glossary entry
   * @param {string} entryId - Entry ID to delete
   * @returns {Promise<void>}
   */
  deleteGlossaryEntry: function(entryId) {
    return new Promise(function(resolve, reject) {
      try {
        window.StorageUtils.deleteItem('glossary', entryId).then(function() {
          resolve();
        }).catch(function(error) {
          reject(error);
        });
      } catch (error) {
        console.error('Error deleting glossary entry:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Delete multiple glossary entries
   * @param {Array} entryIds - Array of entry IDs to delete
   * @returns {Promise<void>}
   */
  deleteMultipleGlossaryEntries: function(entryIds) {
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Create array of delete promises
        const deletePromises = entryIds.map(id => 
          window.StorageUtils.deleteItem('glossary', id)
        );
        
        // Execute all deletes in parallel
        Promise.all(deletePromises)
          .then(() => {
            resolve();
          })
          .catch(error => {
            console.error('Error deleting multiple glossary entries:', error);
            reject(error);
          });
      } catch (error) {
        console.error('Error in deleteMultipleGlossaryEntries:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Apply glossary replacements to text
   * @param {string} text - Text to process
   * @param {Array} entries - Glossary entries to apply
   * @returns {string} Processed text with replacements
   */
  applyGlossary: function(text, entries) {
    if (!text || !Array.isArray(entries) || entries.length === 0) {
      return text;
    }
    
    var processedText = text;
    
    // Sort entries by Chinese term length (longest first) to prevent partial replacements
    var sortedEntries = entries.slice().sort(function(a, b) {
      return b.chineseTerm.length - a.chineseTerm.length;
    });
    
    // Replace each term
    for (var i = 0; i < sortedEntries.length; i++) {
      var entry = sortedEntries[i];
      if (!entry.chineseTerm || !entry.translation) continue;
      
      // Create a regex that matches the Chinese term
      var regex = new RegExp(entry.chineseTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedText = processedText.replace(regex, entry.translation);
    }
    
    return processedText;
  },
  
  /**
   * Import glossary entries from JSON
   * @param {string} projectId - Project ID to import to
   * @param {string} json - JSON string with glossary entries
   * @param {string} strategy - Import strategy ('merge' or 'replace')
   * @returns {Promise<Object>} Import results
   */
  importGlossary: function(projectId, json, strategy) {
    if (strategy === undefined) strategy = 'merge';
    
    return new Promise(function(resolve, reject) {
      try {
        if (!projectId) {
          reject(new Error('Project ID is required'));
          return;
        }
        
        // Parse JSON
        var entries;
        try {
          entries = JSON.parse(json);
        } catch (error) {
          reject(new Error('Invalid JSON format'));
          return;
        }
        
        if (!Array.isArray(entries)) {
          reject(new Error('Glossary data must be an array'));
          return;
        }
        
        // Statistics
        var stats = {
          total: entries.length,
          added: 0,
          skipped: 0,
          invalid: 0
        };
        
        // If replacing, delete all existing entries
        (strategy === 'replace' ? 
          window.GlossaryService.getGlossaryEntries(projectId).then(function(existingEntries) {
            var deletePromises = existingEntries.map(function(entry) {
              return window.GlossaryService.deleteGlossaryEntry(entry.id);
            });
            return Promise.all(deletePromises);
          }) : 
          Promise.resolve()
        ).then(function() {
          // Get existing entries for merge strategy
          return strategy === 'merge' ? 
            window.GlossaryService.getGlossaryEntries(projectId) : 
            Promise.resolve([]);
        }).then(function(existingEntries) {
          // Process each entry
          var addPromises = [];
          
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            
            // Validate entry
            if (!entry.chineseTerm || !entry.translation) {
              stats.invalid++;
              continue;
            }
            
            // Check for duplicates in merge strategy
            if (strategy === 'merge') {
              var duplicate = existingEntries.find(function(e) {
                return e.chineseTerm === entry.chineseTerm;
              });
              
              if (duplicate) {
                stats.skipped++;
                continue;
              }
            }
            
            // Prepare entry
            var newEntry = {
              id: window.StorageUtils.generateUUID(),
              projectId: projectId,
              chineseTerm: entry.chineseTerm,
              translation: entry.translation,
              notes: entry.notes || '',
              category: entry.category || 'other'
            };
            
            // Add to database
            addPromises.push(window.StorageUtils.saveItem('glossary', newEntry).then(function() {
              stats.added++;
            }));
          }
          
          return Promise.all(addPromises).then(function() {
            resolve({
              success: true,
              stats: stats
            });
          });
        }).catch(function(error) {
          reject(error);
        });
      } catch (error) {
        console.error('Error importing glossary:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Export glossary entries to JSON
   * @param {string} projectId - Project ID to export
   * @returns {Promise<string>} JSON string with glossary entries
   */
  exportGlossary: function(projectId) {
    return new Promise(function(resolve, reject) {
      try {
        if (!projectId) {
          reject(new Error('Project ID is required'));
          return;
        }
        
        window.GlossaryService.getGlossaryEntries(projectId).then(function(entries) {
          // Create a clean version without IDs and projectIds
          var exportData = entries.map(function(entry) {
            return {
              chineseTerm: entry.chineseTerm,
              translation: entry.translation,
              notes: entry.notes || '',
              category: entry.category || 'other'
            };
          });
          
          resolve(JSON.stringify(exportData, null, 2));
        }).catch(function(error) {
          reject(error);
        });
      } catch (error) {
        console.error('Error exporting glossary:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Validates glossary entries to ensure they have the required fields
   * @param {Array} entries - Array of glossary entry objects to validate
   * @returns {Array} Valid glossary entries
   */
  validateGlossaryEntries: function(entries) {
    if (!Array.isArray(entries)) {
      console.error('Glossary entries is not an array:', entries);
      return [];
    }
    
    return entries.filter(entry => {
      // Check if entry is an object
      if (!entry || typeof entry !== 'object') {
        console.warn('Invalid glossary entry (not an object):', entry);
        return false;
      }
      
      // Check required fields
      if (!entry.chineseTerm || typeof entry.chineseTerm !== 'string') {
        console.warn('Invalid glossary entry (missing or invalid chineseTerm):', entry);
        return false;
      }
      
      if (!entry.translation || typeof entry.translation !== 'string') {
        console.warn('Invalid glossary entry (missing or invalid translation):', entry);
        return false;
      }
      
      // Ensure optional fields have proper defaults
      if (!entry.notes || typeof entry.notes !== 'string') {
        entry.notes = '';
      }
      
      // Validate category if present, otherwise set to default
      const validCategories = ['character', 'location', 'technique', 'item', 'concept', 'title', 'organization', 'other'];
      if (!entry.category || typeof entry.category !== 'string' || !validCategories.includes(entry.category.toLowerCase())) {
        entry.category = 'other';
      }
      
      return true;
    });
  },

  /**
   * Verifies and corrects the generated glossary JSON using the AI.
   * @param {string} rawResponse - The raw response string from the initial glossary generation.
   * @param {string} model - The OpenRouter model to use.
   * @param {string} apiKey - The OpenRouter API key.
   * @returns {Promise<Array>} - A promise that resolves to the corrected array of glossary entries.
   */
  async verifyAndCorrectGlossary(rawResponse, model, apiKey) {
    // First, try to directly parse the response
    try {
      const directParse = JSON.parse(rawResponse);
      if (Array.isArray(directParse)) {
        console.log("JSON parsed successfully on first attempt");
        return this.validateGlossaryEntries(directParse);
      }
    } catch (directError) {
      console.log("Direct JSON parsing failed, attempting basic cleanup...", directError);
    }
    
    // Basic cleanup attempt - extract just the JSON part if it's wrapped in code blocks or other text
    try {
      let cleanedJson = rawResponse;
      
      // Remove markdown code blocks if present
      const jsonBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        cleanedJson = jsonBlockMatch[1];
        console.log("Extracted JSON from code block");
      }
      
      // Look for array start/end if not in a code block
      if (!jsonBlockMatch) {
        const arrayMatch = rawResponse.match(/\[\s*{[\s\S]*}\s*\]/);
        if (arrayMatch) {
          cleanedJson = arrayMatch[0];
          console.log("Extracted JSON array using regex");
        }
      }
      
      // Try parsing the cleaned JSON
      const cleanedParse = JSON.parse(cleanedJson);
      if (Array.isArray(cleanedParse)) {
        console.log("JSON parsed successfully after basic cleanup");
        return this.validateGlossaryEntries(cleanedParse);
      }
    } catch (cleanupError) {
      console.log("Basic cleanup parsing failed, will attempt AI correction...", cleanupError);
    }
    
    // Use AI to correct the JSON
    try {
      const prompt = window.TextUtils.generateGlossaryVerificationPrompt(rawResponse);
      console.log("Attempting AI-based JSON correction...");
      
      const correctedJson = await window.OpenRouterService.generateCompletion(
        model,
        prompt,
        0.0,  // Low temperature for JSON
        4096, // Sufficient tokens
        false
      );
      
      // Try to parse the AI-corrected JSON
      try {
        const parsed = JSON.parse(correctedJson);
        if (Array.isArray(parsed)) {
          console.log("AI correction successful, JSON is valid");
          return this.validateGlossaryEntries(parsed);
        } else {
          throw new Error("AI did not return a valid JSON array after correction.");
        }
      } catch (aiParseError) {
          console.warn("AI-corrected JSON still invalid. Attempting basic repair...", aiParseError);

          // Basic Repair (as a last resort):
          let jsonStr = correctedJson;
          jsonStr = jsonStr.replace(/}(\s*){/g, '},{'); // Add missing commas
          jsonStr = jsonStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // Ensure property names are quoted
          jsonStr = jsonStr.replace(/: "([^"]*)"/g, (match, value) => {  //Escape quotes inside values
                const escapedValue = value.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                return `: "${escapedValue}"`;
          });
          if (!jsonStr.trim().startsWith('[')) jsonStr = '[' + jsonStr.trim();  // Ensure starts with [
          if (!jsonStr.trim().endsWith(']')) jsonStr = jsonStr.trim() + ']';    // Ensure ends with ]

          try {
            const parsed = JSON.parse(jsonStr);
            if(Array.isArray(parsed)) { //check if array after the basic fix.
                console.log("Basic JSON repair successful.");
                return this.validateGlossaryEntries(parsed);
            } else {
                throw new Error("Basic repair failed, not an array")
            }
          } catch(basicRepairError) {
            console.error("Basic JSON repair failed:", jsonStr, basicRepairError);
            throw new Error("Failed to parse JSON after AI correction and basic repair."); // Give up
          }
      }
    } catch (apiError) {
      console.error("Error during AI verification/correction:", apiError);
      throw new Error("Failed to verify and correct glossary JSON: " + apiError.message);
    }
  },


  /**
   * Generate glossary entries from text using AI
   * @param {string} projectId - Project ID
   * @param {string} text - Text to analyze
   * @param {boolean} autoAdd - Whether to automatically add entries to glossary
   * @param {string} fandomContext - Optional fandom/universe context
   * @returns {Promise<Object>} Result object with entries and stats
   */
  generateGlossaryEntries: function(projectId, text, autoAdd, fandomContext) {
    if (autoAdd === undefined) autoAdd = true;

    return new Promise(function(resolve, reject) {
      try {
        if (!projectId) {
          reject(new Error('Project ID is required'));
          return;
        }

        if (!text) {
          reject(new Error('Text is required'));
          return;
        }

        window.ProjectService.getProject(projectId).then(function(project) {
          if (!project) {
            reject(new Error('Project not found'));
            return;
          }

          // Pass fandom context to the prompt generator if provided
          const prompt = window.TextUtils.generateGlossaryPrompt(text, fandomContext);
          const apiKey = project.settings?.openRouterApiKey;
          const model = project.settings?.openRouterModel || 'google/gemini-pro'; // Default

          if (!apiKey) {
            reject(new Error('OpenRouter API key is required. Please configure it in Settings tab.'));
            return;
          }
          
          if (window.UIUtils) {
            let message = 'Generating glossary entries...';
            if (fandomContext) {
              message = `Generating glossary entries for "${fandomContext}" context...`;
            }
            window.UIUtils.showNotification(message, 'info');
            window.UIUtils.toggleLoading(true, 'Analyzing text and generating glossary entries...');
          }
          
          // Initial generation
          window.OpenRouterService.generateCompletion(
            model,
            prompt,
            0.3, // Lower temperature
            4096  // Increase tokens
          )
          .then(response => {
            // Verification and correction
            return window.GlossaryService.verifyAndCorrectGlossary(response, model);
          })
          .then(correctedEntries => {
            // Use the corrected entries from here on
            let generatedEntries = correctedEntries;
            var stats = {
              total: generatedEntries.length,
              added: 0,
              skipped: 0,
              invalid: 0
            };

            // Get existing entries to avoid duplicates
            window.GlossaryService.getGlossaryEntries(projectId)
            .then(function(existingEntries) {
              var existingTerms = new Set();
              existingEntries.forEach(function(entry) {
                existingTerms.add(entry.chineseTerm);
              });

              var newEntries = [];
              var addPromises = [];

              // Process each entry
              for (var i = 0; i < generatedEntries.length; i++) {
                var entry = generatedEntries[i];

                // Validate entry (additional validation here for safety)
                if (!entry.chineseTerm || !entry.translation) {
                  stats.invalid++;
                  continue;
                }

                // Check for duplicates
                if (existingTerms.has(entry.chineseTerm)) {
                  stats.skipped++;
                  continue;
                }

                // Create entry object
                var newEntry = {
                  id: window.StorageUtils.generateUUID(),
                  projectId: projectId,
                  chineseTerm: entry.chineseTerm,
                  translation: entry.translation,
                  notes: entry.notes || '',
                  category: entry.category || 'other'
                };

                newEntries.push(newEntry);

                // Add to database if autoAdd is true
                if (autoAdd) {
                  addPromises.push(window.StorageUtils.saveItem('glossary', newEntry).then(function() {
                    stats.added++;
                  }));
                }
              }

              // Wait for all entries to be added
              Promise.all(addPromises).then(function() {
                if (window.UIUtils) {
                  window.UIUtils.toggleLoading(false);
                }

                resolve({
                  success: true,
                  entries: newEntries,
                  stats: stats,
                  fandomContext: fandomContext
                });
              }).catch(function(error) {
                if (window.UIUtils) {
                  window.UIUtils.toggleLoading(false);
                }
                reject(error);
              });
            }).catch(function(error) {
              if (window.UIUtils) {
                window.UIUtils.toggleLoading(false);
              }
              reject(error);
            });
          })
          .catch(error => {
            if (window.UIUtils) {
              window.UIUtils.toggleLoading(false);
            }
            console.error('Error generating glossary entries:', error);
            reject(error);
          });
        }).catch(function(error) {
          reject(error);
        });
      } catch (error) {
        if (window.UIUtils) {
          window.UIUtils.toggleLoading(false);
        }
        console.error('Error generating glossary entries:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Render the glossary table in the UI
   * @param {string} projectId - Project ID
   * @returns {Promise<void>}
   */
  renderGlossaryTable: function(projectId) {
    return new Promise(function(resolve, reject) {
      try {
        var tableBody = document.getElementById('glossary-terms-body');
        if (!tableBody || !projectId) {
          resolve();
          return;
        }
        
        // Get glossary entries
        window.GlossaryService.getGlossaryEntries(projectId).then(function(entries) {
          // Clear table
          tableBody.innerHTML = '';
          
          // Update select-all checkbox state
          var selectAllCheckbox = document.getElementById('select-all-terms');
          if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
          }
          
          // Update delete button state and selected count
          var deleteSelectedBtn = document.getElementById('delete-selected-terms');
          var selectedCountSpan = document.getElementById('selected-count');
          if (deleteSelectedBtn) {
            deleteSelectedBtn.disabled = true;
          }
          if (selectedCountSpan) {
            selectedCountSpan.textContent = '0';
          }
          
          // Add each entry
          entries.forEach(function(entry) {
            var row = document.createElement('tr');
            row.dataset.entryId = entry.id;
            
            // Checkbox Cell
            var checkboxCell = document.createElement('td');
            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'term-select-checkbox';
            checkbox.dataset.entryId = entry.id;
            checkbox.addEventListener('change', function() {
              // Update selected count and delete button state
              updateSelectionState();
            });
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
            
            // Chinese Term
            var termCell = document.createElement('td');
            termCell.textContent = entry.chineseTerm;
            row.appendChild(termCell);
            
            // Translation
            var translationCell = document.createElement('td');
            translationCell.textContent = entry.translation;
            row.appendChild(translationCell);
            
            // Category with badge
            var categoryCell = document.createElement('td');
            var categoryName = entry.category || 'other';
            var categoryBadge = document.createElement('span');
            categoryBadge.className = 'category-badge category-' + categoryName;
            categoryBadge.textContent = categoryName;
            categoryCell.appendChild(categoryBadge);
            row.appendChild(categoryCell);
            
            // Notes
            var notesCell = document.createElement('td');
            notesCell.textContent = entry.notes || '';
            row.appendChild(notesCell);
            
            // Actions
            var actionsCell = document.createElement('td');
            actionsCell.className = 'glossary-actions';
            
            // Edit button
            var editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit term';
            editBtn.className = 'small-btn';
            editBtn.addEventListener('click', function() {
              // Populate and show the edit modal
              var termChinese = document.getElementById('term-chinese');
              if (termChinese) termChinese.value = entry.chineseTerm;
              
              var termTranslation = document.getElementById('term-translation');
              if (termTranslation) termTranslation.value = entry.translation;
              
              var termCategory = document.getElementById('term-category');
              if (termCategory) termCategory.value = entry.category || 'other';
              
              var termNotes = document.getElementById('term-notes');
              if (termNotes) termNotes.value = entry.notes || '';
              
              // Store the entry ID as a data attribute
              var addTermModal = document.getElementById('add-term-modal');
              if (addTermModal) {
                addTermModal.dataset.entryId = entry.id;
                addTermModal.style.display = 'flex';
              }
            });
            actionsCell.appendChild(editBtn);
            
            // Delete button
            var deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = 'Delete term';
            deleteBtn.className = 'small-btn';
            deleteBtn.addEventListener('click', function() {
              if (confirm('Are you sure you want to delete the term "' + entry.chineseTerm + '"?')) {
                window.GlossaryService.deleteGlossaryEntry(entry.id).then(function() {
                  row.remove();
                  if (window.UIUtils) {
                    window.UIUtils.showNotification('Glossary term deleted', 'success');
                    window.UIUtils.updateLastAction('Glossary term deleted');
                  }
                }).catch(function(error) {
                  console.error('Error deleting glossary term:', error);
                  if (window.UIUtils) {
                    window.UIUtils.showNotification('Error deleting term: ' + error.message, 'error');
                  }
                });
              }
            });
            actionsCell.appendChild(deleteBtn);
            
            row.appendChild(actionsCell);
            tableBody.appendChild(row);
          });
          
          // Show empty state if no entries
          if (entries.length === 0) {
            var emptyRow = document.createElement('tr');
            var emptyCell = document.createElement('td');
            emptyCell.colSpan = 6; // Updated colspan to include the checkbox column
            emptyCell.className = 'empty-state';
            emptyCell.textContent = 'No glossary terms yet. Add terms to improve translation consistency.';
            emptyRow.appendChild(emptyCell);
            tableBody.appendChild(emptyRow);
          }
          
          resolve();
        }).catch(function(error) {
          console.error('Error rendering glossary table:', error);
          if (window.UIUtils) {
            window.UIUtils.showNotification('Error loading glossary: ' + error.message, 'error');
          }
          reject(error);
        });
      } catch (error) {
        console.error('Error rendering glossary table:', error);
        reject(error);
      }
    });
  },
  
  /**
   * Initialize the glossary service
   */
  initialize: function() {
    var self = this;
    
    try {
      console.log('Initializing GlossaryService');
      
      // Set up Add Term button
      var addTermBtn = document.getElementById('add-term-btn');
      if (addTermBtn) {
        addTermBtn.addEventListener('click', function() {
          // Clear form
          var termChinese = document.getElementById('term-chinese');
          if (termChinese) termChinese.value = '';
          
          var termTranslation = document.getElementById('term-translation');
          if (termTranslation) termTranslation.value = '';
          
          var termCategory = document.getElementById('term-category');
          if (termCategory) termCategory.value = 'other';
          
          var termNotes = document.getElementById('term-notes');
          if (termNotes) termNotes.value = '';
          
          // Clear entry ID
          var addTermModal = document.getElementById('add-term-modal');
          if (addTermModal) {
            addTermModal.dataset.entryId = '';
            addTermModal.style.display = 'flex';
          }
        });
      }
      
      // Set up Save Term button
      var saveTermBtn = document.getElementById('save-term-btn');
      if (saveTermBtn) {
        saveTermBtn.addEventListener('click', function() {
          var currentProject = window.ProjectService.getCurrentProject();
          if (!currentProject) {
            if (window.UIUtils) {
              window.UIUtils.showNotification('Please select a project first', 'warning');
            }
            return;
          }
          
          var termChinese = document.getElementById('term-chinese');
          var termTranslation = document.getElementById('term-translation');
          var termCategory = document.getElementById('term-category');
          var termNotes = document.getElementById('term-notes');
          var addTermModal = document.getElementById('add-term-modal');
          
          if (!termChinese || !termTranslation || !termCategory || !termNotes || !addTermModal) {
            console.error('Missing form elements');
            return;
          }
          
          var chineseTerm = termChinese.value.trim();
          var translation = termTranslation.value.trim();
          var category = termCategory.value;
          var notes = termNotes.value.trim();
          
          if (!chineseTerm || !translation) {
            if (window.UIUtils) {
              window.UIUtils.showNotification('Chinese term and translation are required', 'warning');
            }
            return;
          }
          
          try {
            var entryId = addTermModal.dataset.entryId;
            
            if (entryId) {
              // Update existing entry
              self.updateGlossaryEntry({
                id: entryId,
                projectId: currentProject.id,
                chineseTerm: chineseTerm,
                translation: translation,
                category: category,
                notes: notes
              }).then(function() {
                if (window.UIUtils) {
                  window.UIUtils.showNotification('Glossary term updated', 'success');
                  window.UIUtils.updateLastAction('Glossary term updated');
                }
                
                // Close modal
                addTermModal.style.display = 'none';
                
                // Refresh table
                self.renderGlossaryTable(currentProject.id);
              }).catch(function(error) {
                console.error('Error updating glossary term:', error);
                if (window.UIUtils) {
                  window.UIUtils.showNotification('Error updating term: ' + error.message, 'error');
                }
              });
            } else {
              // Add new entry
              self.addGlossaryEntry({
                projectId: currentProject.id,
                chineseTerm: chineseTerm,
                translation: translation,
                category: category,
                notes: notes
              }).then(function() {
                if (window.UIUtils) {
                  window.UIUtils.showNotification('Glossary term added', 'success');
                  window.UIUtils.updateLastAction('Glossary term added');
                }
                
                // Close modal
                addTermModal.style.display = 'none';
                
                // Refresh table
                self.renderGlossaryTable(currentProject.id);
              }).catch(function(error) {
                console.error('Error adding glossary term:', error);
                if (window.UIUtils) {
                  window.UIUtils.showNotification('Error adding term: ' + error.message, 'error');
                }
              });
            }
          } catch (error) {
            console.error('Error saving glossary term:', error);
            if (window.UIUtils) {
              window.UIUtils.showNotification('Error saving term: ' + error.message, 'error');
            }
          }
        });
      }
      
      // Set up Generate Glossary button
      var generateBtn = document.getElementById('generate-glossary-btn');
      if (generateBtn) {
        generateBtn.addEventListener('click', function() {
          var currentProject = window.ProjectService.getCurrentProject();
          if (!currentProject) {
            if (window.UIUtils) {
              window.UIUtils.showNotification('Please select a project first', 'warning');
            }
            return;
          }
          
          var inputText = document.getElementById('input-text');
          if (!inputText || !inputText.value.trim()) {
            if (window.UIUtils) {
              window.UIUtils.showNotification('Please enter text in the input area first', 'warning');
            }
            return;
          }
          
          try {
            var autoAddCheckbox = document.getElementById('auto-add-terms');
            var autoAdd = autoAddCheckbox ? autoAddCheckbox.checked : true;
            
            // Get fandom context if available
            var fandomContextInput = document.getElementById('fandom-context');
            var fandomContext = fandomContextInput ? fandomContextInput.value.trim() : '';
            
            self.generateGlossaryEntries(
              currentProject.id,
              inputText.value.trim(),
              autoAdd,
              fandomContext
            ).then(function(result) {
              if (result.success) {
                // Display generated terms
                var termsList = document.getElementById('generated-terms-list');
                if (termsList) {
                  termsList.innerHTML = '';
                  
                  if (result.entries.length === 0) {
                    termsList.innerHTML = '<div class="empty-state">No new terms found in the text.</div>';
                  } else {
                    for (var i = 0; i < result.entries.length; i++) {
                      var entry = result.entries[i];
                      var termCard = document.createElement('div');
                      termCard.className = 'generated-term-card';
                      
                      // Create category badge if category exists
                      var categoryBadge = '';
                      if (entry.category && entry.category !== 'other') {
                        categoryBadge = `<span class="category-badge category-${entry.category}">${entry.category}</span>`;
                      }
                      
                      termCard.innerHTML = '<div class="term-header">' +
                        '<div class="chinese-term">' + entry.chineseTerm + '</div>' +
                        '<div class="translation">' + entry.translation + '</div>' +
                        '</div>' +
                        (entry.notes ? '<div class="term-notes">' + entry.notes + '</div>' : '') +
                        '<div class="term-meta">' +
                        categoryBadge +
                        '</div>' +
                        '<div class="term-actions">' +
                        (autoAdd ? '' : '<button class="add-term-btn small-btn">' +
                        '<i class="fas fa-plus"></i> Add' +
                        '</button>') +
                        '</div>';
                      
                      // Add click handler for add button
                      if (!autoAdd) {
                        (function(entry, card) {
                          var addBtn = card.querySelector('.add-term-btn');
                          if (addBtn) {
                            addBtn.addEventListener('click', function() {
                              self.addGlossaryEntry(entry).then(function() {
                                card.classList.add('added');
                                addBtn.disabled = true;
                                addBtn.innerHTML = '<i class="fas fa-check"></i> Added';
                                
                                if (window.UIUtils) {
                                  window.UIUtils.showNotification('Term added to glossary', 'success');
                                }
                                
                                // Refresh table if visible
                                var glossaryTermsTab = document.getElementById('glossary-terms-tab');
                                if (glossaryTermsTab && glossaryTermsTab.classList.contains('active')) {
                                  self.renderGlossaryTable(currentProject.id);
                                }
                              }).catch(function(error) {
                                console.error('Error adding generated term:', error);
                                if (window.UIUtils) {
                                  window.UIUtils.showNotification('Error adding term: ' + error.message, 'error');
                                }
                              });
                            });
                          }
                        })(entry, termCard);
                      }
                      
                      termsList.appendChild(termCard);
                    }
                  }
                }
                
                if (window.UIUtils) {
                  let message = `Generated ${result.stats.total} terms.`;
                  if (autoAdd) {
                    message += ` Added ${result.stats.added}, skipped ${result.stats.skipped} duplicates.`;
                  }
                  if (result.fandomContext) {
                    message += ` Context: "${result.fandomContext}".`;
                  }
                  window.UIUtils.showNotification(message, 'success');
                }
                
                // Refresh table if terms were auto-added
                if (autoAdd && result.stats.added > 0) {
                  self.renderGlossaryTable(currentProject.id);
                }
                
                // Switch to the Generator tab
                if (window.UIUtils) {
                  window.UIUtils.activateSecondaryTab('glossary-generator');
                }
              }
            }).catch(function(error) {
              console.error('Error generating glossary:', error);
              if (window.UIUtils) {
                window.UIUtils.showNotification('Error generating glossary: ' + error.message, 'error');
              }
            });
          } catch (error) {
            console.error('Error generating glossary:', error);
            if (window.UIUtils) {
              window.UIUtils.showNotification('Error generating glossary: ' + error.message, 'error');
            }
          }
        });
      }
      
      // Set up Export Glossary button
      var exportBtn = document.getElementById('export-glossary-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', function() {
          var currentProject = window.ProjectService.getCurrentProject();
          if (!currentProject) {
            if (window.UIUtils) {
              window.UIUtils.showNotification('Please select a project first', 'warning');
            }
            return;
          }
          
          try {
            self.exportGlossary(currentProject.id).then(function(json) {
              // Create and download file
              var blob = new Blob([json], { type: 'application/json' });
              var url = URL.createObjectURL(blob);
              var a = document.createElement('a');
              a.href = url;
              a.download = 'glossary_' + currentProject.name.replace(/\s+/g, '_') + '.json';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              if (window.UIUtils) {
                window.UIUtils.showNotification('Glossary exported successfully', 'success');
                window.UIUtils.updateLastAction('Glossary exported');
              }
            }).catch(function(error) {
              console.error('Error exporting glossary:', error);
              if (window.UIUtils) {
                window.UIUtils.showNotification('Error exporting glossary: ' + error.message, 'error');
              }
            });
          } catch (error) {
            console.error('Error exporting glossary:', error);
            if (window.UIUtils) {
              window.UIUtils.showNotification('Error exporting glossary: ' + error.message, 'error');
            }
          }
        });
      }
      
      // Set up Import Glossary button
      var importBtn = document.getElementById('import-glossary-btn');
      if (importBtn) {
        importBtn.addEventListener('click', function() {
          var currentProject = window.ProjectService.getCurrentProject();
          if (!currentProject) {
            if (window.UIUtils) {
              window.UIUtils.showNotification('Please select a project first', 'warning');
            }
            return;
          }
          
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/json';
          
          input.addEventListener('change', function(e) {
            if (e.target.files.length === 0) return;
            
            var file = e.target.files[0];
            var reader = new FileReader();
            
            reader.onload = function(event) {
              try {
                var strategyRadios = document.querySelectorAll('input[name="import-strategy"]');
                var strategy = 'merge';
                
                for (var i = 0; i < strategyRadios.length; i++) {
                  if (strategyRadios[i].checked) {
                    strategy = strategyRadios[i].value;
                    break;
                  }
                }
                
                if (window.UIUtils) {
                  window.UIUtils.toggleLoading(true, 'Importing glossary...');
                }
                
                var json = event.target.result;
                self.importGlossary(
                  currentProject.id,
                  json,
                  strategy
                ).then(function(result) {
                  if (window.UIUtils) {
                    window.UIUtils.toggleLoading(false);
                  }
                  
                  if (result.success) {
                    if (window.UIUtils) {
                      window.UIUtils.showNotification(
                        'Imported ' + result.stats.total + ' terms. Added ' + 
                        result.stats.added + ', skipped ' + result.stats.skipped + 
                        ', invalid ' + result.stats.invalid + '.',
                        'success'
                      );
                    }
                    
                    // Refresh table
                    self.renderGlossaryTable(currentProject.id);
                    
                    if (window.UIUtils) {
                      window.UIUtils.updateLastAction('Glossary imported');
                    }
                  }
                }).catch(function(error) {
                  if (window.UIUtils) {
                    window.UIUtils.toggleLoading(false);
                  }
                  console.error('Error importing glossary:', error);
                  if (window.UIUtils) {
                    window.UIUtils.showNotification('Error importing glossary: ' + error.message, 'error');
                  }
                });
              } catch (error) {
                if (window.UIUtils) {
                  window.UIUtils.toggleLoading(false);
                }
                console.error('Error importing glossary:', error);
                if (window.UIUtils) {
                  window.UIUtils.showNotification('Error importing glossary: ' + error.message, 'error');
                }
              }
            };
            
            reader.readAsText(file);
          });
          
          input.click();
        });
      }
      
      // Set up glossary search
      var searchInput = document.getElementById('glossary-search');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          var query = searchInput.value.toLowerCase();
          var rows = document.querySelectorAll('#glossary-terms-body tr');
          
          rows.forEach(function(row) {
            var term = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';
            var translation = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';
            
            if (term.includes(query) || translation.includes(query)) {
              row.style.display = '';
            } else {
              row.style.display = 'none';
            }
          });
        });
      }
      
      // Set up category filter
      var categoryFilter = document.getElementById('glossary-category-filter');
      if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
          var category = categoryFilter.value;
          var rows = document.querySelectorAll('#glossary-terms-body tr');
          
          rows.forEach(function(row) {
            if (category === 'all' || (row.cells[3] && row.cells[3].textContent.trim().toLowerCase() === category)) {
              row.style.display = '';
            } else {
              row.style.display = 'none';
            }
          });
        });
      }
      
      // Set up tab change handler to refresh glossary
      var glossaryTab = document.querySelector('.tab-btn[data-tab="glossary"]');
      if (glossaryTab) {
        glossaryTab.addEventListener('click', function() {
          var currentProject = window.ProjectService.getCurrentProject();
          if (currentProject) {
            self.renderGlossaryTable(currentProject.id);
          }
        });
      }
      
      // Set up select all checkbox
      var selectAllCheckbox = document.getElementById('select-all-terms');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
          var checkboxes = document.querySelectorAll('.term-select-checkbox');
          checkboxes.forEach(function(checkbox) {
            checkbox.checked = selectAllCheckbox.checked;
          });
          
          // Update selected count and delete button state
          updateSelectionState();
        });
      }
      
      // Set up delete selected button
      var deleteSelectedBtn = document.getElementById('delete-selected-terms');
      if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', function() {
          var selectedCheckboxes = document.querySelectorAll('.term-select-checkbox:checked');
          var selectedIds = Array.from(selectedCheckboxes).map(function(checkbox) {
            return checkbox.dataset.entryId;
          });
          
          var count = selectedIds.length;
          if (count === 0) return;
          
          if (confirm(`Are you sure you want to delete ${count} selected term${count > 1 ? 's' : ''}?`)) {
            if (window.UIUtils) {
              window.UIUtils.toggleLoading(true, `Deleting ${count} glossary terms...`);
            }
            
            self.deleteMultipleGlossaryEntries(selectedIds)
              .then(function() {
                if (window.UIUtils) {
                  window.UIUtils.toggleLoading(false);
                  window.UIUtils.showNotification(`Successfully deleted ${count} glossary terms`, 'success');
                  window.UIUtils.updateLastAction(`Deleted ${count} glossary terms`);
                }
                
                // Refresh the table
                var currentProject = window.ProjectService.getCurrentProject();
                if (currentProject) {
                  self.renderGlossaryTable(currentProject.id);
                }
              })
              .catch(function(error) {
                if (window.UIUtils) {
                  window.UIUtils.toggleLoading(false);
                  window.UIUtils.showNotification(`Error deleting terms: ${error.message}`, 'error');
                }
                console.error('Error deleting multiple terms:', error);
              });
          }
        });
      }
      
      console.log('GlossaryService initialized successfully');
    } catch (error) {
      console.error('Error initializing glossary service:', error);
    }
  }
};

// Helper function to update selection state
function updateSelectionState() {
  var checkboxes = document.querySelectorAll('.term-select-checkbox');
  var selectedCheckboxes = document.querySelectorAll('.term-select-checkbox:checked');
  var totalCount = checkboxes.length;
  var selectedCount = selectedCheckboxes.length;
  
  // Update the selected count display
  var selectedCountSpan = document.getElementById('selected-count');
  if (selectedCountSpan) {
    selectedCountSpan.textContent = selectedCount;
  }
  
  // Update delete button state
  var deleteSelectedBtn = document.getElementById('delete-selected-terms');
  if (deleteSelectedBtn) {
    deleteSelectedBtn.disabled = selectedCount === 0;
  }
  
  // Update select all checkbox state
  var selectAllCheckbox = document.getElementById('select-all-terms');
  if (selectAllCheckbox) {
    if (selectedCount === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (selectedCount === totalCount) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }
}

// Log that GlossaryService has been properly initialized
console.log('GlossaryService initialized and attached to window object');