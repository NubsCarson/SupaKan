import { supabase } from './supabase';
import type { Tables, TableRow } from './supabase';

export type Team = TableRow<'teams'>;
export type TeamMember = TableRow<'team_members'>;

// Add rate limiting helper at the top
const rateLimiter = {
  lastCall: 0,
  minInterval: 1000, // Minimum 1 second between calls
};

export async function createTeam(name: string, userId: string) {
  try {
    // First, create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        created_by: userId,
      })
      .select('*')
      .single();

    if (teamError) throw teamError;

    // Then, add creator as team owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) throw memberError;

    return team;
  } catch (error) {
    console.error('Error in createTeam:', error);
    throw error;
  }
}

export async function getUserTeams(userId: string) {
  try {
    // Rate limiting
    const now = Date.now();
    if (now - rateLimiter.lastCall < rateLimiter.minInterval) {
      return []; // Return empty if called too frequently
    }
    rateLimiter.lastCall = now;

    // Get teams created by user
    const { data: createdTeams, error: createdError } = await supabase
      .from('teams')
      .select('id, name, created_by, team_members!inner(user_id, role)')
      .eq('created_by', userId)
      .limit(50);

    if (createdError) {
      console.warn('Created teams fetch error:', createdError.message);
      return [];
    }

    // Get teams where user is a member (not removed)
    const { data: memberTeams, error: memberError } = await supabase
      .from('teams')
      .select('id, name, created_by, team_members!inner(user_id, role)')
      .eq('team_members.user_id', userId)
      .neq('team_members.role', 'removed')
      .limit(50);

    if (memberError) {
      console.warn('Member teams fetch error:', memberError.message);
      return [];
    }

    // Combine and deduplicate teams
    const allTeams = [...(createdTeams || []), ...(memberTeams || [])];
    const seen = new Set();
    return allTeams.filter(team => {
      if (seen.has(team.id)) return false;
      seen.add(team.id);
      return true;
    });
  } catch (error) {
    console.error('Error in getUserTeams:', error);
    return []; // Return empty array instead of throwing
  }
}

export async function getTeam(teamId: string) {
  const { data: team, error } = await supabase
    .from('teams')
    .select('*, team_members(*)')
    .eq('id', teamId)
    .single();

  if (error) throw error;
  return team;
}

export async function updateTeam(teamId: string, updates: Partial<Team>) {
  const { data: team, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single();

  if (error) throw error;
  return team;
}

export async function deleteTeam(teamId: string) {
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (error) throw error;
}

export async function addTeamMember(teamId: string, userId: string, role: TeamMember['role'] = 'member') {
  const { data: member, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return member;
}

export async function updateTeamMemberRole(teamId: string, userId: string, role: TeamMember['role']) {
  const { data: member, error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return member;
}

export async function removeTeamMember(teamId: string, userId: string) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getTeamMembers(teamId: string) {
  const { data: members, error } = await supabase
    .from('team_members')
    .select(`
      *,
      users (
        id,
        email
      )
    `)
    .eq('team_id', teamId);

  if (error) throw error;
  return members;
}

// Real-time subscriptions
export function subscribeToTeamChanges(teamId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`team:${teamId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'teams',
      filter: `id=eq.${teamId}`,
    }, callback)
    .subscribe();
}

export function subscribeToTeamMemberChanges(teamId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`team_members:${teamId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'team_members',
      filter: `team_id=eq.${teamId}`,
    }, callback)
    .subscribe();
} 