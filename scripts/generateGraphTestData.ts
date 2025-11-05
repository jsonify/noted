/**
 * Generate test notes with diverse connection patterns for graph view demonstration
 *
 * Usage:
 *   npx ts-node scripts/generateGraphTestData.ts [notes-path] [format]
 *
 * Arguments:
 *   notes-path - Path to your notes folder (e.g., ~/Notes, ~/Dropbox/Notes)
 *   format     - File format: 'md' or 'txt' (default: 'md')
 *
 * Examples:
 *   npx ts-node scripts/generateGraphTestData.ts ~/Notes md
 *   npx ts-node scripts/generateGraphTestData.ts ~/Dropbox/Notes txt
 *   pnpm run generate:graph-data  # Uses default: ~/Documents/Notes
 *
 * This creates:
 * - Hub notes (highly connected)
 * - Cluster groups (related topics)
 * - Orphaned notes (isolated)
 * - Bidirectional links
 * - Varied connection densities
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Configuration - can be overridden via command-line arguments
let NOTES_BASE_PATH = process.argv[2] || path.join(os.homedir(), 'Documents', 'Notes');
let FILE_FORMAT = (process.argv[3] || 'md') as 'md' | 'txt'; // or 'txt'
const START_DATE = new Date('2025-10-01');
const NUM_DAYS = 20; // Spread notes across 20 days

// Expand ~ to home directory if present
if (NOTES_BASE_PATH.startsWith('~')) {
    NOTES_BASE_PATH = path.join(os.homedir(), NOTES_BASE_PATH.slice(1));
}

interface NoteData {
    filename: string;
    title: string;
    content: string;
    links: string[]; // Links to other notes
    tags: string[];
    date: Date;
}

// Generate notes with strategic connection patterns
const notesData: NoteData[] = [
    // === HUB NOTE 1: Authentication (highly connected) ===
    {
        filename: 'authentication-architecture',
        title: 'Authentication Architecture',
        content: `# Authentication Architecture

Our authentication system has evolved significantly. Key learnings documented in:

- [[jwt-implementation]] - Token-based auth
- [[oauth-integration]] - Third-party login
- [[session-management]] - Session handling
- [[password-security]] - Security best practices
- [[api-security]] - API authentication
- [[user-roles-permissions]] - Authorization

Related meeting notes: [[team-security-meeting]]

See also: [[backend-patterns]] for overall architecture.`,
        links: ['jwt-implementation', 'oauth-integration', 'session-management', 'password-security', 'api-security', 'user-roles-permissions', 'team-security-meeting', 'backend-patterns'],
        tags: ['architecture', 'security', 'backend'],
        date: new Date('2025-10-01')
    },

    // === CLUSTER 1: Security Notes ===
    {
        filename: 'jwt-implementation',
        title: 'JWT Implementation',
        content: `# JWT Implementation

Implemented token-based authentication using JWT.

## Key Points
- Token expiry: 24 hours
- Refresh token rotation
- Secure storage considerations

Related: [[authentication-architecture]], [[api-security]]
Bug fix: [[auth-token-bug]]`,
        links: ['authentication-architecture', 'api-security', 'auth-token-bug'],
        tags: ['security', 'jwt', 'backend'],
        date: new Date('2025-10-02')
    },
    {
        filename: 'oauth-integration',
        title: 'OAuth Integration',
        content: `# OAuth Integration

Integrated Google and GitHub OAuth providers.

## Implementation
- OAuth 2.0 flow
- Callback handling
- User profile mapping

See: [[authentication-architecture]] for overall design
Related: [[third-party-apis]]`,
        links: ['authentication-architecture', 'third-party-apis'],
        tags: ['security', 'oauth', 'integration'],
        date: new Date('2025-10-03')
    },
    {
        filename: 'password-security',
        title: 'Password Security',
        content: `# Password Security Best Practices

## Hashing
- bcrypt with 12 rounds
- Salt generation

## Validation
- Minimum 8 characters
- Complexity requirements

Documented in: [[authentication-architecture]]
Related bug: [[password-reset-bug]]`,
        links: ['authentication-architecture', 'password-reset-bug'],
        tags: ['security', 'passwords'],
        date: new Date('2025-10-04')
    },
    {
        filename: 'api-security',
        title: 'API Security',
        content: `# API Security

Rate limiting, CORS, and authentication for our API endpoints.

## Measures
- Rate limiting: 100 req/min
- CORS configuration
- JWT validation on all protected routes

See: [[authentication-architecture]], [[backend-patterns]]
Implementation: [[express-middleware]]`,
        links: ['authentication-architecture', 'backend-patterns', 'express-middleware'],
        tags: ['security', 'api', 'backend'],
        date: new Date('2025-10-05')
    },
    {
        filename: 'session-management',
        title: 'Session Management',
        content: `# Session Management

Redis-based session storage for scalability.

## Features
- Session expiry
- Concurrent session handling
- Session invalidation

Part of: [[authentication-architecture]]
Related: [[redis-setup]]`,
        links: ['authentication-architecture', 'redis-setup'],
        tags: ['security', 'sessions', 'redis'],
        date: new Date('2025-10-06')
    },
    {
        filename: 'user-roles-permissions',
        title: 'User Roles and Permissions',
        content: `# User Roles and Permissions

RBAC implementation with hierarchical roles.

## Roles
- Admin
- Editor
- Viewer

Integrated with: [[authentication-architecture]]
Database schema: [[database-schema]]`,
        links: ['authentication-architecture', 'database-schema'],
        tags: ['security', 'authorization', 'rbac'],
        date: new Date('2025-10-07')
    },

    // === HUB NOTE 2: Backend Patterns (moderately connected) ===
    {
        filename: 'backend-patterns',
        title: 'Backend Patterns',
        content: `# Backend Architecture Patterns

Collection of patterns we use across services.

## Key Patterns
- Repository pattern: [[repository-pattern]]
- Service layer: [[service-layer-design]]
- Middleware: [[express-middleware]]

Security: [[authentication-architecture]]
Database: [[database-schema]]`,
        links: ['repository-pattern', 'service-layer-design', 'express-middleware', 'authentication-architecture', 'database-schema'],
        tags: ['architecture', 'backend', 'patterns'],
        date: new Date('2025-10-08')
    },

    // === CLUSTER 2: Backend Implementation ===
    {
        filename: 'repository-pattern',
        title: 'Repository Pattern',
        content: `# Repository Pattern

Data access abstraction layer.

## Benefits
- Testability
- Separation of concerns
- Consistent data access

Part of: [[backend-patterns]]
Example: [[user-repository]]`,
        links: ['backend-patterns', 'user-repository'],
        tags: ['patterns', 'backend', 'database'],
        date: new Date('2025-10-09')
    },
    {
        filename: 'service-layer-design',
        title: 'Service Layer Design',
        content: `# Service Layer Design

Business logic separation from controllers.

## Structure
- Thin controllers
- Fat services
- Domain models

See: [[backend-patterns]]
Related: [[dependency-injection]]`,
        links: ['backend-patterns', 'dependency-injection'],
        tags: ['patterns', 'backend', 'architecture'],
        date: new Date('2025-10-10')
    },
    {
        filename: 'express-middleware',
        title: 'Express Middleware',
        content: `# Express Middleware

Custom middleware for logging, auth, and error handling.

## Middleware Stack
- Logger
- Auth validator: [[authentication-architecture]]
- Error handler

Pattern: [[backend-patterns]]`,
        links: ['authentication-architecture', 'backend-patterns'],
        tags: ['backend', 'express', 'middleware'],
        date: new Date('2025-10-11')
    },

    // === CLUSTER 3: Database Notes ===
    {
        filename: 'database-schema',
        title: 'Database Schema',
        content: `# Database Schema

PostgreSQL schema design for the application.

## Tables
- users (with roles: [[user-roles-permissions]])
- sessions
- audit_logs

Migrations: [[database-migrations]]
Architecture: [[backend-patterns]]`,
        links: ['user-roles-permissions', 'database-migrations', 'backend-patterns'],
        tags: ['database', 'schema', 'postgres'],
        date: new Date('2025-10-12')
    },
    {
        filename: 'database-migrations',
        title: 'Database Migrations',
        content: `# Database Migrations

Using node-pg-migrate for version control.

## Process
- Incremental migrations
- Rollback support
- Seed data

Schema: [[database-schema]]
Setup: [[postgres-setup]]`,
        links: ['database-schema', 'postgres-setup'],
        tags: ['database', 'migrations'],
        date: new Date('2025-10-13')
    },
    {
        filename: 'redis-setup',
        title: 'Redis Setup',
        content: `# Redis Setup

Redis for caching and session storage.

## Configuration
- Connection pooling
- Failover handling

Used by: [[session-management]]
Caching strategy: [[caching-patterns]]`,
        links: ['session-management', 'caching-patterns'],
        tags: ['database', 'redis', 'caching'],
        date: new Date('2025-10-14')
    },

    // === STANDALONE/MEETING NOTES (some connections) ===
    {
        filename: 'team-security-meeting',
        title: 'Team Security Meeting - Oct 2025',
        content: `# Team Security Meeting

Discussed authentication improvements and vulnerabilities.

## Decisions
- Implement [[oauth-integration]]
- Review [[password-security]] policies
- Audit [[api-security]] endpoints

Action items assigned.

Follow-up: [[security-audit-results]]`,
        links: ['oauth-integration', 'password-security', 'api-security', 'security-audit-results'],
        tags: ['meeting', 'security'],
        date: new Date('2025-10-15')
    },

    // === BUG NOTES (bidirectional links) ===
    {
        filename: 'auth-token-bug',
        title: 'Auth Token Expiry Bug',
        content: `# Auth Token Expiry Bug

Tokens weren't refreshing properly.

## Fix
Updated token refresh logic in [[jwt-implementation]]

## Testing
Verified with integration tests

Status: Resolved`,
        links: ['jwt-implementation'],
        tags: ['bug', 'security', 'resolved'],
        date: new Date('2025-10-16')
    },
    {
        filename: 'password-reset-bug',
        title: 'Password Reset Flow Bug',
        content: `# Password Reset Bug

Reset emails not sending.

## Root Cause
SMTP configuration issue

## Resolution
Fixed email service configuration
Updated [[password-security]] documentation

Status: Resolved`,
        links: ['password-security'],
        tags: ['bug', 'email', 'resolved'],
        date: new Date('2025-10-17')
    },

    // === ORPHANED/WEAKLY CONNECTED NOTES ===
    {
        filename: 'third-party-apis',
        title: 'Third Party APIs',
        content: `# Third Party API Integration

Documentation for external API integrations.

## APIs
- Stripe for payments
- SendGrid for emails
- Analytics service

OAuth: [[oauth-integration]]`,
        links: ['oauth-integration'],
        tags: ['integration', 'api'],
        date: new Date('2025-10-18')
    },
    {
        filename: 'user-repository',
        title: 'User Repository Implementation',
        content: `# User Repository

Concrete implementation of repository pattern for users.

## Methods
- findById()
- create()
- update()

Pattern: [[repository-pattern]]`,
        links: ['repository-pattern'],
        tags: ['backend', 'implementation'],
        date: new Date('2025-10-18')
    },
    {
        filename: 'dependency-injection',
        title: 'Dependency Injection',
        content: `# Dependency Injection

Using InversifyJS for DI in Node.js.

## Benefits
- Testability
- Loose coupling

Used in: [[service-layer-design]]`,
        links: ['service-layer-design'],
        tags: ['patterns', 'backend'],
        date: new Date('2025-10-19')
    },

    // === COMPLETELY ORPHANED (for demonstration) ===
    {
        filename: 'postgres-setup',
        title: 'PostgreSQL Setup',
        content: `# PostgreSQL Setup

Local development database setup instructions.

## Installation
\`\`\`bash
brew install postgresql
brew services start postgresql
\`\`\`

## Configuration
- Database: app_dev
- User: dev_user`,
        links: [],
        tags: ['database', 'setup'],
        date: new Date('2025-10-19')
    },
    {
        filename: 'caching-patterns',
        title: 'Caching Patterns',
        content: `# Caching Patterns

Strategies for effective caching.

## Patterns
- Cache-aside
- Write-through
- TTL strategies

## Tools
- Redis
- In-memory cache`,
        links: [],
        tags: ['caching', 'performance'],
        date: new Date('2025-10-20')
    },
    {
        filename: 'security-audit-results',
        title: 'Security Audit Results',
        content: `# Security Audit Results - October 2025

Third-party security audit findings.

## Findings
- Low: 5 issues
- Medium: 2 issues
- High: 0 issues

## Remediation
All issues addressed and verified.

Status: Complete`,
        links: [],
        tags: ['security', 'audit'],
        date: new Date('2025-10-20')
    }
];

/**
 * Ensure directory exists
 */
