/**
 * Qwen Integration Module for Emvida AI Code Editor
 * Provides integration with Qwen API for AI model access
 */

class QwenIntegration {
    constructor() {
        this.defaultEndpoint = 'https://dashscope.aliyuncs.com/api/v1';
        this.defaultModel = 'qwen-max';
    }

    /**
     * Execute a chat completion request to Qwen
     * @param {Object} params - Request parameters
     * @param {Array} params.messages - Array of message objects
     * @param {number} params.temperature - Temperature for generation
     * @param {string} params.model - Qwen model to use
     * @param {string} params.apiKey - Qwen API key
     * @returns {Promise<Object>} - The response
     */
    async executeChatRequest(params) {
        const endpoint = `${this.defaultEndpoint}/services/aigc/text-generation/generation`;
        const model = params.model || this.defaultModel;
        const apiKey = params.apiKey;
        
        if (!apiKey) {
            throw new Error('Qwen API key is required');
        }
        
        const requestBody = {
            model: model,
            input: {
                messages: params.messages || []
            },
            parameters: {
                temperature: params.temperature || 0.3,
                max_tokens: params.max_tokens || 4096
            }
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
                throw new Error(`Qwen request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Convert Qwen response to our expected format
            return {
                choices: [
                    {
                        message: {
                            role: 'assistant',
                            content: data.output?.text || ''
                        }
                    }
                ]
            };
        } catch (error) {
            console.error('Error calling Qwen:', error);
            throw error;
        }
    }
    
    /**
     * Execute a completion request to Qwen
     * @param {Object} params - Request parameters
     * @param {string} params.prompt - The prompt text
     * @param {number} params.temperature - Temperature for generation
     * @param {string} params.model - Qwen model to use
     * @param {string} params.apiKey - Qwen API key
     * @returns {Promise<Object>} - The response
     */
    async executeCompletionRequest(params) {
        // Qwen uses the chat format, so we convert to chat format
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
     * Get available models from Qwen
     * @param {string} apiKey - Qwen API key
     * @returns {Promise<Array>} - List of available models
     */
    async getAvailableModels(apiKey) {
        // Qwen doesn't have a models endpoint, so we return a static list
        return [
            { id: 'qwen-max', name: 'Qwen Max' },
            { id: 'qwen-plus', name: 'Qwen Plus' },
            { id: 'qwen-turbo', name: 'Qwen Turbo' }
        ];
    }
}

// Export the class
window.QwenIntegration = QwenIntegration;
