import * as fs from 'fs';
import * as path from 'path';
import { getNotesPath } from './configService';
import { LinkService } from './linkService';
import { TagService } from './tagService';
import { parseFrontmatter } from '../utils/frontmatterParser';

/**
 * Weekly activity data
 */
export interface WeeklyActivity {
    weekNumber: number;
    weekLabel: string; // e.g., "W1", "W2", etc.
    startDate: Date;
    endDate: Date;
    notesCreated: number;
    tagsAdded: number;
    linksCreated: number;
}

/**
 * Hourly activity data (24-hour format)
 */
export interface HourlyActivity {
    hour: number; // 0-23
    count: number;
}

/**
 * Service for collecting and analyzing activity metrics
 */
export class ActivityService {
    constructor(
        private linkService: LinkService,
        private tagService: TagService
    ) {}

    /**
     * Get activity data for the last N weeks
     */
    async getWeeklyActivity(weeks: number = 12): Promise<WeeklyActivity[]> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            return [];
        }

        // Initialize weekly buckets
        const weeklyData = this.initializeWeeklyBuckets(weeks);

        // Collect all note files
        const noteFiles = await this.collectAllNoteFiles(notesPath);

        // Process each file to extract metrics
        for (const filePath of noteFiles) {
            try {
                const stats = await fs.promises.stat(filePath);
                const content = await fs.promises.readFile(filePath, 'utf-8');

                // Extract the creation date using frontmatter, filename, or file stats
                const createdDate = await this.extractNoteDate(filePath, content, stats);

                // Determine which week this file was created
                const createdWeek = this.getWeekIndex(createdDate, weeklyData);
                if (createdWeek !== -1) {
                    weeklyData[createdWeek].notesCreated++;
                }

                // Count links in this file
                const links = await this.linkService.extractLinksFromFile(filePath);
                // Use creation date for when links were added (same as note creation)
                const linksWeek = this.getWeekIndex(createdDate, weeklyData);
                if (linksWeek !== -1) {
                    weeklyData[linksWeek].linksCreated += links.length;
                }

                // Count tags in this file
                const tags = this.extractTagsFromContent(content);
                // Use creation date for when tags were added (same as note creation)
                const tagsWeek = this.getWeekIndex(createdDate, weeklyData);
                if (tagsWeek !== -1) {
                    weeklyData[tagsWeek].tagsAdded += tags.length;
                }
            } catch (error) {
                console.error(`[NOTED] Error processing file for activity: ${filePath}`, error);
                continue;
            }
        }

        return weeklyData;
    }

    /**
     * Initialize weekly buckets for the last N weeks
     */
    private initializeWeeklyBuckets(weeks: number): WeeklyActivity[] {
        const buckets: WeeklyActivity[] = [];
        const now = new Date();

        // Start from the beginning of the current week (Sunday)
        const currentWeekStart = new Date(now);
        currentWeekStart.setHours(0, 0, 0, 0);
        currentWeekStart.setDate(now.getDate() - now.getDay());

        for (let i = weeks - 1; i >= 0; i--) {
            const weekStart = new Date(currentWeekStart);
            weekStart.setDate(currentWeekStart.getDate() - (i * 7));

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            buckets.push({
                weekNumber: weeks - i,
                weekLabel: `W${weeks - i}`,
                startDate: weekStart,
                endDate: weekEnd,
                notesCreated: 0,
                tagsAdded: 0,
                linksCreated: 0
            });
        }

        return buckets;
    }

    /**
     * Get the week index for a given date
     * Returns -1 if the date is outside the range
     */
    private getWeekIndex(date: Date, weeklyData: WeeklyActivity[]): number {
        for (let i = 0; i < weeklyData.length; i++) {
            if (date >= weeklyData[i].startDate && date <= weeklyData[i].endDate) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Extract the creation date from a note using multiple strategies:
     * 1. Frontmatter 'created' field
     * 2. Filename (YYYY-MM-DD prefix)
     * 3. File creation timestamp (birthtime)
     */
    private async extractNoteDate(filePath: string, content: string, stats: fs.Stats): Promise<Date> {
        // Strategy 1: Parse frontmatter 'created' field
        const frontmatter = parseFrontmatter(content);
        if (frontmatter.created) {
            const createdDate = new Date(frontmatter.created);
            if (!isNaN(createdDate.getTime())) {
                return createdDate;
            }
        }

        // Strategy 2: Extract from filename (YYYY-MM-DD prefix)
        const fileName = path.basename(filePath);
        const dateMatch = fileName.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
            return new Date(
                parseInt(dateMatch[1]),
                parseInt(dateMatch[2]) - 1,
                parseInt(dateMatch[3])
            );
        }

        // Strategy 3: Use file creation timestamp
        return stats.birthtime;
    }

    /**
     * Recursively collect all note files
     */
    private async collectAllNoteFiles(dirPath: string): Promise<string[]> {
        const files: string[] = [];

        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Skip templates folder
                    if (entry.name === '.templates') {
                        continue;
                    }
                    // Recursively process subdirectories
                    const subFiles = await this.collectAllNoteFiles(fullPath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    // Only include .txt and .md files
                    if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }

        return files;
    }

    /**
     * Extract tags from file content (both frontmatter and inline)
     */
    private extractTagsFromContent(content: string): string[] {
        const tags = new Set<string>();

        // Extract from YAML frontmatter
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const yamlContent = frontmatterMatch[1];
            const tagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);
            if (tagsMatch) {
                const tagList = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
                tagList.forEach(tag => {
                    if (tag) {tags.add(tag);}
                });
            }
        }

        // Extract inline #hashtags
        const hashtagRegex = /#([a-zA-Z0-9_/-]+)/g;
        let match;
        while ((match = hashtagRegex.exec(content)) !== null) {
            tags.add(match[1]);
        }

        return Array.from(tags);
    }

    /**
     * Get summary statistics for activity
     */
    async getActivityStats(): Promise<{
        totalNotes: number;
        totalTags: number;
        totalLinks: number;
        avgNotesPerWeek: number;
        avgTagsPerWeek: number;
        avgLinksPerWeek: number;
    }> {
        const weeklyData = await this.getWeeklyActivity(12);

        const totalNotes = weeklyData.reduce((sum, week) => sum + week.notesCreated, 0);
        const totalTags = weeklyData.reduce((sum, week) => sum + week.tagsAdded, 0);
        const totalLinks = weeklyData.reduce((sum, week) => sum + week.linksCreated, 0);

        const weeks = weeklyData.length;

        return {
            totalNotes,
            totalTags,
            totalLinks,
            avgNotesPerWeek: weeks > 0 ? Math.round(totalNotes / weeks) : 0,
            avgTagsPerWeek: weeks > 0 ? Math.round(totalTags / weeks) : 0,
            avgLinksPerWeek: weeks > 0 ? Math.round(totalLinks / weeks) : 0
        };
    }

    /**
     * Get hourly activity distribution (24-hour format)
     */
    async getHourlyActivity(): Promise<HourlyActivity[]> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            return [];
        }

        // Initialize 24 hourly buckets
        const hourlyData: HourlyActivity[] = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: 0
        }));

        // Collect all note files
        const noteFiles = await this.collectAllNoteFiles(notesPath);

        // Process each file to extract creation hour
        for (const filePath of noteFiles) {
            try {
                const stats = await fs.promises.stat(filePath);
                const content = await fs.promises.readFile(filePath, 'utf-8');

                // Extract the creation date
                const createdDate = await this.extractNoteDate(filePath, content, stats);
                const hour = createdDate.getHours();

                hourlyData[hour].count++;
            } catch (error) {
                console.error(`[NOTED] Error processing file for hourly activity: ${filePath}`, error);
                continue;
            }
        }

        return hourlyData;
    }
}
