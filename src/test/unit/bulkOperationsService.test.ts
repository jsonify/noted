import { expect } from 'chai';
import { BulkOperationsService } from '../../services/bulkOperationsService';

describe('BulkOperationsService', () => {
    let service: BulkOperationsService;

    beforeEach(() => {
        service = new BulkOperationsService();
    });

    describe('Select Mode', () => {
        it('should start with select mode inactive', () => {
            expect(service.isSelectModeActive()).to.be.false;
        });

        it('should toggle select mode on', () => {
            service.toggleSelectMode();
            expect(service.isSelectModeActive()).to.be.true;
        });

        it('should toggle select mode off and clear selection', () => {
            service.enterSelectMode();
            service.select('/path/to/note1.txt');
            service.select('/path/to/note2.txt');
            expect(service.getSelectionCount()).to.equal(2);

            service.toggleSelectMode();
            expect(service.isSelectModeActive()).to.be.false;
            expect(service.getSelectionCount()).to.equal(0);
        });

        it('should enter select mode', () => {
            service.enterSelectMode();
            expect(service.isSelectModeActive()).to.be.true;
        });

        it('should exit select mode and clear selection', () => {
            service.enterSelectMode();
            service.select('/path/to/note.txt');
            service.exitSelectMode();
            expect(service.isSelectModeActive()).to.be.false;
            expect(service.getSelectionCount()).to.equal(0);
        });

        it('should not enter select mode if already active', () => {
            service.enterSelectMode();
            const wasActive = service.isSelectModeActive();
            service.enterSelectMode();
            expect(service.isSelectModeActive()).to.equal(wasActive);
        });

        it('should not exit select mode if already inactive', () => {
            expect(service.isSelectModeActive()).to.be.false;
            service.exitSelectMode();
            expect(service.isSelectModeActive()).to.be.false;
        });
    });

    describe('Selection Management', () => {
        beforeEach(() => {
            service.enterSelectMode();
        });

        it('should select a note', () => {
            service.select('/path/to/note.txt');
            expect(service.isSelected('/path/to/note.txt')).to.be.true;
            expect(service.getSelectionCount()).to.equal(1);
        });

        it('should deselect a note', () => {
            service.select('/path/to/note.txt');
            service.deselect('/path/to/note.txt');
            expect(service.isSelected('/path/to/note.txt')).to.be.false;
            expect(service.getSelectionCount()).to.equal(0);
        });

        it('should toggle selection on', () => {
            service.toggleSelection('/path/to/note.txt');
            expect(service.isSelected('/path/to/note.txt')).to.be.true;
        });

        it('should toggle selection off', () => {
            service.select('/path/to/note.txt');
            service.toggleSelection('/path/to/note.txt');
            expect(service.isSelected('/path/to/note.txt')).to.be.false;
        });

        it('should select multiple notes', () => {
            const paths = ['/path/to/note1.txt', '/path/to/note2.txt', '/path/to/note3.txt'];
            service.selectMultiple(paths);
            expect(service.getSelectionCount()).to.equal(3);
            paths.forEach(path => {
                expect(service.isSelected(path)).to.be.true;
            });
        });

        it('should not duplicate selections when selecting same note multiple times', () => {
            service.select('/path/to/note.txt');
            service.select('/path/to/note.txt');
            service.select('/path/to/note.txt');
            expect(service.getSelectionCount()).to.equal(1);
        });

        it('should clear all selections', () => {
            service.select('/path/to/note1.txt');
            service.select('/path/to/note2.txt');
            service.select('/path/to/note3.txt');
            expect(service.getSelectionCount()).to.equal(3);

            service.clearSelection();
            expect(service.getSelectionCount()).to.equal(0);
            expect(service.isSelected('/path/to/note1.txt')).to.be.false;
        });

        it('should get all selected notes', () => {
            const paths = ['/path/to/note1.txt', '/path/to/note2.txt'];
            service.selectMultiple(paths);
            const selected = service.getSelectedNotes();
            expect(selected).to.have.lengthOf(2);
            expect(selected).to.include.members(paths);
        });

        it('should return empty array when no notes selected', () => {
            const selected = service.getSelectedNotes();
            expect(selected).to.be.an('array').that.is.empty;
        });
    });

    describe('Selection Description', () => {
        beforeEach(() => {
            service.enterSelectMode();
        });

        it('should describe zero selections', () => {
            expect(service.getSelectionDescription()).to.equal('No notes selected');
        });

        it('should describe single selection', () => {
            service.select('/path/to/note.txt');
            expect(service.getSelectionDescription()).to.equal('1 note selected');
        });

        it('should describe multiple selections', () => {
            service.select('/path/to/note1.txt');
            service.select('/path/to/note2.txt');
            service.select('/path/to/note3.txt');
            expect(service.getSelectionDescription()).to.equal('3 notes selected');
        });
    });

    describe('Selection Count', () => {
        beforeEach(() => {
            service.enterSelectMode();
        });

        it('should return zero when no notes selected', () => {
            expect(service.getSelectionCount()).to.equal(0);
        });

        it('should return correct count for single selection', () => {
            service.select('/path/to/note.txt');
            expect(service.getSelectionCount()).to.equal(1);
        });

        it('should return correct count for multiple selections', () => {
            service.select('/path/to/note1.txt');
            service.select('/path/to/note2.txt');
            service.select('/path/to/note3.txt');
            expect(service.getSelectionCount()).to.equal(3);
        });

        it('should update count after deselection', () => {
            service.select('/path/to/note1.txt');
            service.select('/path/to/note2.txt');
            expect(service.getSelectionCount()).to.equal(2);
            service.deselect('/path/to/note1.txt');
            expect(service.getSelectionCount()).to.equal(1);
        });
    });

    describe('Events', () => {
        it('should fire event on selection change', (done) => {
            service.enterSelectMode();
            service.onDidChangeSelection(() => {
                done();
            });
            service.select('/path/to/note.txt');
        });

        it('should fire event on toggle select mode', (done) => {
            service.onDidChangeSelection(() => {
                done();
            });
            service.toggleSelectMode();
        });

        it('should fire event on clear selection', (done) => {
            service.enterSelectMode();
            service.select('/path/to/note.txt');

            // Subscribe to events after setup
            service.onDidChangeSelection(() => {
                done();
            });
            service.clearSelection();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty path gracefully', () => {
            service.enterSelectMode();
            service.select('');
            expect(service.getSelectionCount()).to.equal(1);
            expect(service.isSelected('')).to.be.true;
        });

        it('should handle special characters in path', () => {
            service.enterSelectMode();
            const specialPath = '/path/to/note with spaces & special-chars!@#.txt';
            service.select(specialPath);
            expect(service.isSelected(specialPath)).to.be.true;
        });

        it('should not fire event if selection is same when selecting', () => {
            service.enterSelectMode();
            service.select('/path/to/note.txt');

            let eventCount = 0;
            service.onDidChangeSelection(() => {
                eventCount++;
            });

            // Try to select again
            service.select('/path/to/note.txt');
            expect(eventCount).to.equal(0);
        });

        it('should not fire event if deselecting note that is not selected', () => {
            service.enterSelectMode();

            let eventCount = 0;
            service.onDidChangeSelection(() => {
                eventCount++;
            });

            service.deselect('/path/to/note.txt');
            expect(eventCount).to.equal(0);
        });

        it('should not fire event if clearing empty selection', () => {
            service.enterSelectMode();

            let eventCount = 0;
            service.onDidChangeSelection(() => {
                eventCount++;
            });

            service.clearSelection();
            expect(eventCount).to.equal(0);
        });
    });
});
