import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from './icons';

interface ProfilePageProps {
    userName: string;
    homeworkPoints: number;
    onUpdateUserName: (newName: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userName, homeworkPoints, onUpdateUserName }) => {
    const [currentName, setCurrentName] = useState(userName);
    const [isEditingName, setIsEditingName] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // Sync local state if prop changes from outside
        if (!isEditingName) {
            setCurrentName(userName);
        }
    }, [userName, isEditingName]);

    const handleNameSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentName.trim()) {
            onUpdateUserName(currentName.trim());
            setIsEditingName(false);
        }
    };
    
    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder for password change logic
        alert("Password change functionality is not implemented in this demo.");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-teal-400 mb-6">User Profile</h2>
                <div className="space-y-4">
                    <div className="flex items-center min-h-[40px]">
                        <p className="w-40 text-slate-400 flex-shrink-0">Name:</p>
                        {isEditingName ? (
                            <form onSubmit={handleNameSave} className="flex-grow flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={currentName} 
                                    onChange={(e) => setCurrentName(e.target.value)}
                                    className="flex-grow appearance-none w-full px-3 py-1 border border-slate-600 bg-slate-900 rounded-md placeholder-slate-500 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    autoFocus
                                />
                                <button type="submit" className="px-3 py-1 text-sm rounded-md bg-teal-600 hover:bg-teal-700 transition-colors">Save</button>
                                <button type="button" onClick={() => { setIsEditingName(false); setCurrentName(userName); }} className="px-3 py-1 text-sm rounded-md hover:bg-slate-700 transition-colors">Cancel</button>
                            </form>
                        ) : (
                            <div className="flex-grow flex items-center justify-between">
                                <p className="text-slate-100 font-medium">{userName}</p>
                                <button onClick={() => setIsEditingName(true)} className="text-sm font-medium text-teal-400 hover:text-teal-300">
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center">
                        <p className="w-40 text-slate-400">Homework Points:</p>
                        <p className="text-slate-100 font-medium">{homeworkPoints}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-700 p-6 md:p-8">
                <h3 className="text-xl font-bold text-teal-400 mb-6">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label htmlFor="current" className="block text-sm font-medium text-slate-300 mb-2">Current Password:</label>
                        <div className="relative">
                            <input type={showCurrentPassword ? 'text' : 'password'} id="current" name="current" className="appearance-none block w-full px-3 py-2 pr-10 border border-slate-600 bg-slate-900 rounded-md placeholder-slate-500 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                onMouseDown={() => setShowCurrentPassword(true)} onMouseUp={() => setShowCurrentPassword(false)} onMouseLeave={() => setShowCurrentPassword(false)}
                                onTouchStart={() => setShowCurrentPassword(true)} onTouchEnd={() => setShowCurrentPassword(false)}
                            >
                                {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5 text-slate-400" /> : <EyeIcon className="h-5 w-5 text-slate-400" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="new" className="block text-sm font-medium text-slate-300 mb-2">New Password:</label>
                        <div className="relative">
                            <input type={showNewPassword ? 'text' : 'password'} id="new" name="new" className="appearance-none block w-full px-3 py-2 pr-10 border border-slate-600 bg-slate-900 rounded-md placeholder-slate-500 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                onMouseDown={() => setShowNewPassword(true)} onMouseUp={() => setShowNewPassword(false)} onMouseLeave={() => setShowNewPassword(false)}
                                onTouchStart={() => setShowNewPassword(true)} onTouchEnd={() => setShowNewPassword(false)}
                            >
                                {showNewPassword ? <EyeSlashIcon className="h-5 w-5 text-slate-400" /> : <EyeIcon className="h-5 w-5 text-slate-400" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirm" className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password:</label>
                        <div className="relative">
                            <input type={showConfirmPassword ? 'text' : 'password'} id="confirm" name="confirm" className="appearance-none block w-full px-3 py-2 pr-10 border border-slate-600 bg-slate-900 rounded-md placeholder-slate-500 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm" />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                onMouseDown={() => setShowConfirmPassword(true)} onMouseUp={() => setShowConfirmPassword(false)} onMouseLeave={() => setShowConfirmPassword(false)}
                                onTouchStart={() => setShowConfirmPassword(true)} onTouchEnd={() => setShowConfirmPassword(false)}
                            >
                                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5 text-slate-400" /> : <EyeIcon className="h-5 w-5 text-slate-400" />}
                            </button>
                        </div>
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-colors">
                            Change Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;