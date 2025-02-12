import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Loader2, Users, Crown, Settings, Mail, Copy, Check, UserPlus, Shield, LogOut, Calendar, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Database } from '@/lib/database.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

type TeamMember = Database['public']['Views']['team_members_with_users']['Row'];
interface TeamMemberResponse {
  team_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  teams: {
    id: string;
    name: string;
    created_at: string;
    created_by: string;
  };
}

interface Team {
  id: string;
  name: string;
  created_at: string;
  members: TeamMember[];
  is_owner: boolean;
  created_by: string;
}

interface JoinTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinSuccess: () => Promise<void>;
}

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSuccess: () => Promise<void>;
}

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onInviteSuccess: () => Promise<void>;
}

function JoinTeamDialog({ open, onOpenChange, onJoinSuccess }: JoinTeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Extract team ID from invite code and validate format
      const teamId = inviteCode.trim();
      if (!teamId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid team ID format');
      }

      // Verify team exists
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .maybeSingle();

      if (teamError) {
        console.error('Team lookup error:', teamError);
        throw new Error('Failed to verify team');
      }

      if (!team) {
        throw new Error('Team not found. Please check the invite code and try again.');
      }

      // Check if already a member
      const { data: existingMember, error: memberError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Member check error:', memberError);
        throw new Error('Failed to verify membership');
      }

      if (existingMember) {
        throw new Error('You are already a member of this team');
      }

      // Join team as member
      const { error: joinError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) {
        console.error('Join error:', joinError);
        throw new Error('Failed to join team');
      }

      toast({
        title: 'Success',
        description: `You have successfully joined ${team.name}`,
      });

      await onJoinSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error joining team:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join team',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Team</DialogTitle>
          <DialogDescription>
            Enter the team invite code to join an existing team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="inviteCode">Team Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter team ID (UUID format)"
                required
              />
              <p className="text-sm text-muted-foreground">
                The team invite code should be in UUID format (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).
                You can get this from a team owner.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Join Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateTeamDialog({ open, onOpenChange, onCreateSuccess }: CreateTeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const teamName = formData.get('teamName') as string;

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      toast({
        title: 'Success',
        description: 'Team created successfully',
      });

      await onCreateSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create team',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team and invite your colleagues.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                name="teamName"
                placeholder="Enter team name"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InviteMemberDialog({ open, onOpenChange, team, onInviteSuccess }: InviteMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(team.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Team invite code copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy invite code',
        variant: 'destructive',
      });
    }
  };

  const handleInviteByEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;

      // In a real app, you would send an email invitation here
      // For now, we'll just show a success message
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email}`,
      });

      await onInviteSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
          <DialogDescription>
            Share the team invite code or send email invitations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="space-y-4">
            <Label>Team Invite Code</Label>
            <div className="flex items-center gap-2">
              <Input value={team.id} readOnly />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyInviteCode}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or invite by email
              </span>
            </div>
          </div>
          <form onSubmit={handleInviteByEmail}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLeaveTeamDialogOpen, setIsLeaveTeamDialogOpen] = useState(false);
  const [isDeleteTeamDialogOpen, setIsDeleteTeamDialogOpen] = useState(false);
  const { user } = useAuth();

  const loadTeams = async () => {
    try {
      if (!user?.id) return;

      console.log('Loading teams for user:', user.id);

      // First get the teams the user is a member of
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
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error loading member teams:', memberError);
        throw memberError;
      }

      console.log('Member teams:', memberTeams);

      if (!memberTeams) return;

      // For each team, get its members using the view
      const teamsWithMembers = await Promise.all(
        memberTeams.map(async (teamData: any) => {
          const { data: members, error: membersError } = await supabase
            .from('team_members_with_users')
            .select('*')
            .eq('team_id', teamData.team_id)
            .order('role', { ascending: false }); // Order by role to put owners first

          if (membersError) {
            console.error('Error loading team members:', membersError);
            throw membersError;
          }

          console.log('Team members for team', teamData.team_id, ':', members);

          const team: Team = {
            id: teamData.teams.id,
            name: teamData.teams.name,
            created_at: teamData.teams.created_at,
            created_by: teamData.teams.created_by,
            members: members || [],
            is_owner: teamData.role === 'owner'
          };

          return team;
        })
      );

      console.log('Teams with members:', teamsWithMembers);
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
  };

  useEffect(() => {
    loadTeams();
  }, [user?.id]);

  const handleLeaveTeam = async () => {
    if (!selectedTeam || !user) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', selectedTeam.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You have left the team',
      });

      await loadTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave team',
        variant: 'destructive',
      });
    } finally {
      setIsLeaveTeamDialogOpen(false);
      setSelectedTeam(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam || !user) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', selectedTeam.id)
        .eq('created_by', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });

      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete team',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteTeamDialogOpen(false);
      setSelectedTeam(null);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, teamId: string, newRole: TeamMember['role']) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });

      await loadTeams();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string, teamId: string) => {
    try {
      console.log('Attempting to remove member:', memberId, 'from team:', teamId);
      
      // Get the current user's role in the team
      const { data: userRole, error: roleError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user?.id)
        .single();

      if (roleError) {
        console.error('Error checking user role:', roleError);
        throw roleError;
      }

      console.log('Current user role:', userRole);

      // Get the member being removed
      const { data: memberToRemove, error: memberError } = await supabase
        .from('team_members_with_users')
        .select('role, user_id, id')
        .eq('id', memberId)
        .eq('team_id', teamId)
        .single();

      if (memberError) {
        console.error('Error getting member details:', memberError);
        throw memberError;
      }

      if (!memberToRemove) {
        throw new Error('Member not found');
      }

      console.log('Member to remove:', memberToRemove);

      // Verify permissions
      if (userRole.role !== 'owner' && memberToRemove.role === 'owner') {
        throw new Error('Only team owners can remove other owners');
      }

      // Get team details to verify ownership
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('created_by')
        .eq('id', teamId)
        .single();

      if (teamError) {
        console.error('Error checking team:', teamError);
        throw teamError;
      }

      console.log('Team details:', team);

      // Delete the member - simplified to match policy exactly
      const { error: deleteError } = await supabase
        .rpc('remove_team_member', {
          p_member_id: memberId,
          p_team_id: teamId
        });

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Force a refresh of the teams data
      console.log('Reloading teams data...');
      await loadTeams();
      console.log('Teams data reloaded');

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg font-medium">Loading teams...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Hero Section */}
      <div className="relative mb-8 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-black/10" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
                <Users className="h-8 w-8 text-primary" />
                Teams
              </h1>
              <p className="text-muted-foreground max-w-[600px]">
                Collaborate with your team members and manage projects together
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsJoinDialogOpen(true)} variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Join Team
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Badge variant="outline" className="bg-primary/10 inline-flex items-center">
              <span className="truncate">{teams.length} Total Teams</span>
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 inline-flex items-center">
              <span className="truncate">{teams.filter(t => t.is_owner).length} Owned Teams</span>
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 inline-flex items-center">
              <span className="truncate">{teams.reduce((acc, team) => acc + team.members.length, 0)} Total Members</span>
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 inline-flex items-center">
              <span className="truncate">{teams.filter(t => !t.is_owner).length} Member Teams</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="flex flex-col transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {team.name}
                </CardTitle>
                {team.is_owner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-muted">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTeam(team);
                          setIsInviteDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Invite Members
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive gap-2"
                        onClick={() => {
                          setSelectedTeam(team);
                          setIsDeleteTeamDialogOpen(true);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Delete Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Created {new Date(team.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Members</div>
                  <Badge variant="secondary" className="text-xs">
                    {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10">
                            {member.user_email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {member.user_email}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {member.role === 'owner' && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                            {member.role === 'admin' && (
                              <Shield className="h-3 w-3 text-blue-500" />
                            )}
                            {member.role}
                          </div>
                        </div>
                      </div>
                      {team.is_owner && member.user_id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="gap-2">
                                <Shield className="h-4 w-4" />
                                Change Role
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateMemberRole(member.id, team.id, 'admin')}
                                    className="gap-2"
                                  >
                                    <Shield className="h-4 w-4" />
                                    Make Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateMemberRole(member.id, team.id, 'member')}
                                    className="gap-2"
                                  >
                                    <User className="h-4 w-4" />
                                    Make Member
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive gap-2"
                              onClick={() => handleRemoveMember(member.id, team.id)}
                            >
                              <LogOut className="h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            {!team.is_owner && (
              <CardFooter className="pt-4">
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    setSelectedTeam(team);
                    setIsLeaveTeamDialogOpen(true);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Team
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}

        {teams.length === 0 && (
          <Card className="col-span-full p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No teams found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first team or join an existing one to get started!
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => setIsJoinDialogOpen(true)} variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Team
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <JoinTeamDialog
        open={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        onJoinSuccess={loadTeams}
      />

      <CreateTeamDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateSuccess={loadTeams}
      />

      {selectedTeam && (
        <InviteMemberDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          team={selectedTeam}
          onInviteSuccess={loadTeams}
        />
      )}

      <AlertDialog open={isLeaveTeamDialogOpen} onOpenChange={setIsLeaveTeamDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave this team?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to all boards and tasks associated with this team.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteTeamDialogOpen} onOpenChange={setIsDeleteTeamDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the team and all associated boards and tasks.
              All team members will lose access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 