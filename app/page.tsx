'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  FileText, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  MoreVertical, 
  ChevronRight,
  LogOut,
  UserPlus,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  File as FileIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Data from the user's document
const INITIAL_DATA = [
  { id: '1', date: '25-9-69', time: '02.30', name: 'อาทิตย์', phone: '-', room: 'B109', status: 'occupied' },
  { id: '2', date: '25-9-69', time: '02.30', name: 'ชาญชัย อ้นเครือ', phone: '099-892-8404', room: 'B108', status: 'occupied' },
  { id: '3', date: '25-9-69', time: '00.00', name: 'ภิรมย์', phone: '098-228-0959', room: 'A101', status: 'occupied' },
  { id: '4', date: '25-9-69', time: '20.00', name: 'วันชัย', phone: '-', room: 'B110', status: 'occupied' },
  { id: '5', date: '25-9-69', time: '01.14', name: 'นายสินวิสุทธิ์ สังเวียน', phone: '088-519-922', room: 'B106', status: 'occupied' },
  { id: '6', date: '25-9-69', time: '01.14', name: 'สินวิสุทธิ์', phone: '-', room: 'B107', status: 'occupied' },
  { id: '7', date: '25-9-69', time: '01.90', name: 'กอ', phone: '-', room: 'N3', status: 'occupied' },
  { id: '8', date: '25-9-69', time: '20.47', name: 'สุริณี แก้วประทุม', phone: '098-513-1345', room: 'A102', status: 'occupied' },
  { id: '9', date: '25-9-69', time: '03.00', name: 'นิโรจ สีจันทร์', phone: '080-282-6524', room: 'B104', status: 'occupied' },
];

const ROOM_LIST = [
  { id: 'A101', type: 'Standard', price: 3500 },
  { id: 'A102', type: 'Standard', price: 3500 },
  { id: 'A103', type: 'Standard', price: 3500 },
  { id: 'A104', type: 'Standard', price: 3500 },
  { id: 'B104', type: 'Deluxe', price: 4500 },
  { id: 'B106', type: 'Deluxe', price: 4500 },
  { id: 'B107', type: 'Deluxe', price: 4500 },
  { id: 'B108', type: 'Deluxe', price: 4500 },
  { id: 'B109', type: 'Deluxe', price: 4500 },
  { id: 'B110', type: 'Deluxe', price: 4500 },
  { id: 'N3', type: 'Standard', price: 3000 },
];

