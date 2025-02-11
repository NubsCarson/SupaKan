# SupaKan - Instant Task Management Powered by Supabase

![SupaKan Preview](public/og-preview.png)

A modern task management platform built **100% on Supabase** - no additional backend required! Experience true real-time collaboration with instant updates for both solo work and team projects. Every feature, from task movements to team chat, updates instantly across all connected users.

## 🌟 Why SupaKan?

- **Zero Backend Setup** - Built entirely on Supabase
- **Instant Real-time Updates** - Everything syncs automatically
- **Works Solo or Team** - Scale from personal use to full team collaboration
- **No Extra Services** - Chat, tasks, and collaboration all in one place

## ✨ Key Features

- 🔄 **True Real-time Experience**:
  - Tasks update instantly across all users
  - Live team chat with instant message delivery
  - Real-time notifications for mentions and updates
  - See who's online and typing indicators
  
- 📋 **Smart Task Management**:
  - Drag-and-drop Kanban board
  - Automatic position syncing
  - Rich text task descriptions
  - Custom labels and priorities
  - Due dates and time tracking
  
- 💬 **Built-in Team Chat**:
  - Instant message delivery
  - Pin important messages
  - React with emojis
  - Thread discussions
  - Mention team members
  
- 👥 **Flexible Usage Modes**:
  - Personal task management
  - Small team collaboration
  - Large team organization
  - Custom team permissions

## 🚀 Built on Supabase

Everything runs on Supabase's powerful features:

- **Real-time PostgreSQL** - Instant data sync
- **Row Level Security** - Enterprise-grade security
- **Auth** - Multiple sign-in options
- **Edge Functions** - Serverless operations
- **Storage** - File attachments

## 🛠️ Tech Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Shadcn/ui
  - TipTap Editor
  - React Beautiful DND

- **Backend (All Supabase):**
  - PostgreSQL Database
  - Real-time Subscriptions
  - Row Level Security
  - Authentication
  - Storage

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Setup in 4 Steps

1. Clone and install:
   ```bash
   git clone https://github.com/NubsCarson/SupaKan.git
   cd SupaKan
   npm install
   ```

2. Create a Supabase project and run migrations:
   ```bash
   npm run supabase:start
   npm run supabase:db-reset
   ```

3. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. Start developing:
   ```bash
   npm run dev
   ```

Visit `http://localhost:5173` to see your app!

## 📁 Project Structure

```
src/
├── components/        # React components
│   ├── kanban/       # Board & task components
│   ├── chat/         # Real-time chat components
│   └── ui/           # Shared UI components
├── lib/              # Supabase & utility functions
├── hooks/            # React hooks
└── types/            # TypeScript definitions
```

## 🔧 Development Commands

```bash
npm run dev          # Start development
npm run build        # Production build
npm run preview      # Preview build
npm run lint         # Lint code
npm run typecheck    # Type checking
npm run clean        # Clean build files

# Supabase Commands
npm run supabase:start    # Start local Supabase
npm run supabase:stop     # Stop local Supabase
npm run supabase:db-reset # Reset database
```

## 🚀 Deployment

### Deploy to Vercel

1. Fork this repository
2. Create a new Vercel project
3. Connect your fork
4. Set environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=your_vercel_url
   ```
5. Deploy!

## 🌟 Support

If you find SupaKan helpful, please give it a star ⭐️

Try the live demo at [https://supakan.nubs.site](https://supakan.nubs.site)

## 📝 License

MIT License - See [LICENSE](LICENSE)

## 🙏 Acknowledgments

- [Supabase](https://supabase.io/) - The backbone of our entire application
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [TipTap](https://tiptap.dev/) - Rich text editing
- [React Beautiful DND](https://github.com/atlassian/react-beautiful-dnd) - Smooth drag and drop
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build tool 

---
<div align="center">
  Built with 💚 by <a href="https://github.com/NubsCarson">NubsCarson</a>
</div> 