function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Format date components
 */
function formatDate(date: Date): { year: string; month: string; day: string; monthName: string } {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const monthName = date.toLocaleString('en-US', { month: 'long' });

    return { year, month, day, monthName };
}

/**
 * Generate a single note file
 */
function generateNote(note: NoteData): void {
    const { year, month, day, monthName } = formatDate(note.date);

    // Create folder structure: Notes/YYYY/MM-MonthName/
    const yearPath = path.join(NOTES_BASE_PATH, year);
    const monthPath = path.join(yearPath, `${month}-${monthName}`);
    ensureDir(monthPath);

    // Create filename: YYYY-MM-DD-title.md
    const filename = `${year}-${month}-${day}-${note.filename}.${FILE_FORMAT}`;
    const filePath = path.join(monthPath, filename);

    // Build note content with frontmatter
    let content = `---
title: ${note.title}
tags: [${note.tags.join(', ')}]
created: ${note.date.toISOString()}
---

`;
    content += note.content;

    // Write file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Created: ${filename}`);
}

/**
 * Main execution
 */
function main(): void {
    console.log('🚀 Generating graph test data...\n');
    console.log(`📁 Target directory: ${NOTES_BASE_PATH}`);
    console.log(`📄 File format: .${FILE_FORMAT}`);
    console.log(`📝 Total notes: ${notesData.length}\n`);

    // Check if directory exists, create if it doesn't
    if (!fs.existsSync(NOTES_BASE_PATH)) {
        console.log(`⚠️  Notes folder doesn't exist. Creating: ${NOTES_BASE_PATH}\n`);
    }

    // Ensure base notes directory exists
    ensureDir(NOTES_BASE_PATH);

    // Generate all notes
    notesData.forEach(note => generateNote(note));

    console.log(`\n✅ Generated ${notesData.length} notes successfully!`);
    console.log('\n📊 Connection Statistics:');

    // Calculate statistics
    const totalLinks = notesData.reduce((sum, note) => sum + note.links.length, 0);
    const avgLinks = (totalLinks / notesData.length).toFixed(1);
    const hubNotes = notesData.filter(n => n.links.length >= 5).length;
    const orphanNotes = notesData.filter(n => n.links.length === 0).length;

    console.log(`   Total links: ${totalLinks}`);
    console.log(`   Average links per note: ${avgLinks}`);
    console.log(`   Hub notes (5+ connections): ${hubNotes}`);
    console.log(`   Orphaned notes (0 connections): ${orphanNotes}`);

    console.log('\n💡 Next steps:');
    console.log('   1. Open VS Code');
    console.log('   2. Make sure your Noted extension is configured to use:');
    console.log(`      ${NOTES_BASE_PATH}`);
    console.log('   3. Refresh the Notes view (click refresh icon)');
    console.log('   4. Check "My Notes" panel → 2025 → 10-October');
    console.log('   5. Run "Noted: Show Graph" (Cmd+Shift+G) to see connections');
    console.log('\n📍 If notes don\'t appear, your VS Code notes folder setting may be different.');
    console.log('   Check: VS Code Settings → Search "noted.notesFolder"');
}

// Run the script
main();
