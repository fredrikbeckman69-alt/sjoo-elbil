import React, { useState, useRef } from 'react';
import {
  X,
  User,
  KeyRound,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { UserAccount } from '../types';
import {
  updateAccountProfile,
  changeAccountPin,
  fileToResizedBase64,
} from '../services/authService';
import { formatRegnrPlate, cleanVehicleDisplayName } from '../services/vehicleRegistryService';
import defaultCarImage from '../assets/bil.jpg';

interface UserProfileModalProps {
  currentUser: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onAccountUpdated: (updated: UserAccount) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onAccountUpdated,
}) => {
  // Profilfält
  const [ownerName, setOwnerName] = useState<string>(currentUser.ownerName || '');
  const [vehicleName, setVehicleName] = useState<string>(cleanVehicleDisplayName(currentUser.name, currentUser.regnr));
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(currentUser.photoUrl);

  // Pinkodsbyte
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');

  // Status/meddelanden
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Ladda upp bild från enheten
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setFeedback(null);

    try {
      const resizedBase64 = await fileToResizedBase64(file, 1200, 800);
      setPhotoUrl(resizedBase64);
      setFeedback({ type: 'success', message: 'Bilden har valts! Klicka på "Spara profil" nedan för att tillämpa.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Kunde inte läsa in bilden.' });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Återställ till standardbild
  const handleRemoveImage = () => {
    setPhotoUrl(undefined);
    setFeedback({ type: 'success', message: 'Bilbilden återställd till standardbild.' });
  };

  // Spara ändringar för namn och bilbild
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      let updated = await updateAccountProfile(currentUser.id, {
        ownerName: ownerName.trim(),
        name: vehicleName.trim() || currentUser.name,
        photoUrl: photoUrl || undefined,
      });

      // Om användaren även ville byta pinkod
      if (isChangingPin) {
        if (!oldPin || !newPin || !confirmPin) {
          throw new Error('Fyll i samtliga pinkodsfält eller stäng fliken för pinkodsbyte.');
        }
        if (newPin !== confirmPin) {
          throw new Error('Den nya pinkoden och bekräftelsen matchar inte.');
        }
        const pinRes = await changeAccountPin(currentUser.id, oldPin, newPin);
        if (!pinRes.success || !pinRes.account) {
          throw new Error(pinRes.error || 'Kunde inte byta pinkod.');
        }
        updated = pinRes.account;
        setIsChangingPin(false);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
      }

      onAccountUpdated(updated);
      setFeedback({ type: 'success', message: 'Dina profiländringar och bilbild har sparats!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Ett fel uppstod när profilen sparades.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Profil & Fordonshantering</h2>
              <p className="text-xs text-slate-400">
                Inloggad som <strong className="text-cyan-300">{currentUser.ownerName || cleanVehicleDisplayName(currentUser.name, currentUser.regnr)}</strong> ({formatRegnrPlate(currentUser.regnr)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            title="Stäng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl mb-4 text-xs flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* 1. Bild på bilen */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                Bild på din bil:
              </span>
              {photoUrl && (
                <span className="text-[10px] text-emerald-400 font-medium">Egen uppladdad bild</span>
              )}
            </label>

            {/* Bildförhandsvisning */}
            <div className="relative h-44 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 mb-3 group">
              <img
                src={photoUrl || defaultCarImage}
                alt="Bilbild"
                className="w-full h-full object-cover object-center filter brightness-[0.9] transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                <div className="inline-flex items-center bg-white text-slate-950 font-black font-mono text-[11px] px-2 py-0.5 rounded shadow">
                  <span className="bg-blue-600 text-white text-[8px] font-bold px-1 py-0.2 rounded-l -ml-1.5 mr-1">
                    S
                  </span>
                  {formatRegnrPlate(currentUser.regnr)}
                </div>
                <span className="text-xs font-bold text-white drop-shadow">
                  {vehicleName || currentUser.name}
                </span>
              </div>
            </div>

            {/* Knappar för bilbild */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
                id="profile-car-image-input"
              />
              <label
                htmlFor="profile-car-image-input"
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Ladda upp ny bilbild</span>
              </label>

              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Återställ till standardbild"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Återställ standard</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Bilden anpassas och skalas automatiskt för bästa prestanda och syns i appens header.
            </p>
          </div>

          {/* 2. Namn och bilmodell */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Förarens namn:
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="t.ex. Markus Sjöö"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bilens namn / modell:
              </label>
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="t.ex. Cupra Born 58"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* 3. Sektion: Byt pinkod */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Säkerhet & Pinkod</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(!isChangingPin);
                  setOldPin('');
                  setNewPin('');
                  setConfirmPin('');
                }}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {isChangingPin ? 'Avbryt pinkodsbyte' : 'Byt pinkod'}
              </button>
            </div>

            {isChangingPin ? (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Nuvarande 4-siffrig pinkod:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs font-mono font-bold tracking-widest text-white text-center focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Ny pinkod (4 siffror):
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs font-mono font-bold tracking-widest text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Bekräfta ny pinkod:
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs font-mono font-bold tracking-widest text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Pinkoden krävs varje gång du öppnar appen för att låsa upp kalkylatorn.
              </p>
            )}
          </div>

          {/* Knappar */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Spara profiländringar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
