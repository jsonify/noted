---
title: Templates System
date: 2025-10-24 10:00:00 -0800
categories: [Features, Templates]
tags: [templates, automation, productivity]
---

# What is the Templates System?

Create structured notes quickly with built-in and custom templates featuring dynamic variables.

## Quick Start

1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Open with Template"
3. Enter note name
4. Select template
5. Start writing!

## Built-in Templates

### Meeting Template

```markdown
# Meeting: {filename}
**Date**: {date}
**Time**: {time}

## Attendees
-

## Agenda
1.

## Notes


## Action Items
- [ ]

## Next Steps

```

### Research Template

```markdown
# Research: {filename}
**Date**: {date}
**Researcher**: {user}

## Topic


## Questions
-

## Findings


## Sources
-

## Conclusions

```

### Problem-Solution Template

```markdown
# Problem: {filename}
**Date**: {date}

## Problem Statement


## Steps Taken
1.

## Solution


## Notes

```

### Quick Template

```markdown
# {filename}
**Date**: {date}
**Time**: {time}

```

## Template Variables

Templates support 10 dynamic placeholders:

| Variable | Example Output | Description |
|----------|---------------|-------------|
| `{filename}` | `project-meeting` | Note file name |
| `{date}` | `Sunday, October 23, 2024` | Full date |
| `{time}` | `2:30 PM` | 12-hour time |
| `{year}` | `2024` | Year |
| `{month}` | `10` | Month (with leading zero) |
| `{day}` | `23` | Day (with leading zero) |
| `{weekday}` | `Sun` | Short day name |
| `{month_name}` | `October` | Full month name |
| `{user}` | `john` | System username |
| `{workspace}` | `my-project` | VS Code workspace name |

## Custom Templates

### Template Browser (v1.44.0)

**Visual template management interface** with grid/list views, search, and quick actions.

#### Opening the Template Browser

```
Command: Noted: Show Template Browser
Shortcut: Command Palette → "Template Browser"
```

#### Features

**View Modes**:
- **Grid View**: Visual cards with template previews
- **List View**: Compact list for quick scanning
- Toggle instantly with view buttons

**Search & Filter**:
- **Real-time search**: Filter by name, description, or tags
- **Category filters**: All, Built-in, Custom, and more
- **Statistics dashboard**: See total, custom, and built-in counts

**Template Cards Display**:
- Template name and description
- Category badge
- Tags for organization
- Version number
- Usage count (if available)

**Quick Actions**:
- **Create**: Start new note from template immediately
- **Edit**: Modify template content (custom only)
- **Duplicate**: Copy template as starting point
- **Export**: Save template to file
- **Delete**: Remove template (custom only)

**Benefits**:
- Browse all templates visually
- Search across names, descriptions, and tags
- One-click note creation
- Organize by category
- Track template usage

**Pro Tips**:
- Use search to quickly find templates
- Filter by category for focused browsing
- Duplicate templates to create variations
- Export templates to share with team

### Creating Custom Templates

1. Open Command Palette
2. Run "Noted: Create Custom Template"
3. Enter template name
4. Edit the template file
5. Use any variables from the table above

Example custom template:

```markdown
# Daily Standup - {date}
**Team Member**: {user}
**Project**: {workspace}

## Yesterday
-

## Today
-

## Blockers
-

---
Tags: #standup #team
```

### Managing Templates

**Edit Template**:
```
Command: Noted: Edit Custom Template
```

**Duplicate Template**:
```
Command: Noted: Duplicate Custom Template
```

**Delete Template**:
```
Command: Noted: Delete Custom Template
```

**Open Templates Folder**:
```
Command: Noted: Open Templates Folder
Location: {notesFolder}/.templates/
```

### Preview Variables

See all available variables and their current values:

```
Command: Noted: Preview Template Variables
```

This shows a webview with all 10 variables and example output.

## Use Cases

### Daily Standups

Create a consistent format for team updates:

```markdown
# Standup - {date}
**Team**: {workspace}

## Completed
- Finished [[feature-authentication]]
- Fixed [[bug-123]]

## In Progress
- Working on [[api-refactor]]

## Planned
- Start [[database-migration]]

## Blockers
None

Tags: #standup
```

### Bug Reports

Standardize bug documentation:

```markdown
# Bug: {filename}
**Reported**: {date} at {time}
**Reporter**: {user}

## Description


## Steps to Reproduce
1.
2.
3.

## Expected Behavior


## Actual Behavior


## Environment
- OS:
- Version:
- Browser:

## Solution


Tags: #bug
```

### Project Planning

Structure project documents:

```markdown
# Project: {filename}
**Created**: {date}
**Owner**: {user}
**Workspace**: {workspace}

## Overview


## Goals
-

## Timeline
- **Start**: {year}-{month}-{day}
- **End**:

## Resources
-

## Related Notes
- [[team-structure]]
- [[requirements]]

Tags: #project #planning
```

## Best Practices

1. **Use Variables**: Leverage dynamic variables for consistency
2. **Include Tags**: Add relevant tags in templates
3. **Add Links**: Include common note links
4. **Structure Matters**: Use clear headings and sections
5. **Keep It Simple**: Don't over-complicate templates

## Tips & Tricks

### Checklists

Use markdown checkboxes for action items:

```markdown
## Tasks
- [ ] Review code
- [ ] Update docs
- [ ] Run tests
```

### Metadata Section

Add frontmatter for advanced features:

```markdown
---
tags: [meeting, project-alpha]
status: active
priority: high
---

# Meeting Notes
```

### Code Blocks

Include language-specific code blocks:

````markdown
## Implementation

```javascript
function example() {
  // code here
}
```
````

## AI-Powered User Story Generation

**Generate comprehensive, technical user stories** with AI assistance for agile software development.

