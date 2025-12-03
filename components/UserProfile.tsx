import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth } from '../firebase';
import { UserStats } from '../types';
import { formatMinutes } from '../services/statsService';
import { X, User as UserIcon, Mail, Calendar, Save, Key, Shield, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { CyberButton, CyberInput, CyberCard, GlitchText } from './CyberUI';

interface UserProfileProps {
  user: firebase.User;
  stats: UserStats;
  animeCount: number;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, stats, animeCount, onClose }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await user.updateProfile({
        displayName: displayName
      });
      setMessage({ type: 'success', text: 'IDENTITY_RECORD UPDATED' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setLoading(true);
    setMessage(null);
    try {
        await auth.sendPasswordResetEmail(user.email);
        setMessage({ type: 'success', text: 'RESET_PROTOCOL INITIATED. CHECK INBOX.' });
    } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
    } finally {
        setLoading(false);
    }
  };

  const joinDate = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : 'UNKNOWN';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <CyberCard className="w-full max-w-lg">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 border-b border-[#00ff9f]/20 pb-4">
          <div className="flex items-center gap-3">
             <Database className="w-5 h-5 text-[#ff0055] animate-pulse" />
             <GlitchText className="text-xl font-mono font-bold text-white tracking-widest">
                IDENTITY_MODULE
             </GlitchText>
          </div>
          <button 
             onClick={onClose} 
             className="text-gray-500 hover:text-[#ff0055] transition-colors"
          >
             <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 border-2 border-[#00ff9f] border-dashed rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-2 bg-black rounded-full overflow-hidden border border-gray-700">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover opacity-80" />
                        ) : (
                            <UserIcon className="w-full h-full p-4 text-gray-600" />
                        )}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs font-mono text-[#00ff9f]">STATUS: ACTIVE</div>
                    <div className="text-[10px] font-mono text-gray-500">{user.uid.substring(0,8)}...</div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="flex-1 space-y-4">
                <div>
                   <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Designation</label>
                   <div className="text-white font-bold text-lg">{user.displayName || 'ANONYMOUS_USER'}</div>
                </div>
                <div>
                   <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Comms Link</label>
                   <div className="text-gray-300 font-mono text-sm">{user.email}</div>
                </div>
                <div>
                   <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Initialization</label>
                   <div className="text-gray-300 font-mono text-sm">{joinDate}</div>
                </div>
            </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-1 mb-8">
           {[
             { label: "ENTRIES", value: animeCount, color: "text-[#00ff9f]" },
             { label: "HOURS", value: formatMinutes(stats.lifetimeMinutes).split(' ')[0], color: "text-[#ff0055]" },
             { label: "EPISODES", value: Math.floor(stats.lifetimeMinutes / 24), color: "text-blue-400" }
           ].map((stat, i) => (
             <div key={i} className="bg-[#00ff9f]/5 border border-[#00ff9f]/20 p-2 text-center">
                <div className={`text-xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-[9px] text-gray-500 font-mono tracking-widest">{stat.label}</div>
             </div>
           ))}
        </div>

        {/* Edit Form */}
        <div className="border-t border-gray-800 pt-6 space-y-6">
            {message && (
              <div className={`p-3 border font-mono text-xs flex items-center gap-2 ${
                  message.type === 'success' 
                  ? 'bg-green-900/20 border-green-500 text-green-400' 
                  : 'bg-red-900/20 border-red-500 text-red-400'
              }`}>
                  {message.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                  {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
               <div className="flex gap-4 items-end">
                  <div className="flex-1">
                     <CyberInput 
                       label="Update Designation"
                       value={displayName}
                       onChange={(e) => setDisplayName(e.target.value)}
                       placeholder="Enter new alias..."
                     />
                  </div>
                  <CyberButton type="submit" primary disabled={loading}>
                     <Save className="w-4 h-4" />
                  </CyberButton>
               </div>
            </form>

            {user.providerData.some(p => p.providerId === 'password') && (
               <div className="pt-2">
                 <CyberButton onClick={handlePasswordReset} className="w-full text-xs" disabled={loading}>
                    <Key className="w-4 h-4" />
                    Initiate Password Reset Protocol
                 </CyberButton>
               </div>
            )}
            
            <div className="text-center text-[10px] font-mono text-gray-600">
               ENCRYPTION LEVEL: MAXIMUM // SECURE CONNECTION ESTABLISHED
            </div>
        </div>

      </CyberCard>
    </div>
  );
};