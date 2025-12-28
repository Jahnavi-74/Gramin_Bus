import React, { useState, useEffect } from 'react';
import { Language, Bus, BusStatus, UserRole, UserProfile } from './types';
import { translations } from './translations';
import { ProjectDetails } from './components/ProjectDetails';
import { BusCard } from './components/BusCard';
import { ProfilePage } from './components/ProfilePage';

const INITIAL_BUSES: Bus[] = [
  { id: '1', name: 'Hyderabad Express', number: 'AP 28 Z 1234', status: BusStatus.ON_THE_WAY, updatedBy: 'Admin', updatedByType: 'Admin', routeStops: ['MGBS', 'Koti', 'Dilsukhnagar', 'Hayathnagar'], availableTomorrow: true, availableNext7Days: true, lastUpdateTime: '10:30 AM' },
  { id: '2', name: 'Village Local', number: 'AP 10 K 5566', status: BusStatus.ARRIVED, updatedBy: 'Ravi Kumar', updatedByType: 'Passenger', routeStops: ['Village Center', 'Main School', 'Post Office', 'Bus Stand'], availableTomorrow: false, availableNext7Days: true, lastUpdateTime: '11:15 AM' },
  { id: '3', name: 'Main Road Bus', number: 'TS 09 J 9900', status: BusStatus.DELAYED, updatedBy: 'Admin', updatedByType: 'Admin', routeStops: ['Crossroads', 'Market', 'Hospital'], delayMinutes: 15, availableTomorrow: true, availableNext7Days: true, lastUpdateTime: '09:45 AM' },
];

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<'home' | 'dashboard' | 'report' | 'profile'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | '7days'>('today');
  const [isListening, setIsListening] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', phone: '', pass: '', role: 'Passenger' as UserRole });
  const [busForm, setBusForm] = useState({ name: '', number: '', stops: '', tomorrow: true, next7: true });

  const t = translations[lang];

  // Load users and session on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('gramin_users_v2');
    if (savedUsers) setRegisteredUsers(JSON.parse(savedUsers));
    
    const session = localStorage.getItem('gramin_session_v2');
    if (session) {
      const user = JSON.parse(session);
      setCurrentUser(user);
      setUserRole(user.role);
      setView('dashboard');
    }
  }, []);

  const handleStatusUpdate = (busId: string, newStatus: BusStatus, delay?: number) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBuses(prev => prev.map(bus => {
      if (bus.id === busId) {
        return {
          ...bus,
          status: newStatus,
          delayMinutes: delay,
          updatedBy: currentUser?.name || 'Anonymous',
          updatedByType: userRole || 'Passenger',
          lastUpdateTime: time
        };
      }
      return bus;
    }));
  };

  const handleSaveBus = () => {
    if (!busForm.name.trim() || !busForm.number.trim()) {
      alert("⚠️ Bus Name and Number are required!");
      return;
    }
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (editingBusId) {
      setBuses(prev => prev.map(b => b.id === editingBusId ? {
        ...b,
        name: busForm.name,
        number: busForm.number,
        routeStops: busForm.stops.split(',').map(s => s.trim()).filter(s => s !== ''),
        lastUpdateTime: time,
        updatedBy: currentUser?.name || 'System',
        updatedByType: userRole || 'Admin',
        availableTomorrow: busForm.tomorrow,
        availableNext7Days: busForm.next7
      } : b));
    } else {
      const bus: Bus = {
        id: Date.now().toString(),
        name: busForm.name,
        number: busForm.number,
        status: BusStatus.ON_THE_WAY,
        updatedBy: currentUser?.name || 'Admin',
        updatedByType: userRole || 'Admin',
        routeStops: busForm.stops.split(',').map(s => s.trim()).filter(s => s !== ''),
        availableTomorrow: busForm.tomorrow,
        availableNext7Days: busForm.next7,
        lastUpdateTime: time
      };
      setBuses(prev => [...prev, bus]);
    }
    setShowModal(false);
    setEditingBusId(null);
    setBusForm({ name: '', number: '', stops: '', tomorrow: true, next7: true });
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("❌ Voice recognition is not supported in this browser.");
      return;
    }
    // @ts-ignore
    const recognition = new webkitSpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-US' : lang === 'hi' ? 'hi-IN' : 'te-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setSearchQuery(event.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleAuth = () => {
    // 1. Validation
    if (!authForm.phone || !authForm.pass) {
      alert("⚠️ Please enter both phone and password.");
      return;
    }

    if (authMode === 'register') {
      if (!authForm.name) {
        alert("⚠️ Please enter your full name.");
        return;
      }
      const existing = registeredUsers.find(u => u.phone === authForm.phone);
      if (existing) {
        alert("⚠️ This phone number is already registered. Try logging in.");
        setAuthMode('login');
        return;
      }
      
      // Fix: Changed 'pass' to 'password' to match UserProfile interface definition
      const newUser: UserProfile = { 
        name: authForm.name, 
        phone: authForm.phone, 
        password: authForm.pass, 
        role: authForm.role 
      };
      const updated = [...registeredUsers, newUser];
      setRegisteredUsers(updated);
      localStorage.setItem('gramin_users_v2', JSON.stringify(updated));
      alert("✅ Registration Successful! Please Log in now.");
      setAuthMode('login');
    } else {
      // 2. Login Logic
      // Special Super Admin
      if (authForm.phone === '000' && authForm.pass === 'admin') {
        const adminUser: UserProfile = { name: 'System Admin', phone: '000', role: 'Admin' };
        setCurrentUser(adminUser);
        setUserRole('Admin');
        localStorage.setItem('gramin_session_v2', JSON.stringify(adminUser));
        setView('dashboard');
        return;
      }

      // Check DB
      // Fix: Changed 'u.pass' to 'u.password' to match UserProfile interface definition
      const found = registeredUsers.find(u => u.phone === authForm.phone && u.password === authForm.pass);
      if (found) {
        setCurrentUser(found);
        setUserRole(found.role);
        localStorage.setItem('gramin_session_v2', JSON.stringify(found));
        setView('dashboard');
      } else {
        alert("❌ Invalid Phone Number or Password. If you are new, please Register.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gramin_session_v2');
    setCurrentUser(null);
    setUserRole(null);
    setView('home');
    setAuthMode('login');
    setAuthForm({ name: '', phone: '', pass: '', role: 'Passenger' });
  };

  const updateProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
    localStorage.setItem('gramin_session_v2', JSON.stringify(updated));
    const newUsers = registeredUsers.map(u => u.phone === updated.phone ? updated : u);
    setRegisteredUsers(newUsers);
    localStorage.setItem('gramin_users_v2', JSON.stringify(newUsers));
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          bus.number.toLowerCase().includes(searchQuery.toLowerCase());
    if (dateFilter === 'tomorrow') return matchesSearch && bus.availableTomorrow;
    if (dateFilter === '7days') return matchesSearch && bus.availableNext7Days;
    return matchesSearch;
  });

  const inputClass = "w-full p-5 bg-white rounded-2xl font-bold text-slate-900 border-4 border-slate-200 focus:border-blue-600 focus:shadow-[0_0_15px_rgba(37,99,235,0.2)] outline-none transition-all placeholder:text-slate-400";

  if (view === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900" style={{backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)), url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000")', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="max-w-md w-full space-y-6 text-center animate-in fade-in zoom-in duration-500">
          <div>
            <h1 className="text-6xl font-black text-white drop-shadow-2xl mb-2 italic tracking-tighter">{t.title}</h1>
            <p className="text-blue-400 font-black tracking-widest text-sm uppercase opacity-90">{t.welcome}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-2xl p-2 rounded-3xl flex gap-2 justify-center mb-6 border border-white/10">
            {(['en', 'te', 'hi'] as Language[]).map(l => (
              <button 
                key={l} 
                onClick={() => setLang(l)} 
                className={`flex-1 px-4 py-3 rounded-2xl font-black text-sm transition-all duration-300 ${lang === l ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}
              >
                {l === 'en' ? 'English' : l === 'te' ? 'తెలుగు' : 'हिंदी'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-b-[12px] border-slate-200 space-y-6 text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-8 text-center tracking-tight">{authMode === 'login' ? t.login : t.register}</h2>
            
            {authMode === 'register' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-widest">{t.enterName}</label>
                <input type="text" placeholder="e.g. Rahul Kumar" className={inputClass} value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
                
                <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-widest mt-4 block">Select Your Role</label>
                <select className={inputClass} value={authForm.role} onChange={e => setAuthForm({...authForm, role: e.target.value as UserRole})}>
                  <option value="Passenger">👤 Passenger / User</option>
                  <option value="Conductor">🎫 Bus Staff / Conductor</option>
                </select>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-widest">{t.enterPhone}</label>
                <input type="tel" placeholder="Your Phone Number" className={inputClass} value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-widest">{t.enterPass}</label>
                <input type="password" placeholder="••••••••" className={inputClass} value={authForm.pass} onChange={e => setAuthForm({...authForm, pass: e.target.value})} />
              </div>
            </div>
            
            <button 
              onClick={handleAuth} 
              className="w-full bg-blue-600 text-white font-black py-6 rounded-[2rem] text-2xl shadow-xl border-b-8 border-blue-800 active:translate-y-2 active:border-b-0 transition-all duration-100 mt-8"
            >
              {authMode === 'login' ? t.login : t.register}
            </button>

            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
              className="text-blue-600 font-black underline text-sm mt-6 block w-full text-center hover:text-blue-800 transition uppercase tracking-widest"
            >
              {authMode === 'login' ? t.needAccount : t.haveAccount}
            </button>
          </div>
          
          <button onClick={() => setView('report')} className="text-white/50 font-black underline text-sm hover:text-white transition tracking-widest uppercase">System Help Guide</button>
        </div>
      </div>
    );
  }

  if (view === 'report') return <ProjectDetails onBack={() => setView('dashboard')} lang={lang} />;
  if (view === 'profile') return <ProfilePage user={currentUser!} lang={lang} onBack={() => setView('dashboard')} onLogout={handleLogout} onUpdate={updateProfile} />;

  const canAddBus = userRole === 'Admin' || userRole === 'Conductor';

  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      <header className="bg-slate-900 text-white p-6 sticky top-0 z-40 shadow-2xl flex justify-between items-center border-b-8 border-blue-600">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('profile')} className="w-16 h-16 rounded-3xl border-4 border-white/20 overflow-hidden shadow-2xl hover:scale-110 active:scale-90 transition-all bg-slate-800">
            <img src={currentUser?.photoUrl || "https://ui-avatars.com/api/?background=2563eb&color=fff&bold=true&name=" + currentUser?.name} className="w-full h-full object-cover" />
          </button>
          <div>
            <h1 className="text-2xl font-black leading-none tracking-tighter">{t.title}</h1>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-1.5 mt-1.5">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
              {userRole} Active
            </span>
          </div>
        </div>
        <button onClick={() => setView('report')} className="w-14 h-14 flex items-center justify-center bg-white/10 rounded-2xl text-2xl hover:bg-white/20 transition-all border-b-4 border-black">📋</button>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-10 mt-6">
        <div className="flex gap-3 bg-white p-3 rounded-[2.5rem] shadow-xl border-4 border-slate-100">
          {['today', 'tomorrow', '7days'].map(f => (
            <button key={f} onClick={() => setDateFilter(f as any)} className={`flex-1 py-5 rounded-[1.5rem] font-black border-b-8 transition-all duration-200 ${dateFilter === f ? 'bg-blue-600 text-white border-blue-800 shadow-xl scale-105' : 'bg-transparent text-slate-400 border-transparent opacity-60 hover:opacity-100'}`}>
              {f === 'today' ? t.today : f === 'tomorrow' ? t.tomorrow : t.next7Days}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex-grow relative group">
            <input 
              type="text" 
              placeholder={t.searchPlaceholder} 
              className="w-full p-7 pl-16 rounded-[2.5rem] font-black text-xl shadow-2xl bg-white border-4 border-slate-200 focus:border-blue-600 outline-none transition-all text-slate-900" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
            <span className="absolute left-7 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-focus-within:opacity-100 transition-opacity">🔍</span>
          </div>
          <button onClick={startVoiceSearch} className={`w-24 flex items-center justify-center rounded-[2.5rem] shadow-2xl border-b-8 transition-all active:translate-y-2 active:border-b-0 ${isListening ? 'bg-red-600 border-red-900 animate-pulse text-white' : 'bg-slate-900 border-black text-white'}`}>
            <span className="text-4xl">🎤</span>
          </button>
        </div>

        {canAddBus && (
          <button onClick={() => { setEditingBusId(null); setBusForm({name:'', number:'', stops:'', tomorrow: true, next7: true}); setShowModal(true); }} className="w-full bg-orange-500 text-white font-black py-7 rounded-[3rem] shadow-2xl border-b-[12px] border-orange-700 text-3xl active:translate-y-3 active:border-b-0 transition-all hover:bg-orange-600 uppercase tracking-tighter">
            ➕ {t.addBus}
          </button>
        )}

        <div className="grid gap-10">
          {filteredBuses.map(bus => (
            <BusCard 
              key={bus.id} 
              bus={bus} 
              lang={lang} 
              userRole={userRole!} 
              onUpdate={handleStatusUpdate} 
              onEdit={() => { setEditingBusId(bus.id); setBusForm({name: bus.name, number: bus.number, stops: bus.routeStops.join(','), tomorrow: bus.availableTomorrow, next7: bus.availableNext7Days}); setShowModal(true); }} 
              onDelete={() => setBuses(buses.filter(b => b.id !== bus.id))} 
            />
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[4rem] w-full max-w-xl p-12 shadow-2xl border-b-[16px] border-slate-200 space-y-8 my-auto">
              <h2 className="text-4xl font-black text-slate-900 mb-8 border-l-[12px] border-blue-600 pl-6 tracking-tight">{editingBusId ? t.editBus : t.addBus}</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Basic Info</label>
                  <input placeholder={t.busName} className={inputClass} value={busForm.name} onChange={e => setBusForm({...busForm, name: e.target.value})} />
                  <input placeholder={t.busNumber} className={inputClass} value={busForm.number} onChange={e => setBusForm({...busForm, number: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Route Details</label>
                  <textarea placeholder={t.stops} className={inputClass + " h-32 resize-none"} value={busForm.stops} onChange={e => setBusForm({...busForm, stops: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Schedule Planning</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setBusForm({...busForm, tomorrow: !busForm.tomorrow})} className={`p-6 rounded-3xl font-black text-lg border-4 transition-all ${busForm.tomorrow ? 'bg-blue-600 text-white border-blue-900 shadow-xl scale-105' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                    Tomorrow {busForm.tomorrow ? '✅' : '❌'}
                  </button>
                  <button onClick={() => setBusForm({...busForm, next7: !busForm.next7})} className={`p-6 rounded-3xl font-black text-lg border-4 transition-all ${busForm.next7 ? 'bg-blue-600 text-white border-blue-900 shadow-xl scale-105' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                    Next Week {busForm.next7 ? '✅' : '❌'}
                  </button>
                </div>
              </div>

              <div className="flex gap-6 pt-10">
                <button onClick={() => setShowModal(false)} className="flex-1 font-black text-slate-400 text-2xl hover:text-slate-900 transition-colors uppercase">{t.cancel}</button>
                <button onClick={handleSaveBus} className="flex-[2] bg-blue-600 text-white font-black py-7 rounded-[2.5rem] shadow-2xl border-b-8 border-blue-900 text-3xl hover:bg-blue-700 active:translate-y-2 active:border-b-0 transition-all">
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-16 bg-white rounded-[4rem] shadow-2xl border-b-[12px] border-slate-100 text-center relative overflow-hidden">
          <h3 className="text-4xl font-black text-slate-900 mb-12 tracking-tighter">VILLAGE FEEDBACK CENTER</h3>
          <div className="grid grid-cols-3 gap-8">
            {['😊', '😐', '☹️'].map(emoji => (
              <button key={emoji} onClick={() => { setFeedbackSubmitted(true); setTimeout(() => setFeedbackSubmitted(false), 5000); }} className="p-12 bg-slate-50 rounded-[3rem] text-7xl hover:bg-blue-50 hover:scale-110 transition shadow-xl border-b-8 border-slate-200 active:translate-y-3 active:border-b-0">
                {emoji}
              </button>
            ))}
          </div>
          {feedbackSubmitted && <p className="mt-12 text-green-600 font-black text-3xl animate-bounce">🙏 {t.feedbackSuccess}</p>}
        </div>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-slate-900 text-white py-6 px-12 rounded-full text-center text-sm font-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 border-b-8 border-blue-600 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        Hi {currentUser?.name}! We are monitoring buses together. 🤝
      </div>
    </div>
  );
};

export default App;
