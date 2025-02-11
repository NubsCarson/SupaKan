# SupaKan - Supabase-Powered Kanban Board

A modern, real-time Kanban board application built with React, TypeScript, and Supabase. Features include team collaboration, real-time updates, and a built-in chat system.

## Features

- 📋 Drag-and-drop Kanban board
- 💬 Real-time team chat
- 🔄 Real-time updates across all components
- 👥 Team collaboration
- 📌 Message pinning and reactions
- 🎨 Modern UI with dark mode support
- 🔒 Secure authentication with Supabase

## Tech Stack

- **Frontend:**
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn/ui
  - React Beautiful DND

- **Backend:**
  - Supabase (Database, Auth, Real-time)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/NubsCarson/SupaKan.git
   cd SupaKan
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Database Setup

1. Create a new Supabase project
2. Run the migration scripts in the `supabase/migrations` folder
3. Enable real-time functionality for the required tables

## Project Structure

```
src/
├── components/        # React components
│   ├── kanban/       # Kanban board components
│   ├── chat/         # Chat components
│   └── ui/           # Shared UI components
├── lib/              # Utilities and helpers
├── hooks/            # Custom React hooks
└── types/            # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Supabase](https://supabase.io/) for the amazing backend platform
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [React Beautiful DND](https://github.com/atlassian/react-beautiful-dnd) for the drag-and-drop functionality

## 🛠️ Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview

# Clean build files
npm run clean
```

## 🔧 Configuration

The application supports various configuration options through environment variables:

```env
VITE_APP_NAME=Kanban Board
VITE_APP_URL=http://localhost:5173
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [TipTap](https://tiptap.dev/) - Powerful rich text editor
- [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd) - Smooth drag and drop
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components

## 🌟 Support

If you find this project helpful, please consider giving it a star ⭐️

Visit the live demo at [https://kanban.nubs.site](https://kanban.nubs.site) 