### Quick Start

1. Open Command Palette (`Cmd+Shift+P`)
2. Run "Noted: Create User Story with AI"
3. Enter brief description (e.g., "Set up GCP project with networking")
4. Choose whether you have additional context
5. (Optional) Paste architecture details, dependencies, tech stack
6. Review and create!

### What You Get

The AI generates a **production-ready user story** with:

- **Scope Statement**: What part of the system this addresses
- **Story Title**: Concise, specific title
- **Description**: Professional "As a [role], I want [goal], So that [benefit]" format
- **5-15 Technical Tasks**: Specific, actionable steps with service names
- **3-7 Acceptance Criteria**: Testable, verifiable outcomes
- **Dependencies**: Required access, prerequisites, blocking items
- **Time Estimate**: Realistic effort estimation

### Example Output

**Input**:
```
Description: Establish GCP project and core networking infrastructure
Context: Integration with JFrog Cloud, VPN to on-prem AD, uses Cloud NAT,
DataProc, GKE, GAR, requires network peering with JFrog-managed services
```

**Generated User Story**:

```markdown
---
tags: [user-story]
created: 2025-11-13T22:30:26.883Z
status: draft
---

# User Story: Establish GCP Project and Core Networking Infrastructure

**Created:** Thursday, November 13, 2025 | **Author:** jruecke

## Scope
Foundation for the Managed GCP section of multi-cloud deployment

## Story Title
Establish GCP Project and Core Networking Infrastructure

## Description
As a Platform Engineer,
I want a properly configured GCP project with networking for JFrog SaaS,
So that development teams have secure infrastructure for deploying services.

### Tasks
- [ ] Create GCP project(s) with appropriate billing and IAM structure
- [ ] Configure VPC networks for GCP region deployment
- [ ] Establish subnet allocation for Cloud Run, DataProc, GKE, and GAR
- [ ] Configure Cloud NAT and Cloud Router
- [ ] Set up VPC firewall rules for inter-service communication
- [ ] Configure private Google access for subnets
- [ ] Establish connectivity to JFrog Cloud Global Load Balancer
- [ ] Establish VPN/Interconnect to on-premises for authentication
- [ ] Set up VPC peering requirements for JFrog-managed services
- [ ] Document network architecture diagram
- [ ] Set up initial Cloud Logging and Cloud Monitoring workspace

## Acceptance Criteria
- [ ] GCP project provisioned and accessible
- [ ] VPC networks configured with connectivity to JFrog Cloud
- [ ] Network connectivity to authentication provider verified
- [ ] Firewall rules allow traffic flow per architecture
- [ ] Architecture documentation created

## Dependencies
- JFrog SaaS subscription and architecture guidance
- Authentication provider details (LDAP/AD endpoints)
- Network IP addressing scheme approved

## Estimate
**Time to Complete:** 2-3 days
```

### Pro Tips for Better Results

**1. Be Specific**: Instead of "Add user authentication", say "Add OAuth2 authentication with Google Sign-In"

**2. Provide Context**: Include:
   - Integration points (APIs, services, external systems)
   - Technology stack (languages, frameworks, cloud services)
   - Dependencies (what must exist first)
   - Architecture constraints (security, compliance, scalability)

**3. Example Context Formats**:

```
# Infrastructure Story
Context: Uses AWS EKS, RDS PostgreSQL, ALB, integrates with
DataDog monitoring, requires IAM roles for service accounts

# Feature Story
Context: React frontend, Node.js backend, MongoDB, uses Stripe API,
needs WebSocket for real-time updates

# Integration Story
Context: Connects to Salesforce API v52, uses OAuth2, requires
scheduled sync every 15 minutes, max 10k records per sync
```

**4. Without Context**: Still works! AI generates good generic stories, just less specific to your architecture

### How It Works

1. **Query Analysis**: AI analyzes your description and context
2. **Technical Depth**: Generates 5-15 tasks based on complexity
   - Simple features: 5-7 tasks
   - Complex infrastructure: 8-12+ tasks
3. **Specific Details**: Incorporates service names, tech stack from context
4. **Professional Format**: Follows agile best practices
5. **Saved**: Note created in `Notes/User Stories/` folder

### Configuration

Uses your preferred AI model (Claude Sonnet, GPT-4, etc.):

```
Setting: noted.templates.preferredModel
Default: Automatic (Claude > GPT > Gemini)
```

### Best Practices

**DO**:
- ✅ Include specific technologies and services in context
- ✅ Mention integration points between systems
- ✅ Specify compliance or security requirements
- ✅ List blocking dependencies upfront

**DON'T**:
- ❌ Use vague descriptions like "make it better"
- ❌ Skip context for complex infrastructure tasks
- ❌ Forget to mention external systems or APIs
- ❌ Ignore prerequisites or access requirements

### Comparison: With vs Without Context

| Without Context | With Context |
|----------------|--------------|
| "Create a new GCP project" | "Create GCP project with billing, enable Compute Engine, Cloud Storage, and Kubernetes Engine APIs" |
| "Set up networking" | "Configure VPC with subnets for dev/prod, Cloud NAT, Cloud Router, firewall rules for SSH/HTTPS from specific IPs" |
| "Configure access" | "Set up IAM roles for Project Admin and Developer, configure VPN to on-prem AD for authentication" |

**Result**: Context gives you 3x more actionable, technical detail!

## Related Features

- [Daily Notes](/noted/posts/daily-notes/) - Quick daily note access
- [Tags](/noted/posts/tags/) - Organize with tags
- [Wiki Links](/noted/posts/wiki-links/) - Connect notes
- [Bundles](/noted/posts/bundles/) - Multi-note workflows

---

Start using templates to standardize your note-taking workflow! 📋
