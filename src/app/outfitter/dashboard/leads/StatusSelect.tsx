'use client';

import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInquiryStatus } from '@/app/actions/inquiries';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Status = 'new' | 'responded' | 'booked' | 'archived';

interface StatusSelectProps {
  inquiryId: string;
  currentStatus: Status;
}

const statusConfig: Record<Status, { label: string; color: string }> = {
    new: { label: 'New', color: 'bg-blue-500' },
    responded: { label: 'Responded', color: 'bg-yellow-500' },
    booked: { label: 'Booked', color: 'bg-green-500' },
    archived: { label: 'Archived', color: 'bg-gray-500' },
};

export default function StatusSelect({ inquiryId, currentStatus }: StatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleStatusChange = (newStatus: Status) => {
    startTransition(async () => {
      const result = await updateInquiryStatus(inquiryId, newStatus);
      if (result.success) {
        toast({ title: "Status Updated", description: "The inquiry status has been changed." });
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: result.error });
      }
    });
  };

  return (
    <Select
      defaultValue={currentStatus}
      onValueChange={(value: Status) => handleStatusChange(value)}
      disabled={isPending}
    >
      <SelectTrigger className={cn("w-[150px]", isPending && "opacity-50 cursor-not-allowed")}>
        <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', statusConfig[currentStatus]?.color || 'bg-gray-500')}></span>
            <span>{statusConfig[currentStatus]?.label || currentStatus}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusConfig).map(([status, {label, color}]) => (
            <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', color)}></span>
                    <span>{label}</span>
                </div>
            </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
