import { useState, useEffect } from 'react';
import { performanceService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Target, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Goal {
  id: number;
  title: string;
  description: string;
  staff_member?: { full_name: string };
  target_date: string;
  progress: number;
  status: string;
  priority: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    priority: 'medium',
    status: 'not_started',
  });

  useEffect(() => {
    fetchGoals();
  }, [page]);

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const response = await performanceService.getGoals({ page });
      setGoals(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await performanceService.updateGoal(editingGoal.id, formData);
      } else {
        await performanceService.createGoal(formData);
      }
      setIsDialogOpen(false);
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      target_date: goal.target_date || '',
      priority: goal.priority || 'medium',
      status: goal.status || 'not_started',
    });
    setIsDialogOpen(true);
  };

  const handleView = (goal: Goal) => {
    setViewingGoal(goal);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await performanceService.deleteGoal(id);
      fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target_date: '',
      priority: 'medium',
      status: 'not_started',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      not_started: 'bg-solarized-base01/10 text-solarized-base01',
      in_progress: 'bg-solarized-blue/10 text-solarized-blue',
      completed: 'bg-solarized-green/10 text-solarized-green',
      overdue: 'bg-solarized-red/10 text-solarized-red',
    };
    return variants[status] || variants.not_started;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: 'bg-solarized-cyan/10 text-solarized-cyan',
      medium: 'bg-solarized-yellow/10 text-solarized-yellow',
      high: 'bg-solarized-orange/10 text-solarized-orange',
      critical: 'bg-solarized-red/10 text-solarized-red',
    };
    return variants[priority] || variants.medium;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Goals</h1>
          <p className="text-solarized-base01">Set and track employee goals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => {
                setEditingGoal(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
              <DialogDescription>
                {editingGoal ? 'Update the goal details.' : 'Create a new goal.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Complete project milestone"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Goal description..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                  {editingGoal ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Goal Details</DialogTitle>
            </DialogHeader>
            {viewingGoal && (
              <div className="space-y-4">
                <div>
                  <Label className="text-solarized-base01">Title</Label>
                  <p className="font-medium">{viewingGoal.title}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Description</Label>
                  <p className="font-medium">{viewingGoal.description || '-'}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Assigned To</Label>
                  <p className="font-medium">{viewingGoal.staff_member?.full_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Target Date</Label>
                  <p className="font-medium">{viewingGoal.target_date}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Progress</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={viewingGoal.progress} className="h-2 flex-1" />
                    <span className="font-medium">{viewingGoal.progress}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusBadge(viewingGoal.status)}>
                    {viewingGoal.status?.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityBadge(viewingGoal.priority)}>
                    {viewingGoal.priority}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Goals</p>
                <p className="text-xl font-bold text-solarized-base02">{meta?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">In Progress</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {goals.filter((g) => g.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Completed</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {goals.filter((g) => g.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-red/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-solarized-red" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Overdue</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {goals.filter((g) => g.status === 'overdue').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="pt-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-solarized-base02">No goals created</h3>
            <p className="text-solarized-base01 mt-1">Create goals to track employee performance.</p>
            <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <Card key={goal.id} className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <CardDescription>{goal.staff_member?.full_name}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(goal)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(goal)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(goal.id)} className="text-solarized-red">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-solarized-base01 line-clamp-2">{goal.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-solarized-base01">Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusBadge(goal.status)}>
                      {goal.status?.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityBadge(goal.priority)}>
                      {goal.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-solarized-base01">
                    Target: {goal.target_date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-solarized-base01">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === meta.last_page}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
