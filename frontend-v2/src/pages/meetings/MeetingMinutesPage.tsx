import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { meetingService } from '../../services/api';
import { Loader2, FileText, Calendar } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Link } from 'react-router-dom';

export default function MeetingMinutesPage() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMeetingsWithMinutes();
    }, []);

    const fetchMeetingsWithMinutes = async () => {
        setIsLoading(true);
        try {
            const response = await meetingService.getAll();
            if (response.data.success) {
                // Filter meetings that have minutes or show all and indicate minutes status
                setMeetings(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch meetings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
                    <FileText className="h-6 w-6" /> Meeting Minutes
                </h1>
                <p className="text-solarized-base01">Archive of all meeting discussions and summaries</p>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle>Minutes Archive</CardTitle>
                    <CardDescription>View and manage minutes from past meetings</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-solarized-blue" />
                        </div>
                    ) : meetings.length === 0 ? (
                        <div className="text-center py-10 text-solarized-base01">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No meeting minutes found.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {meetings.map((meeting) => (
                                <Link
                                    key={meeting.id}
                                    to={`/meetings/${meeting.id}`}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-solarized-base3 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-solarized-blue/10 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-solarized-blue" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-solarized-base02">{meeting.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-solarized-base01 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(meeting.date).toLocaleDateString()}
                                                </span>
                                                <Badge variant="outline" className="bg-solarized-base3 text-solarized-base01 border-solarized-base2">
                                                    {meeting.meeting_type?.title || 'General'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge className={meeting.minutes ? 'bg-solarized-green/10 text-solarized-green border-solarized-green/20' : 'bg-solarized-yellow/10 text-solarized-yellow border-solarized-yellow/20'}>
                                        {meeting.minutes ? 'Minutes Ready' : 'Pending'}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
