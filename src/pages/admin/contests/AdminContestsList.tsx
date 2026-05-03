import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdminContests, useDeleteContest } from "@/hooks/admin/useAdminContests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Plus, Settings, Users, Trophy, Trash2 } from "lucide-react";
import { deriveStatus } from "@/hooks/useContests";

const AdminContestsList = () => {
  const { data: contests, isLoading } = useAdminContests();
  const del = useDeleteContest();

  return (
    <>
      <Helmet><title>Contests | Admin</title></Helmet>
      <div className="space-y-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contests</h1>
            <p className="text-sm text-muted-foreground">Create and manage coding contests.</p>
          </div>
          <Button asChild>
            <Link to="/admin/contests/new"><Plus className="mr-2 h-4 w-4" /> New Contest</Link>
          </Button>
        </header>

        <Card>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (contests ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No contests yet. Create your first one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(contests ?? []).map((c: any) => {
                  const phase = deriveStatus(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.slug}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{c.status}</Badge>
                        {phase !== c.status && (
                          <Badge variant="outline" className="ml-1 capitalize">{phase}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{c.visibility}</TableCell>
                      <TableCell className="text-xs">{new Date(c.starts_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{new Date(c.ends_at).toLocaleString()}</TableCell>
                      <TableCell>{c.registrations_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" title="Edit">
                            <Link to={`/admin/contests/${c.id}/edit`}><Settings className="h-4 w-4" /></Link>
                          </Button>
                          <Button asChild size="icon" variant="ghost" title="Registrations">
                            <Link to={`/admin/contests/${c.id}/registrations`}><Users className="h-4 w-4" /></Link>
                          </Button>
                          <Button asChild size="icon" variant="ghost" title="Leaderboard">
                            <Link to={`/admin/contests/${c.id}/leaderboard`}><Trophy className="h-4 w-4" /></Link>
                          </Button>
                          <Button size="icon" variant="ghost" title="Delete"
                            onClick={() => {
                              if (confirm(`Delete contest "${c.title}"?`)) del.mutate({ id: c.id, slug: c.slug });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
};

export default AdminContestsList;
