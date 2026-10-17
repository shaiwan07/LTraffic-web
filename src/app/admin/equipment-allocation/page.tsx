import AdminSectionLanding from "../admin-section-landing";

export default function EquipmentAllocationPage() {
    return (
        <AdminSectionLanding
            title="Equipment Allocation"
            description="Choose a register to manage allocated equipment, vehicles and plant."
            items={[
                { title: "Equipment Register", description: "Assets, allocation, condition and calibration dates.", href: "/admin/equipment-allocation/equipment-register" },
                { title: "Vehicle Register", description: "Registrations, assignments, MOT, tax and service expiry.", href: "/admin/equipment-allocation/vehicle-register" },
                { title: "Plant Register", description: "Plant assets, responsible teams and maintenance dates.", href: "/admin/equipment-allocation/plant-register" },
            ]}
        />
    );
}