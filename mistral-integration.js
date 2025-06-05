/**
 * Mistral Integration Module for Emvida AI Code Editor
 * Provides integration with Mistral API for AI model access
 */

class MistralIntegration {
    constructor() {
        this.defaultEndpoint = 'https://api.mistral.ai/v1';
        this.defaultModel = 'mistral-large-latest';
    }

    /**
     * Execute a chat completion request to Mistral
     * @param {Object} params - Request parameters
     * @param {Array} params.messages - Array of message objects
     * @param {number} params.temperature - Temperature for generation
     * @param {string} params.model - Mistral model to use
     * @param {string} params.apiKey - Mistral API key
     * @returns {Promise<Object>} - The response
     */
    async executeChatRequest(params) {
        const endpoint = `${this.defaultEndpoint}/chat/completions`;
        const model = params.model || this.defaultModel;
        const apiKey = params.apiKey;
        
        if (!apiKey) {
            throw new Error('Mistral API key is required');
        }
        
        const requestBody = {
            model: model,
            messages: params.messages || [],
            temperature: params.temperature || 0.3,
            max_tokens: params.max_tokens || 4096
        };
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Mistral request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Return Mistral response (already in compatible format)
            return data;
        } catch (error) {
            console.error('Error calling Mistral:', error);
            throw error;
        }
    }
    
    /**
     * Execute a completion request to Mistral
     * @param {Object} params - Request parameters
     * @param {string} params.prompt - The prompt text
     * @param {number} params.temperature - Temperature for generation
     * @param {string} params.model - Mistral model to use
     * @param {string} params.apiKey - Mistral API key
     * @returns {Promise<Object>} - The response
     */
    async executeCompletionRequest(params) {
        // Mistral doesn't have a dedicated completions endpoint, so we convert to chat format
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant.' },
            { role: 'user', content: params.prompt || '' }
        ];
        
        const result = await this.executeChatRequest({
            messages: messages,
            temperature: params.temperature,
            model: params.model,
            apiKey: params.apiKey,
            max_tokens: params.max_tokens
        });
        
        // Convert chat response to completion format
        return {
            choices: [
                {
                    text: result.choices[0]?.message?.content || ''
                }
            ]
        };
    }
    
    /**
     * Get available models from Mistral
     * @param {string} apiKey - Mistral API key
     * @returns {Promise<Array>} - List of available models
     */
    async getAvailableModels(apiKey) {
        const endpoint = `${this.defaultEndpoint}/models`;
        
        if (!apiKey) {
            throw new Error('Mistral API key is required');
        }
        
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Mistral request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error getting Mistral models:', error);
            return [];
        }
    }
}

// Export the class
window.MistralIntegration = MistralIntegration;
