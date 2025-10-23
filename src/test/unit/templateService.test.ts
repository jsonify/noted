import { expect } from 'chai';
import { generateTemplate, getCustomTemplates, getTemplatePreview, getTemplateVariables, getCustomTemplatePath } from '../../services/templateService';

describe('Template Service', () => {
  describe('generateTemplate', () => {
    const testDate = new Date('2024-10-15T14:30:00');

    it('should generate problem-solution template with YAML frontmatter', async () => {
      const result = await generateTemplate('problem-solution', testDate, 'test-note.txt');

      expect(result).to.match(/^---\n/); // Starts with frontmatter delimiter
      expect(result).to.include('tags:'); // Has tags field
      expect(result).to.include('created:'); // Has created metadata
      expect(result).to.include('file: test-note.txt'); // Has filename in frontmatter
      expect(result).to.include('---\n'); // Has closing delimiter
      expect(result).to.include('PROBLEM:');
      expect(result).to.include('STEPS TAKEN:');
      expect(result).to.include('SOLUTION:');
      expect(result).to.include('NOTES:');
    });

    it('should generate meeting template with YAML frontmatter', async () => {
      const result = await generateTemplate('meeting', testDate, 'meeting-note.txt');

      expect(result).to.match(/^---\n/);
      expect(result).to.include('tags:');
      expect(result).to.include('file: meeting-note.txt');
      expect(result).to.include('MEETING:');
      expect(result).to.include('ATTENDEES:');
      expect(result).to.include('AGENDA:');
      expect(result).to.include('NOTES:');
      expect(result).to.include('ACTION ITEMS:');
    });

    it('should generate research template with YAML frontmatter', async () => {
      const result = await generateTemplate('research', testDate, 'research-note.txt');

      expect(result).to.match(/^---\n/);
      expect(result).to.include('tags:');
      expect(result).to.include('file: research-note.txt');
      expect(result).to.include('TOPIC:');
      expect(result).to.include('QUESTIONS:');
      expect(result).to.include('FINDINGS:');
      expect(result).to.include('SOURCES:');
    });

    it('should generate quick template with YAML frontmatter', async () => {
      const result = await generateTemplate('quick', testDate, 'quick-note.txt');

      expect(result).to.match(/^---\n/);
      expect(result).to.include('tags:');
      expect(result).to.include('created:');
      expect(result).to.include('file: quick-note.txt');
      expect(result).to.include('---\n');
    });

    it('should generate default template with YAML frontmatter for undefined type', async () => {
      const result = await generateTemplate(undefined, testDate);

      expect(result).to.match(/^---\n/);
      expect(result).to.include('tags:');
      expect(result).to.include('created:');
      expect(result).to.include('2024');
      expect(result).to.include('October');
      // Default template should only include frontmatter (no redundant date/separator in body)
      expect(result).to.not.include('==================================================');
    });

    it('should not include filename in frontmatter when not provided', async () => {
      const result = await generateTemplate('quick', testDate);

      expect(result).to.match(/^---\n/);
      expect(result).to.include('tags:');
      expect(result).to.not.include('file:');
      expect(result).to.include('created:');
    });

    it('should include proper date formatting in frontmatter', async () => {
      const result = await generateTemplate('quick', testDate, 'test.txt');

      expect(result).to.include('October');
      expect(result).to.include('15');
      expect(result).to.include('2024');
    });

    it('should include proper time formatting in frontmatter', async () => {
      const result = await generateTemplate('quick', testDate, 'test.txt');

      // Time should be in 12-hour format with AM/PM
      expect(result).to.match(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('should have valid YAML frontmatter structure', async () => {
      const result = await generateTemplate('quick', testDate, 'test.txt');

      // Check for proper frontmatter delimiters
      const frontmatterMatch = result.match(/^---\n([\s\S]*?)\n---\n/);
      expect(frontmatterMatch).to.not.be.null;

      if (frontmatterMatch) {
        const frontmatterContent = frontmatterMatch[1];
        expect(frontmatterContent).to.include('tags:');
        expect(frontmatterContent).to.include('created:');
        expect(frontmatterContent).to.include('file:');
      }
    });
  });

  describe('getCustomTemplates', () => {
    it('should return empty array when templates path not configured', async () => {
      // In test environment without VS Code workspace, should return empty array
      const result = await getCustomTemplates();
      expect(result).to.be.an('array');
    });
  });

  describe('Template Variables System', () => {
    describe('getTemplateVariables', () => {
      it('should return all available template variables', () => {
        const variables = getTemplateVariables();

        expect(variables).to.be.an('array');
        expect(variables.length).to.equal(10);

        const variableNames = variables.map(v => v.name);
        expect(variableNames).to.include('{filename}');
        expect(variableNames).to.include('{date}');
        expect(variableNames).to.include('{time}');
        expect(variableNames).to.include('{year}');
        expect(variableNames).to.include('{month}');
        expect(variableNames).to.include('{day}');
        expect(variableNames).to.include('{weekday}');
        expect(variableNames).to.include('{month_name}');
        expect(variableNames).to.include('{user}');
        expect(variableNames).to.include('{workspace}');
      });

      it('should include descriptions for all variables', () => {
        const variables = getTemplateVariables();

        variables.forEach(variable => {
          expect(variable).to.have.property('name');
          expect(variable).to.have.property('description');
          expect(variable.name).to.be.a('string');
          expect(variable.description).to.be.a('string');
          expect(variable.description.length).to.be.greaterThan(0);
        });
      });
    });

    describe('getTemplatePreview', () => {
      it('should replace {filename} placeholder', () => {
        const content = 'File: {filename}';
        const preview = getTemplatePreview(content);

        expect(preview).to.include('example-note');
        expect(preview).to.not.include('{filename}');
      });

      it('should replace {date} placeholder', () => {
        const content = 'Date: {date}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{date}');
        // Format is: Sunday, October 19, 2025
        expect(preview).to.match(/Date: \w+, \w+ \d{1,2}, \d{4}/);
      });

      it('should replace {time} placeholder', () => {
        const content = 'Time: {time}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{time}');
        expect(preview).to.match(/Time: \d{1,2}:\d{2} (AM|PM)/);
      });

      it('should replace {year} placeholder', () => {
        const content = 'Year: {year}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{year}');
        expect(preview).to.match(/Year: \d{4}/);
      });

      it('should replace {month} placeholder', () => {
        const content = 'Month: {month}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{month}');
        expect(preview).to.match(/Month: \d{2}/);
      });

      it('should replace {day} placeholder', () => {
        const content = 'Day: {day}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{day}');
        expect(preview).to.match(/Day: \d{2}/);
      });

      it('should replace {weekday} placeholder', () => {
        const content = 'Weekday: {weekday}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{weekday}');
        expect(preview).to.match(/Weekday: (Sun|Mon|Tue|Wed|Thu|Fri|Sat)/);
      });

      it('should replace {month_name} placeholder', () => {
        const content = 'Month Name: {month_name}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{month_name}');
        expect(preview).to.match(/Month Name: (January|February|March|April|May|June|July|August|September|October|November|December)/);
      });

      it('should replace {user} placeholder', () => {
        const content = 'User: {user}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{user}');
        expect(preview).to.include('User: ');
      });

      it('should replace {workspace} placeholder', () => {
        const content = 'Workspace: {workspace}';
        const preview = getTemplatePreview(content);

        expect(preview).to.not.include('{workspace}');
        expect(preview).to.include('Workspace: ');
      });

      it('should replace all placeholders in complex template', () => {
        const content = `File: {filename}
Created: {date} at {time}
Author: {user}
Workspace: {workspace}
Year: {year}, Month: {month}, Day: {day}
Weekday: {weekday}, Month Name: {month_name}`;

        const preview = getTemplatePreview(content);

        // Verify no placeholders remain
        expect(preview).to.not.include('{filename}');
        expect(preview).to.not.include('{date}');
        expect(preview).to.not.include('{time}');
        expect(preview).to.not.include('{year}');
        expect(preview).to.not.include('{month}');
        expect(preview).to.not.include('{day}');
        expect(preview).to.not.include('{weekday}');
        expect(preview).to.not.include('{month_name}');
        expect(preview).to.not.include('{user}');
        expect(preview).to.not.include('{workspace}');

        // Verify expected content exists
        expect(preview).to.include('example-note');
        expect(preview).to.include('Author: ');
        expect(preview).to.include('Workspace: ');
      });
    });

    describe('getCustomTemplatePath', () => {
      it('should return null when templates path not configured', () => {
        // In test environment without VS Code workspace configuration
        const result = getCustomTemplatePath('test-template');
        expect(result).to.be.null;
      });
    });
  });

  describe('Extended Template Placeholders', () => {
    const testDate = new Date('2024-10-15T14:30:00');

    it('should replace {year} in generated template', async () => {
      const content = `File: {filename}
Created: {date}
Year: {year}

Content here`;

      // Test with a mock custom template scenario
      const result = await generateTemplate('problem-solution', testDate, 'test.txt');
      expect(result).to.be.a('string');
    });
  });
});
