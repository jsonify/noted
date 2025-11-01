import * as vscode from 'vscode';
import { getNotesPath, getFileFormat } from '../services/configService';
import { getNotesForDate, openNoteForDate, countNotesForDate, isTodayDate, getTotalNotesCount, getMonthlyStats, getMostActiveDay, getRecentActivity } from './calendarHelpers';

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
    const noteCounts: number[] = [];

    // Pre-calculate note counts for all days in the month
    for (let d = 1; d <= daysInMonth; d++) {
        const count = await countNotesForDate(notesPath, year, month, d);
        noteCounts.push(count);
    }

    // Find max note count for scaling the heatmap
    const maxNotes = Math.max(...noteCounts, 1);

    // Calculate statistics
    const totalNotes = await getTotalNotesCount(notesPath);
    const monthlyStats = await getMonthlyStats(notesPath);
    const mostActiveDay = await getMostActiveDay(notesPath, year, month);
    const recentActivity = await getRecentActivity(notesPath);

    // Generate 6 weeks to accommodate all possible month layouts
    for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
            const cellIndex = week * 7 + day;
            if (cellIndex < startingDayOfWeek || dayCounter > daysInMonth) {
                calendarHtml += '<div class="day-cell empty"></div>';
            } else {
                const noteCount = noteCounts[dayCounter - 1];
                const isToday = isTodayDate(year, month, dayCounter);

                // Calculate intensity level (0-5) for heatmap
                const intensity = noteCount === 0 ? 0 : Math.min(Math.ceil((noteCount / maxNotes) * 4) + 1, 5);

                const classes = ['day-cell'];
                if (isToday) {classes.push('today');}
                classes.push(`intensity-${intensity}`);

                calendarHtml += `<div class="${classes.join(' ')}" data-day="${dayCounter}" data-count="${noteCount}">
                    <div class="day-circle">
                        <div class="day-number">${dayCounter}</div>
                        ${noteCount > 0 ? `<div class="note-count">${noteCount}</div>` : ''}
                    </div>
                </div>`;
                dayCounter++;
            }
        }
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
                margin: 0;
                height: 100vh;
                overflow: hidden;
            }

            /* Main container with 2-column layout */
            .container {
                display: flex;
                height: calc(100vh - 40px);
                gap: 0;
            }

            /* Left panel - Calendar */
            .calendar-panel {
                flex: 0 0 40%;
                min-width: 300px;
                max-width: 70%;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                padding-right: 12px;
            }

            /* Horizontal resize handle */
            .resize-handle-horizontal {
                flex: 0 0 8px;
                background: transparent;
                cursor: col-resize;
                position: relative;
                user-select: none;
            }
            .resize-handle-horizontal:hover::before,
            .resize-handle-horizontal.resizing::before {
                content: '';
                position: absolute;
                left: 3px;
                top: 0;
                bottom: 0;
                width: 2px;
                background: var(--vscode-focusBorder);
                border-radius: 2px;
            }

            /* Right panel container */
            .right-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding-left: 12px;
            }

            /* Notes panel - top of right side */
            .notes-panel {
                flex: 1 1 60%;
                min-height: 200px;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                background-color: var(--vscode-editor-background);
            }

            /* Vertical resize handle */
            .resize-handle-vertical {
                flex: 0 0 8px;
                background: transparent;
                cursor: row-resize;
                position: relative;
                user-select: none;
            }
            .resize-handle-vertical:hover::before,
            .resize-handle-vertical.resizing::before {
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                top: 3px;
                height: 2px;
                background: var(--vscode-focusBorder);
                border-radius: 2px;
            }

            /* Statistics panel - bottom of right side */
            .statistics-panel {
                flex: 0 1 40%;
                min-height: 150px;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                padding-top: 8px;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                flex-shrink: 0;
            }
            .header h2 {
                margin: 0;
                font-size: 18px;
            }
            .nav-buttons button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 10px;
                margin: 0 3px;
                cursor: pointer;
                border-radius: 3px;
                font-size: 11px;
            }
            .nav-buttons button:hover {
                background: var(--vscode-button-hoverBackground);
            }

            /* Day of week headers */
            .weekday-headers {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 4px;
                margin-bottom: 4px;
                padding: 0 2px;
            }
            .weekday-header {
                text-align: center;
                font-weight: 600;
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
                padding: 4px 0;
            }

            /* Calendar grid layout */
            .calendar {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 4px;
                margin-top: 6px;
                padding: 2px;
            }

            /* Day cell container */
            .day-cell {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
            }
            .day-cell.empty {
                cursor: default;
            }

            /* Circular day display */
            .day-circle {
                width: 85%;
                height: 85%;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                border: 2px solid transparent;
                position: relative;
                overflow: visible;
            }

            /* Note count badge on hover */
            .note-count {
                position: absolute;
                top: -6px;
                right: -6px;
                background: linear-gradient(135deg, #ff6b6b, #ff8787);
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 700;
                opacity: 0;
                transform: scale(0) rotate(-180deg);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
                z-index: 10;
            }

            .day-cell:not(.empty):hover .note-count {
                opacity: 1;
                transform: scale(1) rotate(0deg);
            }

            .day-cell:not(.empty):hover .day-circle {
                transform: scale(1.2);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                z-index: 5;
            }

            /* Ripple effect on hover */
            .day-circle::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                border: 2px solid currentColor;
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
                transition: all 0.5s ease;
            }

            .day-cell:not(.empty):hover .day-circle::before {
                transform: translate(-50%, -50%) scale(1.4);
                opacity: 0.3;
            }

            .day-number {
                font-size: 11px;
                font-weight: 500;
                user-select: none;
                position: relative;
                z-index: 2;
            }

            /* Heatmap intensity colors - using purple/blue gradient */
            .day-cell.intensity-0 .day-circle {
                background-color: rgba(100, 100, 120, 0.15);
                color: var(--vscode-descriptionForeground);
            }

            .day-cell.intensity-1 .day-circle {
                background-color: rgba(120, 100, 200, 0.3);
                color: var(--vscode-foreground);
            }

            .day-cell.intensity-2 .day-circle {
                background-color: rgba(130, 110, 220, 0.5);
                color: var(--vscode-foreground);
            }

            .day-cell.intensity-3 .day-circle {
                background-color: rgba(140, 120, 240, 0.7);
                color: var(--vscode-foreground);
            }

            .day-cell.intensity-4 .day-circle {
                background-color: rgba(150, 130, 255, 0.85);
                color: var(--vscode-foreground);
                font-weight: 600;
            }

            .day-cell.intensity-5 .day-circle {
                background-color: rgba(160, 140, 255, 1);
                color: #ffffff;
                font-weight: 700;
                box-shadow: 0 0 12px rgba(160, 140, 255, 0.5);
            }

            /* Today indicator - much more pronounced! */
            @keyframes todayPulse {
                0%, 100% {
                    box-shadow: 0 0 0 0 var(--vscode-focusBorder),
                                0 0 20px rgba(100, 180, 255, 0.6),
                                inset 0 0 20px rgba(100, 180, 255, 0.2);
                }
                50% {
                    box-shadow: 0 0 0 4px var(--vscode-focusBorder),
                                0 0 30px rgba(100, 180, 255, 0.8),
                                inset 0 0 25px rgba(100, 180, 255, 0.3);
                }
            }

            .day-cell.today .day-circle {
                border: 4px solid var(--vscode-focusBorder);
                animation: todayPulse 2s ease-in-out infinite;
                transform: scale(1.05);
                background: linear-gradient(135deg,
                    rgba(100, 180, 255, 0.3) 0%,
                    rgba(120, 100, 200, 0.5) 100%) !important;
                font-weight: 700;
            }

            .day-cell.today .day-number {
                color: #ffffff;
                text-shadow: 0 0 10px rgba(100, 180, 255, 0.8);
                font-size: 13px;
            }

            .day-cell.today:hover .day-circle {
                transform: scale(1.25);
                animation: none;
            }

            /* Legend */
            .legend {
                margin-top: 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 9px;
                flex-wrap: wrap;
                flex-shrink: 0;
            }
            .legend-label {
                font-weight: 600;
                margin-right: 2px;
                color: var(--vscode-foreground);
            }
            .legend-item {
                display: flex;
                align-items: center;
                gap: 3px;
            }
            .legend-circle {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 1px solid rgba(128, 128, 128, 0.3);
            }
            .legend-circle.intensity-0 {
                background-color: rgba(100, 100, 120, 0.15);
            }
            .legend-circle.intensity-1 {
                background-color: rgba(120, 100, 200, 0.3);
            }
            .legend-circle.intensity-2 {
                background-color: rgba(130, 110, 220, 0.5);
            }
            .legend-circle.intensity-3 {
                background-color: rgba(140, 120, 240, 0.7);
            }
            .legend-circle.intensity-4 {
                background-color: rgba(150, 130, 255, 0.85);
            }
            .legend-circle.intensity-5 {
                background-color: rgba(160, 140, 255, 1);
            }
            .legend-today {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 2px solid var(--vscode-focusBorder);
                background: linear-gradient(135deg, rgba(100, 180, 255, 0.3), rgba(120, 100, 200, 0.5));
            }

            /* Statistics Panel */
            .stats-header {
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--vscode-panel-border);
            }
            .stats-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--vscode-foreground);
            }
            .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 12px;
            }
            .stat-card {
                background: linear-gradient(135deg, rgba(120, 100, 200, 0.1), rgba(140, 120, 240, 0.05));
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 12px;
                transition: all 0.2s ease;
            }
            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                border-color: var(--vscode-focusBorder);
            }
            .stat-card-icon {
                font-size: 24px;
                margin-bottom: 6px;
            }
            .stat-card-value {
                font-size: 28px;
                font-weight: 700;
                color: var(--vscode-foreground);
                margin: 4px 0;
            }
            .stat-card-label {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .stat-card.full-width {
                grid-column: 1 / 3;
            }
            .activity-chart {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                height: 60px;
                gap: 4px;
                margin-top: 8px;
            }
            .activity-bar {
                flex: 1;
                background: linear-gradient(to top, rgba(150, 130, 255, 0.8), rgba(160, 140, 255, 0.4));
                border-radius: 3px 3px 0 0;
                min-height: 4px;
                transition: all 0.2s ease;
                position: relative;
            }
            .activity-bar:hover {
                background: linear-gradient(to top, rgba(150, 130, 255, 1), rgba(160, 140, 255, 0.6));
                transform: scaleY(1.1);
            }
            .activity-bar-label {
                position: absolute;
                bottom: -16px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 8px;
                color: var(--vscode-descriptionForeground);
                white-space: nowrap;
            }
            .stat-detail {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 6px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .stat-detail-highlight {
                color: var(--vscode-textLink-foreground);
                font-weight: 600;
            }
            /* Notes panel styling */
            #notesSection {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            #notesSection.empty {
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--vscode-descriptionForeground);
                font-size: 14px;
                font-style: italic;
            }
            .notes-header {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 2px solid var(--vscode-panel-border);
                flex-shrink: 0;
            }
            .notes-header h3 {
                margin: 0;
                font-size: 18px;
                color: var(--vscode-foreground);
                font-weight: 600;
            }
            #notesList {
                display: flex;
                flex-direction: column;
                gap: 10px;
                overflow-y: auto;
            }
            .note-item {
                padding: 14px 18px;
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.2s ease;
            }
            .note-item:hover {
                background: var(--vscode-list-hoverBackground);
                border-color: var(--vscode-focusBorder);
                transform: translateX(4px);
                box-shadow: -4px 0 0 var(--vscode-focusBorder);
            }
            .note-item-icon {
                color: var(--vscode-textLink-foreground);
                font-size: 18px;
            }
            .note-item-name {
                flex: 1;
                font-family: var(--vscode-font-family);
                font-size: 14px;
                font-weight: 500;
            }
            .create-note-btn {
                padding: 14px 18px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                width: 100%;
                text-align: left;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.2s ease;
                font-weight: 500;
            }
            .create-note-btn:hover {
                background: var(--vscode-button-hoverBackground);
                transform: translateX(4px);
            }
            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: var(--vscode-descriptionForeground);
            }
            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.5;
            }
            .empty-state-text {
                font-size: 14px;
                line-height: 1.6;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Left: Calendar -->
            <div class="calendar-panel">
                <div class="header">
                    <h2>${monthNames[month]} ${year}</h2>
                    <div class="nav-buttons">
                        <button id="prevMonth">← Prev</button>
                        <button id="today">Today</button>
                        <button id="nextMonth">Next →</button>
                    </div>
                </div>
                <div class="weekday-headers">
                    <div class="weekday-header">Sun</div>
                    <div class="weekday-header">Mon</div>
                    <div class="weekday-header">Tue</div>
                    <div class="weekday-header">Wed</div>
                    <div class="weekday-header">Thu</div>
                    <div class="weekday-header">Fri</div>
                    <div class="weekday-header">Sat</div>
                </div>
                <div class="calendar">
                    ${calendarHtml}
                </div>
                <div class="legend">
                    <span class="legend-label">Activity:</span>
                    <div class="legend-item">
                        <div class="legend-circle intensity-0"></div>
                        <span>None</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-circle intensity-1"></div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-circle intensity-2"></div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-circle intensity-3"></div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-circle intensity-4"></div>
                    </div>
                    <div class="legend-item">
                        <div class="legend-circle intensity-5"></div>
                        <span>Most</span>
                    </div>
                    <div class="legend-item" style="margin-left: 6px;">
                        <div class="legend-today"></div>
                        <span>Today</span>
                    </div>
                </div>
            </div>

            <!-- Horizontal resize handle -->
            <div class="resize-handle-horizontal" id="resizeHandleH"></div>

            <!-- Right: Notes + Statistics -->
            <div class="right-panel">
                <!-- Top: Notes -->
                <div class="notes-panel">
                    <div id="notesSection" class="empty">
                        <div class="empty-state">
                            <div class="empty-state-icon">📅</div>
                            <div class="empty-state-text">Click on a day to view or create notes</div>
                        </div>
                    </div>
                </div>

                <!-- Vertical resize handle -->
                <div class="resize-handle-vertical" id="resizeHandleV"></div>

                <!-- Bottom: Statistics -->
                <div class="statistics-panel">
                    <div class="stats-header">
                        <h3 id="statsTitle">Statistics</h3>
                    </div>
                    <div id="statsContent">
                        <!-- Statistics will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            let currentYear = ${year};
            let currentMonth = ${month};

            // Statistics data
            const statistics = {
                total: ${totalNotes},
                month: ${monthlyStats.month},
                week: ${monthlyStats.week},
                today: ${monthlyStats.today},
                mostActiveDay: ${mostActiveDay ? `{day: ${mostActiveDay.day}, count: ${mostActiveDay.count}}` : 'null'},
                recentActivity: ${JSON.stringify(recentActivity.map(a => ({date: a.date.toISOString(), count: a.count})))}
            };

            let selectedDay = null;

            // Display overview statistics on load
            function showOverviewStatistics() {
                const statsContent = document.getElementById('statsContent');
                const statsTitle = document.getElementById('statsTitle');
                statsTitle.textContent = 'Overview';

                const maxActivity = Math.max(...statistics.recentActivity.map(a => a.count), 1);

                statsContent.innerHTML = \`
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-card-icon">📝</div>
                            <div class="stat-card-value">\${statistics.total}</div>
                            <div class="stat-card-label">Total Notes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">📅</div>
                            <div class="stat-card-value">\${statistics.month}</div>
                            <div class="stat-card-label">This Month</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">📊</div>
                            <div class="stat-card-value">\${statistics.week}</div>
                            <div class="stat-card-label">This Week</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">✨</div>
                            <div class="stat-card-value">\${statistics.today}</div>
                            <div class="stat-card-label">Today</div>
                        </div>
                        <div class="stat-card full-width">
                            <div class="stat-card-icon">🏆</div>
                            <div class="stat-card-label">Most Active Day</div>
                            <div class="stat-detail">
                                \${statistics.mostActiveDay
                                    ? \`<span class="stat-detail-highlight">\${new Date(currentYear, currentMonth, statistics.mostActiveDay.day).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span> with <span class="stat-detail-highlight">\${statistics.mostActiveDay.count}</span> notes\`
                                    : 'No notes this month'}
                            </div>
                        </div>
                        <div class="stat-card full-width">
                            <div class="stat-card-label">Last 7 Days Activity</div>
                            <div class="activity-chart">
                                \${statistics.recentActivity.map(activity => {
                                    const date = new Date(activity.date);
                                    const height = activity.count === 0 ? 4 : Math.max(((activity.count / maxActivity) * 100), 10);
                                    const dayLabel = date.toLocaleDateString('en-US', {weekday: 'short'}).substring(0, 1);
                                    return \`
                                        <div class="activity-bar" style="height: \${height}%;" title="\${date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}: \${activity.count} notes">
                                            <div class="activity-bar-label">\${dayLabel}</div>
                                        </div>
                                    \`;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                \`;
            }

            // Display day-specific statistics
            function showDayStatistics(day, count) {
                const statsContent = document.getElementById('statsContent');
                const statsTitle = document.getElementById('statsTitle');
                const date = new Date(currentYear, currentMonth, day);
                statsTitle.textContent = date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});

                const dayOfWeek = date.toLocaleDateString('en-US', {weekday: 'long'});
                const avgMonthly = statistics.month > 0 ? (statistics.month / new Date(currentYear, currentMonth + 1, 0).getDate()).toFixed(1) : 0;
                const comparison = count > avgMonthly ? 'above' : count < avgMonthly ? 'below' : 'at';

                statsContent.innerHTML = \`
                    <div class="stats-grid">
                        <div class="stat-card full-width">
                            <div class="stat-card-icon">📄</div>
                            <div class="stat-card-value">\${count}</div>
                            <div class="stat-card-label">Notes on this day</div>
                            <div class="stat-detail">
                                \${count > 0 ? \`\${comparison} monthly average of \${avgMonthly}\` : 'No notes created'}
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">📆</div>
                            <div class="stat-card-value">\${dayOfWeek}</div>
                            <div class="stat-card-label">Day of Week</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-icon">📊</div>
                            <div class="stat-card-value">\${statistics.month}</div>
                            <div class="stat-card-label">Month Total</div>
                        </div>
                    </div>
                    <div style="margin-top: 16px; text-align: center;">
                        <button class="create-note-btn" onclick="backToOverview()" style="max-width: 200px; margin: 0 auto;">
                            <span>←</span>
                            <span>Back to Overview</span>
                        </button>
                    </div>
                \`;
            }

            function backToOverview() {
                selectedDay = null;
                showOverviewStatistics();
            }

            // Initialize statistics display
            showOverviewStatistics();

            // ===== RESIZE FUNCTIONALITY =====

            // Restore saved sizes or use defaults
            const state = vscode.getState() || {};
            const savedCalendarWidth = state.calendarWidth || 40;
            const savedNotesHeight = state.notesHeight || 60;

            const calendarPanel = document.querySelector('.calendar-panel');
            const notesPanel = document.querySelector('.notes-panel');
            const rightPanel = document.querySelector('.right-panel');
            const statsPanel = document.querySelector('.statistics-panel');

            // Apply saved sizes
            calendarPanel.style.flex = \`0 0 \${savedCalendarWidth}%\`;
            notesPanel.style.flex = \`1 1 \${savedNotesHeight}%\`;
            statsPanel.style.flex = \`0 1 \${100 - savedNotesHeight}%\`;

            // Horizontal resize (calendar vs right panel)
            const resizeHandleH = document.getElementById('resizeHandleH');
            let isResizingH = false;
            let startXH = 0;
            let startWidthH = 0;

            resizeHandleH.addEventListener('mousedown', (e) => {
                isResizingH = true;
                startXH = e.clientX;
                const containerWidth = document.querySelector('.container').offsetWidth;
                startWidthH = (calendarPanel.offsetWidth / containerWidth) * 100;
                resizeHandleH.classList.add('resizing');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                e.preventDefault();
            });

            // Vertical resize (notes vs statistics)
            const resizeHandleV = document.getElementById('resizeHandleV');
            let isResizingV = false;
            let startYV = 0;
            let startHeightV = 0;

            resizeHandleV.addEventListener('mousedown', (e) => {
                isResizingV = true;
                startYV = e.clientY;
                const rightPanelHeight = rightPanel.offsetHeight;
                startHeightV = (notesPanel.offsetHeight / rightPanelHeight) * 100;
                resizeHandleV.classList.add('resizing');
                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (isResizingH) {
                    const containerWidth = document.querySelector('.container').offsetWidth;
                    const deltaX = e.clientX - startXH;
                    const deltaPercent = (deltaX / containerWidth) * 100;
                    let newWidth = startWidthH + deltaPercent;

                    // Constrain to min/max
                    newWidth = Math.max(25, Math.min(70, newWidth));

                    calendarPanel.style.flex = \`0 0 \${newWidth}%\`;

                    // Save state
                    vscode.setState({ ...vscode.getState(), calendarWidth: newWidth });
                }

                if (isResizingV) {
                    const rightPanelHeight = rightPanel.offsetHeight;
                    const deltaY = e.clientY - startYV;
                    const deltaPercent = (deltaY / rightPanelHeight) * 100;
                    let newHeight = startHeightV + deltaPercent;

                    // Constrain to min/max
                    newHeight = Math.max(20, Math.min(80, newHeight));

                    notesPanel.style.flex = \`1 1 \${newHeight}%\`;
                    statsPanel.style.flex = \`0 1 \${100 - newHeight}%\`;

                    // Save state
                    vscode.setState({ ...vscode.getState(), notesHeight: newHeight });
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizingH) {
                    isResizingH = false;
                    resizeHandleH.classList.remove('resizing');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
                if (isResizingV) {
                    isResizingV = false;
                    resizeHandleV.classList.remove('resizing');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
            });

            // Handle day clicks
            document.querySelectorAll('.day-cell[data-day]').forEach(cell => {
                cell.addEventListener('click', () => {
                    const day = parseInt(cell.dataset.day);
                    const count = parseInt(cell.dataset.count);
                    selectedDay = day;

                    // Update statistics panel
                    showDayStatistics(day, count);

                    // Fetch notes for the day
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
                notesSection.classList.remove('empty');
                notesSection.innerHTML = '';

                // Create notes header
                const notesHeader = document.createElement('div');
                notesHeader.className = 'notes-header';
                notesHeader.innerHTML = \`<h3>Notes for \${dateStr}</h3>\`;
                notesSection.appendChild(notesHeader);

                // Create notes list
                const notesList = document.createElement('div');
                notesList.id = 'notesList';
                notesSection.appendChild(notesList);

                if (notes.length === 0) {
                    notesList.innerHTML = \`
                        <div style="color: var(--vscode-descriptionForeground); margin-bottom: 16px; font-size: 13px;">
                            No notes found for this date.
                        </div>
                        <button class="create-note-btn" onclick="createNewNote(\${year}, \${month}, \${day})">
                            <span style="font-size: 18px;">➕</span>
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
                    createBtn.style.marginTop = '12px';
                    createBtn.innerHTML = \`
                        <span style="font-size: 18px;">➕</span>
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
