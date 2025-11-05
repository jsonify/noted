/**
 * Centralized color palette for Noted extension
 * Ensures consistent theming across all views
 */

export const THEME_COLORS = {
    // Activity Chart Colors - Main metrics
    activity: {
        notes: {
            fill: 'rgba(94, 114, 228, 0.7)',
            border: 'rgba(94, 114, 228, 1)',
            hover: 'rgba(94, 114, 228, 1)'
        },
        links: {
            fill: 'rgba(137, 196, 244, 0.7)',
            border: 'rgba(137, 196, 244, 1)',
            hover: 'rgba(137, 196, 244, 1)'
        },
        tags: {
            fill: 'rgba(190, 227, 248, 0.7)',
            border: 'rgba(190, 227, 248, 1)',
            hover: 'rgba(190, 227, 248, 1)'
        }
    },

    // Accent colors for UI elements
    accent: {
        primary: 'rgba(100, 180, 255, 1)',
        primaryLight: 'rgba(100, 180, 255, 0.8)',
        primaryFaint: 'rgba(100, 180, 255, 0.2)',
        primaryBorder: 'rgba(100, 180, 255, 0.4)',
        primaryGlow: 'rgba(100, 180, 255, 0.5)'
    },

    // Purple gradients for backgrounds
    purple: {
        dark: 'rgba(120, 100, 200, 1)',
        medium: 'rgba(140, 120, 240, 1)',
        light: 'rgba(160, 140, 255, 1)',
        // Gradient backgrounds
        gradientFaint: 'linear-gradient(135deg, rgba(120, 100, 200, 0.03), rgba(140, 120, 240, 0.01))',
        gradientLight: 'linear-gradient(135deg, rgba(120, 100, 200, 0.05), rgba(140, 120, 240, 0.02))',
        gradientMedium: 'linear-gradient(135deg, rgba(120, 100, 200, 0.08), rgba(140, 120, 240, 0.03))',
        gradientCard: 'linear-gradient(135deg, rgba(120, 100, 200, 0.1), rgba(140, 120, 240, 0.05))'
    },

    // Calendar-specific colors
    calendar: {
        intensity0: 'rgba(100, 100, 120, 0.15)',
        intensity1: 'rgba(120, 100, 200, 0.3)',
        intensity2: 'rgba(130, 110, 220, 0.5)',
        intensity3: 'rgba(140, 120, 240, 0.7)',
        intensity4: 'rgba(150, 130, 255, 0.85)',
        intensity5: 'rgba(160, 140, 255, 1)',
        todayGradient: 'linear-gradient(135deg, rgba(100, 180, 255, 0.3) 0%, rgba(120, 100, 200, 0.5) 100%)',
        legendToday: 'linear-gradient(135deg, rgba(100, 180, 255, 0.3), rgba(120, 100, 200, 0.5))'
    },

    // Streak colors
    streak: {
        fireGradient: 'linear-gradient(135deg, rgba(255, 107, 107, 0.8), rgba(255, 140, 107, 0.6))',
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 140, 107, 0.05))',
        border: 'rgba(255, 107, 107, 0.3)',
        topBorder: 'linear-gradient(90deg, #ff6b6b, #ff8c6b, #ffa06b)',
        currentBackground: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 140, 107, 0.1))',
        currentBorder: 'rgba(255, 107, 107, 0.4)',
        longestBackground: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.05))',
        longestBorder: 'rgba(255, 215, 0, 0.3)',
        valueRed: '#ff6b6b',
        valueGold: '#ffd700'
    },

    // Chart backgrounds and borders
    chart: {
        sectionBackground: 'linear-gradient(135deg, rgba(120, 100, 200, 0.08), rgba(140, 120, 240, 0.03))',
        helperBackground: 'rgba(100, 180, 255, 0.08)',
        helperBorder: 'rgba(100, 180, 255, 0.5)',
        gridColor: 'rgba(128, 128, 128, 0.1)',
        tooltipBackground: 'rgba(0, 0, 0, 0.8)',
        shadowColor: 'rgba(0, 0, 0, 0.2)'
    },

    // Trend chart colors
    trend: {
        barGradient: 'linear-gradient(to top, rgba(140, 120, 240, 0.8), rgba(150, 130, 255, 0.6))',
        barCurrentGradient: 'linear-gradient(to top, rgba(100, 180, 255, 0.9), rgba(120, 190, 255, 0.7))',
        barCurrentGlow: 'rgba(100, 180, 255, 0.4)',
        barHoverGradient: 'linear-gradient(to top, rgba(150, 130, 255, 1), rgba(160, 140, 255, 0.8))'
    },

    // Day of week chart colors
    dayOfWeek: {
        barGradient: 'linear-gradient(to top, rgba(120, 100, 200, 0.7), rgba(140, 120, 240, 0.5))',
        barTodayGradient: 'linear-gradient(to top, rgba(255, 215, 0, 0.8), rgba(255, 225, 100, 0.6))',
        barTodayGlow: 'rgba(255, 215, 0, 0.4)',
        barHoverGradient: 'linear-gradient(to top, rgba(140, 120, 240, 1), rgba(150, 130, 255, 0.8))'
    },

    // Growth chart colors
    growth: {
        areaGradient: 'linear-gradient(to bottom, rgba(150, 130, 255, 0.8), rgba(150, 130, 255, 0.1))',
        lineColor: 'rgba(160, 140, 255, 1)'
    }
};

/**
 * Helper function to generate CSS for activity chart legend
 */
export function getActivityLegendCSS(): string {
    return `
        .legend-color.notes {
            background: ${THEME_COLORS.activity.notes.fill};
        }
        .legend-color.links {
            background: ${THEME_COLORS.activity.links.fill};
        }
        .legend-color.tags {
            background: ${THEME_COLORS.activity.tags.fill};
        }
    `;
}

/**
 * Helper function to get Chart.js dataset configuration
 */
export function getActivityChartDatasets(notesData: number[], linksData: number[], tagsData: number[]) {
    return [
        {
            label: 'Notes Created',
            data: notesData,
            backgroundColor: THEME_COLORS.activity.notes.fill,
            borderColor: THEME_COLORS.activity.notes.border,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: THEME_COLORS.activity.notes.hover,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        },
        {
            label: 'Links Created',
            data: linksData,
            backgroundColor: THEME_COLORS.activity.links.fill,
            borderColor: THEME_COLORS.activity.links.border,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: THEME_COLORS.activity.links.hover,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        },
        {
            label: 'Tags Added',
            data: tagsData,
            backgroundColor: THEME_COLORS.activity.tags.fill,
            borderColor: THEME_COLORS.activity.tags.border,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: THEME_COLORS.activity.tags.hover,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        }
    ];
}

/**
 * Helper function to get Chart.js common options
 */
export function getActivityChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: THEME_COLORS.chart.tooltipBackground,
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: THEME_COLORS.accent.primaryGlow,
                borderWidth: 1,
                padding: 12,
                displayColors: true
            }
        },
        scales: {
            x: {
                grid: {
                    color: THEME_COLORS.chart.gridColor,
                    drawBorder: false
                },
                ticks: {
                    color: 'var(--vscode-foreground)',
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                stacked: true,
                grid: {
                    color: THEME_COLORS.chart.gridColor,
                    drawBorder: false
                },
                ticks: {
                    color: 'var(--vscode-foreground)',
                    font: {
                        size: 10
                    },
                    callback: function(value: any) {
                        return Math.floor(value);
                    }
                },
                beginAtZero: true
            }
        }
    };
}
