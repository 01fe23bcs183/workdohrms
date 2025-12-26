import { useState, useEffect } from 'react';
import { recruitmentService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
import { Plus, Briefcase, MapPin, Users, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Job {
  id: number;
  title: string;
  department?: { name: string };
  location?: { name: string };
  employment_type: string;
  status: string;
  applications_count: number;
  posted_date: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    employment_type: 'full_time',
    status: 'draft',
  });

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await recruitmentService.getJobs({ page });
      setJobs(response.data.data || []);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await recruitmentService.updateJob(editingJob.id, formData);
      } else {
        await recruitmentService.createJob(formData);
      }
      setIsDialogOpen(false);
      setEditingJob(null);
      resetForm();
      fetchJobs();
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: '',
      employment_type: job.employment_type || 'full_time',
      status: job.status || 'draft',
    });
    setIsDialogOpen(true);
  };

  const handleView = (job: Job) => {
    setViewingJob(job);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await recruitmentService.deleteJob(id);
      fetchJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      employment_type: 'full_time',
      status: 'draft',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-solarized-green/10 text-solarized-green',
      closed: 'bg-solarized-red/10 text-solarized-red',
      draft: 'bg-solarized-base01/10 text-solarized-base01',
      on_hold: 'bg-solarized-yellow/10 text-solarized-yellow',
    };
    return variants[status] || variants.draft;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02">Job Postings</h1>
          <p className="text-solarized-base01">Manage job openings and recruitment</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-solarized-blue hover:bg-solarized-blue/90"
              onClick={() => {
                setEditingJob(null);
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingJob ? 'Edit Job Posting' : 'Post New Job'}</DialogTitle>
              <DialogDescription>
                {editingJob ? 'Update the job posting details.' : 'Create a new job posting.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Software Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Job description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employment_type">Employment Type</Label>
                    <Select
                      value={formData.employment_type}
                      onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
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
                  {editingJob ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
            </DialogHeader>
            {viewingJob && (
              <div className="space-y-4">
                <div>
                  <Label className="text-solarized-base01">Title</Label>
                  <p className="font-medium">{viewingJob.title}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Department</Label>
                  <p className="font-medium">{viewingJob.department?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Location</Label>
                  <p className="font-medium">{viewingJob.location?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Employment Type</Label>
                  <p className="font-medium capitalize">{viewingJob.employment_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-solarized-base01">Status</Label>
                  <Badge className={getStatusBadge(viewingJob.status)}>
                    {viewingJob.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-solarized-base01">Applications</Label>
                  <p className="font-medium">{viewingJob.applications_count || 0}</p>
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
              <div className="w-10 h-10 rounded-full bg-solarized-green/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-solarized-green" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Open Jobs</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {jobs.filter((j) => j.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-solarized-blue" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Total Applications</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-yellow/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-solarized-yellow" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">On Hold</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {jobs.filter((j) => j.status === 'on_hold').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-solarized-red/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-solarized-red" />
              </div>
              <div>
                <p className="text-sm text-solarized-base01">Closed</p>
                <p className="text-xl font-bold text-solarized-base02">
                  {jobs.filter((j) => j.status === 'closed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-solarized-base02">No job postings</h3>
              <p className="text-solarized-base01 mt-1">Create your first job posting to start recruiting.</p>
              <Button className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.department?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-solarized-base01" />
                            {job.location?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{job.employment_type?.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-solarized-blue" />
                            {job.applications_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(job.status)}>
                            {job.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(job)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(job)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(job.id)} className="text-solarized-red">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-solarized-base01">
                    Page {meta.current_page} of {meta.last_page}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.last_page}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
