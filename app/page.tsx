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

  const filteredData = useMemo(() => {
    return INITIAL_DATA.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const stats = {
    totalRooms: ROOM_LIST.length,
    occupied: INITIAL_DATA.length,
    available: ROOM_LIST.length - INITIAL_DATA.length,
    revenue: INITIAL_DATA.length * 4000 // Average
  };

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Name', 'Phone', 'Room', 'Status'];
    const rows = INITIAL_DATA.map(item => [
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
    link.setAttribute('download', `resort_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Resort Suite Manager - Tenant Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ['Date', 'Time', 'Name', 'Phone', 'Room', 'Status'];
    const tableRows = INITIAL_DATA.map(item => [
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
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // Slate-900
      styles: { fontSize: 9 }
    });

    doc.save(`resort_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 flex flex-col shrink-0 bg-white">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">รีสอร์ท สวีท</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="แดชบอร์ด" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Home size={20} />} 
            label="จัดการห้องพัก" 
            active={activeTab === 'rooms'} 
            onClick={() => setActiveTab('rooms')} 
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="ผู้เช่า" 
            active={activeTab === 'tenants'} 
            onClick={() => setActiveTab('tenants')} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="รายงาน" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="ตั้งค่า" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all text-sm font-medium">
            <LogOut size={18} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/30">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อผู้เช่า หรือ หมายเลขห้อง..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-slate-900/10 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all relative">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-slate-900 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Admin User</p>
                <p className="text-[10px] text-slate-400 font-medium">Super Admin</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-sm">
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
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="ห้องทั้งหมด" value={stats.totalRooms} icon={<Home size={20} />} />
                  <StatCard label="ห้องที่มีผู้เช่า" value={stats.occupied} icon={<CheckCircle2 size={20} />} />
                  <StatCard label="ห้องว่าง" value={stats.available} icon={<Plus size={20} />} />
                  <StatCard label="รายได้โดยประมาณ" value={`฿${stats.revenue.toLocaleString()}`} icon={<CreditCard size={20} />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Check-ins Table */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">การเช็คอินล่าสุด</h3>
                        <p className="text-sm text-slate-400 mt-1">รายการผู้เช่าที่เข้าพักล่าสุดในระบบ</p>
                      </div>
                      <button className="text-sm font-bold text-slate-900 hover:underline flex items-center gap-1">
                        ดูทั้งหมด <ChevronRight size={16} />
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100">
                            <th className="pb-4 font-bold">วันที่/เวลา</th>
                            <th className="pb-4 font-bold">ผู้เช่า</th>
                            <th className="pb-4 font-bold">ห้อง</th>
                            <th className="pb-4 font-bold">เบอร์โทรศัพท์</th>
                            <th className="pb-4 font-bold text-right">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredData.slice(0, 6).map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="py-4">
                                <p className="text-sm font-bold text-slate-900">{item.date}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{item.time} น.</p>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
                                    {item.name.charAt(0)}
                                  </div>
                                  <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg">
                                  {item.room}
                                </span>
                              </td>
                              <td className="py-4 text-sm text-slate-500 font-medium">
                                {item.phone}
                              </td>
                              <td className="py-4 text-right">
                                <button className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors">
                                  <MoreVertical size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Room Status Summary */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 mb-8">สถานะห้องพัก</h3>
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                          <p className="text-sm font-bold text-slate-900">มีผู้เช่า</p>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{stats.occupied}</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <p className="text-sm font-bold text-slate-900">ว่าง</p>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{stats.available}</p>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <p className="text-sm font-bold text-slate-900">รอทำความสะอาด</p>
                        </div>
                        <p className="text-lg font-bold text-slate-900">0</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsCheckInModalOpen(true)}
                      className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      เพิ่มการเช็คอินใหม่
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {ROOM_LIST.map((room) => {
                    const isOccupied = INITIAL_DATA.some(d => d.room === room.id);
                    return (
                      <div key={room.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-12 h-12 -mr-6 -mt-6 rotate-45 ${isOccupied ? 'bg-slate-100' : 'bg-emerald-100'}`}></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <span className="text-xl font-black text-slate-900">{room.id}</span>
                          <div className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
                        </div>
                        <div className="space-y-1 relative z-10">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{room.type}</p>
                          <p className="text-sm font-bold text-slate-900">฿{room.price.toLocaleString()}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isOccupied ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                            {isOccupied ? 'ไม่ว่าง' : 'ว่าง'}
                          </span>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            
            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">รายงานและการส่งออก</h2>
                    <p className="text-sm text-slate-400 mt-1">ส่งออกข้อมูลผู้เช่าทั้งหมดในรูปแบบต่างๆ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Export Options */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">ตัวเลือกการส่งออก</h3>
                    
                    <div className="space-y-4">
                      <button 
                        onClick={exportToCSV}
                        className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-slate-900">ส่งออกเป็น CSV</p>
                            <p className="text-xs text-slate-400">เหมาะสำหรับ Excel หรือ Google Sheets</p>
                          </div>
                        </div>
                        <Download size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                      </button>

                      <button 
                        onClick={exportToPDF}
                        className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                            <FileIcon size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-slate-900">ส่งออกเป็น PDF</p>
                            <p className="text-xs text-slate-400">เหมาะสำหรับการพิมพ์หรือส่งรายงาน</p>
                          </div>
                        </div>
                        <Download size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Stats for Report */}
                  <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-8 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-6">สรุปข้อมูลปัจจุบัน</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/10 rounded-2xl">
                          <p className="text-xs text-white/60 uppercase tracking-widest font-bold">ผู้เช่าทั้งหมด</p>
                          <p className="text-2xl font-black mt-1">{INITIAL_DATA.length}</p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl">
                          <p className="text-xs text-white/60 uppercase tracking-widest font-bold">ห้องว่าง</p>
                          <p className="text-2xl font-black mt-1">{stats.available}</p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl col-span-2">
                          <p className="text-xs text-white/60 uppercase tracking-widest font-bold">รายได้รวมโดยประมาณ</p>
                          <p className="text-2xl font-black mt-1">฿{stats.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-white/40 italic">ข้อมูลอ้างอิง ณ วันที่ {new Date().toLocaleDateString('th-TH')}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Placeholder for other tabs */}
            {['tenants', 'settings'].includes(activeTab) && (
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
                <p className="text-slate-400 mt-2 max-w-xs mx-auto">ส่วนการจัดการ {activeTab === 'tenants' ? 'ผู้เช่า' : activeTab === 'reports' ? 'รายงาน' : 'ตั้งค่า'} กำลังอยู่ในระหว่างการปรับปรุงดีไซน์ใหม่</p>
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

      {/* Check-in Modal */}
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
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">เช็คอินผู้เช่าใหม่</h3>
                  <p className="text-sm text-slate-400 mt-1">กรอกข้อมูลผู้เช่าเพื่อบันทึกลงในระบบ</p>
                </div>
                <button 
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ชื่อ-นามสกุล</label>
                    <input type="text" placeholder="ระบุชื่อผู้เช่า" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">เบอร์โทรศัพท์</label>
                    <input type="text" placeholder="08x-xxx-xxxx" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition-all" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">หมายเลขห้อง</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition-all appearance-none">
                      <option>เลือกห้องพัก</option>
                      {ROOM_LIST.filter(r => !INITIAL_DATA.some(d => d.room === r.id)).map(r => (
                        <option key={r.id} value={r.id}>{r.id} - {r.type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">วันที่เช็คอิน</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 transition-all" />
                  </div>
                </div>

                <div className="pt-4">
                  <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all">
                    บันทึกข้อมูลการเช็คอิน
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

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all group ${
        active 
          ? 'bg-slate-900 text-white font-bold shadow-lg shadow-slate-900/20' 
          : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} transition-colors`}>
        {icon}
      </div>
      <span className="text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-nav"
          className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
        />
      )}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
          {icon}
        </div>
        <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">+12%</div>
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
    </div>
  );
}
