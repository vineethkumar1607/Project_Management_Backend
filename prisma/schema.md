# Prisma Schema Documentation

## Overview
This schema represents a multi-tenant project management system where users can belong to multiple workspaces and projects. The schema is designed to support scalability, role-based access, and future extensibility.

---

## Core Entities

### User
Represents a system user. A user can:
- Own multiple workspaces
- Be a member of many workspaces and projects
- Be assigned tasks
- Create comments

UUIDs are used to support distributed systems and avoid ID collisions.

---

### Workspace
A workspace is a tenant boundary. All projects and members belong to a workspace.

Key design decisions:
- `slug` is unique for clean URLs
- `settings` is JSON for flexible configuration
- Deleting a workspace cascades to projects and members

---

### WorkspaceMember
Join table between User and Workspace.
- Prevents duplicate membership
- Stores role information
- Allows invitation metadata

---

### Project
Projects belong to a workspace and are owned by a team lead.
- Supports lifecycle status
- Tracks progress
- Uses enums for consistency

---

### ProjectMember
Join table between User and Project.
- Allows future role expansion
- Keeps membership normalized

---

### Task
Tasks belong to projects and are assigned to users.
- Status and type are enforced via enums
- Designed to support agile workflows

---

### Comment
Comments are immutable records tied to tasks.
- No update timestamp by design
- Useful for audit history

---

## Enums

Enums are used to enforce business rules at the database level and prevent invalid states.

---

## Deletion Strategy

Cascade deletes are used to:
- Prevent orphaned records
- Maintain referential integrity

---

## Migration Strategy

- `DATABASE_URL` is used for runtime (pooled)
- `DIRECT_URL` is used for migrations
- Migrations are version controlled

---

## Future Considerations

- Role-based permissions at project level
- Soft deletes for audit logs
- Activity tracking


### _____________________________________________________________________________________________

## About schema.prisma File 

schema.prisma is NOT just models
It is:

Database contract

Data ownership map

Relationship graph

Migration source

Client generation source

## Section-by-Section Explanation

# Generator Block
generator client {
  provider = "prisma-client-js"
}

Tells Prisma to generate a JavaScript/TypeScript client

This client is what you import in Node.js:

import { PrismaClient } from "@prisma/client";

Without this → no Prisma Client → no DB access

## Datasource Block (VERY IMPORTANT)
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

url	      =  Used at runtime (can be pooled)
directUrl = Used for migrations (non-pooled)

# Enums (Strong Domain Modeling)

enum WorkspaceRole {
  ADMIN
  MEMBER
}

Prevent invalid values
Improve readability
Enforce business rules at DB level

# Enums  defined:

WorkspaceRole → RBAC
TaskStatus → workflow
TaskType → classification
ProjectStatus → lifecycle
Priority → ordering

## Model-by-Model Explanation 
# User Model

Key ideas:
UUID primary key (good for distributed systems)
Owns workspaces & projects
Can be member of many workspaces/projects
Can be assignee of tasks
Can write comments
Relations:
One user → many workspaces (owned)
One user → many memberships
One user → many tasks (assigned)

## Workspace Model

Key ideas:
Multi-tenant boundary
Has owner
Has members
Has projects

Important:
slug String @unique

Perfect for URLs:
/workspace/my-company

## WorkspaceMember (Join Table)

Purpose:
Many-to-many between User & Workspace

Stores role & invitation message

@@unique([userId, workspaceId])


* Prevents duplicate memberships

## Project Model

Key ideas:
Belongs to workspace
Has team lead (owner)
Has members
Has tasks
Has lifecycle status

Relation naming:
@relation("ProjectOwner")


This avoids ambiguity since User relates to Project in multiple ways.

## ProjectMember (Join Table)

Many-to-many User ↔ Project
Clean separation
Scalable for permissions later

## Task Model

Key ideas:
Belongs to project
Assigned to one user
Has status, type, priority
Has due date
Has comments

## Comment Model

Key ideas:
Belongs to task
Written by user
Immutable (no updatedAt)
