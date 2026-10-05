import {
    FiAlertCircle,
    FiBriefcase,
    FiCalendar,
    FiClock,
    FiFileText,
    FiMap,
    FiTruck,
    FiWifi,
} from "react-icons/fi";

export const adminNavigation = [
    {
        label: "Report an Incident",
        href: "/admin/report-an-incident",
        description: "Record and follow up on workplace or site incidents.",
        icon: FiAlertCircle,
    },
    {
        label: "Team up Calender",
        href: "/admin/team-up-calender",
        description: "Keep team schedules, events and project dates in one place.",
        icon: FiCalendar,
    },
    {
        label: "Vehicle Check Log",
        href: "/admin/vehicle-check-log",
        description: "Keep vehicle inspections and checks organised.",
        icon: FiTruck,
    },
    {
        label: "Timesheets",
        href: "/admin/timesheets",
        description: "Review and manage team timesheets.",
        icon: FiClock,
    },
    {
        label: "LTraffic Documents",
        href: "/admin/ltraffic-documents",
        description: "Access important LTraffic files and documents.",
        icon: FiFileText,
    },
    {
        label: "Contact Directory",
        href: "/admin/contact-directory",
        description: "Find useful team and project contacts.",
        icon: FiBriefcase,
    },
    {
        label: "Wildanet Project",
        href: "/admin/wildanet-project",
        description: "View information and resources for the Wildanet project.",
        icon: FiMap,
    },
    {
        label: "PIA & Fibre",
        href: "/admin/pia-and-fibre",
        description: "Access PIA and fibre project information.",
        icon: FiWifi,
    },
];

export const adminModules = adminNavigation;
