import { FiBookOpen, FiCalendar, FiClock, FiFileText, FiGlobe, FiShield, FiTruck, FiUsers } from "react-icons/fi";

export const employeesNavigation = [
    { label: "Report an Incident", href: "/admin/employees/report-an-incident", description: "Submit a new incident report.", icon: FiFileText },
    { label: "Team up Calender", href: "/admin/employees/team-up-calendar", description: "View the team calendar.", icon: FiCalendar },
    { label: "Vehicle Check Log", href: "/admin/employees/vehicle-checks", description: "Complete vehicle safety checks.", icon: FiTruck },
    { label: "Timesheets", href: "/admin/employees/timesheets", description: "View and submit weekly timesheets.", icon: FiClock },
    { label: "LTraffic Documents", href: "/admin/employees/documents", description: "Browse controlled LTraffic documents.", icon: FiBookOpen },
    { label: "Contact Directory", href: "/admin/employees", description: "View the employee contact directory.", icon: FiUsers },
    { label: "Wildanet Project", href: "/admin/employees/wildanet-project", description: "Open the Wildanet project workspace.", icon: FiGlobe },
    { label: "PIA & Fibre Risk Assessment", href: "/admin/employees/pia-fibre-risk-assessment", description: "Open the PIA and fibre risk assessment workspace.", icon: FiShield },
];
