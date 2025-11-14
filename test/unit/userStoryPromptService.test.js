"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const userStoryPromptService_1 = require("../../src/services/userStoryPromptService");
(0, mocha_1.describe)('UserStoryPromptService', () => {
    (0, mocha_1.describe)('getDefaultPrompt', () => {
        (0, mocha_1.it)('should return a string prompt', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.getDefaultPrompt();
            (0, chai_1.expect)(prompt).to.be.a('string');
            (0, chai_1.expect)(prompt.length).to.be.greaterThan(0);
        });
        (0, mocha_1.it)('should contain required placeholders', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.getDefaultPrompt();
            (0, chai_1.expect)(prompt).to.include('{description}');
            (0, chai_1.expect)(prompt).to.include('{contextSection}');
        });
        (0, mocha_1.it)('should contain user story structure instructions', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.getDefaultPrompt();
            (0, chai_1.expect)(prompt).to.include('As a [specific role]');
            (0, chai_1.expect)(prompt).to.include('I want [specific goal]');
            (0, chai_1.expect)(prompt).to.include('So that [measurable benefit]');
        });
        (0, mocha_1.it)('should specify JSON output format', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.getDefaultPrompt();
            (0, chai_1.expect)(prompt).to.include('Output format (JSON)');
            (0, chai_1.expect)(prompt).to.include('Return ONLY valid JSON');
        });
    });
    (0, mocha_1.describe)('buildPrompt', () => {
        (0, mocha_1.it)('should replace description placeholder', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.buildPrompt({
                description: 'Create authentication system'
            });
            (0, chai_1.expect)(prompt).to.include('Create authentication system');
            (0, chai_1.expect)(prompt).to.not.include('{description}');
        });
        (0, mocha_1.it)('should handle context when provided', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.buildPrompt({
                description: 'Setup GCP project',
                additionalContext: 'Uses Terraform, requires VPC and GKE'
            });
            (0, chai_1.expect)(prompt).to.include('Setup GCP project');
            (0, chai_1.expect)(prompt).to.include('ADDITIONAL CONTEXT');
            (0, chai_1.expect)(prompt).to.include('Uses Terraform, requires VPC and GKE');
        });
        (0, mocha_1.it)('should handle no context gracefully', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.buildPrompt({
                description: 'Add logging'
            });
            (0, chai_1.expect)(prompt).to.include('Add logging');
            (0, chai_1.expect)(prompt).to.not.include('ADDITIONAL CONTEXT');
            (0, chai_1.expect)(prompt).to.not.include('{contextSection}');
        });
        (0, mocha_1.it)('should handle undefined context', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.buildPrompt({
                description: 'Fix bug',
                additionalContext: undefined
            });
            (0, chai_1.expect)(prompt).to.include('Fix bug');
            (0, chai_1.expect)(prompt).to.not.include('ADDITIONAL CONTEXT');
        });
        (0, mocha_1.it)('should handle empty string context', () => {
            const prompt = userStoryPromptService_1.UserStoryPromptService.buildPrompt({
                description: 'Deploy service',
                additionalContext: ''
            });
            (0, chai_1.expect)(prompt).to.include('Deploy service');
            (0, chai_1.expect)(prompt).to.not.include('ADDITIONAL CONTEXT');
        });
    });
    (0, mocha_1.describe)('getPromptStats', () => {
        (0, mocha_1.it)('should return prompt statistics', () => {
            const stats = userStoryPromptService_1.UserStoryPromptService.getPromptStats();
            (0, chai_1.expect)(stats).to.have.property('length');
            (0, chai_1.expect)(stats).to.have.property('lines');
            (0, chai_1.expect)(stats).to.have.property('variables');
        });
        (0, mocha_1.it)('should have non-zero length', () => {
            const stats = userStoryPromptService_1.UserStoryPromptService.getPromptStats();
            (0, chai_1.expect)(stats.length).to.be.greaterThan(1000); // Prompt is substantial
        });
        (0, mocha_1.it)('should have multiple lines', () => {
            const stats = userStoryPromptService_1.UserStoryPromptService.getPromptStats();
            (0, chai_1.expect)(stats.lines).to.be.greaterThan(50); // Multi-line prompt
        });
        (0, mocha_1.it)('should detect variables', () => {
            const stats = userStoryPromptService_1.UserStoryPromptService.getPromptStats();
            (0, chai_1.expect)(stats.variables).to.be.an('array');
            (0, chai_1.expect)(stats.variables).to.include('description');
            (0, chai_1.expect)(stats.variables).to.include('contextSection');
        });
    });
    (0, mocha_1.describe)('validateResponse', () => {
        const validResponse = {
            title: 'Setup Authentication',
            scope: 'User management system',
            user_type: 'Backend Engineer',
            goal: 'Implement OAuth2 authentication',
            benefit: 'Secure user login',
            tasks: [
                'Configure OAuth2 provider',
                'Implement token validation',
                'Add user session management'
            ],
            acceptance_criteria: [
                'Users can login with OAuth2',
                'Tokens expire after 1 hour'
            ],
            dependencies: [
                'OAuth2 provider credentials'
            ],
            time_estimate: '2 days'
        };
        (0, mocha_1.it)('should validate complete response', () => {
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(validResponse);
            (0, chai_1.expect)(result).to.be.true;
        });
        (0, mocha_1.it)('should reject response missing title', () => {
            const { title, ...incomplete } = validResponse;
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(incomplete);
            (0, chai_1.expect)(result).to.be.false;
        });
        (0, mocha_1.it)('should reject response missing scope', () => {
            const { scope, ...incomplete } = validResponse;
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(incomplete);
            (0, chai_1.expect)(result).to.be.false;
        });
        (0, mocha_1.it)('should reject response with insufficient tasks', () => {
            const response = {
                ...validResponse,
                tasks: ['One task', 'Two tasks'] // Less than 3
            };
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(response);
            (0, chai_1.expect)(result).to.be.false;
        });
        (0, mocha_1.it)('should reject response with insufficient acceptance criteria', () => {
            const response = {
                ...validResponse,
                acceptance_criteria: ['Only one criterion'] // Less than 2
            };
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(response);
            (0, chai_1.expect)(result).to.be.false;
        });
        (0, mocha_1.it)('should reject response with non-array tasks', () => {
            const response = {
                ...validResponse,
                tasks: 'Not an array'
            };
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(response);
            (0, chai_1.expect)(result).to.be.false;
        });
        (0, mocha_1.it)('should reject response with non-array acceptance_criteria', () => {
            const response = {
                ...validResponse,
                acceptance_criteria: 'Not an array'
            };
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(response);
            (0, chai_1.expect)(result).to.be.false;
        });
        (0, mocha_1.it)('should reject response with non-array dependencies', () => {
            const response = {
                ...validResponse,
                dependencies: 'Not an array'
            };
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(response);
            (0, chai_1.expect)(result).to.be.false;
        });
        (0, mocha_1.it)('should accept empty dependencies array', () => {
            const response = {
                ...validResponse,
                dependencies: []
            };
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(response);
            (0, chai_1.expect)(result).to.be.true;
        });
        (0, mocha_1.it)('should accept minimum valid response', () => {
            const response = {
                title: 'Title',
                scope: 'Scope',
                user_type: 'Engineer',
                goal: 'Goal',
                benefit: 'Benefit',
                tasks: ['Task 1', 'Task 2', 'Task 3'],
                acceptance_criteria: ['Criterion 1', 'Criterion 2'],
                dependencies: [],
                time_estimate: '1 day'
            };
            const result = userStoryPromptService_1.UserStoryPromptService.validateResponse(response);
            (0, chai_1.expect)(result).to.be.true;
        });
    });
});
//# sourceMappingURL=userStoryPromptService.test.js.map