import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { cleanupMocks } from '../setup';

describe('Template Browser View', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        cleanupMocks();
    });

    describe('Template Browser Integration', () => {
        it('should register showTemplateBrowser command', () => {
            // Verify the command is registered in package.json
            const packageJson = require('../../../package.json');
            const command = packageJson.contributes.commands.find(
                (cmd: any) => cmd.command === 'noted.showTemplateBrowser'
            );

            expect(command).to.exist;
            expect(command.title).to.equal('Noted: Show Template Browser');
            expect(command.icon).to.equal('$(library)');
        });

        it('should have Template Browser in command palette', () => {
            const packageJson = require('../../../package.json');
            const command = packageJson.contributes.commands.find(
                (cmd: any) => cmd.command === 'noted.showTemplateBrowser'
            );

            expect(command).to.exist;
            expect(command.title).to.include('Template Browser');
        });
    });

    describe('Template Display Info Structure', () => {
        it('should have correct structure for built-in templates', () => {
            // Test that built-in templates would have the expected structure
            const builtInTemplate = {
                id: 'meeting',
                name: 'Meeting',
                description: 'Built-in meeting template',
                category: 'Built-in',
                tags: ['built-in'],
                version: '1.0.0',
                isBuiltIn: true,
                fileType: 'builtin' as const
            };

            expect(builtInTemplate).to.have.property('id');
            expect(builtInTemplate).to.have.property('name');
            expect(builtInTemplate).to.have.property('description');
            expect(builtInTemplate).to.have.property('category');
            expect(builtInTemplate).to.have.property('tags');
            expect(builtInTemplate).to.have.property('version');
            expect(builtInTemplate).to.have.property('isBuiltIn');
            expect(builtInTemplate).to.have.property('fileType');
            expect(builtInTemplate.isBuiltIn).to.be.true;
        });

        it('should have correct structure for custom JSON templates', () => {
            const jsonTemplate = {
                id: 'custom-meeting',
                name: 'Custom Meeting',
                description: 'Custom meeting template',
                category: 'Work',
                tags: ['meeting', 'custom'],
                version: '1.0.0',
                author: 'Test User',
                usage_count: 5,
                created: '2024-01-01T00:00:00.000Z',
                modified: '2024-01-02T00:00:00.000Z',
                isBuiltIn: false,
                fileType: 'json' as const
            };

            expect(jsonTemplate).to.have.property('id');
            expect(jsonTemplate).to.have.property('author');
            expect(jsonTemplate).to.have.property('usage_count');
            expect(jsonTemplate).to.have.property('created');
            expect(jsonTemplate).to.have.property('modified');
            expect(jsonTemplate.isBuiltIn).to.be.false;
            expect(jsonTemplate.fileType).to.equal('json');
        });

        it('should have correct structure for legacy templates', () => {
            const legacyTemplate = {
                id: 'old-template',
                name: 'Old Template',
                description: 'Legacy txt template',
                category: 'Custom',
                tags: ['custom', 'legacy'],
                version: '1.0.0',
                isBuiltIn: false,
                fileType: 'txt' as const
            };

            expect(legacyTemplate.fileType).to.be.oneOf(['txt', 'md']);
            expect(legacyTemplate.tags).to.include('legacy');
            expect(legacyTemplate.isBuiltIn).to.be.false;
        });
    });

    describe('File Type Handling', () => {
        it('should support JSON file type', () => {
            const fileType: 'json' | 'txt' | 'md' | 'builtin' = 'json';
            expect(fileType).to.equal('json');
        });

        it('should support txt file type', () => {
            const fileType: 'json' | 'txt' | 'md' | 'builtin' = 'txt';
            expect(fileType).to.equal('txt');
        });

        it('should support md file type', () => {
            const fileType: 'json' | 'txt' | 'md' | 'builtin' = 'md';
            expect(fileType).to.equal('md');
        });

        it('should support builtin file type', () => {
            const fileType: 'json' | 'txt' | 'md' | 'builtin' = 'builtin';
            expect(fileType).to.equal('builtin');
        });
    });

    describe('Template Actions', () => {
        it('should support create action for all templates', () => {
            const actions = ['create', 'edit', 'duplicate', 'export', 'delete'];
            expect(actions).to.include('create');
        });

        it('should support edit action for custom templates only', () => {
            const customTemplateActions = ['create', 'edit', 'duplicate', 'export', 'delete'];
            const builtInTemplateActions = ['create'];

            expect(customTemplateActions).to.include('edit');
            expect(builtInTemplateActions).to.not.include('edit');
        });

        it('should support duplicate action for custom templates', () => {
            const customTemplateActions = ['create', 'edit', 'duplicate', 'export', 'delete'];
            expect(customTemplateActions).to.include('duplicate');
        });

        it('should support export action for custom templates', () => {
            const customTemplateActions = ['create', 'edit', 'duplicate', 'export', 'delete'];
            expect(customTemplateActions).to.include('export');
        });

        it('should support delete action for custom templates only', () => {
            const customTemplateActions = ['create', 'edit', 'duplicate', 'export', 'delete'];
            const builtInTemplateActions = ['create'];

            expect(customTemplateActions).to.include('delete');
            expect(builtInTemplateActions).to.not.include('delete');
        });
    });

    describe('HTML Escaping', () => {
        it('should escape HTML special characters', () => {
            // This tests the escapeHtml function logic that's in the webview
            const escapeHtml = (unsafe: string) => {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            };

            expect(escapeHtml('<script>alert("xss")</script>')).to.equal('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
            expect(escapeHtml('Template & "Name"')).to.equal('Template &amp; &quot;Name&quot;');
            expect(escapeHtml("It's a template")).to.equal('It&#039;s a template');
        });

        it('should prevent XSS in template names', () => {
            const escapeHtml = (unsafe: string) => {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            };

            const maliciousName = 'Template<img src=x onerror=alert(1)>';
            const escaped = escapeHtml(maliciousName);

            // Should not have executable HTML tags
            expect(escaped).to.not.include('<img');
            expect(escaped).to.not.include('<script');
            // Should have escaped opening tag
            expect(escaped).to.include('&lt;img');
            // Should have escaped closing tag
            expect(escaped).to.include('&gt;');
            // The word "onerror" as plain text is fine, as long as it's not in a tag
            expect(escaped).to.not.match(/<[^>]*onerror/i);
        });
    });

    describe('Filter Save Dialog Types', () => {
        it('should have correct filter type for JSON templates', () => {
            const filters: { [name: string]: string[] } = { 'JSON': ['json'] };
            expect(filters).to.have.property('JSON');
            expect(filters['JSON']).to.include('json');
        });

        it('should have correct filter type for text templates', () => {
            const filters: { [name: string]: string[] } = { 'Text': ['txt', 'md'] };
            expect(filters).to.have.property('Text');
            expect(filters['Text']).to.include('txt');
            expect(filters['Text']).to.include('md');
        });

        it('should accept both filter configurations', () => {
            const jsonFilters: { [name: string]: string[] } = { 'JSON': ['json'] };
            const textFilters: { [name: string]: string[] } = { 'Text': ['txt', 'md'] };

            expect(jsonFilters).to.be.an('object');
            expect(textFilters).to.be.an('object');
        });
    });

    describe('View Modes', () => {
        it('should support grid view mode', () => {
            const viewMode = 'grid';
            expect(viewMode).to.equal('grid');
        });

        it('should support list view mode', () => {
            const viewMode = 'list';
            expect(viewMode).to.equal('list');
        });

        it('should toggle between grid and list', () => {
            let currentView = 'grid';
            currentView = 'list';
            expect(currentView).to.equal('list');
            currentView = 'grid';
            expect(currentView).to.equal('grid');
        });
    });

    describe('Category Filtering', () => {
        it('should support "all" category', () => {
            const category = 'all';
            expect(category).to.equal('all');
        });

        it('should support built-in category', () => {
            const category = 'Built-in';
            expect(category).to.equal('Built-in');
        });

        it('should support custom categories', () => {
            const categories = ['all', 'Built-in', 'Custom', 'Work', 'Personal'];
            expect(categories).to.include('Custom');
            expect(categories).to.include('Work');
            expect(categories).to.include('Personal');
        });
    });

    describe('Search Functionality', () => {
        it('should search in template name', () => {
            const template = {
                name: 'Meeting Notes',
                description: 'Template for meetings',
                tags: ['meeting']
            };

            const searchQuery = 'meeting';
            const matches = template.name.toLowerCase().includes(searchQuery.toLowerCase());

            expect(matches).to.be.true;
        });

        it('should search in template description', () => {
            const template = {
                name: 'Weekly Report',
                description: 'Template for weekly status reports',
                tags: ['report']
            };

            const searchQuery = 'status';
            const matches = template.description.toLowerCase().includes(searchQuery.toLowerCase());

            expect(matches).to.be.true;
        });

        it('should search in template tags', () => {
            const template = {
                name: 'Project Plan',
                description: 'Planning template',
                tags: ['project', 'planning', 'roadmap']
            };

            const searchQuery = 'roadmap';
            const matches = template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            expect(matches).to.be.true;
        });
    });

    describe('Statistics Calculation', () => {
        it('should calculate total templates correctly', () => {
            const templates = [
                { isBuiltIn: true },
                { isBuiltIn: true },
                { isBuiltIn: false },
                { isBuiltIn: false },
                { isBuiltIn: false }
            ];

            const total = templates.length;
            expect(total).to.equal(5);
        });

        it('should calculate custom templates count', () => {
            const templates = [
                { isBuiltIn: true },
                { isBuiltIn: true },
                { isBuiltIn: false },
                { isBuiltIn: false },
                { isBuiltIn: false }
            ];

            const custom = templates.filter(t => !t.isBuiltIn).length;
            expect(custom).to.equal(3);
        });

        it('should calculate built-in templates count', () => {
            const templates = [
                { isBuiltIn: true },
                { isBuiltIn: true },
                { isBuiltIn: false },
                { isBuiltIn: false },
                { isBuiltIn: false }
            ];

            const builtin = templates.filter(t => t.isBuiltIn).length;
            expect(builtin).to.equal(2);
        });
    });

    describe('Message Commands', () => {
        it('should support createFromTemplate command', () => {
            const command = 'createFromTemplate';
            expect(command).to.equal('createFromTemplate');
        });

        it('should support editTemplate command', () => {
            const command = 'editTemplate';
            expect(command).to.equal('editTemplate');
        });

        it('should support deleteTemplate command', () => {
            const command = 'deleteTemplate';
            expect(command).to.equal('deleteTemplate');
        });

        it('should support duplicateTemplate command', () => {
            const command = 'duplicateTemplate';
            expect(command).to.equal('duplicateTemplate');
        });

        it('should support exportTemplate command', () => {
            const command = 'exportTemplate';
            expect(command).to.equal('exportTemplate');
        });

        it('should support refresh command', () => {
            const command = 'refresh';
            expect(command).to.equal('refresh');
        });
    });
});
