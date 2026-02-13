import { useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';

interface UserMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onEditProfile: () => void;
    onSignOut: () => void;
}

export default function UserMenu({ isOpen, onClose, onEditProfile, onSignOut }: UserMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="absolute top-16 right-4 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-[2000] animate-fade-in-up origin-top-right overflow-hidden"
        >
            <div className="py-1">
                <button
                    onClick={() => { onEditProfile(); onClose(); }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    Edit Profile
                </button>
                <button
                    onClick={() => { onSignOut(); onClose(); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-50"
                >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
