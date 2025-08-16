import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

type Option = { value: string; label: string };

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  options: Option[];
  isPending: boolean;
  onConfirm: (value: string) => void;
}

export const BulkEditDialog = ({ open, onOpenChange, title, description, label, options, isPending, onConfirm }: BulkEditDialogProps) => {
  const [selectedValue, setSelectedValue] = useState<string>('');

  useEffect(() => {
    if (open) {
      setSelectedValue('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (selectedValue) {
      onConfirm(selectedValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="bulk-edit-select">{label}</Label>
          <Select value={selectedValue} onValueChange={setSelectedValue}>
            <SelectTrigger id="bulk-edit-select">
              <SelectValue placeholder={`Seleziona un valore...`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleConfirm} disabled={!selectedValue || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conferma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};