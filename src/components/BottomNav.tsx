
import { Home, MessageSquare, MapPin, Calendar, Search } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'home' | 'messages' | 'map' | 'appointments' | 'doctors';
    onTabChange: (tab: 'home' | 'messages' | 'map' | 'appointments' | 'doctors') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    return (
        <div className="absolute bottom-6 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
            {/* Glassmorphism: Increased transparency and blur for a true glass effect */}
            <div className="bg-white/60 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-full px-8 py-4 flex items-center space-x-12 pointer-events-auto border border-white/40 ring-1 ring-white/20">

                <button
                    onClick={() => onTabChange('home')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'home' ? 'text-blue-600 scale-110' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} />
                    {activeTab === 'home' && <span className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse"></span>}
                </button>

                <button
                    onClick={() => onTabChange('doctors')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'doctors' ? 'text-blue-600 scale-110' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <Search className={`w-6 h-6 ${activeTab === 'doctors' ? 'text-blue-600' : ''}`} />
                    {activeTab === 'doctors' && <span className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse"></span>}
                </button>

                <button
                    onClick={() => onTabChange('map')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'map' ? 'text-blue-600 scale-110' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <div className={`p-2 rounded-full ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white/50 text-gray-500 hover:bg-white'}`}>
                        <MapPin className="w-6 h-6" />
                    </div>
                </button>

                <button
                    onClick={() => onTabChange('appointments')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'appointments' ? 'text-blue-600 scale-110' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <Calendar className={`w-6 h-6 ${activeTab === 'appointments' ? 'fill-current' : ''}`} />
                    {activeTab === 'appointments' && <span className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse"></span>}
                </button>

                <button
                    onClick={() => onTabChange('messages')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'messages' ? 'text-blue-600 scale-110' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <MessageSquare className={`w-6 h-6 ${activeTab === 'messages' ? 'fill-current' : ''}`} />
                    {activeTab === 'messages' && <span className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse"></span>}
                </button>

            </div>
        </div>
    );
}
