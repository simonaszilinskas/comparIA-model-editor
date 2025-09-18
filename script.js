class ModelEditor {
    constructor() {
        this.data = [];
        this.originalData = [];
        this.selectedCompanyIndex = null;
        this.editingCompanyIndex = null;
        this.editingModelIndex = null;
        this.changes = [];

        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadInitialData();
        this.initCharacterCounters();
    }

    
    getExistingLicenses() {
        const licenses = new Set();

        this.data.forEach(company => {
            if (company.models) {
                company.models.forEach(model => {
                    if (model.license && model.license.trim()) {
                        licenses.add(model.license.trim());
                    }
                });
            }
        });

        return Array.from(licenses).sort();
    }

    getExistingApiTypes() {
        const apiTypes = new Set();

        this.data.forEach(company => {
            if (company.models) {
                company.models.forEach(model => {
                    if (model.endpoint && model.endpoint.api_type && model.endpoint.api_type.trim()) {
                        apiTypes.add(model.endpoint.api_type.trim());
                    }
                });
            }
        });

        return Array.from(apiTypes).sort();
    }

    getExistingStatuses() {
        const statuses = new Set();

        this.data.forEach(company => {
            if (company.models) {
                company.models.forEach(model => {
                    if (model.status && model.status.trim()) {
                        statuses.add(model.status.trim());
                    }
                });
            }
        });

        return Array.from(statuses).sort();
    }
    
    async loadInitialData() {
        try {
            // Try to load data from ComparIA repository
            await this.loadComparIAData();
        } catch (error) {
            console.log('Failed to load ComparIA data, showing import required state:', error);
            // Fallback to empty state if loading fails
            this.data = [];
            this.originalData = [];
            this.showImportRequiredState();
        }
    }

    async loadComparIAData() {
        const branch = 'develop';
        const comparIAUrl = `https://raw.githubusercontent.com/betagouv/ComparIA/${branch}/utils/models/models.json`;

        try {
            const response = await fetch(comparIAUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                this.data = data;
                this.originalData = JSON.parse(JSON.stringify(data));
                this.renderCompanies();
                this.renderModels();

                // Show success message
                this.showSyncStatus('Données synchronisées avec ComparIA', 'success');
            } else {
                throw new Error('Invalid data format from ComparIA');
            }
        } catch (error) {
            console.error('Error loading ComparIA data:', error);
            throw error;
        }
    }

    showImportRequiredState() {
        const companiesList = document.getElementById('companies-list');
        const modelsList = document.getElementById('models-list');
        const editorTitle = document.getElementById('editor-title');
        const addCompanyBtn = document.getElementById('add-company-btn');
        const addModelBtn = document.getElementById('add-model-btn');

        // Hide add buttons
        addCompanyBtn.style.display = 'none';
        addModelBtn.style.display = 'none';

        // Show import required message
        companiesList.innerHTML = `
            <div class="empty-state import-required">
                <h3>Aucune donnée</h3>
                <p>Échec du chargement automatique. Vous pouvez réessayer la synchronisation ou importer vos propres données.</p>
                <div class="import-actions">
                    <button class="btn btn-primary" onclick="modelEditor.syncWithComparIA()">
                        🔄 Synchroniser avec ComparIA
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">
                        📁 Importer fichier JSON
                    </button>
                    <button class="btn btn-secondary" onclick="modelEditor.showPasteJsonModal()">
                        📋 Coller JSON
                    </button>
                </div>
            </div>
        `;

        modelsList.innerHTML = `
            <div class="empty-state">
                <h3>Importez d'abord des données</h3>
                <p>Les modèles apparaîtront ici après l'import des données JSON.</p>
            </div>
        `;

        editorTitle.textContent = 'Importez des données pour commencer';
    }

    async syncWithComparIA() {
        this.showSyncStatus('Synchronisation en cours...', 'loading');

        try {
            await this.loadComparIAData();
        } catch (error) {
            this.showSyncStatus('Échec de la synchronisation avec ComparIA', 'error');
            console.error('Sync failed:', error);
        }
    }

    showSyncStatus(message, type) {
        // Remove any existing status
        const existingStatus = document.querySelector('.sync-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create status element
        const status = document.createElement('div');
        status.className = `sync-status sync-status-${type}`;
        status.innerHTML = `
            <span class="sync-message">${message}</span>
            ${type !== 'loading' ? '<button class="sync-close" onclick="this.parentElement.remove()">×</button>' : ''}
        `;

        // Add to header
        const header = document.querySelector('header');
        header.appendChild(status);

        // Auto-remove success/error messages after 5 seconds
        if (type !== 'loading') {
            setTimeout(() => {
                if (status && status.parentElement) {
                    status.remove();
                }
            }, 5000);
        }
    }

    bindEvents() {
        // Company events
        document.getElementById('add-company-btn').addEventListener('click', () => this.showCompanyModal());
        document.getElementById('company-form').addEventListener('submit', (e) => this.saveCompany(e));
        document.getElementById('cancel-company').addEventListener('click', () => this.hideCompanyModal());
        
        // Model events
        document.getElementById('add-model-btn').addEventListener('click', () => this.showModelModal());
        document.getElementById('model-form').addEventListener('submit', (e) => this.saveModel(e));
        document.getElementById('cancel-model').addEventListener('click', () => this.hideModelModal());
        
        // Import/Export events
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', (e) => this.importJSON(e));
        document.getElementById('paste-json-btn').addEventListener('click', () => this.showPasteJsonModal());
        document.getElementById('export-btn').addEventListener('click', () => this.showChangelogModal());
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportCSV());
        document.getElementById('copy-json-direct').addEventListener('click', () => this.copyJSONDirect());
        document.getElementById('copy-json').addEventListener('click', () => this.copyJSON());
        document.getElementById('download-json').addEventListener('click', () => this.downloadJSON());

        // Paste JSON events
        document.getElementById('cancel-paste').addEventListener('click', () => this.hidePasteJsonModal());
        document.getElementById('import-pasted-json').addEventListener('click', () => this.importPastedJSON());
        
        // Changelog events
        document.getElementById('skip-changelog').addEventListener('click', () => this.showExportModal());
        document.getElementById('save-changelog').addEventListener('click', () => this.saveChangelogEntry());
        
        // Modal events
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    renderCompanies() {
        const list = document.getElementById('companies-list');
        const addCompanyBtn = document.getElementById('add-company-btn');

        if (this.data.length === 0) {
            // If no data imported yet, show import required state
            if (!this.originalData || this.originalData.length === 0) {
                this.showImportRequiredState();
                return;
            }
            // If data was imported but all companies deleted, show add button
            addCompanyBtn.style.display = 'block';
            list.innerHTML = '<div class="empty-state"><h3>Aucun éditeur</h3><p>Cliquez sur "Ajouter éditeur" pour commencer</p></div>';
            return;
        }

        // Show add button when there's data
        addCompanyBtn.style.display = 'block';
        
        list.innerHTML = this.data.map((company, index) => `
            <div class="company-item ${index === this.selectedCompanyIndex ? 'active' : ''}" 
                 onclick="modelEditor.selectCompany(${index})">
                <div class="company-info">
                    <h3>${company.name}</h3>
                    <p>${company.models ? company.models.length : 0} models</p>
                </div>
                <div class="company-actions">
                    <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); modelEditor.editCompany(${index})">Modifier</button>
                    <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); modelEditor.deleteCompany(${index})">Supprimer</button>
                </div>
            </div>
        `).join('');
    }
    
    renderModels() {
        const list = document.getElementById('models-list');
        const title = document.getElementById('editor-title');
        const addBtn = document.getElementById('add-model-btn');
        
        if (this.selectedCompanyIndex === null) {
            title.textContent = 'Sélectionnez un éditeur pour voir les modèles';
            addBtn.style.display = 'none';
            list.innerHTML = '<div class="empty-state"><h3>Sélectionnez un éditeur</h3><p>Choisissez un éditeur dans le panneau de gauche pour voir et modifier ses modèles</p></div>';
            return;
        }
        
        const company = this.data[this.selectedCompanyIndex];
        title.textContent = `Modèles ${company.name}`;
        addBtn.style.display = 'block';
        
        if (!company.models || company.models.length === 0) {
            list.innerHTML = '<div class="empty-state"><h3>Aucun modèle</h3><p>Cliquez sur "Ajouter modèle" pour créer le premier modèle de cet éditeur</p></div>';
            return;
        }
        
        list.innerHTML = company.models.map((model, index) => `
            <div class="model-item ${model.status ? 'deactivated' : ''}" onclick="modelEditor.editModel(${index})">
                <div class="model-header">
                    <div class="model-title-section">
                        <div class="model-title">
                            ${model.simple_name || 'Unnamed Model'}
                            ${model.new ? '<span class="new-badge">NEW</span>' : ''}
                            ${model.reasoning ? '<span class="reasoning-badge">REASONING</span>' : ''}
                            ${model.status ? `<span class="status-badge status-${model.status}">${model.status.toUpperCase().replace('_', ' ')}</span>` : ''}
                        </div>
                        <div class="model-meta-compact">
                            ${model.license ? `<span class="model-license-badge">${model.license}</span>` : ''}
                            ${model.params ? `<span>${model.params}${model.params !== 'XL' && model.params !== 'L' && model.params !== 'M' && model.params !== 'S' ? 'B' : ''} params</span>` : ''}
                            ${model.release_date ? `<span>${model.release_date}</span>` : ''}
                        </div>
                    </div>
                    <div class="model-controls">
                        <div class="model-actions">
                            <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); modelEditor.editModel(${index})">Modifier</button>
                            <button class="btn btn-small btn-danger" onclick="event.stopPropagation(); modelEditor.deleteModel(${index})">Supprimer</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    selectCompany(index) {
        this.selectedCompanyIndex = index;
        this.renderCompanies();
        this.renderModels();
    }
    
    showCompanyModal(editIndex = null) {
        this.editingCompanyIndex = editIndex;
        const modal = document.getElementById('company-modal');
        const title = document.getElementById('company-modal-title');
        const form = document.getElementById('company-form');
        
        form.reset();
        
        if (editIndex !== null) {
            title.textContent = 'Modifier éditeur';
            const company = this.data[editIndex];
            document.getElementById('company-name').value = company.name || '';
            document.getElementById('company-icon').value = company.icon_path || '';
            document.getElementById('proprietary-license-desc').value = company.proprietary_license_desc || '';
            document.getElementById('proprietary-reuse-specificities').value = company.proprietary_reuse_specificities || '';
        } else {
            title.textContent = 'Ajouter éditeur';
        }
        
        modal.style.display = 'block';
    }
    
    hideCompanyModal() {
        document.getElementById('company-modal').style.display = 'none';
        this.editingCompanyIndex = null;
    }
    
    validateAndSanitizeCompany(formData) {
        const company = {};
        const errors = [];
        
        // Required field validation
        if (!formData.name || formData.name.trim() === '') {
            errors.push('Le nom de l\'éditeur est requis');
        } else {
            company.name = formData.name.trim();
        }
        
        // Optional fields - only add if they have values
        if (formData.icon_path && formData.icon_path.trim()) {
            company.icon_path = formData.icon_path.trim();
        }
        
        if (formData.proprietary_license_desc && formData.proprietary_license_desc.trim()) {
            company.proprietary_license_desc = formData.proprietary_license_desc.trim();
        }
        
        if (formData.proprietary_reuse_specificities && formData.proprietary_reuse_specificities.trim()) {
            company.proprietary_reuse_specificities = formData.proprietary_reuse_specificities.trim();
        }
        
        // Always initialize models array
        company.models = [];
        
        return { company, errors };
    }
    
    saveCompany(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            name: document.getElementById('company-name').value,
            icon_path: document.getElementById('company-icon').value,
            proprietary_license_desc: document.getElementById('proprietary-license-desc').value,
            proprietary_reuse_specificities: document.getElementById('proprietary-reuse-specificities').value
        };
        
        // Validate and sanitize
        const { company, errors } = this.validateAndSanitizeCompany(formData);
        
        if (errors.length > 0) {
            alert('Erreurs de validation :\n' + errors.join('\n'));
            return;
        }
        
        if (this.editingCompanyIndex !== null) {
            // Preserve existing models
            company.models = this.data[this.editingCompanyIndex].models || [];
            this.data[this.editingCompanyIndex] = company;
        } else {
            this.data.push(company);
        }
        
        this.renderCompanies();
        this.renderModels();
        this.hideCompanyModal();
    }
    
    editCompany(index) {
        this.showCompanyModal(index);
    }
    
    deleteCompany(index) {
        if (confirm('Are you sure you want to delete this company and all its models?')) {
            this.data.splice(index, 1);
            if (this.selectedCompanyIndex === index) {
                this.selectedCompanyIndex = null;
            } else if (this.selectedCompanyIndex > index) {
                this.selectedCompanyIndex--;
            }
            this.renderCompanies();
            this.renderModels();
        }
    }
    
    populateLicenseDropdown() {
        const licenseSelect = document.getElementById('model-license');
        const existingLicenses = this.getExistingLicenses();

        // Clear existing options except default and custom
        licenseSelect.innerHTML = `
            <option value="">Select a license...</option>
            <option value="__custom__">+ Add New License</option>
        `;

        // Add existing licenses
        existingLicenses.forEach(license => {
            const option = document.createElement('option');
            option.value = license;
            option.textContent = license;
            licenseSelect.insertBefore(option, licenseSelect.lastElementChild);
        });
    }

    populateApiTypeDropdown() {
        const apiTypeSelect = document.getElementById('model-endpoint-api-type');
        const existingApiTypes = this.getExistingApiTypes();

        // Clear existing options except default and custom
        apiTypeSelect.innerHTML = `
            <option value="">Select API type...</option>
            <option value="__custom__">+ Add New API Type</option>
        `;

        // Add existing API types
        existingApiTypes.forEach(apiType => {
            const option = document.createElement('option');
            option.value = apiType;
            option.textContent = this.formatApiTypeName(apiType);
            apiTypeSelect.insertBefore(option, apiTypeSelect.lastElementChild);
        });
    }

    formatApiTypeName(apiType) {
        // Format API type names for display
        const formatMap = {
            'openrouter': 'OpenRouter',
            'vertex_ai': 'Vertex AI',
            'anthropic': 'Anthropic',
            'openai': 'OpenAI'
        };
        return formatMap[apiType] || apiType;
    }
    
    setupLicenseHandlers() {
        const licenseSelect = document.getElementById('model-license');
        const customInput = document.getElementById('model-license-custom');

        licenseSelect.addEventListener('change', () => {
            if (licenseSelect.value === '__custom__') {
                customInput.style.display = 'block';
                customInput.required = true;
                licenseSelect.required = false;
                customInput.focus();
            } else {
                customInput.style.display = 'none';
                customInput.required = false;
                licenseSelect.required = true;
                customInput.value = '';
            }
        });
    }

    setupApiTypeHandlers() {
        const apiTypeSelect = document.getElementById('model-endpoint-api-type');
        const customInput = document.getElementById('model-endpoint-api-type-custom');

        apiTypeSelect.addEventListener('change', () => {
            if (apiTypeSelect.value === '__custom__') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
            }
        });
    }

    populateStatusDropdown() {
        const statusSelect = document.getElementById('model-status');
        const existingStatuses = this.getExistingStatuses();

        // Clear existing options except default and custom
        statusSelect.innerHTML = `
            <option value="">No special status</option>
            <option value="__custom__">+ Add New Status</option>
        `;

        // Add existing statuses
        existingStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = this.formatStatusName(status);
            statusSelect.insertBefore(option, statusSelect.lastElementChild);
        });
    }

    formatStatusName(status) {
        // Format status names for display
        const formatMap = {
            'archived': 'Archived',
            'disabled': 'Disabled',
            'missing_data': 'Missing Data'
        };
        return formatMap[status] || status;
    }

    setupStatusHandlers() {
        const statusSelect = document.getElementById('model-status');
        const customInput = document.getElementById('model-status-custom');

        statusSelect.addEventListener('change', () => {
            if (statusSelect.value === '__custom__') {
                customInput.style.display = 'block';
                customInput.focus();
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
            }
        });
    }
    
    showModelModal(editIndex = null) {
        if (this.selectedCompanyIndex === null) {
            alert('Veuillez d\'abord sélectionner un éditeur');
            return;
        }
        
        this.editingModelIndex = editIndex;
        const modal = document.getElementById('model-modal');
        const title = document.getElementById('model-modal-title');
        const form = document.getElementById('model-form');
        
        form.reset();
        
        // Populate dropdowns
        this.populateLicenseDropdown();
        this.populateApiTypeDropdown();
        this.populateStatusDropdown();
        this.setupLicenseHandlers();
        this.setupApiTypeHandlers();
        this.setupStatusHandlers();
        
        if (editIndex !== null) {
            title.textContent = 'Modifier modèle';
            const model = this.data[this.selectedCompanyIndex].models[editIndex];
            
            Object.keys(model).forEach(key => {
                if (key === 'endpoint') {
                    // Handle endpoint object
                    if (model.endpoint) {
                        const apiTypeSelect = document.getElementById('model-endpoint-api-type');
                        const customApiTypeInput = document.getElementById('model-endpoint-api-type-custom');
                        const apiModelIdEl = document.getElementById('model-endpoint-api-model-id');

                        const apiTypeValue = model.endpoint.api_type || '';

                        // Check if API type exists in dropdown
                        const existingOption = Array.from(apiTypeSelect.options).find(opt => opt.value === apiTypeValue);

                        if (existingOption && apiTypeValue !== '') {
                            apiTypeSelect.value = apiTypeValue;
                        } else if (apiTypeValue !== '') {
                            // Use custom input for non-existing API types
                            apiTypeSelect.value = '__custom__';
                            customApiTypeInput.style.display = 'block';
                            customApiTypeInput.value = apiTypeValue;
                        }

                        if (apiModelIdEl) apiModelIdEl.value = model.endpoint.api_model_id || '';

                        const apiBaseEl = document.getElementById('model-endpoint-api-base');
                        if (apiBaseEl) apiBaseEl.value = model.endpoint.api_base || '';
                    }
                } else if (key === 'license') {
                    const licenseSelect = document.getElementById('model-license');
                    const customInput = document.getElementById('model-license-custom');
                    const licenseValue = model[key] || '';

                    // Check if license exists in dropdown
                    const existingOption = Array.from(licenseSelect.options).find(opt => opt.value === licenseValue);

                    if (existingOption && licenseValue !== '') {
                        licenseSelect.value = licenseValue;
                    } else if (licenseValue !== '') {
                        // Use custom input for non-existing licenses
                        licenseSelect.value = '__custom__';
                        customInput.style.display = 'block';
                        customInput.required = true;
                        licenseSelect.required = false;
                        customInput.value = licenseValue;
                    }
                } else if (key === 'status') {
                    const statusSelect = document.getElementById('model-status');
                    const customInput = document.getElementById('model-status-custom');
                    const statusValue = model[key] || '';

                    // Check if status exists in dropdown
                    const existingOption = Array.from(statusSelect.options).find(opt => opt.value === statusValue);

                    if (existingOption && statusValue !== '') {
                        statusSelect.value = statusValue;
                    } else if (statusValue !== '') {
                        // Use custom input for non-existing statuses
                        statusSelect.value = '__custom__';
                        customInput.style.display = 'block';
                        customInput.value = statusValue;
                    }
                } else {
                    const element = document.getElementById(`model-${key.replace(/_/g, '-')}`);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = !!model[key];
                        } else {
                            element.value = model[key] || '';
                        }
                    }
                }
            });
        } else {
            title.textContent = 'Ajouter modèle';
        }
        
        modal.style.display = 'block';
        
        // Update character counters after a short delay to ensure values are set
        setTimeout(() => {
            this.initCharacterCounters();
        }, 50);
    }
    
    hideModelModal() {
        document.getElementById('model-modal').style.display = 'none';
        this.editingModelIndex = null;
    }
    
    validateAndSanitizeModel(formData) {
        const model = {};
        const errors = [];
        
        // Required fields validation
        if (!formData['simple-name'] || formData['simple-name'].trim() === '') {
            errors.push('Le nom simple est requis');
        } else {
            model.simple_name = formData['simple-name'].trim();
        }
        
        // Handle license dropdown vs custom input
        let licenseValue = '';
        if (formData['license'] === '__custom__') {
            licenseValue = formData['license-custom'] || '';
        } else {
            licenseValue = formData['license'] || '';
        }
        
        if (!licenseValue || licenseValue.trim() === '') {
            errors.push('La licence est requise');
        } else {
            model.license = licenseValue.trim();
        }

        // Handle status dropdown vs custom input
        let statusValue = '';
        if (formData['status'] === '__custom__') {
            statusValue = formData['status-custom'] || '';
        } else {
            statusValue = formData['status'] || '';
        }

        // Status is optional - only add if there's a value
        if (statusValue && statusValue.trim()) {
            model.status = statusValue.trim();
        }

        // Optional fields - only add if they have values
        if (formData['id'] && formData['id'].trim()) {
            model.id = formData['id'].trim();
        }
        
        if (formData['release-date'] && formData['release-date'].trim()) {
            const datePattern = /^\d{2}\/\d{4}$/;
            if (!datePattern.test(formData['release-date'])) {
                errors.push('La date de sortie doit être au format MM/YYYY');
            } else {
                model.release_date = formData['release-date'].trim();
            }
        }
        
        // Parameters validation
        if (formData['params'] && formData['params'].trim()) {
            const value = formData['params'].trim();
            if (['XL', 'L', 'M', 'S'].includes(value)) {
                model.params = value;
            } else {
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue <= 0) {
                    errors.push('Parameters must be a positive number or XL/L/M/S');
                } else {
                    model.params = numValue;
                }
            }
        }
        
        if (formData['active-params'] && formData['active-params'].trim()) {
            const numValue = parseFloat(formData['active-params']);
            if (isNaN(numValue) || numValue <= 0) {
                errors.push('Active Parameters must be a positive number');
            } else {
                model.active_params = numValue;
            }
        }
        
        // Architecture validation
        if (formData['arch'] && formData['arch'].trim()) {
            const validArchitectures = ['dense', 'moe', 'maybe-moe', 'maybe-dense', 'matformer'];
            if (!validArchitectures.includes(formData['arch'])) {
                errors.push('Invalid architecture selected');
            } else {
                model.arch = formData['arch'];
            }
        }
        
        // URL validation
        if (formData['url'] && formData['url'].trim()) {
            try {
                new URL(formData['url']);
                model.url = formData['url'].trim();
            } catch {
                errors.push('Invalid URL format');
            }
        }
        
        // Text fields - only add if not empty
        if (formData['desc'] && formData['desc'].trim()) {
            model.desc = formData['desc'].trim();
        }
        
        if (formData['size-desc'] && formData['size-desc'].trim()) {
            model.size_desc = formData['size-desc'].trim();
        }
        
        if (formData['fyi'] && formData['fyi'].trim()) {
            model.fyi = formData['fyi'].trim();
        }
        
        // Boolean fields - only add if true
        if (formData['reasoning'] === true) {
            model.reasoning = true;
        }

        if (formData['new'] === true) {
            model.new = true;
        }

        // API Endpoint - only add if both fields are provided
        let apiType = '';
        if (formData['endpoint-api-type'] === '__custom__') {
            apiType = formData['endpoint-api-type-custom'] || '';
        } else {
            apiType = formData['endpoint-api-type'] || '';
        }

        const apiModelId = formData['endpoint-api-model-id'];

        if ((apiType && apiType.trim()) || (apiModelId && apiModelId.trim())) {
            // If one is provided, both api_type and api_model_id should be provided
            if (!apiType || !apiType.trim() || !apiModelId || !apiModelId.trim()) {
                errors.push('Si un point d\'accès API est fourni, le Type d\'API et l\'ID du modèle API sont tous deux requis');
            } else {
                model.endpoint = {
                    api_type: apiType.trim(),
                    api_model_id: apiModelId.trim()
                };

                // Add optional api_base if it has a value
                if (formData['endpoint-api-base'] && formData['endpoint-api-base'].trim()) {
                    model.endpoint.api_base = formData['endpoint-api-base'].trim();
                }
            }
        }

        return { model, errors };
    }
    
    saveModel(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {};
        const fields = [
            'id', 'simple-name', 'license', 'license-custom', 'release-date', 'params', 'active-params',
            'arch', 'reasoning', 'new', 'url', 'desc', 'size-desc', 'fyi',
            'endpoint-api-type', 'endpoint-api-type-custom', 'endpoint-api-model-id', 'endpoint-api-base',
            'status', 'status-custom'
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(`model-${field}`);
            if (element) {
                if (element.type === 'checkbox') {
                    formData[field] = element.checked;
                } else {
                    formData[field] = element.value;
                }
            }
        });
        
        // Validate and sanitize
        const { model, errors } = this.validateAndSanitizeModel(formData);
        
        if (errors.length > 0) {
            alert('Erreurs de validation :\n' + errors.join('\n'));
            return;
        }
        
        if (!this.data[this.selectedCompanyIndex].models) {
            this.data[this.selectedCompanyIndex].models = [];
        }
        
        if (this.editingModelIndex !== null) {
            this.data[this.selectedCompanyIndex].models[this.editingModelIndex] = model;
        } else {
            this.data[this.selectedCompanyIndex].models.push(model);
        }
        
        this.renderModels();
        this.renderCompanies(); // Update model count
        this.hideModelModal();
    }
    
    editModel(index) {
        this.showModelModal(index);
    }
    
    deleteModel(index) {
        if (confirm('Are you sure you want to delete this model?')) {
            this.data[this.selectedCompanyIndex].models.splice(index, 1);
            this.renderModels();
            this.renderCompanies(); // Update model count
        }
    }
    
    
    importJSON(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.data = importedData;
                    this.originalData = JSON.parse(JSON.stringify(importedData));
                    this.selectedCompanyIndex = null;
                    this.renderCompanies();
                    this.renderModels();
                    alert('JSON importé avec succès !');
                } else {
                    alert('Format JSON invalide. Un tableau d\'éditeurs est attendu.');
                }
            } catch (error) {
                alert('Erreur lors de l\'analyse JSON : ' + error.message);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }

    showPasteJsonModal() {
        const modal = document.getElementById('paste-json-modal');
        const textarea = document.getElementById('paste-json-input');
        textarea.value = '';
        modal.style.display = 'block';
        textarea.focus();
    }

    hidePasteJsonModal() {
        document.getElementById('paste-json-modal').style.display = 'none';
    }

    importPastedJSON() {
        const textarea = document.getElementById('paste-json-input');
        const jsonText = textarea.value.trim();

        if (!jsonText) {
            alert('Veuillez d\'abord coller des données JSON.');
            return;
        }

        try {
            const importedData = JSON.parse(jsonText);
            if (Array.isArray(importedData)) {
                this.data = importedData;
                this.originalData = JSON.parse(JSON.stringify(importedData));
                this.selectedCompanyIndex = null;
                this.renderCompanies();
                this.renderModels();
                this.hidePasteJsonModal();
                alert('JSON importé avec succès !');
            } else {
                alert('Format JSON invalide. Un tableau d\'éditeurs est attendu.');
            }
        } catch (error) {
            alert('Error parsing JSON: ' + error.message);
        }
    }

    showExportModal() {
        const modal = document.getElementById('export-modal');
        const textarea = document.getElementById('export-json');
        
        textarea.value = JSON.stringify(this.data, null, 2);
        modal.style.display = 'block';
    }

    copyJSONDirect() {
        const jsonData = JSON.stringify(this.data, null, 2);

        try {
            // Modern clipboard API
            navigator.clipboard.writeText(jsonData).then(() => {
                alert('JSON copié dans le presse-papiers !');
            }).catch(() => {
                // Fallback for older browsers or when clipboard API fails
                this.fallbackCopyToClipboard(jsonData);
            });
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            this.fallbackCopyToClipboard(jsonData);
        }
    }

    fallbackCopyToClipboard(text) {
        // Create a temporary textarea element
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = text;
        tempTextarea.style.position = 'fixed';
        tempTextarea.style.left = '-999999px';
        tempTextarea.style.top = '-999999px';
        document.body.appendChild(tempTextarea);

        tempTextarea.focus();
        tempTextarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert('JSON copié dans le presse-papiers !');
            } else {
                alert('Échec de la copie. Veuillez copier manuellement.');
            }
        } catch (err) {
            alert('Failed to copy. Please copy manually.');
        }

        document.body.removeChild(tempTextarea);
    }

    copyJSON() {
        const textarea = document.getElementById('export-json');
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            alert('JSON copied to clipboard!');
        } catch (err) {
            // Fallback for newer browsers
            navigator.clipboard.writeText(textarea.value).then(() => {
                alert('JSON copié dans le presse-papiers !');
            }).catch(() => {
                alert('Échec de la copie. Veuillez copier manuellement.');
            });
        }
    }
    
    downloadJSON() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'models.json';
        link.click();
        
        URL.revokeObjectURL(link.href);
    }
    
    exportCSV() {
        // Flatten all models from all companies into a single array
        const allModels = [];
        
        this.data.forEach(company => {
            if (company.models && company.models.length > 0) {
                company.models.forEach(model => {
                    allModels.push({
                        company: company.name,
                        company_icon_path: company.icon_path || '',
                        proprietary_license_desc: company.proprietary_license_desc || '',
                        proprietary_reuse_specificities: company.proprietary_reuse_specificities || '',
                        ...model
                    });
                });
            }
        });
        
        if (allModels.length === 0) {
            alert('No models to export');
            return;
        }
        
        // Get all unique column headers from all models
        const allKeys = new Set();
        allModels.forEach(model => {
            Object.keys(model).forEach(key => allKeys.add(key));
        });
        
        const headers = Array.from(allKeys).sort();
        
        // Create CSV content
        let csv = headers.join(',') + '\n';
        
        allModels.forEach(model => {
            const row = headers.map(header => {
                const value = model[header];
                if (value === undefined || value === null) {
                    return '';
                }
                
                // Handle different data types
                if (typeof value === 'boolean') {
                    return value ? 'true' : 'false';
                }
                
                // Escape and quote strings that contain commas, quotes, or newlines
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return '"' + stringValue.replace(/"/g, '""') + '"';
                }
                
                return stringValue;
            });
            
            csv += row.join(',') + '\n';
        });
        
        // Download CSV file
        const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'models.csv';
        link.click();
        
        URL.revokeObjectURL(link.href);
    }
    
    detectChanges() {
        const changes = [];
        const originalCompanies = new Map(this.originalData.map(c => [c.name, c]));
        const currentCompanies = new Map(this.data.map(c => [c.name, c]));
        
        // Check for added companies
        for (const [name, company] of currentCompanies) {
            if (!originalCompanies.has(name)) {
                changes.push(`+ Added company: ${name} with ${company.models?.length || 0} models`);
            }
        }
        
        // Check for removed companies
        for (const [name, company] of originalCompanies) {
            if (!currentCompanies.has(name)) {
                changes.push(`- Removed company: ${name}`);
            }
        }
        
        // Check for modified companies
        for (const [name, currentCompany] of currentCompanies) {
            if (originalCompanies.has(name)) {
                const originalCompany = originalCompanies.get(name);
                const companyChanges = [];
                
                // Check models
                const originalModels = new Map((originalCompany.models || []).map(m => [m.simple_name || m.id, m]));
                const currentModels = new Map((currentCompany.models || []).map(m => [m.simple_name || m.id, m]));
                
                // Added models
                for (const [modelName, model] of currentModels) {
                    if (!originalModels.has(modelName)) {
                        companyChanges.push(`  + Added model: ${modelName}`);
                    }
                }
                
                // Removed models
                for (const [modelName, model] of originalModels) {
                    if (!currentModels.has(modelName)) {
                        companyChanges.push(`  - Removed model: ${modelName}`);
                    }
                }
                
                // Modified models
                for (const [modelName, currentModel] of currentModels) {
                    if (originalModels.has(modelName)) {
                        const originalModel = originalModels.get(modelName);
                        const modelChanges = [];
                        
                        // Check for field changes
                        const fields = ['license', 'release_date', 'params', 'arch', 'desc', 'size_desc', 'fyi', 'status'];
                        for (const field of fields) {
                            if (originalModel[field] !== currentModel[field]) {
                                if (field === 'status') {
                                    if (currentModel.status && !originalModel.status) {
                                        modelChanges.push(`set status to ${currentModel.status}`);
                                    } else if (!currentModel.status && originalModel.status) {
                                        modelChanges.push('activated (removed status)');
                                    } else if (currentModel.status !== originalModel.status) {
                                        modelChanges.push(`changed status from ${originalModel.status} to ${currentModel.status}`);
                                    }
                                } else {
                                    modelChanges.push(field.replace('_', ' '));
                                }
                            }
                        }
                        
                        if (modelChanges.length > 0) {
                            companyChanges.push(`  ~ Modified ${modelName}: ${modelChanges.join(', ')}`);
                        }
                    }
                }
                
                if (companyChanges.length > 0) {
                    changes.push(`@ ${name}:`);
                    changes.push(...companyChanges);
                }
            }
        }
        
        return changes;
    }
    
    showChangelogModal() {
        const modal = document.getElementById('changelog-modal');
        const changes = this.detectChanges();
        
        // Generate PR-compatible changelog
        const changelogText = changes.length > 0 
            ? changes.join('\n')
            : 'No changes detected';
        
        // Update modal to show auto-generated changelog
        document.getElementById('changelog-entry').value = changelogText;
        document.getElementById('changelog-entry').readOnly = true;
        
        // Update character counter
        const counter = document.getElementById('changelog-entry-counter');
        counter.textContent = `${changes.length} modification${changes.length !== 1 ? 's' : ''} détectée${changes.length !== 1 ? 's' : ''}`;
        
        modal.style.display = 'block';
    }
    
    saveChangelogEntry() {
        // Simply proceed to export - changelog is auto-generated
        document.getElementById('changelog-modal').style.display = 'none';
        this.showExportModal();
    }
    
    initCharacterCounters() {
        const fieldsWithCounters = [
            'model-simple-name',
            'model-desc',
            'model-size-desc', 
            'model-fyi',
            'changelog-entry'
        ];
        
        fieldsWithCounters.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const counter = document.getElementById(`${fieldId}-counter`);
            
            if (field && counter) {
                // Update counter on input
                field.addEventListener('input', () => {
                    this.updateCharacterCounter(field, counter);
                });
                
                // Initialize counter
                this.updateCharacterCounter(field, counter);
            }
        });
    }
    
    updateCharacterCounter(field, counter) {
        const length = field.value.length;
        const isTextarea = field.tagName.toLowerCase() === 'textarea';
        
        // Set different warning thresholds for different field types
        let warningThreshold, dangerThreshold;
        
        if (field.id === 'model-simple-name') {
            warningThreshold = 40;
            dangerThreshold = 60;
        } else if (field.id === 'changelog-entry') {
            warningThreshold = 150;
            dangerThreshold = 300;
        } else if (isTextarea) {
            warningThreshold = 800;
            dangerThreshold = 1200;
        } else {
            warningThreshold = 100;
            dangerThreshold = 150;
        }
        
        // Update text
        counter.textContent = `${length} caractère${length !== 1 ? 's' : ''}`;
        
        // Update color based on length
        counter.className = 'character-counter';
        if (length >= dangerThreshold) {
            counter.classList.add('danger');
        } else if (length >= warningThreshold) {
            counter.classList.add('warning');
        }
    }
}

// Initialize the editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.modelEditor = new ModelEditor();
});