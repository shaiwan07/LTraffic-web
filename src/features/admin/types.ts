export type AdminRecord = Record<string, string> & { id: string };

export type ListAdminRecordsParams = {
    workspace: string;
    query?: string;
    status?: string;
    page?: number;
    pageSize?: number;
};
