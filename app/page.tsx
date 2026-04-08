'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Home, Users, FileText, Settings, Plus, Search, Bell,
  MoreVertical, ChevronRight, LogOut, UserPlus, CreditCard, AlertCircle,
  CheckCircle2, Clock, Download, FileSpreadsheet, File as FileIcon, Menu, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================
// API Configuration — แก้ URL นี้ให้ตรงกับ backend ของคุณ
// ============================================================
const DEFAULT_API_URL = 'https://your-api-domain.com';

function getApiUrl(): string {
  try {
    return localStorage.getItem('resort_api_url') || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  } catch {
    return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  }
}

// ============================================================
// Types
// ============================================================
interface Tenant {
  id: number;
  name: string;
  phone: string;
  room: string;
  date: string;
  time: string;
  status: string;
}

interface Room {
  id: number;
  room_id: string;
  room_type: string;
  price: number;
  status: string;
}

// ============================================================
// API Helpers
// ============================================================
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getApiUrl()}/api/v1${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchTenants(search?: string): Promise<Tenant[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await apiFetch<{ items: Tenant[] }>(`/tenants/${q}`);
  return data.items;
}

async function fetchRooms(): Promise<Room[]> {
  const data = await apiFetch<{ items: Room[] }>('/rooms/');
  return data.items;
}

async function createTenant(data: Omit<Tenant, 'id'>): Promise<Tenant> {
  return apiFetch('/tenants/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant> {
  return apiFetch(`/tenants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function deleteTenant(id: number): Promise<void> {
  await apiFetch(`/tenants/${id}`, { method: 'DELETE' });
}

async function seedData(): Promise<void> {
  await apiFetch('/tenants/seed', { method: 'POST' });
  await apiFetch('/rooms/seed', { method: 'POST' });
}

// ============================================================
// Main App
// ============================================================
export default function ResortApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reportFilters, setReportFilters] = useState({ startDate: '', endDate: '', roomType: 'all', status: 'all' });
  const [formData, setFormData] = useState({ name: '', phone: '', room: '', date: new Date().toISOString().split('T')[0] });
  const [apiUrlInput, setApiUrlInput] = useState(DEFAULT_API_URL);
  const [apiConnected, setApiConnected] = useState(false);

  // Load data from API
  const loadData = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const [tenantsData, roomsData] = await Promise.all([
        fetchTenants(search),
        fetchRooms(),
      ]);
      setTenants(tenantsData);
      setRooms(roomsData);
      setApiConnected(true);
    } catch (e) {
      console.error('Failed to load data from API:', e);
      setApiConnected(false);
      // Fallback: try seeding then reload
      try {
        await seedData();
        const [t, r] = await Promise.all([fetchTenants(search), fetchRooms()]);
        setTenants(t);
        setRooms(r);
        setApiConnected(true);
      } catch {
        // Offline mode — use empty data
        setTenants([]);
        setRooms([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    try {
      const saved = localStorage.getItem('resort_api_url');
      if (saved) setApiUrlInput(saved);
    } catch {}
  }, [loadData]);

  useEffect(() => {
    loadData(searchQuery);
  }, [searchQuery, loadData]);

  const filteredData = useMemo(() => {
    return tenants.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tenants]);

  const reportData = useMemo(() => {
    return tenants.filter(item => {
      const matchesRoomType = reportFilters.roomType === 'all' ||
        rooms.find(r => r.room_id === item.room)?.room_type === reportFilters.roomType;
      const matchesStatus = reportFilters.status === 'all' || item.status === reportFilters.status;
      return matchesRoomType && matchesStatus;
    });
  }, [tenants, reportFilters, rooms]);

  const stats = {
    totalRooms: rooms.length || 11,
    occupied: tenants.length,
    available: (rooms.length || 11) - tenants.length,
    revenue: tenants.length * 4000,
  };

  const handleOpenAddModal = () => {
    setEditingTenant(null);
    setFormData({ name: '', phone: '', room: '', date: new Date().toISOString().split('T')[0] });
    setIsCheckInModalOpen(true);
  };

  const handleOpenEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({ name: tenant.name, phone: tenant.phone, room: tenant.room, date: tenant.date });
    setIsCheckInModalOpen(true);
  };

  const handleDeleteTenant = async (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้เช่านี้?')) {
      try {
        await deleteTenant(id);
        loadData(searchQuery);
      } catch (e) {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  const handleSaveTenant = async () => {
    if (!formData.name || !formData.room) {
      alert('กรุณากรอกชื่อและเลือกห้องพัก');
      return;
    }
    try {
      const now = new Date();
      if (editingTenant) {
        await updateTenant(editingTenant.id, { ...formData, time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) });
      } else {
        await createTenant({
          ...formData,
          time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          status: 'occupied',
        });
      }
      loadData(searchQuery);
      setIsCheckInModalOpen(false);
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleSaveApiUrl = () => {
    try {
      localStorage.setItem('resort_api_url', apiUrlInput);
      alert('บันทึก URL สำเร็จ — กำลังโหลดใหม่...');
      window.location.reload();
    } catch {
      alert('ไม่สามารถบันทึก URL ได้');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Name', 'Phone', 'Room', 'Status'];
    const rows = reportData.map(item => [item.date, item.time, item.name, item.phone, item.room, item.status]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `resort_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Resort Suite Manager - Tenant Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      head: [['Date', 'Time', 'Name', 'Phone', 'Room', 'Status']],
      body: reportData.map(item => [item.date, item.time, item.name, item.phone, item.room, item.status]),
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9 },
    });
    doc.save(`resort_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const ROOM_LIST: { id: string; type: string; price: number }[] =
    rooms.length > 0
      ? rooms.map(r => ({ id: r.room_id, type: r.room_type, price: r.price }))
      : [
          { id: 'A101', type: 'Standard', price: 3500 }, { id: 'A102', type: 'Standard', price: 3500 },
          { id: 'A103', type: 'Standard', price: 3500 }, { id: 'A104', type: 'Standard', price: 3500 },
          { id: 'B104', type: 'Deluxe', price: 4500 }, { id: 'B106', type: 'Deluxe', price: 4500 },
          { id: 'B107', type: 'Deluxe', price: 4500 }, { id: 'B108', type: 'Deluxe', price: 4500 },
          { id: 'B109', type: 'Deluxe', price: 4500 }, { id: 'B110', type: 'Deluxe', price: 4500 },
          { id: 'N3', type: 'Standard', price: 3000 },
        ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] lg:hidden" />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }} animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed lg:static inset-y-0 left-0 z-[70] w-[280px] lg:w-[80px] bg-white border-r border-slate-100 shadow-sm flex flex-col overflow-hidden"
      >
        <div className="p-5 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Home size={20} />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900">รีสอร์ท สวีท</h1>
              <p className="text-xs text-slate-400">Management</p>
            </div>
          </div>
          {isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-2 right-2 p-1.5 lg:hidden text-slate-400 hover:text-rose-500 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={18} />} label="แดชบอร์ด" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} color="sky" isExpanded={isSidebarOpen} />
          <NavItem icon={<Home size={18} />} label="จัดการห้องพัก" active={activeTab === 'rooms'} onClick={() => { setActiveTab('rooms'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} color="rose" isExpanded={isSidebarOpen} />
          <NavItem icon={<Users size={18} />} label="ผู้เช่า" active={activeTab === 'tenants'} onClick={() => { setActiveTab('tenants'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} color="amber" isExpanded={isSidebarOpen} />
          <NavItem icon={<FileText size={18} />} label="รายงาน" active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} color="emerald" isExpanded={isSidebarOpen} />
          <NavItem icon={<Settings size={18} />} label="ตั้งค่า" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} color="indigo" isExpanded={isSidebarOpen} />
        </nav>

        <div className="p-3 border-t border-slate-50">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[18px] transition-all">
            <LogOut size={18} />
            {isSidebarOpen && <span className="font-medium text-sm">ออก</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 bg-white border border-slate-100 text-slate-400 rounded-lg shadow-sm active:scale-95 transition-transform">
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาชื่อหรือห้องพัก..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 bg-white border border-slate-100 text-slate-400 rounded-xl shadow-sm hover:text-sky-500 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-100">
              <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md">AD</div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-800">Admin</p>
                <p className="text-xs text-slate-400">Super</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Room Status Summary */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <h2 className="font-bold text-lg mb-4">สถานะห้องพัก</h2>
                <div className="flex items-center gap-8">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray={`${Math.round((stats.occupied / stats.totalRooms) * 100)}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round((stats.occupied / stats.totalRooms) * 100)}%</span>
                      <span className="text-xs text-slate-400">ไม่ว่าง</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3"><span className="w-3 h-3 bg-sky-500 rounded-full" /><span className="text-sm">ไม่ว่าง</span><span className="font-bold text-lg">{stats.occupied}</span></div>
                    <div className="flex items-center gap-3"><span className="w-3 h-3 bg-slate-200 rounded-full" /><span className="text-sm">ว่าง</span><span className="font-bold text-lg">{stats.available}</span></div>
                  </div>
                </div>
              </div>

              {/* Recent Check-ins */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-lg">การเช็คอินล่าสุด</h2>
                    <p className="text-sm text-slate-400">ผู้เช่าที่เข้าพักล่าสุด</p>
                  </div>
                  <button onClick={() => setActiveTab('tenants')} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl flex items-center justify-center transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="space-y-2">
                  {filteredData.slice(0, 4).map((item) => (
                    <div key={item.id} onClick={() => handleOpenEditModal(item as Tenant)} className="flex items-center justify-between p-2 lg:p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center font-bold text-sm">{item.name.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.room} • {item.time}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-sky-50 text-sky-600 px-2.5 py-1 rounded-lg font-medium">Checked in</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="รายได้" value={`฿${(stats.revenue / 1000).toFixed(1)}k`} icon={<CreditCard size={18} />} color="sky" onClick={() => setActiveTab('reports')} />
                <StatCard label="ผู้เช่า" value={stats.occupied} icon={<Users size={18} />} color="rose" onClick={() => setActiveTab('tenants')} />
                <StatCard label="ห้องว่าง" value={stats.available} icon={<Home size={18} />} color="amber" onClick={() => setActiveTab('rooms')} />
                <StatCard label="รายได้รวม" value={`฿${(stats.revenue / 1000).toFixed(1)}k`} icon={<FileSpreadsheet size={18} />} color="emerald" onClick={() => setActiveTab('reports')} />
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div><h2 className="font-bold text-2xl">จัดการห้องพักทั้งหมด</h2><p className="text-sm text-slate-400 mt-1">ดูสถานะของห้องพักทั้งหมด</p></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium">ทั้งหมด</button><button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm">Standard</button><button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm">Deluxe</button></div>
                <button onClick={handleOpenAddModal} className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-medium flex items-center gap-2"><Plus size={16} /> เพิ่มห้องพัก</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ROOM_LIST.map((room) => {
                  const isOccupied = tenants.some(d => d.room === room.id);
                  return (
                    <div key={room.id} className={`bg-white rounded-2xl border p-4 transition-all ${isOccupied ? 'border-rose-100 shadow-sm' : 'border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg">{room.id}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{room.type}</p>
                      <p className={`text-sm font-medium ${isOccupied ? 'text-rose-600' : 'text-emerald-600'}`}>{isOccupied ? 'Occupied' : 'Available'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div><h2 className="font-bold text-2xl">จัดการข้อมูลผู้เช่า</h2><p className="text-sm text-slate-400 mt-1">ดู แก้ไข และลบข้อมูลผู้เช่าทั้งหมด</p></div>
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button onClick={handleOpenAddModal} className="px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 justify-center"><Plus size={16} /> เช็คอินใหม่</button>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาผู้เช่า..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">วันที่เข้าพัก</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ชื่อ-นามสกุล</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ห้อง</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">เบอร์โทรศัพท์</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">การจัดการ</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3"><p className="text-sm font-medium">{item.date}</p><p className="text-xs text-slate-400">{item.time} น.</p></td>
                          <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center font-bold text-xs">{item.name.charAt(0)}</div><p className="text-sm font-semibold">{item.name}</p></div></td>
                          <td className="px-4 py-3"><span className="text-sm font-medium bg-slate-100 px-2.5 py-1 rounded-lg">{item.room}</span></td>
                          <td className="px-4 py-3"><p className="text-sm text-slate-600">{item.phone}</p></td>
                          <td className="px-4 py-3"><div className="flex items-center gap-1">
                            <button onClick={() => handleOpenEditModal(item as Tenant)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="แก้ไข">✏️</button>
                            <button onClick={() => handleDeleteTenant(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="ลบ">🗑️</button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredData.length === 0 && (<div className="text-center py-12"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Users size={24} className="text-slate-400" /></div><p className="text-slate-500 font-medium">ไม่พบข้อมูลผู้เช่าที่ค้นหา</p></div>)}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Summary Report */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white"><p className="text-sm text-sky-100 mb-1">จำนวนรายการ</p><p className="text-3xl font-bold">{reportData.length}</p></div>
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white"><p className="text-sm text-emerald-100 mb-1">รายได้รวม</p><p className="text-3xl font-bold">฿{(reportData.length * 4000 / 1000).toFixed(1)}k</p></div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5"><p className="text-sm text-slate-400 mb-1">วันที่ออกรายงาน</p><p className="text-xl font-bold">{new Date().toLocaleDateString('th-TH')}</p></div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-base mb-4">ตัวกรองข้อมูล</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div><label className="text-xs text-slate-400 mb-1 block">เริ่มวันที่</label><input type="date" value={reportFilters.startDate} onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })} className="w-full px-3 py-2 border border-slate-100 rounded-xl text-sm" /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">ถึงวันที่</label><input type="date" value={reportFilters.endDate} onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })} className="w-full px-3 py-2 border border-slate-100 rounded-xl text-sm" /></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">ประเภทห้อง</label><select value={reportFilters.roomType} onChange={(e) => setReportFilters({ ...reportFilters, roomType: e.target.value })} className="w-full px-3 py-2 border border-slate-100 rounded-xl text-sm"><option value="all">ทั้งหมด</option><option value="Standard">Standard</option><option value="Deluxe">Deluxe</option></select></div>
                  <div><label className="text-xs text-slate-400 mb-1 block">สถานะ</label><select value={reportFilters.status} onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })} className="w-full px-3 py-2 border border-slate-100 rounded-xl text-sm"><option value="all">ทั้งหมด</option><option value="occupied">มีผู้เช่า</option><option value="available">ว่าง</option></select></div>
                </div>
              </div>

              {/* Export */}
              <div className="flex flex-wrap gap-3">
                <button onClick={exportToCSV} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-50"><Download size={16} /> ส่งออก CSV</button>
                <button onClick={exportToPDF} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800"><Download size={16} /> ส่งออก PDF</button>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-50"><p className="text-sm text-slate-400">พบ {reportData.length} รายการ</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full"><thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">วันที่</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ชื่อ</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ห้อง</th><th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">สถานะ</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {reportData.map((item) => (<tr key={item.id} className="hover:bg-slate-50/50"><td className="px-4 py-3 text-sm">{item.date}</td><td className="px-4 py-3 text-sm font-medium">{item.name}</td><td className="px-4 py-3 text-sm">{item.room}</td><td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-lg font-medium ${item.status === 'occupied' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.status}</span></td></tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div><h2 className="font-bold text-2xl">ตั้งค่า</h2><p className="text-sm text-slate-400 mt-1">จัดการการตั้งค่าระบบ</p></div>

              {/* API Connection */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-bold text-base mb-1">🌐 เชื่อมต่อ API Backend</h3>
                <p className="text-sm text-slate-400 mb-4">URL ของ FastAPI backend ที่ให้บริการข้อมูล</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={apiUrlInput}
                    onChange={(e) => setApiUrlInput(e.target.value)}
                    placeholder="https://your-api.com"
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <button onClick={handleSaveApiUrl} className="px-6 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors">บันทึก URL</button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${apiConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-sm text-slate-500">{apiConnected ? 'เชื่อมต่อสำเร็จ' : 'ยังไม่เชื่อมต่อ — ตรวจสอบ URL'}</span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-bold text-base mb-1">ℹ️ เกี่ยวกับระบบ</h3>
                <p className="text-sm text-slate-400">Resort Manager v1.0 — ระบบจัดการห้องพัก</p>
                <p className="text-sm text-slate-400">Backend: FastAPI + SQLAlchemy</p>
              </div>

              <button onClick={() => setActiveTab('dashboard')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all">กลับหน้าแดชบอร์ด</button>
            </div>
          )}
        </main>
      </div>

      {/* Check-in / Edit Modal */}
      <AnimatePresence>
        {isCheckInModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div onClick={() => setIsCheckInModalOpen(false)} className="absolute inset-0" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-sky-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingTenant ? 'แก้ไขข้อมูล' : 'เช็คอินใหม่'}</h2>
                    <p className="text-sm text-sky-100 mt-1">{editingTenant ? 'แก้ไขรายละเอียดของผู้เช่าในระบบ' : 'กรอกข้อมูลผู้เช่าเพื่อบันทึกลงในระบบ'}</p>
                  </div>
                  <button onClick={() => setIsCheckInModalOpen(false)} className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-[20px] transition-all"><X size={20} /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="text-sm font-medium text-slate-600 mb-1 block">ชื่อ-นามสกุล</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" placeholder="ชื่อ-นามสกุล" /></div>
                <div><label className="text-sm font-medium text-slate-600 mb-1 block">เบอร์โทรศัพท์</label><input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" placeholder="0xx-xxx-xxxx" /></div>
                <div><label className="text-sm font-medium text-slate-600 mb-1 block">หมายเลขห้อง</label><select value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500">
                  <option value="">เลือกห้องพัก</option>
                  {ROOM_LIST.filter(r => editingTenant?.room === r.id || !tenants.some(d => d.room === r.id)).map(r => (<option key={r.id} value={r.id}>{r.id} - {r.type}</option>))}
                </select></div>
                <div><label className="text-sm font-medium text-slate-600 mb-1 block">วันที่เช็คอิน</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" /></div>
              </div>
              <div className="p-6 pt-0"><button onClick={handleSaveTenant} className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-[20px] font-bold text-sm shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 active:scale-[0.98] transition-all">{editingTenant ? 'บันทึกการแก้ไข' : 'ยืนยันการเช็คอิน'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// NavItem Component
// ============================================================
function NavItem({ icon, label, active, onClick, color = "sky", isExpanded }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; color?: string; isExpanded?: boolean }) {
  const colors: Record<string, string> = {
    sky: "bg-sky-50 text-sky-500 shadow-[0_3px_0_0_#E0F2FE] border-sky-100",
    rose: "bg-rose-50 text-rose-500 shadow-[0_3px_0_0_#FFE4E6] border-rose-100",
    amber: "bg-amber-50 text-amber-500 shadow-[0_3px_0_0_#FEF3C7] border-amber-100",
    emerald: "bg-emerald-50 text-emerald-500 shadow-[0_3px_0_0_#D1FAE5] border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-500 shadow-[0_3px_0_0_#E0E7FF] border-indigo-100",
  };
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-[18px] border transition-all ${active ? `${colors[color]} shadow-sm font-semibold` : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
      {icon}
      {isExpanded && <span className="text-sm">{label}</span>}
      {!isExpanded && active && <span className="w-1.5 h-1.5 bg-current rounded-full ml-auto" />}
    </button>
  );
}

// ============================================================
// StatCard Component
// ============================================================
function StatCard({ label, value, icon, color = "sky", onClick }: { label: string; value: string | number; icon: React.ReactNode; color?: string; onClick?: () => void }) {
  const colors: Record<string, string> = {
    sky: "bg-sky-50 text-sky-600 shadow-[0_4px_0_0_#E0F2FE] border-sky-100",
    rose: "bg-rose-50 text-rose-600 shadow-[0_4px_0_0_#FFE4E6] border-rose-100",
    amber: "bg-amber-50 text-amber-600 shadow-[0_4px_0_0_#FEF3C7] border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 shadow-[0_4px_0_0_#D1FAE5] border-emerald-100",
  };
  return (
    <div onClick={onClick} className={`${colors[color]} border rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform`}>
      <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-slate-400">{label}</span><span className="text-xs px-2 py-0.5 bg-white/70 rounded-md font-medium">Live</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
