import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Plus,
    Edit,
    Trash2,
    BookOpen,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { showAlert, showConfirmDialog, getErrorMessage } from '../../lib/sweetalert';

// Import API (we'll add trainingTypeService to api.ts)
import api from '../../services/api';

interface TrainingType {
    id: number;
    title: string;
    description: string | null;
    default_duration: string | null;
    created_at: string;
}

export default function TrainingTypeList() {
    const [types, setTypes] = useState<TrainingType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<TrainingType | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        default_duration: '',
    });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/training-types');
            const data = response.data.data || response.data;
            setTypes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch training types:', error);
            setTypes([]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            default_duration: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                title: formData.title,
                description: formData.description || null,
                default_duration: formData.default_duration || null,
            };

            if (editingType) {
                await api.put(`/training-types/${editingType.id}`, data);
            } else {
                await api.post('/training-types', data);
            }

            setIsDialogOpen(false);
            setEditingType(null);
            resetForm();
            fetchTypes();
        } catch (error) {
            console.error('Failed to save training type:', error);
        }
    };

    const handleEdit = (type: TrainingType) => {
        setEditingType(type);
        setFormData({
            title: type.title,
            description: type.description || '',
            default_duration: type.default_duration || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirmDialog(
            'Are you sure?',
            'You want to delete this training type?'
        );

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/training-types/${id}`);
            showAlert('success', 'Deleted!', 'Training type deleted successfully', 2000);
            fetchTypes();
        } catch (error) {
            console.error('Failed to delete training type:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to delete training type'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Training Types</h1>
                    <p className="text-solarized-base01">Manage training categories and types</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={() => {
                                setEditingType(null);
                                resetForm();
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Training Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingType ? 'Edit Training Type' : 'Add Training Type'}</DialogTitle>
                            <DialogDescription>
                                {editingType ? 'Update training type details.' : 'Create a new training type.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Leadership Training"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description..."
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="default_duration">Default Duration</Label>
                                    <Input
                                        id="default_duration"
                                        value={formData.default_duration}
                                        onChange={(e) => setFormData({ ...formData, default_duration: e.target.value })}
                                        placeholder="e.g., 3 days, 2 weeks"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90">
                                    {editingType ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : types.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-solarized-base01 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-solarized-base02">No training types found</h3>
                            <p className="text-solarized-base01 mt-1">Create training types to categorize programs.</p>
                            <Button
                                className="mt-4 bg-solarized-blue hover:bg-solarized-blue/90"
                                onClick={() => {
                                    resetForm();
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Training Type
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Default Duration</TableHead>
                                        <TableHead className="w-[50px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {types.map((type) => (
                                        <TableRow key={type.id}>
                                            <TableCell className="font-medium">{type.title}</TableCell>
                                            <TableCell>{type.description || '-'}</TableCell>
                                            <TableCell>{type.default_duration || '-'}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(type)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-solarized-red"
                                                            onClick={() => handleDelete(type.id)}
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
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
