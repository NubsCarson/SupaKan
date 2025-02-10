# Kanban Board Application

A modern Kanban board application built with React, TypeScript, and Supabase, featuring a rich task management system.

## Features

- 📋 Drag-and-drop task management
- 📝 Rich text editor for task descriptions
- 🏷️ Task labels and categorization
- 📅 Due dates and time estimation
- 📎 File attachments support
- 👥 User mentions in comments
- 🔄 Advanced workflow states
- 🎨 Modern UI with Tailwind CSS and shadcn/ui

## Tech Stack

- React + TypeScript
- Supabase (Backend & Authentication)
- TipTap (Rich Text Editor)
- Tailwind CSS
- shadcn/ui Components
- Vite (Build Tool)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/NubsCarson/kanban.git
   cd kanban
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Database Setup

1. Create a new Supabase project
2. Run the migration files in the `supabase/migrations` directory
3. Set up Row Level Security (RLS) policies as defined in the migrations

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

⚠️ Never commit the `.env` file or expose these credentials.

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
- [Supabase](https://supabase.io/) for the backend infrastructure 