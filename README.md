# Project Management Backend

Backend service for the Project Management application.
This server handles authentication integration, database management, and event-driven workflows for user lifecycle events.

The backend is built using **Node.js, Express, Prisma ORM, PostgreSQL, Clerk Authentication, and Inngest for background workflows.**

# Tech Stack

* Node.js
* Express.js
* PostgreSQL
* Prisma ORM
* Clerk Authentication
* Inngest (Event-driven background jobs)
* Neon Serverless PostgreSQL
* WebSocket adapter for serverless database connections

# Project Architecture

The backend follows a **modular architecture** with clear separation of concerns.

server
│
├── inngest
│   ├── client.js
│   ├── index.js
│   └── users.js
│
├── prisma
│   └── schema.prisma
│
├── db
│   └── prisma.js
│
└── server.js

### Key Layers

**Express Server**

* Handles API requests
* Registers middleware
* Integrates Clerk authentication
* Registers Inngest event endpoint

**Authentication**

* Managed using Clerk
* Clerk middleware verifies users and injects authentication data into requests

**Event Processing**

* Inngest is used to handle background workflows triggered by Clerk events

**Database**

* PostgreSQL database managed through Prisma ORM
* Neon adapter used for serverless compatibility

**Controllers**

- Handle business logic
- Interact with Prisma ORM
- Format responses for frontend

**Routes**

- Define API endpoints
- Attach middleware and controllers

**Middleware**

- Authentication via Clerk
- Protects private routes
- Injects userId into request
# Features

### Authentication Integration

Clerk is used for user authentication.
The backend listens to Clerk events and synchronizes user data with the database.

### Event Driven Architecture

Inngest handles asynchronous workflows triggered by events such as:

* `clerk/user.created`
* `clerk/user.updated`
* `clerk/user.deleted`

### Database Management

Prisma ORM is used to manage the PostgreSQL database schema and queries.

### Multi-Tenant Design

The application supports multiple workspaces where users can collaborate across projects.
### Workspace Management

- Fetch user workspaces
- Add members to workspace
- Role-based access (ADMIN / MEMBER)

### Project Management

- Fetch projects per workspace
- Access control based on membership

### Task Management

- Fetch tasks per project
- Includes assignee and comments

### Comment System

- Fetch task-level comments
- Includes user metadata

# API Endpoints

## Health Check
GET /

Response:
{
  "message": "Server is running successfully!"
}

## Inngest Endpoint
/api/inngest
This endpoint is used by Inngest to:

* Discover registered functions
* Trigger background jobs
* Handle retries
* Execute event workflows

# Event Driven User Sync

User lifecycle events from Clerk automatically synchronize with the database.

## User Creation

Triggered by:
clerk/user.created

Function behavior:

* Extracts user data from Clerk
* Creates a user record in the database

## User Update

Triggered by:
clerk/user.updated

Function behavior:
* Updates the user name and profile image

## User Deletion

Triggered by:
clerk/user.deleted

Function behavior:

* Removes the user from the database

## Workspace APIs

### Get User Workspaces
GET /api/workspace

Returns all workspaces the authenticated user belongs to.

Response:
{
  "success": true,
  "data": [
    {
      "id": "workspace_id",
      "name": "Workspace Name",
      "slug": "workspace-slug",
      "image_url": "https://..."
    }
  ]
}

---

### Add Workspace Member
POST /api/workspace/add-member

Adds a user to a workspace (Admin only).

Request Body:
{
  "email": "user@example.com",
  "role": "ADMIN | MEMBER",
  "workspaceId": "workspace_id",
  "message": "Optional invite message"
}

Response:
{
  "success": true,
  "message": "Member added successfully",
  "data": { ... }
}

## Project APIs

### Get Workspace Projects
GET /api/projects/workspace/:workspaceId/projects

Fetch all projects within a workspace.

Response:
{
  "success": true,
  "data": [ ...projects ]
}

## Task APIs

