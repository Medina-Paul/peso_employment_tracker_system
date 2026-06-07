import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState([]);
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, applicant: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, applicant: null });

  // --- 1. FETCH DATA ON LOAD ---
  useEffect(() => {
    fetchDashboardData();
    getAdminUser();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Failed to fetch applicants:', res.status, res.statusText);
        if (res.status === 401 || res.status === 403) {
          // Unauthorized - token missing/invalid. Clear token and stop.
          localStorage.removeItem('adminToken');
        }
        setApplicants([]);
        return;
      }

      const data = await res.json();
      setApplicants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  // --- Admin User ---
  const [adminUsername, setAdminUsername] = useState(null);

  // --- Derived Statistics ---
  const totalApplicants = applicants.length;
  const totalHired = applicants.filter(a => a.status === 'Hired').length;
  const totalRejected = applicants.filter(a => a.status === 'Rejected').length;

  // --- 2. ACTIONS TO EXPRESS BACKEND ---
  const handleStatusConfirm = async () => {
    const { type, applicant } = confirmModal;
    const newStatus = type === 'hire' ? 'Hired' : 'Rejected';

    try {
      const token = localStorage.getItem('adminToken');

      // 1. Send the request
      const response = await fetch(`${API_BASE}/admin/applicants/${applicant.applicant_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      // 2. IMPORTANT: Check if the response was successful
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized: Your session may have expired. Please log in again.");
        }
        throw new Error(`Server responded with ${response.status}`);
      }

      // 3. Update the UI only after successful response
      setApplicants(applicants.map(app =>
        app.applicant_id === applicant.applicant_id ? { ...app, status: newStatus } : app
      ));

      // 4. Trigger notification logic
      setConfirmModal({ isOpen: false, type: null, applicant: null });

    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    const { applicant } = deleteModal;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/applicants/${applicant.applicant_id}/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to delete applicant:', res.status, text);
        alert('Failed to delete record. Check console for details.');
        setDeleteModal({ isOpen: false, applicant: null });
        return;
      }

      // Remove from UI
      setApplicants(prev => prev.filter(a => a.applicant_id !== applicant.applicant_id));
      setDeleteModal({ isOpen: false, applicant: null });
    } catch (err) {
      console.error('Error deleting applicant:', err);
      alert('Error deleting record. Is the backend running?');
      setDeleteModal({ isOpen: false, applicant: null });
    }
  };

  const getAdminUser = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const adminRes = await fetch(`${API_BASE}/admin/admin-user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!adminRes.ok) {
        console.error('Failed to fetch admin user:', adminRes.status);
        if (adminRes.status === 401 || adminRes.status === 403) localStorage.removeItem('adminToken');
        return;
      }

      const adminData = await adminRes.json();
      setAdminUsername(adminData.username || null);

    } catch (error) {
      console.error("Error fetching admin user", error);
    }
  };

  // --- 3. VIEW FULL PROFILE FETCH ---
  const handleViewDetails = async (app) => {
    setIsLoadingProfile(true);
    setSelectedApplicant(app);

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Added the overseas fetch into the Promise.all array
      const [applicantRes, credRes, trainRes, eduRes, langRes, empRes, overseasRes] = await Promise.all([
        fetch(`${API_BASE}/admin/applicants/${app.applicant_id}`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/credentials/${app.applicant_id}`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/trainings/${app.applicant_id}`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/education/${app.applicant_id}`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/linguistics/${app.applicant_id}`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/employment/${app.applicant_id}`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE}/overseas/${app.applicant_id}`, { headers }).catch(() => ({ ok: false })),
      ]);

      const fullApplicantData = applicantRes.ok ? await applicantRes.json() : app;
      const credentialsData = credRes.ok ? await credRes.json() : [];
      const trainingsData = trainRes.ok ? await trainRes.json() : [];
      const educationData = eduRes.ok ? await eduRes.json() : [];
      const linguisticsData = langRes.ok ? await langRes.json() : [];

      const employmentArray = empRes.ok ? await empRes.json() : [];
      const employmentData = employmentArray.length > 0 ? employmentArray[0] : {};

      // Parse Overseas Data
      const overseasArray = overseasRes.ok ? await overseasRes.json() : [];
      const baseOverseas = overseasArray.length > 0 ? overseasArray[0] : { if_overseas_filipino: 'no' };

      const overseasParsedData = {
        if_overseas_filipino: baseOverseas.if_overseas_filipino || 'no',
        of_status: baseOverseas.of_status || null,
        of_location: baseOverseas.of_location || null,
        // Extract array of dependents from the rows returned
        dependents: overseasArray.filter(row => row.of_dependent).map(row => row.of_dependent)
      };

      setSelectedApplicant(prev => ({
        ...prev,
        ...fullApplicantData,
        ...employmentData,
        credentials: credentialsData,
        trainings: trainingsData,
        education: educationData,
        linguistics: linguisticsData,
        overseas_filipinos: overseasParsedData // Inject formatted OFW data
      }));
    } catch (err) {
      console.error("Error fetching full profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // --- UI Helpers ---
  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-gray-100 text-gray-700 border-gray-200',
      'Hired': 'bg-green-100 text-green-700 border-green-200',
      'Rejected': 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${styles[status] || styles['Pending']}`}>
        {status}
      </span>
    );
  };

  const renderNavButton = (id, label, iconPath) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${activeTab === id ? 'bg-blue-700 text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={iconPath}></path>
      </svg>
      {label}
    </button>
  );

  const renderTable = (filteredApplicants, showActions) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-gray-500 font-bold border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 uppercase text-xs tracking-wider">Applicant ID</th>
              <th className="px-6 py-4 uppercase text-xs tracking-wider">Current Role</th>
              <th className="px-6 py-4 uppercase text-xs tracking-wider">Education</th>
              <th className="px-6 py-4 uppercase text-xs tracking-wider">Status</th>
              <th className="px-6 py-4 uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredApplicants.map((app) => (
              <tr key={app.applicant_id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-5">
                  <div className="font-extrabold text-gray-900 font-mono text-base">APP-{app.applicant_id}</div>
                  {!isBlindMode && <div className="text-xs font-semibold text-blue-700 mt-1">{app.name}</div>}
                </td>
                <td className="px-6 py-5 text-gray-700 font-medium">{app.current_position || 'Not Provided'}</td>
                <td className="px-6 py-5 text-gray-700 font-medium">{app.highest_education || 'Not Provided'}</td>
                <td className="px-6 py-5">{getStatusBadge(app.status)}</td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 items-center">

                    <button
                      onClick={() => handleViewDetails(app)}
                      className="px-4 py-2 text-blue-700 hover:text-white border border-blue-200 hover:bg-blue-700 hover:border-blue-700 rounded-lg text-xs font-bold transition-all"
                    >
                      View Profile
                    </button>

                    {showActions && app.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, type: 'hire', applicant: app })}
                          className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Hire
                        </button>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, type: 'reject', applicant: app })}
                          className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {(activeTab === 'hired' || activeTab === 'rejected') && (
                      <>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, applicant: app })}
                          className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Delete Record
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredApplicants.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-gray-400 font-semibold text-base">No applicants found in this category.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-raleway text-gray-800">

      {/* --- Sidebar --- */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col z-10 shrink-0 shadow-sm">
        <div className="h-20 flex items-center px-8 border-b-4 border-red-800">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-xl tracking-tight text-[#0F172A]">Welcome, {adminUsername}</span>
          </div>
        </div>
        <nav className="flex-1 px-5 py-8 space-y-2 overflow-y-auto">
          <div className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 px-2">Menu</div>
          {renderNavButton('dashboard', 'Dashboard Overview', "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z")}
          {renderNavButton('applicants', 'Pending Applications', "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z")}

          <div className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 px-2 mt-10">Records</div>
          {renderNavButton('hired', 'Hired Candidates', "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z")}
          {renderNavButton('rejected', 'Rejected Candidates', "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z")}
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-10 shrink-0 shadow-sm z-0">
          <h1 className="text-2xl font-extrabold text-gray-900 capitalize tracking-tight">
            {activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ') + ' Candidates'}
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-[#F8FAFC] px-5 py-2.5 rounded-xl border border-gray-200">
              <span className={`text-sm font-bold ${isBlindMode ? 'text-blue-700' : 'text-gray-500'}`}>
                Blind Mode Screening
              </span>
              <button
                onClick={() => setIsBlindMode(!isBlindMode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isBlindMode ? 'bg-blue-700' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isBlindMode ? 'translate-x-6' : 'translate-x-1'} shadow-sm`} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 relative">
          {activeTab === 'dashboard' && (
            <div className="animate-fadeIn max-w-[1400px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="bg-white p-8 rounded-2xl border-l-4 border-l-blue-600 border border-y-gray-100 border-r-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between">
                  <div className="text-sm font-extrabold text-gray-500 uppercase tracking-widest mb-3">Total Applications</div>
                  <div className="text-5xl font-extrabold text-gray-900">{totalApplicants}</div>
                </div>
                <div className="bg-white p-8 rounded-2xl border-l-4 border-l-green-500 border border-y-gray-100 border-r-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between">
                  <div className="text-sm font-extrabold text-gray-500 uppercase tracking-widest mb-3">Total Hired</div>
                  <div className="text-5xl font-extrabold text-green-600">{totalHired}</div>
                </div>
                <div className="bg-white p-8 rounded-2xl border-l-4 border-l-red-500 border border-y-gray-100 border-r-gray-100 shadow-xl shadow-gray-200/40 flex flex-col justify-between">
                  <div className="text-sm font-extrabold text-gray-500 uppercase tracking-widest mb-3">Total Rejected</div>
                  <div className="text-5xl font-extrabold text-red-600">{totalRejected}</div>
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">Recent Applications</h2>
              {renderTable(applicants, false)}
            </div>
          )}

          {activeTab === 'applicants' && (
            <div className="animate-fadeIn max-w-[1400px]">
              <p className="text-gray-600 font-medium mb-8 text-lg">Review pending applications and make hiring decisions.</p>
              {renderTable(applicants.filter(a => a.status === 'Pending'), true)}
            </div>
          )}

          {activeTab === 'hired' && (
            <div className="animate-fadeIn max-w-[1400px]">
              <p className="text-gray-600 font-medium mb-8 text-lg">Record of all officially hired candidates.</p>
              {renderTable(applicants.filter(a => a.status === 'Hired'), true)}
            </div>
          )}

          {activeTab === 'rejected' && (
            <div className="animate-fadeIn max-w-[1400px]">
              <p className="text-gray-600 font-medium mb-8 text-lg">Record of applicants who did not meet qualifications.</p>
              {renderTable(applicants.filter(a => a.status === 'Rejected'), true)}
            </div>
          )}
        </div>
      </main>

      {/* ========================================= */}
      {/* OVERLAY 1: FULL APPLICANT DATA MODAL      */}
      {/* ========================================= */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:p-8">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] overscroll-none">

            {/* Modal Header */}
            <div className="px-8 py-5 border-b-4 border-red-800 bg-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-extrabold text-black tracking-wide">
                  Applicant Profile
                </h2>
                <p className="text-[#FF0000] text-md font-semibold mt-1">ID: APP-{selectedApplicant.applicant_id}</p>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="text-gray-600 hover:text-gray-900 p-2 animateFadeIn">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto space-y-10 bg-gray-50">
              {isBlindMode && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-5 py-4 rounded-xl text-sm flex items-start gap-4 shadow-sm">
                  <svg className="w-6 h-6 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                  <div>
                    <p className="font-extrabold text-base mb-1">Blind Mode is Active</p>
                    <p className="font-medium text-yellow-700">Personally Identifiable Information (Name, Sex, Age, Contact) is hidden to prevent unconscious bias during review.</p>
                  </div>
                </div>
              )}

              {/* 1. Personal Background */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h3 className="text-lg font-extrabold text-blue-900 border-b-2 border-red-600 pb-2 inline-block mb-6">Personal & Background</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8 text-sm">
                  <div className="col-span-1 md:col-span-2">
                    <span className="block text-gray-500 font-bold mb-1">Full Name</span>
                    <span className="font-extrabold text-gray-900 text-base">{isBlindMode ? 'HIDDEN' : selectedApplicant.name}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <span className="block text-gray-500 font-bold mb-1">Address</span>
                    <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.address}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold mb-1">Birthdate</span>
                    <span className="font-extrabold text-gray-900 text-base">{isBlindMode ? 'HIDDEN' : selectedApplicant.birthdate?.split('T')[0]}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold mb-1">Place of Birth</span>
                    <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.place_birth || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold mb-1">Sex</span>
                    <span className="font-extrabold text-gray-900 text-base">{isBlindMode ? 'HIDDEN' : selectedApplicant.sex}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold mb-1">Civil Status</span>
                    <span className="font-extrabold text-gray-900 text-base capitalize">{selectedApplicant.civil_status || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold mb-1">Height</span>
                    <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.height ? `${selectedApplicant.height} cm` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold mb-1">Weight</span>
                    <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.weight ? `${selectedApplicant.weight} kg` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold mb-1">Mobile No.</span>
                    <span className="font-extrabold text-gray-900 text-base">{isBlindMode ? 'HIDDEN' : selectedApplicant.mobile_no}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-bold mb-1">Email Address</span>
                    <span className="font-extrabold text-gray-900 text-base truncate block">{isBlindMode ? 'HIDDEN' : selectedApplicant.email_address || 'Not Provided'}</span>
                  </div>

                  {/* Overseas Filipino Worker (OFW) Status */}
                  <div className="col-span-1 lg:col-span-4 pt-4 border-t border-gray-200 mt-2">
                    <span className="block text-gray-500 font-bold mb-1">Overseas Filipino Worker (OFW) Status</span>
                    <span className="font-extrabold text-blue-700 text-base capitalize bg-blue-50 px-3 py-1 rounded-md inline-block">
                      {selectedApplicant.overseas_filipinos?.if_overseas_filipino || 'No'}
                    </span>
                  </div>

                  {/* Conditional section: If the applicant is an OFW, show their details and dependents list */}
                  {(selectedApplicant.overseas_filipinos?.if_overseas_filipino?.toLowerCase() === 'yes') && (
                    <div className="col-span-1 lg:col-span-4 bg-blue-50 border border-blue-100 rounded-xl p-5 mt-2">
                      <h4 className="text-sm font-extrabold text-blue-900 mb-4">OFW Details & Dependents</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <span className="block text-blue-700 font-bold mb-1 text-xs">Current OFW Status</span>
                          <span className="font-extrabold text-gray-900 text-sm capitalize">
                            {selectedApplicant.overseas_filipinos?.of_status || 'Not Provided'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-blue-700 font-bold mb-1 text-xs">Location</span>
                          <span className="font-extrabold text-gray-900 text-sm capitalize">
                            {selectedApplicant.overseas_filipinos?.of_location || 'Not Provided'}
                          </span>
                        </div>
                      </div>

                      <h5 className="text-xs font-extrabold text-blue-800 mb-2">Declared Dependents</h5>
                      {selectedApplicant.overseas_filipinos?.dependents?.length > 0 ? (
                        <ul className="list-disc list-inside text-sm font-bold text-gray-800 ml-2">
                          {selectedApplicant.overseas_filipinos.dependents.map((dep, idx) => (
                            <li key={idx} className="capitalize">{dep}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-gray-600 font-medium italic">No dependents declared.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isLoadingProfile ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-700"></div>
                </div>
              ) : (
                <>
                  {/* 2. Education Details */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-lg font-extrabold text-blue-900 border-b-2 border-red-600 pb-2 inline-block mb-6">Education Details</h3>
                    {selectedApplicant.education?.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {selectedApplicant.education.map((edu, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                            <span className="block font-extrabold text-gray-900 text-base mb-1">
                              {edu.educ_level.toLowerCase() === 'college'
                                ? `College - ${edu.highest_level_comp}`
                                : edu.educ_level.toUpperCase()}
                            </span>
                            <span className="block text-sm font-semibold text-gray-600 mb-3">{edu.school_name}</span>
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg w-fit">Graduated: {edu.year_graduated}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm font-semibold italic">No education details provided.</p>
                    )}
                  </div>

                  {/* 3. Credentials and Trainings */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-lg font-extrabold text-blue-900 border-b-2 border-red-600 pb-2 inline-block mb-6">Credentials & Trainings</h3>

                    <div className="space-y-8">
                      {/* Licenses and Credentials */}
                      <div>
                        <h4 className="text-base font-extrabold text-gray-800 mb-3">Licenses and Credentials</h4>
                        {selectedApplicant.credentials?.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {selectedApplicant.credentials.map((cred) => (
                              <span key={cred.credential_id} className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                                {cred.credential_title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm font-medium italic">None provided</p>
                        )}
                      </div>

                      {/* Trainings and Skills acquired */}
                      <div className="pt-6 border-t border-gray-200">
                        <h4 className="text-base font-extrabold text-gray-800 mb-4">Trainings & Skills Acquired</h4>
                        {selectedApplicant.trainings?.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {selectedApplicant.trainings.map((train) => (
                              <div key={train.training_id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                                <span className="font-extrabold text-gray-900 text-base block mb-2">{train.training_cert}</span>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><span className="font-bold text-gray-500 block text-xs">Skill:</span> <span className="font-semibold text-gray-800">{train.skills}</span></div>
                                  <div><span className="font-bold text-gray-500 block text-xs">Duration:</span> <span className="font-semibold text-gray-800">{train.training_period}</span></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm font-medium italic">None provided</p>
                        )}
                      </div>

                      {/* Languages and dialect */}
                      <div className="pt-6 border-t border-gray-200">
                        <h4 className="text-base font-extrabold text-gray-800 mb-3">Languages & Dialects</h4>
                        {selectedApplicant.linguistics?.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {selectedApplicant.linguistics.map((lang, idx) => (
                              <span key={idx} className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                                {lang.linguistic}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm font-medium italic">None provided</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Employment History */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-lg font-extrabold text-blue-900 border-b-2 border-red-600 pb-2 inline-block mb-6">Employment History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div>
                        <span className="block text-gray-500 font-bold mb-1">Current Employment Status</span>
                        <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.employment_status || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 font-bold mb-1">Current/Target Position</span>
                        <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.current_position || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500 font-bold mb-1">Position Last Employer</span>
                        <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.position_last_employer || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Previous Employer Details */}
                    <div>
                      <h4 className="text-base font-extrabold text-gray-800 mb-4">Previous Employer Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                        <div>
                          <span className="block text-gray-500 font-bold mb-1">Employer Name</span>
                          <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.employer_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 font-bold mb-1">Nature of Business</span>
                          <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.business_nature || 'N/A'}</span>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <span className="block text-gray-500 font-bold mb-1">Employer Address</span>
                          <span className="font-extrabold text-gray-900 text-base">{selectedApplicant.employer_address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-8 py-5 border-t border-gray-200 bg-white flex justify-end gap-4 shrink-0">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="w-full sm:w-auto px-8 py-3.5 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* OVERLAY 2: HIRE/REJECT CONFIRMATION MODAL */}
      {/* ========================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-8 text-center border border-gray-100">

            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 ${confirmModal.type === 'hire' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {confirmModal.type === 'hire' ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              )}
            </div>

            <h3 className="text-2xl font-extrabold text-gray-900 mb-3">
              Confirm {confirmModal.type === 'hire' ? 'Hire' : 'Rejection'}
            </h3>

            <p className="text-base text-gray-500 mb-8 font-medium leading-relaxed">
              Are you sure you want to <strong>{confirmModal.type}</strong> applicant <span className="font-mono text-gray-800 font-bold">APP-{confirmModal.applicant.applicant_id}</span>?
              This action will update the database immediately.
            </p>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: null, applicant: null })}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusConfirm}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-all shadow-md transform hover:-translate-y-0.5 ${confirmModal.type === 'hire' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
              >
                Yes, {confirmModal.type}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* OVERLAY 3: DELETE CONFIRMATION MODAL */}
      {/* ========================================= */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[65] p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-8 text-center border border-gray-100">

            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 bg-red-100 text-red-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>

            <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Confirm Delete</h3>

            <p className="text-base text-gray-500 mb-8 font-medium leading-relaxed">
              Are you sure you want to permanently delete applicant <span className="font-mono text-gray-800 font-bold">APP-{deleteModal.applicant?.applicant_id}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setDeleteModal({ isOpen: false, applicant: null })}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-all shadow-md bg-red-600 hover:bg-red-700`}
              >
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}