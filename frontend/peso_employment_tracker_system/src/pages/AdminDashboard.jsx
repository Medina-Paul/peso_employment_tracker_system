import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard() {
  // Now starts as an empty array, waiting for the database!
  const [applicants, setApplicants] = useState([]);
  const [isBlindMode, setIsBlindMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, applicant: null });

  // --- 1. FETCH DATA ON LOAD ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/admin/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setApplicants(data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  // --- Derived Statistics ---
  const totalApplicants = applicants.length;
  const totalHired = applicants.filter(a => a.status === 'Hired').length;
  const totalRejected = applicants.filter(a => a.status === 'Rejected').length;

  // --- 2. ACTIONS TO EXPRESS BACKEND ---
  const triggerEmailNotification = (applicant, newStatus) => {
    console.log(`[DEMO SYSTEM] Simulating ${newStatus.toUpperCase()} email sent to DEMO EMAIL regarding applicant APP-${applicant.applicant_id}`);
  };

  const handleStatusConfirm = async () => {
    const { type, applicant } = confirmModal;
    const newStatus = type === 'hire' ? 'Hired' : 'Rejected';

    try {
      // Tell the database to update the status
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE}/admin/applicants/${applicant.applicant_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      // Update the React UI to match the database
      setApplicants(applicants.map(app =>
        app.applicant_id === applicant.applicant_id ? { ...app, status: newStatus } : app
      ));

      triggerEmailNotification(applicant, newStatus);
      setConfirmModal({ isOpen: false, type: null, applicant: null });
    } catch (err) {
      console.error("Failed to update status in database:", err);
      alert("Error updating status. Is the backend running?");
    }
  };

  // --- 3. VIEW FULL PROFILE FETCH ---
  const handleViewDetails = async (app) => {
    setIsLoadingProfile(true);
    setSelectedApplicant(app); // Show the modal immediately with basic info

    try {
      // Fetch the deep data from your normalized tables concurrently
      const [credRes, trainRes] = await Promise.all([
        fetch(`${API_BASE}/credentials/${app.applicant_id}`),
        fetch(`${API_BASE}/trainings/${app.applicant_id}`)
      ]);

      const credentialsData = await credRes.json();
      const trainingsData = await trainRes.json();

      // Update the modal state with the newly fetched data
      setSelectedApplicant(prev => ({
        ...prev,
        credentials: credentialsData || [],
        trainings: trainingsData || []
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
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles['Pending']}`}>
        {status}
      </span>
    );
  };

  const renderNavButton = (id, label, iconPath) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath}></path>
      </svg>
      {label}
    </button>
  );

  const renderTable = (filteredApplicants, showActions) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
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
              <tr key={app.applicant_id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900 font-mono">APP-{app.applicant_id}</div>
                  {!isBlindMode && <div className="text-xs text-gray-500 mt-1">{app.name}</div>}
                </td>
                <td className="px-6 py-4 text-gray-700">{app.current_position || 'Not Provided'}</td>
                <td className="px-6 py-4 text-gray-700">{app.highest_education || 'Not Provided'}</td>
                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 items-center">

                    <button
                      onClick={() => handleViewDetails(app)}
                      className="px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md text-xs font-medium transition-colors"
                    >
                      View Full Data
                    </button>

                    {showActions && app.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, type: 'hire', applicant: app })}
                          className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-md text-xs font-medium transition-colors shadow-sm"
                        >
                          Hire
                        </button>
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, type: 'reject', applicant: app })}
                          className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-md text-xs font-medium transition-colors shadow-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredApplicants.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No applicants found in this category.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-gray-800">

      {/* --- Sidebar --- */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-700 flex items-center justify-center text-white font-bold text-xs">ATS</div>
            <span className="font-bold text-lg tracking-tight text-gray-900">HireFlow Admin</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Menu</div>
          {renderNavButton('dashboard', 'Dashboard', "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z")}
          {renderNavButton('applicants', 'Pending Applicants', "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z")}

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3 mt-6">Records</div>
          {renderNavButton('hired', 'Hired Applicants', "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z")}
          {renderNavButton('rejected', 'Rejected Applicants', "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z")}
        </nav>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ') + ' Applicants'}
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <span className={`text-sm font-medium ${isBlindMode ? 'text-blue-700' : 'text-gray-500'}`}>
                Blind Mode
              </span>
              <button
                onClick={() => setIsBlindMode(!isBlindMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBlindMode ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBlindMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {activeTab === 'dashboard' && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Applicants</div>
                  <div className="text-4xl font-bold text-gray-900">{totalApplicants}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Accepted</div>
                  <div className="text-4xl font-bold text-green-600">{totalHired}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Rejected</div>
                  <div className="text-4xl font-bold text-red-600">{totalRejected}</div>
                </div>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Applications</h2>
              {renderTable(applicants, false)}
            </div>
          )}

          {activeTab === 'applicants' && (
            <div className="animate-fadeIn">
              <p className="text-gray-500 mb-6">Review pending applications and make hiring decisions.</p>
              {renderTable(applicants.filter(a => a.status === 'Pending'), true)}
            </div>
          )}

          {activeTab === 'hired' && (
            <div className="animate-fadeIn">
              <p className="text-gray-500 mb-6">Record of all officially hired candidates.</p>
              {renderTable(applicants.filter(a => a.status === 'Hired'), false)}
            </div>
          )}

          {activeTab === 'rejected' && (
            <div className="animate-fadeIn">
              <p className="text-gray-500 mb-6">Record of applicants who did not meet qualifications.</p>
              {renderTable(applicants.filter(a => a.status === 'Rejected'), false)}
            </div>
          )}
        </div>
      </main>

      {/* ========================================= */}
      {/* OVERLAY 1: FULL APPLICANT DATA MODAL      */}
      {/* ========================================= */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">

            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 font-mono">
                APP-{selectedApplicant.applicant_id} Application Data
              </h2>
              <button onClick={() => setSelectedApplicant(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              {isBlindMode && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                  <div>
                    <p className="font-bold">Blind Mode is Active.</p>
                    <p>Personally Identifiable Information (Name, Sex, Age, Contact) is hidden to prevent unconscious bias during review.</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">Personal Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="block text-gray-500 font-medium">Full Name</span>
                    <span className="font-semibold text-gray-900">{isBlindMode ? 'HIDDEN' : selectedApplicant.name}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Sex</span>
                    <span className="font-semibold text-gray-900">{isBlindMode ? 'HIDDEN' : selectedApplicant.sex}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Birthdate</span>
                    <span className="font-semibold text-gray-900">{isBlindMode ? 'HIDDEN' : selectedApplicant.birthdate?.split('T')[0]}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-gray-500 font-medium">Address</span>
                    <span className="font-semibold text-gray-900">{selectedApplicant.address}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Civil Status</span>
                    <span className="font-semibold text-gray-900 capitalize">{selectedApplicant.civil_status || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Email Address</span>
                    <span className="font-semibold text-gray-900">{isBlindMode ? 'HIDDEN' : selectedApplicant.email_address || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Mobile No.</span>
                    <span className="font-semibold text-gray-900">{isBlindMode ? 'HIDDEN' : selectedApplicant.mobile_no}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">Professional Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="block text-gray-500 font-medium">Current/Target Position</span>
                    <span className="font-semibold text-gray-900">{selectedApplicant.current_position || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-medium">Highest Education Level</span>
                    <span className="font-semibold text-gray-900">{selectedApplicant.highest_education || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">Credentials & Trainings</h3>

                {isLoadingProfile ? (
                  <p className="text-gray-500 text-sm animate-pulse">Loading secure database records...</p>
                ) : (
                  <div className="space-y-4">
                    {/* Credentials Rendering */}
                    {selectedApplicant.credentials?.length > 0 && (
                      <div>
                        <span className="block text-gray-500 font-medium text-xs mb-2">Professional Licenses</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplicant.credentials.map((cred) => (
                            <span key={cred.credential_id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-xs font-medium">
                              {cred.credential_title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trainings Rendering */}
                    {selectedApplicant.trainings?.length > 0 && (
                      <div>
                        <span className="block text-gray-500 font-medium text-xs mb-2">Trainings & Acquired Skills</span>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedApplicant.trainings.map((train) => (
                            <div key={train.training_id} className="bg-gray-50 border border-gray-100 p-3 rounded-md text-sm">
                              <span className="font-semibold text-gray-800 block">{train.training_cert}</span>
                              <span className="text-gray-600 block mt-1">Skill: {train.skills}</span>
                              <span className="text-gray-400 text-xs mt-1 block">Duration: {train.training_period}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!selectedApplicant.credentials?.length && !selectedApplicant.trainings?.length) && (
                      <p className="text-gray-500 text-sm italic">No credentials or trainings provided.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium transition-colors"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-xl shadow-2xl p-6 text-center">

            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${confirmModal.type === 'hire' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {confirmModal.type === 'hire' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm {confirmModal.type === 'hire' ? 'Hire' : 'Rejection'}
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to <strong>{confirmModal.type}</strong> applicant <span className="font-mono text-gray-800">APP-{confirmModal.applicant.applicant_id}</span>?
              This action will update the database and send an automated email notification.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: null, applicant: null })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusConfirm}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-sm ${confirmModal.type === 'hire' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Yes, {confirmModal.type} candidate
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}