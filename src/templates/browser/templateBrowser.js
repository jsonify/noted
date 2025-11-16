        const vscode = acquireVsCodeApi();
        let templates = ${JSON.stringify(templates)};
        let currentView = 'grid';
        let activeCategory = 'all';
        let searchQuery = '';

        // Enhanced filter state
        let filterState = {
            fileType: 'all',
            difficulty: 'all',
            showOnly: 'all',
            sortBy: 'name-asc'
        };

        // Favorites tracking (stored in vscode state)
        let favorites = new Set();

        // Constants for template icons and badges
        const TEMPLATE_ICON_MAP = {
            'Built-in': '⚙️',
            'Custom': '✏️',
            'Documentation': '📚',
            'Project': '📊',
            'Meeting': '🤝',
            'Research': '🔬',
            'Planning': '📋',
            'Development': '💻',
            'Design': '🎨',
            'General': '📝',
            'Daily Notes': '📅',
            'User Story': '📖'
        };

        const FILE_TYPE_BADGES = {
            'builtin': '⚙️ Built-in',
            'json': '📦 JSON',
            'txt': '📄 Text',
            'md': '📝 Markdown'
        };

        // HTML escaping function to prevent XSS
        function escapeHtml(unsafe) {
            const text = typeof unsafe === 'string' ? unsafe : String(unsafe);
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Get icon for template based on category and file type
        function getTemplateIcon(template) {
            return TEMPLATE_ICON_MAP[template.category] || '📝';
        }

        // Determine if template is "new" (created within last 7 days)
        function isNew(template, now) {
            if (!template.created) return false;
            const created = new Date(template.created);
            const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        }

        // Determine if template is "popular" (usage_count > 10)
        function isPopular(template) {
            return template.usage_count >= 10;
        }

        // Get file type display text
        function getFileTypeBadge(fileType) {
            return FILE_TYPE_BADGES[fileType] || fileType;
        }

        // Convert difficulty to stars (1-3 stars)
        function getDifficultyStars(difficulty) {
            const starMap = {
                'beginner': '⭐',
                'intermediate': '⭐⭐',
                'advanced': '⭐⭐⭐'
            };
            return starMap[difficulty] || '';
        }

        // Calculate usage trend (mock implementation - would need historical data)
        function getUsageTrend(template) {
            // For now, return empty string. In a real implementation, this would
            // compare current week's usage to previous weeks
            // Example: "↑ 3 this week" or "↓ 2 this week"
            if (!template.usage_count || template.usage_count === 0) {
                return '';
            }
            // Mock: Templates with high usage show upward trend
            if (template.usage_count >= 10) {
                const weeklyUses = (template.id.length % 5) + 1;
                return \`↑ \${weeklyUses} this week\`;
            }
            return '';
        }

        // Initialize
        initializeFilterState();
        renderFilters();
        renderStats();
        renderTemplates();

        // === Event Delegation System ===

        // Master click handler for all buttons with data-command
        document.body.addEventListener('click', (event) => {
            const target = event.target.closest('[data-command]');
            if (!target) return;

            const command = target.getAttribute('data-command');
            const templateId = target.getAttribute('data-template-id');
            const category = target.getAttribute('data-category');
            const view = target.getAttribute('data-view');
            const tab = target.getAttribute('data-tab');

            switch (command) {
                case 'refresh':
                    refresh();
                    break;
                case 'setView':
                    setView(view);
                    break;
                case 'setCategory':
                    setCategory(category);
                    break;
                case 'toggleGuidance':
                    toggleGuidance(target);
                    break;
                case 'togglePreview':
                    togglePreview(target, templateId);
                    break;
                case 'showFullPreview':
                    showFullPreview(templateId);
                    break;
                case 'createFromTemplate':
                    createFromTemplate(templateId);
                    break;
                case 'editTemplate':
                    editTemplate(templateId);
                    break;
                case 'duplicateTemplate':
                    duplicateTemplate(templateId);
                    break;
                case 'exportTemplate':
                    exportTemplate(templateId);
                    break;
                case 'deleteTemplate':
                    deleteTemplate(templateId);
                    break;
                case 'closePreviewModal':
                    closePreviewModal();
                    break;
                case 'switchModalTab':
                    switchModalTab(tab);
                    break;
                case 'copyModalContent':
                    copyModalContent(event);
                    break;
                case 'toggleFavorite':
                    toggleFavorite(templateId);
                    event.stopPropagation(); // Prevent card click
                    break;
                case 'copyTemplateId':
                    copyTemplateId(templateId);
                    break;
                case 'editVariables':
                    openVariableEditor(templateId);
                    break;
                case 'closeVariableEditor':
                    closeVariableEditor();
                    break;
                case 'addNewVariable':
                    addNewVariable();
                    break;
                case 'addEnumValue':
                    addEnumValue();
                    break;
                case 'saveVariable':
                    saveVariable();
                    break;
                case 'cancelVariableEdit':
                    cancelVariableEdit();
                    break;
                case 'deleteVariable':
                    deleteCurrentVariable();
                    break;
                case 'saveAllVariables':
                    saveAllVariables();
                    break;
                case 'exportVariables':
                    exportVariablesConfig();
                    break;
                case 'importVariables':
                    importVariablesConfig();
                    break;
            }
        });

        // Search input listener
        document.getElementById('searchInput').addEventListener('input', filterTemplates);

        // Enhanced filter listeners
        document.getElementById('fileTypeFilter').addEventListener('change', handleFilterChange);
        document.getElementById('difficultyFilter').addEventListener('change', handleFilterChange);
        document.getElementById('showOnlyFilter').addEventListener('change', handleFilterChange);
        document.getElementById('sortBy').addEventListener('change', handleFilterChange);
        document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);

        // Modal overlay click handler (close on overlay click, not modal content)
        document.getElementById('previewModal').addEventListener('click', (event) => {
            if (event.target.id === 'previewModal') {
                closePreviewModal();
            }
        });

        // === Enhanced Filter & Sort Functions ===

        function initializeFilterState() {
            // Try to restore state from vscode
            const state = vscode.getState();
            if (state && state.filterState) {
                filterState = state.filterState;
                favorites = new Set(state.favorites || []);

                // Restore UI state
                document.getElementById('fileTypeFilter').value = filterState.fileType;
                document.getElementById('difficultyFilter').value = filterState.difficulty;
                document.getElementById('showOnlyFilter').value = filterState.showOnly;
                document.getElementById('sortBy').value = filterState.sortBy;
            }
            updateFilterBadge();
        }

        function handleFilterChange(event) {
            const filterId = event.target.id;
            const value = event.target.value;

            // Update filter state
            switch (filterId) {
                case 'fileTypeFilter':
                    filterState.fileType = value;
                    break;
                case 'difficultyFilter':
                    filterState.difficulty = value;
                    break;
                case 'showOnlyFilter':
                    filterState.showOnly = value;
                    break;
                case 'sortBy':
                    filterState.sortBy = value;
                    break;
            }

            // Save state
            saveFilterState();

            // Update UI
            updateFilterBadge();
            renderTemplates();
        }

        function clearAllFilters() {
            // Reset all filters to default
            filterState = {
                fileType: 'all',
                difficulty: 'all',
                showOnly: 'all',
                sortBy: 'name-asc'
            };

            // Reset UI
            document.getElementById('fileTypeFilter').value = 'all';
            document.getElementById('difficultyFilter').value = 'all';
            document.getElementById('showOnlyFilter').value = 'all';
            document.getElementById('sortBy').value = 'name-asc';

            // Save and update
            saveFilterState();
            updateFilterBadge();
            renderTemplates();
        }

        function updateFilterBadge() {
            let activeCount = 0;

            // Count non-default filters (excluding sortBy)
            if (filterState.fileType !== 'all') activeCount++;
            if (filterState.difficulty !== 'all') activeCount++;
            if (filterState.showOnly !== 'all') activeCount++;

            const badgeContainer = document.getElementById('filterBadgeContainer');
            const filterCount = document.getElementById('filterCount');

            if (activeCount > 0) {
                badgeContainer.style.display = 'flex';
                filterCount.textContent = activeCount;
            } else {
                badgeContainer.style.display = 'none';
            }
        }

        function saveFilterState() {
            vscode.setState({
                filterState: filterState,
                favorites: Array.from(favorites)
            });
        }

        function applyFilters(templatesArray) {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            return templatesArray.filter(t => {
                // Category filter (existing)
                const matchesCategory = activeCategory === 'all' || t.category === activeCategory;

                // Search filter (existing)
                const matchesSearch = !searchQuery ||
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

                // File type filter
                const matchesFileType = filterState.fileType === 'all' || t.fileType === filterState.fileType;

                // Difficulty filter
                const matchesDifficulty = filterState.difficulty === 'all' ||
                    (t.difficulty && t.difficulty === filterState.difficulty) ||
                    (filterState.difficulty === 'beginner' && !t.difficulty); // Treat no difficulty as beginner

                // Show only filter
                let matchesShowOnly = true;
                if (filterState.showOnly === 'favorites') {
                    matchesShowOnly = favorites.has(t.id);
                } else if (filterState.showOnly === 'recent') {
                    // Recently used: last_used within last 7 days
                    if (t.last_used) {
                        const lastUsedDate = new Date(t.last_used);
                        matchesShowOnly = lastUsedDate >= sevenDaysAgo;
                    } else {
                        matchesShowOnly = false;
                    }
                } else if (filterState.showOnly === 'unused') {
                    matchesShowOnly = !t.usage_count || t.usage_count === 0;
                }

                return matchesCategory && matchesSearch && matchesFileType && matchesDifficulty && matchesShowOnly;
            });
        }

        function sortTemplates(templatesArray) {
            const sorted = [...templatesArray];

            switch (filterState.sortBy) {
                case 'name-asc':
                    sorted.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name-desc':
                    sorted.sort((a, b) => b.name.localeCompare(a.name));
                    break;
                case 'modified':
                    sorted.sort((a, b) => {
                        const dateA = a.modified ? new Date(a.modified) : new Date(0);
                        const dateB = b.modified ? new Date(b.modified) : new Date(0);
                        return dateB - dateA; // Newest first
                    });
                    break;
                case 'usage':
                    sorted.sort((a, b) => {
                        const usageA = a.usage_count || 0;
                        const usageB = b.usage_count || 0;
                        return usageB - usageA; // Most used first
                    });
                    break;
                case 'category':
                    sorted.sort((a, b) => {
                        const catCompare = a.category.localeCompare(b.category);
                        if (catCompare !== 0) return catCompare;
                        return a.name.localeCompare(b.name); // Then by name
                    });
                    break;
            }

            return sorted;
        }

        function renderFilters() {
            const categories = ['all', ...new Set(templates.map(t => t.category))];
            const filtersContainer = document.getElementById('filters');
            filtersContainer.innerHTML = categories.map(cat =>
                \`<button
                    class="filter-btn \${cat === activeCategory ? 'active' : ''}"
                    data-command="setCategory"
                    data-category="\${escapeHtml(cat)}"
                >
                    \${escapeHtml(cat.charAt(0).toUpperCase() + cat.slice(1))} (\${cat === 'all' ? templates.length : templates.filter(t => t.category === cat).length})
                </button>\`
            ).join('');
        }

        function renderStats() {
            const stats = {
                total: templates.length,
                custom: templates.filter(t => !t.isBuiltIn).length,
                builtin: templates.filter(t => t.isBuiltIn).length
            };

            const statsContainer = document.getElementById('stats');
            statsContainer.innerHTML = \`
                <div class="stat-item">
                    <div class="stat-value">\${stats.total}</div>
                    <div class="stat-label">Total Templates</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">\${stats.custom}</div>
                    <div class="stat-label">Custom</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">\${stats.builtin}</div>
                    <div class="stat-label">Built-in</div>
                </div>
            \`;
        }

        function renderTemplates() {
            // Apply all filters
            const filteredTemplates = applyFilters(templates);

            // Apply sorting
            const sortedTemplates = sortTemplates(filteredTemplates);

            const container = document.getElementById('templatesContainer');
            container.className = currentView === 'grid' ? 'templates-grid' : 'templates-list';

            if (sortedTemplates.length === 0) {
                // Phase 5: Context-aware empty states
                container.innerHTML = getEmptyStateHtml();
                return;
            }

            // Create date once for performance
            const now = new Date();

            container.innerHTML = sortedTemplates.map(t => {
                const showNew = isNew(t, now);
                const showPopular = isPopular(t);
                const difficultyStars = getDifficultyStars(t.difficulty);
                const usageTrend = getUsageTrend(t);

                return \`
                <div class="template-card" data-template-id="\${escapeHtml(t.id)}" tabindex="0">
                    <!-- Phase 5: Favorite Button -->
                    <button
                        class="favorite-btn \${favorites.has(t.id) ? 'favorited' : ''}"
                        data-command="toggleFavorite"
                        data-template-id="\${escapeHtml(t.id)}"
                        title="\${favorites.has(t.id) ? 'Remove from favorites' : 'Add to favorites'}"
                        aria-label="\${favorites.has(t.id) ? 'Remove from favorites' : 'Add to favorites'}"
                    >
                        \${favorites.has(t.id) ? '⭐' : '☆'}
                    </button>
                    <div class="template-header">
                        <div style="flex: 1;">
                            <div class="template-title-row">
                                <span class="template-icon">\${getTemplateIcon(t)}</span>
                                <div class="template-title">\${escapeHtml(t.name)}</div>
                                \${difficultyStars ? \`<span class="difficulty-stars" title="Difficulty: \${escapeHtml(t.difficulty)}">\${difficultyStars}</span>\` : ''}
                            </div>
                            <div class="template-badges">
                                <span class="template-category">\${escapeHtml(t.category)}</span>
                                <span class="filetype-badge">\${getFileTypeBadge(t.fileType)}</span>
                                \${showNew ? '<span class="status-badge status-new">NEW</span>' : ''}
                                \${showPopular ? '<span class="status-badge status-popular">🔥 POPULAR</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="template-description">\${escapeHtml(t.description)}</div>
                    <div class="template-tags">
                        \${t.tags.map(tag => \`<span class="tag">#\${escapeHtml(tag)}</span>\`).join('')}
                    </div>
                    <div class="template-meta">
                        <span>v\${escapeHtml(t.version)}</span>
                        <span>\${t.usage_count !== undefined ? \`📊 \${escapeHtml(t.usage_count)} uses\${usageTrend ? \` · \${usageTrend}\` : ''}\` : '📊 0 uses'}</span>
                        \${t.author ? \`<span>👤 \${escapeHtml(t.author)}</span>\` : ''}
                    </div>

                    <!-- Phase 3: Usage Guidance Section -->
                    \${(t.when_to_use || t.use_cases || t.prerequisites || t.related_templates || t.estimated_time) ? \`
                    <div class="guidance-section">
                        <button
                            class="guidance-toggle"
                            data-command="toggleGuidance"
                            aria-expanded="false"
                        >
                            <span class="guidance-toggle-icon">▶</span>
                            <span>📖 Usage Guidance</span>
                            \${t.estimated_time ? \`<span class="guidance-time">⏱️ \${escapeHtml(t.estimated_time)}</span>\` : ''}
                        </button>
                        <div class="guidance-content">
                            \${t.when_to_use ? \`
                                <div class="guidance-item">
                                    <div class="guidance-label">📌 When to Use</div>
                                    <div class="guidance-text">\${escapeHtml(t.when_to_use)}</div>
                                </div>
                            \` : ''}
                            \${t.use_cases && t.use_cases.length > 0 ? \`
                                <div class="guidance-item">
                                    <div class="guidance-label">💡 Example Use Cases</div>
                                    <ul class="guidance-list">
                                        \${t.use_cases.map(uc => \`<li>\${escapeHtml(uc)}</li>\`).join('')}
                                    </ul>
                                </div>
                            \` : ''}
                            \${t.prerequisites && t.prerequisites.length > 0 ? \`
                                <div class="guidance-item">
                                    <div class="guidance-label">✅ Prerequisites</div>
                                    <ul class="guidance-list">
                                        \${t.prerequisites.map(pr => \`<li>\${escapeHtml(pr)}</li>\`).join('')}
                                    </ul>
                                </div>
                            \` : ''}
                            \${t.related_templates && t.related_templates.length > 0 ? \`
                                <div class="guidance-item">
                                    <div class="guidance-label">🔗 Related Templates</div>
                                    <div class="related-templates">
                                        \${t.related_templates.map(rt => \`<span class="related-template-tag">\${escapeHtml(rt)}</span>\`).join('')}
                                    </div>
                                </div>
                            \` : ''}
                        </div>
                    </div>
                    \` : ''}

                    <!-- Level 1: Hover Tooltip -->
                    <div class="template-tooltip" data-tooltip-id="\${escapeHtml(t.id)}">
                        <div class="tooltip-content" id="tooltip-\${escapeHtml(t.id)}">Loading preview...</div>
                        <div class="tooltip-footer">Hover to see first 4 lines • Click Preview for more</div>
                    </div>

                    <!-- Level 2: Inline Preview Section -->
                    <div class="preview-section">
                        <button
                            class="preview-toggle"
                            data-command="togglePreview"
                            data-template-id="\${escapeHtml(t.id)}"
                            aria-expanded="false"
                        >
                            <span class="preview-toggle-icon">▶</span>
                            <span>Preview Template</span>
                        </button>
                        <div class="preview-content">
                            <div class="preview-loading">Loading preview...</div>
                        </div>
                    </div>

                    <div class="template-actions">
                        <button class="action-btn primary" data-command="createFromTemplate" data-template-id="\${escapeHtml(t.id)}">Create</button>
                        \${!t.isBuiltIn ? \`
                            <button class="action-btn" data-command="editVariables" data-template-id="\${escapeHtml(t.id)}" \${t.fileType !== 'json' ? 'disabled title="Only JSON templates support variables"' : ''}>✏️ Edit Variables</button>
                            <button class="action-btn" data-command="editTemplate" data-template-id="\${escapeHtml(t.id)}">Edit</button>
                            <button class="action-btn" data-command="duplicateTemplate" data-template-id="\${escapeHtml(t.id)}">Duplicate</button>
                            <button class="action-btn" data-command="exportTemplate" data-template-id="\${escapeHtml(t.id)}">Export</button>
                            <button class="action-btn danger" data-command="deleteTemplate" data-template-id="\${escapeHtml(t.id)}">Delete</button>
                        \` : ''}
                    </div>
                </div>
                \`;
            }).join('');

            // Add mouseenter event listeners for on-demand tooltip loading
            setTimeout(() => {
                document.querySelectorAll('.template-card').forEach(card => {
                    card.addEventListener('mouseenter', () => {
                        const templateId = card.getAttribute('data-template-id');
                        if (templateId) {
                            loadTooltipPreview(templateId);
                        }
                    }, { once: true }); // Use { once: true } to only fire the event once per card
                });
            }, 0);
        }

        function setView(view) {
            currentView = view;
            document.getElementById('gridBtn').classList.toggle('btn-secondary', view !== 'grid');
            document.getElementById('gridBtn').classList.toggle('btn', view === 'grid');
            document.getElementById('listBtn').classList.toggle('btn-secondary', view !== 'list');
            document.getElementById('listBtn').classList.toggle('btn', view === 'list');
            renderTemplates();
        }

        function setCategory(category) {
            activeCategory = category;
            renderFilters();
            renderTemplates();
        }

        function filterTemplates() {
            searchQuery = document.getElementById('searchInput').value;
            renderTemplates();
        }

        function createFromTemplate(templateId) {
            vscode.postMessage({
                command: 'createFromTemplate',
                templateId: templateId
            });
        }

        function editTemplate(templateId) {
            vscode.postMessage({
                command: 'editTemplate',
                templateId: templateId
            });
        }

        function deleteTemplate(templateId) {
            vscode.postMessage({
                command: 'deleteTemplate',
                templateId: templateId
            });
        }

        function duplicateTemplate(templateId) {
            vscode.postMessage({
                command: 'duplicateTemplate',
                templateId: templateId
            });
        }

        function exportTemplate(templateId) {
            vscode.postMessage({
                command: 'exportTemplate',
                templateId: templateId
            });
        }

        function refresh() {
            vscode.postMessage({
                command: 'refresh'
            });
        }

        // === Guidance System Functions ===

        // Toggle guidance section visibility
        function toggleGuidance(toggleBtn) {
            if (!toggleBtn) return;

            const content = toggleBtn.nextElementSibling;
            if (!content) return;

            const isExpanded = toggleBtn.getAttribute('aria-expanded') !== 'true';

            toggleBtn.setAttribute('aria-expanded', String(isExpanded));
            toggleBtn.classList.toggle('expanded', isExpanded);
            content.classList.toggle('visible', isExpanded);
        }

        // === Preview System Functions ===

        // Preview cache to avoid redundant requests
        const previewCache = new Map();

        // Level 1: Load tooltip preview (first 4 lines)
        function loadTooltipPreview(templateId) {
            // Check cache first
            if (previewCache.has(\`tooltip-\${templateId}\`)) {
                const cached = previewCache.get(\`tooltip-\${templateId}\`);
                updateTooltipContent(templateId, cached.content);
                return;
            }

            // Request preview from extension
            vscode.postMessage({
                command: 'getPreview',
                templateId: templateId,
                maxLines: 4
            });
        }

        function updateTooltipContent(templateId, content) {
            const tooltip = document.getElementById(\`tooltip-\${templateId}\`);
            if (tooltip) {
                tooltip.innerHTML = content;
            }
        }

        // Level 2: Toggle inline expandable preview
        function togglePreview(toggleBtn, templateId) {
            if (!toggleBtn) return;

            const content = toggleBtn.nextElementSibling;
            if (!content) return;

            const isExpanded = toggleBtn.getAttribute('aria-expanded') !== 'true';

            toggleBtn.setAttribute('aria-expanded', String(isExpanded));
            toggleBtn.classList.toggle('expanded', isExpanded);
            content.classList.toggle('visible', isExpanded);

            // Load preview if expanding and not already loaded
            if (isExpanded && !previewCache.has(\`preview-\${templateId}\`)) {
                vscode.postMessage({
                    command: 'getPreview',
                    templateId: templateId,
                    maxLines: 15
                });
            }
        }

        function updateInlinePreview(templateId, content, hasMore) {
            // Find preview content by traversing from the toggle button
            const toggleBtn = document.querySelector(\`[data-command="togglePreview"][data-template-id="\${escapeHtml(templateId)}"]\`);
            if (!toggleBtn) return;

            const previewSection = toggleBtn.closest('.preview-section');
            const previewContent = previewSection ? previewSection.querySelector('.preview-content') : null;

            if (previewContent) {
                previewContent.innerHTML = \`
                    <div class="preview-code">\${content}</div>
                    \${hasMore ? '<div class="preview-more">... (showing first 15 lines)</div>' : ''}
                    <div class="preview-actions">
                        <button class="preview-btn" data-command="showFullPreview" data-template-id="\${escapeHtml(templateId)}">
                            Show Full Template
                        </button>
                    </div>
                \`;
            }
        }

        // Level 3: Full preview modal
        let currentModalTemplateId = null;
        let currentModalTab = 'raw';

        function showFullPreview(templateId) {
            currentModalTemplateId = templateId;
            currentModalTab = 'raw';

            // Find template name
            const template = templates.find(t => t.id === templateId);
            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle && template) {
                modalTitle.textContent = \`\${template.name} - Preview\`;
            }

            // Show modal
            const modal = document.getElementById('previewModal');
            modal.classList.add('visible');

            // Reset tabs
            document.getElementById('rawTab').classList.add('active');
            document.getElementById('sampleTab').classList.remove('active');
            document.getElementById('rawContent').classList.add('active');
            document.getElementById('sampleContent').classList.remove('active');

            // Load full preview if not cached
            if (!previewCache.has(\`full-\${templateId}\`)) {
                document.getElementById('rawCodeContent').innerHTML = '<div class="preview-loading">Loading...</div>';
                document.getElementById('sampleCodeContent').innerHTML = '<div class="preview-loading">Loading...</div>';

                vscode.postMessage({
                    command: 'getFullPreview',
                    templateId: templateId
                });
            } else {
                // Use cached data
                const cached = previewCache.get(\`full-\${templateId}\`);
                updateModalContent(cached.content, cached.samplePreview);
            }
        }

        function updateModalContent(rawContent, samplePreview) {
            document.getElementById('rawCodeContent').innerHTML = rawContent;
            document.getElementById('sampleCodeContent').innerHTML = samplePreview;
        }

        function closePreviewModal() {
            const modal = document.getElementById('previewModal');
            modal.classList.remove('visible');
            currentModalTemplateId = null;
        }

        function closeModalOnOverlay(event) {
            // Only close if clicking the overlay, not the modal container
            if (event.target.id === 'previewModal') {
                closePreviewModal();
            }
        }

        function switchModalTab(tab) {
            currentModalTab = tab;

            // Update tab buttons
            document.getElementById('rawTab').classList.toggle('active', tab === 'raw');
            document.getElementById('sampleTab').classList.toggle('active', tab === 'sample');

            // Update tab content
            document.getElementById('rawContent').classList.toggle('active', tab === 'raw');
            document.getElementById('sampleContent').classList.toggle('active', tab === 'sample');
        }

        function copyModalContent(event) {
            const content = currentModalTab === 'raw'
                ? document.getElementById('rawCodeContent').innerText
                : document.getElementById('sampleCodeContent').innerText;

            // Use the clipboard API
            navigator.clipboard.writeText(content).then(() => {
                // Visual feedback - temporarily change button text
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }

        // Phase 5: Enhanced Keyboard Navigation
        let currentFocusedIndex = -1;
        let keyboardHintVisible = false;

        document.addEventListener('keydown', (event) => {
            // Cache DOM references for performance - Issue #111 Code Review
            const variableEditor = document.getElementById('variableEditorModal');
            const isVariableEditorOpen = variableEditor && variableEditor.classList.contains('visible');

            // Ctrl+S / Cmd+S to save in variable editor (Issue #111)
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                if (isVariableEditorOpen) {
                    event.preventDefault();
                    const variableForm = document.getElementById('variableForm');
                    if (variableForm && variableForm.style.display !== 'none') {
                        saveVariable();
                    } else {
                        saveAllVariables();
                    }
                    return;
                }
            }

            // ESC to close modal or variable editor or clear search (Issue #111)
            if (event.key === 'Escape') {
                // Close variable editor if open
                if (isVariableEditorOpen) {
                    const variableForm = document.getElementById('variableForm');
                    if (variableForm && variableForm.style.display !== 'none') {
                        // Cancel variable edit form
                        cancelVariableEdit();
                    } else {
                        // Close entire variable editor
                        closeVariableEditor();
                    }
                    return;
                }

                // Close preview modal
                const modal = document.getElementById('previewModal');
                if (modal.classList.contains('visible')) {
                    closePreviewModal();
                    return;
                }

                // Clear search
                const searchInput = document.getElementById('searchInput');
                if (searchInput.value) {
                    searchInput.value = '';
                    filterTemplates();
                    return;
                }
            }

            // Delete key for variable deletion in variable editor (Issue #111)
            if (event.key === 'Delete') {
                if (isVariableEditorOpen) {
                    const deleteBtn = document.getElementById('deleteVarBtn');
                    if (deleteBtn && deleteBtn.style.display !== 'none' && !isInputFocused()) {
                        event.preventDefault();
                        deleteCurrentVariable();
                        return;
                    }
                }
            }

            // / to focus search
            if (event.key === '/' && !isInputFocused()) {
                event.preventDefault();
                document.getElementById('searchInput').focus();
                return;
            }

            // ? to toggle keyboard shortcuts hint
            if (event.key === '?' && !isInputFocused()) {
                event.preventDefault();
                toggleKeyboardHint();
                return;
            }

            // Arrow keys for card navigation
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (!isInputFocused()) {
                    event.preventDefault();
                    navigateCards(event.key === 'ArrowDown' ? 1 : -1);
                    return;
                }
            }

            // Enter to create note from focused card
            if (event.key === 'Enter' && !isInputFocused()) {
                const card = getFocusedCard();
                if (card) {
                    const templateId = card.getAttribute('data-template-id');
                    if (templateId) {
                        createFromTemplate(templateId);
                    }
                    return;
                }
            }

            // Space to toggle preview
            if (event.key === ' ' && !isInputFocused()) {
                event.preventDefault();
                const card = getFocusedCard();
                if (card) {
                    const templateId = card.getAttribute('data-template-id');
                    const toggleBtn = card.querySelector('[data-command="togglePreview"]');
                    if (toggleBtn && templateId) {
                        togglePreview(toggleBtn, templateId);
                    }
                    return;
                }
            }

            // F to toggle favorite
            if (event.key === 'f' && !isInputFocused()) {
                event.preventDefault();
                const card = getFocusedCard();
                if (card) {
                    const templateId = card.getAttribute('data-template-id');
                    if (templateId) {
                        toggleFavorite(templateId);
                    }
                    return;
                }
            }
        });

        // Phase 5: Context Menu Support
        document.addEventListener('contextmenu', (event) => {
            const card = event.target.closest('.template-card');
            if (card) {
                event.preventDefault();
                const templateId = card.getAttribute('data-template-id');
                if (templateId) {
                    showContextMenu(event.clientX, event.clientY, templateId);
                }
            }
        });

        // Close context menu on click outside
        document.addEventListener('click', (event) => {
            const contextMenu = document.getElementById('contextMenu');
            if (!event.target.closest('#contextMenu') && !event.target.closest('.template-card')) {
                contextMenu.classList.remove('visible');
            }
        });

        // === Phase 5: Helper Functions ===

        // Check if an input element is focused
        function isInputFocused() {
            const activeElement = document.activeElement;
            return activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'SELECT'
            );
        }

        // Get the currently focused card
        function getFocusedCard() {
            const cards = Array.from(document.querySelectorAll('.template-card'));
            if (currentFocusedIndex >= 0 && currentFocusedIndex < cards.length) {
                return cards[currentFocusedIndex];
            }
            return null;
        }

        // Navigate between template cards with arrow keys
        function navigateCards(direction) {
            const cards = Array.from(document.querySelectorAll('.template-card'));
            if (cards.length === 0) return;

            // Remove previous focus
            if (currentFocusedIndex >= 0 && currentFocusedIndex < cards.length) {
                cards[currentFocusedIndex].classList.remove('keyboard-focused');
            }

            // Update index
            currentFocusedIndex += direction;

            // Wrap around
            if (currentFocusedIndex < 0) {
                currentFocusedIndex = cards.length - 1;
            } else if (currentFocusedIndex >= cards.length) {
                currentFocusedIndex = 0;
            }

            // Apply focus
            const focusedCard = cards[currentFocusedIndex];
            focusedCard.classList.add('keyboard-focused');
            focusedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Toggle keyboard shortcuts hint visibility
        function toggleKeyboardHint() {
            keyboardHintVisible = !keyboardHintVisible;
            const hint = document.getElementById('keyboardHint');
            hint.classList.toggle('visible', keyboardHintVisible);
        }

        // Toggle favorite status for a template
        function toggleFavorite(templateId) {
            if (favorites.has(templateId)) {
                favorites.delete(templateId);
            } else {
                favorites.add(templateId);
            }

            // Save to state
            saveFilterState();

            // Update UI
            renderTemplates();
        }

        // Show context menu at specified position
        function showContextMenu(x, y, templateId) {
            const template = templates.find(t => t.id === templateId);
            if (!template) return;

            const contextMenu = document.getElementById('contextMenu');
            const isFavorited = favorites.has(templateId);
            const isBuiltIn = template.isBuiltIn;
            const escapedId = escapeHtml(templateId);

            // Build menu items
            let menuHtml = \`
                <div class="context-menu-item" data-command="createFromTemplate" data-template-id="\${escapedId}">
                    <span>✨</span> Create Note
                </div>
                <div class="context-menu-item" data-command="showFullPreview" data-template-id="\${escapedId}">
                    <span>👁️</span> Preview
                </div>
                <div class="context-menu-item" data-command="toggleFavorite" data-template-id="\${escapedId}">
                    <span>\${isFavorited ? '⭐' : '☆'}</span> \${isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                </div>
                <div class="context-menu-separator"></div>
            \`;

            if (!isBuiltIn) {
                menuHtml += \`
                    <div class="context-menu-item" data-command="editTemplate" data-template-id="\${escapedId}">
                        <span>✏️</span> Edit
                    </div>
                    <div class="context-menu-item" data-command="duplicateTemplate" data-template-id="\${escapedId}">
                        <span>📋</span> Duplicate
                    </div>
                    <div class="context-menu-separator"></div>
                \`;
            }

            menuHtml += \`
                <div class="context-menu-item" data-command="exportTemplate" data-template-id="\${escapedId}">
                    <span>💾</span> Export
                </div>
                <div class="context-menu-item" data-command="copyTemplateId" data-template-id="\${escapedId}">
                    <span>📎</span> Copy Template ID
                </div>
            \`;

            if (!isBuiltIn) {
                menuHtml += \`
                    <div class="context-menu-separator"></div>
                    <div class="context-menu-item danger" data-command="deleteTemplate" data-template-id="\${escapedId}">
                        <span>🗑️</span> Delete
                    </div>
                \`;
            }

            contextMenu.innerHTML = menuHtml;

            // Position the menu
            contextMenu.style.left = x + 'px';
            contextMenu.style.top = y + 'px';
            contextMenu.classList.add('visible');

            // Adjust if menu goes off-screen
            setTimeout(() => {
                const rect = contextMenu.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                    contextMenu.style.left = (x - rect.width) + 'px';
                }
                if (rect.bottom > window.innerHeight) {
                    contextMenu.style.top = (y - rect.height) + 'px';
                }
            }, 0);
        }

        // Copy template ID to clipboard
        function copyTemplateId(templateId) {
            navigator.clipboard.writeText(templateId).then(() => {
                // Visual feedback could be added here
                const contextMenu = document.getElementById('contextMenu');
                contextMenu.classList.remove('visible');
            }).catch(err => {
                console.error('Failed to copy template ID:', err);
            });
        }

        // Get context-aware empty state HTML
        function getEmptyStateHtml() {
            const hasSearch = searchQuery.trim().length > 0;
            const hasFilters = filterState.fileType !== 'all' ||
                              filterState.difficulty !== 'all' ||
                              filterState.showOnly !== 'all';
            const showingFavorites = filterState.showOnly === 'favorites';
            const totalTemplates = templates.length;

            // No templates at all
            if (totalTemplates === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <div class="empty-state-title">No Templates Yet</div>
                        <div style="margin-bottom: 16px;">Get started by creating your first custom template</div>
                        <button class="btn" onclick="vscode.postMessage({command: 'refresh'})">
                            Refresh Templates
                        </button>
                    </div>
                \`;
            }

            // No favorites selected
            if (showingFavorites && favorites.size === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">⭐</div>
                        <div class="empty-state-title">No Favorites Yet</div>
                        <div style="margin-bottom: 16px;">Star your frequently used templates for quick access</div>
                        <button class="btn" data-command="showAllFromEmptyState">
                            Show All Templates
                        </button>
                    </div>
                \`;
            }

            // No search results
            if (hasSearch && !hasFilters) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <div class="empty-state-title">No Matches Found</div>
                        <div style="margin-bottom: 16px;">No templates match "\${escapeHtml(searchQuery)}"</div>
                        <button class="btn" onclick="document.getElementById('searchInput').value = ''; filterTemplates()">
                            Clear Search
                        </button>
                    </div>
                \`;
            }

            // No results with filters
            if (hasFilters || hasSearch) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <div class="empty-state-title">No Results</div>
                        <div style="margin-bottom: 16px;">No templates match your current filters</div>
                        <button class="btn" onclick="clearAllFilters(); document.getElementById('searchInput').value = ''; filterTemplates()">
                            Clear All Filters
                        </button>
                    </div>
                \`;
            }

            // Fallback
            return \`
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-title">No Templates Found</div>
                    <div>Try adjusting your search or filters</div>
                </div>
            \`;
        }

        // === Variable Editor Functions ===

        // Variable editor state
        let currentTemplateData = null;
        let customVariables = [];
        let editingVariableIndex = -1;
        let BUILT_IN_VARS = []; // Will be populated from backend

        // Validation promise management (Issue #111 Code Review - replaced window.pendingVariable)
        let currentValidationResolver = null;

        // Focus trap management for modal accessibility (Issue #111)
        let focusTrapActive = false;
        let lastFocusedElement = null;

        // Open variable editor modal - Enhanced with focus trap (Issue #111)
        function openVariableEditor(templateId) {
            const template = templates.find(t => t.id === templateId);
            if (!template) return;

            if (template.fileType !== 'json') {
                // Show error for non-JSON templates
                return;
            }

            // Store last focused element to restore later
            lastFocusedElement = document.activeElement;

            // Request template data from extension
            vscode.postMessage({
                command: 'getTemplateData',
                templateId: templateId
            });

            // Show modal (will be populated when data arrives)
            const modal = document.getElementById('variableEditorModal');
            modal.classList.add('visible');

            // Setup focus trap
            setupFocusTrap(modal);

            // Focus first focusable element
            setTimeout(() => {
                const firstFocusable = getFirstFocusableElement(modal);
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }, 100);
        }

        // Close variable editor modal - Enhanced to restore focus (Issue #111)
        function closeVariableEditor() {
            const modal = document.getElementById('variableEditorModal');
            modal.classList.remove('visible');
            currentTemplateData = null;
            customVariables = [];
            editingVariableIndex = -1;

            // Remove focus trap
            removeFocusTrap();

            // Restore focus to previously focused element
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
        }

        // Setup focus trap within modal (Issue #111 - Accessibility)
        function setupFocusTrap(container) {
            focusTrapActive = true;

            // Add Tab key listener for focus trapping
            document.addEventListener('keydown', handleFocusTrap);

            // Add aria-modal attribute
            container.setAttribute('role', 'dialog');
            container.setAttribute('aria-modal', 'true');
        }

        // Remove focus trap (Issue #111 - Accessibility)
        function removeFocusTrap() {
            focusTrapActive = false;
            document.removeEventListener('keydown', handleFocusTrap);
        }

        // Handle focus trap Tab navigation (Issue #111 - Accessibility)
        function handleFocusTrap(event) {
            if (!focusTrapActive || event.key !== 'Tab') return;

            const modal = document.getElementById('variableEditorModal');
            if (!modal || !modal.classList.contains('visible')) return;

            const focusableElements = getFocusableElements(modal);
            if (focusableElements.length === 0) return;

            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                // Shift+Tab - move backwards
                if (document.activeElement === firstFocusable) {
                    event.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                // Tab - move forwards
                if (document.activeElement === lastFocusable) {
                    event.preventDefault();
                    firstFocusable.focus();
                }
            }
        }

        // Get all focusable elements within a container (Issue #111)
        function getFocusableElements(container) {
            const focusableSelectors = [
                'button:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                'a[href]',
                '[tabindex]:not([tabindex="-1"])'
            ];

            return Array.from(
                container.querySelectorAll(focusableSelectors.join(', '))
            ).filter(el => {
                // Filter out hidden elements
                return el.offsetParent !== null || el.offsetHeight > 0 || el.offsetWidth > 0;
            });
        }

        // Get first focusable element (Issue #111)
        function getFirstFocusableElement(container) {
            const elements = getFocusableElements(container);
            return elements.length > 0 ? elements[0] : null;
        }

        // Populate variable editor with template data
        function populateVariableEditor(templateData, builtInVariables) {
            currentTemplateData = templateData;
            customVariables = templateData.variables || [];
            BUILT_IN_VARS = builtInVariables || [];

            document.getElementById('variableEditorTitle').textContent = \`Edit Variables: \${templateData.name}\`;
            renderVariablesList();
            updateTemplatePreview();
            updateVariableCount();
            updateBuiltInVariablesDisplay();
        }

        // Render variables list
        function renderVariablesList() {
            const listContainer = document.getElementById('variablesList');

            if (customVariables.length === 0) {
                listContainer.innerHTML = \`
                    <div class="empty-variables-state">
                        <div style="font-size: 32px; margin-bottom: 12px;">📝</div>
                        <div>No custom variables yet</div>
                        <div style="font-size: 12px; margin-top: 6px;">Click "Add Variable" to create one</div>
                    </div>
                \`;
                return;
            }

            listContainer.innerHTML = customVariables.map((v, index) => \`
                <div class="variable-item \${editingVariableIndex === index ? 'selected' : ''}" data-index="\${index}">
                    <div class="variable-item-header">
                        <span class="variable-name">{\${escapeHtml(v.name)}}</span>
                        <span class="variable-type-badge">\${escapeHtml(v.type)}</span>
                    </div>
                    \${v.description ? \`<div class="variable-description">\${escapeHtml(v.description)}</div>\` : ''}
                </div>
            \`).join('');

            // Add event listeners using event delegation
            listContainer.querySelectorAll('.variable-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.getAttribute('data-index') || '-1', 10);
                    if (index >= 0) {
                        selectVariableForEdit(index);
                    }
                });
            });
        }

        // Select a variable for editing - Enhanced with usage info (Issue #111)
        function selectVariableForEdit(index) {
            editingVariableIndex = index;
            const variable = customVariables[index];

            // Show form
            document.getElementById('variableForm').style.display = 'block';
            document.getElementById('deleteVarBtn').style.display = 'block';

            // Populate form
            document.getElementById('varName').value = variable.name;
            document.getElementById('varType').value = variable.type;
            document.getElementById('varDescription').value = variable.description || '';
            document.getElementById('varDefault').value = variable.default || '';
            document.getElementById('varRequired').checked = variable.required || false;

            // Handle enum values
            if (variable.type === 'enum') {
                document.getElementById('enumValuesGroup').style.display = 'block';
                renderEnumValues(variable.values || []);
            } else {
                document.getElementById('enumValuesGroup').style.display = 'none';
            }

            // Clear errors and validation
            clearValidationErrors();

            // Request variable usage info from backend
            requestVariableUsageInfo(variable.name);

            renderVariablesList();
        }

        // Request variable usage information (Issue #111)
        function requestVariableUsageInfo(variableName) {
            vscode.postMessage({
                command: 'getVariableUsageInfo',
                templateId: currentEditingTemplate,
                variableName: variableName
            });
        }

        // Handle variable usage response (Issue #111)
        function handleVariableUsageResponse(data) {
            const usagePanel = document.getElementById('usageInfoPanel');
            const countDiv = document.getElementById('usageCount');
            const positionsDiv = document.getElementById('usagePositions');

            if (!data.count || data.count === 0) {
                usagePanel.style.display = 'none';
                return;
            }

            // Display usage count
            countDiv.innerHTML = \`Variable used <span class="usage-count-badge">\${data.count} time\${data.count !== 1 ? 's' : ''}</span> in template\`;

            // Display usage positions (show first 5)
            if (data.positions && data.positions.length > 0) {
                const maxShow = 5;
                const positions = data.positions.slice(0, maxShow);
                positionsDiv.innerHTML = positions.map(pos =>
                    \`<div class="usage-position-item">
                        <span class="line-number">Line \${pos.line}:</span>
                        <span class="context-text">\${escapeHtml(pos.context).replace(
                            new RegExp(\`\\\\{\${escapeRegex(pos.variableName)}\\\\}\`, 'g'),
                            '<span class="highlight">{\$&}</span>'
                        )}</span>
                    </div>\`
                ).join('');

                if (data.positions.length > maxShow) {
                    positionsDiv.innerHTML += \`<div class="usage-positions-more-info">...and \${data.positions.length - maxShow} more</div>\`;
                }
            }

            usagePanel.style.display = 'block';
        }

        // Escape regex special characters
        function escapeRegex(str) {
            return str.replace(/[.*+?^$\{\\}()|\\[\\]\\\\]/g, '\\\\$&');
        }

        // Add new variable
        function addNewVariable() {
            editingVariableIndex = -1;

            // Show form
            document.getElementById('variableForm').style.display = 'block';
            document.getElementById('deleteVarBtn').style.display = 'none';

            // Clear form
            document.getElementById('varName').value = '';
            document.getElementById('varType').value = 'string';
            document.getElementById('varDescription').value = '';
            document.getElementById('varDefault').value = '';
            document.getElementById('varRequired').checked = false;
            document.getElementById('enumValuesGroup').style.display = 'none';

            // Clear errors
            document.getElementById('varNameError').textContent = '';
            document.getElementById('varName').classList.remove('error');

            renderVariablesList();
        }

        // Cancel variable edit
        function cancelVariableEdit() {
            document.getElementById('variableForm').style.display = 'none';
            editingVariableIndex = -1;
            renderVariablesList();
        }

        // Validate variable name
        function validateVariableName(name) {
            if (!name || name.trim().length === 0) {
                return { isValid: false, error: 'Variable name cannot be empty' };
            }

            const validFormat = /^[a-z][a-z0-9_]*$/;
            if (!validFormat.test(name)) {
                return {
                    isValid: false,
                    error: 'Must start with a letter and contain only lowercase letters, numbers, and underscores'
                };
            }

            if (BUILT_IN_VARS.includes(name)) {
                return {
                    isValid: false,
                    error: \`'\${name}' is a built-in variable\`
                };
            }

            // Check for duplicates (excluding currently editing variable)
            const duplicate = customVariables.findIndex((v, idx) => v.name === name && idx !== editingVariableIndex);
            if (duplicate !== -1) {
                return {
                    isValid: false,
                    error: \`Variable '\${name}' already exists\`
                };
            }

            return { isValid: true };
        }

        // Save variable - Enhanced with advanced validation (Issue #111)
        async function saveVariable() {
            const name = document.getElementById('varName').value.trim();
            const type = document.getElementById('varType').value;
            const description = document.getElementById('varDescription').value.trim();
            const defaultValue = document.getElementById('varDefault').value.trim();
            const required = document.getElementById('varRequired').checked;

            // Clear previous errors
            clearValidationErrors();

            // Validate name
            const validation = validateVariableName(name);
            if (!validation.isValid) {
                document.getElementById('varNameError').textContent = validation.error;
                document.getElementById('varName').classList.add('error');
                document.getElementById('varName').setAttribute('aria-invalid', 'true');
                announceToScreenReader(validation.error);
                return;
            }

            // Build variable object
            const variable = {
                name,
                type,
                required,
                description: description || undefined,
                default: defaultValue || undefined
            };

            // Handle enum values
            if (type === 'enum') {
                const enumInputs = document.querySelectorAll('.enum-value-input');
                const values = Array.from(enumInputs)
                    .map(input => input.value.trim())
                    .filter(val => val.length > 0);

                if (values.length === 0) {
                    document.getElementById('varNameError').textContent = 'Enum must have at least one value';
                    document.getElementById('varName').setAttribute('aria-invalid', 'true');
                    announceToScreenReader('Enum must have at least one value');
                    return;
                }

                variable.values = values;
            }

            // Perform advanced validation via backend
            const otherVariables = customVariables.filter((v, idx) => idx !== editingVariableIndex);
            const originalName = editingVariableIndex >= 0 ? customVariables[editingVariableIndex].name : undefined;

            const validationResult = await performAdvancedValidation(variable, otherVariables, originalName);

            // If validation passed, save the variable
            if (validationResult.isValid) {
                // Add or update variable
                if (editingVariableIndex === -1) {
                    customVariables.push(variable);
                } else {
                    customVariables[editingVariableIndex] = variable;
                }

                // Hide form and refresh
                document.getElementById('variableForm').style.display = 'none';
                editingVariableIndex = -1;
                renderVariablesList();
                updateTemplatePreview();
                updateVariableCount();

                announceToScreenReader('Variable saved successfully');
            }
        }

        // Perform advanced validation and return Promise (Issue #111 Code Review)
        function performAdvancedValidation(variable, otherVariables, originalName) {
            return new Promise((resolve, reject) => {
                // Store resolver for the response handler
                currentValidationResolver = { resolve, reject, variable, originalName };

                // Request advanced validation from backend
                vscode.postMessage({
                    command: 'validateVariable',
                    templateId: currentEditingTemplate,
                    variable: variable,
                    existingVariables: otherVariables,
                    originalName: originalName
                });
            });
        }

        // Handle validation response from backend (Issue #111 Code Review - Promise-based)
        function handleValidationResponse(data) {
            const validationPanel = document.getElementById('validationPanel');
            const errorsDiv = document.getElementById('validationErrors');
            const warningsDiv = document.getElementById('validationWarnings');

            // Clear previous validation
            errorsDiv.innerHTML = '';
            warningsDiv.innerHTML = '';

            // Display errors
            if (data.errors && data.errors.length > 0) {
                errorsDiv.innerHTML = data.errors.map(error =>
                    \`<div class="validation-error-item">\${escapeHtml(error)}</div>\`
                ).join('');
                validationPanel.style.display = 'block';

                // Announce errors to screen reader
                announceToScreenReader(\`\${data.errors.length} validation error\${data.errors.length > 1 ? 's' : ''}: \${data.errors.join(', ')}\`);

                // Resolve promise with validation result (validation failed)
                if (currentValidationResolver) {
                    currentValidationResolver.resolve(data);
                    currentValidationResolver = null;
                }
                return;
            }

            // Display warnings (non-blocking)
            if (data.warnings && data.warnings.length > 0) {
                warningsDiv.innerHTML = data.warnings.map(warning =>
                    \`<div class="validation-warning-item">\${escapeHtml(warning)}</div>\`
                ).join('');
                validationPanel.style.display = 'block';

                // Announce warnings to screen reader
                announceToScreenReader(\`\${data.warnings.length} validation warning\${data.warnings.length > 1 ? 's' : ''}\`);
            } else {
                validationPanel.style.display = 'none';
            }

            // Validation passed - resolve promise with success
            if (currentValidationResolver && data.isValid) {
                currentValidationResolver.resolve(data);
                currentValidationResolver = null;
            }
        }

        // Clear validation errors
        function clearValidationErrors() {
            document.getElementById('varNameError').textContent = '';
            document.getElementById('varDefaultError').textContent = '';
            document.getElementById('varName').classList.remove('error');
            document.getElementById('varName').setAttribute('aria-invalid', 'false');
            document.getElementById('validationPanel').style.display = 'none';
            document.getElementById('validationErrors').innerHTML = '';
            document.getElementById('validationWarnings').innerHTML = '';
        }

        // Announce message to screen reader (Issue #111 - Accessibility)
        function announceToScreenReader(message) {
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.className = 'sr-only';
            liveRegion.textContent = message;
            document.body.appendChild(liveRegion);

            // Remove after announcement
            setTimeout(() => {
                document.body.removeChild(liveRegion);
            }, 1000);
        }

        // Delete current variable
        function deleteCurrentVariable() {
            if (editingVariableIndex === -1) return;

            const varName = customVariables[editingVariableIndex].name;

            // Show inline confirmation instead of native confirm dialog
            const form = document.getElementById('variableForm');
            const originalHTML = form.innerHTML;

            form.innerHTML = \`
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 16px; margin-bottom: 20px;">
                        Delete variable '<strong>\${escapeHtml(varName)}</strong>'?
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button class="btn btn-secondary" id="cancelDelete">Cancel</button>
                        <button class="btn danger" id="confirmDelete">Delete</button>
                    </div>
                </div>
            \`;

            document.getElementById('cancelDelete').addEventListener('click', () => {
                form.innerHTML = originalHTML;
                selectVariableForEdit(editingVariableIndex);
            });

            document.getElementById('confirmDelete').addEventListener('click', () => {
                customVariables.splice(editingVariableIndex, 1);
                form.style.display = 'none';
                form.innerHTML = originalHTML;
                editingVariableIndex = -1;
                renderVariablesList();
                updateTemplatePreview();
                updateVariableCount();
            });
        }

        // Render enum values
        function renderEnumValues(values) {
            const container = document.getElementById('enumValues');
            container.innerHTML = values.map((val, idx) => \`
                <div class="enum-value-row" data-enum-index="\${idx}">
                    <input type="text" class="form-input enum-value-input" value="\${escapeHtml(val)}" placeholder="Option \${idx + 1}">
                    <button class="btn-remove-enum">×</button>
                </div>
            \`).join('');

            // Add event listeners for remove buttons
            container.querySelectorAll('.btn-remove-enum').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const row = e.target.closest('.enum-value-row');
                    if (row && container.children.length > 1) {
                        row.remove();
                    }
                });
            });

            if (values.length === 0) {
                addEnumValue();
            }
        }

        // Add enum value
        function addEnumValue() {
            const container = document.getElementById('enumValues');
            const currentCount = container.children.length;

            const row = document.createElement('div');
            row.className = 'enum-value-row';
            row.innerHTML = \`
                <input type="text" class="form-input enum-value-input" placeholder="Option \${currentCount + 1}">
                <button class="btn-remove-enum">×</button>
            \`;

            // Add event listener for remove button
            const removeBtn = row.querySelector('.btn-remove-enum');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    if (container.children.length > 1) {
                        row.remove();
                    }
                });
            }

            container.appendChild(row);
        }

        // Listen for type changes to show/hide enum values
        document.addEventListener('DOMContentLoaded', () => {
            const typeSelect = document.getElementById('varType');
            if (typeSelect) {
                typeSelect.addEventListener('change', (e) => {
                    const enumGroup = document.getElementById('enumValuesGroup');
                    if (e.target.value === 'enum') {
                        enumGroup.style.display = 'block';
                        renderEnumValues(['']);
                    } else {
                        enumGroup.style.display = 'none';
                    }
                });
            }
        });

        // Update template preview with variables highlighted
        function updateTemplatePreview() {
            if (!currentTemplateData) return;

            const preview = document.getElementById('templatePreview');
            let content = currentTemplateData.content;

            // Highlight all variables (built-in and custom)
            const allVars = [
                ...BUILT_IN_VARS,
                ...customVariables.map(v => v.name)
            ];

            // Replace variables with highlighted versions
            allVars.forEach(varName => {
                const regex = new RegExp(\`\\\\{\${varName}\\\\}\`, 'g');
                content = content.replace(regex, \`<span class="variable-highlight">{\${escapeHtml(varName)}}</span>\`);
            });

            preview.innerHTML = content;
        }

        // Update variable count
        function updateVariableCount() {
            const count = customVariables.length;
            document.getElementById('variableCount').textContent = \`\${count} custom variable\${count !== 1 ? 's' : ''}\`;
        }

        // Update built-in variables display
        function updateBuiltInVariablesDisplay() {
            const infoDiv = document.querySelector('.built-in-variables-info');
            if (infoDiv && BUILT_IN_VARS.length > 0) {
                infoDiv.innerHTML = \`
                    <strong>Built-in Variables:</strong><br>
                    \${BUILT_IN_VARS.map(v => \`<span class="built-in-var">{\${escapeHtml(v)}}</span>\`).join(', ')}
                \`;
            }
        }

        // Save all variables to template
        function saveAllVariables() {
            if (!currentTemplateData) return;

            vscode.postMessage({
                command: 'saveTemplateVariables',
                templateId: currentTemplateData.id,
                variables: customVariables
            });
        }

        // Export variables configuration (Issue #111 - UX Enhancement)
        function exportVariablesConfig() {
            if (!currentTemplateData) return;

            vscode.postMessage({
                command: 'exportVariables',
                templateId: currentTemplateData.id
            });
        }

        // Import variables configuration (Issue #111 - UX Enhancement)
        function importVariablesConfig() {
            if (!currentTemplateData) return;

            // Create a file input element dynamically
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';

            input.addEventListener('change', async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    vscode.postMessage({
                        command: 'importVariables',
                        templateId: currentTemplateData.id,
                        variablesJson: text
                    });
                } catch (error) {
                    announceToScreenReader('Failed to read file: ' + error.message);
                } finally {
                    document.body.removeChild(input);
                }
            });

            document.body.appendChild(input);
            input.click();
        }

        // Handle export variables response (Issue #111)
        function handleExportVariablesResponse(message) {
            if (message.success) {
                announceToScreenReader('Variables exported successfully');
            } else {
                announceToScreenReader('Failed to export variables: ' + message.error);
            }
        }

        // Handle import variables response (Issue #111)
        function handleImportVariablesResponse(message) {
            if (message.success) {
                // Replace current variables with imported ones
                customVariables = message.variables || [];
                renderVariablesList();
                updateTemplatePreview();
                updateVariableCount();
                announceToScreenReader(\`Successfully imported \${customVariables.length} variable\${customVariables.length !== 1 ? 's' : ''}\`);
            } else {
                announceToScreenReader('Failed to import variables: ' + message.error);
                // Show error in footer
                const footer = document.querySelector('.variable-editor-footer .footer-info');
                if (footer) {
                    footer.innerHTML = \`<span class="import-failed-message">❌ Import failed: \${escapeHtml(message.error)}</span>\`;
                    setTimeout(() => {
                        footer.textContent = \`\${customVariables.length} custom variable\${customVariables.length !== 1 ? 's' : ''}\`;
                    }, 5000);
                }
            }
        }

        // Update message handler to process preview responses
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateTemplates':
                    templates = message.templates;
                    renderFilters();
                    renderStats();
                    renderTemplates();
                    break;

                case 'previewResponse':
                    if (message.error) {
                        console.error('Preview error:', message.error);
                        return;
                    }

                    // Cache the preview
                    const cacheKey = message.maxLines === 4 ? 'tooltip' : 'preview';
                    previewCache.set(\`\${cacheKey}-\${message.templateId}\`, {
                        content: message.content,
                        hasMore: message.hasMore
                    });

                    // Update UI
                    if (message.maxLines === 4) {
                        updateTooltipContent(message.templateId, message.content);
                    } else {
                        updateInlinePreview(message.templateId, message.content, message.hasMore);
                    }
                    break;

                case 'fullPreviewResponse':
                    if (message.error) {
                        console.error('Full preview error:', message.error);
                        return;
                    }

                    // Cache the full preview
                    previewCache.set(\`full-\${message.templateId}\`, {
                        content: message.content,
                        samplePreview: message.samplePreview
                    });

                    // Update modal content
                    updateModalContent(message.content, message.samplePreview);
                    break;

                case 'templateDataResponse':
                    if (message.error) {
                        console.error('Template data error:', message.error);
                        closeVariableEditor();
                        return;
                    }

                    populateVariableEditor(message.template, message.builtInVariables || []);
                    break;

                case 'saveVariablesResponse':
                    if (message.success) {
                        closeVariableEditor();
                    } else {
                        console.error('Save variables error:', message.error);
                        // Show inline error instead of alert
                        const footer = document.querySelector('.variable-editor-footer .footer-info');
                        if (footer) {
                            footer.innerHTML = \`<span class="save-failed-message">❌ Failed to save: \${escapeHtml(message.error)}</span>\`;
                            setTimeout(() => {
                                footer.textContent = \`\${customVariables.length} custom variable\${customVariables.length !== 1 ? 's' : ''}\`;
                            }, 5000);
                        }
                    }
                    break;

                case 'validateVariableResponse':
                    handleValidationResponse(message);
                    break;

                case 'variableUsageInfoResponse':
                    handleVariableUsageResponse(message);
                    break;

                case 'exportVariablesResponse':
                    handleExportVariablesResponse(message);
                    break;

                case 'importVariablesResponse':
                    handleImportVariablesResponse(message);
                    break;
            }
        });
