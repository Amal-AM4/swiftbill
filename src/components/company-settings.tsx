
"use client"

import type { CompanyInfo } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { saveCompanyInfo } from '@/lib/storage';

interface CompanySettingsProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  companyInfo: CompanyInfo;
  onCompanyInfoUpdate: () => void;
}

const initialCompanyInfo: CompanyInfo = { 
    name: '', 
    logo: '',
    gstin: '', 
    address: '',
    contact: '',
    email: '',
    website: '',
    upiId: '',
    authorizedSignatory: { name: 'Amal A M', designation: '' },
    signature: '',
};

export default function CompanySettings({ isOpen, setIsOpen, companyInfo, onCompanyInfoUpdate }: CompanySettingsProps) {
  const [localInfo, setLocalInfo] = useState<CompanyInfo>(companyInfo);
  const { toast } = useToast();

  useEffect(() => {
    // When the dialog opens, sync the local state with the most recent prop
    if (isOpen) {
        setLocalInfo(prev => ({
            ...initialCompanyInfo,
            ...companyInfo,
            authorizedSignatory: {
                ...initialCompanyInfo.authorizedSignatory,
                ...(companyInfo?.authorizedSignatory || {}),
            }
        }));
    }
  }, [companyInfo, isOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a valid image file.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalInfo({ ...localInfo, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      await saveCompanyInfo(localInfo);
      onCompanyInfoUpdate(); // Trigger a refetch in the parent component
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Company information updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save company information.",
      });
      console.error("Failed to save company info", error);
    }
  };

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setLocalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatoryChange = (field: keyof CompanyInfo['authorizedSignatory'], value: string) => {
      setLocalInfo(prev => ({
          ...prev,
          authorizedSignatory: {
              ...(prev.authorizedSignatory || {name: '', designation: ''}), // Ensure authorizedSignatory is not null
              [field]: value
          }
      }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Company Settings</DialogTitle>
          <DialogDescription>
            Update your company information here. This will appear on all your documents.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="companyName" className="text-right">Name</Label>
            <Input id="companyName" value={localInfo.name} onChange={e => handleChange('name', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="logo" className="text-right pt-2">Logo</Label>
            <div className="col-span-3 space-y-2">
              <Input id="logo" type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="h-auto" />
              {localInfo.logo && (
                <div className="relative w-32 h-16 border rounded-md">
                   <Image src={localInfo.logo} alt="Logo Preview" layout="fill" objectFit="contain" />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gstin" className="text-right">GSTIN</Label>
            <Input id="gstin" value={localInfo.gstin || ''} onChange={e => handleChange('gstin', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="address" className="text-right">Address</Label>
            <Textarea id="address" value={localInfo.address || ''} onChange={e => handleChange('address', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">Phone</Label>
            <Input id="contact" value={localInfo.contact || ''} onChange={e => handleChange('contact', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={localInfo.email || ''} onChange={e => handleChange('email', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="website" className="text-right">Website</Label>
            <Input id="website" value={localInfo.website || ''} onChange={e => handleChange('website', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="upiId" className="text-right">UPI ID</Label>
            <Input id="upiId" value={localInfo.upiId || ''} onChange={e => handleChange('upiId', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Authorized Signatory</Label>
            <div className="col-span-3 space-y-2">
                 <Input placeholder="Name" value={localInfo.authorizedSignatory?.name || ''} onChange={e => handleSignatoryChange('name', e.target.value)} />
                 <Input placeholder="Designation" value={localInfo.authorizedSignatory?.designation || ''} onChange={e => handleSignatoryChange('designation', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="signature" className="text-right pt-2">Signature</Label>
            <div className="col-span-3 space-y-2">
              <Input id="signature" type="file" accept="image/png" onChange={(e) => handleFileUpload(e, 'signature')} className="h-auto" />
              {localInfo.signature && (
                <div className="relative w-32 h-16 border rounded-md">
                   <Image src={localInfo.signature} alt="Signature Preview" layout="fill" objectFit="contain" />
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
