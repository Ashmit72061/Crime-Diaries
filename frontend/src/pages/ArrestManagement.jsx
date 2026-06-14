import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Save, FileCheck, ShieldAlert, User, MapPin, CheckSquare, Phone, Upload } from "lucide-react";
import { DISTRICTS_AND_STATIONS } from "../utils/policeData.js";

export default function ArrestManagement() {
  const { onSubmitReport, addNotification } = useOutletContext();
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    district: "New Delhi District (NDD)",
    policeStation: "Parliament Street",
    firDdNumber: "",
    firDate: "",
    act: "",
    sections: "",
    crimeHead: "",
    fullName: "",
    fatherName: "",
    age: "",
    gender: "",
    address: "",
    dateOfArrest: "",
    timeOfArrest: "",
    placeOfArrest: "",
    nafisPrepared: false,
    dossierPrepared: false,
    searchSlipPrepared: false,
    addressVerified: false,
    verifyingOfficerName: "",
    verifyingOfficerRank: "",
    kinName: "",
    kinMobile: "",
    kinRelationship: "",
    photoPath: ""
  });

  const [errors, setErrors] = useState({});

  const steps = [
    { num: 1, label: "FIR & Spot" },
    { num: 2, label: "Demographics" },
    { num: 3, label: "Verifications" },
    { num: 4, label: "Attachments" }
  ];

  const handleQuickFill = () => {
    setFormData({
      district: "New Delhi District (NDD)",
      policeStation: "Parliament Street",
      firDdNumber: "FIR-104/2026",
      firDate: "2026-06-08",
      act: "IPC",
      sections: "Sec 379/411 (Theft & Receiving Stolen Property)",
      crimeHead: "Burglary",
      fullName: "Ramesh Kumar Yadav",
      fatherName: "Sohan Lal Yadav",
      age: "28",
      gender: "Male",
      address: "Jhuggi No. 12, Yamuna Bank Khas, Delhi",
      dateOfArrest: "2026-06-12",
      timeOfArrest: "23:45",
      placeOfArrest: "Nizamuddin Railway Station, Platform 3",
      nafisPrepared: true,
      dossierPrepared: true,
      searchSlipPrepared: true,
      addressVerified: true,
      verifyingOfficerName: "Sub-Inspector Sandeep Sharma",
      verifyingOfficerRank: "Sub-Inspector",
      kinName: "Sunita Yadav",
      kinMobile: "9899123456",
      kinRelationship: "Wife",
      photoPath: "ramesh_yadav_mugshot.jpg"
    });
    setErrors({});
    addNotification("Arrest mock data loaded successfully.", "info");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setFormData(prev => ({
      ...prev,
      district: selectedDistrict,
      policeStation: ""
    }));
    if (errors.district) {
      setErrors(prev => ({ ...prev, district: null, policeStation: null }));
    }
  };

  const handleToggleChange = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.district) tempErrors.district = "District is required";
    if (!formData.policeStation) tempErrors.policeStation = "Police Station is required";
    if (!formData.firDdNumber) tempErrors.firDdNumber = "FIR/DD Number is required";
    if (!formData.fullName) tempErrors.fullName = "Full Name is required";
    if (!formData.age) tempErrors.age = "Age is required";
    if (!formData.dateOfArrest) tempErrors.dateOfArrest = "Date of Arrest is required";
    if (!formData.placeOfArrest) tempErrors.placeOfArrest = "Place of Arrest is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveDraft = () => {
    addNotification("Arrest record draft saved successfully.", "success");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmitReport("Arrest record docket", formData, "arrest");
    } else {
      addNotification("Please correct the highlighted form errors.", "danger");
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const el = document.getElementsByName(firstErrorKey)[0];
        if (el) el.focus();
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>Arrest Management & Verification</h1>
          <p className="page-desc">Register arrested suspects, verify NAFIS/Dossiers, and notify emergency contacts.</p>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary transition-standard"
          onClick={handleQuickFill}
          aria-label="Pre-fill arrest form fields with mock data"
        >
          <span>Fill Test Data</span>
        </button>
      </div>

      {/* Stepper Progress bar */}
      <div className="stepper" aria-label="Arrest Steps Progress">
        {steps.map(step => (
          <button
            key={step.num}
            type="button"
            className={`stepper-step ${activeStep === step.num ? "active" : activeStep > step.num ? "completed" : ""}`}
            onClick={() => setActiveStep(step.num)}
            aria-label={`Go to step ${step.num}: ${step.label}`}
          >
            <div className="stepper-circle">{step.num}</div>
            <span className="stepper-label">{step.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Sticky Actions Toolbar */}
        <div className="form-actions-toolbar transition-standard">
          <div className="form-actions-toolbar-left">
            <span className="toolbar-step-badge" translate="no">Step {activeStep} of 4</span>
            <span className="toolbar-step-title">{steps[activeStep - 1].label}</span>
          </div>
          <div className="form-actions-toolbar-right">
            {activeStep > 1 && (
              <button 
                type="button" 
                className="btn btn-secondary transition-standard"
                onClick={() => setActiveStep(prev => prev - 1)}
                aria-label="Go to previous step"
              >
                <span>Back</span>
              </button>
            )}
            
            <button 
              type="button" 
              className="btn btn-secondary transition-standard"
              onClick={handleSaveDraft}
              aria-label="Save draft of arrest docket"
            >
              <Save size={16} aria-hidden="true" className="menu-icon" />
              <span>Save Draft</span>
            </button>
            
            {activeStep < 4 ? (
              <button 
                type="button" 
                className="btn btn-primary transition-standard"
                onClick={() => setActiveStep(prev => prev + 1)}
                aria-label="Go to next step"
              >
                <span>Next</span>
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary transition-standard"
                aria-label="Submit arrest docket and create police docket"
              >
                <FileCheck size={16} aria-hidden="true" className="menu-icon" />
                <span>Submit Arrest</span>
              </button>
            )}
          </div>
        </div>

        {/* STEP 1: FIR & SPOT DETAILS */}
        {activeStep === 1 && (
          <div className="transition-standard">
            {/* SECTION 1: FIR INFORMATION */}
            <div className="card">
              <div className="card-title">
                <ShieldAlert size={18} aria-hidden="true" />
                <span>FIR / Crime Classification</span>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required" htmlFor="district">District</label>
                  <select
                    id="district"
                    name="district"
                    className={`form-control ${errors.district ? "border-red-500" : ""}`}
                    value={formData.district}
                    onChange={handleDistrictChange}
                    required
                  >
                    <option value="">Select District</option>
                    {Object.keys(DISTRICTS_AND_STATIONS).map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                  {errors.district && <span className="text-red-500 text-xs mt-1">{errors.district}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="policeStation">Police Station</label>
                  <select
                    id="policeStation"
                    name="policeStation"
                    className={`form-control ${errors.policeStation ? "border-red-500" : ""}`}
                    value={formData.policeStation}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.district}
                  >
                    <option value="">Select Police Station</option>
                    {formData.district && DISTRICTS_AND_STATIONS[formData.district]?.map((ps) => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                  {errors.policeStation && <span className="text-red-500 text-xs mt-1">{errors.policeStation}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="firDdNumber">FIR/DD Number</label>
                  <input
                    type="text"
                    id="firDdNumber"
                    name="firDdNumber"
                    className={`form-control ${errors.firDdNumber ? "border-red-500" : ""}`}
                    value={formData.firDdNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. FIR-104/2026…"
                    required
                    autocomplete="off"
                  />
                  {errors.firDdNumber && <span className="text-red-500 text-xs mt-1">{errors.firDdNumber}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="firDate">FIR Date</label>
                  <input
                    type="date"
                    id="firDate"
                    name="firDate"
                    className="form-control"
                    value={formData.firDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="act">Act</label>
                  <input
                    type="text"
                    id="act"
                    name="act"
                    className="form-control"
                    value={formData.act}
                    onChange={handleInputChange}
                    placeholder="e.g. IPC / BNS…"
                    autocomplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sections">Sections</label>
                  <input
                    type="text"
                    id="sections"
                    name="sections"
                    className="form-control"
                    value={formData.sections}
                    onChange={handleInputChange}
                    placeholder="e.g. Sec 379/411…"
                    autocomplete="off"
                  />
                </div>

                <div className="form-group col-span-full">
                  <label className="form-label" htmlFor="crimeHead">Crime Head</label>
                  <input
                    type="text"
                    id="crimeHead"
                    name="crimeHead"
                    className="form-control"
                    value={formData.crimeHead}
                    onChange={handleInputChange}
                    placeholder="e.g. Burglary / Snatching…"
                    autocomplete="off"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: ARREST LOGISTICS */}
            <div className="card">
              <div className="card-title">
                <MapPin size={18} aria-hidden="true" />
                <span>Arrest Logistics</span>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required" htmlFor="dateOfArrest">Date Of Arrest</label>
                  <input
                    type="date"
                    id="dateOfArrest"
                    name="dateOfArrest"
                    className={`form-control ${errors.dateOfArrest ? "border-red-500" : ""}`}
                    value={formData.dateOfArrest}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.dateOfArrest && <span className="text-red-500 text-xs mt-1">{errors.dateOfArrest}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="timeOfArrest">Time Of Arrest</label>
                  <input
                    type="time"
                    id="timeOfArrest"
                    name="timeOfArrest"
                    className="form-control"
                    value={formData.timeOfArrest}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group col-span-full">
                  <label className="form-label required" htmlFor="placeOfArrest">Place Of Arrest</label>
                  <input
                    type="text"
                    id="placeOfArrest"
                    name="placeOfArrest"
                    className={`form-control ${errors.placeOfArrest ? "border-red-500" : ""}`}
                    value={formData.placeOfArrest}
                    onChange={handleInputChange}
                    placeholder="e.g. Nizamuddin Railway Station, Platform 3…"
                    required
                    autocomplete="off"
                  />
                  {errors.placeOfArrest && <span className="text-red-500 text-xs mt-1">{errors.placeOfArrest}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DEMOGRAPHICS */}
        {activeStep === 2 && (
          <div className="card transition-standard">
            <div className="card-title">
              <User size={18} aria-hidden="true" />
              <span>Arrested Person Demographics</span>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required" htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className={`form-control ${errors.fullName ? "border-red-500" : ""}`}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full name of suspect…"
                  required
                  autocomplete="off"
                />
                {errors.fullName && <span className="text-red-500 text-xs mt-1">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fatherName">Father Name</label>
                <input
                  type="text"
                  id="fatherName"
                  name="fatherName"
                  className="form-control"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  placeholder="Father's name…"
                  autocomplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  className={`form-control ${errors.age ? "border-red-500" : ""}`}
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Age in years…"
                  inputMode="numeric"
                  required
                  autocomplete="off"
                />
                {errors.age && <span className="text-red-500 text-xs mt-1">{errors.age}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group col-span-full">
                <label className="form-label" htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  className="form-control"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Permanent or temporary residential address…"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFICATIONS */}
        {activeStep === 3 && (
          <div className="card transition-standard">
            <div className="card-title">
              <CheckSquare size={18} aria-hidden="true" />
              <span>National Verification Systems (NAFIS & Dossiers)</span>
            </div>
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <span className="form-label">NAFIS Prepared</span>
                  <label className="toggle-container" htmlFor="nafis-toggle">
                    <input
                      type="checkbox"
                      id="nafis-toggle"
                      className="toggle-checkbox"
                      checked={formData.nafisPrepared}
                      onChange={() => handleToggleChange("nafisPrepared")}
                    />
                    <div className="toggle-switch" aria-hidden="true"></div>
                    <span className="text-xs font-medium">
                      {formData.nafisPrepared ? "NAFIS Verified" : "Pending Check"}
                    </span>
                  </label>
                </div>

                <div className="form-group">
                  <span className="form-label">Dossier Prepared</span>
                  <label className="toggle-container" htmlFor="dossier-toggle">
                    <input
                      type="checkbox"
                      id="dossier-toggle"
                      className="toggle-checkbox"
                      checked={formData.dossierPrepared}
                      onChange={() => handleToggleChange("dossierPrepared")}
                    />
                    <div className="toggle-switch" aria-hidden="true"></div>
                    <span className="text-xs font-medium">
                      {formData.dossierPrepared ? "Dossier Active" : "No Dossier"}
                    </span>
                  </label>
                </div>

                <div className="form-group">
                  <span className="form-label">Search Slip Prepared</span>
                  <label className="toggle-container" htmlFor="search-toggle">
                    <input
                      type="checkbox"
                      id="search-toggle"
                      className="toggle-checkbox"
                      checked={formData.searchSlipPrepared}
                      onChange={() => handleToggleChange("searchSlipPrepared")}
                    />
                    <div className="toggle-switch" aria-hidden="true"></div>
                    <span className="text-xs font-medium">
                      {formData.searchSlipPrepared ? "Slip Logged" : "Not Logged"}
                    </span>
                  </label>
                </div>
              </div>

              <hr className="border-t border-slate-200 my-2" />

              <div className="form-grid">
                <div className="form-group">
                  <span className="form-label">Address Verified</span>
                  <label className="toggle-container" htmlFor="addr-verified-toggle">
                    <input
                      type="checkbox"
                      id="addr-verified-toggle"
                      className="toggle-checkbox"
                      checked={formData.addressVerified}
                      onChange={() => handleToggleChange("addressVerified")}
                    />
                    <div className="toggle-switch" aria-hidden="true"></div>
                    <span className="text-xs font-medium">
                      {formData.addressVerified ? "Verified Spot Visit" : "Pending Verification"}
                    </span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="verifyingOfficerName">Verifying Officer Name</label>
                  <input
                    type="text"
                    id="verifyingOfficerName"
                    name="verifyingOfficerName"
                    className="form-control"
                    value={formData.verifyingOfficerName}
                    onChange={handleInputChange}
                    placeholder="e.g. Sub-Inspector Sandeep Sharma…"
                    autocomplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="verifyingOfficerRank">Verifying Officer Rank</label>
                  <input
                    type="text"
                    id="verifyingOfficerRank"
                    name="verifyingOfficerRank"
                    className="form-control"
                    value={formData.verifyingOfficerRank}
                    onChange={handleInputChange}
                    placeholder="e.g. Sub-Inspector…"
                    autocomplete="off"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ATTACHMENTS & NOTIFICATION */}
        {activeStep === 4 && (
          <div className="transition-standard">
            {/* SECTION 5: INFORMATION GIVEN TO */}
            <div className="card">
              <div className="card-title">
                <Phone size={18} aria-hidden="true" />
                <span>Emergency / Next-Of-Kin Notification (Required Sec 41A CrPC)</span>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="kinName">Relative Name</label>
                  <input
                    type="text"
                    id="kinName"
                    name="kinName"
                    className="form-control"
                    value={formData.kinName}
                    onChange={handleInputChange}
                    placeholder="Name of person informed…"
                    autocomplete="off"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="kinMobile">Mobile</label>
                  <input
                    type="tel"
                    id="kinMobile"
                    name="kinMobile"
                    className="form-control"
                    value={formData.kinMobile}
                    onChange={handleInputChange}
                    placeholder="Relative mobile number…"
                    inputMode="tel"
                    autocomplete="off"
                  />
                </div>

                <div className="form-group col-span-full">
                  <label className="form-label" htmlFor="kinRelationship">Relationship</label>
                  <input
                    type="text"
                    id="kinRelationship"
                    name="kinRelationship"
                    className="form-control"
                    value={formData.kinRelationship}
                    onChange={handleInputChange}
                    placeholder="e.g. Father / Mother / Spouse…"
                    autocomplete="off"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 6: ATTACHMENTS */}
            <div className="card">
              <div className="card-title">
                <Upload size={18} aria-hidden="true" />
                <span>Evidence & Attachments</span>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="photoPath">Upload Suspect Mugshot / Photograph</label>
                <input
                  type="file"
                  id="photoPath"
                  className="file-upload-input"
                  onChange={(e) => setFormData(prev => ({ ...prev, photoPath: e.target.files[0]?.name || "" }))}
                />
                {formData.photoPath && (
                  <div className="text-xs text-green-600 font-medium mt-1">
                    Selected file: {formData.photoPath}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
