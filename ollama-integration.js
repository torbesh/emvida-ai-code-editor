/**
 * Ollama Integration Module for Emvida AI Code Editor
 * Provides integration with Ollama API for local AI model access
 */

class OllamaIntegration {
    constructor() {
        this.defaultEndpoint = 'http://localhost:11434/api';
        this.defaultModel = 'gemma:2b';
    }

    /**
     * Execute a chat completion request to Ollama
     * @param {Object} params - Request parameters
     * @param {Array} params.messages - Array of message objects
     * @param {number} params.temperature - Temperature for generation
     * @param {string} params.model - Ollama model to use
     * @returns {Promise<Object>} - The response
     */
    async executeChatRequest(params) {
        const endpoint = `${this.defaultEndpoint}/chat`;
        const model = params.model || this.defaultModel;
        
        const requestBody = {
            model: model,
            messages: params.messages || [],
            temperature: params.temperature || 0.3,
            stream: false
        };
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Ollama request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Convert Ollama response to our expected format
            return {
                choices: [
                    {
                        message: {
                            role: 'assistant',
                            content: data.message?.content || ''
                        }
                    }
                ]
            };
        } catch (error) {
            console.error('Error calling Ollama:', error);
            throw error;
        }
    }
    
    /**
     * Execute a completion request to Ollama
     * @param {Object} params - Request parameters
     * @param {string} params.prompt - The prompt text
     * @param {number} params.temperature - Temperature for generation
     * @param {string} params.model - Ollama model to use
     * @returns {Promise<Object>} - The response
     */
    async executeCompletionRequest(params) {
        const endpoint = `${this.defaultEndpoint}/generate`;
        const model = params.model || this.defaultModel;
        
        const requestBody = {
            model: model,
            prompt: params.prompt || '',
            temperature: params.temperature || 0.3,
            stream: false
        };
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Ollama request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Convert Ollama response to our expected format
            return {
                choices: [
                    {
                        text: data.response || ''
                    }
                ]
            };
        } catch (error) {
            console.error('Error calling Ollama:', error);
            throw error;
        }
    }
    
    /**
     * Get available models from Ollama
     * @returns {Promise<Array>} - List of available models
     */
    async getAvailableModels() {
        const endpoint = `${this.defaultEndpoint}/tags`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ollama request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Error getting Ollama models:', error);
            return [];
        }
    }
}

// Export the class
window.OllamaIntegration = OllamaIntegration;
