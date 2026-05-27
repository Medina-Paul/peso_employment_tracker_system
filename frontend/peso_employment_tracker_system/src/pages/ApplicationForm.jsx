import React, { useState } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ApplicationForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State mapped to your SQL schema
    const [formData, setFormData] = useState({
        // Applicant Table
        name: '', address: '', birthdate: '', place_birth: '', sex: '',
        height: '', weight: '', religion: '', civil_status: '',
        landline_no: '', mobile_no: '', email_address: '',

        // Overseas Filipino Table
        if_overseas_filipino: 'no', of_dependent: '', of_location: '', of_status: '',

        // Education Level Table
        education: [{ educ_level: '', school_name: '', year_graduated: '' }],

        // ---> NEW: Credentials & Trainings Tables (Split from Skills) <---
        credentials: [{ credential_title: '' }],
        trainings: [{ training_cert: '', skill_acquired: '', duration: '' }],

        // Linguistics Tables
        languages: [],
        currentLanguageSelect: '',
        currentDialectInput: '',

        // Employment & Employer Tables
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

            if (!applicantRes.ok) throw new Error('Failed to create applicant');
            const newApplicant = await applicantRes.json();
            const applicantId = newApplicant.applicant_id;

            // 2. CREATE OVERSEAS STATUS
            await fetch(`${API_BASE}/overseas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicant_id: applicantId, if_overseas_filipino: formData.if_overseas_filipino,
                    of_dependent: formData.of_dependent || null, of_location: formData.of_location || null,
                    of_status: formData.of_status || null
                })
            });

            // 3. CREATE EDUCATION LEVELS
            for (const edu of formData.education) {
                if (edu.educ_level && edu.school_name && edu.year_graduated) {
                    await fetch(`${API_BASE}/education`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            applicant_id: applicantId, educ_level: edu.educ_level,
                            school_name: edu.school_name, highest_level_comp: edu.educ_level,
                            year_graduated: parseInt(edu.year_graduated)
                        })
                    });
                }
            }

            // 4. CREATE LINGUISTICS
            for (const language of formData.languages) {
                await fetch(`${API_BASE}/linguistics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ applicant_id: applicantId, linguistic: language })
                });
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
                const newEmployer = await employerRes.json();
                currentEmployerId = newEmployer.employer_id;
            }

            await fetch(`${API_BASE}/employment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicant_id: applicantId, employment_status: formData.employment_status,
                    position_last_employer: formData.position_last_employer || null,
                    current_position: formData.current_position, employer_id: currentEmployerId
                })
            });

            // ---> 6. CREATE CREDENTIALS <---
            for (const cred of formData.credentials) {
                if (cred.credential_title) {
                    // Note: You will need to build an Express route for this
                    await fetch(`${API_BASE}/credentials`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicant_id: applicantId, credential_title: cred.credential_title })
                    });
                }
            }

            // ---> 7. CREATE TRAININGS <---
            for (const training of formData.trainings) {
                if (training.training_cert || training.skill_acquired) {
                    // Note: You will need to build an Express route for this
                    await fetch(`${API_BASE}/trainings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            applicant_id: applicantId,
                            training_cert: training.training_cert,
                            skills: training.skill_acquired,
                            training_period: training.duration
                        })
                    });
                }
            }

            setIsSuccess(true);
        } catch (error) {
            console.error("Submission failed:", error);
            alert("There was an error submitting your application. Check the console for details.");
        }
    };

    // --- Dynamic Array Handlers: Education ---
    const handleEducationChange = (index, field, value) => {
        const newEdu = [...formData.education];
        newEdu[index][field] = value;
        setFormData(prev => ({ ...prev, education: newEdu }));
    };

    const addEducation = () => {
        setFormData(prev => ({
            ...prev, education: [...prev.education, { educ_level: '', school_name: '', year_graduated: '' }]
        }));
    };

    // ---> NEW: Dynamic Array Handlers: Credentials <---
    const handleCredentialChange = (index, value) => {
        const newCreds = [...formData.credentials];
        newCreds[index].credential_title = value;
        setFormData(prev => ({ ...prev, credentials: newCreds }));
    };

    const addCredential = () => {
        setFormData(prev => ({ ...prev, credentials: [...prev.credentials, { credential_title: '' }] }));
    };

    const removeCredential = (indexToRemove) => {
        setFormData(prev => ({ ...prev, credentials: prev.credentials.filter((_, index) => index !== indexToRemove) }));
    };

    // ---> NEW: Dynamic Array Handlers: Trainings <---
    const handleTrainingChange = (index, field, value) => {
        const newTrainings = [...formData.trainings];
        newTrainings[index][field] = value;
        setFormData(prev => ({ ...prev, trainings: newTrainings }));
    };

    const addTraining = () => {
        setFormData(prev => ({
            ...prev, trainings: [...prev.trainings, { training_cert: '', skill_acquired: '', duration: '' }]
        }));
    };

    const removeTraining = (indexToRemove) => {
        setFormData(prev => ({ ...prev, trainings: prev.trainings.filter((_, index) => index !== indexToRemove) }));
    };

    // --- Handlers: Languages ---
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

    const removeLanguage = (indexToRemove) => {
        setFormData(prev => ({ ...prev, languages: prev.languages.filter((_, index) => index !== indexToRemove) }));
    };

    // --- Sub-components for Form Steps ---
    const renderStepIndicator = () => {
        const steps = ['Personal Details', 'Education', 'Qualifications', 'Employment'];
        return (
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 font-raleway">
                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = currentStep === stepNum;
                    const isCompleted = currentStep > stepNum;
                    return (
                        <div key={step} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border-2 
                ${isActive ? 'bg-blue-700 text-white border-blue-700' :
                                    isCompleted ? 'bg-white text-blue-700 border-blue-700' : 'bg-gray-100 text-gray-400 border-gray-100'}`}>
                                {isCompleted ? '✓' : stepNum}
                            </div>
                            <span className={`ml-2 text-sm font-medium hidden sm:block ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                {step}
                            </span>
                            {index < steps.length - 1 && (
                                <div className="w-10 sm:w-20 h-1 mx-2 sm:mx-4 bg-gray-200 rounded">
                                    <div className={`h-full bg-blue-700 rounded transition-all duration-300 ${isCompleted ? 'w-full' : 'w-0'}`}></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const Step1Personal = () => (
        <div className="space-y-6 animate-fadeIn font-raleway">
            {/* Same as your original Step 1 */}
            <h2 className="text-2xl font-bold text-blue-900 border-b-2 border-red-600 pb-2 inline-block mb-4">Personal & Background</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Address *</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Birthdate *</label>
                    <input type="date" name="birthdate" value={formData.birthdate} onChange={handleInputChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Place of Birth *</label>
                    <input type="text" name="place_birth" value={formData.place_birth} onChange={handleInputChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>

                <div className="flex flex-col md:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">Sex *</label>
                            <select name="sex" value={formData.sex} onChange={handleInputChange} className="border border-gray-300 rounded p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Select...</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="O">Other</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">Civil Status</label>
                            <select name="civil_status" value={formData.civil_status} onChange={handleInputChange} className="border border-gray-300 rounded p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Select...</option>
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                                <option value="separated">Separated</option>
                                <option value="widow">Widow</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">Height (cm)</label>
                            <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">Weight (kg)</label>
                            <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Mobile No *</label>
                    <input type="text" name="mobile_no" value={formData.mobile_no} onChange={handleInputChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input type="email" name="email_address" value={formData.email_address} onChange={handleInputChange} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-4 mb-4">
                    <label className="font-semibold text-blue-900">Are you an Overseas Filipino?</label>
                    <div className="flex items-center space-x-2">
                        <input type="radio" id="ofw_yes" name="if_overseas_filipino" value="yes" checked={formData.if_overseas_filipino === 'yes'} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                        <label htmlFor="ofw_yes">Yes</label>
                        <input type="radio" id="ofw_no" name="if_overseas_filipino" value="no" checked={formData.if_overseas_filipino === 'no'} onChange={handleInputChange} className="w-4 h-4 text-blue-600 ml-4" />
                        <label htmlFor="ofw_no">No</label>
                    </div>
                </div>

                {formData.if_overseas_filipino === 'yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1">Dependent</label>
                            <select name="of_dependent" value={formData.of_dependent} onChange={handleInputChange} className="border border-gray-300 rounded p-2 bg-white">
                                <option value="">Select...</option>
                                <option value="wife">Wife</option>
                                <option value="husband">Husband</option>
                                <option value="parent">Parent</option>
                                <option value="son">Son</option>
                                <option value="daughter">Daughter</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1">Location</label>
                            <select name="of_location" value={formData.of_location} onChange={handleInputChange} className="border border-gray-300 rounded p-2 bg-white">
                                <option value="">Select...</option>
                                <option value="land-based">Land-based</option>
                                <option value="sea-based">Sea-based</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-700 mb-1">Status</label>
                            <select name="of_status" value={formData.of_status} onChange={handleInputChange} className="border border-gray-300 rounded p-2 bg-white">
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
            {/* Same as your original Step 2 */}
            <h2 className="text-2xl font-bold text-blue-900 border-b-2 border-red-600 pb-2 inline-block mb-4">Education Details</h2>
            {formData.education.map((edu, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                    {index > 0 && (
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }))}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-bold">
                            ✕ Remove
                        </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">Level *</label>
                            <select value={edu.educ_level} onChange={(e) => handleEducationChange(index, 'educ_level', e.target.value)} className="border border-gray-300 rounded p-2 bg-white">
                                <option value="">Select Level</option>
                                <option value="elementary">Elementary</option>
                                <option value="high school">High School</option>
                                <option value="college">College</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">School Name *</label>
                            <input type="text" value={edu.school_name} onChange={(e) => handleEducationChange(index, 'school_name', e.target.value)} className="border border-gray-300 rounded p-2" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-1">Year Graduated *</label>
                            <input type="number" min="1970" value={edu.year_graduated} onChange={(e) => handleEducationChange(index, 'year_graduated', e.target.value)} className="border border-gray-300 rounded p-2" />
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addEducation} className="mt-2 px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-700 rounded hover:bg-blue-50 transition-colors">
                + Add Education
            </button>
        </div>
    );

    // ---> NEW: Step 3 completely re-written for Credentials and Trainings <---
    const Step3Qualifications = () => (
        <div className="space-y-6 animate-fadeIn font-raleway">
            <h2 className="text-2xl font-bold text-blue-900 border-b-2 border-red-600 pb-2 inline-block mb-4">Credentials & Trainings</h2>

            {/* Credentials Section */}
            <div className="flex flex-col space-y-4">
                <label className="font-semibold text-gray-700">Professional Licenses & Credentials</label>
                {formData.credentials.map((cred, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative flex flex-col md:flex-row md:items-center gap-4">
                        {index > 0 && (
                            <button type="button" onClick={() => removeCredential(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-bold">
                                ✕ Remove
                            </button>
                        )}
                        <div className="flex flex-col w-full">
                            <label className="text-sm text-gray-600 mb-1">Credential Title</label>
                            <input type="text" value={cred.credential_title} onChange={(e) => handleCredentialChange(index, e.target.value)} placeholder="e.g., PRC CPA License, Civil Service Prof." className="border border-gray-300 rounded p-2 w-full md:w-2/3" />
                        </div>
                    </div>
                ))}
                <div>
                    <button type="button" onClick={addCredential} className="px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-700 rounded hover:bg-blue-50 transition-colors">
                        + Add Credential
                    </button>
                </div>
            </div>

            {/* Trainings Section */}
            <div className="flex flex-col space-y-4 mt-8 pt-6 border-t border-gray-200">
                <label className="font-semibold text-gray-700">Trainings & Skills Acquired</label>
                {formData.trainings.map((training, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative grid grid-cols-1 md:grid-cols-3 gap-4">
                        {index > 0 && (
                            <button type="button" onClick={() => removeTraining(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-bold">
                                ✕ Remove
                            </button>
                        )}
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600 mb-1">Training / Course Name</label>
                            <input type="text" value={training.training_cert} onChange={(e) => handleTrainingChange(index, 'training_cert', e.target.value)} placeholder="e.g., Basic Computer Literacy" className="border border-gray-300 rounded p-2" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600 mb-1">Skill Acquired</label>
                            <input type="text" value={training.skill_acquired} onChange={(e) => handleTrainingChange(index, 'skill_acquired', e.target.value)} placeholder="e.g., Digital Marketing, SAP ERP" className="border border-gray-300 rounded p-2" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm text-gray-600 mb-1">Time Period / Duration</label>
                            <input type="text" value={training.duration} onChange={(e) => handleTrainingChange(index, 'duration', e.target.value)} placeholder="e.g., 3 months, 2023" className="border border-gray-300 rounded p-2" />
                        </div>
                    </div>
                ))}
                <div>
                    <button type="button" onClick={addTraining} className="px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-700 rounded hover:bg-blue-50 transition-colors">
                        + Add Training
                    </button>
                </div>
            </div>

            {/* Languages Section */}
            <div className="flex flex-col space-y-4 mt-8 pt-6 border-t border-gray-200">
                <label className="font-semibold text-gray-700">Languages & Dialects</label>
                {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.languages.map((lang, index) => (
                            <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center shadow-sm">
                                {lang}
                                <button type="button" onClick={() => removeLanguage(index)} className="ml-2 text-red-500 hover:text-red-700 font-bold">×</button>
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex flex-col w-full md:w-1/3">
                        <label className="text-sm text-gray-600 mb-1">Select Language</label>
                        <select name="currentLanguageSelect" value={formData.currentLanguageSelect} onChange={handleInputChange} className="border border-gray-300 rounded p-2 bg-white outline-none">
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
                            <label className="text-sm text-gray-600 mb-1">Specify Dialect</label>
                            <input type="text" name="currentDialectInput" value={formData.currentDialectInput} onChange={handleInputChange} placeholder="e.g., Cebuano, Ilocano" className="border border-gray-300 rounded p-2 outline-none" />
                        </div>
                    )}
                    <button type="button" onClick={handleAddLanguage} disabled={!formData.currentLanguageSelect || (formData.currentLanguageSelect === 'Dialect' && !formData.currentDialectInput.trim())} className="px-6 py-2 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Add Language
                    </button>
                </div>
            </div>
        </div>
    );

    const Step4Employment = () => (
        <div className="space-y-6 animate-fadeIn font-raleway">
            {/* Same as your original Step 4 */}
            <h2 className="text-2xl font-bold text-blue-900 border-b-2 border-red-600 pb-2 inline-block mb-4">Employment History</h2>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Current Employment Status *</label>
                    <select name="employment_status" value={formData.employment_status} onChange={handleInputChange} className="border border-gray-300 rounded p-2 bg-white" required>
                        <option value="">Select Status...</option>
                        <option value="Employed">Employed</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Student">Student</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Current/Target Position *</label>
                    <input type="text" name="current_position" value={formData.current_position} onChange={handleInputChange} className="border border-gray-300 rounded p-2" required />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Position at Last Employer</label>
                    <input type="text" name="position_last_employer" value={formData.position_last_employer} onChange={handleInputChange} className="border border-gray-300 rounded p-2" />
                </div>

                <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Employer Details</h3>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Employer Name *</label>
                    <input type="text" name="employer_name" value={formData.employer_name} onChange={handleInputChange} className="border border-gray-300 rounded p-2" required />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Nature of Business</label>
                    <input type="text" name="business_nature" value={formData.business_nature} onChange={handleInputChange} className="border border-gray-300 rounded p-2" />
                </div>
                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Employer Address *</label>
                    <input type="text" name="employer_address" value={formData.employer_address} onChange={handleInputChange} className="border border-gray-300 rounded p-2" required />
                </div>
            </div>
        </div>
    );

    const SuccessScreen = () => (
        <div className="text-center py-16 animate-fadeIn font-raleway">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl text-blue-700 font-bold">✓</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Received!</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Thank you for submitting your details. Your application status is currently <span className="font-bold text-blue-700">Pending</span>. We will review your profile and reach out to you shortly.
            </p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors">
                Submit Another Application
            </button>
        </div>
    );

    return (<Layout>
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center font-raleway">
            <div className="max-w-4xl w-full bg-white overflow-hidden shadow-xl rounded-xl">

                <div className="p-6 sm:p-10">
                    {!isSuccess ? (
                        <form onSubmit={handleSubmit}>
                            {renderStepIndicator()}

                            <div className="min-h-[400px]">
                                {currentStep === 1 && Step1Personal()}
                                {currentStep === 2 && Step2Education()}
                                {currentStep === 3 && Step3Qualifications()}
                                {currentStep === 4 && Step4Employment()}
                            </div>

                            {/* Form Navigation Controls */}
                            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                                {currentStep > 1 ? (
                                    <button type="button" onClick={prevStep} className="px-6 py-2 border border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                        Back
                                    </button>
                                ) : <div></div>}

                                {currentStep < 4 ? (
                                    <button type="button" onClick={nextStep} className="px-6 py-2 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 shadow-md transition-all transform hover:-translate-y-0.5">
                                        Continue to Next Step
                                    </button>
                                ) : (
                                    <button type="submit" className="px-8 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 shadow-md transition-all transform hover:-translate-y-0.5">
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
    </Layout>
    );
};

export default ApplicationForm;