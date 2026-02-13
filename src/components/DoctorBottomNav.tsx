import { MessageSquare, Calendar, User } from 'lucide-react';

interface DoctorBottomNavProps {
    activeTab: 'chat' | 'appointments' | 'profile';
    onTabChange: (tab: 'chat' | 'appointments' | 'profile') => void;
}

export default function DoctorBottomNav({ activeTab, onTabChange }: DoctorBottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe z-40">
            <div className="flex justify-around items-center max-w-md mx-auto">
                <button
                    onClick={() => onTabChange('chat')}
                    className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'chat' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <MessageSquare className={`w-6 h-6 ${activeTab === 'chat' ? 'fill-current' : ''}`} />
                    <span className="text-xs font-medium mt-1">Chat</span>
                </button>

                <button
                    onClick={() => onTabChange('appointments')}
                    className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'appointments' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Calendar className={`w-6 h-6 ${activeTab === 'appointments' ? 'fill-current' : ''}`} />
                    <span className="text-xs font-medium mt-1">Requests</span>
                </button>

                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
                    <span className="text-xs font-medium mt-1">Profile</span>
                </button>
            </div>
        </div>
    );
}
