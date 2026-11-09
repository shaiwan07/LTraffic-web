"use client";

import { fetchAdminApi } from "@/app/admin/admin-api";
import { useContext, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { FiCheckCircle, FiImage, FiUploadCloud, FiX } from "react-icons/fi";
import { AdminRoleContext } from "./admin-role";

type RadioOption = {
    label: string;
    value: string;
};

function RadioOptions({
    name,
    label,
    options,
    required = false,
    register,
    errors,
}: {
    name: keyof IncidentFormValues;
    label: string;
    options: RadioOption[];
    required?: boolean;
    register: UseFormRegister<IncidentFormValues>;
    errors: FieldErrors<IncidentFormValues>;
}) {
    const error = errors[name]?.message as string | undefined;
    return (
        <fieldset className="incident-radio-field">
            <legend className="form-label">{label}{required ? <span className="incident-required" aria-label="Required"> *</span> : null}</legend>
            <div className="incident-radio-options">
                {options.map(({ label: optionLabel, value }) => (
                    <div className="form-check" key={value}>
                        <input
                            className={`form-check-input${error ? " is-invalid" : ""}`}
                            id={`${name}-${value}`}
                            type="radio"
                            value={value}
                            {...register(name, { required: required ? `${label} is required.` : false })}
                        />
                        <label className="form-check-label" htmlFor={`${name}-${value}`}>{optionLabel}</label>
                    </div>
                ))}
            </div>
            {error ? <div className="invalid-feedback d-block">{error}</div> : null}
        </fieldset>
    );
}

type IncidentFormValues = {
    operativeName: string;
    incidentDate: string;
    incidentType: string;
    location: string;
    reportedBy: string;
    description: string;
    partiesInvolved: string;
    injuriesOccurred: string;
    injuredParty: string;
    injuryDetails: string;
    reportedToManager: string;
    companyAdvised: string;
    companyNotifiedLater: string;
    companyReportDetails: string;
    witnessesPresent: string;
    witnessName: string;
    witnessContact: string;
    witnessAddress: string;
    otherWitnessDetails: string;
    confirmAccuracy: boolean;
};

export default function IncidentReportForm({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const role = useContext(AdminRoleContext);
    const [files, setFiles] = useState<File[]>([]);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<IncidentFormValues>({ mode: "onBlur" });

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

    async function onSubmit(data: IncidentFormValues) {
        const typeValues: Record<string, string> = {
            accident: "Accident",
            "customer-complaint": "Customer Complaint",
            "customer-engagement": "Customer Engagement",
            "environmental-incident": "Environmental",
            "near-miss": "Near Miss",
            "service-strike": "Service Strike",
        };
        const yesNo = (value: string) => value ? value.toLowerCase() === "yes" ? "Yes" : "No" : "";
        const body = new FormData();
        const fields: Record<string, string> = {
            operativesname: data.operativeName,
            arrival_datetime: data.incidentDate,
            type: typeValues[data.incidentType] ?? data.incidentType,
            location: data.location,
            reportedby: data.reportedBy,
            report: data.description,
            involved: data.partiesInvolved,
            anyoneinjured: yesNo(data.injuriesOccurred),
            whowasinjured: data.injuredParty,
            injuryreport: data.injuryDetails,
            reportit: yesNo(data.reportedToManager),
            advise: yesNo(data.companyAdvised),
            laterdate: yesNo(data.companyNotifiedLater),
            companydetails: data.companyReportDetails,
            witness: yesNo(data.witnessesPresent),
            witnessname: data.witnessName,
            witnessaddress: data.witnessAddress,
            witnesscontact: data.witnessContact,
            otherwitness: data.otherWitnessDetails,
        };
        Object.entries(fields).forEach(([name, value]) => body.append(name, value));
        files.forEach((file) => body.append("image", file));

        try {
            const endpoint = role === "employees" ? "/api/employee/incidents" : "/api/admin/incidents";
            const response = await fetchAdminApi(endpoint, { method: "POST", body });
            const result = await response.json().catch(() => null);
            if (!response.ok || result?.success === false) {
                throw new Error(result?.error?.message || `Report submission failed (${response.status}).`);
            }
            setSubmitMessage("Incident report submitted successfully.");
            reset();
            setFiles([]);
            setFileInputKey((current) => current + 1);
        } catch (error) {
            setSubmitMessage(error instanceof Error ? error.message : "Unable to submit the incident report.");
        }
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
                    {/* <span className="admin-eyebrow">Incident reporting</span> */}
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

                <form className="incident-form" onSubmit={handleSubmit(onSubmit)}>
                    <section className="incident-form-section" aria-labelledby="incident-details-heading">
                        <div className="incident-section-heading">
                            <h3 id="incident-details-heading">Operative &amp; location details</h3>
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="operative-name">Operatives name <span className="incident-required" aria-label="Required">*</span></label>
                                <input className={`form-control${errors.operativeName ? " is-invalid" : ""}`} id="operative-name" type="text" autoComplete="name" {...register("operativeName", { required: "Operatives name is required." })} />
                                {errors.operativeName && <div className="invalid-feedback d-block">{errors.operativeName.message}</div>}
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="incident-date">Date/time of incident <span className="incident-required" aria-label="Required">*</span></label>
                                <input className={`form-control${errors.incidentDate ? " is-invalid" : ""}`} id="incident-date" type="datetime-local" {...register("incidentDate", { required: "Date/time of incident is required." })} />
                                {errors.incidentDate && <div className="invalid-feedback d-block">{errors.incidentDate.message}</div>}
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
                                    register={register}
                                    errors={errors}
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="incident-location">Location of incident <span className="incident-required" aria-label="Required">*</span></label>
                                <input className={`form-control${errors.location ? " is-invalid" : ""}`} id="incident-location" type="text" {...register("location", { required: "Location of incident is required." })} />
                                {errors.location && <div className="invalid-feedback d-block">{errors.location.message}</div>}
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="reported-by">Reported by <span className="incident-required" aria-label="Required">*</span></label>
                                <input className={`form-control${errors.reportedBy ? " is-invalid" : ""}`} id="reported-by" type="text" autoComplete="name" {...register("reportedBy", { required: "Reported by is required." })} />
                                {errors.reportedBy && <div className="invalid-feedback d-block">{errors.reportedBy.message}</div>}
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="incident-description">What happened? <span className="incident-required" aria-label="Required">*</span></label>
                                <textarea className={`form-control${errors.description ? " is-invalid" : ""}`} id="incident-description" rows={4} {...register("description", { required: "Description is required." })} />
                                {errors.description && <div className="invalid-feedback d-block">{errors.description.message}</div>}
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="parties-involved">Details of all parties involved</label>
                                <textarea className="form-control" id="parties-involved" rows={3} placeholder="Include full names, insurance details, and other relevant information." {...register("partiesInvolved")} />
                            </div>
                        </div>
                    </section>

                    <section className="incident-form-section" aria-labelledby="injury-details-heading">
                        <div className="incident-section-heading">
                            <h3 id="injury-details-heading">Details of any injuries</h3>
                        </div>
                        <div className="row g-3">
                            <div className="col-12">
                                <RadioOptions name="injuriesOccurred" label="Was anyone injured?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} register={register} errors={errors} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="injured-party">Name of injured party</label>
                                <input className="form-control" id="injured-party" type="text" {...register("injuredParty")} />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="injury-details">Injuries (please give details)</label>
                                <textarea className="form-control" id="injury-details" rows={3} {...register("injuryDetails")} />
                            </div>
                        </div>
                    </section>

                    <section className="incident-form-section" aria-labelledby="reporting-details-heading">
                        <div className="incident-section-heading">
                            <h3 id="reporting-details-heading">Reporting of incident</h3>
                        </div>
                        <div className="row g-3">
                            <div className="col-12 col-md-4">
                                <RadioOptions name="reportedToManager" label="Did you report it to your manager?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} register={register} errors={errors} />
                            </div>
                            <div className="col-12 col-md-4">
                                <RadioOptions name="companyAdvised" label="Did you advise a company concerned?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} register={register} errors={errors} />
                            </div>
                            <div className="col-12 col-md-4">
                                <RadioOptions name="companyNotifiedLater" label="Was the company notified at a later date?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} register={register} errors={errors} />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="company-report-details">If yes, please advise details of company and name of individual reported to</label>
                                <textarea className="form-control" id="company-report-details" rows={3} {...register("companyReportDetails")} />
                            </div>
                        </div>
                    </section>

                    <section className="incident-form-section" aria-labelledby="witness-details-heading">
                        <div className="incident-section-heading">
                            <h3 id="witness-details-heading">Witness details</h3>
                        </div>
                        <div className="row g-3">
                            <div className="col-12">
                                <RadioOptions name="witnessesPresent" label="Were there any witnesses?" options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]} register={register} errors={errors} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="witness-name">Witness name</label>
                                <input className="form-control" id="witness-name" type="text" {...register("witnessName")} />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label" htmlFor="witness-contact">Witness contact number</label>
                                <input className="form-control" id="witness-contact" type="tel" autoComplete="tel" {...register("witnessContact")} />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="witness-address">Witness address</label>
                                <input className="form-control" id="witness-address" type="text" autoComplete="street-address" {...register("witnessAddress")} />
                            </div>
                            <div className="col-12">
                                <label className="form-label" htmlFor="other-witness-details">Other witnesses details</label>
                                <textarea className="form-control" id="other-witness-details" rows={3} {...register("otherWitnessDetails")} />
                            </div>
                        </div>
                    </section>

                    <section className="incident-form-section incident-upload-section" aria-labelledby="supporting-images-heading">
                        <div className="incident-section-heading">
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
                            key={fileInputKey}
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
                            <input
                                className={`form-check-input${errors.confirmAccuracy ? " is-invalid" : ""}`}
                                id="confirm-accuracy"
                                type="checkbox"
                                {...register("confirmAccuracy", { required: "You must confirm the accuracy of this report." })}
                            />
                            <label className="form-check-label" htmlFor="confirm-accuracy">
                                I confirm that all information entered above is true to the best of my knowledge.
                            </label>
                            {errors.confirmAccuracy && <div className="invalid-feedback d-block">{errors.confirmAccuracy.message}</div>}
                        </div>
                        <button className="btn btn-primary incident-submit-button" type="submit">Confirm report</button>
                        {submitMessage && <p className="incident-submit-message" role="status">{submitMessage}</p>}
                    </div>
                </form>
            </div>
        </section>
    );
}