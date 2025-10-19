import { expect } from 'chai';
import {
  formatDateForNote,
  formatTimeForNote,
  formatTimestamp,
  getYear,
  getMonth,
  getMonthName,
  getDay,
  getFolderName,
  getTimeForFilename,
  isTodayDate
} from '../../utils/dateHelpers';

describe('Date Helpers', () => {
  describe('formatDateForNote', () => {
    it('should format date in long readable format', () => {
      const date = new Date('2024-10-15T12:30:00');
      const result = formatDateForNote(date);
      expect(result).to.include('2024');
      expect(result).to.include('October');
      expect(result).to.include('15');
    });
  });

  describe('formatTimeForNote', () => {
    it('should format time in 12-hour format with AM/PM', () => {
      const morningDate = new Date('2024-10-15T09:30:00');
      const morningResult = formatTimeForNote(morningDate);
      expect(morningResult).to.match(/09:30 AM|9:30 AM/);

      const afternoonDate = new Date('2024-10-15T14:30:00');
      const afternoonResult = formatTimeForNote(afternoonDate);
      expect(afternoonResult).to.match(/02:30 PM|2:30 PM/);
    });
  });

  describe('formatTimestamp', () => {
    it('should return current time in 12-hour format', () => {
      const result = formatTimestamp();
      expect(result).to.match(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });

  describe('getYear', () => {
    it('should return year as string', () => {
      const date = new Date('2024-10-15');
      expect(getYear(date)).to.equal('2024');
    });

    it('should handle different years', () => {
      // Use Date constructor with year, month (0-indexed), day to avoid timezone issues
      expect(getYear(new Date(1999, 0, 1))).to.equal('1999');
      expect(getYear(new Date(2100, 11, 31))).to.equal('2100');
    });
  });

  describe('getMonth', () => {
    it('should return month with leading zero', () => {
      expect(getMonth(new Date('2024-01-15'))).to.equal('01');
      expect(getMonth(new Date('2024-09-15'))).to.equal('09');
      expect(getMonth(new Date('2024-10-15'))).to.equal('10');
      expect(getMonth(new Date('2024-12-15'))).to.equal('12');
    });
  });

  describe('getMonthName', () => {
    it('should return full month name', () => {
      expect(getMonthName(new Date('2024-01-15'))).to.equal('January');
      expect(getMonthName(new Date('2024-06-15'))).to.equal('June');
      expect(getMonthName(new Date('2024-12-15'))).to.equal('December');
    });
  });

  describe('getDay', () => {
    it('should return day with leading zero', () => {
      // Use Date constructor with year, month (0-indexed), day to avoid timezone issues
      expect(getDay(new Date(2024, 9, 5))).to.equal('05');
      expect(getDay(new Date(2024, 9, 15))).to.equal('15');
      expect(getDay(new Date(2024, 9, 31))).to.equal('31');
    });
  });

  describe('getFolderName', () => {
    it('should return folder name in MM-MonthName format', () => {
      expect(getFolderName(new Date('2024-01-15'))).to.equal('01-January');
      expect(getFolderName(new Date('2024-06-15'))).to.equal('06-June');
      expect(getFolderName(new Date('2024-12-15'))).to.equal('12-December');
    });
  });

  describe('getTimeForFilename', () => {
    it('should return time in 24-hour HHMM format without colon', () => {
      // Use Date constructor with explicit values to avoid timezone issues
      const morning = new Date(2024, 9, 15, 9, 30, 0);
      expect(getTimeForFilename(morning)).to.equal('0930');

      const afternoon = new Date(2024, 9, 15, 14, 45, 0);
      expect(getTimeForFilename(afternoon)).to.equal('1445');

      const midnight = new Date(2024, 9, 15, 0, 0, 0);
      expect(getTimeForFilename(midnight)).to.equal('0000');
    });
  });

  describe('isTodayDate', () => {
    it('should return true for today\'s date', () => {
      const today = new Date();
      const result = isTodayDate(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      expect(result).to.be.true;
    });

    it('should return false for past dates', () => {
      const result = isTodayDate(2020, 0, 1);
      expect(result).to.be.false;
    });

    it('should return false for future dates', () => {
      const result = isTodayDate(2100, 11, 31);
      expect(result).to.be.false;
    });

    it('should return false for different components', () => {
      const today = new Date();

      // Wrong year
      expect(isTodayDate(today.getFullYear() - 1, today.getMonth(), today.getDate())).to.be.false;

      // Wrong month
      expect(isTodayDate(today.getFullYear(), (today.getMonth() + 1) % 12, today.getDate())).to.be.false;

      // Wrong day
      const wrongDay = today.getDate() === 1 ? 2 : 1;
      expect(isTodayDate(today.getFullYear(), today.getMonth(), wrongDay)).to.be.false;
    });
  });
});
