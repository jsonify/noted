import * as vscode from 'vscode';
import { getNotesPath, getFileFormat } from '../services/configService';
import { getNotesForDate, openNoteForDate, countNotesForDate, isTodayDate, getTotalNotesCount, getMonthlyStats, getMostActiveDay, getRecentActivity, getCurrentStreak, getLongestStreak, getStreakHeatmap, getMonthlyTrend, getTimeOfDayAnalysis, getOnThisDayMemories, getPerfectWeekData } from './calendarHelpers';
import { THEME_COLORS } from '../constants/themeColors';

/**
 * Show the calendar view webview
 */
export async function showCalendarView(
    context: vscode.ExtensionContext
): Promise<void> {
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

    // Calculate streak and widget data in parallel for better performance
    const [
        currentStreak,
        longestStreak,
        streakHeatmap,
        timeOfDayData,
        onThisDayMemories,
        perfectWeekData
    ] = await Promise.all([
        getCurrentStreak(notesPath),
        getLongestStreak(notesPath),
        getStreakHeatmap(notesPath, 30),
        getTimeOfDayAnalysis(notesPath),
        getOnThisDayMemories(notesPath),
        getPerfectWeekData(notesPath)
    ]);

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
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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

            /* Left panel - Calendar + Notes */
            .left-panel {
                flex: 0 0 40%;
                min-width: 300px;
                max-width: 70%;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding-right: 12px;
            }

            /* Calendar section - top of left side */
            .calendar-section {
                flex: 1 1 60%;
                min-height: 200px;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                overflow-x: hidden;
                background: linear-gradient(135deg, rgba(120, 100, 200, 0.08), rgba(140, 120, 240, 0.03));
                border: 1px solid var(--vscode-panel-border);
                border-radius: 12px;
                padding: 12px;
                margin-bottom: 8px;
            }

            /* Notes panel - bottom of left side */
            .notes-panel {
                flex: 0 1 40%;
                min-height: 150px;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                background: linear-gradient(135deg, rgba(120, 100, 200, 0.08), rgba(140, 120, 240, 0.03));
                border: 1px solid var(--vscode-panel-border);
                border-radius: 12px;
                padding: 12px;
                margin-top: 8px;
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

            /* Right panel - All statistics */
            .right-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                padding-left: 12px;
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
                overflow: hidden;
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
                padding: 12px 12px 22px 12px;
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

            /* Streak section */
            .streak-section {
                margin-bottom: 16px;
                padding: 16px;
                background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 140, 107, 0.05));
                border: 1px solid rgba(255, 107, 107, 0.3);
                border-radius: 12px;
                position: relative;
                overflow: hidden;
            }
            .streak-section::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #ff6b6b, #ff8c6b, #ffa06b);
            }
            .streak-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            .streak-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--vscode-foreground);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .streak-icon {
                font-size: 20px;
                animation: flameFlicker 1.5s ease-in-out infinite;
            }
            @keyframes flameFlicker {
                0%, 100% { transform: scale(1) rotate(-5deg); }
                50% { transform: scale(1.1) rotate(5deg); }
            }
            .streak-values {
                display: flex;
                gap: 16px;
                margin-bottom: 12px;
            }
            .streak-current {
                flex: 1;
                text-align: center;
                padding: 12px;
                background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 140, 107, 0.1));
                border-radius: 8px;
                border: 2px solid rgba(255, 107, 107, 0.4);
            }
            .streak-current.active {
                animation: streakPulse 2s ease-in-out infinite;
            }
            @keyframes streakPulse {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
                }
                50% {
                    box-shadow: 0 0 0 8px rgba(255, 107, 107, 0);
                }
            }
            .streak-longest {
                flex: 1;
                text-align: center;
                padding: 12px;
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.05));
                border-radius: 8px;
                border: 2px solid rgba(255, 215, 0, 0.3);
            }
            .streak-value {
                font-size: 32px;
                font-weight: 700;
                line-height: 1;
                margin-bottom: 4px;
            }
            .streak-current .streak-value {
                color: #ff6b6b;
            }
            .streak-longest .streak-value {
                color: #ffd700;
            }
            .streak-label {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--vscode-descriptionForeground);
                font-weight: 600;
            }
            .streak-heatmap {
                display: flex;
                gap: 3px;
                justify-content: center;
                flex-wrap: wrap;
                padding: 8px 0;
            }
            .streak-day {
                width: 14px;
                height: 14px;
                border-radius: 3px;
                background: rgba(100, 100, 120, 0.15);
                border: 1px solid rgba(128, 128, 128, 0.2);
                transition: all 0.2s ease;
                position: relative;
            }
            .streak-day.has-note {
                background: linear-gradient(135deg, rgba(255, 107, 107, 0.8), rgba(255, 140, 107, 0.6));
                border-color: rgba(255, 107, 107, 0.6);
            }
            .streak-day.today {
                border: 2px solid var(--vscode-focusBorder);
                box-shadow: 0 0 6px rgba(100, 180, 255, 0.5);
            }
            .streak-day:hover {
                transform: scale(1.3);
                z-index: 10;
            }
            .streak-day:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                padding: 4px 8px;
                background: var(--vscode-editorHoverWidget-background);
                border: 1px solid var(--vscode-editorHoverWidget-border);
                border-radius: 4px;
                font-size: 10px;
                white-space: nowrap;
                pointer-events: none;
                z-index: 20;
                margin-bottom: 4px;
            }
            .streak-message {
                text-align: center;
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                margin-top: 8px;
                font-style: italic;
            }
            .streak-message.encouraging {
                color: #ff6b6b;
                font-weight: 600;
            }

            /* Widget Sections */
            .widget-section {
                margin-bottom: 16px;
                padding: 16px;
                background: linear-gradient(135deg, rgba(120, 100, 200, 0.08), rgba(140, 120, 240, 0.03));
                border: 1px solid var(--vscode-panel-border);
                border-radius: 12px;
                transition: all 0.2s ease;
            }
            .widget-section:hover {
                border-color: var(--vscode-focusBorder);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .widget-header {
                margin-bottom: 12px;
            }
            .widget-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--vscode-foreground);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .widget-icon {
                font-size: 18px;
            }

            /* Time of Day Chart */
            .time-of-day-chart {
                position: relative;
                display: flex;
                align-items: flex-end;
                height: 80px;
                gap: 1px;
                padding: 24px 8px 28px 8px;
            }
            .time-bar-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                height: 100%;
                position: relative;
            }
            .time-bar {
                width: 100%;
                background: linear-gradient(to top, rgba(140, 120, 240, 0.7), rgba(150, 130, 255, 0.5));
                border-radius: 2px 2px 0 0;
                transition: all 0.2s ease;
            }
            .time-bar:hover {
                background: linear-gradient(to top, rgba(150, 130, 255, 1), rgba(160, 140, 255, 0.8));
                transform: scaleY(1.1);
            }
            .time-label {
                position: absolute;
                bottom: -20px;
                font-size: 8px;
                color: var(--vscode-descriptionForeground);
                font-weight: 500;
                white-space: nowrap;
            }
            .time-peak {
                position: absolute;
                bottom: 4px;
                right: 8px;
                font-size: 10px;
                font-weight: 600;
                color: rgba(150, 130, 255, 1);
                background: rgba(0, 0, 0, 0.3);
                padding: 3px 8px;
                border-radius: 4px;
            }

            /* Perfect Week Section */
            .perfect-week-content {
                padding: 4px 0;
            }
            .week-labels {
                display: flex;
                gap: 4px;
                margin-bottom: 6px;
            }
            .week-label {
                flex: 1;
                text-align: center;
                font-size: 9px;
                font-weight: 600;
                color: var(--vscode-descriptionForeground);
            }
            .week-days {
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
            }
            .week-day {
                flex: 1;
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                border-radius: 6px;
                background: rgba(100, 100, 120, 0.1);
                border: 1px solid rgba(128, 128, 128, 0.2);
                transition: all 0.2s ease;
            }
            .week-day.complete {
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(56, 142, 60, 0.2));
                border-color: rgba(76, 175, 80, 0.5);
            }
            .week-day:hover {
                transform: scale(1.1);
            }
            .week-progress {
                text-align: center;
                font-size: 12px;
                font-weight: 600;
                color: var(--vscode-foreground);
                margin-bottom: 6px;
            }
            .week-stats {
                text-align: center;
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
            }

            /* Memories Section */
            .memories-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .memory-year {
                padding: 10px 12px;
                background: rgba(100, 180, 255, 0.05);
                border-left: 3px solid rgba(100, 180, 255, 0.4);
                border-radius: 4px;
            }
            .memory-header {
                font-size: 11px;
                font-weight: 600;
                color: var(--vscode-foreground);
                margin-bottom: 6px;
            }
            .memory-note {
                font-size: 12px;
                color: var(--vscode-textLink-foreground);
                padding: 4px 0;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .memory-note:hover {
                color: var(--vscode-textLink-activeForeground);
                transform: translateX(4px);
            }
            .memory-more {
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
                padding-top: 4px;
            }
            .empty-message {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
                text-align: center;
                padding: 20px;
            }

            /* Chart Sections */
            .chart-section {
                margin-bottom: 16px;
                padding: 12px;
                background: linear-gradient(135deg, rgba(120, 100, 200, 0.08), rgba(140, 120, 240, 0.03));
                border: 1px solid var(--vscode-panel-border);
                border-radius: 12px;
            }
            .chart-header {
                margin-bottom: 8px;
            }
            .chart-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--vscode-foreground);
                margin-bottom: 2px;
            }
            .chart-subtitle {
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Monthly Trend Chart */
            .trend-chart {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                height: 120px;
                gap: 8px;
                padding-top: 24px;
                position: relative;
            }
            .trend-bar-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                height: 100%;
            }
            .trend-bar {
                width: 100%;
                background: linear-gradient(to top, rgba(140, 120, 240, 0.8), rgba(150, 130, 255, 0.6));
                border-radius: 4px 4px 0 0;
                min-height: 4px;
                transition: all 0.3s ease;
                position: relative;
                display: flex;
                align-items: flex-start;
                justify-content: center;
            }
            .trend-bar.current {
                background: linear-gradient(to top, rgba(100, 180, 255, 0.9), rgba(120, 190, 255, 0.7));
                box-shadow: 0 0 12px rgba(100, 180, 255, 0.4);
            }
            .trend-bar:hover {
                background: linear-gradient(to top, rgba(150, 130, 255, 1), rgba(160, 140, 255, 0.8));
                transform: scaleY(1.05);
            }
            .trend-value {
                position: absolute;
                top: -18px;
                font-size: 10px;
                font-weight: 600;
                color: var(--vscode-foreground);
            }
            .trend-label {
                margin-top: 4px;
                font-size: 9px;
                color: var(--vscode-descriptionForeground);
                font-weight: 500;
            }

            /* Day of Week Chart */
            .dow-chart {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                height: 120px;
                gap: 6px;
                padding-top: 24px;
            }
            .dow-bar-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                height: 100%;
            }
            .dow-bar {
                width: 100%;
                background: linear-gradient(to top, rgba(120, 100, 200, 0.7), rgba(140, 120, 240, 0.5));
                border-radius: 4px 4px 0 0;
                min-height: 4px;
                transition: all 0.3s ease;
                position: relative;
                display: flex;
                align-items: flex-start;
                justify-content: center;
            }
            .dow-bar.today {
                background: linear-gradient(to top, rgba(255, 215, 0, 0.8), rgba(255, 225, 100, 0.6));
                box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
            }
            .dow-bar:hover {
                background: linear-gradient(to top, rgba(140, 120, 240, 1), rgba(150, 130, 255, 0.8));
                transform: scaleY(1.05);
            }
            .dow-value {
                position: absolute;
                top: -18px;
                font-size: 10px;
                font-weight: 600;
                color: var(--vscode-foreground);
            }
            .dow-label {
                margin-top: 4px;
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
                font-weight: 600;
            }

            /* Growth Chart */
            .growth-chart {
                position: relative;
                height: 100px;
                margin-bottom: 24px;
            }
            .growth-chart svg {
                width: 100%;
                height: 100%;
            }
            .growth-labels {
                display: flex;
                justify-content: space-between;
                margin-top: 4px;
            }
            .growth-label {
                font-size: 9px;
                color: var(--vscode-descriptionForeground);
                font-weight: 500;
            }
            .growth-total {
                position: absolute;
                top: 8px;
                right: 8px;
                font-size: 11px;
                font-weight: 600;
                color: rgba(160, 140, 255, 1);
                background: rgba(0, 0, 0, 0.3);
                padding: 4px 8px;
                border-radius: 4px;
            }

            /* Insights Section */
            .insights-section {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-top: 8px;
            }
            .insight-card {
                background: linear-gradient(135deg, rgba(140, 120, 240, 0.1), rgba(150, 130, 255, 0.05));
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.2s ease;
            }
            .insight-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                border-color: var(--vscode-focusBorder);
            }
            .insight-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            .insight-content {
                flex: 1;
                min-width: 0;
            }
            .insight-title {
                font-size: 9px;
                color: var(--vscode-descriptionForeground);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 2px;
            }
            .insight-value {
                font-size: 14px;
                font-weight: 700;
                color: var(--vscode-foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
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
            <!-- Left: Calendar + Notes -->
            <div class="left-panel">
                <!-- Top: Calendar -->
                <div class="calendar-section">
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

                <!-- Vertical resize handle for left panel -->
                <div class="resize-handle-vertical" id="resizeHandleVLeft"></div>

                <!-- Bottom: Notes -->
                <div class="notes-panel">
                    <div id="notesSection" class="empty">
                        <div class="empty-state">
                            <div class="empty-state-icon">📅</div>
                            <div class="empty-state-text">Click on a day to view or create notes</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Horizontal resize handle -->
            <div class="resize-handle-horizontal" id="resizeHandleH"></div>

            <!-- Right: All Statistics -->
            <div class="right-panel">
                <div class="stats-header">
                    <h3 id="statsTitle">Statistics</h3>
                </div>
                <div id="statsContent">
                    <!-- Statistics will be populated by JavaScript -->
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
                recentActivity: ${JSON.stringify(recentActivity.map(a => ({date: a.date.toISOString(), count: a.count})))},
                currentStreak: ${currentStreak},
                longestStreak: ${longestStreak},
                streakHeatmap: ${JSON.stringify(streakHeatmap.map(h => ({date: h.date.toISOString(), count: h.count, hasNote: h.hasNote})))},
                timeOfDayData: ${JSON.stringify(timeOfDayData)},
                onThisDayMemories: ${JSON.stringify(onThisDayMemories)},
                perfectWeekData: ${JSON.stringify(perfectWeekData)}
            };

            let selectedDay = null;

            // Helper: Render streak heatmap HTML
            function renderStreakHeatmap() {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return statistics.streakHeatmap.map(day => {
                    const date = new Date(day.date);
                    const isToday = date.toDateString() === today.toDateString();
                    const classes = ['streak-day'];
                    if (day.hasNote) {classes.push('has-note');}
                    if (isToday) {classes.push('today');}
                    const tooltip = \`\${date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}: \${day.count} note\${day.count !== 1 ? 's' : ''}\`;
                    return \`<div class="\${classes.join(' ')}" data-tooltip="\${tooltip}"></div>\`;
                }).join('');
            }

            // Helper: Get encouraging streak message
            function getStreakMessage() {
                if (statistics.currentStreak === 0) {
                    return 'Start your streak today!';
                } else if (statistics.currentStreak === 1) {
                    return 'Great start! Keep it going tomorrow! 💪';
                } else if (statistics.currentStreak < 7) {
                    return \`\${statistics.currentStreak} days strong! Keep the momentum! 🚀\`;
                } else if (statistics.currentStreak < 30) {
                    return \`Amazing! \${statistics.currentStreak} days! You're on fire! 🔥\`;
                } else {
                    return \`Incredible! \${statistics.currentStreak} days! You're a note-taking legend! 🏆\`;
                }
            }

            // Helper: Render time-of-day heatmap
            function renderTimeOfDayHeatmap() {
                const data = statistics.timeOfDayData || [];
                const maxCount = Math.max(...data.map(d => d.count), 1);

                // Find peak hours
                const peakHour = data.reduce((max, d) => d.count > max.count ? d : max, {hour: 0, count: 0, percentage: 0});
                const peakLabel = peakHour.hour === 0 ? '12 AM' :
                                 peakHour.hour < 12 ? \`\${peakHour.hour} AM\` :
                                 peakHour.hour === 12 ? '12 PM' : \`\${peakHour.hour - 12} PM\`;

                return data.map(d => {
                    const height = maxCount > 0 ? Math.max((d.count / maxCount) * 100, 2) : 2;
                    const label = d.hour === 0 ? '12a' : d.hour < 12 ? \`\${d.hour}a\` : d.hour === 12 ? '12p' : \`\${d.hour - 12}p\`;
                    return \`<div class="time-bar-container" title="\${label}: \${d.count} notes (\${d.percentage}%)">
                        <div class="time-bar" style="height: \${height}%"></div>
                        \${d.hour % 3 === 0 ? \`<div class="time-label">\${label}</div>\` : ''}
                    </div>\`;
                }).join('') + \`<div class="time-peak">Peak: \${peakLabel} (\${peakHour.percentage}%)</div>\`;
            }

            // Helper: Render "On This Day" memories
            function renderOnThisDayMemories() {
                const memories = statistics.onThisDayMemories || [];
                if (memories.length === 0) {
                    return '<div class="empty-message">No notes from previous years on this date</div>';
                }

                return memories.slice(0, 3).map(m => {
                    const yearsAgo = new Date().getFullYear() - m.year;
                    return \`<div class="memory-year">
                        <div class="memory-header">🕐 \${yearsAgo} year\${yearsAgo !== 1 ? 's' : ''} ago (\${m.year})</div>
                        \${m.notes.slice(0, 2).map(n =>
                            \`<div class="memory-note" data-path="\${n.path}">• \${n.name}</div>\`
                        ).join('')}
                        \${m.notes.length > 2 ? \`<div class="memory-more">+\${m.notes.length - 2} more</div>\` : ''}
                    </div>\`;
                }).join('');
            }

            // Helper: Render perfect week tracker
            function renderPerfectWeekTracker() {
                const weekData = statistics.perfectWeekData || {daysWithNotes: [], daysComplete: 0, totalDays: 7, perfectWeeksThisMonth: 0};
                const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

                const daysHtml = weekData.daysWithNotes.map((hasNote, i) =>
                    \`<div class="week-day \${hasNote ? 'complete' : ''}">\${hasNote ? '✅' : '⭕'}</div>\`
                ).join('');

                return \`
                    <div class="week-labels">\${dayLabels.map(l => \`<div class="week-label">\${l}</div>\`).join('')}</div>
                    <div class="week-days">\${daysHtml}</div>
                    <div class="week-progress">\${weekData.daysComplete}/\${weekData.totalDays} days • Keep going! 🔥</div>
                    <div class="week-stats">Perfect weeks this month: \${weekData.perfectWeeksThisMonth}</div>
                \`;
            }

            // Display overview statistics on load
            function showOverviewStatistics() {
                const statsContent = document.getElementById('statsContent');
                const statsTitle = document.getElementById('statsTitle');
                statsTitle.textContent = 'Insights';

                const streakHeatmapHtml = renderStreakHeatmap();
                const streakMessage = getStreakMessage();
                const timeOfDayHtml = renderTimeOfDayHeatmap();
                const memoriesHtml = renderOnThisDayMemories();
                const perfectWeekHtml = renderPerfectWeekTracker();

                statsContent.innerHTML = \`
                    <div class="widget-section streak-section">
                        <div class="widget-header">
                            <div class="widget-title">
                                <span class="widget-icon">\${statistics.currentStreak > 0 ? '🔥' : '📝'}</span>
                                <span>Daily Streak</span>
                            </div>
                        </div>
                        <div class="streak-values">
                            <div class="streak-current \${statistics.currentStreak > 0 ? 'active' : ''}">
                                <div class="streak-value">\${statistics.currentStreak}</div>
                                <div class="streak-label">Current Streak</div>
                            </div>
                            <div class="streak-longest">
                                <div class="streak-value">\${statistics.longestStreak}</div>
                                <div class="streak-label">Best Streak</div>
                            </div>
                        </div>
                        <div class="streak-heatmap">
                            \${streakHeatmapHtml}
                        </div>
                        <div class="streak-message \${statistics.currentStreak > 0 ? 'encouraging' : ''}">
                            \${streakMessage}
                        </div>
                    </div>

                    <div class="widget-section time-of-day-section">
                        <div class="widget-header">
                            <div class="widget-title">
                                <span class="widget-icon">⏰</span>
                                <span>Your Writing Hours</span>
                            </div>
                        </div>
                        <div class="time-of-day-chart">
                            \${timeOfDayHtml}
                        </div>
                    </div>

                    <div class="widget-section perfect-week-section">
                        <div class="widget-header">
                            <div class="widget-title">
                                <span class="widget-icon">🏆</span>
                                <span>Perfect Week</span>
                            </div>
                        </div>
                        <div class="perfect-week-content">
                            \${perfectWeekHtml}
                        </div>
                    </div>

                    <div class="widget-section memories-section">
                        <div class="widget-header">
                            <div class="widget-title">
                                <span class="widget-icon">📅</span>
                                <span>On This Day...</span>
                            </div>
                        </div>
                        <div class="memories-content">
                            \${memoriesHtml}
                        </div>
                    </div>
                \`;

                // Add click handlers for memory notes
                document.querySelectorAll('.memory-note').forEach(note => {
                    note.addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'openNote',
                            filePath: note.getAttribute('data-path')
                        });
                    });
                });
            }


            // Initialize statistics display
            showOverviewStatistics();

            // ===== RESIZE FUNCTIONALITY =====

            // Restore saved sizes or use defaults
            const state = vscode.getState() || {};
            const savedLeftWidth = state.leftWidth || 40;
            const savedCalendarHeight = state.calendarHeight || 60;

            const leftPanel = document.querySelector('.left-panel');
            const calendarSection = document.querySelector('.calendar-section');
            const notesPanel = document.querySelector('.notes-panel');

            // Apply saved sizes
            leftPanel.style.flex = \`0 0 \${savedLeftWidth}%\`;
            calendarSection.style.flex = \`1 1 \${savedCalendarHeight}%\`;
            notesPanel.style.flex = \`0 1 \${100 - savedCalendarHeight}%\`;

            // Horizontal resize (left panel vs right panel)
            const resizeHandleH = document.getElementById('resizeHandleH');
            let isResizingH = false;
            let startXH = 0;
            let startWidthH = 0;

            resizeHandleH.addEventListener('mousedown', (e) => {
                isResizingH = true;
                startXH = e.clientX;
                const containerWidth = document.querySelector('.container').offsetWidth;
                startWidthH = (leftPanel.offsetWidth / containerWidth) * 100;
                resizeHandleH.classList.add('resizing');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                e.preventDefault();
            });

            // Vertical resize (calendar vs notes within left panel)
            const resizeHandleVLeft = document.getElementById('resizeHandleVLeft');
            let isResizingVLeft = false;
            let startYVLeft = 0;
            let startHeightVLeft = 0;

            resizeHandleVLeft.addEventListener('mousedown', (e) => {
                isResizingVLeft = true;
                startYVLeft = e.clientY;
                const leftPanelHeight = leftPanel.offsetHeight;
                startHeightVLeft = (calendarSection.offsetHeight / leftPanelHeight) * 100;
                resizeHandleVLeft.classList.add('resizing');
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

                    leftPanel.style.flex = \`0 0 \${newWidth}%\`;

                    // Save state
                    vscode.setState({ ...vscode.getState(), leftWidth: newWidth });
                }

                if (isResizingVLeft) {
                    const leftPanelHeight = leftPanel.offsetHeight;
                    const deltaY = e.clientY - startYVLeft;
                    const deltaPercent = (deltaY / leftPanelHeight) * 100;
                    let newHeight = startHeightVLeft + deltaPercent;

                    // Constrain to min/max
                    newHeight = Math.max(20, Math.min(80, newHeight));

                    calendarSection.style.flex = \`1 1 \${newHeight}%\`;
                    notesPanel.style.flex = \`0 1 \${100 - newHeight}%\`;

                    // Save state
                    vscode.setState({ ...vscode.getState(), calendarHeight: newHeight });
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizingH) {
                    isResizingH = false;
                    resizeHandleH.classList.remove('resizing');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
                if (isResizingVLeft) {
                    isResizingVLeft = false;
                    resizeHandleVLeft.classList.remove('resizing');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
            });

            // Handle day clicks
            document.querySelectorAll('.day-cell[data-day]').forEach(cell => {
                cell.addEventListener('click', () => {
                    const day = parseInt(cell.dataset.day);
                    selectedDay = day;

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
