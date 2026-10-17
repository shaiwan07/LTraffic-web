"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { FiCheckCircle, FiImage, FiUploadCloud, FiX } from "react-icons/fi";

type RadioOption = {
    label: string;
    value: string;
};

function RadioOptions({
    name,
    label,
    options,
    required = false,
}: {
    name: string;
    label: string;
    options: RadioOption[];
    required?: boolean;
}) {
    return (
        <fieldset className="incident-radio-field">
            <legend className="form-label">{label}</legend>
            <div className="incident-radio-options">
                {options.map(({ label: optionLabel, value }) => (
                    <div className="form-check" key={value}>
                        <input
                            className="form-check-input"
                            id={`${name}-${value}`}
                            name={name}
                            type="radio"
                            value={value}
                            required={required}
                        />
                        <label className="form-check-label" htmlFor={`${name}-${value}`}>
                            {optionLabel}
                        </label>
                    </div>
                ))}
            </div>
        </fieldset>
    );
}

export default function IncidentReportForm({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");

    function addFiles(fileList: FileList | null) {
        if (!fileList) return;
        const imageFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
        if (imageFiles.length === 0) return;

        const nextFiles = [...files, ...imageFiles];
        setFiles(nextFiles);
        const transfer = new DataTransfer();
        nextFiles.forEach((file) => transfer.items.add(file));
        if (fileInputRef.current) fileInputRef.current.files = transfer.files;
        setSubmitMessage("");
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        addFiles(event.currentTarget.files);
    }

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setIsDragging(false);
        addFiles(event.dataTransfer.files);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitMessage("Your report is complete, but online submission is not connected yet. No report has been sent.");
    }

    function removeFile(indexToRemove: number) {
        const nextFiles = files.filter((_, index) => index !== indexToRemove);
        setFiles(nextFiles);
        const transfer = new DataTransfer();
        nextFiles.forEach((file) => transfer.items.add(file));
        if (fileInputRef.current) fileInputRef.current.files = transfer.files;
    }

    return (
        <section className="admin-module-page incident-page">
            <div className="admin-page-heading">
                <div>
                    <span className="admin-eyebrow">Incident reporting</span>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
            </div>

            <div className="incident-form-shell">
                <div className="incident-form-intro">
                    <span className="incident-form-icon"><FiCheckCircle aria-hidden="true" /></span>
                    <div>
                        <h2>Accident, Incident, Near Miss and Environmental Reporting</h2>
                        <p>Please complete the form as fully as possible. All incidents and near misses must be reported in line with LTraffic policies and procedures.</p>
                    </div>
                </div>

                <form className="incident-form" onSubmit={handleSubmit}>
                    <section className="incident-form-section" aria-labelledby="incident-details-heading">
                        <div className="incident-section-heading">
                            <span>01</span>
                            <h3 id="incident-details-heading">Operative &amp; location details</h3>
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="operative-name">Operatives name <span className="incident-required">Required</span></label>
                                <input className="form-control" id="operative-name" name="operativeName" type="text" autoComplete="name" required />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="incident-date">Date/time of incident <span className="incident-required">Required</span></label>
                                <input className="form-control" id="incident-date" name="incidentDate" type="datetime-local" required />
                            </div>
                            <div className="col-12">
                                <RadioOptions
                                    name="incidentType"
                                    label="Type of incident"
                                    required
                                    options={[
                                        { label: "Accident", value: "accident" },
                                        { label: "Customer complaint", value: "customer-complaint" },
                                        { label: "Customer engagement", value: "customer-engagement" },
                                        { label: "Environmental incident", value: "environmental-incident" },
                                        { label: "Near miss", value: "near-miss" },
                                        { label: "Service strike", value: "service-strike" },
                                    ]}
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="incident-location">Location of incident <span className="incident-required">Required</span></label>
                                <input className="form-control" id="incident-location" name="location" type="text" required />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="reported-by">Reported by <span className="incident-required">Required</span></label>
                                <input className="form-control" id="reported-by" name="reportedBy" type="text" autoComplete="name" required />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="incident-description">What happened? <span className="incident-required">Required</span></label>
                                <textarea className="form-control" id="incident-description" name="description" rows={4} required />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="parties-involved">Details of all parties involved</label>
                                <textarea className="form-control" id="parties-involved" name="partiesInvolved" rows={3} placeholder="Include full names, insurance details, and other relevant information." />
                            </div>
                        </div>
                    </section>

                    <section className="incident-form-section" aria-labelledby="injury-details-heading">
                        <div className="incident-section-heading">
                            <span>02</span>
                            <h3 id="injury-details-heading">Details of any injuries</h3>
                        </div>
                        <div className="row g-3">
                            <div className="col-12">
                                <RadioOptions name="injuriesOccurred" label="Was anyone injured?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="injured-party">Name of injured party</label>
                                <input className="form-control" id="injured-party" name="injuredParty" type="text" />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="injury-details">Injuries (please give details)</label>
                                <textarea className="form-control" id="injury-details" name="injuryDetails" rows={3} />
                            </div>
                        </div>
                    </section>

                    <section className="incident-form-section" aria-labelledby="reporting-details-heading">
                        <div className="incident-section-heading">
                            <span>03</span>
                            <h3 id="reporting-details-heading">Reporting of incident</h3>
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-md-4">
                                <RadioOptions name="reportedToManager" label="Did you report it to your manager?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
                            </div>
                            <div className="col-12 col-md-4">
                                <RadioOptions name="companyAdvised" label="Did you advise a company concerned?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
                            </div>
                            <div className="col-12 col-md-4">
                                <RadioOptions name="companyNotifiedLater" label="Was the company notified at a later date?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="company-report-details">If yes, please advise details of company and name of individual reported to</label>
                                <textarea className="form-control" id="company-report-details" name="companyReportDetails" rows={3} />
                            </div>
                        </div>
                    </section>

                    <section className="incident-form-section" aria-labelledby="witness-details-heading">
                        <div className="incident-section-heading">
                            <span>04</span>
                            <h3 id="witness-details-heading">Witness details</h3>
                        </div>
                        <div className="row g-3">
                            <div className="col-12">
                                <RadioOptions name="witnessesPresent" label="Were there any witnesses?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="witness-name">Witness name</label>
                                <input className="form-control" id="witness-name" name="witnessName" type="text" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="witness-contact">Witness contact number</label>
                                <input className="form-control" id="witness-contact" name="witnessContact" type="tel" autoComplete="tel" />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="witness-address">Witness address</label>
                                <input className="form-control" id="witness-address" name="witnessAddress" type="text" autoComplete="street-address" />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="other-witness-details">Other witnesses details</label>
                                <textarea className="form-control" id="other-witness-details" name="otherWitnessDetails" rows={3} />
                            </div>
                        </div>
                    </section>

                    <section className="incident-form-section incident-upload-section" aria-labelledby="supporting-images-heading">
                        <div className="incident-section-heading">
                            <span>05</span>
                            <h3 id="supporting-images-heading">Supporting images</h3>
                        </div>
                        <label
                            className={`incident-upload-zone${isDragging ? " is-dragging" : ""}`}
                            htmlFor="supporting-images"
                            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            <FiUploadCloud aria-hidden="true" />
                            <span>Drag and drop images here, or <strong>browse files</strong></span>
                            <small>Image files only, multiple files accepted</small>
                        </label>
                        <input
                            ref={fileInputRef}
                            className="visually-hidden"
                            id="supporting-images"
                            name="supportingImages"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        {files.length > 0 && (
                            <ul className="incident-file-list" aria-label="Selected supporting images">
                                {files.map((file, index) => (
                                    <li key={`${file.name}-${file.lastModified}-${index}`}>
                                        <FiImage aria-hidden="true" />
                                        <span>{file.name}</span>
                                        <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(index)}>
                                            <FiX aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="incident-upload-note">Do not include sensitive personal information in uploaded images.</p>
                    </section>

                    <div className="incident-submit-area">
                        <div className="form-check incident-confirm-check">
                            <input className="form-check-input" id="confirm-accuracy" name="confirmAccuracy" type="checkbox" required />
                            <label className="form-check-label" htmlFor="confirm-accuracy">
                                I confirm that all information entered above is true to the best of my knowledge.
                            </label>
                        </div>
                        <button className="btn btn-primary incident-submit-button" type="submit">Confirm report</button>
                        {submitMessage && <p className="incident-submit-message" role="status">{submitMessage}</p>}
                    </div>
                </form>
            </div>
        </section>
    );
}