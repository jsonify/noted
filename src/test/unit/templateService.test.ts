import { expect } from 'chai';
import { generateTemplate, getCustomTemplates } from '../../services/templateService';

describe('Template Service', () => {
  describe('generateTemplate', () => {
    const testDate = new Date('2024-10-15T14:30:00');

    it('should generate problem-solution template', async () => {
      const result = await generateTemplate('problem-solution', testDate, 'test-note.txt');

      expect(result).to.include('File: test-note.txt');
      expect(result).to.include('Created:');
      expect(result).to.include('PROBLEM:');
      expect(result).to.include('STEPS TAKEN:');
      expect(result).to.include('SOLUTION:');
      expect(result).to.include('NOTES:');
    });

    it('should generate meeting template', async () => {
      const result = await generateTemplate('meeting', testDate, 'meeting-note.txt');

      expect(result).to.include('File: meeting-note.txt');
      expect(result).to.include('MEETING:');
      expect(result).to.include('ATTENDEES:');
      expect(result).to.include('AGENDA:');
      expect(result).to.include('NOTES:');
      expect(result).to.include('ACTION ITEMS:');
    });

    it('should generate research template', async () => {
      const result = await generateTemplate('research', testDate, 'research-note.txt');

      expect(result).to.include('File: research-note.txt');
      expect(result).to.include('TOPIC:');
      expect(result).to.include('QUESTIONS:');
      expect(result).to.include('FINDINGS:');
      expect(result).to.include('SOURCES:');
    });

    it('should generate quick template', async () => {
      const result = await generateTemplate('quick', testDate, 'quick-note.txt');

      expect(result).to.include('File: quick-note.txt');
      expect(result).to.include('Created:');
      expect(result).to.include('==================================================');
    });

    it('should generate default template for undefined type', async () => {
      const result = await generateTemplate(undefined, testDate);

      expect(result).to.include('2024');
      expect(result).to.include('October');
      expect(result).to.include('==================================================');
    });

    it('should not include filename when not provided', async () => {
      const result = await generateTemplate('quick', testDate);

      expect(result).to.not.include('File:');
      expect(result).to.include('Created:');
    });

    it('should include proper date formatting', async () => {
      const result = await generateTemplate('quick', testDate, 'test.txt');

      expect(result).to.include('October');
      expect(result).to.include('15');
      expect(result).to.include('2024');
    });

    it('should include proper time formatting', async () => {
      const result = await generateTemplate('quick', testDate, 'test.txt');

      // Time should be in 12-hour format with AM/PM
      expect(result).to.match(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });

  describe('getCustomTemplates', () => {
    it('should return empty array when templates path not configured', async () => {
      // In test environment without VS Code workspace, should return empty array
      const result = await getCustomTemplates();
      expect(result).to.be.an('array');
    });
  });
});
