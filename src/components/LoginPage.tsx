import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Car,
  Zap,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  Delete,
  RotateCcw,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Loader2,
  Info,
  User,
  Camera,
  Trash2,
} from 'lucide-react';
import { UserAccount, VehicleProfile } from '../types';
import {
  getUserAccounts,
  saveUserAccount,
  validatePin,
  setLastSelectedVehicleId,
  getLastSelectedVehicleId,
  fileToResizedBase64,
} from '../services/authService';
import {
  fetchVehicleFromRegistry,
  formatRegnrPlate,
} from '../services/vehicleRegistryService';
import carImage from '../assets/bil.jpg';

interface LoginPageProps {
  onLoginSuccess: (account: UserAccount) => void;
  initialAccountId?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  initialAccountId,
}) => {
  // Läge: inloggning med siffersats (standard) eller skapa nytt konto
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Konton
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);

  // Inloggnings-PIN
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isShake, setIsShake] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Registreringsformulär
  const [regOwnerName, setRegOwnerName] = useState<string>('');
  const [regPlate, setRegPlate] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regPin, setRegPin] = useState<string>('');
  const [regPinConfirm, setRegPinConfirm] = useState<string>('');
  const [regBatteryKwh, setRegBatteryKwh] = useState<number>(60);
  const [regConsumption, setRegConsumption] = useState<number>(17.5);
  const [regPhotoUrl, setRegPhotoUrl] = useState<string | undefined>(undefined);
  const [isUploadingRegImage, setIsUploadingRegImage] = useState<boolean>(false);
  const [isFetchingVehicle, setIsFetchingVehicle] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLookupSuccess, setRegLookupSuccess] = useState<string | null>(null);
  const [regSuccessBanner, setRegSuccessBanner] = useState<string | null>(null);

  const regFileInputRef = useRef<HTMLInputElement>(null);

  // Hantera uppladdning av bild på bilen under registrering
  const handleRegImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRegImage(true);
    setRegError(null);

    try {
      const resized = await fileToResizedBase64(file, 1000, 700);
      setRegPhotoUrl(resized);
    } catch (err: any) {
      setRegError(err.message || 'Kunde inte läsa in bilden.');
    } finally {
      setIsUploadingRegImage(false);
      if (regFileInputRef.current) regFileInputRef.current.value = '';
    }
  };

  // Referens för container och tangentbordsfokus
  const containerRef = useRef<HTMLDivElement>(null);

  // Ladda alla sparade användarkonton vid start
  useEffect(() => {
    let isMounted = true;
    getUserAccounts().then((loaded) => {
      if (!isMounted) return;
      setAccounts(loaded);
      if (loaded.length > 0) {
        const rememberedId = initialAccountId || getLastSelectedVehicleId();
        const matching = rememberedId
          ? loaded.find((a) => a.id.toUpperCase() === rememberedId.toUpperCase())
          : null;
        setSelectedAccountId(matching ? matching.id : loaded[0].id);
      }
      setIsLoadingAccounts(false);
    });
    return () => {
      isMounted = false;
    };
  }, [initialAccountId]);

  // Aktivt valt fordon i inloggningsläget
  const selectedAccount =
    accounts.find((a) => a.id.toUpperCase() === selectedAccountId.toUpperCase()) ||
    accounts[0];

  // Verifiera PIN när 4 siffror fyllts i
  const handleVerifyPin = useCallback(
    async (codeToTest: string) => {
      if (!selectedAccount || codeToTest.length !== 4) return;

      setIsVerifying(true);
      setPinError(null);

      const result = await validatePin(selectedAccount.regnr, codeToTest);

      if (result.success && result.account) {
        setIsSuccess(true);
        setLastSelectedVehicleId(result.account.id);
        setTimeout(() => {
          onLoginSuccess(result.account!);
        }, 550);
      } else {
        setIsShake(true);
        setPinError(result.error || 'Felaktig PIN-kod. Försök igen.');
        setTimeout(() => {
          setIsShake(false);
          setPin('');
          setIsVerifying(false);
        }, 650);
      }
    },
    [selectedAccount, onLoginSuccess]
  );

  // Klick eller inmatning av en siffra i siffersatsen
  const handleDigitPress = useCallback(
    (digit: string) => {
      if (isSuccess || isVerifying) return;
      if (pin.length >= 4) return;

      const nextPin = pin + digit;
      setPin(nextPin);
      setPinError(null);

      if (nextPin.length === 4) {
        handleVerifyPin(nextPin);
      }
    },
    [pin, isSuccess, isVerifying, handleVerifyPin]
  );

  // Radera sista siffran
  const handleBackspace = useCallback(() => {
    if (isSuccess || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  }, [isSuccess, isVerifying]);

  // Rensa hela PIN
  const handleClearPin = useCallback(() => {
    if (isSuccess || isVerifying) return;
    setPin('');
    setPinError(null);
  }, [isSuccess, isVerifying]);

  // Fysisk tangentbordslyssnare för direkt inmatning
  useEffect(() => {
    if (mode !== 'login') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorera om användaren klickar i något textfält
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClearPin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, handleDigitPress, handleBackspace, handleClearPin]);

  // Byt vald bil i dropdown
  const handleSelectVehicle = (id: string) => {
    setSelectedAccountId(id);
    setLastSelectedVehicleId(id);
    setPin('');
    setPinError(null);
    setRegSuccessBanner(null);
    setIsSuccess(false);
  };

  // Hämtning av fordonsuppgifter från registreringsnumret vid nyregistrering
  const handleLookupRegnr = async () => {
    const cleanPlate = regPlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanPlate || cleanPlate.length < 2) {
      setRegError('Ange ett giltigt registreringsnummer (t.ex. FFM56R eller ABC123).');
      return;
    }

    setIsFetchingVehicle(true);
    setRegError(null);
    setRegLookupSuccess(null);

    try {
      const data = await fetchVehicleFromRegistry(cleanPlate);
      if (data) {
        const autoName = data.fullName || `${data.make} ${data.model}`.trim();
        setRegName(autoName);
        if (data.batteryCapacityKwh) setRegBatteryKwh(data.batteryCapacityKwh);
        if (data.consumptionKwh100Km) setRegConsumption(data.consumptionKwh100Km);
        setRegLookupSuccess(`Hittade: ${autoName} (${data.batteryCapacityKwh || 60} kWh)`);
      }
    } catch {
      // Om inte hittas i online-registret, låt användaren fylla i manuellt
      setRegLookupSuccess('Kunde inte nå externt register automatiskt. Ange fordonsnamn manuellt nedan.');
    } finally {
      setIsFetchingVehicle(false);
    }
  };

  // Slutför och spara nytt konto
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const cleanPlate = regPlate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanPlate || cleanPlate.length < 2) {
      setRegError('Vänligen ange registreringsnummer.');
      return;
    }

    if (!regPin || regPin.length !== 4 || !/^\d{4}$/.test(regPin)) {
      setRegError('Lösenordet måste bestå av exakt en fyrsiffrig pinkod (0000–9999).');
      return;
    }

    if (regPinConfirm && regPin !== regPinConfirm) {
      setRegError('PIN-koderna matchar inte. Kontrollera bekräftelsen.');
      return;
    }

    const finalName = regName.trim() || `Elbil (${formatRegnrPlate(cleanPlate)})`;
    const newProfile: VehicleProfile = {
      id: cleanPlate,
      name: finalName,
      batteryCapacityKwh: Number(regBatteryKwh) || 60,
      consumptionKwhPer100Km: Number(regConsumption) || 17.5,
      photoUrl: regPhotoUrl,
    };

    const newAccount: UserAccount = {
      id: cleanPlate,
      regnr: cleanPlate,
      name: finalName,
      ownerName: regOwnerName.trim() || undefined,
      pinCode: regPin,
      photoUrl: regPhotoUrl,
      createdAt: new Date().toISOString(),
      vehicleProfile: newProfile,
      color: 'emerald',
    };

    // Spara i IndexedDB & localStorage
    const updatedAccounts = await saveUserAccount(newAccount);
    setAccounts(updatedAccounts);
    setSelectedAccountId(newAccount.id);
    setLastSelectedVehicleId(newAccount.id);

    // Byt tillbaka till inloggningsvyn med siffersatsen
    // Användaren MÅSTE slå in sin pinkod för att få tillgång till appen!
    setMode('login');
    setPin('');
    setPinError(null);
    setRegOwnerName('');
    setRegPlate('');
    setRegName('');
    setRegPin('');
    setRegPinConfirm('');
    setRegPhotoUrl(undefined);
    setRegLookupSuccess(null);
    setRegSuccessBanner(
      `Kontot för ${formatRegnrPlate(cleanPlate)}${newAccount.ownerName ? ` (${newAccount.ownerName})` : ''} är skapat! Slå in din valda 4-siffriga pinkod på siffersatsen för att låsa upp kalkylatorn.`
    );
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 py-8 relative overflow-hidden select-none"
    >
      {/* Bakgrundseffekter */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <img
          src={carImage}
          alt="Bakgrund elbil"
          className="w-full h-full object-cover filter blur-md brightness-[0.25] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />
      </div>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-cyan-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Huvudkort för inloggning */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Logotyp & Titel */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-950/50">
            {isSuccess ? (
              <Unlock className="w-7 h-7 text-emerald-400 animate-bounce" />
            ) : mode === 'register' ? (
              <Car className="w-7 h-7 text-cyan-400" />
            ) : (
              <Zap className="w-7 h-7 text-emerald-400 fill-emerald-400/30" />
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Sjöö Elbilskalkylator Pro
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Välj ditt fordon och slå in din 4-siffriga pinkod'
              : 'Registrera fordon och välj en personlig 4-siffrig pinkod'}
          </p>
        </div>

        {/* Flikväxlare: Logga in / Skapa nytt konto */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setPin('');
              setPinError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Logga in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Skapa nytt konto
          </button>
        </div>

        {/* ======================================================== */}
        {/* LÄGE 1: FÖRSTA LÄGET MED DROP DOWN OCH SIFFERSATS (LOGIN) */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <div className="space-y-6">
            {/* Bekräftelse vid nyskapat konto som kräver pinkodsinmatning */}
            {regSuccessBanner && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/40">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span className="leading-snug">{regSuccessBanner}</span>
              </div>
            )}

            {/* 1. Fordonsväljare (Drop down för befintliga användare) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Välj fordon (befintliga användare):</span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {accounts.length} fordon registrerade
                </span>
              </label>

              {isLoadingAccounts ? (
                <div className="flex items-center gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Hämtar fordon...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => handleSelectVehicle(e.target.value)}
                    aria-label="Välj fordon från rullgardinsmeny"
                    className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-xl py-3 pl-3 pr-10 text-sm font-semibold text-white appearance-none cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                        [{formatRegnrPlate(acc.regnr)}] {acc.ownerName ? `${acc.ownerName} • ` : ''}{acc.name} ({acc.vehicleProfile?.batteryCapacityKwh || 60} kWh)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Förhandsvisning av vald bil */}
            {selectedAccount && (
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {selectedAccount.photoUrl ? (
                    <img
                      src={selectedAccount.photoUrl}
                      alt="Bil"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow flex-shrink-0"
                    />
                  ) : (
                    <div className="inline-flex items-center bg-white text-slate-950 font-black font-mono text-xs px-2.5 py-1 rounded shadow border border-slate-300 flex-shrink-0">
                      <span className="bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-l -ml-2 mr-1">
                        S
                      </span>
                      {formatRegnrPlate(selectedAccount.regnr)}
                    </div>
                  )}

                  <div className="text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedAccount.photoUrl && (
                        <div className="inline-flex items-center bg-white text-slate-950 font-black font-mono text-[10px] px-1.5 py-0.2 rounded shadow border border-slate-300">
                          {formatRegnrPlate(selectedAccount.regnr)}
                        </div>
                      )}
                      {selectedAccount.ownerName && (
                        <span className="text-xs font-bold text-cyan-300">
                          {selectedAccount.ownerName}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white leading-tight mt-0.5">
                      {selectedAccount.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {selectedAccount.vehicleProfile?.consumptionKwhPer100Km || 18} kWh/100km •{' '}
                      {selectedAccount.vehicleProfile?.batteryCapacityKwh || 60} kWh
                    </div>
                  </div>
                </div>
                <div className="text-emerald-400 text-xs font-bold flex items-center gap-1 flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Klar
                </div>
              </div>
            )}

            {/* 2. Visuella PIN-prickar (4 siffror) */}
            <div className="text-center py-1">
              <div className="text-xs font-medium text-slate-400 mb-2 flex items-center justify-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Slå in din fyrsiffriga pinkod:</span>
              </div>

              <div
                className={`flex items-center justify-center gap-4 my-2 transition-transform duration-200 ${
                  isShake ? 'animate-[shake_0.4s_ease-in-out]' : ''
                }`}
                style={
                  isShake
                    ? {
                        animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
                      }
                    : {}
                }
              >
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        isSuccess
                          ? 'bg-emerald-400 scale-125 shadow-lg shadow-emerald-500/50'
                          : pinError
                          ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                          : isFilled
                          ? 'bg-cyan-400 scale-125 shadow-md shadow-cyan-500/50'
                          : 'bg-slate-800 border-2 border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Status / Felmeddelande */}
              <div className="h-5 mt-1.5 flex items-center justify-center">
                {isVerifying ? (
                  <span className="text-xs text-cyan-400 flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verifierar...
                  </span>
                ) : isSuccess ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Inloggad! Öppnar kalkylator...
                  </span>
                ) : pinError ? (
                  <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Använd siffersatsen nedan eller tangentbordet
                  </span>
                )}
              </div>
            </div>

            {/* 3. Siffersats (Interaktiv Numpad 0-9) */}
            <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto">
              {[
                { label: '1', sub: '' },
                { label: '2', sub: 'ABC' },
                { label: '3', sub: 'DEF' },
                { label: '4', sub: 'GHI' },
                { label: '5', sub: 'JKL' },
                { label: '6', sub: 'MNO' },
                { label: '7', sub: 'PQRS' },
                { label: '8', sub: 'TUV' },
                { label: '9', sub: 'WXYZ' },
              ].map(({ label, sub }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleDigitPress(label)}
                  disabled={isSuccess || isVerifying}
                  className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-cyan-600/40 border border-slate-700/70 hover:border-cyan-500/50 text-white font-bold text-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 shadow-md cursor-pointer disabled:opacity-50 select-none group"
                >
                  <span className="leading-none group-active:text-cyan-300">{label}</span>
                  {sub && (
                    <span className="text-[8px] font-normal tracking-wider text-slate-400 leading-none mt-0.5">
                      {sub}
                    </span>
                  )}
                </button>
              ))}

              {/* Nedre rad: C (Rensa), 0, Backspace */}
              <button
                type="button"
                onClick={handleClearPin}
                disabled={isSuccess || isVerifying || pin.length === 0}
                className="h-14 rounded-2xl bg-slate-900/60 hover:bg-slate-800/60 active:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs uppercase flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none"
                title="Rensa pinkod (Esc)"
              >
                <RotateCcw className="w-4 h-4 mr-1 text-slate-400" />
                C
              </button>

              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                disabled={isSuccess || isVerifying}
                className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-cyan-600/40 border border-slate-700/70 hover:border-cyan-500/50 text-white font-bold text-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 shadow-md cursor-pointer disabled:opacity-50 select-none group"
              >
                <span className="leading-none group-active:text-cyan-300">0</span>
                <span className="text-[8px] font-normal tracking-wider text-slate-400 leading-none mt-0.5">
                  +
                </span>
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                disabled={isSuccess || isVerifying || pin.length === 0}
                className="h-14 rounded-2xl bg-slate-900/60 hover:bg-slate-800/60 active:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none"
                title="Radera siffra (Backspace)"
              >
                <Delete className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Ledtråd / Hjälpinformation för demo */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>
                  Första användare: <strong className="text-white font-semibold">Markus Sjöö</strong> ({formatRegnrPlate(selectedAccount?.regnr || 'FFM56R')}) med pinkod{' '}
                  <strong className="text-emerald-400 font-mono font-bold">7289</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* LÄGE 2: SKAPA NYTT KONTO (REGNR & VALFRI FYRSIFFRIG PIN) */}
        {/* ======================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            {/* Förarens namn */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ditt namn (förare / ägare):
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regOwnerName}
                  onChange={(e) => setRegOwnerName(e.target.value)}
                  placeholder="t.ex. Markus Sjöö, Anna Lind"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
              </div>
            </div>

            {/* Registreringsnummer */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Registreringsnummer:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white font-bold text-[9px] px-1 py-0.5 rounded">
                    S
                  </div>
                  <input
                    type="text"
                    value={regPlate}
                    onChange={(e) => setRegPlate(e.target.value.toUpperCase())}
                    placeholder="t.ex. ABC 123"
                    maxLength={8}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl py-2.5 pl-9 pr-3 text-sm font-mono font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookupRegnr}
                  disabled={isFetchingVehicle || !regPlate.trim()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isFetchingVehicle ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Hämta bil</span>
                </button>
              </div>
              {regLookupSuccess && (
                <p className="text-[11px] text-cyan-300 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  {regLookupSuccess}
                </p>
              )}
            </div>

            {/* Uppladdning av bild på bilen */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  Bild på din bil (valfritt):
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Kan även laddas upp efteråt</span>
              </label>

              {regPhotoUrl ? (
                <div className="relative h-28 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                  <img src={regPhotoUrl} alt="Förhandsvisning bil" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setRegPhotoUrl(undefined)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                    title="Ta bort bild"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={regFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleRegImageChange}
                    className="hidden"
                    id="register-car-image-input"
                  />
                  <label
                    htmlFor="register-car-image-input"
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
                  >
                    {isUploadingRegImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    ) : (
                      <Camera className="w-4 h-4 text-cyan-400" />
                    )}
                    <span>Ladda upp bilbild (från mobil/dator)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Bilnamn */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fordonsnamn / Modell:
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="t.ex. Volkswagen ID.4, Polestar 2"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {/* Batterikapacitet & Förbrukning */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Batteri (kWh):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="150"
                  value={regBatteryKwh}
                  onChange={(e) => setRegBatteryKwh(parseFloat(e.target.value) || 60)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Förbrukning (kWh/100km):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="35"
                  value={regConsumption}
                  onChange={(e) => setRegConsumption(parseFloat(e.target.value) || 17.5)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            {/* Skapa fyrsiffrig pinkod */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Välj en valfri fyrsiffrig pinkod (0000–9999):</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Pinkod (4 siffror):
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full text-center tracking-[0.3em] font-mono font-bold text-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2 px-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Bekräfta pinkod:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={regPinConfirm}
                    onChange={(e) =>
                      setRegPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="••••"
                    className="w-full text-center tracking-[0.3em] font-mono font-bold text-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2 px-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Felmeddelande vid registrering */}
            {regError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {/* Knappar */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Skapa konto & Logga in</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setRegError(null);
                }}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Tillbaka till inloggning</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer / Info */}
      <div className="mt-6 text-center text-xs text-slate-500 flex items-center gap-3">
        <span>Sjöö Elbilskalkylator Pro</span>
        <span>•</span>
        <span>Svensk Standard</span>
        <span>•</span>
        <span>PIN-skyddad inloggning</span>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};
