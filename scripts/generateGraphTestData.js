"use strict";
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
 * - 23 Inbox notes (saved as {notesPath}/Inbox/note-name.ext)
 *   - Hub notes (highly connected)
 *   - Cluster groups (related topics)
 *   - Orphaned notes (isolated)
 * - 70+ Journal entries (saved as {notesPath}/YYYY/MM-Month/YYYY-MM-DD.ext)
 *   - Active daily note-taking from August through November 2025
 *   - Most days covered (realistic gaps on some weekends)
 *   - Various entry types: planning, coding, meetings, retrospectives
 *   - Rich connections to Inbox reference notes
 * - Bidirectional links between notes
 * - Varied connection densities for graph visualization
 *
 * Total: 90+ notes with extensive interconnections
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// Configuration - can be overridden via command-line arguments
let NOTES_BASE_PATH = process.argv[2] || path.join(os.homedir(), 'Documents', 'Notes');
let FILE_FORMAT = (process.argv[3] || 'md'); // or 'txt'
const START_DATE = new Date('2025-10-01');
const NUM_DAYS = 20; // Spread notes across 20 days
// Expand ~ to home directory if present
if (NOTES_BASE_PATH.startsWith('~')) {
    NOTES_BASE_PATH = path.join(os.homedir(), NOTES_BASE_PATH.slice(1));
}
// Generate notes with strategic connection patterns
const notesData = [
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
    },
    // === JOURNAL ENTRIES (Daily Notes from August - November 2025) ===
    // These will be created in YYYY/MM-Month/YYYY-MM-DD.ext format
    // Simulating an active note-taker with most days covered
    // AUGUST 2025
    { filename: '2025-08-01', title: 'August 1', isJournalEntry: true, date: new Date('2025-08-01'),
        content: `# August 1, 2025\n\n## First day of August!\nStarting Q3 sprint planning. Focus on authentication system overhaul.\n\n## Goals This Month\n- Design new [[authentication-architecture]]\n- Research [[jwt-implementation]] best practices\n- Plan security improvements`,
        links: ['authentication-architecture', 'jwt-implementation'], tags: ['journal', 'planning'] },
    { filename: '2025-08-02', title: 'August 2', isJournalEntry: true, date: new Date('2025-08-02'),
        content: `# August 2, 2025\n\n## Research Day\nDeep dive into authentication patterns.\n\n## Notes\n- [[oauth-integration]] looks promising for third-party auth\n- [[session-management]] needs rethinking\n- Found good resources on [[password-security]]`,
        links: ['oauth-integration', 'session-management', 'password-security'], tags: ['journal', 'research'] },
    { filename: '2025-08-05', title: 'August 5', isJournalEntry: true, date: new Date('2025-08-05'),
        content: `# August 5, 2025\n\n## Monday Kickoff\nWeekly planning meeting. Team aligned on authentication priorities.\n\n## This Week\n- [ ] Draft [[authentication-architecture]] proposal\n- [ ] Review [[api-security]] requirements\n- [ ] Set up [[redis-setup]] for testing`,
        links: ['authentication-architecture', 'api-security', 'redis-setup'], tags: ['journal', 'planning'] },
    { filename: '2025-08-06', title: 'August 6', isJournalEntry: true, date: new Date('2025-08-06'),
        content: `# August 6, 2025\n\n## Progress\nWorking on authentication architecture document.\n\n## Completed\n- ✅ Outlined [[authentication-architecture]] sections\n- ✅ Researched [[backend-patterns]] for auth flow`,
        links: ['authentication-architecture', 'backend-patterns'], tags: ['journal', 'development'] },
    { filename: '2025-08-08', title: 'August 8', isJournalEntry: true, date: new Date('2025-08-08'),
        content: `# August 8, 2025\n\n## Architecture Review\nPresented authentication architecture to team. Great feedback!\n\n## Key Decisions\n- Adopt [[jwt-implementation]] for API auth\n- Use [[redis-setup]] for session storage\n- Implement [[user-roles-permissions]] with RBAC`,
        links: ['jwt-implementation', 'redis-setup', 'user-roles-permissions'], tags: ['journal', 'architecture'] },
    { filename: '2025-08-09', title: 'August 9', isJournalEntry: true, date: new Date('2025-08-09'),
        content: `# August 9, 2025\n\n## Implementation Kickoff\nStarted coding the new auth system!\n\n## Today\n- Set up [[database-schema]] for users table\n- Configured [[redis-setup]] locally\n- Created basic [[express-middleware]] for auth`,
        links: ['database-schema', 'redis-setup', 'express-middleware'], tags: ['journal', 'coding'] },
    { filename: '2025-08-12', title: 'August 12', isJournalEntry: true, date: new Date('2025-08-12'),
        content: `# August 12, 2025\n\n## Steady Progress\nAuth system taking shape.\n\n## Completed\n- ✅ [[jwt-implementation]] working locally\n- ✅ [[database-migrations]] for user schema\n- ✅ Basic [[session-management]] in place`,
        links: ['jwt-implementation', 'database-migrations', 'session-management'], tags: ['journal', 'milestone'] },
    { filename: '2025-08-13', title: 'August 13', isJournalEntry: true, date: new Date('2025-08-13'),
        content: `# August 13, 2025\n\n## Code Review\nPeer review of auth implementation.\n\n## Feedback\n- Improve error handling in [[express-middleware]]\n- Add tests for [[jwt-implementation]]\n- Document [[api-security]] endpoints better`,
        links: ['express-middleware', 'jwt-implementation', 'api-security'], tags: ['journal', 'code-review'] },
    { filename: '2025-08-15', title: 'August 15', isJournalEntry: true, date: new Date('2025-08-15'),
        content: `# August 15, 2025\n\n## Mid-Sprint Check-in\nHalfway through the sprint. On track!\n\n## Status\n- [[authentication-architecture]] ✅\n- [[jwt-implementation]] 🔄 In progress\n- [[oauth-integration]] 📅 Next sprint`,
        links: ['authentication-architecture', 'jwt-implementation', 'oauth-integration'], tags: ['journal', 'status'] },
    { filename: '2025-08-16', title: 'August 16', isJournalEntry: true, date: new Date('2025-08-16'),
        content: `# August 16, 2025\n\n## Learning\nStudying repository pattern for better code organization.\n\n## Notes\n- [[repository-pattern]] makes testing easier\n- [[service-layer-design]] separates concerns nicely\n- Need to refactor [[user-repository]]`,
        links: ['repository-pattern', 'service-layer-design', 'user-repository'], tags: ['journal', 'learning'] },
    { filename: '2025-08-19', title: 'August 19', isJournalEntry: true, date: new Date('2025-08-19'),
        content: `# August 19, 2025\n\n## Security Focus\nHardening authentication system.\n\n## Today\n- Reviewed [[password-security]] best practices\n- Implemented bcrypt hashing\n- Updated [[api-security]] documentation`,
        links: ['password-security', 'api-security'], tags: ['journal', 'security'] },
    { filename: '2025-08-20', title: 'August 20', isJournalEntry: true, date: new Date('2025-08-20'),
        content: `# August 20, 2025\n\n## Bug Hunting\nFound and fixed authentication token issue.\n\n## Issue\nTokens weren't refreshing properly - documented in [[auth-token-bug]]\n\n## Fix\nUpdated [[jwt-implementation]] refresh logic`,
        links: ['auth-token-bug', 'jwt-implementation'], tags: ['journal', 'debugging'] },
    { filename: '2025-08-22', title: 'August 22', isJournalEntry: true, date: new Date('2025-08-22'),
        content: `# August 22, 2025\n\n## Sprint Retrospective\nEnd of sprint review. Great progress!\n\n## Wins\n- ✅ [[authentication-architecture]] complete\n- ✅ [[jwt-implementation]] working\n- ✅ [[database-schema]] migrated\n\n## Next Sprint\nOAuth integration and permission system`,
        links: ['authentication-architecture', 'jwt-implementation', 'database-schema'], tags: ['journal', 'retrospective'] },
    { filename: '2025-08-23', title: 'August 23', isJournalEntry: true, date: new Date('2025-08-23'),
        content: `# August 23, 2025\n\n## Planning Sprint 2\nFocusing on OAuth and permissions.\n\n## Goals\n- Implement [[oauth-integration]]\n- Build [[user-roles-permissions]] system\n- Enhance [[api-security]]`,
        links: ['oauth-integration', 'user-roles-permissions', 'api-security'], tags: ['journal', 'planning'] },
    { filename: '2025-08-26', title: 'August 26', isJournalEntry: true, date: new Date('2025-08-26'),
        content: `# August 26, 2025\n\n## OAuth Deep Dive\nStarted [[oauth-integration]] implementation.\n\n## Progress\n- Set up Google OAuth provider\n- Configured callback URLs\n- Testing with [[third-party-apis]]`,
        links: ['oauth-integration', 'third-party-apis'], tags: ['journal', 'oauth'] },
    { filename: '2025-08-27', title: 'August 27', isJournalEntry: true, date: new Date('2025-08-27'),
        content: `# August 27, 2025\n\n## Permissions System\nBuilding RBAC permissions.\n\n## Today\n- Designed [[user-roles-permissions]] schema\n- Updated [[database-schema]] for roles\n- Implemented role middleware in [[express-middleware]]`,
        links: ['user-roles-permissions', 'database-schema', 'express-middleware'], tags: ['journal', 'permissions'] },
    { filename: '2025-08-29', title: 'August 29', isJournalEntry: true, date: new Date('2025-08-29'),
        content: `# August 29, 2025\n\n## Integration Testing\nTesting OAuth flow end-to-end.\n\n## Status\n- [[oauth-integration]] working!\n- Found edge case in [[session-management]]\n- Updated [[backend-patterns]] docs`,
        links: ['oauth-integration', 'session-management', 'backend-patterns'], tags: ['journal', 'testing'] },
    { filename: '2025-08-30', title: 'August 30', isJournalEntry: true, date: new Date('2025-08-30'),
        content: `# August 30, 2025\n\n## End of Month\nReflecting on August progress.\n\n## Highlights\n- ✅ [[authentication-architecture]] designed and implemented\n- ✅ [[jwt-implementation]] production-ready\n- ✅ [[oauth-integration]] completed\n- ✅ [[user-roles-permissions]] working\n\nGreat month!`,
        links: ['authentication-architecture', 'jwt-implementation', 'oauth-integration', 'user-roles-permissions'], tags: ['journal', 'monthly-review'] },
    // SEPTEMBER 2025
    { filename: '2025-09-02', title: 'September 2', isJournalEntry: true, date: new Date('2025-09-02'),
        content: `# September 2, 2025\n\n## September Goals\nFocus on performance and database optimization.\n\n## This Month\n- Optimize [[database-schema]]\n- Implement [[caching-patterns]]\n- Improve [[redis-setup]] configuration`,
        links: ['database-schema', 'caching-patterns', 'redis-setup'], tags: ['journal', 'planning'] },
    { filename: '2025-09-03', title: 'September 3', isJournalEntry: true, date: new Date('2025-09-03'),
        content: `# September 3, 2025\n\n## Database Performance\nAnalyzing slow queries.\n\n## Findings\n- Need indexes on [[database-schema]]\n- [[caching-patterns]] could help API performance\n- [[postgres-setup]] tuning required`,
        links: ['database-schema', 'caching-patterns', 'postgres-setup'], tags: ['journal', 'performance'] },
    { filename: '2025-09-05', title: 'September 5', isJournalEntry: true, date: new Date('2025-09-05'),
        content: `# September 5, 2025\n\n## Architecture Meeting\nDiscussed backend patterns with team.\n\n## Topics\n- [[backend-patterns]] best practices\n- [[service-layer-design]] improvements\n- [[repository-pattern]] consistency`,
        links: ['backend-patterns', 'service-layer-design', 'repository-pattern'], tags: ['journal', 'architecture'] },
    { filename: '2025-09-06', title: 'September 6', isJournalEntry: true, date: new Date('2025-09-06'),
        content: `# September 6, 2025\n\n## Refactoring Day\nImproving code quality.\n\n## Progress\n- Refactored [[user-repository]] using [[repository-pattern]]\n- Applied [[dependency-injection]] to services\n- Updated [[service-layer-design]] docs`,
        links: ['user-repository', 'repository-pattern', 'dependency-injection', 'service-layer-design'], tags: ['journal', 'refactoring'] },
    { filename: '2025-09-09', title: 'September 9', isJournalEntry: true, date: new Date('2025-09-09'),
        content: `# September 9, 2025\n\n## Caching Implementation\nAdding Redis caching layer.\n\n## Today\n- Implemented [[caching-patterns]] for API responses\n- Optimized [[redis-setup]] connection pooling\n- Updated [[api-security]] to respect cache headers`,
        links: ['caching-patterns', 'redis-setup', 'api-security'], tags: ['journal', 'caching'] },
    { filename: '2025-09-10', title: 'September 10', isJournalEntry: true, date: new Date('2025-09-10'),
        content: `# September 10, 2025\n\n## Bug Fix\nPassword reset emails not sending.\n\n## Issue\nSMTP configuration problem - documented in [[password-reset-bug]]\n\n## Fixed\nUpdated email service and [[password-security]] flow`,
        links: ['password-reset-bug', 'password-security'], tags: ['journal', 'bugfix'] },
    { filename: '2025-09-12', title: 'September 12', isJournalEntry: true, date: new Date('2025-09-12'),
        content: `# September 12, 2025\n\n## Database Migrations\nPreparing schema changes for production.\n\n## Today\n- Created [[database-migrations]] for new features\n- Tested rollback procedures\n- Updated [[postgres-setup]] backup strategy`,
        links: ['database-migrations', 'postgres-setup'], tags: ['journal', 'database'] },
    { filename: '2025-09-13', title: 'September 13', isJournalEntry: true, date: new Date('2025-09-13'),
        content: `# September 13, 2025\n\n## Code Review Friday\nReviewing team PRs.\n\n## Reviewed\n- [[express-middleware]] error handling improvements\n- [[session-management]] timeout logic\n- [[backend-patterns]] documentation updates`,
        links: ['express-middleware', 'session-management', 'backend-patterns'], tags: ['journal', 'code-review'] },
    { filename: '2025-09-16', title: 'September 16', isJournalEntry: true, date: new Date('2025-09-16'),
        content: `# September 16, 2025\n\n## Security Review\nPreparing for security audit.\n\n## Checklist\n- [ ] Review [[api-security]] endpoints\n- [ ] Audit [[password-security]] implementation\n- [ ] Check [[jwt-implementation]] for vulnerabilities\n- [ ] Update [[authentication-architecture]] docs`,
        links: ['api-security', 'password-security', 'jwt-implementation', 'authentication-architecture'], tags: ['journal', 'security'] },
    { filename: '2025-09-17', title: 'September 17', isJournalEntry: true, date: new Date('2025-09-17'),
        content: `# September 17, 2025\n\n## Third-Party Integration\nExploring analytics and monitoring tools.\n\n## Research\n- Evaluated [[third-party-apis]] for logging\n- Set up error tracking service\n- Integrated with monitoring dashboard`,
        links: ['third-party-apis'], tags: ['journal', 'integration'] },
    { filename: '2025-09-19', title: 'September 19', isJournalEntry: true, date: new Date('2025-09-19'),
        content: `# September 19, 2025\n\n## Team Meeting\nQuarterly planning session.\n\n## Discussed\n- Q4 roadmap priorities\n- [[authentication-architecture]] improvements\n- New features for [[user-roles-permissions]]\n- Performance optimization goals`,
        links: ['authentication-architecture', 'user-roles-permissions'], tags: ['journal', 'meeting'] },
    { filename: '2025-09-20', title: 'September 20', isJournalEntry: true, date: new Date('2025-09-20'),
        content: `# September 20, 2025\n\n## Sprint Retrospective\nReflecting on September so far.\n\n## Wins\n- ✅ [[caching-patterns]] reduced API latency by 60%\n- ✅ [[database-migrations]] running smoothly\n- ✅ [[postgres-setup]] optimized\n\n## Improvements\n- Need more test coverage\n- Documentation could be better`,
        links: ['caching-patterns', 'database-migrations', 'postgres-setup'], tags: ['journal', 'retrospective'] },
    { filename: '2025-09-23', title: 'September 23', isJournalEntry: true, date: new Date('2025-09-23'),
        content: `# September 23, 2025\n\n## Learning Week\nDiving into advanced patterns.\n\n## Topics\n- [[dependency-injection]] best practices\n- [[service-layer-design]] anti-patterns\n- [[repository-pattern]] variations`,
        links: ['dependency-injection', 'service-layer-design', 'repository-pattern'], tags: ['journal', 'learning'] },
    { filename: '2025-09-24', title: 'September 24', isJournalEntry: true, date: new Date('2025-09-24'),
        content: `# September 24, 2025\n\n## Middleware Improvements\nRefactoring authentication middleware.\n\n## Changes\n- Simplified [[express-middleware]] auth flow\n- Better error messages\n- Added request logging`,
        links: ['express-middleware'], tags: ['journal', 'middleware'] },
    { filename: '2025-09-26', title: 'September 26', isJournalEntry: true, date: new Date('2025-09-26'),
        content: `# September 26, 2025\n\n## Security Hardening\nApplying security best practices.\n\n## Completed\n- ✅ Added rate limiting to [[api-security]]\n- ✅ Implemented CSRF protection\n- ✅ Updated [[password-security]] requirements`,
        links: ['api-security', 'password-security'], tags: ['journal', 'security'] },
    { filename: '2025-09-27', title: 'September 27', isJournalEntry: true, date: new Date('2025-09-27'),
        content: `# September 27, 2025\n\n## Documentation Day\nUpdating all technical docs.\n\n## Updated\n- [[authentication-architecture]] with latest changes\n- [[backend-patterns]] with new examples\n- [[database-schema]] with recent migrations`,
        links: ['authentication-architecture', 'backend-patterns', 'database-schema'], tags: ['journal', 'documentation'] },
    { filename: '2025-09-30', title: 'September 30', isJournalEntry: true, date: new Date('2025-09-30'),
        content: `# September 30, 2025\n\n## End of September\nReflecting on the month.\n\n## Highlights\n- ✅ Major performance improvements with [[caching-patterns]]\n- ✅ [[database-migrations]] strategy working well\n- ✅ Security hardening complete\n- ✅ Great progress on [[backend-patterns]] adoption\n\nReady for October!`,
        links: ['caching-patterns', 'database-migrations', 'backend-patterns'], tags: ['journal', 'monthly-review'] },
    // OCTOBER 2025
    { filename: '2025-10-01', title: 'October 1', isJournalEntry: true, date: new Date('2025-10-01'),
        content: `# October 1, 2025\n\n## October Planning\nQ4 officially begins!\n\n## Focus Areas\n- Security audit preparation\n- [[authentication-architecture]] enhancements\n- Team knowledge sharing on [[backend-patterns]]`,
        links: ['authentication-architecture', 'backend-patterns'], tags: ['journal', 'planning'] },
    { filename: '2025-10-02', title: 'October 2', isJournalEntry: true, date: new Date('2025-10-02'),
        content: `# October 2, 2025\n\n## Security Audit Prep\nGetting ready for external audit.\n\n## Checklist\n- ✅ Reviewed [[api-security]] configurations\n- ✅ Verified [[jwt-implementation]] follows best practices\n- 🔄 Updating [[password-security]] documentation`,
        links: ['api-security', 'jwt-implementation', 'password-security'], tags: ['journal', 'security'] },
    { filename: '2025-10-03', title: 'October 3', isJournalEntry: true, date: new Date('2025-10-03'),
        content: `# October 3, 2025\n\n## Team Knowledge Sharing\nPresenting authentication system to new team members.\n\n## Covered\n- [[authentication-architecture]] overview\n- [[oauth-integration]] setup\n- [[user-roles-permissions]] usage`,
        links: ['authentication-architecture', 'oauth-integration', 'user-roles-permissions'], tags: ['journal', 'teaching'] },
    { filename: '2025-10-04', title: 'October 4', isJournalEntry: true, date: new Date('2025-10-04'),
        content: `# October 4, 2025\n\n## Database Optimization\nContinuing performance improvements.\n\n## Today\n- Optimized [[database-schema]] indexes\n- Analyzed query performance\n- Updated [[postgres-setup]] configuration`,
        links: ['database-schema', 'postgres-setup'], tags: ['journal', 'database'] },
    { filename: '2025-10-07', title: 'October 7', isJournalEntry: true, date: new Date('2025-10-07'),
        content: `# October 7, 2025\n\n## Code Quality Focus\nRefactoring and cleanup week.\n\n## Progress\n- Improved [[service-layer-design]] consistency\n- Updated [[repository-pattern]] implementations\n- Enhanced [[user-repository]] error handling`,
        links: ['service-layer-design', 'repository-pattern', 'user-repository'], tags: ['journal', 'refactoring'] },
    { filename: '2025-10-08', title: 'October 8', isJournalEntry: true, date: new Date('2025-10-08'),
        content: `# October 8, 2025\n\n## Redis Deep Dive\nOptimizing cache layer.\n\n## Improvements\n- Fine-tuned [[redis-setup]] memory limits\n- Implemented smarter [[caching-patterns]]\n- Reduced cache misses by 30%`,
        links: ['redis-setup', 'caching-patterns'], tags: ['journal', 'performance'] },
    { filename: '2025-10-09', title: 'October 9', isJournalEntry: true, date: new Date('2025-10-09'),
        content: `# October 9, 2025\n\n## Middleware Enhancements\nAdding new capabilities.\n\n## Added\n- Request tracing to [[express-middleware]]\n- Better logging\n- Performance monitoring hooks`,
        links: ['express-middleware'], tags: ['journal', 'middleware'] },
    { filename: '2025-10-10', title: 'October 10', isJournalEntry: true, date: new Date('2025-10-10'),
        content: `# October 10, 2025\n\n## Security Meeting\nScheduled [[team-security-meeting]] to discuss audit.\n\n## Topics\n- Current security posture\n- [[api-security]] hardening\n- [[password-security]] policies\n- Audit preparation timeline`,
        links: ['team-security-meeting', 'api-security', 'password-security'], tags: ['journal', 'meeting'] },
    { filename: '2025-10-11', title: 'October 11', isJournalEntry: true, date: new Date('2025-10-11'),
        content: `# October 11, 2025\n\n## Bug Fixes\nAddressing minor issues.\n\n## Fixed\n- Resolved [[auth-token-bug]] edge case\n- Merged [[password-reset-bug]] hotfix\n- Updated related documentation`,
        links: ['auth-token-bug', 'password-reset-bug'], tags: ['journal', 'bugfix'] },
    { filename: '2025-10-14', title: 'October 14', isJournalEntry: true, date: new Date('2025-10-14'),
        content: `# October 14, 2025\n\n## Integration Work\nConnecting with third-party services.\n\n## Progress\n- Integrated new [[third-party-apis]]\n- Set up webhooks\n- Added API client libraries`,
        links: ['third-party-apis'], tags: ['journal', 'integration'] },
    { filename: '2025-10-15', title: 'October 15', isJournalEntry: true, date: new Date('2025-10-15'),
        content: `# October 15, 2025\n\n## Session Management Review\nEvaluating current approach.\n\n## Findings\n- [[session-management]] working well\n- [[redis-setup]] stable\n- Considering session timeout adjustments`,
        links: ['session-management', 'redis-setup'], tags: ['journal', 'review'] },
    { filename: '2025-10-16', title: 'October 16', isJournalEntry: true, date: new Date('2025-10-16'),
        content: `# October 16, 2025\n\n## Database Migrations\nDeploying schema changes.\n\n## Completed\n- ✅ Ran [[database-migrations]] in staging\n- ✅ Verified backward compatibility\n- ✅ Updated [[database-schema]] docs`,
        links: ['database-migrations', 'database-schema'], tags: ['journal', 'deployment'] },
    { filename: '2025-10-17', title: 'October 17', isJournalEntry: true, date: new Date('2025-10-17'),
        content: `# October 17, 2025\n\n## Architecture Review\nQuarterly architecture assessment.\n\n## Review\n- [[authentication-architecture]] still solid\n- [[backend-patterns]] being followed consistently\n- Minor improvements identified`,
        links: ['authentication-architecture', 'backend-patterns'], tags: ['journal', 'architecture'] },
    { filename: '2025-10-18', title: 'October 18', isJournalEntry: true, date: new Date('2025-10-18'),
        content: `# October 18, 2025\n\n## Sprint Retrospective\nReviewing last two weeks.\n\n## Wins\n- ✅ Security audit prep on track\n- ✅ Performance improvements shipped\n- ✅ Code quality improved\n\n## Next Sprint\nFocus on testing and documentation`,
        links: [], tags: ['journal', 'retrospective'] },
    { filename: '2025-10-21', title: 'October 21', isJournalEntry: true, date: new Date('2025-10-21'),
        content: `# October 21, 2025\n\n## Testing Focus\nImproving test coverage.\n\n## Progress\n- Added tests for [[jwt-implementation]]\n- Tested [[oauth-integration]] edge cases\n- Improved [[user-repository]] test suite`,
        links: ['jwt-implementation', 'oauth-integration', 'user-repository'], tags: ['journal', 'testing'] },
    { filename: '2025-10-22', title: 'October 22', isJournalEntry: true, date: new Date('2025-10-22'),
        content: `# October 22, 2025\n\n## Security Audit Results\nReceived initial [[security-audit-results]]!\n\n## Summary\n- 5 low priority issues\n- 2 medium priority issues\n- 0 high priority issues\n\nGreat results overall!`,
        links: ['security-audit-results'], tags: ['journal', 'security'] },
    { filename: '2025-10-23', title: 'October 23', isJournalEntry: true, date: new Date('2025-10-23'),
        content: `# October 23, 2025\n\n## Addressing Audit Findings\nFixing security audit issues.\n\n## Today\n- Fixed 3 low priority items\n- Planned fixes for medium priority issues\n- Updated [[api-security]] based on recommendations`,
        links: ['api-security'], tags: ['journal', 'security'] },
    { filename: '2025-10-24', title: 'October 24', isJournalEntry: true, date: new Date('2025-10-24'),
        content: `# October 24, 2025\n\n## Dependency Injection\nRefactoring services for better testability.\n\n## Progress\n- Applied [[dependency-injection]] to auth services\n- Updated [[service-layer-design]]\n- Improved test mocking`,
        links: ['dependency-injection', 'service-layer-design'], tags: ['journal', 'refactoring'] },
    { filename: '2025-10-25', title: 'October 25', isJournalEntry: true, date: new Date('2025-10-25'),
        content: `# October 25, 2025\n\n## Documentation Sprint\nCatching up on technical docs.\n\n## Updated\n- [[authentication-architecture]] with security audit notes\n- [[backend-patterns]] with recent learnings\n- [[caching-patterns]] with performance metrics`,
        links: ['authentication-architecture', 'backend-patterns', 'caching-patterns'], tags: ['journal', 'documentation'] },
    { filename: '2025-10-28', title: 'October 28', isJournalEntry: true, date: new Date('2025-10-28'),
        content: `# October 28, 2025\n\n## Permission System Enhancement\nAdding new role capabilities.\n\n## Changes\n- Extended [[user-roles-permissions]] schema\n- Added granular permissions\n- Updated [[database-schema]]`,
        links: ['user-roles-permissions', 'database-schema'], tags: ['journal', 'permissions'] },
    { filename: '2025-10-29', title: 'October 29', isJournalEntry: true, date: new Date('2025-10-29'),
        content: `# October 29, 2025\n\n## Code Review Day\nReviewing team contributions.\n\n## Reviewed\n- [[express-middleware]] logging improvements\n- [[session-management]] timeout updates\n- [[postgres-setup]] backup automation`,
        links: ['express-middleware', 'session-management', 'postgres-setup'], tags: ['journal', 'code-review'] },
    { filename: '2025-10-30', title: 'October 30', isJournalEntry: true, date: new Date('2025-10-30'),
        content: `# October 30, 2025\n\n## Performance Analysis\nReviewing system performance metrics.\n\n## Findings\n- [[caching-patterns]] reduced load by 70%\n- [[redis-setup]] stable under high load\n- [[database-schema]] optimizations effective`,
        links: ['caching-patterns', 'redis-setup', 'database-schema'], tags: ['journal', 'performance'] },
    { filename: '2025-10-31', title: 'October 31', isJournalEntry: true, date: new Date('2025-10-31'),
        content: `# October 31, 2025 🎃\n\n## End of October\nReflecting on a productive month.\n\n## Highlights\n- ✅ Security audit passed with flying colors\n- ✅ All audit issues resolved\n- ✅ Performance metrics improved\n- ✅ Great team collaboration\n\nReady for November!`,
        links: [], tags: ['journal', 'monthly-review'] },
    // NOVEMBER 2025
    { filename: '2025-11-01', title: 'November 1', isJournalEntry: true, date: new Date('2025-11-01'),
        content: `# November 1, 2025\n\n## November Goals\nFinal push for Q4!\n\n## This Month\n- Polish [[authentication-architecture]] documentation\n- Optimize [[backend-patterns]] adoption\n- Plan Q1 2026 roadmap`,
        links: ['authentication-architecture', 'backend-patterns'], tags: ['journal', 'planning'] },
    { filename: '2025-11-04', title: 'November 4', isJournalEntry: true, date: new Date('2025-11-04'),
        content: `# November 4, 2025\n\n## System Review\nComprehensive system health check.\n\n## Status\n- [[authentication-architecture]] ✅ Excellent\n- [[api-security]] ✅ Hardened\n- [[database-schema]] ✅ Optimized\n- [[caching-patterns]] ✅ Performing well\n\nSystem is solid!`,
        links: ['authentication-architecture', 'api-security', 'database-schema', 'caching-patterns'], tags: ['journal', 'review'] },
    { filename: '2025-11-05', title: 'November 5', isJournalEntry: true, date: new Date('2025-11-05'),
        content: `# November 5, 2025\n\n## Today\nFocusing on final documentation and knowledge transfer.\n\n## Tasks\n- [ ] Update all [[backend-patterns]] examples\n- [ ] Record walkthrough of [[authentication-architecture]]\n- [ ] Write migration guide for [[database-migrations]]\n- [ ] Document [[caching-patterns]] best practices\n\n## Notes\nFeeling good about the state of our system. Solid foundation for next year!`,
        links: ['backend-patterns', 'authentication-architecture', 'database-migrations', 'caching-patterns'], tags: ['journal', 'documentation'] }
];
/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Format date components
 */
