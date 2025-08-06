
"use client";

import type { CompanyInfo, Quotation, Invoice } from './types';

type RecordType = (Quotation & { type: 'Quotation' }) | (Invoice & { type: string });

// --- Company Info ---

export const getCompanyInfo = async (): Promise<CompanyInfo | null> => {
    if (typeof window === 'undefined') return null;
    try {
        const response = await fetch('/api/company-info');
        if (!response.ok) {
            throw new Error(`Failed to fetch company info: ${response.statusText}`);
        }
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching company info from API`, error);
        return null;
    }
};

export const saveCompanyInfo = async (info: CompanyInfo) => {
    try {
        const response = await fetch('/api/company-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(info),
        });

        if (!response.ok) {
            throw new Error(`Failed to save company info: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Error saving company info via API`, error);
        throw error;
    }
};


// --- Saved Records ---

export const getSavedRecords = async (): Promise<any[]> => {
    if (typeof window === 'undefined') return [];
    try {
        const response = await fetch('/api/records');
        if (!response.ok) {
            throw new Error(`Failed to fetch records: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching records from API`, error);
        return [];
    }
};

export const saveRecord = async (record: RecordType) => {
    try {
        const response = await fetch('/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to save record: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Error saving record via API`, error);
        throw error;
    }
};
