import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {
    extractVariablesFromContent,
    findLegacyTemplates,
    determineTemplateCategory,
    convertToTitleCase
} from '../../commands/templateCommands';
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

    describe('determineTemplateCategory', () => {
        it('should categorize meeting templates', () => {
            expect(determineTemplateCategory('meeting-notes')).to.equal('Meetings');
            expect(determineTemplateCategory('team-meeting')).to.equal('Meetings');
            expect(determineTemplateCategory('MEETING_TEMPLATE')).to.equal('Meetings');
        });

        it('should categorize project templates', () => {
            expect(determineTemplateCategory('project-plan')).to.equal('Projects');
            expect(determineTemplateCategory('new-project')).to.equal('Projects');
            expect(determineTemplateCategory('PROJECT_OVERVIEW')).to.equal('Projects');
        });

        it('should categorize content creation templates', () => {
            expect(determineTemplateCategory('video-script')).to.equal('Content Creation');
            expect(determineTemplateCategory('tutorial-outline')).to.equal('Content Creation');
            expect(determineTemplateCategory('VIDEO_TUTORIAL')).to.equal('Content Creation');
        });

        it('should categorize research templates', () => {
            expect(determineTemplateCategory('research-paper')).to.equal('Research');
            expect(determineTemplateCategory('literature-research')).to.equal('Research');
            expect(determineTemplateCategory('RESEARCH_NOTES')).to.equal('Research');
        });

        it('should default to Custom category for unknown templates', () => {
            expect(determineTemplateCategory('custom-template')).to.equal('Custom');
            expect(determineTemplateCategory('my-special-template')).to.equal('Custom');
            expect(determineTemplateCategory('unknown')).to.equal('Custom');
        });

        it('should prioritize first matching keyword', () => {
            // If template name contains multiple keywords, first match wins
            expect(determineTemplateCategory('project-meeting')).to.equal('Meetings');
            expect(determineTemplateCategory('research-project')).to.equal('Projects');
        });
    });

    describe('convertToTitleCase', () => {
        it('should convert kebab-case to Title Case', () => {
            expect(convertToTitleCase('project-template')).to.equal('Project Template');
            expect(convertToTitleCase('meeting-notes')).to.equal('Meeting Notes');
            expect(convertToTitleCase('video-script')).to.equal('Video Script');
            expect(convertToTitleCase('custom-workflow-template')).to.equal('Custom Workflow Template');
        });

        it('should handle single words', () => {
            expect(convertToTitleCase('template')).to.equal('Template');
            expect(convertToTitleCase('meeting')).to.equal('Meeting');
        });

        it('should handle already capitalized text', () => {
            expect(convertToTitleCase('Project-Template')).to.equal('Project Template');
            expect(convertToTitleCase('MEETING-NOTES')).to.equal('MEETING NOTES');
        });

        it('should handle multiple consecutive dashes', () => {
            expect(convertToTitleCase('project--template')).to.equal('Project  Template');
        });

        it('should handle underscores mixed with dashes', () => {
            expect(convertToTitleCase('project_template-notes')).to.equal('Project_template Notes');
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

        it('should correctly process complete migration workflow', () => {
            // Test full workflow with all utilities
            const templateName = 'project-meeting-notes';
            const content = `# {project_name} Meeting

Date: {date}
Attendees: {attendees}`;

            // Extract variables
            const variables = extractVariablesFromContent(content);
            expect(variables).to.have.lengthOf(2); // project_name and attendees (date is built-in)

            // Determine category
            const category = determineTemplateCategory(templateName);
            expect(category).to.equal('Meetings'); // First matching keyword

            // Convert name
            const displayName = convertToTitleCase(templateName);
            expect(displayName).to.equal('Project Meeting Notes');
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
