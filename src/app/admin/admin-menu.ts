import {
    FiAlertCircle,
    FiBriefcase,
    FiClipboard,
    FiClock,
    FiFileText,
    FiHardDrive,
    FiTruck,
    FiUsers,
} from "react-icons/fi";

export const adminNavigation = [
    {
        label: "Reported Incidents",
        href: "/admin/report-an-incident",
        description: "Review, investigate and close incident reports.",
        icon: FiAlertCircle,
    },
    {
        label: "Vehicle Checks",
        href: "/admin/vehicle-checks",
        description: "Review driver checks and vehicle safety actions.",
        icon: FiTruck,
    },
    {
        label: "Timesheets",
        href: "/admin/timesheets",
        description: "Review weekly hours and submitted timesheets.",
        icon: FiClock,
    },
    {
        label: "Bulletin Manager",
        href: "/admin/bulletin-manager",
        description: "Publish employee notices and track read confirmations.",
        icon: FiFileText,
    },
    {
        label: "HR Manager",
        href: "/admin/hr-manager",
        description: "Manage employee profiles and onboarding records.",
        icon: FiBriefcase,
    },
    {
        label: "Equipment Allocation",
        href: "/admin/equipment-allocation",
        description: "Manage equipment, vehicle and plant registers.",
        icon: FiHardDrive,
    },
    {
        label: "Document Control",
        href: "/admin/document-control",
        description: "Manage controlled policies, procedures and safety documents.",
        icon: FiFileText,
    },
    {
        label: "Site Inspections",
        href: "/admin/site-inspections",
        description: "Review live and completed site inspection results.",
        icon: FiClipboard,
    },
    {
        label: "Vehicle Inspections",
        href: "/admin/vehicle-inspections",
        description: "Review roadworthiness and vehicle inspection actions.",
        icon: FiTruck,
    },
    {
        label: "User Admin",
        href: "/admin/user-admin",
        description: "Manage portal accounts, access levels and onboarding.",
        icon: FiUsers,
    },
];

export const adminModules = adminNavigation;
