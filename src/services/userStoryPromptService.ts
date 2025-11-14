import * as vscode from 'vscode';

/**
 * User story prompt variables
 */
export interface UserStoryPromptVariables {
    description: string;
    additionalContext?: string;
}

/**
 * Service for managing user story generation prompts
 */
export class UserStoryPromptService {
    /**
     * Get the default user story generation prompt template
     */
    static getDefaultPrompt(): string {
        return `You are an expert user story generation assistant for agile software development with deep technical knowledge.

User wants to create a user story for: "{description}"{contextSection}

Generate a COMPREHENSIVE, TECHNICAL user story with:
1. A concise, specific story title
2. Scope statement (what part of the system/architecture this addresses)
3. User story description in format "As a [specific role], I want [specific goal], So that [measurable benefit]"
4. A comprehensive list of 5-15 SPECIFIC, TECHNICAL tasks needed to complete this story
   - Include configuration details, service names, integration points
   - Reference specific technologies/tools from the context
   - Break down complex steps into actionable items
5. A list of 3-7 SPECIFIC, TESTABLE acceptance criteria
   - Should reference architecture requirements or specifications
   - Must be measurable/verifiable
6. A list of dependencies (other stories, systems, access requirements, etc.)
7. A realistic time estimate (in hours or days)

Output format (JSON):
{
  "title": "Brief, specific title",
  "scope": "What part of the system/architecture this addresses",
  "user_type": "Specific role (e.g., Platform Engineer, DevOps Engineer, not just 'user')",
  "goal": "Specific, measurable goal with technical details",
  "benefit": "Clear, measurable benefit",
  "tasks": [
    "Task 1 - SPECIFIC technical step with service/tool names",
    "Task 2 - SPECIFIC configuration or setup step",
    "Task 3 - SPECIFIC integration or connectivity step",
    "... 5-15 tasks total based on complexity"
  ],
  "acceptance_criteria": [
    "Criterion 1 - SPECIFIC, testable outcome referencing architecture",
    "Criterion 2 - SPECIFIC connectivity or functionality verification",
    "Criterion 3 - SPECIFIC compliance or documentation requirement",
    "... 3-7 criteria total"
  ],
  "dependencies": [
    "Dependency 1 - Required access, subscriptions, or prerequisites",
    "Dependency 2 - Other systems or services that must exist first",
    "... list all blocking dependencies"
  ],
  "time_estimate": "X hours" or "X days"
}

RULES:
- Use SPECIFIC technical terms from the context/description
- For infrastructure tasks, include service names (VPC, Cloud NAT, Cloud Router, etc.)
- For integration tasks, specify both sides of the integration
- Tasks should be detailed enough for an engineer to execute without guesswork
- Acceptance criteria must be verifiable through testing or inspection
- Dependencies should list specific systems, access requirements, or prerequisite work
- If description mentions specific technologies, incorporate them into tasks
- Time estimates should reflect the number and complexity of tasks
- Prefer 8-12 tasks for complex infrastructure stories, 5-7 for simpler features
- All fields are required

Return ONLY valid JSON, no other text.`;
    }

    /**
     * Build user story prompt with variables replaced
     */
    static buildPrompt(variables: UserStoryPromptVariables): string {
        let prompt = this.getDefaultPrompt();

        // Build context section
        const contextSection = variables.additionalContext
            ? `\n\nADDITIONAL CONTEXT:\n${variables.additionalContext}\n`
            : '';

        // Replace variables
        prompt = prompt.replace('{description}', variables.description);
        prompt = prompt.replace('{contextSection}', contextSection);

        return prompt;
    }

    /**
     * Get prompt statistics (for debugging/testing)
     */
    static getPromptStats(): { length: number; lines: number; variables: string[] } {
        const prompt = this.getDefaultPrompt();
        const lines = prompt.split('\n').length;
        const variables = prompt.match(/\{(\w+)\}/g)?.map(v => v.slice(1, -1)) || [];

        return {
            length: prompt.length,
            lines,
            variables: Array.from(new Set(variables))
        };
    }

    /**
     * Validate user story response from AI
     */
    static validateResponse(response: any): boolean {
        const requiredFields = [
            'title',
            'scope',
            'user_type',
            'goal',
            'benefit',
            'tasks',
            'acceptance_criteria',
            'dependencies',
            'time_estimate'
        ];

        // Check all required fields exist
        for (const field of requiredFields) {
            if (!(field in response)) {
                return false;
            }
        }

        // Validate array fields have minimum length
        if (!Array.isArray(response.tasks) || response.tasks.length < 3) {
            return false;
        }

        if (!Array.isArray(response.acceptance_criteria) || response.acceptance_criteria.length < 2) {
            return false;
        }

        if (!Array.isArray(response.dependencies)) {
            return false;
        }

        return true;
    }
}
