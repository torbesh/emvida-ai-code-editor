/**
 * Cloud Integration Module for Emvida AI Code Editor
 * Enables local storage and offline functionality
 */

class CloudIntegration {
    constructor() {
        this.providers = {
            'local-storage': {
                name: 'Local Storage',
                icon: 'hdd',
                isConnected: true,
                authToken: null
            },
            'github': {
                name: 'GitHub',
                icon: 'github',
                isConnected: false,
                authToken: null
            },
            'dropbox': {
                name: 'Dropbox',
                icon: 'dropbox',
                isConnected: false,
                authToken: null
            },
            'google-drive': {
                name: 'Google Drive',
                icon: 'google-drive',
                isConnected: false,
                authToken: null
            },
            'onedrive': {
                name: 'OneDrive',
                icon: 'microsoft',
                isConnected: false,
                authToken: null
            }
        };
        
        this.currentProvider = 'local-storage';
        this.syncStatus = 'synced';
        this.lastSyncTime = new Date();
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    initEventListeners() {
        document.addEventListener('emvida:file-changed', this.queueSync.bind(this));
        document.addEventListener('emvida:project-saved', this.syncProject.bind(this));
        
        // Auto-sync timer (every 5 minutes)
        setInterval(() => {
            if (this.currentProvider && this.providers[this.currentProvider].isConnected) {
                this.syncProject();
            }
        }, 5 * 60 * 1000);
    }
    
    /**
     * Connect to a cloud provider
     * @param {string} providerId - The ID of the provider to connect to
     * @returns {Promise<boolean>} - Whether the connection was successful
     */
    async connect(providerId) {
        if (!this.providers[providerId]) {
            console.error(`Unknown provider: ${providerId}`);
            return false;
        }
        
        // If trying to connect to local storage, it's always successful
        if (providerId === 'local-storage') {
            this.currentProvider = providerId;
            this.updateCloudStatusUI();
            await this.syncProject();
            return true;
        }
        
        // For other providers in offline mode, show a message
        try {
            // Show offline message
            alert(`Cloud providers are not available in offline mode. Using local storage instead.`);
            
            // Set to local storage
            this.currentProvider = 'local-storage';
            
            // Update UI
            this.updateCloudStatusUI();
            
            // Initial sync
            await this.syncProject();
            
            return true;
        } catch (error) {
            console.error('Error connecting to provider:', error);
            return false;
        }
    }
    
    /**
     * Disconnect from the current cloud provider
     */
    disconnect() {
        if (this.currentProvider === 'local-storage') {
            // Can't disconnect from local storage in offline mode
            alert('Local storage is always available in offline mode.');
            return;
        }
        
        if (!this.currentProvider) return;
        
        this.providers[this.currentProvider].isConnected = false;
        this.providers[this.currentProvider].authToken = null;
        this.currentProvider = 'local-storage';
        
        // Update UI
        this.updateCloudStatusUI();
    }
    
    /**
     * Queue a sync operation (debounced)
     */
    queueSync() {
        if (!this.currentProvider || !this.providers[this.currentProvider].isConnected) return;
        
        // Clear any existing sync timeout
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        
        // Set a new timeout (debounce for 3 seconds)
        this.syncTimeout = setTimeout(() => {
            this.syncProject();
        }, 3000);
    }
    
    /**
     * Sync the current project to local storage
     * @returns {Promise<boolean>} - Whether the sync was successful
     */
    async syncProject() {
        if (!this.currentProvider || !this.providers[this.currentProvider].isConnected) {
            return false;
        }
        
        try {
            this.syncStatus = 'syncing';
            this.updateCloudStatusUI();
            
            // Get current project data
            const projectData = {
                name: state.currentProject,
                files: state.files,
                lastModified: new Date().toISOString()
            };
            
            // Save to local storage
            if (this.currentProvider === 'local-storage') {
                // Save project to localStorage
                const projectKey = `emvida_project_${state.currentProject}`;
                localStorage.setItem(projectKey, JSON.stringify(projectData));
                
                // Update projects list
                let projects = JSON.parse(localStorage.getItem('emvida_projects') || '[]');
                if (!projects.includes(state.currentProject)) {
                    projects.push(state.currentProject);
                    localStorage.setItem('emvida_projects', JSON.stringify(projects));
                }
            } else {
                // Simulate API call to cloud provider (will never be reached in offline mode)
                await this.simulateApiCall(this.currentProvider, 'sync', projectData);
            }
            
            this.syncStatus = 'synced';
            this.lastSyncTime = new Date();
            this.updateCloudStatusUI();
            
            return true;
        } catch (error) {
            console.error('Error syncing project:', error);
            this.syncStatus = 'error';
            this.updateCloudStatusUI();
            return false;
        }
    }
    
    /**
     * Load a project from local storage
     * @param {string} projectId - The ID of the project to load
     * @returns {Promise<boolean>} - Whether the load was successful
     */
    async loadProject(projectId) {
        if (!this.currentProvider || !this.providers[this.currentProvider].isConnected) {
            return false;
        }
        
        try {
            this.syncStatus = 'loading';
            this.updateCloudStatusUI();
            
            let projectData;
            
            // Load from local storage
            if (this.currentProvider === 'local-storage') {
                const projectKey = `emvida_project_${projectId}`;
                const projectJson = localStorage.getItem(projectKey);
                
                if (!projectJson) {
                    throw new Error(`Project ${projectId} not found in local storage`);
                }
                
                projectData = JSON.parse(projectJson);
            } else {
                // Simulate API call to cloud provider (will never be reached in offline mode)
                projectData = await this.simulateApiCall(this.currentProvider, 'load', { projectId });
            }
            
            // Update state with loaded project
            state.currentProject = projectData.name;
            state.files = projectData.files;
            state.save();
            
            // Update UI
            if (window.editor && window.editor.setupTabs) {
                window.editor.setupTabs();
                window.editor.switchTab(Object.keys(state.files)[0]);
            }
            
            this.syncStatus = 'synced';
            this.lastSyncTime = new Date();
            this.updateCloudStatusUI();
            
            return true;
        } catch (error) {
            console.error('Error loading project:', error);
            this.syncStatus = 'error';
            this.updateCloudStatusUI();
            return false;
        }
    }
    
    /**
     * List available projects from local storage
     * @returns {Promise<Array>} - List of available projects
     */
    async listProjects() {
        if (!this.currentProvider || !this.providers[this.currentProvider].isConnected) {
            return [];
        }
        
        try {
            let projects;
            
            // List from local storage
            if (this.currentProvider === 'local-storage') {
                const projectsList = JSON.parse(localStorage.getItem('emvida_projects') || '[]');
                projects = projectsList.map(name => {
                    const projectKey = `emvida_project_${name}`;
                    const projectJson = localStorage.getItem(projectKey);
                    const projectData = projectJson ? JSON.parse(projectJson) : null;
                    
                    return {
                        id: name,
                        name: name,
                        lastModified: projectData ? projectData.lastModified : new Date().toISOString()
                    };
                });
            } else {
                // Simulate API call to cloud provider (will never be reached in offline mode)
                projects = await this.simulateApiCall(this.currentProvider, 'list', {});
            }
            
            return projects;
        } catch (error) {
            console.error('Error listing projects:', error);
            return [];
        }
    }
    
    /**
     * Simulate an API call to a cloud provider
     * @param {string} provider - The provider ID
     * @param {string} action - The action to perform
     * @param {Object} data - The data to send
     * @returns {Promise<any>} - The response data
     */
    async simulateApiCall(provider, action, data) {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
        
        // Simulate different actions
        switch (action) {
            case 'sync':
                // Simulate successful sync
                return { success: true, timestamp: new Date().toISOString() };
                
            case 'load':
                // Simulate loading a project
                return {
                    name: 'Cloud Project',
                    files: {
                        'index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>Cloud Project</title>\n</head>\n<body>\n    <h1>Hello from the cloud!</h1>\n</body>\n</html>',
                        'styles.css': 'body {\n    font-family: sans-serif;\n    background: #f5f5f5;\n}\n\nh1 {\n    color: #333;\n}'
                    },
                    lastModified: new Date().toISOString()
                };
                
            case 'list':
                // Simulate listing projects
                return [
                    { id: 'project1', name: 'Web App', lastModified: '2025-03-15T14:22:18Z' },
                    { id: 'project2', name: 'Portfolio Site', lastModified: '2025-03-10T09:45:30Z' },
                    { id: 'project3', name: 'API Client', lastModified: '2025-03-05T16:12:45Z' }
                ];
                
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    
    /**
     * Update the cloud status UI
     */
    updateCloudStatusUI() {
        const cloudStatus = document.getElementById('cloudStatus');
        if (!cloudStatus) return;
        
        if (!this.currentProvider || !this.providers[this.currentProvider].isConnected) {
            cloudStatus.innerHTML = '<span class="cloud-status disconnected">Not connected to storage</span>';
            return;
        }
        
        const provider = this.providers[this.currentProvider];
        let statusHTML = '';
        
        switch (this.syncStatus) {
            case 'syncing':
                statusHTML = `<span class="cloud-status syncing">Syncing to ${provider.name}...</span>`;
                break;
                
            case 'synced':
                const timeStr = this.lastSyncTime ? this.lastSyncTime.toLocaleTimeString() : 'never';
                statusHTML = `<span class="cloud-status synced">Synced to ${provider.name} (${timeStr})</span>`;
                break;
                
            case 'error':
                statusHTML = `<span class="cloud-status error">Sync error with ${provider.name}</span>`;
                break;
                
            default:
                statusHTML = `<span class="cloud-status connected">Connected to ${provider.name}</span>`;
        }
        
        cloudStatus.innerHTML = statusHTML;
    }
    
    /**
     * Create the cloud integration UI
     * @returns {HTMLElement} - The cloud integration UI element
     */
    createCloudUI() {
        const container = document.createElement('div');
        container.className = 'cloud-integration-panel';
        
        const header = document.createElement('h3');
        header.textContent = 'Storage Options';
        
        const providersList = document.createElement('div');
        providersList.className = 'providers-list';
        
        // Add local storage provider first
        const localStorageProvider = this.createProviderElement('local-storage');
        providersList.appendChild(localStorageProvider);
        
        // Add a note about offline mode
        const offlineNote = document.createElement('div');
        offlineNote.className = 'offline-note';
        offlineNote.innerHTML = '<p><strong>Note:</strong> Running in offline mode. Only local storage is available.</p>';
        
        // Add disabled cloud providers
        Object.keys(this.providers).forEach(providerId => {
            if (providerId !== 'local-storage') {
                const providerElement = this.createProviderElement(providerId);
                providerElement.classList.add('disabled');
                providersList.appendChild(providerElement);
            }
        });
        
        container.appendChild(header);
        container.appendChild(offlineNote);
        container.appendChild(providersList);
        
        return container;
    }
    
    /**
     * Create a provider element
     * @param {string} providerId - The provider ID
     * @returns {HTMLElement} - The provider element
     */
    createProviderElement(providerId) {
        const provider = this.providers[providerId];
        
        const element = document.createElement('div');
        element.className = 'provider-item';
        element.dataset.providerId = providerId;
        
        const icon = document.createElement('i');
        icon.className = `fas fa-${provider.icon}`;
        
        const name = document.createElement('span');
        name.textContent = provider.name;
        
        const status = document.createElement('span');
        status.className = 'provider-status';
        status.textContent = provider.isConnected ? 'Connected' : 'Disconnected';
        
        const connectBtn = document.createElement('button');
        connectBtn.textContent = provider.isConnected ? 'Disconnect' : 'Connect';
        connectBtn.className = provider.isConnected ? 'disconnect-btn' : 'connect-btn';
        
        // Add event listener only for local storage in offline mode
        if (providerId === 'local-storage') {
            connectBtn.addEventListener('click', () => {
                if (provider.isConnected) {
                    this.disconnect();
                } else {
                    this.connect(providerId);
                }
            });
        } else {
            // Disable button for cloud providers in offline mode
            connectBtn.disabled = true;
            connectBtn.title = 'Not available in offline mode';
        }
        
        element.appendChild(icon);
        element.appendChild(name);
        element.appendChild(status);
        element.appendChild(connectBtn);
        
        return element;
    }
}

// Initialize cloud integration when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cloudIntegration = new CloudIntegration();
    
    // Add cloud integration UI to settings panel
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        const cloudSection = document.createElement('div');
        cloudSection.className = 'settings-section';
        cloudSection.appendChild(window.cloudIntegration.createCloudUI());
        settingsPanel.appendChild(cloudSection);
    }
});
