import { expect } from 'chai';
import { isYearFolder, isMonthFolder, isValidCustomFolderName } from '../../utils/validators';

describe('Validators', () => {
  describe('isYearFolder', () => {
    it('should return true for valid year formats', () => {
      expect(isYearFolder('2024')).to.be.true;
      expect(isYearFolder('2025')).to.be.true;
      expect(isYearFolder('1999')).to.be.true;
      expect(isYearFolder('2100')).to.be.true;
    });

    it('should return false for invalid year formats', () => {
      expect(isYearFolder('24')).to.be.false;
      expect(isYearFolder('202')).to.be.false;
      expect(isYearFolder('20245')).to.be.false;
      expect(isYearFolder('abcd')).to.be.false;
      expect(isYearFolder('2024-01')).to.be.false;
      expect(isYearFolder('')).to.be.false;
    });
  });

  describe('isMonthFolder', () => {
    it('should return true for valid month formats', () => {
      expect(isMonthFolder('01-January')).to.be.true;
      expect(isMonthFolder('02-February')).to.be.true;
      expect(isMonthFolder('12-December')).to.be.true;
      expect(isMonthFolder('06-June')).to.be.true;
    });

    it('should return false for invalid month formats', () => {
      expect(isMonthFolder('1-January')).to.be.false; // single digit month
      expect(isMonthFolder('January-01')).to.be.false; // wrong order
      expect(isMonthFolder('01-')).to.be.false; // no month name
      expect(isMonthFolder('-January')).to.be.false; // no month number
      expect(isMonthFolder('')).to.be.false; // empty string
    });

    it('should validate format pattern, not semantic validity', () => {
      // These match the pattern (NN-Word) even if they're not valid months
      expect(isMonthFolder('13-January')).to.be.true; // matches pattern
      expect(isMonthFolder('00-January')).to.be.true; // matches pattern
      expect(isMonthFolder('99-Whatever')).to.be.true; // matches pattern
    });
  });

  describe('isValidCustomFolderName', () => {
    it('should return true for valid custom folder names', () => {
      expect(isValidCustomFolderName('My Notes')).to.be.true;
      expect(isValidCustomFolderName('Projects')).to.be.true;
      expect(isValidCustomFolderName('Work-Notes')).to.be.true;
      expect(isValidCustomFolderName('Ideas_2024')).to.be.true;
    });

    it('should return false for empty or whitespace-only names', () => {
      expect(isValidCustomFolderName('')).to.be.false;
      expect(isValidCustomFolderName('   ')).to.be.false;
      expect(isValidCustomFolderName('\t')).to.be.false;
    });

    it('should return false for names that match date patterns', () => {
      expect(isValidCustomFolderName('2024')).to.be.false;
      expect(isValidCustomFolderName('01-January')).to.be.false;
      expect(isValidCustomFolderName('12-December')).to.be.false;
    });

    it('should return false for names with invalid filesystem characters', () => {
      expect(isValidCustomFolderName('Notes:Folder')).to.be.false;
      expect(isValidCustomFolderName('Notes*Folder')).to.be.false;
      expect(isValidCustomFolderName('Notes?Folder')).to.be.false;
      expect(isValidCustomFolderName('Notes"Folder')).to.be.false;
      expect(isValidCustomFolderName('Notes<Folder')).to.be.false;
      expect(isValidCustomFolderName('Notes>Folder')).to.be.false;
      expect(isValidCustomFolderName('Notes|Folder')).to.be.false;
    });
  });
});
