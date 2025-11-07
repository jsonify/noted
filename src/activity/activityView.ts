import * as vscode from 'vscode';
import { getNotesPath } from '../services/configService';
import { ActivityService, WeeklyActivity, HourlyActivity } from '../services/activityService';
import { LinkService } from '../services/linkService';
import { TagService } from '../services/tagService';
import { getGrowthData } from '../calendar/calendarHelpers';
import { THEME_COLORS } from '../constants/themeColors';

interface ActivityStats {
    totalNotes: number;
    totalTags: number;
    totalLinks: number;
    avgNotesPerWeek: number;
    avgTagsPerWeek: number;
    avgLinksPerWeek: number;
}

interface GrowthData {
    month: string;
    year: number;
    cumulative: number;
}

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
    const hourlyData = await activityService.getHourlyActivity();

    // Collect additional analysis data
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
    panel.webview.html = getActivityHtml(weeklyData, stats, hourlyData, growthData);

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
function getActivityHtml(weeklyData: WeeklyActivity[], stats: ActivityStats, hourlyData: HourlyActivity[], growthData: GrowthData[]): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Platform Activity</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            html, body {
                height: 100%;
                overflow: hidden;
            }

            body {
                font-family: var(--vscode-font-family);
                padding: 12px;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }

            .container {
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }

            .header h1 {
                font-size: 18px;
                font-weight: 600;
            }

            .header-meta {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .live-badge {
                background: ${THEME_COLORS.accent.primaryFaint};
                border: 1px solid ${THEME_COLORS.accent.primaryBorder};
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: ${THEME_COLORS.accent.primary};
            }

            .time-period {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
            }

            .chart-container {
                position: relative;
                background: ${THEME_COLORS.purple.gradientFaint};
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .chart-container.main {
                flex: 1.2;
                min-height: 0;
            }

            .chart-container.secondary {
                flex: 1;
                min-height: 0;
            }

            .chart-wrapper {
                position: relative;
                flex: 1;
                min-height: 0;
                width: 100%;
            }

            .chart-wrapper canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100% !important;
                height: 100% !important;
            }

            .legend-container {
                display: flex;
                justify-content: center;
                gap: 20px;
                padding: 10px;
                background: ${THEME_COLORS.purple.gradientLight};
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                flex-shrink: 0;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
            }

            .legend-color {
                width: 28px;
                height: 10px;
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
                gap: 10px;
                flex-shrink: 0;
            }

            .stat-card {
                background: ${THEME_COLORS.purple.gradientMedium};
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 12px;
                transition: all 0.2s ease;
            }

            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px ${THEME_COLORS.chart.shadowColor};
                border-color: var(--vscode-focusBorder);
            }

            .stat-label {
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 4px;
                font-weight: 600;
            }

            .stat-value {
                font-size: 24px;
                font-weight: 700;
                color: var(--vscode-foreground);
                margin-bottom: 2px;
            }

            .stat-average {
                font-size: 10px;
                color: var(--vscode-descriptionForeground);
            }

            .stat-average-value {
                font-weight: 600;
                color: var(--vscode-textLink-foreground);
            }

            .secondary-charts-grid {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 10px;
                flex: 1.4;
                min-height: 0;
            }

            .chart-title {
                margin: 0 0 4px 0;
                font-size: 14px;
                font-weight: 600;
                flex-shrink: 0;
            }

            .chart-subtitle {
                margin: 0 0 8px 0;
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                flex-shrink: 0;
            }

            .footer-note {
                text-align: center;
                font-size: 9px;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
                flex-shrink: 0;
            }

            .helper-text {
                font-size: 9px;
                color: var(--vscode-descriptionForeground);
                padding: 6px 10px;
                background: ${THEME_COLORS.chart.helperBackground};
                border-left: 3px solid ${THEME_COLORS.chart.helperBorder};
                border-radius: 4px;
                flex-shrink: 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
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

            <div class="chart-container main">
                <div class="chart-wrapper">
                    <canvas id="activityChart"></canvas>
                </div>
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

            <div class="secondary-charts-grid">
                <div class="chart-container secondary">
                    <h2 class="chart-title">🕐 Writing Hours</h2>
                    <p class="chart-subtitle">24-hour activity pattern</p>
                    <div class="chart-wrapper">
                        <canvas id="hourlyChart"></canvas>
                    </div>
                </div>

                <div class="chart-container secondary">
                    <h2 class="chart-title">📈 Growth Over Time</h2>
                    <p class="chart-subtitle">Cumulative notes</p>
                    <div class="chart-wrapper">
                        <canvas id="growthChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="footer-note">
                Data is inferred from file creation and modification times. Click "Refresh" to update.
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            // Activity data
            const weeklyData = ${JSON.stringify(weeklyData)};
            const hourlyData = ${JSON.stringify(hourlyData)};
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

            // Initialize Hourly Chart (Ringmap)
            const hourlyCtx = document.getElementById('hourlyChart').getContext('2d');
            const hourlyCounts = hourlyData.map(h => h.count);
            const maxCount = Math.max(...hourlyCounts);

            // Generate colors based on intensity using theme colors
            const hourlyColors = hourlyCounts.map(count => {
                const intensity = maxCount > 0 ? count / maxCount : 0;
                if (intensity === 0) return '${THEME_COLORS.calendar.intensity0}';

                if (intensity < 0.2) return '${THEME_COLORS.calendar.intensity1}';
                if (intensity < 0.4) return '${THEME_COLORS.calendar.intensity2}';
                if (intensity < 0.6) return '${THEME_COLORS.calendar.intensity3}';
                if (intensity < 0.8) return '${THEME_COLORS.calendar.intensity4}';
                return '${THEME_COLORS.calendar.intensity5}';
            });

            // Custom plugin to draw clock-like tick marks and hour labels
            const hourLabelsPlugin = {
                id: 'hourLabels',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    const chartArea = chart.chartArea;
                    const centerX = (chartArea.left + chartArea.right) / 2;
                    const centerY = (chartArea.top + chartArea.bottom) / 2;
                    const radius = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;

                    ctx.save();

                    // Draw tick marks for every 3 hours (8 total)
                    const tickHours = [0, 3, 6, 9, 12, 15, 18, 21];
                    const outerRadius = radius; // Start from outer edge of donut
                    const tickLength = radius * 0.12; // Length of tick marks

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';

                    tickHours.forEach(hour => {
                        const angle = (hour / 24) * 2 * Math.PI - Math.PI / 2;
                        const x1 = centerX + Math.cos(angle) * outerRadius;
                        const y1 = centerY + Math.sin(angle) * outerRadius;
                        const x2 = centerX + Math.cos(angle) * (outerRadius + tickLength);
                        const y2 = centerY + Math.sin(angle) * (outerRadius + tickLength);

                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    });

                    // Draw hour labels (every 3 hours, outside tick marks)
                    ctx.font = \`11px \${computedStyle.getPropertyValue('--vscode-font-family')}\`;
                    ctx.fillStyle = foregroundColor;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const hourMarkers = [
                        { hour: 0, label: '12am' },
                        { hour: 3, label: '3am' },
                        { hour: 6, label: '6am' },
                        { hour: 9, label: '9am' },
                        { hour: 12, label: '12pm' },
                        { hour: 15, label: '3pm' },
                        { hour: 18, label: '6pm' },
                        { hour: 21, label: '9pm' }
                    ];

                    hourMarkers.forEach(marker => {
                        const angle = (marker.hour / 24) * 2 * Math.PI - Math.PI / 2;
                        const labelDistance = outerRadius + tickLength + (radius * 0.22);
                        const x = centerX + Math.cos(angle) * labelDistance;
                        const y = centerY + Math.sin(angle) * labelDistance;
                        ctx.fillText(marker.label, x, y);
                    });

                    ctx.restore();
                }
            };

            new Chart(hourlyCtx, {
                type: 'doughnut',
                data: {
                    labels: Array.from({ length: 24 }, (_, i) => \`\${i}:00\`),
                    datasets: [{
                        data: hourlyCounts.map(c => c === 0 ? 0.5 : c), // Small value for empty slots
                        backgroundColor: hourlyColors,
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    rotation: -90,
                    circumference: 360,
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
                            displayColors: false,
                            callbacks: {
                                title: function(context) {
                                    const hour = context[0].dataIndex;
                                    // Convert to 12-hour format
                                    if (hour === 0) return '12:00 am';
                                    if (hour < 12) return \`\${hour}:00 am\`;
                                    if (hour === 12) return '12:00 pm';
                                    return \`\${hour - 12}:00 pm\`;
                                },
                                label: function(context) {
                                    const hour = context.dataIndex;
                                    const count = hourlyData[hour].count;
                                    return \`\${count} note\${count !== 1 ? 's' : ''}\`;
                                }
                            }
                        }
                    }
                },
                plugins: [hourLabelsPlugin]
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
