
import { Home, MessageSquare, MapPin, Calendar, Search } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'home' | 'messages' | 'map' | 'appointments' | 'doctors';
    onTabChange: (tab: 'home' | 'messages' | 'map' | 'appointments' | 'doctors') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    return (
        <div className="absolute bottom-6 left-0 right-0 z-[1000] flex justify-center pointer-events-none">
            {/* Glassmorphism: Compact design */}
            <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-full px-6 py-2 flex items-center space-x-8 pointer-events-auto border border-white/50">

                <button
                    onClick={() => onTabChange('home')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'home' ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Home className={`w-5 h-5 ${activeTab === 'home' ? 'fill-current' : ''}`} />
                    {activeTab === 'home' && <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></span>}
                </button>

                <button
                    onClick={() => onTabChange('doctors')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'doctors' ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Search className={`w-5 h-5 ${activeTab === 'doctors' ? 'text-blue-600' : ''}`} />
                    {activeTab === 'doctors' && <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></span>}
                </button>

                <button
                    onClick={() => onTabChange('map')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'map' ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <div className={`p-1.5 rounded-full ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
                        <MapPin className="w-5 h-5" />
                    </div>
                </button>

                <button
                    onClick={() => onTabChange('appointments')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'appointments' ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Calendar className={`w-5 h-5 ${activeTab === 'appointments' ? 'fill-current' : ''}`} />
                    {activeTab === 'appointments' && <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></span>}
                </button>

                <button
                    onClick={() => onTabChange('messages')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'messages' ? 'text-blue-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <MessageSquare className={`w-5 h-5 ${activeTab === 'messages' ? 'fill-current' : ''}`} />
                    {activeTab === 'messages' && <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></span>}
                </button>

            </div>
        </div>
    );
}
