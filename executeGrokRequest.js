/**
 * Execute a request to Grok
 * @param {string} type - The request type
 * @param {Object} params - The request parameters
 * @returns {Promise<Object>} - The response
 */
async executeGrokRequest(type, params) {
    if (!this.grokIntegration) {
        this.grokIntegration = window.GrokIntegration ? new window.GrokIntegration() : null;
    }
    
    if (!this.grokIntegration) {
        throw new Error('Grok integration not available');
    }
    
    const modelInfo = this.models['grok'];
    const modelName = modelInfo.defaultModel;
    
    if (type === 'chat') {
        return await this.grokIntegration.executeChatRequest({
            messages: params.messages || [],
            temperature: params.temperature || this.temperature,
            model: modelName,
            apiKey: this.apiKey,
            max_tokens: params.max_tokens || this.maxTokens
        });
    } else if (type === 'completion') {
        return await this.grokIntegration.executeCompletionRequest({
            prompt: params.prompt || '',
            temperature: params.temperature || this.temperature,
            model: modelName,
            apiKey: this.apiKey,
            max_tokens: params.max_tokens || this.maxTokens
        });
    } else {
        throw new Error(`Unsupported request type for Grok: ${type}`);
    }
}
