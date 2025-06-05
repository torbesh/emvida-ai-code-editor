/**
 * Advanced AI Integration Module for Emvida AI Code Editor
 * Provides enhanced AI-powered code assistance and refactoring
 * Modified for offline functionality and LM Studio integration
 */

class AdvancedAIAssistant {
    constructor() {
        this.models = {
            'local': {
                name: 'Local Model (Offline)',
                endpoint: 'offline',
                requiresAuth: false,
                capabilities: ['completion', 'chat', 'edit', 'refactor', 'explain', 'optimize', 'generateTests', 'fixBugs', 'documentCode', 'suggestPatterns']
            },
            'mistral': {
                name: 'Mistral AI',
                endpoint: 'https://api.mistral.ai/v1',
                requiresAuth: true,
                defaultModel: 'mistral-large-latest',
                capabilities: ['completion', 'chat', 'edit', 'refactor', 'explain', 'optimize', 'generateTests', 'fixBugs', 'documentCode', 'suggestPatterns']
            },
            'openai': {
                name: 'OpenAI GPT-4 (Offline)',
                endpoint: 'offline',
                requiresAuth: false,
                capabilities: ['completion', 'chat', 'edit', 'refactor', 'explain', 'optimize', 'generateTests', 'fixBugs', 'documentCode', 'suggestPatterns']
            },
            'lmstudio': {
                name: 'LM Studio (Local)',
                endpoint: 'http://localhost:1234/v1/chat/completions',
                requiresAuth: false,
                capabilities: ['completion', 'chat', 'edit', 'refactor', 'explain', 'optimize', 'generateTests', 'fixBugs', 'documentCode', 'suggestPatterns']
            },
            'ollama': {
                name: 'Ollama (Local)',
                endpoint: 'http://localhost:11434/api',
                requiresAuth: false,
                defaultModel: 'codellama',
                capabilities: ['completion', 'chat', 'edit', 'refactor', 'explain', 'optimize', 'generateTests', 'fixBugs', 'documentCode', 'suggestPatterns']
            },
            'grok': {
                name: 'Grok AI',
                endpoint: 'https://api.grok.x/v1',
                requiresAuth: true,
                defaultModel: 'grok-1',
                capabilities: ['completion', 'chat', 'edit', 'refactor', 'explain', 'optimize', 'generateTests', 'fixBugs', 'documentCode', 'suggestPatterns']
            },
            'qwen': {
                name: 'Qwen AI',
                endpoint: 'https://dashscope.aliyuncs.com/api/v1',
                requiresAuth: true,
                defaultModel: 'qwen-max',
                capabilities: ['completion', 'chat', 'edit', 'refactor', 'explain', 'optimize', 'generateTests', 'fixBugs', 'documentCode', 'suggestPatterns']
            }
        };
        
        this.currentModel = localStorage.getItem('emvida_ai_model') || 'local';
        this.apiKey = localStorage.getItem('emvida_ai_api_key') || '';
        this.temperature = parseFloat(localStorage.getItem('emvida_ai_temperature')) || 0.3;
        this.maxTokens = parseInt(localStorage.getItem('emvida_ai_max_tokens')) || 4096;
        this.customEndpoint = localStorage.getItem('emvida_custom_endpoint') || 'http://localhost:1234/v1/chat/completions';
        
        this.history = [];
        this.contextWindow = 10; // Number of recent interactions to include in context
        this.isProcessing = false;
        
        // AI capabilities
        this.capabilities = {
            completion: this.provideCompletion.bind(this),
            chat: this.chatWithAI.bind(this),
            edit: this.editCode.bind(this),
            refactor: this.refactorCode.bind(this),
            explain: this.explainCode.bind(this),
            optimize: this.optimizeCode.bind(this),
            generateTests: this.generateTests.bind(this),
            fixBugs: this.fixBugs.bind(this),
            documentCode: this.documentCode.bind(this),
            suggestPatterns: this.suggestPatterns.bind(this)
        };
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load offline examples
        this.loadOfflineExamples();
        
        // Initialize Ollama integration if available
        this.ollamaIntegration = window.OllamaIntegration ? new window.OllamaIntegration() : null;
    }
    
