'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Home, Users, FileText, Settings, Plus, Search,
  Bell, LogOut, CreditCard, Download, Menu, X, TrendingUp,
  CheckCircle, ChevronRight, Edit3, Trash2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================
// การตั้งค่า API
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
// ประเภทข้อมูล
// ============================================================
interface Tenant {
  id: number | string;
  name: string;
  phone: string;
  room: string;
  date: string;
  time: string;
  status: string;
}

interface Room {
  id: number | string;
  room_id: string;
  room_type: string;
  price: number;
  status: string;
}

// ============================================================
// ฟังก์ชันเรียก API
// ============================================================
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getApiUrl()}/api/v1${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ผิดพลาด: ${res.status}`);
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
  return apiFetch('/tenants/', { method: 'POST', body: JSON.stringify(data) });
}

async function updateTenant(id: number | string, data: Partial<Tenant>): Promise<Tenant> {
  return apiFetch(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

async function deleteTenant(id: number | string): Promise<void> {
  await apiFetch(`/tenants/${id}`, { method: 'DELETE' });
}

async function seedData(): Promise<void> {
  await apiFetch('/tenants/seed', { method: 'POST' });
  await apiFetch('/rooms/seed', { method: 'POST' });
}

// ============================================================
// แอพหลัก
// ============================================================
export default function ResortApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [reportFilters, setReportFilters] = useState({ startDate: '', endDate: '', roomType: 'all', status: 'all' });
  const [formData, setFormData] = useState({ name: '', phone: '', room: '', date: new Date().toISOString().split('T')[0] });
  const [apiUrlInput, setApiUrlInput] = useState(DEFAULT_API_URL);
  const [apiConnected, setApiConnected] = useState(false);

  const ROOM_LIST = useMemo(() =>
    rooms.length > 0
      ? rooms.map(r => ({ id: r.room_id, building: r.building || '', type: r.room_type, price: r.price, status_label: r.status_label || '' }))
      : [
          { id: 'A101', building: 'A1', type: 'Standard', price: 400, status_label: '' },
          { id: 'A102', building: 'A1', type: 'Standard', price: 400, status_label: '' },
          { id: 'A103', building: 'A1', type: 'Standard', price: 400, status_label: '' },
          { id: 'A104', building: 'A1', type: 'Standard', price: 400, status_label: '' },
          { id: 'A105', building: 'A1', type: 'Standard', price: 400, status_label: '' },
          { id: 'A106', building: 'A1', type: 'Standard Twin', price: 500, status_label: '' },
          { id: 'A107', building: 'A1', type: 'Standard Twin', price: 500, status_label: '' },
          { id: 'A108', building: 'A1', type: 'Standard Twin', price: 500, status_label: '' },
          { id: 'A109', building: 'A1', type: 'Standard Twin', price: 500, status_label: '' },
          { id: 'A110', building: 'A1', type: 'Standard Twin', price: 500, status_label: '' },
          { id: 'A111', building: 'A1', type: 'Standard', price: 400, status_label: '' },
          { id: 'A201', building: 'A2', type: 'Standard', price: 400, status_label: 'ปิดปรับปรุง' },
          { id: 'A202', building: 'A2', type: 'Standard', price: 400, status_label: '' },
          { id: 'A203', building: 'A2', type: 'Standard', price: 400, status_label: '' },
          { id: 'A204', building: 'A2', type: 'Standard', price: 3500, status_label: 'รายเดือน' },
          { id: 'A205', building: 'A2', type: 'Standard', price: 3500, status_label: 'รายเดือน' },
          { id: 'A206', building: 'A2', type: 'Standard', price: 3500, status_label: 'รายเดือน' },
          { id: 'A207', building: 'A2', type: 'Standard', price: 400, status_label: '' },
          { id: 'A208', building: 'A2', type: 'Standard', price: 3500, status_label: 'รายเดือน' },
          { id: 'A209', building: 'A2', type: 'Standard', price: 400, status_label: '' },
          { id: 'A210', building: 'A2', type: 'Standard', price: 400, status_label: '' },
          { id: 'A211', building: 'A2', type: 'Standard', price: 3500, status_label: 'รายเดือน' },
          { id: 'B101', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B102', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B103', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B104', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B105', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B106', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B107', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B108', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B109', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B110', building: 'B1', type: 'Standard', price: 400, status_label: '' },
          { id: 'B111', building: 'B1', type: 'Standard Twin', price: 500, status_label: '' },
          { id: 'B201', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B202', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B203', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B204', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B205', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B206', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B207', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B208', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B209', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B210', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'B211', building: 'B2', type: 'Standard', price: 400, status_label: '' },
          { id: 'N1', building: 'N1', type: 'Standard Twin', price: 600, status_label: '' },
          { id: 'N2', building: 'N1', type: 'Standard', price: 500, status_label: '' },
          { id: 'N3', building: 'N1', type: 'Standard', price: 500, status_label: '' },
          { id: 'N4', building: 'N1', type: 'Standard Twin', price: 600, status_label: '' },
          { id: 'N5', building: 'N1', type: 'Standard Twin', price: 600, status_label: '' },
          { id: 'N6', building: 'N1', type: 'Standard Twin', price: 600, status_label: '' },
          { id: 'N7', building: 'N1', type: 'Standard', price: 500, status_label: '' },
        ], [rooms]);

  const loadData = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const [tenantsData, roomsData] = await Promise.all([fetchTenants(search), fetchRooms()]);
      setTenants(tenantsData);
      setRooms(roomsData);
      setApiConnected(true);
    } catch {
      try {
        await seedData();
        const [t, r] = await Promise.all([fetchTenants(search), fetchRooms()]);
        setTenants(t);
        setRooms(r);
        setApiConnected(true);
      } catch {
        setTenants([]);
        setRooms([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadData(searchQuery); }, [searchQuery, loadData]);

  const filteredData = useMemo(() =>
    tenants.filter(item =>
      item.name.includes(searchQuery) || item.room.includes(searchQuery)
    ), [searchQuery, tenants]);

  const reportData = useMemo(() =>
    tenants.filter(item => {
      const matchesRoomType = reportFilters.roomType === 'all' ||
        ROOM_LIST.find(r => r.id === item.room)?.type === reportFilters.roomType;
      const matchesStatus = reportFilters.status === 'all' || item.status === reportFilters.status;
      return matchesRoomType && matchesStatus;
    }), [tenants, reportFilters, ROOM_LIST]);

  const stats = {
    totalRooms: ROOM_LIST.length,
    occupied: tenants.length,
    available: ROOM_LIST.length - tenants.length,
    revenue: tenants.length * 4000,
  };

  const handleSaveTenant = async () => {
    if (!formData.name || !formData.room) { alert('กรุณากรอกชื่อและเลือกห้องพัก'); return; }
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      if (editingTenant) {
        await updateTenant(editingTenant.id, { ...formData, time: timeStr });
      } else {
        await createTenant({ ...formData, time: timeStr, status: 'checked_in' });
      }
      loadData(searchQuery);
      setIsCheckInModalOpen(false);
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDeleteTenant = async (id: number | string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้เช่านี้?')) {
      try { await deleteTenant(id); loadData(searchQuery); } catch { alert('เกิดข้อผิดพลาดในการลบข้อมูล'); }
    }
  };

  const handleSaveApiUrl = () => {
    try {
      localStorage.setItem('resort_api_url', apiUrlInput);
      alert('บันทึก URL สำเร็จ');
      window.location.reload();
    } catch { alert('ไม่สามารถบันทึก URL ได้'); }
  };

  const exportToCSV = () => {
    const headers = ['วันที่', 'เวลา', 'ชื่อ', 'เบอร์โทร', 'ห้อง', 'สถานะ'];
    const rows = reportData.map(i => [i.date, i.time, i.name, i.phone, i.room, i.status === 'occupied' ? 'มีผู้เช่า' : 'ว่าง']);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `รายงานผู้เช่า_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ระบบจัดการรีสอร์ท - รายงานผู้เช่า', 14, 22);
    autoTable(doc, {
      head: [['วันที่', 'เวลา', 'ชื่อ', 'เบอร์โทร', 'ห้อง', 'สถานะ']],
      body: reportData.map(i => [i.date, i.time, i.name, i.phone, i.room, i.status === 'occupied' ? 'มีผู้เช่า' : 'ว่าง']),
      startY: 35, theme: 'grid', headStyles: { fillColor: [15, 23, 42] }, styles: { fontSize: 9 },
    });
    doc.save(`รายงานผู้เช่า_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#e8e8e8] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // แสดงผล — โทนสีเดียวกัน (เทาเข้ม/ม่วงอ่อน)
  // ============================================================
  return (
    <div className="flex h-screen bg-[#d4d4d4]">
      {/* ===== แถบด้านข้าง — โทนเทาเข้ม ===== */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 72 }}
        className="bg-[#2c2c2c] text-white flex flex-col overflow-hidden relative"
      >
        {/* โลโก้ */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-[#3a3a3a]">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <Home size={20} />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="font-bold text-base">รีสอร์ท สวีท</h1>
                <p className="text-xs text-gray-400">ระบบจัดการ</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* เมนูหลัก */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { key: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
            { key: 'rooms', label: 'ห้องพัก', icon: Home },
            { key: 'tenants', label: 'ผู้เช่า', icon: Users },
            { key: 'reports', label: 'รายงาน', icon: FileText },
            { key: 'settings', label: 'ตั้งค่า', icon: Settings },
          ].map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-slate-600 shadow-lg' : 'hover:bg-[#3a3a3a] text-gray-400'}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {isSidebarOpen && <span className="text-sm font-medium">{label}</span>}
                {!isSidebarOpen && isActive && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* ย่อ/ขยาย + ออกจากระบบ */}
        <div className="p-3 border-t border-[#3a3a3a] space-y-1">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#3a3a3a] text-gray-400 transition-all">
            <Menu size={20} className="flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">ย่อ/ขยาย</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-900/30 text-gray-400 hover:text-rose-400 transition-all">
            <LogOut size={20} className="flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">ออกจากระบบ</span>}
          </button>
        </div>
      </motion.aside>

      {/* ===== ส่วนหลัก ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* แถบบนสุด */}
        <header className="bg-[#f0f0f0]/80 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {activeTab === 'dashboard' && 'ภาพรวม'}
              {activeTab === 'rooms' && 'จัดการห้องพัก'}
              {activeTab === 'tenants' && 'ข้อมูลผู้เช่า'}
              {activeTab === 'reports' && 'รายงาน'}
              {activeTab === 'settings' && 'ตั้งค่า'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {activeTab === 'dashboard' && 'สรุปข้อมูลภาพรวมวันนี้'}
              {activeTab === 'rooms' && 'สถานะห้องพักทั้งหมด'}
              {activeTab === 'tenants' && 'รายชื่อผู้เช่าทั้งหมด'}
              {activeTab === 'reports' && 'รายงานและส่งออกข้อมูล'}
              {activeTab === 'settings' && 'จัดการการตั้งค่าระบบ'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อหรือห้องพัก..."
                className="pl-10 pr-4 py-2 bg-white/60 backdrop-blur border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
              />
            </div>
            <button className="relative p-2 bg-white/60 backdrop-blur border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-slate-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center text-white text-xs font-bold">แอด</div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">ผู้ดูแลระบบ</p>
                <p className="text-xs text-gray-400">สิทธิ์เต็ม</p>
              </div>
            </div>
          </div>
        </header>

        {/* เนื้อหา */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* ===== ภาพรวม ===== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* การ์ดสถิติ — โทนเดียวกัน */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'ห้องพักทั้งหมด', value: stats.totalRooms, icon: Home },
                  { label: 'มีผู้เช่า', value: stats.occupied, icon: CheckCircle },
                  { label: 'ห้องว่าง', value: stats.available, icon: TrendingUp },
                  { label: 'รายได้รวม', value: `฿${(stats.revenue / 1000).toFixed(1)}k`, icon: CreditCard },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Icon size={18} />
                      </span>
                      <span className="text-xs font-medium text-gray-400 bg-white/60 px-2.5 py-1 rounded-lg">เรียลไทม์</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* กราฟอัตราการเข้าพัก */}
                <div className="bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">อัตราการเข้าพัก</h3>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#64748b" strokeWidth="3" strokeDasharray={`${Math.round((stats.occupied / stats.totalRooms) * 100)}, 100`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900">{Math.round((stats.occupied / stats.totalRooms) * 100)}%</span>
                        <span className="text-xs text-gray-400">เข้าพัก</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-600 rounded-full" /><span className="text-sm text-gray-500">มีผู้เช่า</span></div><span className="font-bold">{stats.occupied}</span></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-300 rounded-full" /><span className="text-sm text-gray-500">ว่าง</span></div><span className="font-bold">{stats.available}</span></div>
                  </div>
                </div>

                {/* ผู้เช่าล่าสุด */}
                <div className="lg:col-span-2 bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">ผู้เช่าล่าสุด</h3>
                      <p className="text-sm text-gray-400">รายชื่อผู้เข้าพักล่าสุด</p>
                    </div>
                    <button onClick={() => setActiveTab('tenants')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-700 font-medium">
                      ดูทั้งหมด <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {filteredData.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur rounded-xl hover:bg-white/80 transition-colors cursor-pointer" onClick={() => { setEditingTenant(item); setIsCheckInModalOpen(true); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">{item.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.room} • {item.time} น.</p>
                          </div>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-medium">เช็คอินแล้ว</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== ห้องพัก ===== */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <button className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-medium">ทั้งหมด</button>
                  <button className="px-4 py-2 bg-white/60 backdrop-blur border border-gray-200 text-gray-600 rounded-xl text-sm">Standard</button>
                  <button className="px-4 py-2 bg-white/60 backdrop-blur border border-gray-200 text-gray-600 rounded-xl text-sm">Standard Twin</button>
                  <button className="px-4 py-2 bg-white/60 backdrop-blur border border-gray-200 text-gray-600 rounded-xl text-sm">รายเดือน</button>
                </div>
                <button onClick={() => { setEditingTenant(null); setFormData({ name: '', phone: '', room: '', date: new Date().toISOString().split('T')[0] }); setIsCheckInModalOpen(true); }} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors">
                  <Plus size={16} /> เช็คอิน
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {ROOM_LIST.map(room => {
                  const isOccupied = tenants.some(d => d.room === room.id);
                  const isMaintenance = room.status_label === 'ปิดปรับปรุง';
                  const isMonthly = room.status_label === 'รายเดือน';
                  return (
                    <div key={room.id} className={`bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border p-4 transition-all hover:shadow-md ${isMaintenance ? 'border-amber-300 bg-amber-50/50 opacity-60' : isOccupied ? 'border-slate-300 bg-slate-100/50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-gray-900">{room.id}</span>
                        <span className={`w-3 h-3 rounded-full ${isMaintenance ? 'bg-amber-400' : isOccupied ? 'bg-slate-500' : 'bg-emerald-400'}`} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">อาคาร {room.building}</p>
                        <p className="text-xs text-gray-500">{room.type}</p>
                        {isMaintenance && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-medium">ปิดปรับปรุง</span>
                        )}
                        {isMonthly && !isOccupied && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">รายเดือน</span>
                        )}
                        {!isMaintenance && (
                          <div className="flex items-center justify-between pt-1">
                            <span className={`text-xs font-medium ${isOccupied ? 'text-slate-600' : 'text-emerald-600'}`}>
                              {isOccupied ? 'มีผู้เช่า' : 'ว่าง'}
                            </span>
                            <span className="text-xs text-gray-400">฿{room.price.toLocaleString()}{isMonthly ? '/ด.' : '/คืน'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== ผู้เช่า ===== */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">ทั้งหมด <span className="font-bold text-gray-900">{filteredData.length}</span> รายการ</p>
                <button onClick={() => { setEditingTenant(null); setFormData({ name: '', phone: '', room: '', date: new Date().toISOString().split('T')[0] }); setIsCheckInModalOpen(true); }} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800">
                  <Plus size={16} /> เช็คอินใหม่
                </button>
              </div>
              <div className="bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/60">
                      <tr>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">วันที่เข้าพัก</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">ชื่อ-นามสกุล</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">ห้อง</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">เบอร์โทร</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.map(item => (
                        <tr key={item.id} className="hover:bg-white/40 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-gray-900">{item.date}</p>
                            <p className="text-xs text-gray-400">{item.time} น.</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3 justify-end">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                              </div>
                              <div className="w-9 h-9 bg-slate-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">{item.name.charAt(0)}</div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-medium bg-white/60 px-3 py-1 rounded-lg">{item.room}</span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-600">{item.phone}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => { setEditingTenant(item); setIsCheckInModalOpen(true); }} className="p-2 text-gray-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="แก้ไข">
                                <Edit3 size={16} />
                              </button>
                              <button onClick={() => handleDeleteTenant(item.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="ลบ">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredData.length === 0 && (
                  <div className="text-center py-16">
                    <Users size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">ไม่พบข้อมูลผู้เช่า</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== รายงาน ===== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* สรุป */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-2xl p-5 text-white">
                  <p className="text-sm text-slate-200 mb-1">จำนวนรายการ</p>
                  <p className="text-3xl font-bold">{reportData.length}</p>
                </div>
                <div className="bg-slate-600 rounded-2xl p-5 text-white">
                  <p className="text-sm text-slate-200 mb-1">รายได้รวม</p>
                  <p className="text-3xl font-bold">฿{(reportData.length * 4000 / 1000).toFixed(1)}k</p>
                </div>
                <div className="bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-400 mb-1">วันที่ออกรายงาน</p>
                  <p className="text-xl font-bold text-gray-900">{new Date().toLocaleDateString('th-TH')}</p>
                </div>
              </div>

              {/* ตัวกรอง */}
              <div className="bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4">ตัวกรองข้อมูล</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">เริ่มวันที่</label>
                    <input type="date" value={reportFilters.startDate} onChange={e => setReportFilters({ ...reportFilters, startDate: e.target.value })} className="w-full px-3 py-2 bg-white/60 backdrop-blur border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">ถึงวันที่</label>
                    <input type="date" value={reportFilters.endDate} onChange={e => setReportFilters({ ...reportFilters, endDate: e.target.value })} className="w-full px-3 py-2 bg-white/60 backdrop-blur border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">ประเภทห้อง</label>
                    <select value={reportFilters.roomType} onChange={e => setReportFilters({ ...reportFilters, roomType: e.target.value })} className="w-full px-3 py-2 bg-white/60 backdrop-blur border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20">
                      <option value="all">ทั้งหมด</option>
                      <option value="สแตนดาร์ด">สแตนดาร์ด</option>
                      <option value="ดีลักซ์">ดีลักซ์</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">สถานะ</label>
                    <select value={reportFilters.status} onChange={e => setReportFilters({ ...reportFilters, status: e.target.value })} className="w-full px-3 py-2 bg-white/60 backdrop-blur border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20">
                      <option value="all">ทั้งหมด</option>
                      <option value="occupied">มีผู้เช่า</option>
                      <option value="available">ว่าง</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ส่งออก */}
              <div className="flex flex-wrap gap-3">
                <button onClick={exportToCSV} className="px-5 py-2.5 bg-white/60 backdrop-blur border border-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-white">
                  <Download size={16} /> ส่งออก CSV
                </button>
                <button onClick={exportToPDF} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800">
                  <Download size={16} /> ส่งออก PDF
                </button>
              </div>

              {/* ตารางข้อมูล */}
              <div className="bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-sm text-gray-400">พบ {reportData.length} รายการ</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/60">
                      <tr>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">วันที่</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">ชื่อ</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">ห้อง</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportData.map(item => (
                        <tr key={item.id} className="hover:bg-white/40">
                          <td className="px-5 py-3 text-sm text-gray-600">{item.date}</td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">{item.room}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-3 py-1 rounded-lg font-medium ${item.status === 'occupied' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {item.status === 'occupied' ? 'มีผู้เช่า' : 'ว่าง'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== ตั้งค่า ===== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              {/* เชื่อมต่อ API */}
              <div className="bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-white">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">เชื่อมต่อระบบหลังบ้าน</h3>
                    <p className="text-sm text-gray-400">URL ของ FastAPI backend</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={apiUrlInput}
                    onChange={e => setApiUrlInput(e.target.value)}
                    placeholder="https://your-api.com"
                    className="flex-1 px-4 py-2.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  />
                  <button onClick={handleSaveApiUrl} className="px-6 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                    บันทึก URL
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${apiConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-500">{apiConnected ? 'เชื่อมต่อสำเร็จ' : 'ยังไม่เชื่อมต่อ — ตรวจสอบ URL'}</span>
                </div>
              </div>

              {/* เกี่ยวกับ */}
              <div className="bg-[#f0f0f0]/80 backdrop-blur-xl rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center text-white">
                    <Settings size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">เกี่ยวกับระบบ</h3>
                    <p className="text-sm text-gray-400">ข้อมูลเวอร์ชัน</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>ระบบจัดการรีสอร์ท <span className="font-medium">v1.0</span></p>
                  <p>หน้าบ้าน: Next.js + Capacitor + Android</p>
                  <p>หลังบ้าน: FastAPI + SQLAlchemy + SQLite</p>
                </div>
              </div>

              <button onClick={() => setActiveTab('dashboard')} className="px-8 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                กลับหน้าภาพรวม
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ===== ป๊อปอัพเช็คอิน/แก้ไข ===== */}
      <AnimatePresence>
        {isCheckInModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsCheckInModalOpen(false)} className="absolute inset-0" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-slate-700 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">{editingTenant ? 'แก้ไขข้อมูล' : 'เช็คอินใหม่'}</h2>
                    <p className="text-sm text-slate-200 mt-0.5">{editingTenant ? 'แก้ไขรายละเอียดผู้เช่า' : 'กรอกข้อมูลผู้เข้าพัก'}</p>
                  </div>
                  <button onClick={() => setIsCheckInModalOpen(false)} className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">ชื่อ-นามสกุล</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500" placeholder="กรอกชื่อ-นามสกุล" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">เบอร์โทรศัพท์</label>
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500" placeholder="0xx-xxx-xxxx" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">หมายเลขห้อง</label>
                  <select value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500">
                    <option value="">เลือกห้องพัก</option>
                    {ROOM_LIST.filter(r => editingTenant?.room === r.id || !tenants.some(d => d.room === r.id)).map(r => (
                      <option key={r.id} value={r.id}>{r.id} - {r.type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">วันที่เช็คอิน</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500" />
                </div>
              </div>
              <div className="px-6 pb-6">
                <button onClick={handleSaveTenant} className="w-full py-3 bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg active:scale-[0.98] transition-all">
                  {editingTenant ? 'บันทึกการแก้ไข' : 'ยืนยันการเช็คอิน'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
