# Deployment Guide

This guide explains how to deploy the Kanban board application with Supabase backend.

## Prerequisites

1. Node.js 18+ and npm
2. Supabase CLI
3. PostgreSQL 14+
4. Git

## Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd kanban
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase locally:
```bash
npm install -g supabase
supabase init
supabase start
```

4. Create environment variables:
```bash
cp .env.example .env
```

5. Update `.env` with your Supabase credentials from the Supabase dashboard.

6. Generate TypeScript types:
```bash
npm run supabase:generate-types
```

7. Run migrations:
```bash
supabase db reset
```

8. Start the development server:
```bash
npm run dev
```

## Production Deployment

### 1. Supabase Setup

1. Create a new Supabase project at https://app.supabase.com
2. Note down your project URL and anon key
3. Apply migrations to your production database:
```bash
supabase link --project-ref <project-ref>
supabase db push
```

### 2. Environment Configuration

Update your production environment variables:

```bash
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### 3. Build the Application

```bash
npm run build
```

### 4. Deploy to Your Hosting Platform

#### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

#### Netlify

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Deploy:
```bash
netlify deploy
```

## Database Backup Strategy

### 1. Automated Backups

Supabase Enterprise and Pro plans include automated daily backups. For custom backup solutions:

1. Create a backup script:
```bash
#!/bin/bash
timestamp=$(date +%Y%m%d_%H%M%S)
backup_file="backup_$timestamp.sql"

pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -b \
  -v \
  -f "$backup_file"
```

2. Schedule with cron:
```bash
0 0 * * * /path/to/backup-script.sh
```

### 2. Point-in-Time Recovery

Supabase Enterprise includes point-in-time recovery. For other plans:

1. Enable WAL archiving in PostgreSQL
2. Configure continuous archiving
3. Document recovery procedures

## Monitoring & Maintenance

1. Set up Supabase monitoring:
   - Database health
   - API performance
   - Auth service status

2. Configure alerts for:
   - High database load
   - Storage usage
   - Error rates
   - Auth failures

3. Regular maintenance tasks:
   - Review and clean up unused resources
   - Update dependencies
   - Rotate API keys
   - Review access logs

## Security Considerations

1. Enable RLS policies for all tables
2. Use service role key only in trusted environments
3. Implement rate limiting
4. Enable audit logs
5. Regular security scans
6. Keep dependencies updated

## Troubleshooting

Common issues and solutions:

1. Database connection issues:
   - Check network access
   - Verify credentials
   - Check RLS policies

2. Auth problems:
   - Verify JWT configuration
   - Check email provider settings
   - Review auth logs

3. Performance issues:
   - Review query performance
   - Check database indexes
   - Monitor resource usage

## Support & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Issues](https://github.com/your-repo/issues)
- [Community Discord](https://discord.supabase.com)

## Rollback Procedures

In case of deployment issues:

1. Database rollback:
```bash
supabase db reset --db-url=your_db_url
```

2. Application rollback:
```bash
git checkout previous_version
npm run build
# Deploy previous build
```

## Performance Optimization

1. Enable database pooling
2. Configure proper indexes
3. Implement caching strategy
4. Use edge functions for compute-intensive operations
5. Optimize real-time subscriptions

## Scaling Considerations

1. Database scaling:
   - Connection pooling
   - Read replicas
   - Horizontal scaling

2. Application scaling:
   - CDN configuration
   - Edge function distribution
   - Cache optimization 