    /**
     * Load offline examples for AI responses
     */
    loadOfflineExamples() {
        this.offlineExamples = {
            completion: {
                javascript: {
                    'function sum': 'function sum(a, b) {\n  return a + b;\n}',
                    'const array': 'const array = [1, 2, 3, 4, 5];\nconst sum = array.reduce((acc, curr) => acc + curr, 0);',
                    'class User': 'class User {\n  constructor(name, email) {\n    this.name = name;\n    this.email = email;\n  }\n  \n  getInfo() {\n    return `${this.name} (${this.email})`;\n  }\n}',
                    'async function': 'async function fetchData() {\n  try {\n    const response = await fetch(\'https://api.example.com/data\');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(\'Error fetching data:\', error);\n    return null;\n  }\n}'
                },
                html: {
                    '<div': '<div class="container">\n  <h1>Hello World</h1>\n  <p>This is a paragraph.</p>\n</div>',
                    '<form': '<form action="/submit" method="post">\n  <label for="name">Name:</label>\n  <input type="text" id="name" name="name" required>\n  <button type="submit">Submit</button>\n</form>'
                },
                css: {
                    '.container': '.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 20px;\n  box-sizing: border-box;\n}',
                    '@media': '@media (max-width: 768px) {\n  .container {\n    padding: 10px;\n  }\n  \n  .column {\n    width: 100%;\n  }\n}'
                },
                python: {
                    'def calculate': 'def calculate_average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)',
                    'class Person': 'class Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n    \n    def greet(self):\n        return f"Hello, my name is {self.name} and I am {self.age} years old."'
                }
            },
            chat: {
                'How to optimize this code': 'Here are some ways to optimize your code:\n\n1. Use appropriate data structures\n2. Minimize DOM manipulations\n3. Use efficient algorithms\n4. Implement caching where appropriate\n5. Reduce unnecessary calculations\n\nFor your specific code, I would recommend:\n- Replacing the nested loops with a more efficient algorithm\n- Caching repeated calculations\n- Using requestAnimationFrame for smoother animations',
                'Explain this function': 'This function implements a binary search algorithm. Binary search is an efficient way to find an element in a sorted array.\n\nThe function works by repeatedly dividing the search interval in half. If the value of the search key is less than the item in the middle of the interval, it narrows the interval to the lower half. Otherwise, it narrows it to the upper half.\n\nThe time complexity is O(log n), which is much better than linear search for large arrays.',
                'How to fix this bug': 'The bug in your code is caused by an off-by-one error in your loop condition. You\'re using `<=` when you should be using `<` (or vice versa).\n\nAlso, there\'s an issue with how you\'re handling the array index. Remember that array indices start at 0, not 1.\n\nHere\'s the corrected code:\n```javascript\nfor (let i = 0; i < array.length; i++) {\n  // Your code here\n}\n```'
            },
            refactor: {
                'Refactor for readability': 'Here\'s your code refactored for better readability:\n\n```javascript\nfunction processData(data) {\n  // Extract values\n  const { id, name, values } = data;\n  \n  // Calculate statistics\n  const sum = values.reduce((acc, val) => acc + val, 0);\n  const average = sum / values.length;\n  \n  // Format the result\n  return {\n    id,\n    name,\n    statistics: {\n      sum,\n      average,\n      count: values.length\n    }\n  };\n}\n```\n\nChanges made:\n1. Used destructuring for cleaner variable assignment\n2. Added comments to explain each section\n3. Organized the code into logical sections\n4. Used more descriptive variable names',
                'Refactor using modern JS': 'Here\'s your code refactored using modern JavaScript features:\n\n```javascript\n// Using arrow functions, template literals, and destructuring\nconst getFullName = ({ firstName, lastName }) => `${firstName} ${lastName}`;\n\n// Using the spread operator and array methods\nconst mergeArrays = (...arrays) => arrays.flat();\n\n// Using optional chaining and nullish coalescing\nconst getUserName = (user) => user?.profile?.username ?? "Anonymous";\n```\n\nThese modern features make your code more concise and expressive.'
            },
            general: {
                'help': [
                    'I can help you with various coding tasks. Here are some things I can do:\n\n- Complete code based on your input\n- Explain code and concepts\n- Refactor code for better readability\n- Optimize code for better performance\n- Fix bugs in your code\n- Generate tests for your code\n- Document your code\n- Suggest design patterns\n\nJust let me know what you need!',
                    'I\'m here to assist with your coding tasks. Some ways I can help:\n\n- Code completion and suggestions\n- Code explanation and documentation\n- Refactoring and optimization\n- Bug fixing and debugging\n- Test generation\n- Design pattern suggestions\n\nWhat would you like help with today?'
                ],
                'hello': [
                    'Hello! I\'m your AI coding assistant. How can I help you with your code today?',
                    'Hi there! I\'m ready to help with your coding tasks. What are you working on?',
                    'Greetings! I\'m your AI pair programmer. What coding challenge can I help you with?'
                ],
                'features': [
                    'I can help you with various coding tasks, including:\n\n- Code completion\n- Code explanation\n- Refactoring\n- Optimization\n- Bug fixing\n- Test generation\n- Documentation\n- Design pattern suggestions\n\nJust let me know what you need!',
                    'My features include:\n\n- Intelligent code completion\n- Code analysis and explanation\n- Performance optimization suggestions\n- Refactoring recommendations\n- Bug detection and fixing\n- Test case generation\n- Documentation assistance\n- Design pattern recommendations\n\nHow can I assist you today?'
                ],
                'code': [
                    'I can help you with your code in various ways. I can complete code snippets, explain how code works, suggest improvements, help fix bugs, and more. What specific help do you need with your code?',
                    'I\'m designed to assist with coding tasks. Whether you need help understanding code, writing new code, fixing bugs, or optimizing performance, I\'m here to help. What are you working on?'
                ],
                'default': [
                    'I\'m here to help with your coding tasks. Could you provide more details about what you\'re working on or what kind of assistance you need?',
                    'I\'d be happy to assist you. To provide the most relevant help, could you share more about your current project or the specific coding challenge you\'re facing?',
                    'I\'m your AI coding assistant. To better help you, could you tell me more about what you\'re trying to accomplish or what problem you\'re trying to solve?'
                ]
            }
        };
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Implementation depends on editor setup
        // This is a placeholder for the actual implementation
        console.log('Initializing AI Assistant event listeners');
    }
    