export default function ResortApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants, setTenants] = useState(INITIAL_DATA);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Report Filters
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    roomType: 'all',
    status: 'all'
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    room: '',
    date: new Date().toISOString().split('T')[0]
  });

  const filteredData = useMemo(() => {
    return tenants.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tenants]);

  const reportData = useMemo(() => {
    return tenants.filter(item => {
      const matchesRoomType = reportFilters.roomType === 'all' || 
        ROOM_LIST.find(r => r.id === item.room)?.type === reportFilters.roomType;
      const matchesStatus = reportFilters.status === 'all' || item.status === reportFilters.status;
      // Date filtering logic would go here if dates were standard ISO
      return matchesRoomType && matchesStatus;
    });
  }, [tenants, reportFilters]);

  const stats = {
    totalRooms: ROOM_LIST.length,
    occupied: tenants.length,
    available: ROOM_LIST.length - tenants.length,
    revenue: tenants.length * 4000 // Average
  };

  const handleOpenAddModal = () => {
    setEditingTenant(null);
    setFormData({
      name: '',
      phone: '',
      room: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsCheckInModalOpen(true);
  };

  const handleOpenEditModal = (tenant: any) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      phone: tenant.phone,
      room: tenant.room,
      date: tenant.date
    });
    setIsCheckInModalOpen(true);
  };

  const handleDeleteTenant = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้เช่านี้?')) {
      setTenants(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveTenant = () => {
    if (!formData.name || !formData.room) {
      alert('กรุณากรอกชื่อและเลือกห้องพัก');
      return;
    }

    if (editingTenant) {
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...t, ...formData } : t));
    } else {
      const newTenant = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        status: 'occupied'
      };
      setTenants(prev => [...prev, newTenant]);
    }
    setIsCheckInModalOpen(false);
  };

  const exportToCSV = () => {
    const dataToExport = reportData;
    const headers = ['Date', 'Time', 'Name', 'Phone', 'Room', 'Status'];
    const rows = dataToExport.map(item => [
      item.date,
      item.time,
      item.name,
      item.phone,
      item.room,
      item.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `resort_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const dataToExport = reportData;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Resort Suite Manager - Tenant Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Filters: Room Type: ${reportFilters.roomType}, Status: ${reportFilters.status}`, 14, 36);

    const tableColumn = ['Date', 'Time', 'Name', 'Phone', 'Room', 'Status'];
    const tableRows = dataToExport.map(item => [
      item.date,
      item.time,
      item.name,
      item.phone,
      item.room,
      item.status
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // Slate-900
      styles: { fontSize: 9 }
    });

    doc.save(`resort_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Compact & Minimalist */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:flex
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64 lg:w-24 bg-white border-r border-slate-100 flex flex-col shrink-0 transition-all duration-300 lg:hover:w-64 group/sidebar shadow-sm
      `}>
        <div className="p-6 flex flex-col items-center lg:group-hover/sidebar:items-start transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-[20px] flex items-center justify-center text-rose-500 shadow-[0_4px_0_0_#FFE4E6] active:translate-y-[2px] active:shadow-[0_2px_0_0_#FFE4E6] transition-all">
              <Home size={24} strokeWidth={2.5} />
            </div>
            <div className="lg:hidden lg:group-hover/sidebar:block opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-all duration-500">
              <h1 className="font-black text-slate-900 leading-tight whitespace-nowrap">รีสอร์ท สวีท</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-4 overflow-y-auto scrollbar-hide">
          <NavItem 
            icon={<LayoutDashboard size={22} />} 
            label="แดชบอร์ด" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            color="sky"
          />
          <NavItem 
            icon={<Home size={22} />} 
            label="จัดการห้องพัก" 
            active={activeTab === 'rooms'} 
            onClick={() => { setActiveTab('rooms'); setIsSidebarOpen(false); }} 
            color="rose"
          />
          <NavItem 
            icon={<Users size={22} />} 
            label="ผู้เช่า" 
            active={activeTab === 'tenants'} 
            onClick={() => { setActiveTab('tenants'); setIsSidebarOpen(false); }} 
            color="amber"
          />
          <NavItem 
            icon={<FileText size={22} />} 
            label="รายงาน" 
            active={activeTab === 'reports'} 
            onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} 
            color="emerald"
          />
          <NavItem 
            icon={<Settings size={22} />} 
            label="ตั้งค่า" 
            active={activeTab === 'settings'} 
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} 
            color="indigo"
          />
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button className="w-full flex items-center justify-center lg:group-hover/sidebar:justify-start gap-3 px-4 py-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all text-sm font-bold">
            <LogOut size={20} />
            <span className="lg:hidden lg:group-hover/sidebar:block">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FDFCFB]">
        {/* Header */}
        <header className="h-20 lg:h-24 bg-transparent flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4 lg:gap-6 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-white border border-slate-100 text-slate-400 rounded-xl shadow-sm"
            >
              <MoreVertical size={20} />
            </button>
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อผู้เช่า หรือ หมายเลขห้อง..." 
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-100 rounded-[24px] text-sm focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <button className="w-10 h-10 lg:w-12 lg:h-12 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 rounded-[15px] lg:rounded-[20px] transition-all relative flex items-center justify-center shadow-sm hover:shadow-md active:translate-y-[2px] active:shadow-none">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 lg:gap-4 pl-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-900">Admin User</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Super Admin</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-100 text-indigo-600 rounded-[15px] lg:rounded-[20px] flex items-center justify-center font-black text-sm shadow-[0_4px_0_0_#E0E7FF]">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 lg:space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                  <StatCard 
                    label="ห้องทั้งหมด" 
                    value={stats.totalRooms} 
                    icon={<Home size={22} />} 
                    color="sky" 
                    onClick={() => setActiveTab('rooms')}
                  />
                  <StatCard 
                    label="มีผู้เช่า" 
                    value={stats.occupied} 
                    icon={<CheckCircle2 size={22} />} 
                    color="rose" 
                    onClick={() => setActiveTab('tenants')}
                  />
                  <StatCard 
                    label="ห้องว่าง" 
                    value={stats.available} 
                    icon={<Plus size={22} />} 
                    color="amber" 
                    onClick={() => setActiveTab('rooms')}
                  />
                  <StatCard 
                    label="รายได้" 
                    value={`฿${(stats.revenue / 1000).toFixed(1)}k`} 
                    icon={<CreditCard size={22} />} 
                    color="emerald" 
                    onClick={() => setActiveTab('reports')}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  {/* Recent Check-ins */}
                  <div className="lg:col-span-2 bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-10">
                      <div>
                        <h3 className="text-xl lg:text-2xl font-black text-slate-900">การเช็คอินล่าสุด</h3>
                        <p className="text-xs lg:text-sm text-slate-400 mt-1 font-medium">ผู้เช่าที่เข้าพักล่าสุดในระบบ</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleOpenAddModal}
                          className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 text-white rounded-[18px] font-bold text-xs lg:text-sm shadow-[0_4px_0_0_#1e293b] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          เช็คอิน
                        </button>
                        <button 
                          onClick={() => setActiveTab('tenants')}
                          className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[15px] flex items-center justify-center transition-all"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {filteredData.slice(0, 4).map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => handleOpenEditModal(item)}
                          className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 font-black text-sm shadow-sm">
                              {item.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.date} • {item.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg">
                              {item.room}
                            </span>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Room Status Summary */}
                  <div className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 mb-6 lg:mb-8">สถานะห้องพัก</h3>
                    
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 lg:space-y-10">
                      <div className="relative w-40 h-40 lg:w-56 lg:h-56">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                          <circle 
                            cx="50" cy="50" r="40" fill="transparent" stroke="#F43F5E" strokeWidth="12" 
                            strokeDasharray={`${(stats.occupied / stats.totalRooms) * 251.2} 251.2`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-2xl lg:text-4xl font-black text-slate-900">{Math.round((stats.occupied / stats.totalRooms) * 100)}%</p>
                          <p className="text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Occupied</p>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-2 gap-3 lg:gap-4">
                        <div className="p-4 lg:p-5 bg-rose-50 rounded-[20px] lg:rounded-[24px] border border-rose-100/50">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                            <p className="text-[8px] lg:text-[10px] text-rose-400 font-bold uppercase tracking-widest">ไม่ว่าง</p>
                          </div>
                          <p className="text-xl lg:text-2xl font-black text-rose-600">{stats.occupied}</p>
                        </div>
                        <div className="p-4 lg:p-5 bg-slate-50 rounded-[20px] lg:rounded-[24px] border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                            <p className="text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest">ว่าง</p>
                          </div>
                          <p className="text-xl lg:text-2xl font-black text-slate-900">{stats.available}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleOpenAddModal}
                      className="w-full mt-8 lg:mt-10 py-4 bg-slate-900 text-white rounded-[20px] lg:rounded-[24px] font-bold text-sm shadow-[0_6px_0_0_#1e293b] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      เช็คอินใหม่
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'rooms' && (
              <motion.div
                key="rooms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">จัดการห้องพักทั้งหมด</h2>
                  <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                      ตัวกรอง
                    </button>
                    <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2">
                      <Plus size={18} />
                      เพิ่มห้องพัก
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                  {ROOM_LIST.map((room) => {
                    const isOccupied = tenants.some(d => d.room === room.id);
                    return (
                      <div key={room.id} className={`p-8 rounded-[32px] border transition-all group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md active:translate-y-[2px] active:shadow-none ${
                        isOccupied 
                          ? 'bg-white border-slate-100' 
                          : 'bg-emerald-50 border-emerald-100'
                      }`}>
                        <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 ${isOccupied ? 'bg-slate-50' : 'bg-emerald-100'}`}></div>
                        <div className="relative z-10">
                          <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center mb-6 transition-all ${
                            isOccupied ? 'bg-slate-100 text-slate-400' : 'bg-white text-emerald-500 shadow-[0_4px_0_0_#D1FAE5]'
                          }`}>
                            <Home size={24} />
                          </div>
                          <p className="text-2xl font-black text-slate-900">{room.id}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{room.type}</p>
                          
                          <div className="mt-6 flex items-center justify-between">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                              isOccupied ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white shadow-[0_2px_0_0_#059669]'
                            }`}>
                              {isOccupied ? 'Occupied' : 'Available'}
                            </span>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            
            {activeTab === 'tenants' && (
              <motion.div
                key="tenants"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">จัดการข้อมูลผู้เช่า</h2>
                    <p className="text-sm text-slate-400 mt-1">ดู แก้ไข และลบข้อมูลผู้เช่าทั้งหมดในระบบ</p>
                  </div>
                  <button 
                    onClick={handleOpenAddModal}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    <UserPlus size={18} />
                    เพิ่มผู้เช่าใหม่
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-full max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ หรือ ห้อง..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center mr-2">แสดงผล {filteredData.length} รายการ</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100">
                          <th className="px-6 py-4 font-bold">วันที่เข้าพัก</th>
                          <th className="px-6 py-4 font-bold">ชื่อ-นามสกุล</th>
                          <th className="px-6 py-4 font-bold">ห้อง</th>
                          <th className="px-6 py-4 font-bold">เบอร์โทรศัพท์</th>
                          <th className="px-6 py-4 font-bold text-right">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredData.map((item) => (
                          <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-900">{item.date}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{item.time} น.</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-sm">
                                  {item.name.charAt(0)}
                                </div>
                                <p className="text-sm font-bold text-slate-900">{item.name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-lg">
                                {item.room}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                              {item.phone}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="แก้ไข"
                                >
                                  <FileText size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTenant(item.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="ลบ"
                                >
                                  <AlertCircle size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredData.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <p className="text-slate-400 text-sm">ไม่พบข้อมูลผู้เช่าที่ค้นหา</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 lg:space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black text-slate-900">รายงานและการส่งออก</h2>
                    <p className="text-xs lg:text-sm text-slate-400 mt-1 font-medium">กรองข้อมูลและส่งออกรายงานในรูปแบบต่างๆ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                  {/* Filters */}
                  <div className="bg-white p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900">ตัวกรองข้อมูล</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ประเภทห้อง</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                          value={reportFilters.roomType}
                          onChange={(e) => setReportFilters({ ...reportFilters, roomType: e.target.value })}
                        >
                          <option value="all">ทั้งหมด</option>
                          <option value="Standard">Standard</option>
                          <option value="Deluxe">Deluxe</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">สถานะ</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                          value={reportFilters.status}
                          onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
                        >
                          <option value="all">ทั้งหมด</option>
                          <option value="occupied">มีผู้เช่า</option>
                          <option value="available">ว่าง</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-xs text-slate-400 font-medium">พบข้อมูลที่ตรงตามเงื่อนไข: <span className="text-slate-900 font-black">{reportData.length} รายการ</span></p>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <button 
                        onClick={exportToCSV}
                        className="flex flex-col items-center justify-center p-8 bg-white hover:bg-emerald-50 border border-slate-100 rounded-[32px] transition-all group shadow-sm hover:shadow-[0_8px_0_0_#D1FAE5] active:translate-y-[4px] active:shadow-none"
                      >
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[24px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-4">
                          <FileSpreadsheet size={32} />
                        </div>
                        <p className="font-black text-slate-900">ส่งออก CSV</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Excel / Sheets</p>
                      </button>

                      <button 
                        onClick={exportToPDF}
                        className="flex flex-col items-center justify-center p-8 bg-white hover:bg-rose-50 border border-slate-100 rounded-[32px] transition-all group shadow-sm hover:shadow-[0_8px_0_0_#FFE4E6] active:translate-y-[4px] active:shadow-none"
                      >
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-[24px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-4">
                          <FileIcon size={32} />
                        </div>
                        <p className="font-black text-slate-900">ส่งออก PDF</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Print / Send</p>
                      </button>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[32px] lg:rounded-[40px] text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
                      <h3 className="text-lg font-black mb-6 relative z-10">สรุปรายงาน</h3>
                      <div className="grid grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">จำนวนรายการ</p>
                          <p className="text-3xl font-black">{reportData.length}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">วันที่ออกรายงาน</p>
                          <p className="text-sm font-black">{new Date().toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Placeholder for other tabs */}
            {['settings'].includes(activeTab) && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[60vh] text-center"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                  <Clock size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">กำลังพัฒนาส่วนนี้</h3>
                <p className="text-slate-400 mt-2 max-w-xs mx-auto">ส่วนการจัดการ {activeTab === 'settings' ? 'ตั้งค่า' : ''} กำลังอยู่ในระหว่างการปรับปรุงดีไซน์ใหม่</p>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all"
                >
                  กลับหน้าแดชบอร์ด
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Check-in / Edit Modal */}
      <AnimatePresence>
        {isCheckInModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckInModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div>
                  <h3 className="text-3xl font-black text-slate-900">{editingTenant ? 'แก้ไขข้อมูล' : 'เช็คอินใหม่'}</h3>
                  <p className="text-sm text-slate-400 mt-1 font-medium">{editingTenant ? 'แก้ไขรายละเอียดของผู้เช่าในระบบ' : 'กรอกข้อมูลผู้เช่าเพื่อบันทึกลงในระบบ'}</p>
                </div>
                <button 
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[20px] transition-all"
                >
                  <Plus size={28} className="rotate-45" />
                </button>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                    <input 
                      type="text" 
                      placeholder="ระบุชื่อผู้เช่า" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-sm outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white transition-all font-bold" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                    <input 
                      type="text" 
                      placeholder="08x-xxx-xxxx" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-sm outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white transition-all font-bold" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หมายเลขห้อง</label>
                    <div className="relative">
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-sm outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white transition-all appearance-none font-bold"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      >
                        <option value="">เลือกห้องพัก</option>
                        {ROOM_LIST.filter(r => editingTenant?.room === r.id || !tenants.some(d => d.room === r.id)).map(r => (
                          <option key={r.id} value={r.id}>{r.id} - {r.type}</option>
                        ))}
                      </select>
                      <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-300 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่เช็คอิน</label>
                    <input 
                      type="date" 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-sm outline-none focus:ring-4 focus:ring-rose-500/5 focus:bg-white transition-all font-bold" 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleSaveTenant}
                    className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black text-sm shadow-[0_8px_0_0_#1e293b] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={20} />
                    {editingTenant ? 'บันทึกการแก้ไข' : 'ยืนยันการเช็คอิน'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, color = "sky" }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, color?: string }) {
  const colors: Record<string, string> = {
    sky: "bg-sky-50 text-sky-500 shadow-[0_6px_0_0_#E0F2FE] border-sky-100",
    rose: "bg-rose-50 text-rose-500 shadow-[0_6px_0_0_#FFE4E6] border-rose-100",
    amber: "bg-amber-50 text-amber-500 shadow-[0_6px_0_0_#FEF3C7] border-amber-100",
    emerald: "bg-emerald-50 text-emerald-500 shadow-[0_6px_0_0_#D1FAE5] border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-500 shadow-[0_6px_0_0_#E0E7FF] border-indigo-100",
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-center group-hover/sidebar:justify-start gap-4 px-4 py-4 rounded-[24px] text-left transition-all group relative ${
        active 
          ? `${colors[color]} font-black translate-y-[-4px] border` 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      } active:translate-y-[2px] active:shadow-none`}
    >
      <div className={`${active ? '' : 'text-slate-300 group-hover:text-slate-500'} transition-colors shrink-0`}>
        {icon}
      </div>
      <span className="text-sm hidden group-hover/sidebar:block font-black whitespace-nowrap">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-nav"
          className="ml-auto w-2.5 h-2.5 bg-current rounded-full hidden group-hover/sidebar:block shadow-sm"
        />
      )}
    </button>
  );
}