### Get Project Tasks
GET /api/tasks/project/:projectId/tasks

Fetch all tasks belonging to a project.

Includes:
- assignee details
- comments

Response:
{
  "success": true,
  "data": [ ...tasks ]
}


## Comment APIs

### Get Task Comments
GET /api/comments/task/:taskId/comments

Fetch all comments for a task.

Response:
{
  "success": true,
  "data": [ ...comments ]
}

# API Response Format

All APIs follow a consistent response structure:

Success:
{
  "success": true,
  "data": ...
}

Error:
{
  "success": false,
  "message": "Error message"
}

# Database Design
The schema is designed for a **multi-workspace project management platform**.

## Core Entities

### User

Represents a system user.
Capabilities:
* Own workspaces
* Join workspaces
* Join projects
* Be assigned tasks
* Write comments

### Workspace

Represents a tenant boundary.
Each workspace contains:
* Members
* Projects
* Settings

### WorkspaceMember

Join table connecting users and workspaces.

Stores:

* membership role
* invitation metadata

### Project

Represents a project inside a workspace.
Contains:
* tasks
* project members
* lifecycle status
* priority

### ProjectMember

Join table connecting users and projects.
Prevents duplicate membership.

### Task

Tasks belong to projects and are assigned to users.
Tracks:

* status
* type
* priority
* due date

### Comment

Comments are attached to tasks and created by users.

# Enums

Enums enforce domain rules at the database level.
WorkspaceRole
TaskStatus
TaskType
ProjectStatus
Priority

This prevents invalid values and ensures consistent data.

# Database Configuration

Prisma configuration:
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

`DATABASE_URL`
Used for runtime database access.

`DIRECT_URL`
Used for migrations.

## Workspace APIs

### Get User Workspaces
GET /api/workspace

Returns all workspaces the authenticated user belongs to.

Response:
{
  "success": true,
  "data": [
    {
      "id": "workspace_id",
      "name": "Workspace Name",
      "slug": "workspace-slug",
      "image_url": "https://..."
    }
  ]
}


### Add Workspace Member
POST /api/workspace/add-member

Adds a user to a workspace (Admin only).

Request Body:
{
  "email": "user@example.com",
  "role": "ADMIN | MEMBER",
  "workspaceId": "workspace_id",
  "message": "Optional invite message"
}

Response:
{
  "success": true,
  "message": "Member added successfully",
  "data": { ... }
}

# Development Setup

## 1. Clone Repository
git clone <repository-url>
cd backend

## 2. Install Dependencies
npm install

## 3. Environment Variables
Create a `.env` file:

PORT=5000
DATABASE_URL=
DIRECT_URL=
CLERK_SECRET_KEY=
INNGEST_EVENT_KEY=

## 4. Run Prisma Migrations
npx prisma migrate dev

## 5. Generate Prisma Client
npx prisma generate

## 6. Start Development Server
npm run dev

Server runs at:
http://localhost:5000

# Deployment Considerations
* Vercel 
* Neon Serverless PostgreSQL
* Clerk Authentication
* Inngest Cloud

# Development Setup

Follow the steps below to run the backend server, Inngest dev server, and ngrok tunnel.

# 1. Start Backend Server

Start the Node.js / Express backend server.
npm run dev

or

node server.js

Backend will run at:
http://localhost:5000


# 2. Start Inngest Dev Server

Run the Inngest development server to listen for events and execute functions.

npx inngest-cli@latest dev

Inngest Dev UI will be available at:

http://localhost:8288


# 3. Start ngrok Tunnel
Expose your local server to the internet so Clerk webhooks can reach it.

npx ngrok http 5000

Example output:
https://abcd1234.ngrok-free.app

Use this URL in your Clerk webhook configuration.

Example webhook endpoint:
https://abcd1234.ngrok-free.app/api/webhooks/clerk

# Quick Start (Run everything)

Terminal 1
npm run dev

Terminal 2
npx inngest-cli@latest dev

Terminal 3
npx ngrok http 5000