    /**
     * Show offline mode notification
     * @param {string} message - Custom message to display
     */
    showOfflineNotification(message) {
        const defaultMessage = 'Running in offline mode. Some AI features may be limited.';
        const notificationMessage = message || defaultMessage;
        
        // Implementation depends on editor setup
        // This is a placeholder for the actual implementation
        console.log('AI Notification:', notificationMessage);
        
        // Update status in UI
        const aiStatus = document.getElementById('aiStatus');
        if (aiStatus) {
            aiStatus.textContent = 'AI: ' + notificationMessage;
        }
    }
    
    /**
     * Get suggestions for code
     * @param {string} code - The code to get suggestions for
     */
    async getSuggestions(code) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            // Simulate AI request
            const suggestions = await this.simulateAIRequest('completion', {
                prompt: code,
                max_tokens: 50,
                temperature: 0.3
            });
            
            // Display suggestions if available
            if (suggestions && suggestions.choices && suggestions.choices.length > 0) {
                const suggestion = suggestions.choices[0].text;
                if (suggestion && suggestion.trim()) {
                    // Display suggestion in UI (implementation depends on editor setup)
                    this.displaySuggestion(suggestion);
                }
            }
        } catch (error) {
            console.error('Error getting suggestions:', error);
        }
    }
    
    /**
     * Display suggestion in UI
     * @param {string} suggestion - The suggestion text
     */
    displaySuggestion(suggestion) {
        // Implementation depends on editor setup
        // This is a placeholder for the actual implementation
        console.log('Suggestion:', suggestion);
    }
    
    /**
     * Provide code completion
     * @param {string} code - The code to complete
     * @param {string} instructions - The completion instructions
     * @returns {Promise<Object>} - The completion result
     */
    async provideCompletion(code, instructions) {
        const prompt = code || '';
        
        const result = await this.executeAIRequest('completion', {
            prompt,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            original: prompt,
            completion: result.choices[0]?.text || '',
            message: 'Code completion generated'
        };
    }
    
    /**
     * Chat with AI
     * @param {string} code - The code context
     * @param {string} message - The user message
     * @returns {Promise<Object>} - The chat result
     */
    async chatWithAI(code, message) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant.' },
            { role: 'user', content: `${message}\n\nCode context:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            response: result.choices[0]?.message?.content || '',
            message: 'Chat response generated'
        };
    }
    
    /**
     * Edit code based on instructions
     * @param {string} code - The code to edit
     * @param {string} instructions - The editing instructions
     * @returns {Promise<Object>} - The edited code
     */
    async editCode(code, instructions) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant. Edit the provided code according to the instructions.' },
            { role: 'user', content: `Instructions: ${instructions}\n\nCode to edit:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            original: code,
            edited: result.choices[0]?.message?.content || '',
            message: 'Code edited according to instructions'
        };
    }
    
    /**
     * Refactor code
     * @param {string} code - The code to refactor
     * @param {string} instructions - The refactoring instructions
     * @returns {Promise<Object>} - The refactored code
     */
    async refactorCode(code, instructions) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant. Refactor the provided code to improve its quality.' },
            { role: 'user', content: `Instructions: ${instructions || 'Refactor this code to improve readability and maintainability.'}\n\nCode to refactor:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            original: code,
            refactored: result.choices[0]?.message?.content || '',
            message: 'Code refactored'
        };
    }
    
    /**
     * Explain code
     * @param {string} code - The code to explain
     * @param {string} instructions - The explanation instructions
     * @returns {Promise<Object>} - The explanation
     */
    async explainCode(code, instructions) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant. Explain the provided code in detail.' },
            { role: 'user', content: `Instructions: ${instructions || 'Explain this code in detail.'}\n\nCode to explain:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            explanation: result.choices[0]?.message?.content || '',
            message: 'Code explanation generated'
        };
    }
    
    /**
     * Optimize code
     * @param {string} code - The code to optimize
     * @param {string} instructions - The optimization instructions
     * @returns {Promise<Object>} - The optimized code
     */
    async optimizeCode(code, instructions) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant. Optimize the provided code for better performance.' },
            { role: 'user', content: `Instructions: ${instructions || 'Optimize this code for better performance.'}\n\nCode to optimize:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            original: code,
            optimized: result.choices[0]?.message?.content || '',
            message: 'Code optimized'
        };
    }
    
    /**
     * Generate tests for code
     * @param {string} code - The code to generate tests for
     * @param {string} instructions - The test generation instructions
     * @returns {Promise<Object>} - The generated tests
     */
    async generateTests(code, instructions) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant. Generate tests for the provided code.' },
            { role: 'user', content: `Instructions: ${instructions || 'Generate unit tests for this code.'}\n\nCode to test:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            tests: result.choices[0]?.message?.content || '',
            message: 'Tests generated'
        };
    }
    
    /**
     * Fix bugs in code
     * @param {string} code - The code to fix
     * @param {string} instructions - The bug fixing instructions
     * @returns {Promise<Object>} - The fixed code
     */
    async fixBugs(code, instructions) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant. Fix bugs in the provided code.' },
            { role: 'user', content: `Instructions: ${instructions || 'Fix bugs in this code.'}\n\nCode to fix:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            original: code,
            fixed: result.choices[0]?.message?.content || '',
            message: 'Bugs fixed'
        };
    }
    
    /**
     * Document code
     * @param {string} code - The code to document
     * @param {string} instructions - The documentation instructions
     * @returns {Promise<Object>} - The documented code
     */
    async documentCode(code, instructions) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant. Add documentation to the provided code.' },
            { role: 'user', content: `Instructions: ${instructions || 'Add documentation to this code.'}\n\nCode to document:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            original: code,
            documented: result.choices[0]?.message?.content || '',
            message: 'Code documented'
        };
    }
    
    /**
     * Suggest design patterns
     * @param {string} code - The code context
     * @param {string} instructions - The pattern suggestion instructions
     * @returns {Promise<Object>} - The suggested patterns
     */
    async suggestPatterns(code, instructions) {
        const messages = [
            { role: 'system', content: 'You are a helpful coding assistant. Suggest design patterns for the provided code context.' },
            { role: 'user', content: `Instructions: ${instructions || 'Suggest design patterns for this code context.'}\n\nCode context:\n\`\`\`\n${code || ''}\n\`\`\`` }
        ];
        
        const result = await this.executeAIRequest('chat', {
            messages,
            max_tokens: this.maxTokens,
            temperature: this.temperature
        });
        
        return {
            suggestions: result.choices[0]?.message?.content || '',
            message: 'Pattern suggestions generated'
        };
    }
    
    /**
     * Execute an AI request
     * @param {string} type - The request type
     * @param {Object} params - The request parameters
     * @returns {Promise<Object>} - The response
     */
    async executeAIRequest(type, params) {
        // Check if we're using LM Studio
        if (this.currentModel === 'lmstudio') {
            try {
                return await this.executeLMStudioRequest(type, params);
            } catch (error) {
                console.error('LM Studio request failed:', error);
                this.showOfflineNotification('LM Studio connection failed. Falling back to offline mode.');
                // Fall back to offline mode
            }
        }
        
        // Check if we're using Ollama
        if (this.currentModel === 'ollama') {
            try {
                return await this.executeOllamaRequest(type, params);
            } catch (error) {
                console.error('Ollama request failed:', error);
                this.showOfflineNotification('Ollama connection failed. Falling back to offline mode.');
                // Fall back to offline mode
            }
        }
        
        // Check if we're using Mistral
        if (this.currentModel === 'mistral') {
            try {
                return await this.executeMistralRequest(type, params);
            } catch (error) {
                console.error('Mistral request failed:', error);
                this.showOfflineNotification('Mistral connection failed. Falling back to offline mode.');
                // Fall back to offline mode
            }
        }
        
        // Check if we're using Grok
        if (this.currentModel === 'grok') {
            try {
                return await this.executeGrokRequest(type, params);
            } catch (error) {
                console.error('Grok request failed:', error);
                this.showOfflineNotification('Grok connection failed. Falling back to offline mode.');
                // Fall back to offline mode
            }
        }
        
        // Check if we're using Qwen
        if (this.currentModel === 'qwen') {
            try {
                return await this.executeQwenRequest(type, params);
            } catch (error) {
                console.error('Qwen request failed:', error);
                this.showOfflineNotification('Qwen connection failed. Falling back to offline mode.');
                // Fall back to offline mode
            }
        }
        
        // Simulate network latency for a more realistic experience
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Show offline mode notification
        this.showOfflineNotification();
        
        // Generate offline response based on type
        switch (type) {
            case 'completion':
                return this.generateOfflineCompletion(params);
            case 'chat':
                return this.generateOfflineChat(params);
            default:
                throw new Error(`Unsupported request type: ${type}`);
        }
    }
    
    /**
     * Execute a request to Mistral
     * @param {string} type - The request type
     * @param {Object} params - The request parameters
     * @returns {Promise<Object>} - The response
     */
    async executeMistralRequest(type, params) {
        if (!this.mistralIntegration) {
            this.mistralIntegration = window.MistralIntegration ? new window.MistralIntegration() : null;
        }
        
        if (!this.mistralIntegration) {
            throw new Error('Mistral integration not available');
        }
        
        const modelInfo = this.models['mistral'];
        const modelName = modelInfo.defaultModel;
        
        if (type === 'chat') {
            return await this.mistralIntegration.executeChatRequest({
                messages: params.messages || [],
                temperature: params.temperature || this.temperature,
                model: modelName,
                apiKey: this.apiKey,
                max_tokens: params.max_tokens || this.maxTokens
            });
        } else if (type === 'completion') {
            return await this.mistralIntegration.executeCompletionRequest({
                prompt: params.prompt || '',
                temperature: params.temperature || this.temperature,
                model: modelName,
                apiKey: this.apiKey,
                max_tokens: params.max_tokens || this.maxTokens
            });
        } else {
            throw new Error(`Unsupported request type for Mistral: ${type}`);
        }
    }
    
    /**
     * Execute a request to Ollama
     * @param {string} type - The request type
     * @param {Object} params - The request parameters
     * @returns {Promise<Object>} - The response
     */
    async executeOllamaRequest(type, params) {
        if (!this.ollamaIntegration) {
            throw new Error('Ollama integration not available');
        }
        
        const modelInfo = this.models['ollama'];
        const modelName = modelInfo.defaultModel;
        
        if (type === 'chat') {
            return await this.ollamaIntegration.executeChatRequest({
                messages: params.messages || [],
                temperature: params.temperature || this.temperature,
                model: modelName
            });
        } else if (type === 'completion') {
            return await this.ollamaIntegration.executeCompletionRequest({
                prompt: params.prompt || '',
                temperature: params.temperature || this.temperature,
                model: modelName
            });
        } else {
            throw new Error(`Unsupported request type for Ollama: ${type}`);
        }
    }
    
    /**
     * Simulate an AI request (offline version)
     * @param {string} type - The request type
     * @param {Object} params - The request parameters
     * @returns {Promise<Object>} - The response
     */
    async simulateAIRequest(type, params) {
        // Simulate network latency for a more realistic experience
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        // Generate simple suggestions based on the prompt
        const prompt = params.prompt || '';
        const language = this.detectLanguage(prompt);
        
        // Generate suggestions based on language
        const suggestions = this.generateLanguageSpecificSuggestions(language, prompt);
        
        return {
            choices: suggestions.map(text => ({ text }))
        };
    }
    
    /**
     * Generate offline completion response
     * @param {Object} params - The request parameters
     * @returns {Object} - The completion response
     */
    generateOfflineCompletion(params) {
        const prompt = params.prompt || '';
        const language = this.detectLanguage(prompt);
        
        // Find a matching example or generate a generic response
        let completion = '';
        
        // Check language-specific examples
        if (this.offlineExamples.completion[language]) {
            const examples = this.offlineExamples.completion[language];
            
            // Find the first matching example
            for (const [key, value] of Object.entries(examples)) {
                if (prompt.includes(key)) {
                    completion = value;
                    break;
                }
            }
        }
        
        // If no match found, generate a generic response
        if (!completion) {
            completion = this.generateGenericCompletion(language, prompt);
        }
        
        return {
            choices: [{ text: completion }]
        };
    }
    
    /**
     * Generate offline chat response
     * @param {Object} params - The request parameters
     * @returns {Object} - The chat response
     */
    generateOfflineChat(params) {
        const messages = params.messages || [];
        const userMessage = messages.find(m => m.role === 'user')?.content || '';
        
        // Find a matching example or generate a generic response
        let responseContent = '';
        
        // Check for code explanation request
        if (userMessage.toLowerCase().includes('explain')) {
            responseContent = this.offlineExamples.chat['Explain this function'] || 
                            'This code appears to be a function that processes data. It takes inputs, performs operations, and returns a result.';
        }
        // Check for optimization request
        else if (userMessage.toLowerCase().includes('optimize')) {
            responseContent = this.offlineExamples.chat['How to optimize this code'] || 
                            'To optimize this code, consider using more efficient algorithms and data structures.';
        }
        // Check for bug fixing request
        else if (userMessage.toLowerCase().includes('fix') || userMessage.toLowerCase().includes('bug')) {
            responseContent = this.offlineExamples.chat['How to fix this bug'] || 
                            'The bug might be related to incorrect variable scope or an off-by-one error in your loops.';
        }
        // Check for refactoring request
        else if (userMessage.toLowerCase().includes('refactor')) {
            responseContent = this.offlineExamples.refactor['Refactor for readability'] || 
                            'To refactor this code, consider breaking it into smaller functions and using more descriptive variable names.';
        }
        // Check for help request
        else if (userMessage.toLowerCase().includes('help')) {
            responseContent = this.getRandomResponse(this.offlineExamples.general['help']);
        }
        // Check for greeting
        else if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
            responseContent = this.getRandomResponse(this.offlineExamples.general['hello']);
        }
        // Check for features inquiry
        else if (userMessage.toLowerCase().includes('feature') || userMessage.toLowerCase().includes('what can you do')) {
            responseContent = this.getRandomResponse(this.offlineExamples.general['features']);
        }
        // Check for code-related inquiry
        else if (userMessage.toLowerCase().includes('code')) {
            responseContent = this.getRandomResponse(this.offlineExamples.general['code']);
        }
        // Default response - more helpful than the previous one
        else {
            responseContent = this.getRandomResponse(this.offlineExamples.general['default']);
        }
        
        return {
            choices: [
                { 
                    message: {
                        role: 'assistant',
                        content: responseContent
                    }
                }
            ]
        };
    }
    
    /**
     * Get a random response from an array of responses or return the single response
     * @param {string|Array<string>} responses - The response or array of responses
     * @returns {string} - A randomly selected response
     */
    getRandomResponse(responses) {
        if (Array.isArray(responses)) {
            const randomIndex = Math.floor(Math.random() * responses.length);
            return responses[randomIndex];
        }
        return responses;
    }
    
    /**
     * Generate a generic code completion
     * @param {string} language - The programming language
     * @param {string} prompt - The prompt
     * @returns {string} - The generated completion
     */
    generateGenericCompletion(language, prompt) {
        // Simple completions based on language
        switch (language) {
            case 'javascript':
                if (prompt.includes('function')) {
                    return 'function example(param) {\n  return param;\n}';
                } else if (prompt.includes('class')) {
                    return 'class Example {\n  constructor() {\n    this.value = 0;\n  }\n  \n  getValue() {\n    return this.value;\n  }\n}';
                } else if (prompt.includes('const')) {
                    return 'const value = 42;';
                } else {
                    return '// JavaScript code example';
                }
            case 'html':
                if (prompt.includes('div')) {
                    return '<div class="container">\n  <h1>Title</h1>\n  <p>Content</p>\n</div>';
                } else if (prompt.includes('form')) {
                    return '<form>\n  <input type="text" name="name">\n  <button type="submit">Submit</button>\n</form>';
                } else {
                    return '<!-- HTML code example -->';
                }
            case 'css':
                if (prompt.includes('.')) {
                    return '{\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}';
                } else {
                    return '/* CSS code example */';
                }
            case 'python':
                if (prompt.includes('def')) {
                    return 'def example(param):\n    return param';
                } else if (prompt.includes('class')) {
                    return 'class Example:\n    def __init__(self):\n        self.value = 0\n    \n    def get_value(self):\n        return self.value';
                } else {
                    return '# Python code example';
                }
            default:
                return '// Code example';
        }
    }
    
    /**
     * Generate language-specific suggestions
     * @param {string} language - The programming language
     * @param {string} prompt - The prompt
     * @returns {Array<string>} - The generated suggestions
     */
    generateLanguageSpecificSuggestions(language, prompt) {
        // Simple suggestions based on language and prompt
        const suggestions = [];
        
        switch (language) {
            case 'javascript':
                if (prompt.includes('function')) {
                    suggestions.push('(param1, param2) {\n  return param1 + param2;\n}');
                } else if (prompt.includes('const')) {
                    suggestions.push(' value = 42;');
                } else if (prompt.includes('class')) {
                    suggestions.push(' Example {\n  constructor() {\n    this.value = 0;\n  }\n}');
                }
                break;
            case 'html':
                if (prompt.includes('<div')) {
                    suggestions.push(' class="container">\n  <h1>Title</h1>\n  <p>Content</p>\n</div>');
                } else if (prompt.includes('<form')) {
                    suggestions.push(' action="/submit" method="post">\n  <input type="text" name="name">\n  <button type="submit">Submit</button>\n</form>');
                }
                break;
            case 'css':
                if (prompt.includes('.container')) {
                    suggestions.push(' {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 20px;\n}');
                } else if (prompt.includes('@media')) {
                    suggestions.push(' (max-width: 768px) {\n  .container {\n    padding: 10px;\n  }\n}');
                }
                break;
            case 'python':
                if (prompt.includes('def')) {
                    suggestions.push(' example(param):\n    return param');
                } else if (prompt.includes('class')) {
                    suggestions.push(' Example:\n    def __init__(self):\n        self.value = 0');
                }
                break;
        }
        
        return suggestions.length > 0 ? suggestions : ['// Suggestion'];
    }
    
    /**
     * Detect programming language from code
     * @param {string} code - The code to detect language from
     * @returns {string} - The detected language
     */
    detectLanguage(code) {
        if (!code) return 'javascript';
        
        // Simple language detection based on keywords and syntax
        if (code.includes('def ') || code.includes('import ') || code.includes('class ') && code.includes(':')) {
            return 'python';
        } else if (code.includes('<html') || code.includes('<div') || code.includes('<body')) {
            return 'html';
        } else if (code.includes('{') && (code.includes('.') || code.includes('#')) && code.includes(':')) {
            return 'css';
        } else {
            return 'javascript';
        }
    }
}

// Initialize the AI assistant when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AdvancedAIAssistant();
});
