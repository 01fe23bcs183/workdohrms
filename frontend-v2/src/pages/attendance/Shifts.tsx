import { useState, useEffect } from 'react';
import { attendanceService } from '../../services/api';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, Edit, Trash2, Clock, MoreHorizontal, Eye, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AssignShiftDialog } from '../../pages/attendance/AssisgnShiftDialog';
import { ShiftRoster } from './ShiftRoster';

interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  assignments_count?: number;
}

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);
  const [activeTab, setActiveTab] = useState('shifts');

  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    break_duration_minutes: '60',
  });

  useEffect(() => {
    if (activeTab === 'shifts') {
      fetchShifts();
    }
  }, [activeTab]);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const response = await attendanceService.getShifts();
      setShifts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      showAlert('error', 'Error', 'Failed to fetch shifts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      start_time: formData.start_time,
      end_time: formData.end_time,
      break_duration_minutes: Number(formData.break_duration_minutes),
    };

    try {
      if (editingShift) {
        await attendanceService.updateShift(editingShift.id, payload);
      } else {
        await attendanceService.createShift(payload);
      }

      showAlert(
        'success',
        'Success!',
        editingShift ? 'Shift updated successfully' : 'Shift created successfully',
        2000
      );
      setIsDialogOpen(false);
      setEditingShift(null);
      setFormData({
        name: '',
        start_time: '',
        end_time: '',
        break_duration_minutes: '60',
      });

      fetchShifts();
    } catch (error: unknown) {
      console.error('Failed to save shift:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to save shift'));
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      break_duration_minutes: shift.break_duration_minutes.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleView = (shift: Shift) => {
    setViewingShift(shift);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You want to delete this shift?'
    );

    if (!result.isConfirmed) return;

    try {
      await attendanceService.deleteShift(id);
      showAlert('success', 'Deleted!', 'Shift deleted successfully', 2000);
      fetchShifts();
    } catch (error: unknown) {
      console.error('Failed to delete shift:', error);
      showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete shift'));
    }
  };

  const handleAssignClick = (shift: Shift) => {
    setSelectedShift(shift);
    setIsAssignDialogOpen(true);
  };

  const handleAssignSuccess = () => {
    fetchShifts(); // Refresh the shift list to update assignment counts
  };

  const formatTime = (time: string) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':');
    const hour = Number(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shift Management</h1>
          <p className="text-muted-foreground">Manage work shifts and assignments</p>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="shifts" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Shifts
          </TabsTrigger>
          <TabsTrigger value="roster" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roster
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="space-y-4">
          {/* Add Shift Button */}
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-solarized-blue hover:bg-solarized-blue/90"
                  onClick={() => {
                    setEditingShift(null);
                    setFormData({
                      name: '',
                      start_time: '',
                      end_time: '',
                      break_duration_minutes: '60',
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shift
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingShift ? 'Edit Shift' : 'Add Shift'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingShift
                      ? 'Update shift details'
                      : 'Create a new shift'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label>Shift Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={formData.start_time}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              start_time: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={formData.end_time}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_time: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Break Duration (minutes)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.break_duration_minutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            break_duration_minutes: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                      {editingShift ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Shifts Table */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : shifts.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                  <p>No shifts found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Break</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {shifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.name}</TableCell>
                        <TableCell>{formatTime(shift.start_time)}</TableCell>
                        <TableCell>{formatTime(shift.end_time)}</TableCell>
                        <TableCell>
                          {shift.break_duration_minutes} mins
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {shift.assignments_count || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleView(shift)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAssignClick(shift)}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Assign to Staff
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(shift)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(shift.id)}
                                className="text-red-600"
                              >
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roster">
          <ShiftRoster />
        </TabsContent>
      </Tabs>

      {/* Assign Shift Dialog */}
      {selectedShift && (
        <AssignShiftDialog
          shift={selectedShift}
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
            <DialogDescription>View shift information</DialogDescription>
          </DialogHeader>
          {viewingShift && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Shift Name</Label>
                <p className="font-medium">{viewingShift.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Start Time</Label>
                  <p className="font-medium">{formatTime(viewingShift.start_time)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">End Time</Label>
                  <p className="font-medium">{formatTime(viewingShift.end_time)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Break Duration</Label>
                <p className="font-medium">{viewingShift.break_duration_minutes} minutes</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Assignments</Label>
                <p className="font-medium">{viewingShift.assignments_count || 0} staff members</p>
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
  );
}