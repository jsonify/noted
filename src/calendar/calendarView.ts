import * as vscode from 'vscode';
import { getNotesPath, getFileFormat } from '../services/configService';
import { getNotesForDate, openNoteForDate, checkNoteExists, isTodayDate } from './calendarHelpers';

/**
 * Show the calendar view webview
 */
export async function showCalendarView(context: vscode.ExtensionContext): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please configure a notes folder first');
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'notedCalendar',
        'Calendar View',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Set the initial HTML
    panel.webview.html = await getCalendarHtml(currentYear, currentMonth, notesPath);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'dateClicked':
                    const notes = await getNotesForDate(notesPath, message.year, message.month, message.day);
                    panel.webview.postMessage({ command: 'showNotes', notes: notes, year: message.year, month: message.month, day: message.day });
                    break;
                case 'openNote':
                    const document = await vscode.workspace.openTextDocument(message.filePath);
                    await vscode.window.showTextDocument(document);
                    break;
                case 'createNote':
                    await openNoteForDate(message.year, message.month, message.day);
                    // Refresh the notes list after creating
                    const updatedNotes = await getNotesForDate(notesPath, message.year, message.month, message.day);
                    panel.webview.postMessage({ command: 'showNotes', notes: updatedNotes, year: message.year, month: message.month, day: message.day });
                    break;
                case 'changeMonth':
                    panel.webview.html = await getCalendarHtml(message.year, message.month, notesPath);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Generate the HTML content for the calendar webview
 */
