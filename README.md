# Kanban Board

A modern Kanban board application built with React, TypeScript, and IndexedDB, featuring a rich task management system.

## Features

- 📋 Drag-and-drop task management across columns
- 📝 Rich text editor for task descriptions
- 🏷️ Task labels and priority levels
- 📅 Due dates and time estimation
- 🎯 Task status tracking (Backlog, Todo, In Progress, In Review, Done)
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 💾 Persistent storage using IndexedDB
- 🎫 Automatic ticket ID generation

## Tech Stack

- React + TypeScript
- IndexedDB (Local Storage)
- TipTap (Rich Text Editor)
- Tailwind CSS
- shadcn/ui Components
- react-beautiful-dnd (Drag and Drop)
- Vite (Build Tool)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/YourUsername/kanban.git
   cd kanban
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Task Management
- Create new tasks using the "New Task" button
- Edit tasks by clicking the pencil icon on any task card
- Drag and drop tasks between columns to update their status
- Set priority levels (Low, Medium, High)
- Add labels for better organization
- Set due dates and time estimates

### Data Persistence
- All data is stored locally in your browser using IndexedDB
- Data persists between page refreshes and browser restarts
- No backend setup required

## Development

- Build the project:
  ```bash
  npm run build
  ```

- Preview the production build:
  ```bash
  npm run preview
  ```

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [TipTap](https://tiptap.dev/) for the rich text editor
- [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd) for drag and drop functionality 