import * as vscode from 'vscode';
import { getNotesPath } from '../services/configService';
import { ActivityService } from '../services/activityService';
import { LinkService } from '../services/linkService';
import { TagService } from '../services/tagService';
import { getDayOfWeekAnalysis, getGrowthData } from '../calendar/calendarHelpers';
import { THEME_COLORS } from '../constants/themeColors';

/**
 * Show the activity view webview
 */
export async function showActivityView(
    context: vscode.ExtensionContext,
    linkService: LinkService,
    tagService: TagService
): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please configure a notes folder first');
        return;
    }

    const activityService = new ActivityService(linkService, tagService);

    // Collect activity data
    const weeklyData = await activityService.getWeeklyActivity(12);
    const stats = await activityService.getActivityStats();

    // Collect additional analysis data
    const dayOfWeekAnalysis = await getDayOfWeekAnalysis(notesPath);
    const growthData = await getGrowthData(notesPath, 6);

    const panel = vscode.window.createWebviewPanel(
        'notedActivity',
        'Platform Activity',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Set the initial HTML
    panel.webview.html = getActivityHtml(weeklyData, stats, dayOfWeekAnalysis, growthData);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'refresh':
                    // Rebuild the activity data and update the view
                    const newWeeklyData = await activityService.getWeeklyActivity(12);
                    const newStats = await activityService.getActivityStats();
                    panel.webview.postMessage({
                        command: 'updateActivity',
                        weeklyData: newWeeklyData,
                        stats: newStats
                    });
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Generate the HTML content for the activity webview
 */
function getActivityHtml(weeklyData: any[], stats: any, dayOfWeekAnalysis: any[], growthData: any[]): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Platform Activity</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
            body {
                font-family: var(--vscode-font-family);
                padding: 20px;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }

            .header-meta {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .live-badge {
                background: ${THEME_COLORS.accent.primaryFaint};
                border: 1px solid ${THEME_COLORS.accent.primaryBorder};
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: ${THEME_COLORS.accent.primary};
            }

            .time-period {
                font-size: 13px;
                color: var(--vscode-descriptionForeground);
            }

            .chart-container {
                position: relative;
                height: 400px;
                margin-bottom: 30px;
                background: ${THEME_COLORS.purple.gradientFaint};
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 20px;
            }

            .legend-container {
                display: flex;
                justify-content: center;
                gap: 24px;
                margin-bottom: 30px;
                padding: 16px;
                background: ${THEME_COLORS.purple.gradientLight};
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
            }

            .legend-color {
                width: 32px;
                height: 12px;
                border-radius: 2px;
            }

            .legend-color.notes {
                background: ${THEME_COLORS.activity.notes.fill};
            }

            .legend-color.links {
                background: ${THEME_COLORS.activity.links.fill};
            }

            .legend-color.tags {
                background: ${THEME_COLORS.activity.tags.fill};
            }

            .legend-label {
                font-weight: 500;
                color: var(--vscode-foreground);
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 30px;
            }

            .stat-card {
                background: ${THEME_COLORS.purple.gradientMedium};
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 20px;
                transition: all 0.2s ease;
            }

            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px ${THEME_COLORS.chart.shadowColor};
                border-color: var(--vscode-focusBorder);
            }

            .stat-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 8px;
                font-weight: 600;
            }

            .stat-value {
                font-size: 32px;
                font-weight: 700;
                color: var(--vscode-foreground);
                margin-bottom: 4px;
            }

            .stat-average {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
            }

            .stat-average-value {
                font-weight: 600;
                color: var(--vscode-textLink-foreground);
            }

            .footer-note {
                text-align: center;
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                margin-top: 20px;
                font-style: italic;
            }

            .helper-text {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 12px;
                padding: 8px 12px;
                background: ${THEME_COLORS.chart.helperBackground};
                border-left: 3px solid ${THEME_COLORS.chart.helperBorder};
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Platform Activity</h1>
            <div class="header-meta">
                <div class="live-badge">Live</div>
                <div class="time-period">Last 12 weeks · Production environment</div>
            </div>
        </div>

        <div class="helper-text">
            ℹ️ Hover over the chart to see detailed counts. Click legend items to toggle layers.
        </div>

        <div class="chart-container">
            <canvas id="activityChart"></canvas>
        </div>

        <div class="legend-container">
            <div class="legend-item">
                <div class="legend-color notes"></div>
                <div class="legend-label">Notes Created</div>
            </div>
            <div class="legend-item">
                <div class="legend-color links"></div>
                <div class="legend-label">Links Created</div>
            </div>
            <div class="legend-item">
                <div class="legend-color tags"></div>
                <div class="legend-label">Tags Added</div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Notes</div>
                <div class="stat-value">${stats.totalNotes}</div>
                <div class="stat-average">Avg: <span class="stat-average-value">${stats.avgNotesPerWeek}/week</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Links</div>
                <div class="stat-value">${stats.totalLinks}</div>
                <div class="stat-average">Avg: <span class="stat-average-value">${stats.avgLinksPerWeek}/week</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Tags</div>
                <div class="stat-value">${stats.totalTags}</div>
                <div class="stat-average">Avg: <span class="stat-average-value">${stats.avgTagsPerWeek}/week</span></div>
            </div>
        </div>

        <div class="chart-container">
            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📅 Day of Week Patterns</h2>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--vscode-descriptionForeground);">When you write most</p>
            <canvas id="dayOfWeekChart"></canvas>
        </div>

        <div class="chart-container">
            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📈 Growth Over Time</h2>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--vscode-descriptionForeground);">Cumulative notes</p>
            <canvas id="growthChart"></canvas>
        </div>

        <div class="footer-note">
            Data is inferred from file creation and modification times. Click "Refresh" to update.
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            // Activity data
            const weeklyData = ${JSON.stringify(weeklyData)};
            const dayOfWeekAnalysis = ${JSON.stringify(dayOfWeekAnalysis)};
            const growthData = ${JSON.stringify(growthData)};

            // Prepare chart data
            const labels = weeklyData.map(w => w.weekLabel);
            const notesData = weeklyData.map(w => w.notesCreated);
            const linksData = weeklyData.map(w => w.linksCreated);
            const tagsData = weeklyData.map(w => w.tagsAdded);

            // Get computed VS Code theme colors
            const computedStyle = getComputedStyle(document.body);
            const foregroundColor = computedStyle.getPropertyValue('--vscode-foreground').trim() || '#cccccc';

            // Create the chart
            const ctx = document.getElementById('activityChart').getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Notes Created',
                            data: notesData,
                            backgroundColor: '${THEME_COLORS.activity.notes.fill}',
                            borderColor: '${THEME_COLORS.activity.notes.border}',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: '${THEME_COLORS.activity.notes.hover}',
                            pointHoverBorderColor: '#fff',
                            pointHoverBorderWidth: 2
                        },
                        {
                            label: 'Links Created',
                            data: linksData,
                            backgroundColor: '${THEME_COLORS.activity.links.fill}',
                            borderColor: '${THEME_COLORS.activity.links.border}',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: '${THEME_COLORS.activity.links.hover}',
                            pointHoverBorderColor: '#fff',
                            pointHoverBorderWidth: 2
                        },
                        {
                            label: 'Tags Added',
                            data: tagsData,
                            backgroundColor: '${THEME_COLORS.activity.tags.fill}',
                            borderColor: '${THEME_COLORS.activity.tags.border}',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: '${THEME_COLORS.activity.tags.hover}',
                            pointHoverBorderColor: '#fff',
                            pointHoverBorderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: '${THEME_COLORS.chart.tooltipBackground}',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '${THEME_COLORS.accent.primaryGlow}',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                title: function(context) {
                                    const index = context[0].dataIndex;
                                    const week = weeklyData[index];
                                    const startDate = new Date(week.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    const endDate = new Date(week.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    return \`Week \${week.weekNumber} (\${startDate} - \${endDate})\`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: '${THEME_COLORS.chart.gridColor}',
                                drawBorder: false
                            },
                            ticks: {
                                color: foregroundColor,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            stacked: true,
                            grid: {
                                color: '${THEME_COLORS.chart.gridColor}',
                                drawBorder: false
                            },
                            ticks: {
                                color: foregroundColor,
                                font: {
                                    size: 11
                                },
                                callback: function(value) {
                                    return Math.floor(value);
                                }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

            // Initialize Day of Week Chart
            const dayOfWeekCtx = document.getElementById('dayOfWeekChart').getContext('2d');
            const dayOfWeekLabels = dayOfWeekAnalysis.map(d => d.day);
            const dayOfWeekData = dayOfWeekAnalysis.map(d => d.count);
            const todayDayOfWeek = new Date().getDay();

            new Chart(dayOfWeekCtx, {
                type: 'bar',
                data: {
                    labels: dayOfWeekLabels,
                    datasets: [{
                        label: 'Notes',
                        data: dayOfWeekData,
                        backgroundColor: dayOfWeekData.map((_, index) =>
                            index === todayDayOfWeek ? '${THEME_COLORS.activity.notes.border}' : '${THEME_COLORS.activity.notes.fill}'
                        ),
                        borderColor: '${THEME_COLORS.activity.notes.border}',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: '${THEME_COLORS.chart.tooltipBackground}',
                            padding: 10,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: foregroundColor,
                                font: { size: 11 }
                            }
                        },
                        y: {
                            grid: {
                                color: '${THEME_COLORS.chart.gridColor}',
                                drawBorder: false
                            },
                            ticks: {
                                color: foregroundColor,
                                font: { size: 11 }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

            // Initialize Growth Over Time Chart
            const growthCtx = document.getElementById('growthChart').getContext('2d');
            const growthLabels = growthData.map(g => g.month);
            const growthDataPoints = growthData.map(g => g.cumulative);

            new Chart(growthCtx, {
                type: 'line',
                data: {
                    labels: growthLabels,
                    datasets: [{
                        label: 'Cumulative Notes',
                        data: growthDataPoints,
                        backgroundColor: '${THEME_COLORS.activity.links.fill}',
                        borderColor: '${THEME_COLORS.activity.links.border}',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '${THEME_COLORS.activity.links.hover}',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: '${THEME_COLORS.chart.tooltipBackground}',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '${THEME_COLORS.accent.primaryGlow}',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            callbacks: {
                                title: function(context) {
                                    return context[0].label;
                                },
                                label: function(context) {
                                    const total = context.parsed.y;
                                    return 'Total: ' + (total === 1 ? '1 note' : total + ' notes');
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: '${THEME_COLORS.chart.gridColor}',
                                drawBorder: false
                            },
                            ticks: {
                                color: foregroundColor,
                                font: { size: 11 }
                            }
                        },
                        y: {
                            grid: {
                                color: '${THEME_COLORS.chart.gridColor}',
                                drawBorder: false
                            },
                            ticks: {
                                color: foregroundColor,
                                font: { size: 11 }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

            // Listen for messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateActivity') {
                    // Update chart with new data
                    const newWeeklyData = message.weeklyData;
                    const newStats = message.stats;

                    chart.data.labels = newWeeklyData.map(w => w.weekLabel);
                    chart.data.datasets[0].data = newWeeklyData.map(w => w.notesCreated);
                    chart.data.datasets[1].data = newWeeklyData.map(w => w.linksCreated);
                    chart.data.datasets[2].data = newWeeklyData.map(w => w.tagsAdded);
                    chart.update();

                    // Update stats (would need to update DOM elements)
                    console.log('Stats updated', newStats);
                }
            });
        </script>
    </body>
    </html>`;
}
