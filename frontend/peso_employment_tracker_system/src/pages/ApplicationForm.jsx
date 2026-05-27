import React, { useState } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ApplicationForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State mapped to your SQL schema
    const [formData, setFormData] = useState({
        name: '', address: '', birthdate: '', place_birth: '', sex: '',
        height: '', weight: '', religion: '', civil_status: '',
        landline_no: '', mobile_no: '', email_address: '',
        if_overseas_filipino: 'no', of_dependent: '', of_location: '', of_status: '',
        education: [{ educ_level: '', school_name: '', year_graduated: '', highest_level_comp: '' }],
        credentials: [{ credential_title: '' }],
        trainings: [{ training_cert: '', skill_acquired: '', duration: '' }],
        languages: [], currentLanguageSelect: '', currentDialectInput: '',
        employment_status: '', position_last_employer: '', current_position: '',
        employer_name: '', employer_address: '', business_nature: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. CREATE APPLICANT
            const applicantRes = await fetch(`${API_BASE}/applicants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name, address: formData.address, birthdate: formData.birthdate,
                    place_birth: formData.place_birth, sex: formData.sex,
                    height: formData.height ? parseInt(formData.height) : null,
                    weight: formData.weight ? parseInt(formData.weight) : null,
                    religion: formData.religion || null, civil_status: formData.civil_status || null,
                    landline_no: formData.landline_no || null, mobile_no: formData.mobile_no,
                    email_address: formData.email_address || null
                })
            });

            if (!applicantRes.ok) throw new Error(`Applicant failed: ${await applicantRes.text()}`);
            const newApplicant = await applicantRes.json();
            const applicantId = newApplicant.applicant_id;

            // 2. CREATE OVERSEAS STATUS
            const overseasRes = await fetch(`${API_BASE}/overseas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicant_id: applicantId, if_overseas_filipino: formData.if_overseas_filipino,
                    of_dependent: formData.of_dependent || null, of_location: formData.of_location || null,
                    of_status: formData.of_status || null
                })
            });
            if (!overseasRes.ok) throw new Error(`Overseas failed: ${await overseasRes.text()}`);

            // 3. CREATE EDUCATION
            for (const edu of formData.education) {
                if (edu.educ_level && edu.school_name && edu.year_graduated) {
                    const finalHighestLevel = edu.educ_level === 'college' ? edu.highest_level_comp : edu.educ_level;
                    const eduRes = await fetch(`${API_BASE}/education`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            applicant_id: applicantId, educ_level: edu.educ_level,
                            school_name: edu.school_name, highest_level_comp: finalHighestLevel,
                            year_graduated: parseInt(edu.year_graduated)
                        })
                    });
                    if (!eduRes.ok) throw new Error(`Education failed: ${await eduRes.text()}`);
                }
            }

            // 4. CREATE LINGUISTICS
            for (const language of formData.languages) {
                const langRes = await fetch(`${API_BASE}/linguistics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ applicant_id: applicantId, linguistic: language })
                });
                if (!langRes.ok) throw new Error(`Linguistics failed: ${await langRes.text()}`);
            }

            // 5. CREATE EMPLOYER & EMPLOYMENT
            let currentEmployerId = null;
            if (formData.employer_name && formData.employer_address) {
                const employerRes = await fetch(`${API_BASE}/employment/employer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employer_name: formData.employer_name, employer_address: formData.employer_address,
                        business_nature: formData.business_nature || null
                    })
                });
                if (!employerRes.ok) throw new Error(`Employer failed: ${await employerRes.text()}`);
                const newEmployer = await employerRes.json();
                currentEmployerId = newEmployer.employer_id;
            }

            const empRes = await fetch(`${API_BASE}/employment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicant_id: applicantId, employment_status: formData.employment_status,
                    position_last_employer: formData.position_last_employer || null,
                    current_position: formData.current_position, employer_id: currentEmployerId
                })
            });
            if (!empRes.ok) throw new Error(`Employment failed: ${await empRes.text()}`);

            // 6. CREATE CREDENTIALS
            for (const cred of formData.credentials) {
                if (cred.credential_title) {
                    const credRes = await fetch(`${API_BASE}/credentials`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicant_id: applicantId, credential_title: cred.credential_title })
                    });
                    if (!credRes.ok) throw new Error(`Credentials failed: ${await credRes.text()}`);
                }
            }

            // 7. CREATE TRAININGS
            for (const training of formData.trainings) {
                if (training.training_cert || training.skill_acquired) {
                    const trainRes = await fetch(`${API_BASE}/trainings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            applicant_id: applicantId, training_cert: training.training_cert,
                            skills: training.skill_acquired, training_period: training.duration
                        })
                    });
                    if (!trainRes.ok) throw new Error(`Trainings failed: ${await trainRes.text()}`);
                }
            }

            setIsSuccess(true);
        } catch (error) {
            console.error("Submission failed:", error);
            alert(`Application Error:\n${error.message}`);
        }
    };

    // --- Dynamic Array Handlers ---
    const handleEducationChange = (index, field, value) => {
        const newEdu = [...formData.education];
        newEdu[index][field] = value;
        setFormData(prev => ({ ...prev, education: newEdu }));
    };
    const addEducation = () => setFormData(prev => ({ ...prev, education: [...prev.education, { educ_level: '', school_name: '', year_graduated: '', highest_level_comp: '' }] }));

    const handleCredentialChange = (index, value) => {
        const newCreds = [...formData.credentials];
        newCreds[index].credential_title = value;
        setFormData(prev => ({ ...prev, credentials: newCreds }));
    };
    const addCredential = () => setFormData(prev => ({ ...prev, credentials: [...prev.credentials, { credential_title: '' }] }));
    const removeCredential = (indexToRemove) => setFormData(prev => ({ ...prev, credentials: prev.credentials.filter((_, index) => index !== indexToRemove) }));

    const handleTrainingChange = (index, field, value) => {
        const newTrainings = [...formData.trainings];
        newTrainings[index][field] = value;
        setFormData(prev => ({ ...prev, trainings: newTrainings }));
    };
    const addTraining = () => setFormData(prev => ({ ...prev, trainings: [...prev.trainings, { training_cert: '', skill_acquired: '', duration: '' }] }));
    const removeTraining = (indexToRemove) => setFormData(prev => ({ ...prev, trainings: prev.trainings.filter((_, index) => index !== indexToRemove) }));

    const handleAddLanguage = () => {
        let langToAdd = formData.currentLanguageSelect;
        if (langToAdd === 'Dialect') {
            if (!formData.currentDialectInput.trim()) return;
            langToAdd = `Dialect: ${formData.currentDialectInput.trim()}`;
        }
        if (langToAdd && !formData.languages.includes(langToAdd)) {
            setFormData(prev => ({
                ...prev, languages: [...prev.languages, langToAdd],
                currentLanguageSelect: '', currentDialectInput: ''
            }));
        }
    };
    const removeLanguage = (indexToRemove) => setFormData(prev => ({ ...prev, languages: prev.languages.filter((_, index) => index !== indexToRemove) }));

    // --- Reusable Input Class for UI Consistency ---
    const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all";
    const labelClass = "block text-sm font-bold text-gray-700 mb-1.5";

    const renderStepIndicator = () => {
        const steps = ['Personal Details', 'Education', 'Qualifications', 'Employment'];
        return (
            <div className="flex items-center justify-between w-full mb-8 pb-6 border-b border-gray-100">
                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = currentStep === stepNum;
                    const isCompleted = currentStep > stepNum;
                    return (
                        <React.Fragment key={step}>
                            <div className="flex items-center shrink-0">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border-2 transition-colors duration-300
                                    ${isActive ? 'bg-blue-700 text-white border-blue-700' :
                                        isCompleted ? 'bg-white text-blue-700 border-blue-700' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                    {isCompleted ? '✓' : stepNum}
                                </div>
                                <span className={`ml-2 text-xs xl:text-sm font-bold hidden md:block whitespace-nowrap ${isActive ? 'text-blue-900' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {step}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 md:mx-4 bg-gray-200 rounded min-w-[1rem]">
                                    <div className={`h-full bg-blue-700 rounded transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`}></div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    const Step1Personal = () => (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Personal & Background</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="flex flex-col md:col-span-2">
                    <label className={labelClass}>Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClass} required />
                </div>
                <div className="flex flex-col md:col-span-2">
                    <label className={labelClass}>Address *</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputClass} required />
                </div>
                <div className="flex flex-col">
                    <label className={labelClass}>Birthdate *</label>
                    <input type="date" name="birthdate" value={formData.birthdate} onChange={handleInputChange} className={inputClass} required />
                </div>
                <div className="flex flex-col">
                    <label className={labelClass}>Place of Birth *</label>
                    <input type="text" name="place_birth" value={formData.place_birth} onChange={handleInputChange} className={inputClass} required />
                </div>

                <div className="flex flex-col md:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col">
                            <label className={labelClass}>Sex *</label>
                            <select name="sex" value={formData.sex} onChange={handleInputChange} className={inputClass} required>
                                <option value="">Select...</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="O">Other</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Civil Status</label>
                            <select name="civil_status" value={formData.civil_status} onChange={handleInputChange} className={inputClass}>
                                <option value="">Select...</option>
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                                <option value="separated">Separated</option>
                                <option value="widow">Widow</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Height (cm)</label>
                            <input type="number" name="height" value={formData.height} onChange={handleInputChange} className={inputClass} />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Weight (kg)</label>
                            <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className={labelClass}>Mobile No *</label>
                    <input type="text" name="mobile_no" value={formData.mobile_no} onChange={handleInputChange} className={inputClass} required />
                </div>
                <div className="flex flex-col">
                    <label className={labelClass}>Email Address</label>
                    <input type="email" name="email_address" value={formData.email_address} onChange={handleInputChange} className={inputClass} />
                </div>
            </div>

            <div className="mt-8 p-6 bg-[#F8FAFC] rounded-xl border border-gray-200 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <label className="font-extrabold text-gray-900">Are you an Overseas Filipino?</label>
                    <div className="flex items-center space-x-6 bg-white px-4 py-2 rounded-lg border border-gray-200">
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="if_overseas_filipino" value="yes" checked={formData.if_overseas_filipino === 'yes'} onChange={handleInputChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            <span className="ml-2 font-medium text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="if_overseas_filipino" value="no" checked={formData.if_overseas_filipino === 'no'} onChange={handleInputChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            <span className="ml-2 font-medium text-gray-700">No</span>
                        </label>
                    </div>
                </div>

                {formData.if_overseas_filipino === 'yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 animate-fadeIn">
                        <div className="flex flex-col">
                            <label className={labelClass}>Dependent</label>
                            <select name="of_dependent" value={formData.of_dependent} onChange={handleInputChange} className={inputClass}>
                                <option value="">Select...</option>
                                <option value="wife">Wife</option>
                                <option value="husband">Husband</option>
                                <option value="parent">Parent</option>
                                <option value="son">Son</option>
                                <option value="daughter">Daughter</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Location</label>
                            <select name="of_location" value={formData.of_location} onChange={handleInputChange} className={inputClass}>
                                <option value="">Select...</option>
                                <option value="land-based">Land-based</option>
                                <option value="sea-based">Sea-based</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Status</label>
                            <select name="of_status" value={formData.of_status} onChange={handleInputChange} className={inputClass}>
                                <option value="">Select...</option>
                                <option value="already at jobsite">Already at jobsite</option>
                                <option value="vacation">Vacation</option>
                                <option value="finished contract">Finished contract</option>
                                <option value="repatriated">Repatriated</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const Step2Education = () => (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Education Details</h2>
            {formData.education.map((edu, index) => (
                <div key={index} className="p-6 border border-gray-200 rounded-xl bg-[#F8FAFC] relative">
                    {index > 0 && (
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }))}
                            className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold bg-white px-2 py-1 rounded border border-red-100">
                            ✕ Remove
                        </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                        <div className="flex flex-col">
                            <label className={labelClass}>Level *</label>
                            <select value={edu.educ_level} onChange={(e) => handleEducationChange(index, 'educ_level', e.target.value)} className={inputClass} required>
                                <option value="">Select Level</option>
                                <option value="elementary">Elementary</option>
                                <option value="high school">High School</option>
                                <option value="college">College</option>
                            </select>
                        </div>

                        {edu.educ_level === 'college' && (
                            <div className="flex flex-col animate-fadeIn">
                                <label className={labelClass}>Degree Title *</label>
                                <input type="text" value={edu.highest_level_comp} onChange={(e) => handleEducationChange(index, 'highest_level_comp', e.target.value)} className={inputClass} placeholder="e.g., BS Information Technology" required />
                            </div>
                        )}

                        <div className="flex flex-col">
                            <label className={labelClass}>School Name *</label>
                            <input type="text" value={edu.school_name} onChange={(e) => handleEducationChange(index, 'school_name', e.target.value)} className={inputClass} required />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Year Graduated *</label>
                            <input type="number" min="1970" value={edu.year_graduated} onChange={(e) => handleEducationChange(index, 'year_graduated', e.target.value)} className={inputClass} required />
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addEducation} className="mt-4 px-6 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                + Add Another Education
            </button>
        </div>
    );

    const Step3Qualifications = () => (
        <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Credentials & Trainings</h2>

            <div className="flex flex-col space-y-4">
                <label className="font-extrabold text-gray-900 text-lg">Professional Licenses & Credentials</label>
                {formData.credentials.map((cred, index) => (
                    <div key={index} className="flex flex-col md:flex-row md:items-end gap-4 relative">
                        <div className="flex flex-col w-full">
                            <label className={labelClass}>Credential Title</label>
                            <input type="text" value={cred.credential_title} onChange={(e) => handleCredentialChange(index, e.target.value)} placeholder="e.g., PRC CPA License" className={inputClass} />
                        </div>
                        {index > 0 && (
                            <button type="button" onClick={() => removeCredential(index)} className="px-4 py-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg font-bold transition-colors">
                                ✕
                            </button>
                        )}
                    </div>
                ))}
                <div>
                    <button type="button" onClick={addCredential} className="px-6 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                        + Add Credential
                    </button>
                </div>
            </div>

            <div className="flex flex-col space-y-4 pt-8 border-t border-gray-100">
                <label className="font-extrabold text-gray-900 text-lg">Trainings & Skills Acquired</label>
                {formData.trainings.map((training, index) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-xl bg-[#F8FAFC] relative">
                        {index > 0 && (
                            <button type="button" onClick={() => removeTraining(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold bg-white px-2 py-1 rounded border border-red-100">
                                ✕ Remove
                            </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                            <div className="flex flex-col">
                                <label className={labelClass}>Training / Course Name</label>
                                <input type="text" value={training.training_cert} onChange={(e) => handleTrainingChange(index, 'training_cert', e.target.value)} placeholder="e.g., Basic Safety" className={inputClass} />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelClass}>Skill Acquired</label>
                                <input type="text" value={training.skill_acquired} onChange={(e) => handleTrainingChange(index, 'skill_acquired', e.target.value)} placeholder="e.g., Welding" className={inputClass} />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelClass}>Duration</label>
                                <input type="text" value={training.duration} onChange={(e) => handleTrainingChange(index, 'duration', e.target.value)} placeholder="e.g., 3 months" className={inputClass} />
                            </div>
                        </div>
                    </div>
                ))}
                <div>
                    <button type="button" onClick={addTraining} className="px-6 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                        + Add Training
                    </button>
                </div>
            </div>

            <div className="flex flex-col space-y-4 pt-8 border-t border-gray-100">
                <label className="font-extrabold text-gray-900 text-lg">Languages & Dialects</label>
                {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {formData.languages.map((lang, index) => (
                            <span key={index} className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center">
                                {lang}
                                <button type="button" onClick={() => removeLanguage(index)} className="ml-3 text-red-500 hover:text-red-700">✕</button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex flex-col w-full md:w-1/3">
                        <label className={labelClass}>Select Language</label>
                        <select name="currentLanguageSelect" value={formData.currentLanguageSelect} onChange={handleInputChange} className={inputClass}>
                            <option value="">Choose...</option>
                            <option value="English">English</option>
                            <option value="Filipino">Filipino</option>
                            <option value="Spanish">Spanish</option>
                            <option value="Mandarin">Mandarin</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Dialect">Other / Dialect</option>
                        </select>
                    </div>
                    {formData.currentLanguageSelect === 'Dialect' && (
                        <div className="flex flex-col w-full md:w-1/3 animate-fadeIn">
                            <label className={labelClass}>Specify Dialect</label>
                            <input type="text" name="currentDialectInput" value={formData.currentDialectInput} onChange={handleInputChange} placeholder="e.g., Cebuano" className={inputClass} />
                        </div>
                    )}
                    <button type="button" onClick={handleAddLanguage} disabled={!formData.currentLanguageSelect || (formData.currentLanguageSelect === 'Dialect' && !formData.currentDialectInput.trim())}
                        className="px-6 py-3 w-full md:w-auto bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Add to List
                    </button>
                </div>
            </div>
        </div>
    );

    const Step4Employment = () => (
        <div className="space-y-6 animate-fadeIn font-raleway">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Employment History</h2>

            <div className="bg-[#F8FAFC] p-6 sm:p-8 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="flex flex-col md:col-span-2">
                    <label className={labelClass}>Current Employment Status *</label>
                    <select name="employment_status" value={formData.employment_status} onChange={handleInputChange} className={inputClass} required>
                        <option value="">Select Status...</option>
                        <option value="Employed">Employed</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Student">Student</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className={labelClass}>Current/Target Position *</label>
                    <input type="text" name="current_position" value={formData.current_position} onChange={handleInputChange} className={inputClass} required />
                </div>
                <div className="flex flex-col">
                    <label className={labelClass}>Position at Last Employer</label>
                    <input type="text" name="position_last_employer" value={formData.position_last_employer} onChange={handleInputChange} className={inputClass} />
                </div>

                <div className="md:col-span-2 mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-5">Previous Employer Details</h3>
                </div>
                <div className="flex flex-col">
                    <label className={labelClass}>Employer Name *</label>
                    <input type="text" name="employer_name" value={formData.employer_name} onChange={handleInputChange} className={inputClass} required />
                </div>
                <div className="flex flex-col">
                    <label className={labelClass}>Nature of Business</label>
                    <input type="text" name="business_nature" value={formData.business_nature} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="flex flex-col md:col-span-2">
                    <label className={labelClass}>Employer Address *</label>
                    <input type="text" name="employer_address" value={formData.employer_address} onChange={handleInputChange} className={inputClass} required />
                </div>
            </div>
        </div>
    );

    const SuccessScreen = () => (
        <div className="text-center py-20 animate-fadeIn">
            <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border-[6px] border-green-100">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Application Received!</h2>
            <p className="text-gray-500 mb-10 max-w-md mx-auto text-lg">
                Thank you for submitting your details. Your application is currently <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">Pending</span>. We will review your profile shortly.
            </p>
            <button onClick={() => window.location.reload()} className="px-8 py-3.5 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-200">
                Submit Another Application
            </button>
        </div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 font-raleway flex justify-center">
                <div className="max-w-[1400px] w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-start mt-4 lg:mt-8 relative">

                    {/* LEFT COLUMN:
                        Added `h-fit` and `self-start` to decouple it from the right column's height.
                        Removed `space-y-8` and managed spacing internally so it's tighter.
                        Reduced the bottom margin/padding to make it physically shorter on lg devices.
                    */}
                    <div className="w-full lg:w-5/12 xl:w-4/12 lg:sticky lg:top-12 h-fit self-start animate-fadeIn">

                        <div className="inline-block bg-blue-900 text-white px-5 py-2 rounded-full text-sm font-bold tracking-wide shadow-sm mb-6">
                            Official Registration
                        </div>

                        <h1 className="text-4xl xl:text-5xl font-extrabold text-[#0F172A] leading-tight tracking-tight mb-4">
                            Start your <span className="text-blue-700">career journey</span> with us today.
                        </h1>

                        <p className="text-lg text-gray-600 leading-relaxed max-w-lg mb-6">
                            Submit your details to the Philippine Employment Service Office. Provide your background, education, and credentials, and let us connect you with the right opportunities.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
                                <div className="bg-yellow-100 text-yellow-600 p-2.5 rounded-lg shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-0.5 text-sm">Fast Processing</h4>
                                    <p className="text-xs text-gray-500">Profile routed immediately to ATS.</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
                                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-0.5 text-sm">Secure Data</h4>
                                    <p className="text-xs text-gray-500">Information is highly protected.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: The Form Card */}
                    <div className="w-full lg:w-7/12 xl:w-8/12 z-20">
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="p-6 sm:p-8 xl:p-10">
                                {!isSuccess ? (
                                    <form onSubmit={handleSubmit}>
                                        {renderStepIndicator()}

                                        <div className="min-h-[400px]">
                                            {currentStep === 1 && Step1Personal()}
                                            {currentStep === 2 && Step2Education()}
                                            {currentStep === 3 && Step3Qualifications()}
                                            {currentStep === 4 && Step4Employment()}
                                        </div>

                                        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 relative z-10">
                                            {currentStep > 1 ? (
                                                <button type="button" onClick={prevStep} className="w-full sm:w-auto px-8 py-3.5 border-2 border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
                                                    Go Back
                                                </button>
                                            ) : <div className="hidden sm:block"></div>}

                                            {currentStep < 4 ? (
                                                <button type="button" onClick={nextStep} className="w-full sm:w-auto px-8 py-3.5 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5">
                                                    Continue to Next Step
                                                </button>
                                            ) : (
                                                <button type="submit" className="w-full sm:w-auto px-10 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-gray-300 transition-all transform hover:-translate-y-0.5">
                                                    Submit Application
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                ) : (
                                    <SuccessScreen />
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default ApplicationForm;