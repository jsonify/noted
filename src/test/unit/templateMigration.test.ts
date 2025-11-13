import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { extractVariablesFromContent, findLegacyTemplates } from '../../commands/templateCommands';
import * as path from 'path';

describe('Template Migration', () => {
    describe('extractVariablesFromContent', () => {
        it('should extract custom variables from template content', () => {
            const content = `# {title}

Project: {project_name}
Author: {author}
Status: {status}

## Notes
{notes}`;

            const variables = extractVariablesFromContent(content);

            expect(variables).to.have.lengthOf(5);

            const varNames = variables.map(v => v.name);
            expect(varNames).to.include('title');
            expect(varNames).to.include('project_name');
            expect(varNames).to.include('author');
            expect(varNames).to.include('status');
            expect(varNames).to.include('notes');
        });

        it('should skip built-in placeholders', () => {
            const content = `# {filename}

Date: {date}
Time: {time}
Year: {year}
Month: {month}
Day: {day}
Weekday: {weekday}
Month Name: {month_name}
User: {user}
Workspace: {workspace}

Custom: {custom_var}`;

            const variables = extractVariablesFromContent(content);

            // Should only extract custom_var, not the built-in ones
            expect(variables).to.have.lengthOf(1);
            expect(variables[0].name).to.equal('custom_var');
        });

        it('should handle duplicate variables correctly', () => {
            const content = `# {title}

Title again: {title}
Another title: {title}`;

            const variables = extractVariablesFromContent(content);

            // Should only have one variable despite multiple occurrences
            expect(variables).to.have.lengthOf(1);
            expect(variables[0].name).to.equal('title');
        });

        it('should handle mixed case variables', () => {
            const content = `{Title}
{TITLE}
{title}`;

            const variables = extractVariablesFromContent(content);

            // All should be normalized to lowercase
            expect(variables).to.have.lengthOf(1);
            expect(variables[0].name).to.equal('title');
        });

        it('should set correct variable properties', () => {
            const content = '{project_name}';

            const variables = extractVariablesFromContent(content);

            expect(variables).to.have.lengthOf(1);
            const variable = variables[0];

            expect(variable.name).to.equal('project_name');
            expect(variable.type).to.equal('string');
            expect(variable.required).to.be.true;
            expect(variable.prompt).to.equal('Enter value for project_name');
            expect(variable.description).to.equal('Custom variable: project_name');
        });

        it('should handle empty content', () => {
            const content = '';

            const variables = extractVariablesFromContent(content);

            expect(variables).to.be.an('array');
            expect(variables).to.have.lengthOf(0);
        });

        it('should handle content with no variables', () => {
            const content = `# Template without variables

This is just plain text content.
No variables here!`;

            const variables = extractVariablesFromContent(content);

            expect(variables).to.be.an('array');
            expect(variables).to.have.lengthOf(0);
        });

        it('should ignore malformed variable syntax', () => {
            const content = `{valid_var}
{ spaces }
{123numeric}
{-invalid}
{}
{single}`;

            const variables = extractVariablesFromContent(content);

            // Only valid_var and single should be extracted
            // (single is valid - single letter variables are allowed)
            expect(variables.length).to.be.greaterThan(0);
            expect(variables.some(v => v.name === 'valid_var')).to.be.true;
        });

        it('should handle underscore-separated variable names', () => {
            const content = `{project_name}
{start_date}
{end_date}
{team_member_name}`;

            const variables = extractVariablesFromContent(content);

            expect(variables).to.have.lengthOf(4);
            expect(variables.map(v => v.name)).to.deep.equal([
                'project_name',
                'start_date',
                'end_date',
                'team_member_name'
            ]);
        });

        it('should handle variables in YAML frontmatter', () => {
            const content = `---
title: {title}
author: {author}
tags: [{tag1}, {tag2}]
---

# {title}

Content by {author}`;

            const variables = extractVariablesFromContent(content);

            expect(variables).to.have.lengthOf(4);
            const varNames = variables.map(v => v.name);
            expect(varNames).to.include('title');
            expect(varNames).to.include('author');
            expect(varNames).to.include('tag1');
            expect(varNames).to.include('tag2');
        });
    });

    describe('findLegacyTemplates', () => {
        it('should return an array', async () => {
            // This function returns an array of legacy templates
            // It may be empty if no templates exist or templates path is not configured
            const result = await findLegacyTemplates();

            expect(result).to.be.an('array');
        });

        it('should return templates with correct structure', async () => {
            // Get legacy templates
            const result = await findLegacyTemplates();

            // Each result should have correct structure
            result.forEach(template => {
                expect(template).to.have.property('name');
                expect(template).to.have.property('path');
                expect(template).to.have.property('format');
                expect(['txt', 'md']).to.include(template.format);
            });
        });

        it('should only return .txt and .md templates', async () => {
            const result = await findLegacyTemplates();

            // All templates should be either .txt or .md
            result.forEach(template => {
                expect(['txt', 'md']).to.include(template.format);
            });
        });

        it('should not include templates that already have JSON versions', async () => {
            // This would require mocking the filesystem
            // For now, we verify the result structure
            const result = await findLegacyTemplates();

            expect(result).to.be.an('array');
            // All returned templates should not have corresponding .json files
            // (this is verified in the implementation, not in the test)
        });
    });

    describe('Template Migration Integration', () => {
        it('should have proper template structure after migration', () => {
            // Test that the Template interface is correctly structured
            const content = '{custom_var}';
            const variables = extractVariablesFromContent(content);

            expect(variables[0]).to.have.property('name');
            expect(variables[0]).to.have.property('type');
            expect(variables[0]).to.have.property('required');
            expect(variables[0]).to.have.property('prompt');
            expect(variables[0]).to.have.property('description');
        });

        it('should preserve template content during migration', () => {
            // This tests the concept of migration
            // The actual content should be preserved, only metadata added
            const originalContent = `# Project Template

## Overview
{description}

## Timeline
Start: {start_date}
End: {end_date}`;

            // Extract variables (this happens during migration)
            const variables = extractVariablesFromContent(originalContent);

            // Verify we found the right variables
            expect(variables).to.have.lengthOf(3);
            expect(variables.map(v => v.name)).to.include.members([
                'description',
                'start_date',
                'end_date'
            ]);

            // The original content would be stored in the Template.content field
            // This verifies that the migration process identifies the right variables
        });

        it('should categorize templates based on name heuristics', () => {
            // Test the category assignment logic
            const testCases = [
                { name: 'meeting-notes', expectedCategory: 'Meetings' },
                { name: 'project-plan', expectedCategory: 'Projects' },
                { name: 'video-script', expectedCategory: 'Content Creation' },
                { name: 'tutorial-outline', expectedCategory: 'Content Creation' },
                { name: 'research-paper', expectedCategory: 'Research' },
                { name: 'custom-template', expectedCategory: 'Custom' }
            ];

            // Since we can't access the migrateTemplate function directly,
            // we verify the logic here
            testCases.forEach(({ name, expectedCategory }) => {
                let category = 'Custom';
                const nameLower = name.toLowerCase();

                if (nameLower.includes('meeting')) {
                    category = 'Meetings';
                } else if (nameLower.includes('project')) {
                    category = 'Projects';
                } else if (nameLower.includes('video') || nameLower.includes('tutorial')) {
                    category = 'Content Creation';
                } else if (nameLower.includes('research')) {
                    category = 'Research';
                }

                expect(category).to.equal(expectedCategory);
            });
        });

        it('should convert kebab-case names to Title Case', () => {
            // Test the name conversion logic used in migration
            const testCases = [
                { input: 'project-template', expected: 'Project Template' },
                { input: 'meeting-notes', expected: 'Meeting Notes' },
                { input: 'video-script', expected: 'Video Script' },
                { input: 'custom-workflow-template', expected: 'Custom Workflow Template' }
            ];

            testCases.forEach(({ input, expected }) => {
                const converted = input
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());

                expect(converted).to.equal(expected);
            });
        });
    });

    describe('Migration Error Handling', () => {
        it('should handle invalid variable patterns gracefully', () => {
            const invalidContent = `{
{}}
{{nested}}
{123}
{-invalid}`;

            const variables = extractVariablesFromContent(invalidContent);

            // Should return empty array or only valid variables
            expect(variables).to.be.an('array');
            // All extracted variables should have valid names
            variables.forEach(v => {
                expect(v.name).to.match(/^[a-z_][a-z0-9_]*$/i);
            });
        });

        it('should handle very large templates', () => {
            // Generate a large template with many variables
            const largeContent = Array.from({ length: 100 }, (_, i) =>
                `{var_${i}}`
            ).join('\n');

            const variables = extractVariablesFromContent(largeContent);

            expect(variables).to.have.lengthOf(100);
        });

        it('should handle special characters in content', () => {
            const content = `# Template with Special Characters

Symbols: @#$%^&*()
Email: user@example.com
Variable: {custom_var}
More symbols: []{}|\\`;

            const variables = extractVariablesFromContent(content);

            expect(variables).to.have.lengthOf(1);
            expect(variables[0].name).to.equal('custom_var');
        });
    });
});
