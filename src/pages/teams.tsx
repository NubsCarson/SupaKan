import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Users, Crown, Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TeamMember {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  created_at: string;
  members: TeamMember[];
  is_owner: boolean;
}

interface TeamResponse {
  team_id: string;
  role: string;
  teams: {
    id: string;
    name: string;
    created_at: string;
    created_by: string;
  };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          teams!inner (
            id,
            name,
            created_at,
            created_by
          )
        `)
        .eq('user_id', user?.id);

      if (memberError) throw memberError;

      if (!memberTeams) return;

      // For each team, get its members
      const teamsWithMembers = await Promise.all(
        (memberTeams as TeamResponse[]).map(async (teamData) => {
          const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select(`
              id,
              role,
              user:users!inner (
                id,
                email
              )
            `)
            .eq('team_id', teamData.team_id);

          if (membersError) throw membersError;

          const team: Team = {
            id: teamData.teams.id,
            name: teamData.teams.name,
            created_at: teamData.teams.created_at,
            members: members || [],
            is_owner: teamData.role === 'owner'
          };

          return team;
        })
      );

      setTeams(teamsWithMembers);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam() {
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          name: 'New Team',
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user?.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      await loadTeams();

      toast({
        title: 'Success',
        description: 'Team created successfully',
      });
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teams</h1>
        <Button onClick={handleCreateTeam}>
          <Plus className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {team.name}
                </CardTitle>
                {team.is_owner && (
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardDescription>
                Created {new Date(team.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm font-medium">Members</div>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback>
                            {member.user.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {member.user.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.role}
                          </div>
                        </div>
                      </div>
                      {member.role === 'owner' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {teams.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground">
            No teams found. Create your first team to get started!
          </div>
        )}
      </div>
    </div>
  );
} 