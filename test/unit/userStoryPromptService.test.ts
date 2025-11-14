import { describe, it } from 'mocha';
import { expect } from 'chai';
import { UserStoryPromptService } from '../../src/services/userStoryPromptService';

describe('UserStoryPromptService', () => {
    describe('getDefaultPrompt', () => {
        it('should return a string prompt', () => {
            const prompt = UserStoryPromptService.getDefaultPrompt();
            expect(prompt).to.be.a('string');
            expect(prompt.length).to.be.greaterThan(0);
        });

        it('should contain required placeholders', () => {
            const prompt = UserStoryPromptService.getDefaultPrompt();
            expect(prompt).to.include('{description}');
            expect(prompt).to.include('{contextSection}');
        });

        it('should contain user story structure instructions', () => {
            const prompt = UserStoryPromptService.getDefaultPrompt();
            expect(prompt).to.include('As a [specific role]');
            expect(prompt).to.include('I want [specific goal]');
            expect(prompt).to.include('So that [measurable benefit]');
        });

        it('should specify JSON output format', () => {
            const prompt = UserStoryPromptService.getDefaultPrompt();
            expect(prompt).to.include('Output format (JSON)');
            expect(prompt).to.include('Return ONLY valid JSON');
        });
    });

    describe('buildPrompt', () => {
        it('should replace description placeholder', () => {
            const prompt = UserStoryPromptService.buildPrompt({
                description: 'Create authentication system'
            });

            expect(prompt).to.include('Create authentication system');
            expect(prompt).to.not.include('{description}');
        });

        it('should handle context when provided', () => {
            const prompt = UserStoryPromptService.buildPrompt({
                description: 'Setup GCP project',
                additionalContext: 'Uses Terraform, requires VPC and GKE'
            });

            expect(prompt).to.include('Setup GCP project');
            expect(prompt).to.include('ADDITIONAL CONTEXT');
            expect(prompt).to.include('Uses Terraform, requires VPC and GKE');
        });

        it('should handle no context gracefully', () => {
            const prompt = UserStoryPromptService.buildPrompt({
                description: 'Add logging'
            });

            expect(prompt).to.include('Add logging');
            expect(prompt).to.not.include('ADDITIONAL CONTEXT');
            expect(prompt).to.not.include('{contextSection}');
        });

        it('should handle undefined context', () => {
            const prompt = UserStoryPromptService.buildPrompt({
                description: 'Fix bug',
                additionalContext: undefined
            });

            expect(prompt).to.include('Fix bug');
            expect(prompt).to.not.include('ADDITIONAL CONTEXT');
        });

        it('should handle empty string context', () => {
            const prompt = UserStoryPromptService.buildPrompt({
                description: 'Deploy service',
                additionalContext: ''
            });

            expect(prompt).to.include('Deploy service');
            expect(prompt).to.not.include('ADDITIONAL CONTEXT');
        });
    });

    describe('getPromptStats', () => {
        it('should return prompt statistics', () => {
            const stats = UserStoryPromptService.getPromptStats();

            expect(stats).to.have.property('length');
            expect(stats).to.have.property('lines');
            expect(stats).to.have.property('variables');
        });

        it('should have non-zero length', () => {
            const stats = UserStoryPromptService.getPromptStats();
            expect(stats.length).to.be.greaterThan(1000); // Prompt is substantial
        });

        it('should have multiple lines', () => {
            const stats = UserStoryPromptService.getPromptStats();
            expect(stats.lines).to.be.greaterThan(50); // Multi-line prompt
        });

        it('should detect variables', () => {
            const stats = UserStoryPromptService.getPromptStats();
            expect(stats.variables).to.be.an('array');
            expect(stats.variables).to.include('description');
            expect(stats.variables).to.include('contextSection');
        });
    });

    describe('validateResponse', () => {
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

        it('should validate complete response', () => {
            const result = UserStoryPromptService.validateResponse(validResponse);
            expect(result).to.be.true;
        });

        it('should reject response missing title', () => {
            const { title, ...incomplete } = validResponse;
            const result = UserStoryPromptService.validateResponse(incomplete);
            expect(result).to.be.false;
        });

        it('should reject response missing scope', () => {
            const { scope, ...incomplete } = validResponse;
            const result = UserStoryPromptService.validateResponse(incomplete);
            expect(result).to.be.false;
        });

        it('should reject response with insufficient tasks', () => {
            const response = {
                ...validResponse,
                tasks: ['One task', 'Two tasks'] // Less than 3
            };
            const result = UserStoryPromptService.validateResponse(response);
            expect(result).to.be.false;
        });

        it('should reject response with insufficient acceptance criteria', () => {
            const response = {
                ...validResponse,
                acceptance_criteria: ['Only one criterion'] // Less than 2
            };
            const result = UserStoryPromptService.validateResponse(response);
            expect(result).to.be.false;
        });

        it('should reject response with non-array tasks', () => {
            const response = {
                ...validResponse,
                tasks: 'Not an array'
            };
            const result = UserStoryPromptService.validateResponse(response);
            expect(result).to.be.false;
        });

        it('should reject response with non-array acceptance_criteria', () => {
            const response = {
                ...validResponse,
                acceptance_criteria: 'Not an array'
            };
            const result = UserStoryPromptService.validateResponse(response);
            expect(result).to.be.false;
        });

        it('should reject response with non-array dependencies', () => {
            const response = {
                ...validResponse,
                dependencies: 'Not an array'
            };
            const result = UserStoryPromptService.validateResponse(response);
            expect(result).to.be.false;
        });

        it('should accept empty dependencies array', () => {
            const response = {
                ...validResponse,
                dependencies: []
            };
            const result = UserStoryPromptService.validateResponse(response);
            expect(result).to.be.true;
        });

        it('should accept minimum valid response', () => {
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
            const result = UserStoryPromptService.validateResponse(response);
            expect(result).to.be.true;
        });
    });
});
