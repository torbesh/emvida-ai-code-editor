/**
 * Grok Integration Module for Emvida AI Code Editor
 * Provides integration with Grok API for AI model access
 */

class GrokIntegration {
    constructor() {
        this.defaultEndpoint = 'https://api.grok.x/v1';
        this.defaultModel = 'grok-1';
    }

    /**
     * Execute a chat completion request to Grok
     * @param {Object} params - Request parameters
     * @param {Array} params.messages - Array of message objects
     * @param {number} params.temperature - Temperature for generation
     * @param {string} params.model - Grok model to use
     * @param {string} params.apiKey - Grok API key
     * @returns {Promise<Object>} - The response
     */
    async executeChatRequest(params) {
        const endpoint = `${this.defaultEndpoint}/chat/completions`;
        const model = params.model || this.defaultModel;
        const apiKey = params.apiKey;
        
        if (!apiKey) {
            throw new Error('Grok API key is required');
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
                throw new Error(`Grok request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Return Grok response (already in compatible format)
            return data;
        } catch (error) {
            console.error('Error calling Grok:', error);
            throw error;
        }
    }
    
    /**
     * Execute a completion request to Grok
     * @param {Object} params - Request parameters
     * @param {string} params.prompt - The prompt text
     * @param {number} params.temperature - Temperature for generation
     * @param {string} params.model - Grok model to use
     * @param {string} params.apiKey - Grok API key
     * @returns {Promise<Object>} - The response
     */
    async executeCompletionRequest(params) {
        // Grok uses the chat completions API, so we convert to chat format
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
     * Get available models from Grok
     * @param {string} apiKey - Grok API key
     * @returns {Promise<Array>} - List of available models
     */
    async getAvailableModels(apiKey) {
        const endpoint = `${this.defaultEndpoint}/models`;
        
        if (!apiKey) {
            throw new Error('Grok API key is required');
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
                throw new Error(`Grok request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error getting Grok models:', error);
            return [];
        }
    }
}

// Export the class
window.GrokIntegration = GrokIntegration;