async function getCalendarHtml(year: number, month: number, notesPath: string): Promise<string> {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const fileFormat = getFileFormat();

    // Get days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Build calendar grid
    let calendarHtml = '';
    let dayCounter = 1;

    // Generate 6 weeks to accommodate all possible month layouts
    for (let week = 0; week < 6; week++) {
        calendarHtml += '<tr>';
        for (let day = 0; day < 7; day++) {
            const cellIndex = week * 7 + day;
            if (cellIndex < startingDayOfWeek || dayCounter > daysInMonth) {
                calendarHtml += '<td class="empty"></td>';
            } else {
                const hasNote = await checkNoteExists(notesPath, year, month, dayCounter, fileFormat);
                const isToday = isTodayDate(year, month, dayCounter);
                const classes = [];
                if (hasNote) {classes.push('has-note');}
                if (isToday) {classes.push('today');}

                calendarHtml += `<td class="${classes.join(' ')}" data-day="${dayCounter}">
                    <div class="day-number">${dayCounter}</div>
                </td>`;
                dayCounter++;
            }
        }
        calendarHtml += '</tr>';
        if (dayCounter > daysInMonth) {break;}
    }

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Calendar View</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                padding: 20px;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .header h2 {
                margin: 0;
                font-size: 24px;
            }
            .nav-buttons button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                margin: 0 5px;
                cursor: pointer;
                border-radius: 3px;
                font-size: 14px;
            }
            .nav-buttons button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .calendar {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .calendar th {
                padding: 12px;
                text-align: center;
                font-weight: 600;
                color: var(--vscode-foreground);
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .calendar td {
                padding: 0;
                text-align: center;
                border: 1px solid var(--vscode-panel-border);
                height: 80px;
                width: 14.28%;
                position: relative;
                cursor: pointer;
                vertical-align: top;
            }
            .calendar td.empty {
                background-color: var(--vscode-editor-background);
                cursor: default;
            }
            .calendar td:not(.empty):hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            .day-number {
                padding: 8px;
                font-size: 16px;
            }
            .calendar td.has-note {
                background-color: var(--vscode-textCodeBlock-background);
                font-weight: 600;
            }
            .calendar td.has-note .day-number {
                color: var(--vscode-textLink-foreground);
            }
            .calendar td.today {
                border: 2px solid var(--vscode-focusBorder);
            }
            .legend {
                margin-top: 20px;
                display: flex;
                gap: 20px;
                font-size: 12px;
            }
            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .legend-box {
                width: 20px;
                height: 20px;
                border: 1px solid var(--vscode-panel-border);
            }
            .legend-box.has-note {
                background-color: var(--vscode-textCodeBlock-background);
            }
            .legend-box.today {
                border: 2px solid var(--vscode-focusBorder);
            }
            #notesSection {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid var(--vscode-panel-border);
            }
            .notes-header h3 {
                margin: 0 0 15px 0;
                font-size: 18px;
                color: var(--vscode-foreground);
            }
            #notesList {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .note-item {
                padding: 12px 16px;
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .note-item:hover {
                background: var(--vscode-list-hoverBackground);
                border-color: var(--vscode-focusBorder);
            }
            .note-item-icon {
                color: var(--vscode-textLink-foreground);
                font-size: 16px;
            }
            .note-item-name {
                flex: 1;
                font-family: var(--vscode-font-family);
                font-size: 14px;
            }
            .create-note-btn {
                padding: 12px 16px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                width: 100%;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .create-note-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>${monthNames[month]} ${year}</h2>
            <div class="nav-buttons">
                <button id="prevMonth">← Previous</button>
                <button id="today">Today</button>
                <button id="nextMonth">Next →</button>
            </div>
        </div>
        <table class="calendar">
            <thead>
                <tr>
                    <th>Sun</th>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                </tr>
            </thead>
            <tbody>
                ${calendarHtml}
            </tbody>
        </table>
        <div class="legend">
            <div class="legend-item">
                <div class="legend-box today"></div>
                <span>Today</span>
            </div>
            <div class="legend-item">
                <div class="legend-box has-note"></div>
                <span>Has Note</span>
            </div>
        </div>
        <div id="notesSection" style="display: none;">
            <div class="notes-header">
                <h3 id="notesSectionTitle"></h3>
            </div>
            <div id="notesList"></div>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            let currentYear = ${year};
            let currentMonth = ${month};

            // Handle day clicks
            document.querySelectorAll('td[data-day]').forEach(cell => {
                cell.addEventListener('click', () => {
                    const day = parseInt(cell.dataset.day);
                    vscode.postMessage({
                        command: 'dateClicked',
                        year: currentYear,
                        month: currentMonth,
                        day: day
                    });
                });
            });

            // Listen for messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'showNotes') {
                    showNotesForDate(message.notes, message.year, message.month, message.day);
                }
            });

            function showNotesForDate(notes, year, month, day) {
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                const date = new Date(year, month, day);
                const dateStr = monthNames[month] + ' ' + day + ', ' + year;

                const notesSection = document.getElementById('notesSection');
                const notesSectionTitle = document.getElementById('notesSectionTitle');
                const notesList = document.getElementById('notesList');

                notesSectionTitle.textContent = 'Notes for ' + dateStr;
                notesList.innerHTML = '';

                if (notes.length === 0) {
                    notesList.innerHTML = \`
                        <p style="color: var(--vscode-descriptionForeground); margin-bottom: 12px;">No notes found for this date.</p>
                        <button class="create-note-btn" onclick="createNewNote(\${year}, \${month}, \${day})">
                            <span>➕</span>
                            <span>Create New Note</span>
                        </button>
                    \`;
                } else {
                    notes.forEach(note => {
                        const noteItem = document.createElement('div');
                        noteItem.className = 'note-item';
                        noteItem.innerHTML = \`
                            <span class="note-item-icon">📄</span>
                            <span class="note-item-name">\${note.name}</span>
                        \`;
                        noteItem.addEventListener('click', () => {
                            vscode.postMessage({
                                command: 'openNote',
                                filePath: note.path
                            });
                        });
                        notesList.appendChild(noteItem);
                    });

                    // Add create button at the end
                    const createBtn = document.createElement('button');
                    createBtn.className = 'create-note-btn';
                    createBtn.style.marginTop = '8px';
                    createBtn.innerHTML = \`
                        <span>➕</span>
                        <span>Create Another Note</span>
                    \`;
                    createBtn.addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'createNote',
                            year: year,
                            month: month,
                            day: day
                        });
                    });
                    notesList.appendChild(createBtn);
                }

                notesSection.style.display = 'block';
                notesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            function createNewNote(year, month, day) {
                vscode.postMessage({
                    command: 'createNote',
                    year: year,
                    month: month,
                    day: day
                });
            }

            // Navigation buttons
            document.getElementById('prevMonth').addEventListener('click', () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                vscode.postMessage({
                    command: 'changeMonth',
                    year: currentYear,
                    month: currentMonth
                });
            });

            document.getElementById('nextMonth').addEventListener('click', () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                vscode.postMessage({
                    command: 'changeMonth',
                    year: currentYear,
                    month: currentMonth
                });
            });

            document.getElementById('today').addEventListener('click', () => {
                const now = new Date();
                currentYear = now.getFullYear();
                currentMonth = now.getMonth();
                vscode.postMessage({
                    command: 'changeMonth',
                    year: currentYear,
                    month: currentMonth
                });
            });
        </script>
    </body>
    </html>`;
}
