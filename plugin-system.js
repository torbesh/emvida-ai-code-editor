/**
 * Plugin System for Emvida AI Code Editor
 * Enables extensibility through custom plugins
 */

class PluginSystem {
    constructor() {
        this.plugins = {};
        this.activePlugins = [];
        this.hooks = {
            'editor:init': [],
            'editor:beforeSave': [],
            'editor:afterSave': [],
            'editor:beforeRun': [],
            'editor:afterRun': [],
            'editor:contentChanged': [],
            'editor:languageChanged': [],
            'editor:themeChanged': [],
            'editor:tabChanged': [],
            'editor:projectChanged': [],
            'ai:beforeProcess': [],
            'ai:afterProcess': []
        };
        
        // Plugin registry - built-in plugins
        this.registry = [
            {
                id: 'code-formatter',
                name: 'Code Formatter',
                description: 'Advanced code formatting for multiple languages',
                version: '1.0.0',
                author: 'Emvida Team',
                enabled: true,
                url: 'plugins/code-formatter.js'
            },
            {
                id: 'git-integration',
                name: 'Git Integration',
                description: 'Enhanced Git workflow with commit, push, pull and branch management',
                version: '1.0.0',
                author: 'Emvida Team',
                enabled: true,
                url: 'plugins/git-integration.js'
            },
            {
                id: 'ai-assistant',
                name: 'AI Assistant Pro',
                description: 'Advanced AI code suggestions and refactoring',
                version: '1.0.0',
                author: 'Emvida Team',
                enabled: true,
                url: 'plugins/ai-assistant.js'
            },
            {
                id: 'performance-analyzer',
                name: 'Performance Analyzer',
                description: 'Analyze and optimize code performance',
                version: '1.0.0',
                author: 'Emvida Team',
                enabled: false,
                url: 'plugins/performance-analyzer.js'
            },
            {
                id: 'accessibility-checker',
                name: 'Accessibility Checker',
                description: 'Check and improve code accessibility',
                version: '1.0.0',
                author: 'Emvida Team',
                enabled: false,
                url: 'plugins/accessibility-checker.js'
            }
        ];
    }
    
    /**
     * Initialize the plugin system
     */
    async initialize() {
        console.log('Initializing Emvida Plugin System...');
        
        // Load enabled plugins from localStorage
        this.loadEnabledPlugins();
        
        // Load built-in plugins
        await this.loadBuiltInPlugins();
        
        // Create plugin UI
        this.createPluginUI();
        
        console.log('Plugin System initialized with', this.activePlugins.length, 'active plugins');
    }
    
    /**
     * Load enabled plugins from localStorage
     */
    loadEnabledPlugins() {
        try {
            const enabledPlugins = JSON.parse(localStorage.getItem('emvida_enabled_plugins'));
            if (enabledPlugins && Array.isArray(enabledPlugins)) {
                // Update registry with enabled status
                this.registry.forEach(plugin => {
                    plugin.enabled = enabledPlugins.includes(plugin.id);
                });
            }
        } catch (error) {
            console.error('Error loading enabled plugins:', error);
        }
    }
    
    /**
     * Save enabled plugins to localStorage
     */
    saveEnabledPlugins() {
        try {
            const enabledPlugins = this.registry
                .filter(plugin => plugin.enabled)
                .map(plugin => plugin.id);
            localStorage.setItem('emvida_enabled_plugins', JSON.stringify(enabledPlugins));
        } catch (error) {
            console.error('Error saving enabled plugins:', error);
        }
    }
    
    /**
     * Load built-in plugins
     */
    async loadBuiltInPlugins() {
        const enabledPlugins = this.registry.filter(plugin => plugin.enabled);
        
        for (const plugin of enabledPlugins) {
            try {
                // In a real implementation, we would dynamically load the plugin script
                // For this demo, we'll simulate loading the plugin
                await this.simulatePluginLoad(plugin);
                
                // Add to active plugins
                this.activePlugins.push(plugin.id);
                
                console.log(`Plugin loaded: ${plugin.name}`);
            } catch (error) {
                console.error(`Error loading plugin ${plugin.name}:`, error);
            }
        }
    }
    
