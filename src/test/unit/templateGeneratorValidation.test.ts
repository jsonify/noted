import { expect } from 'chai';
import { templateGenerator } from '../../templates/TemplateGenerator';
import { TemplateVariable } from '../../templates/TemplateTypes';

describe('TemplateGenerator - Phase 3 Validation (Issue #110)', () => {
    describe('getReservedKeywords', () => {
        it('should return array of reserved keywords', () => {
            const keywords = templateGenerator.getReservedKeywords();

            expect(keywords).to.be.an('array');
            expect(keywords).to.include('class');
            expect(keywords).to.include('function');
            expect(keywords).to.include('if');
            expect(keywords).to.include('const');
            expect(keywords).to.include('filename'); // built-in variable
            expect(keywords).to.include('date'); // built-in variable
        });

        it('should include all JavaScript reserved words', () => {
            const keywords = templateGenerator.getReservedKeywords();

            expect(keywords).to.include('break');
            expect(keywords).to.include('return');
            expect(keywords).to.include('switch');
            expect(keywords).to.include('typeof');
        });
    });

    describe('detectCircularReference', () => {
        it('should detect circular reference in default value', () => {
            const variable: TemplateVariable = {
                name: 'project_name',
                type: 'string',
                default: 'Project: {project_name}'
            };

            const result = templateGenerator.detectCircularReference(variable);
            expect(result).to.be.true;
        });

        it('should not detect circular reference when default is clean', () => {
            const variable: TemplateVariable = {
                name: 'project_name',
                type: 'string',
                default: 'My Project'
            };

            const result = templateGenerator.detectCircularReference(variable);
            expect(result).to.be.false;
        });

        it('should not detect circular reference when default is not a string', () => {
            const variable: TemplateVariable = {
                name: 'count',
                type: 'number',
                default: 10
            };

            const result = templateGenerator.detectCircularReference(variable);
            expect(result).to.be.false;
        });
    });

    describe('getVariableUsageCount', () => {
        it('should count variable occurrences in template', () => {
            const template = 'Project: {project_name}\nAuthor: {author}\nProject: {project_name} again';

            const count = templateGenerator.getVariableUsageCount('project_name', template);
            expect(count).to.equal(2);
        });

        it('should return 0 for unused variable', () => {
            const template = 'Project: {project_name}\nAuthor: {author}';

            const count = templateGenerator.getVariableUsageCount('unused_var', template);
            expect(count).to.equal(0);
        });

        it('should handle template with no variables', () => {
            const template = 'This is a static template';

            const count = templateGenerator.getVariableUsageCount('project_name', template);
            expect(count).to.equal(0);
        });
    });

    describe('findUnusedVariables', () => {
        it('should find variables that are defined but not used', () => {
            const variables: TemplateVariable[] = [
                { name: 'project_name', type: 'string' },
                { name: 'author', type: 'string' },
                { name: 'unused_var', type: 'string' }
            ];
            const template = 'Project: {project_name}\nAuthor: {author}';

            const unused = templateGenerator.findUnusedVariables(variables, template);

            expect(unused).to.be.an('array');
            expect(unused).to.have.lengthOf(1);
            expect(unused).to.include('unused_var');
        });

        it('should return empty array when all variables are used', () => {
            const variables: TemplateVariable[] = [
                { name: 'project_name', type: 'string' },
                { name: 'author', type: 'string' }
            ];
            const template = 'Project: {project_name}\nAuthor: {author}';

            const unused = templateGenerator.findUnusedVariables(variables, template);

            expect(unused).to.be.an('array');
            expect(unused).to.have.lengthOf(0);
        });
    });

    describe('findUndefinedVariables', () => {
        it('should find variables used in template but not defined', () => {
            const variables: TemplateVariable[] = [
                { name: 'project_name', type: 'string' }
            ];
            const template = 'Project: {project_name}\nAuthor: {author}\nDate: {date}';

            const undefined = templateGenerator.findUndefinedVariables(template, variables);

            expect(undefined).to.be.an('array');
            expect(undefined).to.include('author');
            expect(undefined).to.not.include('date'); // date is built-in
            expect(undefined).to.not.include('project_name'); // project_name is defined
        });

        it('should return empty array when all used variables are defined', () => {
            const variables: TemplateVariable[] = [
                { name: 'project_name', type: 'string' },
                { name: 'author', type: 'string' }
            ];
            const template = 'Project: {project_name}\nAuthor: {author}\nDate: {date}';

            const undefined = templateGenerator.findUndefinedVariables(template, variables);

            expect(undefined).to.be.an('array');
            expect(undefined).to.have.lengthOf(0);
        });

        it('should handle built-in variables correctly', () => {
            const variables: TemplateVariable[] = [];
            const template = 'File: {filename}\nDate: {date}\nTime: {time}\nUser: {user}';

            const undefined = templateGenerator.findUndefinedVariables(template, variables);

            // All are built-in, so should be empty
            expect(undefined).to.be.an('array');
            expect(undefined).to.have.lengthOf(0);
        });
    });

    describe('validateVariableAdvanced', () => {
        it('should reject reserved keywords', () => {
            const variable: TemplateVariable = {
                name: 'class',
                type: 'string'
            };
            const template = 'Template: {class}';

            const result = templateGenerator.validateVariableAdvanced(variable, template, []);

            expect(result.isValid).to.be.false;
            expect(result.errors).to.have.lengthOf.at.least(1);
            expect(result.errors.some(e => e.includes('reserved keyword'))).to.be.true;
        });

        it('should detect circular references', () => {
            const variable: TemplateVariable = {
                name: 'project_name',
                type: 'string',
                default: 'Project: {project_name}'
            };
            const template = 'Name: {project_name}';

            const result = templateGenerator.validateVariableAdvanced(variable, template, []);

            expect(result.isValid).to.be.false;
            expect(result.errors).to.have.lengthOf.at.least(1);
            expect(result.errors.some(e => e.includes('circular reference'))).to.be.true;
        });

        it('should warn about unused variables', () => {
            const variable: TemplateVariable = {
                name: 'unused_var',
                type: 'string'
            };
            const template = 'No variables here';

            const result = templateGenerator.validateVariableAdvanced(variable, template, []);

            expect(result.warnings).to.have.lengthOf.at.least(1);
            expect(result.warnings.some(w => w.includes('not used'))).to.be.true;
        });

        it('should validate enum type requires values', () => {
            const variable: TemplateVariable = {
                name: 'status',
                type: 'enum'
                // Missing values array
            };
            const template = 'Status: {status}';

            const result = templateGenerator.validateVariableAdvanced(variable, template, []);

            expect(result.isValid).to.be.false;
            expect(result.errors).to.have.lengthOf.at.least(1);
            expect(result.errors.some(e => e.includes('Enum'))).to.be.true;
        });

        it('should validate number min/max constraints', () => {
            const variable: TemplateVariable = {
                name: 'count',
                type: 'number',
                validation: {
                    min: 100,
                    max: 10  // max < min
                }
            };
            const template = 'Count: {count}';

            const result = templateGenerator.validateVariableAdvanced(variable, template, []);

            expect(result.isValid).to.be.false;
            expect(result.errors).to.have.lengthOf.at.least(1);
            expect(result.errors.some(e => e.includes('Minimum') || e.includes('maximum'))).to.be.true;
        });

        it('should validate date pattern is valid regex', () => {
            const variable: TemplateVariable = {
                name: 'date_field',
                type: 'date',
                validation: {
                    pattern: '[invalid regex('
                }
            };
            const template = 'Date: {date_field}';

            const result = templateGenerator.validateVariableAdvanced(variable, template, []);

            expect(result.isValid).to.be.false;
            expect(result.errors).to.have.lengthOf.at.least(1);
            expect(result.errors.some(e => e.includes('regular expression'))).to.be.true;
        });

        it('should pass validation for well-formed variable', () => {
            const variable: TemplateVariable = {
                name: 'project_name',
                type: 'string',
                default: 'My Project'
            };
            const template = 'Project: {project_name}';

            const result = templateGenerator.validateVariableAdvanced(variable, template, []);

            expect(result.isValid).to.be.true;
            expect(result.errors).to.have.lengthOf(0);
        });
    });

    describe('getVariableUsagePositions', () => {
        it('should find all usage positions with context', () => {
            const template = 'Line 1: {project_name}\nLine 2: Static\nLine 3: {project_name} again';

            const positions = templateGenerator.getVariableUsagePositions('project_name', template);

            expect(positions).to.be.an('array');
            expect(positions).to.have.lengthOf(2);
            expect(positions[0].line).to.equal(1);
            expect(positions[0].context).to.include('Line 1');
            expect(positions[1].line).to.equal(3);
            expect(positions[1].context).to.include('Line 3');
        });

        it('should return empty array for unused variable', () => {
            const template = 'Line 1: {project_name}\nLine 2: Static';

            const positions = templateGenerator.getVariableUsagePositions('unused_var', template);

            expect(positions).to.be.an('array');
            expect(positions).to.have.lengthOf(0);
        });

        it('should handle multiple occurrences on same line', () => {
            const template = 'Project {project_name} is called {project_name}';

            const positions = templateGenerator.getVariableUsagePositions('project_name', template);

            expect(positions).to.be.an('array');
            expect(positions).to.have.lengthOf(2);
            expect(positions[0].line).to.equal(1);
            expect(positions[1].line).to.equal(1);
        });
    });
});
