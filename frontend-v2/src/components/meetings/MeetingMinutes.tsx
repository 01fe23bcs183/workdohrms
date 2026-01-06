import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { FileText, Save, Clock } from 'lucide-react';
import { meetingService } from '../../services/api';
import { showAlert } from '../../lib/sweetalert';

interface MeetingMinute {
    id: number;
    content: string;
    created_at: string;
    created_by?: { name: string };
}

interface MeetingMinutesProps {
    meetingId: number;
    minutes: MeetingMinute[];
    onMinuteAdded: () => void;
    isMeetingActive: boolean;
}

export default function MeetingMinutes({ meetingId, minutes, onMinuteAdded, isMeetingActive }: MeetingMinutesProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setIsSubmitting(true);
        try {
            await meetingService.addMinutes(meetingId, { content });
            setContent('');
            onMinuteAdded();
            showAlert('success', 'Saved', 'Minute recorded successfully');
        } catch (error) {
            console.error(error);
            showAlert('error', 'Error', 'Failed to save minute');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Meeting Minutes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        {minutes.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No minutes recorded yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {minutes.map((minute) => (
                                    <div key={minute.id} className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <p className="whitespace-pre-wrap text-sm text-gray-800">{minute.content}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>{new Date(minute.created_at).toLocaleString()}</span>
                                            {minute.created_by && <span>• by {minute.created_by.name}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {isMeetingActive && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Textarea
                                placeholder="Record new minute..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                            />
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!content.trim() || isSubmitting}
                                    className="bg-solarized-blue"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Minute
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