    /**
     * Simulate loading a plugin
     * @param {Object} plugin - The plugin to load
     */
    async simulatePluginLoad(plugin) {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
        
        // Simulate plugin registration
        this.registerPlugin(plugin.id, {
            name: plugin.name,
            description: plugin.description,
            version: plugin.version,
            author: plugin.author,
            
            // Simulate plugin hooks
            hooks: {
                'editor:init': () => console.log(`[${plugin.name}] Initialized`),
                'editor:contentChanged': (content) => console.log(`[${plugin.name}] Content changed`)
            },
            
            // Simulate plugin API
            api: {
                getInfo: () => ({
                    name: plugin.name,
                    version: plugin.version,
                    author: plugin.author
                }),
                
                getSettings: () => ({
                    enabled: true,
                    options: {}
                })
            }
        });
    }
    
    /**
     * Register a plugin
     * @param {string} id - The plugin ID
     * @param {Object} plugin - The plugin object
     */
    registerPlugin(id, plugin) {
        if (this.plugins[id]) {
            console.warn(`Plugin ${id} is already registered`);
            return false;
        }
        
        this.plugins[id] = plugin;
        
        // Register hooks
        if (plugin.hooks) {
            Object.keys(plugin.hooks).forEach(hook => {
                if (this.hooks[hook]) {
                    this.hooks[hook].push({
                        id,
                        callback: plugin.hooks[hook]
                    });
                }
            });
        }
        
        return true;
    }
    
    /**
     * Unregister a plugin
     * @param {string} id - The plugin ID
     */
    unregisterPlugin(id) {
        if (!this.plugins[id]) {
            console.warn(`Plugin ${id} is not registered`);
            return false;
        }
        
        // Remove hooks
        Object.keys(this.hooks).forEach(hook => {
            this.hooks[hook] = this.hooks[hook].filter(item => item.id !== id);
        });
        
        // Remove from active plugins
        this.activePlugins = this.activePlugins.filter(pluginId => pluginId !== id);
        
        // Remove from plugins
        delete this.plugins[id];
        
        return true;
    }
    
    /**
     * Enable a plugin
     * @param {string} id - The plugin ID
     */
    async enablePlugin(id) {
        const plugin = this.registry.find(p => p.id === id);
        if (!plugin) {
            console.warn(`Plugin ${id} not found in registry`);
            return false;
        }
        
        if (plugin.enabled) {
            console.warn(`Plugin ${id} is already enabled`);
            return true;
        }
        
        try {
            // Simulate loading the plugin
            await this.simulatePluginLoad(plugin);
            
            // Update registry
            plugin.enabled = true;
            this.activePlugins.push(id);
            
            // Save enabled plugins
            this.saveEnabledPlugins();
            
            // Update UI
            this.updatePluginUI();
            
            return true;
        } catch (error) {
            console.error(`Error enabling plugin ${id}:`, error);
            return false;
        }
    }
    
    /**
     * Disable a plugin
     * @param {string} id - The plugin ID
     */
    disablePlugin(id) {
        const plugin = this.registry.find(p => p.id === id);
        if (!plugin) {
            console.warn(`Plugin ${id} not found in registry`);
            return false;
        }
        
        if (!plugin.enabled) {
            console.warn(`Plugin ${id} is already disabled`);
            return true;
        }
        
        // Unregister the plugin
        this.unregisterPlugin(id);
        
        // Update registry
        plugin.enabled = false;
        
        // Save enabled plugins
        this.saveEnabledPlugins();
        
        // Update UI
        this.updatePluginUI();
        
        return true;
    }
    
    /**
     * Trigger a hook
     * @param {string} hook - The hook name
     * @param {...any} args - Arguments to pass to the hook callbacks
     */
    triggerHook(hook, ...args) {
        if (!this.hooks[hook]) {
            console.warn(`Hook ${hook} does not exist`);
            return;
        }
        
        this.hooks[hook].forEach(item => {
            try {
                item.callback(...args);
            } catch (error) {
                console.error(`Error in plugin ${item.id} hook ${hook}:`, error);
            }
        });
    }
    
