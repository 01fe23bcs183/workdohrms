import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ListTodo, Plus, Calendar, User } from 'lucide-react';
import { meetingService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';
import { Badge } from '../ui/badge';

interface StaffMember {
    id: number;
    full_name: string;
}

interface ActionItem {
    id: number;
    title: string;
    assigned_to?: { id: number; full_name: string };
    due_date?: string;
    status: 'pending' | 'in_progress' | 'completed';
}

interface MeetingActionItemsProps {
    meetingId: number;
    actionItems: ActionItem[];
    staffMembers: StaffMember[];
    onItemChanged: () => void;
}

export default function MeetingActionItems({
    meetingId,
    actionItems,
    staffMembers,
    onItemChanged
}: MeetingActionItemsProps) {
    const [task, setTask] = useState('');
    const [assignedTo, setAssignedTo] = useState<string>('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!task.trim()) return;
        setIsSubmitting(true);
        try {
            await meetingService.addActionItem(meetingId, {
                title: task,
                assigned_to: assignedTo ? parseInt(assignedTo) : null,
                due_date: dueDate || null,
            });
            setTask('');
            setAssignedTo('');
            setDueDate('');
            onItemChanged();
            showAlert('success', 'Added', 'Action item assigned successfully');
        } catch (error) {
            console.error(error);
            showAlert('error', 'Error', 'Failed to add action item');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async (itemId: number) => {
        try {
            await meetingService.completeMeeting(itemId);
            onItemChanged();
        } catch (error) {
            console.error(error);
            showAlert('error', 'Error', 'Failed to update action item');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5" />
                        Action Items
                    </CardTitle>
                    <CardDescription>Tasks and follow-ups from this meeting</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                        {actionItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No action items assigned.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {actionItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${item.status === 'completed' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <Checkbox
                                            checked={item.status === 'completed'}
                                            onCheckedChange={() => handleComplete(item.id)}
                                            disabled={item.status === 'completed'}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                                {item.title}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                                                {item.assigned_to && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {item.assigned_to.full_name}
                                                    </div>
                                                )}
                                                {item.due_date && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(item.due_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={item.status === 'completed' ? 'secondary' : 'default'} className={item.status === 'completed' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}>
                                            {item.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Add New Item</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label>Task Description *</Label>
                            <Input
                                value={task}
                                onChange={(e) => setTask(e.target.value)}
                                placeholder="What needs to be done?"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Assign To</Label>
                                <Select value={assignedTo} onValueChange={setAssignedTo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staffMembers.map((staff) => (
                                            <SelectItem key={staff.id} value={staff.id.toString()}>
                                                {staff.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleSubmit}
                                disabled={!task.trim() || isSubmitting}
                                className="bg-solarized-blue"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Action Item
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
