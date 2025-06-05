/**
 * Execute a request to Qwen
 * @param {string} type - The request type
 * @param {Object} params - The request parameters
 * @returns {Promise<Object>} - The response
 */
async executeQwenRequest(type, params) {
    if (!this.qwenIntegration) {
        this.qwenIntegration = window.QwenIntegration ? new window.QwenIntegration() : null;
    }
    
    if (!this.qwenIntegration) {
        throw new Error('Qwen integration not available');
    }
    
    const modelInfo = this.models['qwen'];
    const modelName = modelInfo.defaultModel;
    
    if (type === 'chat') {
        return await this.qwenIntegration.executeChatRequest({
            messages: params.messages || [],
            temperature: params.temperature || this.temperature,
            model: modelName,
            apiKey: this.apiKey,
            max_tokens: params.max_tokens || this.maxTokens
        });
    } else if (type === 'completion') {
        return await this.qwenIntegration.executeCompletionRequest({
            prompt: params.prompt || '',
            temperature: params.temperature || this.temperature,
            model: modelName,
            apiKey: this.apiKey,
            max_tokens: params.max_tokens || this.maxTokens
        });
    } else {
        throw new Error(`Unsupported request type for Qwen: ${type}`);
    }
}