    /**
     * Create the plugin UI
     */
    createPluginUI() {
        const container = document.createElement('div');
        container.className = 'plugin-manager-panel';
        container.id = 'pluginManagerPanel';
        
        const header = document.createElement('h3');
        header.textContent = 'Plugin Manager';
        container.appendChild(header);
        
        const pluginsList = document.createElement('div');
        pluginsList.className = 'plugins-list';
        pluginsList.id = 'pluginsList';
        
        // Create plugin items
        this.registry.forEach(plugin => {
            const pluginItem = document.createElement('div');
            pluginItem.className = `plugin-item ${plugin.enabled ? 'enabled' : 'disabled'}`;
            pluginItem.dataset.pluginId = plugin.id;
            
            const pluginHeader = document.createElement('div');
            pluginHeader.className = 'plugin-header';
            
            const pluginTitle = document.createElement('div');
            pluginTitle.className = 'plugin-title';
            pluginTitle.innerHTML = `
                <h4>${plugin.name}</h4>
                <span class="plugin-version">v${plugin.version}</span>
            `;
            
            const pluginToggle = document.createElement('label');
            pluginToggle.className = 'plugin-toggle';
            pluginToggle.innerHTML = `
                <input type="checkbox" ${plugin.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            `;
            
            pluginHeader.appendChild(pluginTitle);
            pluginHeader.appendChild(pluginToggle);
            
            const pluginDescription = document.createElement('div');
            pluginDescription.className = 'plugin-description';
            pluginDescription.textContent = plugin.description;
            
            const pluginMeta = document.createElement('div');
            pluginMeta.className = 'plugin-meta';
            pluginMeta.innerHTML = `<span>By ${plugin.author}</span>`;
            
            pluginItem.appendChild(pluginHeader);
            pluginItem.appendChild(pluginDescription);
            pluginItem.appendChild(pluginMeta);
            
            // Add event listener to toggle
            const checkbox = pluginToggle.querySelector('input');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.enablePlugin(plugin.id);
                } else {
                    this.disablePlugin(plugin.id);
                }
            });
            
            pluginsList.appendChild(pluginItem);
        });
        
        container.appendChild(pluginsList);
        
        // Add plugin manager to settings panel
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.appendChild(container);
        }
        
        // Add plugins menu to header
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const pluginsBtn = document.createElement('button');
            pluginsBtn.className = 'tooltip';
            pluginsBtn.setAttribute('data-tooltip', 'Plugin Manager');
            pluginsBtn.innerHTML = '<i class="fa fa-puzzle-piece"></i>';
            pluginsBtn.addEventListener('click', () => {
                const settingsPanel = document.getElementById('settingsPanel');
                if (settingsPanel) {
                    settingsPanel.hidden = !settingsPanel.hidden;
                    
                    // Scroll to plugin manager
                    if (!settingsPanel.hidden) {
                        const pluginManager = document.getElementById('pluginManagerPanel');
                        if (pluginManager) {
                            pluginManager.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            });
            
            headerActions.appendChild(pluginsBtn);
        }
    }
    
    /**
     * Update the plugin UI
     */
    updatePluginUI() {
        const pluginsList = document.getElementById('pluginsList');
        if (!pluginsList) return;
        
        // Update plugin items
        this.registry.forEach(plugin => {
            const pluginItem = pluginsList.querySelector(`[data-plugin-id="${plugin.id}"]`);
            if (!pluginItem) return;
            
            // Update class
            pluginItem.className = `plugin-item ${plugin.enabled ? 'enabled' : 'disabled'}`;
            
            // Update checkbox
            const checkbox = pluginItem.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = plugin.enabled;
            }
        });
    }
}

// Initialize plugin system when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pluginSystem = new PluginSystem();
    window.pluginSystem.initialize();
});