function formatDate(date) {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    return { year, month, day, monthName };
}
/**
 * Generate a single note file
 */
function generateNote(note) {
    let filePath;
    let filename;
    if (note.isJournalEntry) {
        // Journal entry: Create in YYYY/MM-MonthName/YYYY-MM-DD.ext format
        const { year, month, day, monthName } = formatDate(note.date);
        const yearPath = path.join(NOTES_BASE_PATH, year);
        const monthPath = path.join(yearPath, `${month}-${monthName}`);
        ensureDir(monthPath);
        filename = `${year}-${month}-${day}.${FILE_FORMAT}`;
        filePath = path.join(monthPath, filename);
    }
    else {
        // Inbox note: Create in Inbox/title.ext format (no date prefix)
        const inboxPath = path.join(NOTES_BASE_PATH, 'Inbox');
        ensureDir(inboxPath);
        filename = `${note.filename}.${FILE_FORMAT}`;
        filePath = path.join(inboxPath, filename);
    }
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
function main() {
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
    const inboxNotes = notesData.filter(n => !n.isJournalEntry).length;
    const journalNotes = notesData.filter(n => n.isJournalEntry).length;
    console.log(`   Inbox notes: ${inboxNotes}`);
    console.log(`   Journal entries: ${journalNotes}`);
    console.log(`   Total links: ${totalLinks}`);
    console.log(`   Average links per note: ${avgLinks}`);
    console.log(`   Hub notes (5+ connections): ${hubNotes}`);
    console.log(`   Orphaned notes (0 connections): ${orphanNotes}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Open VS Code');
    console.log('   2. Make sure your Noted extension is configured to use:');
    console.log(`      ${NOTES_BASE_PATH}`);
    console.log('   3. Refresh the Notes view (click refresh icon)');
    console.log('   4. Check "Inbox" for reference notes');
    console.log('   5. Check "Journal" → 2025 → 10-October and 11-November for daily notes');
    console.log('   6. Run "Noted: Show Calendar" (Cmd+Shift+C) to see calendar view');
    console.log('   7. Run "Noted: Show Graph" (Cmd+Shift+G) to see connections');
    console.log('\n📍 If notes don\'t appear, your VS Code notes folder setting may be different.');
    console.log('   Check: VS Code Settings → Search "noted.notesFolder"');
}
// Run the script
main();
//# sourceMappingURL=generateGraphTestData.js.map