function StatCard({ label, value, icon, color = "sky", onClick }: { label: string, value: string | number, icon: React.ReactNode, color?: string, onClick?: () => void }) {
  const colors: Record<string, string> = {
    sky: "bg-sky-50 text-sky-600 shadow-[0_8px_0_0_#E0F2FE] border-sky-100",
    rose: "bg-rose-50 text-rose-600 shadow-[0_8px_0_0_#FFE4E6] border-rose-100",
    amber: "bg-amber-50 text-amber-600 shadow-[0_8px_0_0_#FEF3C7] border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 shadow-[0_8px_0_0_#D1FAE5] border-emerald-100",
  };

  return (
    <div 
      onClick={onClick}
      className={`p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] border transition-all group hover:translate-y-[-6px] active:translate-y-[2px] active:shadow-none cursor-pointer ${colors[color]}`}
    >
      <div className="flex items-center justify-between mb-4 lg:mb-8">
        <div className="w-10 h-10 lg:w-16 lg:h-16 bg-white rounded-[15px] lg:rounded-[24px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-[8px] lg:text-[10px] font-black bg-white/50 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full uppercase tracking-widest border border-white/50">Live</div>
      </div>
      <p className="text-current/60 text-[8px] lg:text-[10px] font-black uppercase tracking-widest ml-1">{label}</p>
      <p className="text-xl lg:text-4xl font-black mt-1 lg:mt-2 text-slate-900">{value}</p>
    </div>
  );
}
