# Team Task Manager

Team Task Manager is a full-stack web application designed to help teams organize projects, assign tasks, and track progress through a centralised workspace.

The platform supports role-based access for administrators and members, enabling project management, task ownership, deadline tracking, and workspace analytics.

**Live Application:** https://task-manager-khaki-xi.vercel.app/onboarding

## Admin Credentials

Email: utkarshrajsaxena12@gmail.com 
Password: 12345678  

Note: These credentials are for demonstration purposes only. 



---

## Overview

This project was developed as part of a full-stack assignment to demonstrate practical implementation of:

- Authentication and authorization
- Role-based access control
- Project and task management workflows
- Dashboard design and state management
- Database integration with Supabase

---

## Core Features

### Authentication
- User registration and login
- Password reset workflow
- Protected routes
- Session management using Supabase Authentication

### Role-Based Access
**Admin**
- Create and manage projects
- Assign tasks to members
- View project analytics and reports
- Manage workspace members

**Member**
- Access assigned projects and tasks
- Update task progress
- Track deadlines and workspace activity

### Project Management
- Create, edit, and delete projects
- Manage project details
- Search and browse active projects
- Workspace organization dashboard

### Task Management
- Create and assign tasks
- Task status updates
- Due date tracking
- Priority management

### Dashboard
- Workspace summary
- Active project overview
- Task completion statistics
- Team activity visibility

### Calendar
- Task scheduling interface
- Deadline visibility
- Weekly planning support

---

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router DOM

### Backend
- Supabase
  - Authentication
  - PostgreSQL Database
  - API services

### Utilities
- date-fns
- clsx
- tailwind-merge

---

## Project Structure

```bash
src/
├── assets/
├── components/
├── context/
├── hooks/
├── lib/
├── pages/
├── App.jsx
└── main.jsx
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd TeamTaskManager
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

---

## Build

Production build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

## Future Improvements

- Real-time notifications
- Team chat functionality
- Drag-and-drop Kanban board
- File attachments
- Activity history logs

---

## Author

Utkarsh Raj Saxena 
22131011400
Galgotias University

---
