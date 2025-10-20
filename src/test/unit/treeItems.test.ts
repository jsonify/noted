import { expect } from 'chai';
import * as vscode from 'vscode';
import { SectionItem, NoteItem } from '../../providers/treeItems';

describe('Tree Items', () => {
  describe('SectionItem', () => {
    it('should create section with correct properties', () => {
      const section = new SectionItem('Recent Notes', 'recent');

      expect(section.label).to.equal('Recent Notes');
      expect(section.sectionType).to.equal('recent');
      expect(section.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Collapsed);
    });

    it('should have history icon for recent section', () => {
      const section = new SectionItem('Recent Notes', 'recent');

      expect(section.iconPath).to.be.instanceOf(vscode.ThemeIcon);
      expect((section.iconPath as vscode.ThemeIcon).id).to.equal('history');
    });

    it('should have pin icon for pinned section', () => {
      const section = new SectionItem('Pinned Notes', 'pinned');

      expect(section.iconPath).to.be.instanceOf(vscode.ThemeIcon);
      expect((section.iconPath as vscode.ThemeIcon).id).to.equal('pin');
    });

    it('should have archive icon for archive section', () => {
      const section = new SectionItem('Archive', 'archive');

      expect(section.iconPath).to.be.instanceOf(vscode.ThemeIcon);
      expect((section.iconPath as vscode.ThemeIcon).id).to.equal('archive');
    });

    it('should have folder icon for unknown section type', () => {
      const section = new SectionItem('Unknown Section', 'unknown');

      expect(section.iconPath).to.be.instanceOf(vscode.ThemeIcon);
      expect((section.iconPath as vscode.ThemeIcon).id).to.equal('folder');
    });
  });

  describe('NoteItem', () => {
    describe('year type', () => {
      it('should create year item with correct properties', () => {
        const item = new NoteItem(
          '2024',
          '/path/to/2024',
          vscode.TreeItemCollapsibleState.Collapsed,
          'year'
        );

        expect(item.label).to.equal('2024');
        expect(item.filePath).to.equal('/path/to/2024');
        expect(item.type).to.equal('year');
        expect(item.contextValue).to.equal('year');
        expect(item.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Collapsed);
      });

      it('should have folder icon', () => {
        const item = new NoteItem('2024', '/path/to/2024', vscode.TreeItemCollapsibleState.Collapsed, 'year');

        expect(item.iconPath).to.be.instanceOf(vscode.ThemeIcon);
        expect((item.iconPath as vscode.ThemeIcon).id).to.equal('folder');
      });
    });

    describe('month type', () => {
      it('should create month item with correct properties', () => {
        const item = new NoteItem(
          '10-October',
          '/path/to/2024/10-October',
          vscode.TreeItemCollapsibleState.Collapsed,
          'month'
        );

        expect(item.label).to.equal('10-October');
        expect(item.filePath).to.equal('/path/to/2024/10-October');
        expect(item.type).to.equal('month');
        expect(item.contextValue).to.equal('month');
      });

      it('should have calendar icon', () => {
        const item = new NoteItem(
          '10-October',
          '/path/to/2024/10-October',
          vscode.TreeItemCollapsibleState.Collapsed,
          'month'
        );

        expect(item.iconPath).to.be.instanceOf(vscode.ThemeIcon);
        expect((item.iconPath as vscode.ThemeIcon).id).to.equal('calendar');
      });
    });

    describe('note type', () => {
      it('should create note item with correct properties', () => {
        const item = new NoteItem(
          '2024-10-15.txt',
          '/path/to/note.txt',
          vscode.TreeItemCollapsibleState.None,
          'note'
        );

        expect(item.label).to.equal('2024-10-15.txt');
        expect(item.filePath).to.equal('/path/to/note.txt');
        expect(item.type).to.equal('note');
        expect(item.contextValue).to.equal('note');
        expect(item.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.None);
      });

      it('should have note icon', () => {
        const item = new NoteItem(
          'note.txt',
          '/path/to/note.txt',
          vscode.TreeItemCollapsibleState.None,
          'note'
        );

        expect(item.iconPath).to.be.instanceOf(vscode.ThemeIcon);
        expect((item.iconPath as vscode.ThemeIcon).id).to.equal('note');
      });
    });

    describe('custom-folder type', () => {
      it('should create custom folder item with correct properties', () => {
        const item = new NoteItem(
          'Projects',
          '/path/to/Projects',
          vscode.TreeItemCollapsibleState.Collapsed,
          'custom-folder'
        );

        expect(item.label).to.equal('Projects');
        expect(item.filePath).to.equal('/path/to/Projects');
        expect(item.type).to.equal('custom-folder');
        expect(item.contextValue).to.equal('custom-folder');
      });

      it('should have folder-opened icon', () => {
        const item = new NoteItem(
          'Projects',
          '/path/to/Projects',
          vscode.TreeItemCollapsibleState.Collapsed,
          'custom-folder'
        );

        expect(item.iconPath).to.be.instanceOf(vscode.ThemeIcon);
        expect((item.iconPath as vscode.ThemeIcon).id).to.equal('folder-opened');
      });
    });

    describe('resourceUri', () => {
      it('should set resourceUri for all item types', () => {
        const testPath = '/test/path';
        const item = new NoteItem('Test', testPath, vscode.TreeItemCollapsibleState.None, 'note');

        expect(item.resourceUri).to.be.instanceOf(vscode.Uri);
        expect(item.resourceUri?.fsPath).to.equal(testPath);
      });
    });

    describe('setPinned', () => {
      it('should set isPinned to true and update icon', () => {
        const item = new NoteItem('note.txt', '/path/to/note.txt', vscode.TreeItemCollapsibleState.None, 'note');

        item.setPinned(true);

        expect(item.isPinned).to.be.true;
        expect(item.iconPath).to.be.instanceOf(vscode.ThemeIcon);
        expect((item.iconPath as vscode.ThemeIcon).id).to.equal('pinned');
        expect(item.description).to.equal('📌');
      });

      it('should set isPinned to false', () => {
        const item = new NoteItem('note.txt', '/path/to/note.txt', vscode.TreeItemCollapsibleState.None, 'note');

        item.setPinned(true);
        item.setPinned(false);

        expect(item.isPinned).to.be.false;
      });

      it('should not update icon for non-note types', () => {
        const item = new NoteItem('2024', '/path/to/2024', vscode.TreeItemCollapsibleState.Collapsed, 'year');

        item.setPinned(true);

        expect(item.isPinned).to.be.true;
        expect((item.iconPath as vscode.ThemeIcon).id).to.equal('folder');
      });
    });
  });
});
